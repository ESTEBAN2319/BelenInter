import dotenv from 'dotenv';

dotenv.config();

/**
 * Subes un Buffer de imagen a ImgBB
 * @param {Buffer} fileBuffer - El buffer de la foto subida con Multer
 * @returns {Promise<string>} - Retorna la URL pública HTTPS de la imagen
 */
export const subirImagenImgBB = async (fileBuffer) => {
  try {
    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
      throw new Error('IMGBB_API_KEY no está configurada en el archivo .env');
    }

    // Convertimos la imagen a Base64 para enviarla a la API de ImgBB
    const base64Image = fileBuffer.toString('base64');

    const formData = new URLSearchParams();
    formData.append('image', base64Image);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Error al subir la imagen a ImgBB');
    }

    // Devuelve la URL directa de la imagen alojada
    return data.data.url;
  } catch (error) {
    console.error('Error en servicio ImgBB:', error);
    throw new Error('No se pudo guardar la imagen en la nube.');
  }
};