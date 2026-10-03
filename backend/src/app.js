import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { initDB } from './config/initDB.js';
import paquetesRoutes from './routes/paquetesRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Documentación Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas de la API
app.use('/api/paquetes', paquetesRoutes);
app.use('/api/auth', authRoutes);

// Endpoint de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor BelenInter funcionando correctamente' });
});

const startServer = async () => {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`Documentación interactiva disponible en http://localhost:${PORT}/api-docs`);
  });
};

startServer();