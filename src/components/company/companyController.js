import RoleEnum from "../../enums/Role.js";
import UserService from "../user/userService.js";
import CompanyService from "./companyService.js";

export const joinCompany = async (req, res) => {
  const { inviteCode } = req.body;
  try {
    const updatedUser = await UserService.joinCompany(inviteCode, req.user);
    return res.status(200).json(updatedUser);
  } catch (error) {
    return res.status(error.code ?? 500).json({ message: error.message });
  }
};

export const createCompany = async (req, res) => {
  const { name } = req.body;
  const { user } = req;
  if (user.company_id != null) {
    return res
      .status(403)
      .json({ message: "User already existed in another company" });
  }
  try {
    const company = CompanyService.getCompanyByName(name);
    if (company) {
      return res
        .status(400)
        .json({ message: "Company's name already existed" });
    }
    const insertedCompany = await CompanyService.insertCompany({
      name,
      imageUrl: undefined,
      inviteCode: Number(new Date()),
    });
    UserService.joinCompany({
      userId: user.id,
      companyId: insertedCompany.id,
      role: RoleEnum.Manager,
    });
    return res.status(200).json(insertedCompany);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
