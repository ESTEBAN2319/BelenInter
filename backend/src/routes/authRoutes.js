import { Router } from 'express';
import { registrarUsuario, loginUsuario } from '../controllers/authController.js';

const router = Router();

/**
 * @swagger
 * /api/auth/registro:
 *   post:
 *     summary: Registrar un nuevo usuario en el sistema
 *     tags: [Autenticación]
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
 *       500:
 *         description: Error interno del servidor
 */
router.post('/registro', registrarUsuario);

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

export default router;