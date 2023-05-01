import express from "express";
import { verifyToken, verifyRole } from "../../middlewares/index.js";
import {
  createCampaign,
  getCampaignDetails,
  getAllCampaignsOfCompany,
  deleteCampaign,
  updateCampaignDetails,
} from "./campaignController.js";

const campaignRouter = express.Router({ mergeParams: true });

campaignRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Campaign']
  next();
});

campaignRouter.use("/", verifyToken.verifyToken());

campaignRouter.post(
  "/create",
  [verifyToken.verifyToken(), verifyRole.isManagerOrOwner],
  createCampaign
);
campaignRouter.get("/", verifyToken.verifyToken(), getAllCampaignsOfCompany);
campaignRouter.get("/:id", verifyToken.verifyToken(), getCampaignDetails);
campaignRouter.delete(
  "/delete",
  [verifyToken.verifyToken(), verifyRole.isManagerOrOwner],
  deleteCampaign
);
campaignRouter.put(
  "/profile",
  [verifyToken.verifyToken(), verifyRole.isManagerOrOwner],
  updateCampaignDetails
);

export default campaignRouter;
