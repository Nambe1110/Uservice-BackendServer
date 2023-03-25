import { StatusType } from "../../constants.js";

export const uploadFile = async (req, res) => {
  const { files } = req;

  return res.status(200).json({
    status: StatusType.SUCCESS,
    data: [
      ...files.map((file) => ({
        name: file.originalname,
        url: file.location,
      })),
    ],
  });
};
