import crypto from "crypto";
import MessengerService from "./messengerChannelService.js";
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
    await MessengerService.receiveMessage(body);
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

export const getPages = async (req, res) => {
  const { userId, userAccessToken } = req.body;

  try {
    const pages = await MessengerService.getPages({
      userId,
      userAccessToken,
    });

    return res.status(200).json({ status: StatusType.SUCCESS, data: pages });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};

export const connectPage = async (req, res) => {
  const { pageId, pageAccessToken } = req.body;
  const { user } = req;

  try {
    const page = await MessengerService.connectPage({
      pageId,
      pageAccessToken,
      companyId: user.company_id,
    });

    return res.status(200).json({ status: StatusType.SUCCESS, data: page });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
