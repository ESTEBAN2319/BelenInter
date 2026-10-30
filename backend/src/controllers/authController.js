import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import Usuario from '../models/usuario.js';

// Transporter de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 1. REGISTRO DE USUARIOS
export const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const usuarioExistente = await Usuario.findOne({ where: { email: email.trim() } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHashed = await bcrypt.hash(password, salt);

    const nuevoUsuario = await Usuario.create({
      nombre: nombre.trim(),
      email: email.trim(),
      password: passwordHashed,
      rol: rol || 'operario',
    });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
      },
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno al registrar el usuario' });
  }
};

// 2. LOGIN DE USUARIOS
export const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    const usuario = await Usuario.findOne({ where: { email: email.trim() } });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const esPasswordCorrecta = await bcrypt.compare(password, usuario.password);
    if (!esPasswordCorrecta) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol, email: usuario.email },
      process.env.JWT_SECRET || 'secret_key_default',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error interno en el inicio de sesión' });
  }
};

// 3. RECUPERACIÓN DE CONTRASEÑA
export const recuperarPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El correo electrónico es obligatorio' });
    }

    const usuario = await Usuario.findOne({ where: { email: email.trim() } });

    if (!usuario) {
      return res.status(404).json({ error: 'El correo electrónico no se encuentra registrado en el sistema' });
    }

    const tokenRecuperacion = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET || 'secret_key_default',
      { expiresIn: '15m' }
    );

    const enlaceRecuperacion = `http://localhost:5173/reset-password?token=${tokenRecuperacion}`;

    const mailOptions = {
      from: '"Norcel Belén Soporte" <no-reply@norcelbelen.com>',
      to: usuario.email,
      subject: 'Restablecimiento de Contraseña - NORCEL BELÉN',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; padding: 20px; border-radius: 10px;">
          <h2 style="color: #f97316;">NORCEL <span style="color: #ffffff;">BELÉN</span></h2>
          <p>Hola <strong>${usuario.nombre}</strong>,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña en la plataforma.</p>
          <p>Haz clic en el siguiente botón para continuar (este enlace vence en 15 minutos):</p>
          <a href="${enlaceRecuperacion}" style="background-color: #ea580c; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-top: 10px;">
            Restablecer Contraseña
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      mensaje: 'Correo de recuperación enviado con éxito. Revisa tu bandeja de entrada o Spam.',
      email: usuario.email,
    });
  } catch (error) {
    console.error('Error al enviar el correo de recuperación:', error);
    res.status(500).json({ error: 'Error al enviar el correo. Verifica la configuración SMTP.' });
  }
};