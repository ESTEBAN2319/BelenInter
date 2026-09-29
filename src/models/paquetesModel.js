import { DataTypes, Model, Sequelize } from 'sequelize';
import sequelize from '../config/db.js';

class Paquete extends Model {}

Paquete.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    numero_guia: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    nombre_cliente: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    fecha_ingreso: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    hora_ingreso: {
      type: DataTypes.TIME,
      defaultValue: Sequelize.literal('CURRENT_TIME'),
    },
    foto_paquete_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING(20),
      defaultValue: 'en_bodega',
    },
    fecha_entrega: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Paquete',
    tableName: 'paquetes',
    timestamps: true,
    indexes: [
      { fields: ['numero_guia'] },
      { fields: ['nombre_cliente'] },
      { fields: ['estado'] },
    ],
  }
);

export default Paquete;