import jwt from "jsonwebtoken";
import AppError from "../../utils/AppError.js";
import { sendEmail } from "../../modules/Email.js";

export default class EmailService {
  static async SendVerifyEmail(user) {
    if (user.is_verified) {
      throw new AppError("Tài khoản đã được kích hoạt", 403);
    }
    // Use email module to send
    const verifyToken = jwt.sign(user, process.env.VERIFY_TOKEN_SECRET, {
      expiresIn: "1h",
    });

    const htmlVerifyContent = `
      Chào <b>${user.first_name} ${user.last_name}</b>, email này được gửi từ hệ thống <b>Uservice</b>. Để xác nhận tài khoản của bạn, vui lòng ấn vào nút xác nhận bên dưới.
      <br>
      <br>
      <div>
      <a href="https://www.uservice.nelify.app/verify/activate?verify_token=${verifyToken}" target="_blank">
        <button style="background: #36B7BD; color: white; border: none; padding: 5px 30px; cursor: pointer;">XÁC NHẬN</button>
      </a>
      </div>
      <br>
      Nếu bạn không thực hiện việc đăng ký hay bất kì hành động nào liên quan đế hệ
      thống của chúng tôi, vui lòng bỏ qua emai này. Xin cảm ơn!
      <br >
      <br >
      <b style="font-size: 17px; ">Uservice</b>
      <br>
      <i>Hệ thống cung cấp dịch vụ chăm sóc khách hàng</i>
    `;

    sendEmail({
      html: htmlVerifyContent,
      to: user.email,
      subject: "[Uservice] Xác thực tài khoản",
    });
  }

  static async SendForgetPasswordEmail(user) {
    const resetPasswordToken = jwt.sign(
      user,
      process.env.RESET_PASSWORD_TOKEN_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const htmlForgetPasswordContent = `
      Chào <b>${user.first_name} ${user.last_name}</b>, email này được gửi từ hệ thống <b>Uservice</b>. Để đặt lại mật khẩu của bạn, vui lòng ấn vào nút ĐẶT LẠI MẬT KHẨU bên dưới.
      <br>
      <br>
      <div>
      <a href="https://www.uservice.nelify.app/verify/activate?token=${resetPasswordToken}" target="_blank">
        <button style="background: #36B7BD; color: white; border: none; padding: 5px 30px; cursor: pointer;">ĐẶT LẠI MẬT KHẨU</button>
      </a>
      </div>
      <br>
      Nếu bạn không thực hiện việc đăng ký hay bất kì hành động nào liên quan đế hệ
      thống của chúng tôi, vui lòng bỏ qua emai này. Xin cảm ơn!
      <br >
      <br >
      <b style="font-size: 17px; ">Uservice</b>
      <br>
      <i>Hệ thống cung cấp dịch vụ chăm sóc khách hàng</i>
    `;

    sendEmail({
      html: htmlForgetPasswordContent,
      to: user.email,
      subject: "[Uservice] Đặt lại mật khẩu",
    });
  }
}
