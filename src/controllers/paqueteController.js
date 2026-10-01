import Paquete from '../models/paquetesModel.js';
import { extraerDatosConGemini } from '../services/geminiService.js';
import { subirImagenImgBB } from '../services/imgbbService.js';

// 1. Controller para escanear etiqueta y subir foto a ImgBB
export const escanearEtiqueta = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Debes proporcionar una imagen de la etiqueta' });
    }

    // Subir imagen a la nube
    const fotoUrl = await subirImagenImgBB(req.file.buffer);

    // Extraer datos con la IA
    const datosExtraidos = await extraerDatosConGemini(req.file.buffer, req.file.mimetype);

    res.status(200).json({
      mensaje: 'Etiqueta procesada e imagen subida con éxito',
      datos: {
        numero_guia: datosExtraidos.numero_guia || '',
        nombre_cliente: datosExtraidos.nombre_cliente || '',
        foto_paquete_url: fotoUrl,
      },
    });
  } catch (error) {
    console.error('Error en escanearEtiqueta:', error);
    res.status(500).json({ error: 'Error interno al procesar la etiqueta o subir la foto' });
  }
};

// 2. Controller para guardar el paquete en PostgreSQL
export const guardarPaquete = async (req, res) => {
  try {
    const { numero_guia, nombre_cliente, foto_paquete_url, notas } = req.body;

    if (!numero_guia || !nombre_cliente) {
      return res.status(400).json({ error: 'numero_guia y nombre_cliente son obligatorios' });
    }

    const nuevoPaquete = await Paquete.create({
      numero_guia,
      nombre_cliente,
      foto_paquete_url,
      notas,
    });

    res.status(201).json({
      mensaje: 'Paquete registrado en bodega exitosamente',
      paquete: nuevoPaquete,
    });
  } catch (error) {
    console.error('Error al guardar paquete:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El número de guía ya existe en la base de datos' });
    }
    res.status(500).json({ error: 'Error al guardar el paquete' });
  }
};

// 3. Controller para obtener todos los paquetes
export const obtenerPaquetes = async (req, res) => {
  try {
    const paquetes = await Paquete.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(paquetes);
  } catch (error) {
    console.error('Error al obtener paquetes:', error);
    res.status(500).json({ error: 'Error al consultar la lista de paquetes' });
  }
};

// 4. Controller para marcar un paquete como entregado
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

    res.status(200).json({
      mensaje: 'Paquete marcado como entregado exitosamente',
      paquete,
    });
  } catch (error) {
    console.error('Error al marcar entregado:', error);
    res.status(500).json({ error: 'Error al actualizar el estado del paquete' });
  }
};