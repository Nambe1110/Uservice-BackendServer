import StatusEnum from "../../../enums/Status.js";
import TagSubscriptionService from "./tagSubscriptionService.js";

export const subscribeTag = async (req, res) => {
  try {
    const { customerId, tagId } = req.body;
    const createdTagSubscription = await TagSubscriptionService.subscribeTag({
      user: req.user,
      customerId,
      tagId,
    });
    return res
      .status(200)
      .json({ status: StatusEnum.Success, data: createdTagSubscription });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const unsubscribeTag = async (req, res) => {
  try {
    const { user } = req;
    const tagSubscriptionId = req.body.id;
    await TagSubscriptionService.unsubscribeTag(user, tagSubscriptionId);
    return res.status(200).json({
      status: StatusEnum.Success,
      data: { message: "Xóa tag thành công" },
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};
