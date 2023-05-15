import StatusEnum from "../../../enums/Status.js";
import TagService from "./tagService.js";

export const createTag = async (req, res) => {
  try {
    const { content, color } = req.body;
    const createdTag = await TagService.createTag({
      user: req.user,
      color,
      content,
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

export const getTagDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const tag = await TagService.getTagById({ user, id });

    return res.status(200).json({
      status: StatusEnum.Success,
      data: tag,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const getAllTagsOfCompany = async (req, res) => {
  try {
    const { user } = req;
    const limit = parseInt(req.query.limit ?? 20, 10);
    const page = parseInt(req.query.page ?? 1, 10);
    const tags = await TagService.getAllTagsOfCompany({
      user,
      limit,
      page,
    });

    return res.status(200).json({
      status: StatusEnum.Success,
      data: tags,
    });
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

export const updateTagDetails = async (req, res) => {
  try {
    const { id, color, content } = req.body;

    const updatedTag = await TagService.updateTagDetails({
      user: req.user,
      id,
      color,
      content,
    });
    return res
      .status(200)
      .json({ status: StatusEnum.Success, data: updatedTag });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};
