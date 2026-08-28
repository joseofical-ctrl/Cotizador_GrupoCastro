import { useState } from 'preact/hooks';
import PDFPreview from './pdf.jsx'; 
import Historial from './Historial.jsx';

export default function Cotizador() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [cliente, setCliente] = useState({ nombre: '', telefono: '', direccion: '' });
  const [cotizacionId, setCotizacionId] = useState(null);
  
  // NUEVO ESTADO: Rastrea si estamos editando un producto de la lista
  const [editandoProductoId, setEditandoProductoId] = useState(null);

  const [formData, setFormData] = useState({ 
    marca: '', 
    modelo: '', 
    detalle: '', 
    precioUnitario: '', 
    cantidad: 1 
  });

  const formatearMoneda = (cantidad) => {
    return Number(cantidad).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const manejarEdicion = (cot) => {
    if (!cot || !cot.cliente || !cot.items) return alert("Formato no compatible.");
    if (confirm(`¿Cargar proforma de ${cot.cliente.nombre}?`)) {
      setCliente({...cot.cliente});
      setItems([...cot.items]);
      setCotizacionId(cot.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // FUNCIÓN 1: Solo cierra el modal (Para el botón VOLVER)
  const cerrarModal = () => {
    setShowModal(false);
  };

  // FUNCIÓN 2: Limpia todo (Para cuando se DESCARGA con éxito)
  const finalizarProceso = () => {
    setShowModal(false);
    setItems([]);
    setCliente({ nombre: '', telefono: '', direccion: '' });
    setCotizacionId(null);
    setEditandoProductoId(null);
    setFormData({ marca: '', modelo: '', detalle: '', precioUnitario: '', cantidad: 1 });
  };

  const limpiarFormulario = () => {
    if (confirm("¿Deseas limpiar todo para una nueva proforma?")) {
      setItems([]);
      setCliente({ nombre: '', telefono: '', direccion: '' });
      setCotizacionId(null);
      setEditandoProductoId(null);
    }
  };

  // NUEVA FUNCIÓN: Sube los datos del producto al formulario
  const cargarProductoParaEdicion = (item) => {
    setFormData({
      marca: item.marca,
      modelo: item.modelo,
      detalle: item.detalle || '',
      precioUnitario: item.precioUnitario,
      cantidad: item.cantidad
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
    if (!formData.marca || isNaN(precio) || precio <= 0) return alert("Datos de producto inválidos.");

    if (editandoProductoId) {
      // MODIFICAR PRODUCTO EXISTENTE
      setItems(items.map(item => 
        item.id === editandoProductoId 
        ? { ...item, ...formData, precioUnitario: precio, cantidad: parseInt(formData.cantidad), precioTotalFila: precio * parseInt(formData.cantidad) } 
        : item
      ));
      setEditandoProductoId(null); // Salimos del modo edición
    } else {
      // AGREGAR PRODUCTO NUEVO
      setItems([...items, {
        id: Date.now(),
        ...formData,
        precioUnitario: precio,
        cantidad: parseInt(formData.cantidad),
        precioTotalFila: precio * parseInt(formData.cantidad)
      }]);
    }
    
    setFormData({ marca: '', modelo: '', detalle: '', precioUnitario: '', cantidad: 1 });
  };

  const totalGeneral = items.reduce((acc, item) => acc + item.precioTotalFila, 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 text-slate-900 font-sans">
      
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
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Datos del Cliente</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Nombre o Razón Social" value={cliente.nombre} onInput={(e) => setCliente({...cliente, nombre: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-red-200 transition-all" />
              <input type="tel" placeholder="Número de celular" value={cliente.telefono} onInput={(e) => setCliente({...cliente, telefono: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-red-200 transition-all" />
              <textarea placeholder="Dirección para la instalación" value={cliente.direccion} onInput={(e) => setCliente({...cliente, direccion: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-red-200 h-20 resize-none"></textarea>
            </div>
          </section>

          {/* Formulario Dinámico (Cambia de color si estás editando) */}
          <form onSubmit={agregarProducto} className={`bg-white p-6 rounded-2xl shadow-md border-t-8 space-y-4 transition-colors ${editandoProductoId ? 'border-orange-500' : 'border-red-600'}`}>
            <div className="flex justify-between items-center mb-2">
              <h2 className={`text-xs font-bold uppercase tracking-widest ${editandoProductoId ? 'text-orange-500' : 'text-red-600'}`}>
                {editandoProductoId ? 'Editando Equipo' : 'Detalle de Equipos'}
              </h2>
              {editandoProductoId && (
                <button type="button" onClick={() => {setEditandoProductoId(null); setFormData({ marca: '', modelo: '', detalle: '', precioUnitario: '', cantidad: 1 })}} className="text-[10px] text-slate-400 hover:text-slate-700 font-bold uppercase">
                  Cancelar Edición
                </button>
              )}
            </div>
            
            <input type="text" placeholder="Descripción del producto" value={formData.marca} onInput={(e) => setFormData({...formData, marca: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-red-500" />
            <input type="text" placeholder="Modelo" value={formData.modelo} onInput={(e) => setFormData({...formData, modelo: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-red-500" />
            <textarea placeholder="Características técnicas (Opcional)" value={formData.detalle} onInput={(e) => setFormData({...formData, detalle: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-red-500 h-24 resize-none text-sm"></textarea>
            
            <div className="grid grid-cols-2 gap-4">
              <input type="number" step="0.01" placeholder="P. Unit." value={formData.precioUnitario} onInput={(e) => setFormData({...formData, precioUnitario: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-red-500 font-mono" />
              <input type="number" min="1" value={formData.cantidad} onInput={(e) => setFormData({...formData, cantidad: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-red-500 font-bold" />
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
                          <button onClick={() => cargarProductoParaEdicion(item)} className="text-slate-400 hover:text-orange-500 font-bold uppercase transition-colors">Editar</button>
                          <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500 font-bold uppercase transition-colors">Quitar</button>
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
              onClick={() => setShowModal(true)} 
              className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-white ${cotizacionId ? 'bg-blue-600' : 'bg-slate-900'}`}
            >
              {cotizacionId ? "ACTUALIZAR REGISTRO" : "GENERAR PROFORMA PDF"}
            </button>
          )}
        </div>
      </div>

      <Historial onEditar={manejarEdicion} refreshTrigger={showModal} />

      {/* Pasamos ambas funciones al preview para separar las acciones */}
      {showModal && (
        <PDFPreview 
          items={items} 
          cliente={cliente} 
          total={totalGeneral} 
          editId={cotizacionId} 
          onVolver={cerrarModal}
          onDescargar={finalizarProceso} 
        />
      )}
    </div>
  );
}