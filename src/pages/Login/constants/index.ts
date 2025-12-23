export const REMEMBERED_USERNAME_KEY = "remembered_username";

export const LOGIN_VALIDATION_RULES = {
  username: [
    { required: true, message: "Vui lòng nhập tên đăng nhập!" },
    { min: 3, message: "Tên đăng nhập phải có ít nhất 3 ký tự!" },
  ],
  password: [
    { required: true, message: "Vui lòng nhập mật khẩu!" },
    { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
  ],
};

export const LOGIN_MESSAGES = {
  success: "Đăng nhập thành công!",
  defaultError: "Đăng nhập thất bại. Vui lòng thử lại.",
  invalidCredentials: "Tên đăng nhập hoặc mật khẩu không đúng.",
  invalidInput: "Thông tin đăng nhập không hợp lệ.",
  accountLocked: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
  networkError: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.",
  unknownError: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
};