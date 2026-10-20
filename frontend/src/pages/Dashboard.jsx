import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import clienteAxios from '../api/axios.js';

export default function Dashboard() {
  const [paquetes, setPaquetes] = useState([]);
  const [busqueda, setBusqueda] = useState('');

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
  const navigate = useNavigate();

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

  const cerrarSesion = () => {
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
      return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    }
    if (estado.includes('devolucion') || estado.includes('devuelto') || estado.includes('cancelado')) {
      return 'bg-rose-100 text-rose-700 border-rose-300';
    }
    if (estado.includes('bodega')) {
      return 'bg-blue-100 text-blue-700 border-blue-300';
    }
    return 'bg-amber-100 text-amber-700 border-amber-300';
  };

  // Cambiar estado del paquete (Entregado / Devolución)
  const actualizarEstado = async (idPaquete, nuevoEstado) => {
    try {
      await clienteAxios.put(`/paquetes/${idPaquete}`, { estado: nuevoEstado });
      cargarPaquetes();
    } catch (error) {
      // Fallback si la API requiere otro formato
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

    // Imagen por defecto si no se capturó o subió ninguna foto
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

  // Filtrado simple por búsqueda
  const paquetesFiltrados = paquetes.filter(p => {
    const guia = (p.numero_guia || p.guia || '').toLowerCase();
    const cliente = (p.nombre_cliente || p.destinatario || '').toLowerCase();
    return guia.includes(busqueda.toLowerCase()) || cliente.includes(busqueda.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col">
      
      {/* BARRA SUPERIOR LIMPIA */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white p-2 rounded-xl text-lg font-black">📦</div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">BelenInter</h1>
            <p className="text-xs text-slate-400 mt-0.5">Gestión Logística e Inventario</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Búsqueda Directa */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar por guía o cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-80 bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
          </div>

          <button 
            onClick={() => setEscanearAbierto(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <span>📷</span> <span>+ Escanear Guía (IA)</span>
          </button>

          <button 
            onClick={cerrarSesion}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2.5 rounded-xl transition-colors text-sm cursor-pointer"
            title="Cerrar Sesión"
          >
            🚪
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL: TABLA A ANCHO COMPLETO */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-700 text-base">Inventario de Paquetes ({paquetesFiltrados.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nº Guía</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Fecha Ingreso</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paquetesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                      No se encontraron paquetes registrados.
                    </td>
                  </tr>
                ) : (
                  paquetesFiltrados.map((p) => {
                    const estadoTexto = p.estado || 'en_bodega';
                    return (
                      <tr key={p.id || p.numero_guia} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-blue-600">
                          {p.numero_guia || p.guia || 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {p.nombre_cliente || p.destinatario || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {formatearFecha(p.fecha_ingreso || p.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${obtenerEstiloEstado(estadoTexto)}`}>
                            {estadoTexto.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {/* Botón Entregado */}
                          <button 
                            onClick={() => actualizarEstado(p.id, 'entregado')}
                            disabled={estadoTexto === 'entregado'}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              estadoTexto === 'entregado'
                                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            ✓ Entregado
                          </button>

                          {/* Botón Devolución */}
                          <button 
                            onClick={() => actualizarEstado(p.id, 'devolucion')}
                            disabled={estadoTexto === 'devolucion'}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              estadoTexto === 'devolucion'
                                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                                : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
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

      {/* MODAL ESCÁNER DE ENTRADA CON FOTO OPCIONAL */}
      {escanearAbierto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Escanear Etiqueta de Entrada</h3>

            <canvas ref={canvasRef} className="hidden" />

            {!modoCamara && !imagenSeleccionada && (
              <div className="space-y-3">
                <button
                  onClick={iniciarCamara}
                  className="w-full p-4 border-2 border-dashed border-blue-400 hover:border-blue-600 bg-blue-50/50 hover:bg-blue-50 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer"
                >
                  <span className="text-blue-600 font-bold text-sm">📷 Tomar Foto / Escanear Cámara</span>
                  <span className="text-xs text-slate-400 mt-1">Sube o toma una foto del paquete (opcional)</span>
                </button>

                <label className="w-full p-3 border border-slate-200 hover:border-slate-300 bg-slate-50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all">
                  <span className="text-slate-600 text-xs font-semibold">📁 Seleccionar Foto de Archivo</span>
                  <input type="file" accept="image/*" onChange={handleSeleccionarArchivo} className="hidden" />
                </label>
              </div>
            )}

            {modoCamara && (
              <div className="space-y-3 text-center">
                <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-200">
                  <video ref={videoRef} autoPlay playsInline className="w-full max-h-56 object-cover" />
                </div>
                <button
                  onClick={tomarFoto}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow transition-all cursor-pointer text-sm"
                >
                  📸 Capturar Foto
                </button>
              </div>
            )}

            {imagenSeleccionada && (
              <div className="space-y-3">
                <img src={imagenSeleccionada} alt="Foto del paquete" className="max-h-40 w-full object-contain rounded-2xl bg-slate-100 p-2 border border-slate-200" />

                {procesandoIA ? (
                  <p className="text-blue-600 animate-pulse text-center text-xs font-semibold">Extrayendo datos con la IA de Groq...</p>
                ) : (
                  <div>
                    {!modoEdicion ? (
                      <div className="bg-slate-50 p-3.5 rounded-2xl text-xs space-y-1.5 border border-slate-200 text-slate-700">
                        <p>Nº Guía: <strong className="text-blue-600 font-mono text-sm ml-1">{formDatos.numero_guia}</strong></p>
                        <p>Cliente: <strong className="text-slate-900 ml-1">{formDatos.nombre_cliente}</strong></p>
                        <div className="pt-2 text-right">
                          <button onClick={() => setModoEdicion(true)} className="text-blue-600 hover:underline font-bold">
                            ✏️ Editar Datos
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-2 border border-slate-200">
                        <div>
                          <label className="block font-semibold text-slate-500 mb-0.5">Nº Guía:</label>
                          <input 
                            type="text" 
                            value={formDatos.numero_guia}
                            onChange={(e) => setFormDatos({ ...formDatos, numero_guia: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-500 mb-0.5">Cliente:</label>
                          <input 
                            type="text" 
                            value={formDatos.nombre_cliente}
                            onChange={(e) => setFormDatos({ ...formDatos, nombre_cliente: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
                          />
                        </div>
                        <div className="text-right">
                          <button onClick={() => setModoEdicion(false)} className="text-slate-500 font-bold">
                            ✓ Listo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button onClick={cerrarModal} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">
                Cancelar
              </button>
              {imagenSeleccionada && !procesandoIA && (
                <button onClick={handleGuardarPaquete} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow cursor-pointer">
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