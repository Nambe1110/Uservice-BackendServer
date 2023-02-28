export default class AppError extends Error {
  constructor(message, code, errors) {
    super();
    this.message = message;
    this.code = code;
    this.errors = errors;
  }
}
