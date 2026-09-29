import Paquete from '../models/paquetesModel.js';
import { extraerDatosConGemini } from '../services/geminiService.js';

// 1. Escanea la foto con Gemini
export const escanearEtiqueta = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
    }

    const datosExtraidos = await extraerDatosConGemini(req.file.buffer, req.file.mimetype);
    
    return res.status(200).json({
      mensaje: 'Etiqueta procesada con éxito por la IA',
      data: datosExtraidos,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 2. Guarda el paquete en PostgreSQL
export const guardarPaquete = async (req, res) => {
  try {
    const { numero_guia, nombre_cliente, foto_paquete_url, notas } = req.body;

    if (!numero_guia || !nombre_cliente) {
      return res.status(400).json({ error: 'Número de guía y nombre de cliente son obligatorios' });
    }

    const nuevoPaquete = await Paquete.create({
      numero_guia,
      nombre_cliente,
      foto_paquete_url,
      notas,
    });

    return res.status(201).json({
      mensaje: 'Paquete registrado en bodega exitosamente',
      paquete: nuevoPaquete,
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El número de guía ya está registrado' });
    }
    return res.status(500).json({ error: error.message });
  }
};

// 3. Obtiene todos los paquetes
export const obtenerPaquetes = async (req, res) => {
  try {
    const { estado } = req.query;
    const filtro = {};

    if (estado) {
      filtro.estado = estado;
    }

    const paquetes = await Paquete.findAll({
      where: filtro,
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json(paquetes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 4. Marca un paquete como entregado
export const marcarEntregado = async (req, res) => {
  try {
    const { id } = req.params;

    const paquete = await Paquete.findByPk(id);
    if (!paquete) {
      return res.status(404).json({ error: 'Paquete no encontrado' });
    }

    paquete.estado = 'entregado';
    paquete.fecha_entrega = new Date();
    await paquete.save();

    return res.status(200).json({
      mensaje: 'Paquete marcado como entregado',
      paquete,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};