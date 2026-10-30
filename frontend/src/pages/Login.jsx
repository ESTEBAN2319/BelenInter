import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clienteAxios from '../api/axios.js';

export default function Login() {
  // Estados para cambiar entre vistas: 'login' | 'registro' | 'recuperar'
  const [vista, setVista] = useState('login');

  // Campos de Formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('operario');

  // Feedback
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  // Resetear estados al cambiar de pestaña
  const cambiarVista = (nuevaVista) => {
    setVista(nuevaVista);
    setError('');
    setExito('');
  };

  // 1. MANEJAR INICIO DE SESIÓN
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const response = await clienteAxios.post('/auth/login', { 
        email: email.trim(), 
        password 
      });

      if (response.data.token) {
        localStorage.setItem('token_beleninter', response.data.token);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.mensaje || 'Credenciales incorrectas');
    } finally {
      setCargando(false);
    }
  };

  // 2. MANEJAR REGISTRO DE USUARIO NUEVO
  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setCargando(true);

    try {
      await clienteAxios.post('/auth/registro', {
        nombre: nombre.trim(),
        email: email.trim(),
        password,
        rol
      });

      setExito('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
      setTimeout(() => {
        cambiarVista('login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.mensaje || 'Error al registrar el usuario');
    } finally {
      setCargando(false);
    }
  };

  // 3. MANEJAR RECUPERACIÓN DE CONTRASEÑA
  const handleRecuperarPassword = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setCargando(true);

    try {
      // Petición al endpoint de recuperación (si existe en tu backend)
      await clienteAxios.post('/auth/recuperar-password', { email: email.trim() });
      setExito('Se ha enviado un enlace de recuperación a tu correo electrónico.');
    } catch (err) {
      // Feedback amigable incluso si el endpoint aún se está configurando
      setExito('Si el correo está registrado, recibirás un mensaje con las instrucciones para restablecer tu contraseña.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 font-sans flex items-center justify-center overflow-hidden">
      
      {/* 1. FONDO DE PANTALLA CON OVERLAY */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/fondo-login.jpg')`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/65 to-slate-950/45 backdrop-blur-[2px]" />
      </div>

      {/* 2. CONTENEDOR PRINCIPAL DOS COLUMNAS */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* COLUMNA IZQUIERDA: TARJETA DE FORMULARIO INTERACTIVA */}
        <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
          <div className="w-full max-w-md bg-slate-900/90 border border-slate-700/60 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
            
            {/* Encabezado dinámico */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-wide">
                NORCEL <span className="text-orange-500 font-extrabold">BELÉN</span>
              </h2>
              <div>
                {vista === 'login' && (
                  <>
                    <h3 className="text-xl font-bold text-slate-100">Iniciar sesión</h3>
                    <p className="text-xs text-slate-300">Accede a tu cuenta para continuar</p>
                  </>
                )}
                {vista === 'registro' && (
                  <>
                    <h3 className="text-xl font-bold text-slate-100">Crear cuenta</h3>
                    <p className="text-xs text-slate-300">Registra un nuevo usuario en el sistema</p>
                  </>
                )}
                {vista === 'recuperar' && (
                  <>
                    <h3 className="text-xl font-bold text-slate-100">Recuperar contraseña</h3>
                    <p className="text-xs text-slate-300">Ingresa tu correo para restablecer tu clave</p>
                  </>
                )}
              </div>
            </div>

            {/* Alertas */}
            {error && (
              <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-xl font-medium">
                {error}
              </div>
            )}
            {exito && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs p-3 rounded-xl font-medium">
                {exito}
              </div>
            )}

            {/* --- FORMULARIO 1: LOGIN --- */}
            {vista === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Correo Electrónico</label>
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

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-slate-300">Contraseña</label>
                    <button
                      type="button"
                      onClick={() => cambiarVista('recuperar')}
                      className="text-[11px] text-orange-400 hover:underline font-medium cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
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

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full mt-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/25 transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  <span>{cargando ? 'Ingresando...' : 'Entrar al Sistema'}</span>
                  {!cargando && <span className="text-lg">→</span>}
                </button>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-400">
                    ¿No tienes una cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => cambiarVista('registro')}
                      className="text-orange-400 font-bold hover:underline cursor-pointer"
                    >
                      Regístrate aquí
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* --- FORMULARIO 2: REGISTRO DE USUARIO NUEVO --- */}
            {vista === 'registro' && (
              <form onSubmit={handleRegistro} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Esteban Morales"
                    className="w-full bg-slate-800/90 border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operario@norcelbelen.com"
                    className="w-full bg-slate-800/90 border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/90 border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Rol de Usuario</label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-600 focus:border-orange-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none transition-all"
                  >
                    <option value="operario">Operario</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/25 transition-all text-sm cursor-pointer disabled:opacity-50"
                >
                  {cargando ? 'Registrando...' : 'Crear Cuenta'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => cambiarVista('login')}
                    className="text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    ← Volver al inicio de sesión
                  </button>
                </div>
              </form>
            )}

            {/* --- FORMULARIO 3: RECUPERAR CONTRASEÑA --- */}
            {vista === 'recuperar' && (
              <form onSubmit={handleRecuperarPassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Correo Electrónico Registrado</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-orange-400 text-sm">✉️</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@norcelbelen.com"
                      className="w-full bg-slate-800/90 border border-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/25 transition-all text-sm cursor-pointer disabled:opacity-50"
                >
                  {cargando ? 'Enviando...' : 'Enviar Instrucciones'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => cambiarVista('login')}
                    className="text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    ← Volver al inicio de sesión
                  </button>
                </div>
              </form>
            )}

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