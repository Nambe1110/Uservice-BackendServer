import express from "express";

const exampleRouter = express.Router({ mergeParams: true });

exampleRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Example']
  next();
});

exampleRouter.get("/test", (req, res) => {
  // #swagger.description = 'Get all examples'
  /* #swagger.responses[200] = {
        description: 'Example get',
    } */

  res.status(200).send({
    status: "success",
    message: "API is working. Server is running perfectly",
    data: {},
  });
});

exampleRouter.post("/test", (req, res) => {
  // #swagger.description = 'Create a new example'
  /* #swagger.responses[200] = {
        description: 'Example post',
    } */
  /* #swagger.security = [{
    "bearerAuth": []
  }] */
  // #swagger.parameters['content'] = { description: 'Example content', type: 'string' }
  // #swagger.responses[200] = { description: 'Example post', schema: { $ref: "#/definitions/Example" } }
  const { content } = req.body;

  res.status(200).send({
    status: "success",
    message: "API is working. Server is running perfectly",
    data: {
      content,
    },
  });
});

export default exampleRouter;
