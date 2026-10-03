import { Router } from 'express';
import multer from 'multer';
import {
  escanearEtiqueta,
  guardarPaquete,
  obtenerPaquetes,
  marcarEntregado,
} from '../controllers/paqueteController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * @swagger
 * /api/paquetes/escanear:
 *   post:
 *     summary: Escanear foto de etiqueta con IA (Groq Cloud)
 *     tags: [Paquetes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               imagen:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Datos extraídos con éxito de la etiqueta
 *       401:
 *         description: No autorizado (Token JWT no enviado o inválido)
 */
router.post('/escanear', verificarToken, upload.single('imagen'), escanearEtiqueta);

/**
 * @swagger
 * /api/paquetes/guardar:
 *   post:
 *     summary: Guardar un paquete procesado en la base de datos
 *     tags: [Paquetes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Paquete guardado exitosamente
 */
router.post('/guardar', verificarToken, guardarPaquete);

/**
 * @swagger
 * /api/paquetes:
 *   get:
 *     summary: Obtener el listado completo de paquetes
 *     tags: [Paquetes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de paquetes devuelta con éxito
 */
router.get('/', verificarToken, obtenerPaquetes);

/**
 * @swagger
 * /api/paquetes/{id}/entregar:
 *   patch:
 *     summary: Marcar un paquete como entregado
 *     tags: [Paquetes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estado actualizado a entregado
 */
router.patch('/:id/entregar', verificarToken, marcarEntregado);

export default router;