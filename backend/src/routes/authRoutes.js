import { Router } from 'express';
import { registrarUsuario, loginUsuario, recuperarPassword } from '../controllers/authController.js';
import { verificarToken, esAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * @swagger
 * /api/auth/registro:
 *   post:
 *     summary: Registrar un nuevo usuario en el sistema (Exclusivo Administrador)
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Esteban Admin
 *               email:
 *                 type: string
 *                 example: esteban@beleninter.com
 *               password:
 *                 type: string
 *                 example: miPasswordSeguro123
 *               rol:
 *                 type: string
 *                 enum: [administrador, operario]
 *                 example: operario
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente con clave encriptada
 *       400:
 *         description: Datos faltantes o correo ya registrado
 *       401:
 *         description: No autorizado (Token no proporcionado o inválido)
 *       403:
 *         description: Acceso denegado (Requiere rol de administrador)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/registro', verificarToken, esAdmin, registrarUsuario);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión y obtener un Token JWT
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: esteban@beleninter.com
 *               password:
 *                 type: string
 *                 example: miPasswordSeguro123
 *     responses:
 *       200:
 *         description: Autenticación exitosa, retorna el token Bearer JWT
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error interno del servidor
 */
router.post('/login', loginUsuario);

/**
 * @swagger
 * /api/auth/recuperar-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: esteban@beleninter.com
 *     responses:
 *       200:
 *         description: Solicitud procesada y correo enviado si el usuario existe
 *       400:
 *         description: El correo electrónico es obligatorio
 *       404:
 *         description: El correo electrónico no se encuentra registrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/recuperar-password', recuperarPassword);

export default router;