import AppError from "../../../utils/AppError.js";
import TagModel from "./tagModel.js";

export default class TagService {
  static async createTag({ user, color, content }) {
    if (!content) {
      throw new AppError("Nội dung tag không thể null", 400);
    }

    const newTag = await TagModel.create({
      color,
      content,
      company_id: user.company_id,
    });

    return newTag.dataValues;
  }

  static async getTagById({ user, id }) {
    const tag = await TagModel.findOne({
      where: { id },
    });
    if (!tag) {
      throw new AppError("Tag không tồn tại", 400);
    }

    if (Number.parseInt(tag.company_id, 10) !== user.company_id) {
      throw new AppError(
        "Bạn phải thuộc công ty sở hữu tag để xem được thông tin chi tiết",
        400
      );
    }

    return tag.dataValues;
  }

  static async getAllTagsOfCompany({ user, limit, page }) {
    const totalItems = await TagModel.count({
      where: { company_id: user.company_id },
    });
    const totalPages = Math.ceil(totalItems / limit);

    const tags = await TagModel.findAll({
      where: { company_id: user.company_id },
      limit,
      offset: limit * (page - 1),
    });

    return {
      total_items: totalItems,
      total_pages: totalPages,
      current_page: page,
      items: tags,
    };
  }

  static async deleteTag(user, tagId) {
    const tag = await TagModel.findByPk(tagId);
    if (!tag) {
      throw new AppError("Tag không tồn tại", 400);
    }
    if (Number.parseInt(tag.company_id, 10) !== user.company_id) {
      throw new AppError(
        "Bạn phải có quyền 'Manager' hoặc 'Owner' của công ty sở hữu Tag để xóa Tag",
        400
      );
    }
    await tag.destroy();
  }

  static async updateTagDetails({ user, id, color, content }) {
    const oldTag = await TagModel.findOne({
      where: { id },
    });
    if (!oldTag) {
      throw new AppError("Tag không tồn tại", 400);
    }
    if (Number.parseInt(oldTag.company_id, 10) !== user.company_id) {
      throw new AppError(
        "Bạn phải có quyền 'Manager' hoặc 'Owner' của công ty sở hữu Tag để cập nhật thông tin Tag",
        400
      );
    }

    if (!content) {
      throw new AppError("Nội dung Tag không thể null", 400);
    }

    oldTag.color = color;
    oldTag.content = content;

    const updatedTag = await oldTag.save();

    return updatedTag.dataValues;
  }
}
