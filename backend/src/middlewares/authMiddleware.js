import jwt from 'jsonwebtoken';

// Middleware para verificar que el token es válido
export const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_default');
    req.usuario = decoded; // { id, email, rol }
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

// Middleware exclusivo para Administradores
export const esAdmin = (req, res, next) => {
  if (req.usuario && req.usuario.rol === 'administrador') {
    next();
  } else {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
};