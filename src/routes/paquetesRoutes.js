import { Router } from 'express';
import multer from 'multer';
import {
  escanearEtiqueta,
  guardarPaquete,
  obtenerPaquetes,
  marcarEntregado,
} from '../controllers/paqueteController.js';

const router = Router();

// Configuración de Multer para manejar subida de fotos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Límite de 10 MB por foto
  },
});

// Rutas de la API
router.post('/escanear', upload.single('imagen'), escanearEtiqueta);
router.post('/guardar', guardarPaquete);
router.get('/', obtenerPaquetes);
router.patch('/:id/entregar', marcarEntregado);

export default router;