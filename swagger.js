import swaggerAutogen from "swagger-autogen";

const outputFile = "./swagger_output.json";
const endpointsFiles = ["./src/app.js"];

const doc = {
  info: {
    version: "1.0.0",
    title: "Uservice REST API Docs",
  },
  host: "uservicebackendtestserver-env.eba-43rm8vge.ap-southeast-1.elasticbeanstalk.com",
  servers: [
    {
      url: "http://localhost:8000",
      description: "Local server",
    },
    {
      url: "http://uservicebackendtestserver-env.eba-43rm8vge.ap-southeast-1.elasticbeanstalk.com",
      description: "AWS server",
    },
  ],
  basePath: "/",
  schemes: ["http", "https"],
  consumes: ["application/json"],
  produces: ["application/json"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "JWT Authorization",
      in: "header",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
  "@definitions": {
    Example: {
      type: "object",
      properties: {
        field_1: {
          type: "string",
          description: "Example field 1",
        },
        field_2: {
          type: "integer",
          description: "Example field 2",
        },
      },
    },
  },
};

swaggerAutogen(outputFile, endpointsFiles, doc);
