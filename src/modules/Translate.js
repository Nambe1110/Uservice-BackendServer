import translate from "node-google-translate-skidz";

export default class Translate {
  static async translate({ text, from, to }) {
    const result = await translate({
      text,
      source: from,
      target: to,
    });
    return result.translation;
  }
}
