import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import clienteAxios from '../api/axios.js';

export default function Dashboard() {
  const [paquetes, setPaquetes] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // ESTADO MODO OSCURO / CLARO
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || true;
  });

  // Modal Confirmar Logout
  const [logoutModalAbierto, setLogoutModalAbierto] = useState(false);

  // Modal de Escáner
  const [escanearAbierto, setEscanearAbierto] = useState(false);
  const [modoCamara, setModoCamara] = useState(false);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [procesandoIA, setProcesandoIA] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Formulario para guardar
  const [formDatos, setFormDatos] = useState({
    numero_guia: '',
    nombre_cliente: '',
    fecha_ingreso: '',
    estado: 'en_bodega',
    imagen_url: ''
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  // Atajo de teclado (Ctrl+K o Cmd+K) para enfocar la búsqueda
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const nuevoTema = !darkMode;
    setDarkMode(nuevoTema);
    localStorage.setItem('theme', nuevoTema ? 'dark' : 'light');
  };

  const cargarPaquetes = async () => {
    try {
      const response = await clienteAxios.get('/paquetes');
      setPaquetes(response.data);
    } catch (error) {
      console.error('Error al cargar paquetes:', error);
    }
  };

  useEffect(() => {
    cargarPaquetes();
  }, []);

  const confirmarCerrarSesion = () => {
    detenerCamara();
    localStorage.removeItem('token_beleninter');
    navigate('/login');
  };

  const formatearFecha = (cadenaFecha) => {
    if (!cadenaFecha) return 'N/A';
    try {
      const fecha = new Date(cadenaFecha);
      if (isNaN(fecha.getTime())) {
        return cadenaFecha.split('T')[0] || cadenaFecha;
      }
      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return cadenaFecha;
    }
  };

  const obtenerEstiloEstado = (estadoRaw) => {
    const estado = (estadoRaw || '').toLowerCase().trim();
    if (estado.includes('entregado')) {
      return darkMode 
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
        : 'bg-emerald-100 text-emerald-700 border-emerald-300';
    }
    if (estado.includes('devolucion') || estado.includes('devuelto') || estado.includes('cancelado')) {
      return darkMode 
        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
        : 'bg-rose-100 text-rose-700 border-rose-300';
    }
    if (estado.includes('bodega')) {
      return darkMode 
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
        : 'bg-amber-100 text-amber-700 border-amber-300';
    }
    return darkMode 
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
      : 'bg-blue-100 text-blue-700 border-blue-300';
  };

  const actualizarEstado = async (idPaquete, nuevoEstado) => {
    try {
      await clienteAxios.put(`/paquetes/${idPaquete}`, { estado: nuevoEstado });
      cargarPaquetes();
    } catch (error) {
      setPaquetes(paquetes.map(p => p.id === idPaquete ? { ...p, estado: nuevoEstado } : p));
    }
  };

  // Cámara Web
  const iniciarCamara = async () => {
    setModoCamara(true);
    setImagenSeleccionada(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('No se pudo acceder a la cámara.');
      setModoCamara(false);
    }
  };

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setModoCamara(false);
  };

  const tomarFoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'captura_etiqueta.jpg', { type: 'image/jpeg' });
      detenerCamara();
      const previewUrl = URL.createObjectURL(file);
      setImagenSeleccionada(previewUrl);
      procesarConIA(file, previewUrl);
    }, 'image/jpeg');
  };

  const handleSeleccionarArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    detenerCamara();
    const previewUrl = URL.createObjectURL(file);
    setImagenSeleccionada(previewUrl);
    procesarConIA(file, previewUrl);
  };

  const procesarConIA = async (file, previewUrl) => {
    setProcesandoIA(true);
    const formData = new FormData();
    formData.append('imagen', file);

    try {
      const response = await clienteAxios.post('/paquetes/escanear', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const raw = response.data || {};
      const res = raw.datos || raw.resultado || raw.data || raw.paquete || raw;
      
      const guiaDetectada = res.numero_guia || res.numeroGuia || res.guia || raw.numero_guia || '';
      const clienteDetectado = res.nombre_cliente || res.destinatario || res.cliente || raw.nombre_cliente || '';
      const fechaDetectada = res.fecha_ingreso || res.created_at || new Date().toISOString();

      setFormDatos({
        numero_guia: guiaDetectada || 'N/A',
        nombre_cliente: clienteDetectado || 'N/A',
        fecha_ingreso: fechaDetectada,
        estado: 'en_bodega',
        imagen_url: previewUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400'
      });
    } catch (error) {
      alert('Error al procesar la imagen con IA.');
    } finally {
      setProcesandoIA(false);
    }
  };

  const handleGuardarPaquete = async () => {
    if (!formDatos.numero_guia || formDatos.numero_guia === 'N/A') {
      alert('Verifica el número de guía antes de guardar.');
      return;
    }

    const paqueteAEnviar = {
      ...formDatos,
      imagen_url: formDatos.imagen_url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400'
    };

    try {
      await clienteAxios.post('/paquetes/guardar', paqueteAEnviar);
      cerrarModal();
      cargarPaquetes();
    } catch (error) {
      alert('Error al guardar el paquete.');
    }
  };

  const cerrarModal = () => {
    detenerCamara();
    setEscanearAbierto(false);
    setImagenSeleccionada(null);
    setModoCamara(false);
    setModoEdicion(false);
    setFormDatos({
      numero_guia: '',
      nombre_cliente: '',
      fecha_ingreso: '',
      estado: 'en_bodega',
      imagen_url: ''
    });
  };

  const paquetesFiltrados = paquetes.filter(p => {
    const guia = (p.numero_guia || p.guia || '').toLowerCase();
    const cliente = (p.nombre_cliente || p.destinatario || '').toLowerCase();
    return guia.includes(busqueda.toLowerCase()) || cliente.includes(busqueda.toLowerCase());
  });

  const totalBodega = paquetes.filter(p => (p.estado || '').toLowerCase().includes('bodega')).length;
  const totalEntregados = paquetes.filter(p => (p.estado || '').toLowerCase().includes('entregado')).length;

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>
      
      {/* 1. CABECERA CON BÚSQUEDA AMPLIA */}
      <header className={`px-8 py-4 flex flex-col md:flex-row gap-4 justify-between items-center backdrop-blur-md sticky top-0 z-20 border-b transition-colors duration-300 ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'
      }`}>
        {/* LOGO BRAND */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-2.5 rounded-2xl shadow-lg shadow-orange-500/20 text-lg font-black">
            📦
          </div>
          <div>
            <h1 className={`text-xl font-black tracking-wider leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              NORCEL <span className="text-orange-500 font-extrabold">BELÉN</span>
            </h1>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sistema Logístico e Inventario</p>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA XL (PROMINENTE) */}
        <div className="w-full max-w-2xl relative flex items-center">
          <span className="absolute left-4 text-orange-500 text-lg pointer-events-none">🔍</span>
          
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Buscar guía o cliente (ej: 24006... o Julio Santos)"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`w-full rounded-2xl pl-11 pr-28 py-3 text-base font-medium transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              darkMode 
                ? 'bg-slate-950 border border-slate-700/90 text-white placeholder-slate-500 focus:border-orange-500' 
                : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500'
            }`}
          />

          <div className="absolute right-3.5 flex items-center space-x-2">
            {busqueda ? (
              <button
                onClick={() => setBusqueda('')}
                className="bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-full w-6 h-6 flex items-center justify-center text-xs transition-all cursor-pointer"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            ) : (
              <kbd className={`hidden sm:inline-block px-2.5 py-1 text-xs font-mono rounded-lg border ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-500'
              }`}>
                Ctrl K
              </kbd>
            )}

            {busqueda && (
              <span className="bg-orange-500 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                {paquetesFiltrados.length}
              </span>
            )}
          </div>
        </div>

        {/* ACCIONES SECUNDARIAS */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* INTERRUPTOR MODO OSCURO / CLARO */}
          <button
            onClick={toggleTheme}
            className={`relative w-16 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 shadow-inner ${
              darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-amber-100 border border-amber-300'
            }`}
            title={darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            <span className="absolute left-1.5 text-xs">🌙</span>
            <span className="absolute right-1.5 text-xs">☀️</span>
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center text-xs z-10 ${
                darkMode ? 'translate-x-8 bg-slate-900 text-amber-300' : 'translate-x-0 bg-amber-400 text-white'
              }`}
            >
              {darkMode ? '✨' : '⚡'}
            </div>
          </button>

          {/* BOTÓN ESCANEAR CON IA */}
          <button 
            onClick={() => setEscanearAbierto(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center space-x-2 cursor-pointer active:scale-[0.98]"
          >
            <span>🤖</span> <span className="hidden sm:inline">+ Escanear Guía (IA)</span>
          </button>

          {/* BOTÓN CERRAR SESIÓN */}
          <button 
            onClick={() => setLogoutModalAbierto(true)}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 px-3 py-2.5 rounded-xl border border-rose-500/30 font-semibold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-sm"
            title="Cerrar Sesión"
          >
            <span>🚪</span>
            <span className="hidden lg:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* 2. CONTENEDOR PRINCIPAL */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-6">
        
        {/* MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className={`border rounded-2xl p-5 shadow-lg backdrop-blur-sm flex items-center justify-between transition-colors ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Paquetes</p>
              <h3 className={`text-2xl font-black mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{paquetes.length}</h3>
            </div>
            <div className={`p-3 rounded-xl border text-xl ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>📊</div>
          </div>

          <div className={`border rounded-2xl p-5 shadow-lg backdrop-blur-sm flex items-center justify-between transition-colors ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">En Bodega</p>
              <h3 className="text-2xl font-black text-amber-500 mt-1">{totalBodega}</h3>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xl">🏬</div>
          </div>

          <div className={`border rounded-2xl p-5 shadow-lg backdrop-blur-sm flex items-center justify-between transition-colors ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Entregados</p>
              <h3 className="text-2xl font-black text-emerald-500 mt-1">{totalEntregados}</h3>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xl">🚀</div>
          </div>
        </div>

        {/* TABLA DE PAQUETES */}
        <div className={`border rounded-3xl shadow-xl backdrop-blur-md overflow-hidden transition-colors ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          
          <div className={`p-6 border-b flex justify-between items-center ${
            darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'
          }`}>
            <h2 className={`font-extrabold text-base tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Inventario de Paquetes <span className={darkMode ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>({paquetesFiltrados.length})</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={`uppercase text-xs font-bold tracking-wider border-b ${
                darkMode ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <tr>
                  <th className="px-6 py-4">Nº Guía</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Fecha Ingreso</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200/80'}`}>
                {paquetesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={`px-6 py-12 text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {busqueda ? `No se encontraron paquetes para "${busqueda}"` : 'No hay paquetes registrados.'}
                    </td>
                  </tr>
                ) : (
                  paquetesFiltrados.map((p) => {
                    const estadoTexto = p.estado || 'en_bodega';
                    return (
                      <tr key={p.id || p.numero_guia} className={`transition-colors ${
                        darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      }`}>
                        <td className="px-6 py-4 font-mono font-bold text-orange-500">
                          {p.numero_guia || p.guia || 'N/A'}
                        </td>
                        <td className={`px-6 py-4 font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                          {p.nombre_cliente || p.destinatario || 'N/A'}
                        </td>
                        <td className={`px-6 py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {formatearFecha(p.fecha_ingreso || p.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold border uppercase tracking-wider ${obtenerEstiloEstado(estadoTexto)}`}>
                            {estadoTexto.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button 
                            onClick={() => actualizarEstado(p.id, 'entregado')}
                            disabled={estadoTexto === 'entregado'}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              estadoTexto === 'entregado'
                                ? (darkMode ? 'bg-slate-800 text-slate-500 border border-slate-700/50' : 'bg-slate-200 text-slate-400 border border-slate-300')
                                : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30'
                            }`}
                          >
                            ✓ Entregado
                          </button>

                          <button 
                            onClick={() => actualizarEstado(p.id, 'devolucion')}
                            disabled={estadoTexto === 'devolucion'}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              estadoTexto === 'devolucion'
                                ? (darkMode ? 'bg-slate-800 text-slate-500 border border-slate-700/50' : 'bg-slate-200 text-slate-400 border border-slate-300')
                                : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/30'
                            }`}
                          >
                            ↩ Devolución
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL CERRAR SESIÓN */}
      {logoutModalAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="text-4xl bg-rose-500/10 w-16 h-16 mx-auto rounded-full flex items-center justify-center border border-rose-500/20">
              🚪
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black tracking-wide">¿Cerrar Sesión?</h3>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Saldrás del sistema de gestión de Norcel Belén.
              </p>
            </div>
            <div className="flex space-x-3 pt-2">
              <button 
                onClick={() => setLogoutModalAbierto(false)} 
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarCerrarSesion} 
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Sí, Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ESCÁNER */}
      {escanearAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-700/70 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <h3 className="text-lg font-black tracking-wide">
              Escanear Etiqueta <span className="text-orange-500">(IA)</span>
            </h3>

            <canvas ref={canvasRef} className="hidden" />

            {!modoCamara && !imagenSeleccionada && (
              <div className="space-y-3">
                <button
                  onClick={iniciarCamara}
                  className="w-full p-4 border-2 border-dashed border-orange-500/40 hover:border-orange-500 bg-orange-500/5 hover:bg-orange-500/10 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer"
                >
                  <span className="text-orange-500 font-bold text-sm">📸 Encender Cámara Web</span>
                  <span className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Escanear etiqueta directamente</span>
                </button>

                <label className={`w-full p-3 border rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  darkMode ? 'border-slate-700/80 bg-slate-800/50 hover:border-slate-600' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                }`}>
                  <span className="text-xs font-semibold">📂 Seleccionar Foto de Archivo</span>
                  <input type="file" accept="image/*" onChange={handleSeleccionarArchivo} className="hidden" />
                </label>
              </div>
            )}

            {modoCamara && (
              <div className="space-y-3 text-center">
                <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-700">
                  <video ref={videoRef} autoPlay playsInline className="w-full max-h-56 object-cover" />
                </div>
                <button
                  onClick={tomarFoto}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl shadow-lg transition-all cursor-pointer text-sm"
                >
                  📸 Capturar Foto
                </button>
              </div>
            )}

            {imagenSeleccionada && (
              <div className="space-y-3">
                <img src={imagenSeleccionada} alt="Foto paquete" className="max-h-40 w-full object-contain rounded-2xl bg-slate-950 p-2 border border-slate-700" />

                {procesandoIA ? (
                  <p className="text-orange-500 animate-pulse text-center text-xs font-semibold">Extrayendo datos con la IA de Groq...</p>
                ) : (
                  <div>
                    {!modoEdicion ? (
                      <div className={`p-3.5 rounded-2xl text-xs space-y-1.5 border ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <p>Nº Guía: <strong className="text-orange-500 font-mono text-sm ml-1">{formDatos.numero_guia}</strong></p>
                        <p>Cliente: <strong className="ml-1">{formDatos.nombre_cliente}</strong></p>
                        <div className="pt-2 text-right">
                          <button onClick={() => setModoEdicion(true)} className="text-orange-500 hover:underline font-bold">
                            ✏️ Editar Datos
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-3 rounded-2xl text-xs space-y-2 border ${
                        darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div>
                          <label className="block font-semibold mb-0.5">Nº Guía:</label>
                          <input 
                            type="text" 
                            value={formDatos.numero_guia}
                            onChange={(e) => setFormDatos({ ...formDatos, numero_guia: e.target.value })}
                            className={`w-full border rounded-lg px-2.5 py-1.5 font-mono text-orange-500 focus:outline-none focus:border-orange-500 ${
                              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-0.5">Cliente:</label>
                          <input 
                            type="text" 
                            value={formDatos.nombre_cliente}
                            onChange={(e) => setFormDatos({ ...formDatos, nombre_cliente: e.target.value })}
                            className={`w-full border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500 ${
                              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          />
                        </div>
                        <div className="text-right">
                          <button onClick={() => setModoEdicion(false)} className="font-bold text-orange-500">
                            ✓ Listo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className={`flex justify-end space-x-2 pt-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <button onClick={cerrarModal} className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}>
                Cancelar
              </button>
              {imagenSeleccionada && !procesandoIA && (
                <button onClick={handleGuardarPaquete} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer">
                  Guardar Paquete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}