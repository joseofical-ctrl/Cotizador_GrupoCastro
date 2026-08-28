import { useState, useEffect } from 'preact/hooks';

export default function Historial({ onEditar, refreshTrigger }) {
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    const datosGuardados = JSON.parse(localStorage.getItem('historialCotizaciones') || '[]');
    setHistorial(datosGuardados);
  }, [refreshTrigger]);

  const eliminarHistorial = () => {
    if (confirm("¿Seguro que deseas borrar TODOS los registros?")) {
      localStorage.removeItem('historialCotizaciones');
      setHistorial([]);
    }
  };

  // NUEVA FUNCIÓN: ELIMINAR REGISTRO INDIVIDUAL
  const eliminarIndividual = (id, nombreCliente) => {
    if (confirm(`¿Deseas eliminar la proforma de ${nombreCliente}?`)) {
      const historialActual = JSON.parse(localStorage.getItem('historialCotizaciones') || '[]');
      const nuevoHistorial = historialActual.filter(cot => cot.id !== id);
      
      localStorage.setItem('historialCotizaciones', JSON.stringify(nuevoHistorial));
      setHistorial(nuevoHistorial);
    }
  };

  if (historial.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Registro de Cotizaciones</h2>
        <button 
          onClick={eliminarHistorial} 
          className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-4 py-2 rounded-full transition-all uppercase"
        >
          Limpiar Todo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">
              <th className="py-3">Fecha</th>
              <th className="py-3">Cliente</th>
              <th className="py-3 text-center">Items</th>
              <th className="py-3 text-right">Total</th>
              <th className="py-3 text-right w-40">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {historial.map((cot) => (
              <tr key={cot.id} className="group hover:bg-slate-50 transition-all">
                <td className="py-4 text-xs text-slate-500">{cot.fecha}</td>
                <td className="py-4 font-bold text-slate-700 uppercase">
                  {cot.cliente && cot.cliente.nombre ? cot.cliente.nombre : 'Sin nombre'}
                </td>
                <td className="py-4 text-center text-slate-500">{cot.items ? cot.items.length : 0}</td>
                <td className="py-4 text-right font-black text-red-600 italic">S/ {cot.total}</td>
                <td className="py-4 text-right flex justify-end gap-2 mt-1">
                  <button 
                    onClick={() => onEditar(cot)} 
                    className="bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 text-[10px] font-bold px-3 py-1 rounded-md transition-all uppercase shadow-sm"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => eliminarIndividual(cot.id, cot.cliente.nombre)} 
                    className="bg-red-50 hover:bg-red-600 hover:text-white text-red-500 text-[10px] font-bold px-3 py-1 rounded-md transition-all uppercase shadow-sm"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}