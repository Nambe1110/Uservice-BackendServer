export default class AppError extends Error {
  constructor(message, code) {
    super();
    this.message = message;
    this.code = code;
  }
}
