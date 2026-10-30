import cron from 'node-cron';
import { Op } from 'sequelize';
import Paquete from '../models/paquete.js'; // Ajusta la ruta a tu modelo de Paquete
import fs from 'fs';
import path from 'path';

export const iniciarTareaLimpieza = () => {
  // Se ejecuta todos los días a las 2:00 AM ('0 2 * * *')
  cron.schedule('0 2 * * *', async () => {
    console.log('🔄 Ejecutando purga automática de paquetes (2 meses)...');

    try {
      // Calcular la fecha límite (hace 60 días)
      const haceDosMeses = new Date();
      haceDosMeses.setDate(haceDosMeses.getDate() - 60);

      // Buscar paquetes para eliminar
      const paquetesAEliminar = await Paquete.findAll({
        where: {
          estado: {
            [Op.in]: ['entregado', 'devolucion']
          },
          updatedAt: {
            [Op.lt]: haceDosMeses
          }
        }
      });

      if (paquetesAEliminar.length === 0) {
        console.log('✅ No hay paquetes antiguos para purgar.');
        return;
      }

      // Eliminar archivos de imagen locales si existen
      for (const paquete of paquetesAEliminar) {
        if (paquete.imagen_url && paquete.imagen_url.includes('/uploads/')) {
          const nombreArchivo = paquete.imagen_url.split('/uploads/').pop();
          const rutaArchivo = path.join(process.cwd(), 'uploads', nombreArchivo);

          if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
          }
        }
      }

      // Eliminar registros de la base de datos
      const cantidadEliminados = await Paquete.destroy({
        where: {
          id: paquetesAEliminar.map(p => p.id)
        }
      });

      console.log(`🗑️ Se eliminaron ${cantidadEliminados} paquetes e imágenes con más de 60 días.`);
    } catch (error) {
      console.error('❌ Error durante la purga automática:', error);
    }
  });
};