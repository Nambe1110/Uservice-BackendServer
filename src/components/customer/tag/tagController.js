import StatusEnum from "../../../enums/Status.js";
import TagService from "./tagService.js";

export const createTag = async (req, res) => {
  try {
    const { customerId, companyTagId } = req.body;
    const createdTag = await TagService.createTag({
      user: req.user,
      customerId,
      companyTagId,
    });
    return res
      .status(200)
      .json({ status: StatusEnum.Success, data: createdTag });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const deleteTag = async (req, res) => {
  try {
    const { user } = req;
    const tagId = req.body.id;
    await TagService.deleteTag(user, tagId);
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
