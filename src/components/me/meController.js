import StatusEnum from "../../enums/Status.js";

export const getProfile = (req, res) => {
  const { user } = req;
  return res.status(200).json({
    status: StatusEnum.Success,
    data: { user },
  });
};
