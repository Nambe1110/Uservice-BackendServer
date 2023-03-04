// Api document

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Auth API
 */

/**
 * @openapi
 * '/api/auth/login':
 *  post:
 *    tags:
 *      - Auth
 *    summary: Login and get access token and refresh token
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *                description: User's email.
 *                example: trantanloc2111@gmail.com
 *              password:
 *                type: string
 *                description: User's password.
 *                example: Default example
 *    responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: string
 *                  example: success
 *                data:
 *                  $ref: '#/components/schemas/Token'
 *      400:
 *        description: Bad request
 *      403:
 *        description: Unauthorized
 */

/**
 * @openapi
 * '/api/auth/signup':
 *  post:
 *    tags:
 *      - Auth
 *    summary: Signup and get user profile just signed up
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *                description: User's email.
 *                example: trantanloc2111@gmail.com
 *              password:
 *                type: string
 *                description: User's password.
 *                example: Default example
 *              first_name:
 *                type: string
 *                description: User's first name
 *              last_name:
 *                type: string
 *                description: User's last name
 *    responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: string
 *                  example: success
 *                data:
 *                  $ref: '#/components/schemas/User'
 *      400:
 *        description: Bad request
 *      403:
 *        description: Unauthorized
 */
