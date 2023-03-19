import CustomerService from "./customerService.js";
import { StatusType } from "../../constants.js";

export const getCustomers = async (req, res) => {
  const { user } = req;
  const { page = 1, limit = 20 } = req.query;

  try {
    const customers = await CustomerService.getCustomers({
      companyId: user.company_id,
      page,
      limit,
    });

    return res.status(200).json({
      status: StatusType.SUCCESS,
      data: customers,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
