import jwt from "jsonwebtoken";
import AppError from "../../utils/AppError.js";

export default class EmailService {
  static async SendVerifyEmail(user) {
    if (user.is_verified) {
      throw new AppError("Tài khoản đã được kích hoạt", 403);
    }
    // Use email module to send
    const verifyToken = await jwt.sign(user, process.env.VERIFY_TOKEN_SECRET, {
      expiresIn: "1h",
    });

    const htmlVerifyContent = `
      <h1>Xác thực tài khoản</h1>
      Chào <b>${user.first_name} ${user.last_name}</b>, email này được gửi từ hệ thống <b>Uservice</b>. Để xác nhận tài khoản của bạn, vui lòng ấn vào nút xác nhận bên dưới.
      <br>
      <br>
      <div>
      <a href="https://www.uservice.com/activate?verify_token=${verifyToken}" target="_blank">
        <button style="background: #36B7BD; color: white; border: none; padding: 5px 30px; cursor: pointer;">XÁC NHẬN</button>
      </a>
      </div>
      <br>
      Nếu bạn không thực hiện việc đăng ký hay bất kì hành động nào liên quan đế hệ
      thống của chúng tôi, vui lòng bỏ qua emai này. Xin cảm ơn!
      <br >
      <br >
      <b style="font-size: 20px; ">Uservice</b>
      <br>
      <i>Hệ thống cung cấp dịch vụ chăm sóc khách hàng</i>
    `;

    // Use email module to send html content to user's email.
    // eslint-disable-next-line no-console
    console.log(htmlVerifyContent);
  }
}
