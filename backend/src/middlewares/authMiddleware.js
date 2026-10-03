import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
  // 1. Extraer el header Authorization
  const authHeader = req.headers['authorization'];

  // El estándar industrial envía el token con el formato: "Bearer <TOKEN>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token de autenticación' });
  }

  try {
    // 2. Verificar la firma del token usando nuestro JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Adjuntar la información del usuario desencriptada al objeto req
    req.usuario = decoded;

    // 4. Dar paso al siguiente controller
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};