import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

// Componente para proteger rutas privadas
const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem('token_beleninter');
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <RutaProtegida>
              <div className="min-h-screen bg-slate-900 text-white p-8">
                <h1 className="text-3xl font-bold">Panel de Control de BelenInter</h1>
                <p className="text-slate-400 mt-2">¡Sesión iniciada con éxito! Próximamente escáner y lista de paquetes.</p>
              </div>
            </RutaProtegida>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}