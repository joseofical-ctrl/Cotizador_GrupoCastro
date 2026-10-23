// src/utils/fileSystem.js
const DB_NAME = 'GrupoCastroFS';
const STORE_NAME = 'handles';
const KEY = 'carpetaCotizaciones';

function abrirDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            e.target.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

export function soportaGuardadoDirecto() {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function obtenerCarpetaGuardada() {
    if (!soportaGuardadoDirecto()) return null;
    try {
        const db = await abrirDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get(KEY);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
}

export async function seleccionarCarpetaDestino() {
    if (!soportaGuardadoDirecto()) {
        alert("Tu navegador tiene desactivado el acceso a carpetas locales. Si usas Brave, actívalo en brave://flags/#file-system-access-api o usa Google Chrome / Microsoft Edge.");
        return null;
    }
    try {
        const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        const db = await abrirDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(dirHandle, KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        return dirHandle;
    } catch (err) {
        // Si el usuario cierra el selector sin elegir, ignoramos el error
        if (err.name !== 'AbortError') {
            console.error("Error al seleccionar carpeta:", err);
        }
        return null;
    }
}

export async function desvincularCarpeta() {
    try {
        const db = await abrirDB();
        await new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(KEY);
            tx.oncomplete = () => resolve();
        });
    } catch (err) {
        console.error("Error al desvincular carpeta:", err);
    }
}

export async function guardarPDFEnCarpeta(dirHandle, nombreArchivo, pdfBlob) {
    if (!dirHandle) return { exito: false };

    try {
        // Verificamos si el permiso sigue activo o si requiere reactivación de 1 clic tras reiniciar la PC
        const opciones = { mode: 'readwrite' };
        if ((await dirHandle.queryPermission(opciones)) !== 'granted') {
            if ((await dirHandle.requestPermission(opciones)) !== 'granted') {
                return { exito: false, motivo: 'permiso_denegado' };
            }
        }

        const fileHandle = await dirHandle.getFileHandle(nombreArchivo, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(pdfBlob);
        await writable.close();

        return { exito: true, carpeta: dirHandle.name };
    } catch (err) {
        console.error("Error al guardar PDF en carpeta:", err);
        return { exito: false, error: err };
    }
}