import AppError from "../../../utils/AppError.js";
import TagSubscriptionModel from "./tagSubscriptionModel.js";
import TagModel from "../../company/tag/tagModel.js";
import CustomerModel from "../customerModel.js";

export default class TagSubscriptionService {
  static async subscribeTag({ user, customerId, tagId }) {
    const customer = await CustomerModel.findByPk(customerId);
    if (!customer) {
      throw new AppError("Khách hàng không tồn tại", 400);
    }
    if (customer.company_id !== user.company_id) {
      throw new AppError("Bạn không cùng thuộc công ty với khách hàng", 401);
    }

    const tag = await TagModel.findByPk(tagId);
    if (!tag) {
      throw new AppError("Tag không tồn tại", 400);
    }

    if (tag.company_id !== user.company_id) {
      throw new AppError("Bạn không thuộc công ty sở hữu tag", 401);
    }

    const tagSubscription = await TagSubscriptionModel.findOne({
      where: {
        customer_id: customerId,
        tag_id: tagId,
      },
    });
    if (tagSubscription) {
      throw new AppError("tagSubscription đã tồn tại", 400);
    }

    const newTagSubscription = await TagSubscriptionModel.create({
      customer_id: customerId,
      tag_id: tagId,
    });

    const createdTagSubscription = await TagSubscriptionModel.findOne({
      where: { id: newTagSubscription.id },
      include: { model: TagModel },
    });

    return createdTagSubscription.dataValues;
  }

  static async unsubscribeTag(user, tagSubscriptionId) {
    const tagSubscription = await TagSubscriptionModel.findByPk(
      tagSubscriptionId
    );
    if (!tagSubscription) {
      throw new AppError("Tag subscription không tồn tại", 400);
    }

    const tag = await TagModel.findByPk(tagSubscription.tag_id);
    if (tag.company_id !== user.company_id) {
      throw new AppError(
        "Bạn phải có quyền 'Manager' hoặc 'Owner' của công ty sở hữu Tag để xóa unsubscribe tag",
        401
      );
    }
    await tagSubscription.destroy();
  }

  static async getAllTagSubscriptionOfCustomer({ customerId }) {
    const allTagSubscription = await TagSubscriptionModel.findAll({
      where: { customer_id: customerId },
      include: { model: TagModel },
    });

    return allTagSubscription;
  }
}
