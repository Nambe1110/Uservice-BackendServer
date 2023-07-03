import { Queue } from "bullmq";
import { v4 as uuidv4 } from "uuid";

const campaignQueue = new Queue("campaign", {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

const messageQueue = new Queue("message", {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

export const addJobToCompaignQueue = ({ campaignId, delay }) => {
  campaignQueue.add(
    uuidv4(),
    { campaignId },
    { removeOnComplete: true, delay }
  );
};

export const addJobsToMessageQueue = async (jobs) => {
  await messageQueue.addBulk(
    jobs.map((job) => ({
      name: uuidv4(),
      data: job,
      opts: { removeOnComplete: true },
    }))
  );
};
