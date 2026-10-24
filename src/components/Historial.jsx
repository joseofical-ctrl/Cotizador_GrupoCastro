import { useState, useEffect } from 'preact/hooks';
import {
  obtenerCotizaciones,
  eliminarCotizacion,
  limpiarTodasCotizaciones
} from '../utils/apiService.js';

export default function Historial({ onEditar, refreshTrigger }) {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const cotizaciones = await obtenerCotizaciones();
      setHistorial(cotizaciones || []);
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [refreshTrigger]);

  const eliminarHistorial = async () => {
    if (confirm("¿Seguro que deseas borrar TODOS los registros (de la Base de Datos y Local)?")) {
      setCargando(true);
      try {
        await limpiarTodasCotizaciones();
        setHistorial([]);
      } catch (err) {
        console.error("Error al eliminar todas las cotizaciones:", err);
      } finally {
        setCargando(false);
      }
    }
  };

  const eliminarIndividual = async (id, nombreCliente) => {
    const nombreMostrar = nombreCliente || 'este cliente';
    if (confirm(`¿Deseas eliminar la proforma de ${nombreMostrar}?`)) {
      setCargando(true);
      try {
        await eliminarCotizacion(id);
        setHistorial(prev => prev.filter(cot => String(cot.id) !== String(id)));
      } catch (err) {
        console.error("Error al eliminar cotización:", err);
      } finally {
        setCargando(false);
      }
    }
  };

  if (historial.length === 0 && !cargando) return null;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mt-8 sm:mt-12 transition-all text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h2 className="text-lg sm:text-xl font-black text-slate-800 uppercase tracking-tight">
            Registro de Cotizaciones
          </h2>
          {cargando && (
            <span className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-bold animate-pulse">
              <span className="animate-spin text-sm">⏳</span> Sincronizando BD...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={cargarDatos}
            disabled={cargando}
            title="Recargar desde la base de datos"
            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-full transition-all uppercase flex items-center gap-1 cursor-pointer"
          >
            🔄 Actualizar
          </button>
          {historial.length > 0 && (
            <button
              type="button"
              onClick={eliminarHistorial}
              disabled={cargando}
              className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-full transition-all uppercase cursor-pointer"
            >
              Limpiar Todo
            </button>
          )}
        </div>
      </div>

      {/* VISTA MÓVIL: Tarjetas en Celulares (< md) */}
      <div className="divide-y divide-slate-100 md:hidden">
        {historial.map((cot) => (
          <div key={cot.id} className="py-4 space-y-3">
            {/* Arriba: Cliente y Fecha */}
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-slate-800 uppercase text-sm leading-tight text-left">
                {cot?.cliente?.nombre || 'Sin nombre'}
              </h3>
              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                {cot.fecha}
              </span>
            </div>

            {/* Medio: Items y Total (+ descuento) */}
            <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                📦 {cot.items ? cot.items.length : 0} {cot.items?.length === 1 ? 'equipo' : 'equipos'}
              </span>
              <div className="text-right">
                <div className="text-base font-black text-red-600 font-mono">
                  S/ {cot.total}
                </div>
                {Number(cot.descuento || 0) > 0 && (
                  <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    Desc: -S/ {Number(cot.descuento).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Abajo: Dos botones táctiles de ancho completo */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onEditar(cot)}
                className="w-full py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs rounded-xl transition-all uppercase flex items-center justify-center gap-1 active:scale-95 shadow-2xs cursor-pointer"
              >
                <span>✏️</span> Editar
              </button>
              <button
                type="button"
                onClick={() => eliminarIndividual(cot.id, cot?.cliente?.nombre)}
                className="w-full py-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold text-xs rounded-xl transition-all uppercase flex items-center justify-center gap-1 active:scale-95 shadow-2xs cursor-pointer"
              >
                <span>🗑️</span> Borrar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* VISTA PC: Tabla completa (>= md) */}
      <div className="overflow-x-auto hidden md:block">
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
                  {cot?.cliente?.nombre || 'Sin nombre'}
                </td>
                <td className="py-4 text-center text-slate-500">{cot.items ? cot.items.length : 0}</td>
                <td className="py-4 text-right font-black text-red-600 italic">
                  <div>S/ {cot.total}</div>
                  {Number(cot.descuento || 0) > 0 && (
                    <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mt-0.5 not-italic">
                      Desc: -S/ {Number(cot.descuento).toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="py-4 text-right flex justify-end gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => onEditar(cot)}
                    className="bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 text-[10px] font-bold px-3 py-1 rounded-md transition-all uppercase shadow-sm cursor-pointer"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarIndividual(cot.id, cot?.cliente?.nombre)}
                    className="bg-red-50 hover:bg-red-600 hover:text-white text-red-500 text-[10px] font-bold px-3 py-1 rounded-md transition-all uppercase shadow-sm cursor-pointer"
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