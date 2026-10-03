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

// Configuración de Multer para manejar subida de fotos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Límite de 10 MB por foto
  },
});

// Rutas de la API (Protegidas con JWT)
router.post('/escanear', verificarToken, upload.single('imagen'), escanearEtiqueta);
router.post('/guardar', verificarToken, guardarPaquete);
router.get('/', verificarToken, obtenerPaquetes);
router.patch('/:id/entregar', verificarToken, marcarEntregado);

export default router;