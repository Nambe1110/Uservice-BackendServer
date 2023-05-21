import StatusEnum from "../../enums/Status.js";
import CampaignService from "./campaignService.js";

export const createCampaign = async (req, res) => {
  try {
    const {
      name,
      send_now: sendNow,
      send_date: sendDate,
      content,
      channels,
      attachments,
      tags,
      and_filter: andFilter,
    } = req.body;

    const createdCampaign = await CampaignService.createCampaign({
      user: req.user,
      name,
      sendNow,
      sendDate,
      content,
      channels,
      attachments,
      tags,
      andFilter,
    });
    return res
      .status(200)
      .json({ status: StatusEnum.Success, data: createdCampaign });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const getCampaignDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const campaign = await CampaignService.getCampaignById({ user, id });

    return res.status(200).json({
      status: StatusEnum.Success,
      data: campaign,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const getAllCampaignsOfCompany = async (req, res) => {
  try {
    const { user } = req;
    const name = req.query.name ?? null;
    const limit = parseInt(req.query.limit ?? 20, 10);
    const page = parseInt(req.query.page ?? 1, 10);
    const campaigns = await CampaignService.getAllCampaignsOfCompany({
      user,
      limit,
      page,
      name,
    });

    return res.status(200).json({
      status: StatusEnum.Success,
      data: campaigns,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const { user } = req;
    const campaignId = req.body.id;
    await CampaignService.deleteCampaign(user, campaignId);
    return res.status(200).json({
      status: StatusEnum.Success,
      data: { message: "Xóa chiến dịch thành công" },
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const updateCampaignDetails = async (req, res) => {
  try {
    const { id, name, content, attachments } = req.body;

    const updatedCampaign = await CampaignService.updateCampaignDetails({
      user: req.user,
      id,
      name,
      content,
      attachments,
    });
    return res
      .status(200)
      .json({ status: StatusEnum.Success, data: updatedCampaign });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};
