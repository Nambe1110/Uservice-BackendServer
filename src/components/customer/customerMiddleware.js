import CustomerService from "./customerService.js";
import { StatusType } from "../../constants.js";
import AppError from "../../utils/AppError.js";

export const verifyCustomerId = async (req, res, next) => {
  const { user } = req;
  const { customerId } = req.params;

  try {
    const customer = await CustomerService.getCustomerById({ customerId });

    if (customer.length === 0 || customer[0].company_id !== user.company_id) {
      throw new AppError("Customer not found", 404);
    }

    return next();
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
