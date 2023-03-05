import StatusEnum from "../../enums/Status.js";
import customerService from "./customerService.js";

export const getCompanyCustomers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) ?? 20;
    const page = parseInt(req.query.page, 10) ?? 1;
    const members = await customerService.getCompanyCustomers({
      user: req.user,
      limit,
      page,
    });

    return res.status(200).json({ status: StatusEnum.Success, data: members });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};
