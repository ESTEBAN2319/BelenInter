import sequelize from './db.js';
import Paquete from '../models/paquetesModel.js'; 

export const initDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Base de datos sincronizada correctamente.');
  } catch (error) {
    console.error('Error de conexión a la BD:', error);
  }
};