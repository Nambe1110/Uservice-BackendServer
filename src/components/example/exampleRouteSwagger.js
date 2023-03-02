// Api document

/**
 * @openapi
 * tags:
 *  name: Example
 *  description: The Example managing API
 */

/**
 * @openapi
 * '/examples':
 *  get:
 *    tags:
 *      - Example
 *    description: Responds if the app is up and running
 *    responses:
 *      200:
 *        description: App is up and running
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Example'
 */

/**
 * @openapi
 * '/api/example/{exampleId}':
 *  get:
 *    tags:
 *      - Example
 *    summary: Get a single example by the exampleId
 *    parameters:
 *     - name: exampleId
 *       in: path
 *       description: The id of the example
 *       required: true
 *    responses:
 *      200:
 *        description: Success
 *        content:
 *         application/json:
 *          schema:
 *             $ref: '#/components/schema/Example'
 *      404:
 *        description: Product not found
 */

/**
 * @openapi
 * tags:
 *   name: Example 2
 *   description: The Example 2 managing API
 */

/**
 * @openapi
 * '/api/example':
 *  post:
 *    tags:
 *      - Example 2
 *    summary: Create an example
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The example's title.
 *                 example: Default example
 *    responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Example'
 *      409:
 *        description: Conflict
 *      400:
 *        description: Bad request
 */

/**
 * @openapi
 * /examples/{id}:
 *  put:
 *    summary: Update the example by the id
 *    tags:
 *      - Example 2
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: The example id
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/example'
 *    responses:
 *      200:
 *        description: The example was updated
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Example'
 *      404:
 *        description: The example was not found
 *      500:
 *        description: Some error happened
 */

/**
 * @openapi
 * /examples/{id}:
 *  patch:
 *    summary: Update the example by the id
 *    tags:
 *      - Example 2
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: The example id
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/example'
 *    responses:
 *      200:
 *        description: The example was updated
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Example'
 *      404:
 *        description: The example was not found
 *      500:
 *        description: Some error happened
 */

/**
 * @openapi
 * /examples/{id}:
 *   delete:
 *     summary: Remove the example by id
 *     tags:
 *       - Example 2
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The example id
 *
 *     responses:
 *       200:
 *         description: The example was deleted
 *       404:
 *         description: The example was not found
 */
