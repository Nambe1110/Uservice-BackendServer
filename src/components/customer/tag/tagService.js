import AppError from "../../../utils/AppError.js";
import TagModel from "./tagModel.js";
import CompanyTagModel from "../../company/tag/tagModel.js";
import CustomerModel from "../customerModel.js";
// import CompanyModel from "../../company/companyModel.js";

export default class TagService {
  static async createTag({ user, customerId, companyTagId }) {
    const customer = await CustomerModel.findByPk(customerId);
    if (!customer) {
      throw new AppError("Khách hàng không tồn tại", 400);
    }
    if (customer.company_id !== user.company_id) {
      throw new AppError("Bạn không cùng thuộc công ty với khách hàng", 401);
    }

    const companyTag = await CompanyTagModel.findByPk(companyTagId);
    if (!companyTag) {
      throw new AppError("Company tag không tồn tại", 400);
    }

    if (companyTag.company_id !== user.company_id) {
      throw new AppError("Bạn không thuộc công ty sở hữu company tag", 401);
    }

    const customerTag = await TagModel.findOne({
      where: {
        customer_id: customerId,
        company_tag: companyTagId,
      },
    });
    if (customerTag) {
      throw new AppError("customerTag đã tồn tại", 400);
    }

    const newTag = await TagModel.create({
      customer_id: customerId,
      company_tag: companyTagId,
    });

    const createdTag = await TagModel.findOne({
      where: { id: newTag.id },
      include: { model: CompanyTagModel },
    });

    return createdTag.dataValues;
  }

  static async deleteTag(user, tagId) {
    const tag = await TagModel.findByPk(tagId);
    if (!tag) {
      throw new AppError("Tag không tồn tại", 400);
    }

    const companyTag = await CompanyTagModel.findByPk(tag.company_tag);
    if (companyTag.company_id !== user.company_id) {
      throw new AppError(
        "Bạn phải có quyền 'Manager' hoặc 'Owner' của công ty sở hữu Tag để xóa Tag",
        401
      );
    }
    await tag.destroy();
  }
}
