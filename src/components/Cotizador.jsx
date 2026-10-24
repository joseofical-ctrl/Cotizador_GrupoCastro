import { useState, useEffect } from 'preact/hooks';
import PDFPreview from './pdf.jsx';
import Historial from './Historial.jsx';
import {
  obtenerCarpetaGuardada,
  seleccionarCarpetaDestino,
  desvincularCarpeta
} from '../utils/fileSystem.js';
import {
  obtenerSesionActual,
  iniciarSesion,
  cerrarSesion
} from '../utils/apiService.js';

export default function Cotizador() {
  const [sesion, setSesion] = useState(obtenerSesionActual());
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginCargando, setLoginCargando] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);

  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [cliente, setCliente] = useState({ nombre: '', telefono: '', direccion: '' });
  const [cotizacionId, setCotizacionId] = useState(null);
  const [editandoProductoId, setEditandoProductoId] = useState(null);
  const [historialVersion, setHistorialVersion] = useState(0);
  const [descuento, setDescuento] = useState('');

  // ESTADOS PARA GUARDADO DIRECTO EN CARPETA
  const [dirHandle, setDirHandle] = useState(null);
  const [notificacion, setNotificacion] = useState(null);

  const rawBase = import.meta.env.BASE_URL || '/';
  const baseUrl = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  const logoPrincipal = `${baseUrl}logo-grupocastro.jpg`;

  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    detalle: '',
    precioUnitario: '',
    cantidad: 1
  });

  useEffect(() => {
    // Verificar si existe sesión en localStorage al montar en cliente
    const sesionGuardada = obtenerSesionActual();
    if (sesionGuardada) setSesion(sesionGuardada);

    obtenerCarpetaGuardada().then(handle => {
      if (handle) setDirHandle(handle);
    });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginCargando(true);
    try {
      const res = await iniciarSesion(loginUser, loginPass);
      if (res.ok) {
        setSesion(res.sesion);
        if (res.aviso) {
          mostrarToast(res.aviso);
        } else {
          mostrarToast(`Bienvenido, ${res.sesion.usuario?.nombre || 'Administrador'}`);
        }
      } else {
        setLoginError(res.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setLoginError('Error inesperado: ' + err.message);
    } finally {
      setLoginCargando(false);
    }
  };

  const handleCerrarSesion = () => {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      cerrarSesion();
      setSesion(null);
      resetearTodo();
    }
  };

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
      setDescuento(cot.descuento ? String(cot.descuento) : '');
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
    setDescuento('');
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

  const subtotalGeneral = items.reduce((acc, item) => acc + (Number(item.precioTotalFila) || 0), 0);
  const montoDescuento = Math.min(Math.max(parseFloat(descuento) || 0, 0), subtotalGeneral);
  const totalGeneral = Math.max(subtotalGeneral - montoDescuento, 0);

  // Si no hay sesión activa, mostrar Pantalla de Login Corporativa de Grupo Castro
  if (!sesion) {
    return (
      <div className="max-w-md mx-auto my-8 p-4 font-sans text-slate-900">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left transition-all">
          {/* Barra roja superior */}
          <div className="h-3 bg-gradient-to-r from-red-600 via-red-500 to-red-700"></div>

          <div className="p-8 sm:p-10 space-y-6">
            {/* Logo y Encabezado */}
            <div className="text-center space-y-3">
              <img
                src={logoPrincipal}
                alt="Grupo Castro"
                className="h-16 mx-auto object-contain drop-shadow-sm"
              />
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full inline-block mb-1">
                  Acceso Corporativo
                </span>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                  Cotizador Proformas
                </h1>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Huancayo - Junín
                </p>
              </div>
            </div>

            {/* Alerta de Error */}
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-start gap-2 shadow-xs">
                <span className="text-base leading-none">⚠️</span>
                <span>{loginError}</span>
              </div>
            )}

            {/* Formulario de Login */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Usuario
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none text-sm">
                    👤
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Ingresa tu usuario"
                    value={loginUser}
                    onInput={(e) => setLoginUser(e.target.value)}
                    disabled={loginCargando}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none text-sm">
                    🔒
                  </span>
                  <input
                    type={mostrarPass ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={loginPass}
                    onInput={(e) => setLoginPass(e.target.value)}
                    disabled={loginCargando}
                    className="w-full pl-10 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPass(!mostrarPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    {mostrarPass ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginCargando}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loginCargando ? (
                  <>
                    <span className="animate-spin text-base">⏳</span>
                    <span>Verificando...</span>
                  </>
                ) : (
                  <span>Ingresar al Sistema</span>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Sistema privado de uso exclusivo — Grupo Castro
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          {/* Indicador de Estado de Conexión y Usuario */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${
                sesion.modo === 'Nube (Hetzner)'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  sesion.modo === 'Nube (Hetzner)' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              ></span>
              {sesion.modo === 'Nube (Hetzner)' ? '☁️ Conectado BD' : '💻 Modo Local'}
            </span>
            <span className="text-xs font-bold text-slate-700 hidden sm:inline">
              👤 {sesion.usuario?.nombre || sesion.usuario?.username || 'Admin'}
            </span>
            <button
              type="button"
              onClick={handleCerrarSesion}
              className="text-[11px] font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 px-2.5 py-1 rounded-lg transition-all uppercase cursor-pointer"
              title="Cerrar Sesión"
            >
              Cerrar Sesión
            </button>
          </div>

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
              className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
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

            <div className="bg-slate-50 p-6 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-left space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block">Suma Total de Proforma</span>
                  <span className="text-xs text-slate-500 italic uppercase font-bold tracking-tight">Válido por 5 días</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <label htmlFor="input-descuento" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Descuento (S/):
                  </label>
                  <input
                    id="input-descuento"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={descuento}
                    onInput={(e) => setDescuento(e.target.value)}
                    className="w-28 py-1.5 px-3 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-200 font-mono text-right font-bold text-slate-800 shadow-sm"
                  />
                </div>
              </div>
              <div className="text-right flex flex-col items-end self-end sm:self-center">
                {montoDescuento > 0 && (
                  <div className="space-y-0.5 mb-1 text-xs font-mono font-bold">
                    <div className="text-slate-500">
                      Subtotal: S/ {formatearMoneda(subtotalGeneral)}
                    </div>
                    <div className="text-emerald-600">
                      Descuento: - S/ {formatearMoneda(montoDescuento)}
                    </div>
                  </div>
                )}
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
          subtotal={subtotalGeneral}
          descuento={montoDescuento}
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