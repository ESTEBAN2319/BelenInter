import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clienteAxios from '../api/axios.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const response = await clienteAxios.post('/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('token_beleninter', response.data.token);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Credenciales incorrectas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 font-sans flex items-center justify-center overflow-hidden">
      
      {/* 1. FONDO DE PANTALLA CON OVERLAY MEJORADO */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/fondo-login.jpg')`
        }}
      >
        {/* Filtro degradado para dar elegancia y resaltar el texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/65 to-slate-950/45 backdrop-blur-[2px]" />
      </div>

      {/* 2. CONTENEDOR PRINCIPAL */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO DE LOGIN */}
        <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
          <div className="w-full max-w-md bg-slate-900/90 border border-slate-700/60 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
            
            {/* Encabezado del Formulario */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-wide">
                NORCEL <span className="text-orange-500 font-extrabold">BELÉN</span>
              </h2>
              <div>
                <h3 className="text-xl font-bold text-slate-100">Iniciar sesión</h3>
                <p className="text-xs text-slate-300">Accede a tu cuenta para continuar</p>
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-xl font-medium">
                {error}
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Campo Usuario */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Usuario / Correo</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-orange-400 text-sm">👤</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@norcelbelen.com"
                    className="w-full bg-slate-800/90 border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Contraseña</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-orange-400 text-sm">🔒</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/90 border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Botón de Entrada (Estilo Naranja Vibrante) */}
              <button
                type="submit"
                disabled={cargando}
                className="w-full mt-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/25 transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                <span>{cargando ? 'Ingresando...' : 'Entrar al Sistema'}</span>
                {!cargando && <span className="text-lg">→</span>}
              </button>
            </form>

          </div>
        </div>

        {/* COLUMNA DERECHA: TEXTOS E ICONOS */}
        <div className="lg:col-span-7 space-y-8 text-white order-1 lg:order-2">
          
          <div className="flex items-center space-x-3">
            <span className="text-3xl font-black tracking-wider text-white drop-shadow-md">
              NORCEL <span className="text-orange-500 font-extrabold">BELÉN</span>
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-lg">
              Entregas eficientes, <br />
              <span className="text-orange-500">siempre a tiempo.</span>
            </h1>
            <p className="text-slate-200 text-base md:text-lg max-w-lg font-medium drop-shadow-sm">
              Envíos a nivel nacional con la seguridad y rapidez que necesitas.
            </p>
          </div>

          {/* Tarjetas Informativas */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20 max-w-lg">
            
            <div className="flex items-center space-x-3 bg-slate-900/60 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
              <span className="text-2xl">🚚</span>
              <div>
                <p className="font-bold text-xs text-white">Rápidos y</p>
                <p className="text-[11px] text-slate-300">seguros</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-slate-900/60 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
              <span className="text-2xl">📍</span>
              <div>
                <p className="font-bold text-xs text-white">Cobertura</p>
                <p className="text-[11px] text-slate-300">en todo el país</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-slate-900/60 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="font-bold text-xs text-white">Tu envío,</p>
                <p className="text-[11px] text-slate-300">en buenas manos</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}