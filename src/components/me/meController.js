import StatusEnum from "../../enums/Status.js";

export const getMyProfile = (req, res) => {
  const { user } = req;
  return res.status(200).json({
    status: StatusEnum.Success,
    data: user,
  });
};
