import { Worker } from "bullmq";
import logger from "../config/logger.js";
import CampaignService from "../components/campaign/campaignService.js";

export const initilizeWorker = () => {
  /* eslint no-unused-vars: "off" */
  const campaignWorker = new Worker(
    "campaign",
    async (job) => {
      try {
        const { campaignId } = job.data;
        await CampaignService.sendCampaign(campaignId);
      } catch (error) {
        logger.error(error.message);
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
    }
  );
};
