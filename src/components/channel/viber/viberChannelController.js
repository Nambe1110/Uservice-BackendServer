import crypto from "crypto";
import ViberService from "./viberChannelService.js";
import { StatusType } from "../../../constants.js";
import logger from "../../../config/logger/index.js";

export const handleCallback = async (req, res) => {
  const { rawBody, body } = req;
  const { companyId, token } = req.params;
  const signature = req.headers["x-viber-content-signature"];

  if (body?.event === "webhook") return res.sendStatus(200);
  if (body?.event === "message") {
    const channel = await ViberService.getChannel({ companyId, token });

    if (!signature || !channel) return res.sendStatus(404);

    const expectedHash = crypto
      .createHmac(
        "sha256",
        "510e5e647c67dff8-40f3ddbab6e6845d-cae6105734e3556c"
      )
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedHash) return res.sendStatus(404);

    res.sendStatus(200);

    try {
      await ViberService.receiveMessage({
        body,
        detailChannel: channel,
      });
    } catch (error) {
      logger.error(error.message);
    }
  }
  if (body?.event === "delivered") {
    res.sendStatus(200);
    ViberService.messageSendSucceeded({ body });
  } else return res.sendStatus(404);
};

export const connectChannel = async (req, res) => {
  const { token } = req.body;
  const { user } = req;

  try {
    const channel = await ViberService.connectChannel({
      token,
      companyId: user.company_id,
    });

    res.status(200).json({
      status: StatusType.SUCCESS,
      data: channel,
    });
  } catch (error) {
    res.status(error.code ?? 500).json({
      status: StatusType.ERROR,
      message: error.message,
    });
  }
};
