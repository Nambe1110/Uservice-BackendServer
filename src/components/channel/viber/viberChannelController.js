import crypto from "crypto";
import ViberService from "./viberChannelService.js";
import { StatusType } from "../../../constants.js";
import logger from "../../../config/logger.js";

export const handleCallback = async (req, res) => {
  const { rawBody, body } = req;
  const { companyId, token } = req.params;
  const signature = req.headers["x-viber-content-signature"];

  try {
    if (body?.event === "webhook") res.sendStatus(200);
    else if (body?.event === "message") {
      const channel = await ViberService.getChannel({ companyId, token });

      if (!signature || !channel) return res.sendStatus(404);

      const expectedHash = crypto
        .createHmac("sha256", token)
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
    } else if (body?.event === "delivered") {
      res.sendStatus(200);
      ViberService.messageSendSucceeded({ body });
    } else res.sendStatus(404);
  } catch (error) {
    logger.error(error.message);
  }
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
