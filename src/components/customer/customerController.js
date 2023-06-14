import CustomerService from "./customerService.js";
import { StatusType } from "../../constants.js";

export const getCustomers = async (req, res) => {
  const { user } = req;
  const { page = 1, limit = 20 } = req.query;
  const name = req.query.name ?? null;
  const channel = req.query.channel ?? null;
  const order = req.query.order ?? null;

  try {
    const customers = await CustomerService.getCustomers({
      companyId: user.company_id,
      page: parseInt(page),
      limit: parseInt(limit),
      name,
      channel,
      order,
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

export const getCustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;
    const currentUser = req.user;
    const customer = await CustomerService.getCustomerById({
      currentUser,
      customerId,
    });
    return res.status(200).json({
      status: StatusType.SUCCESS,
      data: customer,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  const { customerId } = req.params;

  try {
    await CustomerService.updateCustomer({
      customerId,
      ...req.body,
    });

    return res.status(200).json({
      status: StatusType.SUCCESS,
      data: null,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
