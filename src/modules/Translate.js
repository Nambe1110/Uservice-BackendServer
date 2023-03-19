import translate from "@vitalets/google-translate-api";
import createHttpProxyAgent from "http-proxy-agent";

const agent = createHttpProxyAgent("http://8.210.83.33:80");

export default class Translate {
  static async translate({ input, from, to }) {
    const { text } = await translate.translate(input, {
      from,
      to,
      fetchOptions: { agent },
    });
    return text;
  }
}
