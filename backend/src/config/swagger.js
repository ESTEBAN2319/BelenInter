import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BelenInter API - Logistics & Management',
      version: '1.0.0',
      description: 'Documentación oficial de la API de BelenInter con escaneo de etiquetas IA y autenticación JWT.',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor de Desarrollo Local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa tu token JWT obtenido en /api/auth/login',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;