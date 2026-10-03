import Groq from 'groq-sdk';

export const extraerDatosConGemini = async (imageBuffer, mimeType) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error('GROQ_API_KEY no está configurada en el archivo .env');
    }

    const groq = new Groq({ apiKey });
    const base64Image = imageBuffer.toString('base64');

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analiza esta imagen de una etiqueta de envío. Extrae el número de guía y el nombre del cliente. Responde ÚNICAMENTE en formato JSON válido con la siguiente estructura exacta: {"numero_guia": "string", "nombre_cliente": "string"}. No agregues texto adicional ni marcas de formato markdown.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      // Modelo actualizado soportado por Groq para visión y JSON
      model: 'qwen/qwen3.8-27b',
      temperature: 0.1,
    });

    const respuestaTexto = chatCompletion.choices[0]?.message?.content || '{}';
    
    // Limpieza de etiquetas de código si el modelo las incluye en la respuesta
    const jsonLimpio = respuestaTexto.replace(/```json|```/g, '').trim();
    const resultado = JSON.parse(jsonLimpio);

    return resultado;
  } catch (error) {
    console.error('Error al procesar la imagen con Groq:', error);
    throw new Error('No se pudieron extraer los datos del paquete con la IA.');
  }
};