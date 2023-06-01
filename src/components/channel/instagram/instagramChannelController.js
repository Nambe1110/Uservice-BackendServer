import crypto from "crypto";
import InstagramService from "./instagramChannelService.js";
import { StatusType } from "../../../constants.js";
import logger from "../../../config/logger/index.js";

export const receiveMessage = async (req, res) => {
  const { rawBody, body } = req;
  const signature = req.headers["x-hub-signature-256"];

  if (!signature) return res.sendStatus(404);

  const elements = signature.split("=");
  const signatureHash = elements[1];
  const expectedHash = crypto
    .createHmac("sha256", process.env.FACEBOOK_APP_SECRET)
    .update(rawBody)
    .digest("hex");

  if (signatureHash !== expectedHash) return res.sendStatus(404);

  res.status(200).send("EVENT_RECEIVED");

  try {
    // logger.info(body);
    await InstagramService.receiveMessage(body);
  } catch (error) {
    logger.error(error.message);
  }
};

export const registerWebhook = async (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode &&
    token &&
    mode === "subscribe" &&
    token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN
  )
    return res.status(200).send(challenge);

  res.sendStatus(403);
};

export const connectPages = async (req, res) => {
  const { userId, userAccessToken } = req.body;
  const { user } = req;

  try {
    const page = await InstagramService.connectPages({
      userId,
      userAccessToken,
      companyId: user.company_id,
    });

    return res.status(200).json({ status: StatusType.SUCCESS, data: page });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
