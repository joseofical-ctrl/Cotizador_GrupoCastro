// src/utils/apiService.js
/**
 * ==============================================================================
 * SERVICIO CLIENTE DE DATOS Y AUTENTICACIÓN - GRUPO CASTRO
 * Soporta Modo Dual: Nube (Hetzner Webhosting con MySQL) / Local (Desarrollo/Offline)
 * ==============================================================================
 */

const rawBase = import.meta.env.BASE_URL || '/';
const baseUrl = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
export const API_URL = `${baseUrl}api/index.php`;

const CLAVE_SESION = 'sesionGrupoCastro';
const CLAVE_HISTORIAL = 'historialCotizaciones';

// Credenciales de acceso de emergencia para desarrollo local / offline
const CREDENCIALES_LOCAL = {
  user: 'admin',
  pass: 'castro2026',
  nombre: 'Administrador Grupo Castro'
};

/**
 * Lee el historial directamente desde localStorage de forma segura
 */
export function leerHistorialLocal() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CLAVE_HISTORIAL);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error leyendo historial local:", e);
    return [];
  }
}

/**
 * Guarda el historial en localStorage
 */
function guardarHistorialLocal(lista) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(lista));
  } catch (e) {
    console.error("Error escribiendo historial local:", e);
  }
}

/**
 * Obtiene la sesión guardada actualmente
 */
export function obtenerSesionActual() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CLAVE_SESION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Cierra la sesión activa
 */
export function cerrarSesion() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CLAVE_SESION);
}

/**
 * Inicia sesión intentando conectar al backend Hetzner (api/index.php?action=login).
 * Si estamos en desarrollo local (localhost sin PHP) o el servidor aún no tiene MySQL configurado,
 * realiza fallback automático al Modo Local si las credenciales coinciden con admin / castro2026.
 */
export async function iniciarSesion(username, password) {
  const usuarioLimpio = String(username || '').trim();
  const passwordLimpia = String(password || '').trim();

  if (!usuarioLimpio || !passwordLimpia) {
    return { ok: false, error: 'Por favor ingrese usuario y contraseña' };
  }

  let respuestaRemota = null;
  let errorRedOInaccesible = false;

  try {
    const res = await fetch(`${API_URL}?action=login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: usuarioLimpio,
        password: passwordLimpia
      })
    });

    // Si el servidor devolvió JSON (éxito o 401 con JSON)
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.ok) {
        respuestaRemota = data;
      } else if (res.status === 401) {
        // Credenciales rechazadas explícitamente por la base de datos de Hetzner
        return { ok: false, error: data.error || 'Usuario o contraseña incorrectos' };
      } else {
        errorRedOInaccesible = true;
      }
    } else {
      // Devolvió HTML (p. ej. 404 de Vite dev server o error de Apache)
      errorRedOInaccesible = true;
    }
  } catch (err) {
    // Error de red, localhost sin backend PHP, etc.
    errorRedOInaccesible = true;
  }

  // Caso 1: Inicio exitoso en la Nube (Hetzner BD)
  if (respuestaRemota && respuestaRemota.ok) {
    const sesion = {
      token: respuestaRemota.token,
      usuario: respuestaRemota.usuario,
      modo: 'Nube (Hetzner)',
      conectadoRemoto: true,
      fechaLogin: new Date().toISOString()
    };
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    return { ok: true, sesion, modo: 'Nube (Hetzner)' };
  }

  // Caso 2: Fallback a Modo Local (localhost o API Hetzner aún no configurada)
  if (errorRedOInaccesible) {
    const esAdminLocal =
      usuarioLimpio.toLowerCase() === CREDENCIALES_LOCAL.user &&
      passwordLimpia === CREDENCIALES_LOCAL.pass;

    if (esAdminLocal) {
      const sesionLocal = {
        token: 'local-fallback-token',
        usuario: {
          id: 1,
          username: CREDENCIALES_LOCAL.user,
          nombre: CREDENCIALES_LOCAL.nombre
        },
        modo: 'Modo Local',
        conectadoRemoto: false,
        fechaLogin: new Date().toISOString()
      };
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesionLocal));
      return {
        ok: true,
        sesion: sesionLocal,
        modo: 'Modo Local',
        aviso: 'Acceso en Modo Local (desconectado de Hetzner)'
      };
    }

    return {
      ok: false,
      error: 'No se pudo conectar a la base de datos de Hetzner. Para modo local use: admin / castro2026'
    };
  }

  return { ok: false, error: 'Credenciales inválidas' };
}

/**
 * Obtiene todas las cotizaciones.
 * Si la API de Hetzner responde, actualiza la copia en localStorage y retorna los datos remotos.
 * Si falla o está en modo local, lee de localStorage.
 */
export async function obtenerCotizaciones() {
  const localItems = leerHistorialLocal();
  const sesion = obtenerSesionActual();

  // Si no hay sesión o es token local offline, retornar directo lo guardado en navegador
  if (!sesion || !sesion.token || sesion.token === 'local-fallback-token') {
    return localItems;
  }

  try {
    const res = await fetch(`${API_URL}?action=listar`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${sesion.token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.ok && Array.isArray(data.cotizaciones)) {
        // Sincronizar copia en localStorage para disponibilidad offline
        guardarHistorialLocal(data.cotizaciones);
        return data.cotizaciones;
      }
    }
  } catch (err) {
    console.warn("No se pudo sincronizar con Hetzner, usando caché local:", err);
  }

  return localItems;
}

/**
 * Guarda o actualiza una cotización:
 * 1. La guarda inmediatamente en localStorage.
 * 2. Si hay conexión y sesión con Hetzner, la envía a la base de datos remota.
 */
export async function guardarCotizacion(cotizacion, esEdicion = false) {
  if (!cotizacion || !cotizacion.id) {
    return { exito: false, error: 'Cotización inválida' };
  }

  // 1. Guardar en almacenamiento local
  const historial = leerHistorialLocal();
  const existe = esEdicion && historial.some(c => String(c.id) === String(cotizacion.id));
  const nuevoHistorial = existe
    ? historial.map(c => (String(c.id) === String(cotizacion.id) ? cotizacion : c))
    : [cotizacion, ...historial].slice(0, 100);

  guardarHistorialLocal(nuevoHistorial);

  // 2. Si hay sesión con Hetzner, sincronizar a la Base de Datos
  const sesion = obtenerSesionActual();
  if (sesion && sesion.token && sesion.token !== 'local-fallback-token') {
    try {
      const res = await fetch(`${API_URL}?action=guardar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sesion.token}`
        },
        body: JSON.stringify(cotizacion)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          return { exito: true, remoto: true, mensaje: 'Guardado en la Nube Hetzner y Local' };
        }
      }
    } catch (err) {
      console.warn("Fallo guardado remoto en Hetzner, preservado en local:", err);
    }
  }

  return { exito: true, remoto: false, mensaje: 'Guardado localmente' };
}

/**
 * Elimina una cotización individual de localStorage y de la BD remota
 */
export async function eliminarCotizacion(id) {
  // 1. Eliminar localmente
  const historial = leerHistorialLocal();
  const nuevo = historial.filter(c => String(c.id) !== String(id));
  guardarHistorialLocal(nuevo);

  // 2. Eliminar remotamente
  const sesion = obtenerSesionActual();
  if (sesion && sesion.token && sesion.token !== 'local-fallback-token') {
    try {
      await fetch(`${API_URL}?action=eliminar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sesion.token}`
        },
        body: JSON.stringify({ id })
      });
    } catch (err) {
      console.warn("Error al eliminar cotización en Hetzner:", err);
    }
  }

  return { exito: true };
}

/**
 * Borra todas las cotizaciones de localStorage y de la BD remota
 */
export async function limpiarTodasCotizaciones() {
  // 1. Limpiar local
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CLAVE_HISTORIAL);
  }

  // 2. Limpiar remotamente
  const sesion = obtenerSesionActual();
  if (sesion && sesion.token && sesion.token !== 'local-fallback-token') {
    try {
      await fetch(`${API_URL}?action=eliminar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sesion.token}`
        },
        body: JSON.stringify({ todos: true })
      });
    } catch (err) {
      console.warn("Error al limpiar registros en Hetzner:", err);
    }
  }

  return { exito: true };
}
