import translate from "translate-google";

export default class Translate {
  static async translate({ text, from, to }) {
    return translate(text, {
      from,
      to,
    });
  }
}
