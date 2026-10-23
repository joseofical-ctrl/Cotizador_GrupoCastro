import { useState, useEffect } from 'preact/hooks';
import PDFPreview from './pdf.jsx';
import Historial from './Historial.jsx';
import {
  obtenerCarpetaGuardada,
  seleccionarCarpetaDestino,
  desvincularCarpeta
} from '../utils/fileSystem.js';

export default function Cotizador() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [cliente, setCliente] = useState({ nombre: '', telefono: '', direccion: '' });
  const [cotizacionId, setCotizacionId] = useState(null);
  const [editandoProductoId, setEditandoProductoId] = useState(null);
  const [historialVersion, setHistorialVersion] = useState(0);

  // ESTADOS PARA GUARDADO DIRECTO EN CARPETA
  const [dirHandle, setDirHandle] = useState(null);
  const [notificacion, setNotificacion] = useState(null);

  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    detalle: '',
    precioUnitario: '',
    cantidad: 1
  });

  useEffect(() => {
    obtenerCarpetaGuardada().then(handle => {
      if (handle) setDirHandle(handle);
    });
  }, []);

  const mostrarToast = (mensaje) => {
    setNotificacion(mensaje);
    setTimeout(() => setNotificacion(null), 4000);
  };

  const configurarCarpeta = async () => {
    const handle = await seleccionarCarpetaDestino();
    if (handle) {
      setDirHandle(handle);
      mostrarToast(`Carpeta vinculada: "${handle.name}". Tus PDFs se guardarán directo ahí.`);
    }
  };

  const quitarCarpeta = async () => {
    if (confirm("¿Deseas desvincular la carpeta de guardado directo y volver a la descarga normal?")) {
      await desvincularCarpeta();
      setDirHandle(null);
    }
  };

  const formatearMoneda = (cantidad) => {
    return Number(cantidad || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const manejarEdicion = (cot) => {
    if (!cot?.cliente || !Array.isArray(cot?.items)) {
      return alert("El formato de esta cotización no es compatible.");
    }
    if (confirm(`¿Cargar proforma de ${cot.cliente.nombre} para edición?`)) {
      setCliente({
        nombre: cot.cliente.nombre || '',
        telefono: cot.cliente.telefono || '',
        direccion: cot.cliente.direccion || ''
      });
      setItems([...cot.items]);
      setCotizacionId(cot.id);
      setEditandoProductoId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cerrarModal = () => {
    setShowModal(false);
  };

  const resetearTodo = () => {
    setItems([]);
    setCliente({ nombre: '', telefono: '', direccion: '' });
    setCotizacionId(null);
    setEditandoProductoId(null);
    setFormData({ marca: '', modelo: '', detalle: '', precioUnitario: '', cantidad: 1 });
  };

  const finalizarProceso = (mensajeGuardado) => {
    setShowModal(false);
    resetearTodo();
    setHistorialVersion(v => v + 1);
    if (mensajeGuardado) {
      mostrarToast(mensajeGuardado);
    }
  };

  const limpiarFormulario = () => {
    if (confirm("¿Deseas limpiar todos los campos para iniciar una nueva proforma?")) {
      resetearTodo();
    }
  };

  const cargarProductoParaEdicion = (item) => {
    setFormData({
      marca: item.marca || '',
      modelo: item.modelo || '',
      detalle: item.detalle || '',
      precioUnitario: item.precioUnitario || '',
      cantidad: item.cantidad || 1
    });
    setEditandoProductoId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const agregarProducto = (e) => {
    e.preventDefault();
    if (!cliente.nombre.trim() || !cliente.telefono.trim() || !cliente.direccion.trim()) {
      return alert("Completa los DATOS DEL CLIENTE primero.");
    }

    const precio = parseFloat(formData.precioUnitario);
    const cant = parseInt(formData.cantidad, 10);

    if (!formData.marca.trim() || isNaN(precio) || precio <= 0 || isNaN(cant) || cant < 1) {
      return alert("Verifica la descripción, el precio unitario y la cantidad del producto.");
    }

    const itemNormalizado = {
      marca: formData.marca.trim(),
      modelo: formData.modelo.trim(),
      detalle: formData.detalle.trim(),
      precioUnitario: precio,
      cantidad: cant,
      precioTotalFila: precio * cant
    };

    if (editandoProductoId) {
      setItems(items.map(item =>
        item.id === editandoProductoId
          ? { ...item, ...itemNormalizado }
          : item
      ));
      setEditandoProductoId(null);
    } else {
      setItems([...items, { id: Date.now(), ...itemNormalizado }]);
    }

    setFormData({ marca: '', modelo: '', detalle: '', precioUnitario: '', cantidad: 1 });
  };

  const totalGeneral = items.reduce((acc, item) => acc + (Number(item.precioTotalFila) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 text-slate-900 font-sans">

      {/* Notificación Flotante de Guardado Exitoso */}
      {notificacion && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm border-2 border-emerald-400">
          <span>✅</span>
          <span>{notificacion}</span>
        </div>
      )}

      <header className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 border-b-4 border-red-600 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded italic ${cotizacionId ? 'bg-blue-600' : 'bg-red-600'}`}>
              {cotizacionId ? "MODO EDICIÓN" : "SISTEMA OFICIAL"}
            </span>
            <h2 className="text-sm font-bold text-red-600 uppercase tracking-widest">GRUPO CASTRO</h2>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter uppercase">
            COTIZADOR DE PROFORMAS
          </h1>
          <p className="text-slate-500 text-sm font-bold italic mt-1 text-left">Huancayo - Junín</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {dirHandle ? (
            <div className="flex items-center bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 gap-2">
              <span className="text-[11px] font-bold text-emerald-800">
                📁 Autoguardado en: <strong className="uppercase">{dirHandle.name}</strong>
              </span>
              <button
                type="button"
                onClick={configurarCarpeta}
                className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg uppercase transition-colors"
              >
                Cambiar
              </button>
              <button
                type="button"
                onClick={quitarCarpeta}
                title="Desvincular carpeta"
                className="text-xs text-slate-400 hover:text-red-600 font-bold px-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={configurarCarpeta}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
            >
              <span>📁</span> Configurar Carpeta de Guardado Directo
            </button>
          )}

          {(items.length > 0 || cliente.nombre || cotizacionId) && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="text-xs font-bold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider"
            >
              {cotizacionId ? "Cancelar Edición / Nueva" : "Limpiar Todo"}
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Datos del Cliente</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Nombre o Razón Social" value={cliente.nombre} onInput={(e) => setCliente({ ...cliente, nombre: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-red-200 transition-all" />
              <input type="tel" placeholder="Número de celular" value={cliente.telefono} onInput={(e) => setCliente({ ...cliente, telefono: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-red-200 transition-all" />
              <textarea placeholder="Dirección para la instalación" value={cliente.direccion} onInput={(e) => setCliente({ ...cliente, direccion: e.target.value })} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-red-200 h-20 resize-none"></textarea>
            </div>
          </section>

          <form onSubmit={agregarProducto} className={`bg-white p-6 rounded-2xl shadow-md border-t-8 space-y-4 transition-colors ${editandoProductoId ? 'border-orange-500' : 'border-red-600'}`}>
            <div className="flex justify-between items-center mb-2">
              <h2 className={`text-xs font-bold uppercase tracking-widest ${editandoProductoId ? 'text-orange-500' : 'text-red-600'}`}>
                {editandoProductoId ? 'Editando Equipo' : 'Detalle de Equipos'}
              </h2>
              {editandoProductoId && (
                <button type="button" onClick={() => { setEditandoProductoId(null); setFormData({ marca: '', modelo: '', detalle: '', precioUnitario: '', cantidad: 1 }); }} className="text-[10px] text-slate-400 hover:text-slate-700 font-bold uppercase">
                  Cancelar Edición
                </button>
              )}
            </div>

            <input type="text" placeholder="Descripción del producto" value={formData.marca} onInput={(e) => setFormData({ ...formData, marca: e.target.value })} className="w-full p-3 border rounded-xl outline-none focus:border-red-500" />
            <input type="text" placeholder="Modelo" value={formData.modelo} onInput={(e) => setFormData({ ...formData, modelo: e.target.value })} className="w-full p-3 border rounded-xl outline-none focus:border-red-500" />
            <textarea placeholder="Características técnicas (Opcional)" value={formData.detalle} onInput={(e) => setFormData({ ...formData, detalle: e.target.value })} className="w-full p-3 border rounded-xl outline-none focus:border-red-500 h-24 resize-none text-sm"></textarea>

            <div className="grid grid-cols-2 gap-4">
              <input type="number" step="0.01" placeholder="P. Unit." value={formData.precioUnitario} onInput={(e) => setFormData({ ...formData, precioUnitario: e.target.value })} className="w-full p-3 border rounded-xl outline-none focus:border-red-500 font-mono" />
              <input type="number" min="1" value={formData.cantidad} onInput={(e) => setFormData({ ...formData, cantidad: e.target.value })} className="w-full p-3 border rounded-xl outline-none focus:border-red-500 font-bold" />
            </div>
            <button type="submit" className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 uppercase ${editandoProductoId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-600 hover:bg-red-700'}`}>
              {editandoProductoId ? 'Actualizar en la lista' : 'Añadir a la lista'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="flex-grow overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-800 text-white uppercase text-[10px] tracking-widest font-bold">
                    <th className="p-5">Descripción Equipo</th>
                    <th className="p-5 text-center">Cant.</th>
                    <th className="p-5 text-right">Subtotal</th>
                    <th className="p-5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {items.length === 0 ? (
                    <tr><td colSpan="4" className="p-20 text-center text-slate-300 italic text-sm">No hay productos en la lista...</td></tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className={`transition-colors ${editandoProductoId === item.id ? 'bg-orange-50/50' : 'hover:bg-red-50/30'}`}>
                        <td className="p-5 uppercase font-bold text-slate-800 max-w-[250px]">
                          {item.marca}
                          <span className="text-[11px] text-slate-500 block font-normal">{item.modelo}</span>
                          {item.detalle && (
                            <span className="text-[10px] text-slate-400 block font-normal italic mt-1 normal-case truncate" title={item.detalle}>
                              {item.detalle}
                            </span>
                          )}
                        </td>
                        <td className="p-5 text-center font-bold text-slate-600">{item.cantidad}</td>
                        <td className="p-5 text-right font-black text-red-600 font-mono whitespace-nowrap">
                          S/ {formatearMoneda(item.precioTotalFila)}
                        </td>
                        <td className="p-5 text-center text-xs space-x-3 whitespace-nowrap">
                          <button type="button" onClick={() => cargarProductoParaEdicion(item)} className="text-slate-400 hover:text-orange-500 font-bold uppercase transition-colors">Editar</button>
                          <button type="button" onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500 font-bold uppercase transition-colors">Quitar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-6 border-t-2 border-slate-200 flex justify-between items-center">
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block">Suma Total de Proforma</span>
                <span className="text-xs text-slate-500 italic uppercase font-bold tracking-tight">Válido por 5 días</span>
              </div>
              <div className="text-right">
                <span className="text-4xl font-black text-red-600 font-mono tracking-tighter whitespace-nowrap">
                  S/ {formatearMoneda(totalGeneral)}
                </span>
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-white ${cotizacionId ? 'bg-blue-600' : 'bg-slate-900'}`}
            >
              {cotizacionId ? "ACTUALIZAR REGISTRO" : "GENERAR PROFORMA PDF"}
            </button>
          )}
        </div>
      </div>

      <Historial onEditar={manejarEdicion} refreshTrigger={historialVersion} />

      {showModal && (
        <PDFPreview
          items={items}
          cliente={cliente}
          total={totalGeneral}
          editId={cotizacionId}
          dirHandle={dirHandle}
          onCambiarCarpeta={configurarCarpeta}
          onVolver={cerrarModal}
          onDescargar={finalizarProceso}
        />
      )}
    </div>
  );
}