import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import logger from "../logger/index.js";

export const swaggerDocs = (app, port) => {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Uservice REST API Docs",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://uservicebackendtestserver-env.eba-43rm8vge.ap-southeast-1.elasticbeanstalk.com/`,
        },
      ],
      components: {
        securitySchemas: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apis: [
      "./src/components/*/*RouteSwagger.js",
      "./src/components/*/*ModelSwagger.js",
    ],
  };
  const swaggerSpec = swaggerJsdoc(options);
  //
  // Swagger page
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Docs in JSON format
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  logger.info(`Docs available at http://localhost:${port}/api-docs`);
};
