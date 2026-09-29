import sequelize from './db.js';
import Paquete from '../models/paquetesModel.js'; // Obligatorio para que Sequelize registre la tabla

export const initDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Base de datos sincronizada correctamente.');
  } catch (error) {
    console.error('Error de conexión a la BD:', error);
  }
};