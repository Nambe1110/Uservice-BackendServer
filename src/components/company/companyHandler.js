import { listCompany } from "../../utils/singleton.js";
import UserService from "../user/userService.js";
import logger from "../../config/logger.js";

const getUser = (employees) =>
  Array.from(employees.values()).map((employee) => ({
    id: employee.id,
    first_name: employee.firstName,
    last_name: employee.lastName,
    email: employee.email,
    phone_number: employee.phoneNumber,
    image_url: employee.imageUrl,
    is_online: employee.socketCount > 0,
    disconnect_timestamp: employee.disconnectTimestamp,
  }));

export const registerCompanyHandler = async (io, socket) => {
  try {
    const { user } = socket;
    socket.join(user.company_id);

    const { employees } = listCompany.get(user.company_id);
    const employee = employees.get(user.id);
    ++employee.socketCount;

    if (employee.socketCount === 1)
      io.to(user.company_id).emit("user-status", {
        data: {
          users: getUser(employees),
        },
      });
    else
      socket.emit("user-status", {
        data: {
          users: getUser(employees),
        },
      });

    socket.on("disconnect", () => {
      --employee.socketCount;

      setTimeout(async () => {
        try {
          if (employee.socketCount === 0) {
            const updatedUser = await UserService.updateDisconnectTimestamp(
              user.id
            );
            employee.disconnectTimestamp = updatedUser.disconnect_timestamp;

            io.to(user.company_id).emit("user-status", {
              data: {
                users: getUser(employees),
              },
            });
          }
        } catch (error) {
          logger.error(error.message);
        }
      }, 5000);
    });
  } catch (error) {
    logger.error(error.message);
  }
};
