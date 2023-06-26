import { Queue } from "bullmq";

const campaignQueue = new Queue("campaign", {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

export const addJobToCompaignQueue = ({ campaignId, delay }) => {
  campaignQueue.add(
    `campaign-${campaignId}`,
    { campaignId },
    { removeOnComplete: true, delay }
  );
};
