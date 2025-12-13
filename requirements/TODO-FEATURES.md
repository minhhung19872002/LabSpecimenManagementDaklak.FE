# Danh sách Chức năng Chưa Implement

> Cập nhật: 2025-12-13
> Dựa trên yêu cầu từ file Requirement.docx - Phần mềm StarLab 2025

---

## I. BẢO MẬT, KHÁCH QUAN

### 1.1 Quản trị tài khoản, mật khẩu bảo mật
- **Mức độ ưu tiên:** 🔴 Cao
- **Mô tả:** Tích hợp hệ thống xác thực với backend (IdentityServer/ABP Framework)
- **Chi tiết cần làm:**
  - [ ] Implement login flow với OAuth2/OpenID Connect
  - [ ] Lưu trữ token an toàn (httpOnly cookies hoặc secure storage)
  - [ ] Refresh token mechanism
  - [ ] Logout và clear session
  - [ ] Đổi mật khẩu
  - [ ] Quên mật khẩu / Reset mật khẩu
  - [ ] Chính sách mật khẩu mạnh (độ dài, ký tự đặc biệt, etc.)
- **Files liên quan:**
  - `src/services/authService.ts`
  - `src/pages/Login/Login.tsx`
- **Backend API:**
  - `POST /connect/token`
  - `GET /api/identity/my-profile`

### 1.2 Dữ liệu sai trả về đúng công đoạn xử lý
- **Mức độ ưu tiên:** 🟡 Trung bình
- **Mô tả:** Khi phát hiện dữ liệu sai, hệ thống cho phép rollback về công đoạn trước để xử lý lại
- **Chi tiết cần làm:**
  - [ ] Thiết kế workflow state machine cho từng loại dữ liệu
  - [ ] UI cho phép chọn công đoạn cần quay lại
  - [ ] Ghi nhận lý do rollback
  - [ ] Thông báo cho người phụ trách công đoạn
- **Files liên quan:**
  - `src/pages/TestRequest/`
  - `src/pages/TestResult/`
  - `src/pages/Specimen/`

---

## II. QUY TRÌNH TIẾP NHẬN YÊU CẦU THỬ NGHIỆM

### 2.1 Đính kèm hình ảnh mẫu, biên bản, hồ sơ khách hàng
- **Mức độ ưu tiên:** 🔴 Cao
- **Mô tả:** Tích hợp upload và quản lý file đính kèm với backend
- **Chi tiết cần làm:**
  - [ ] Kết nối FileUpload component với API upload
  - [ ] Lưu trữ file trên server/cloud storage
  - [ ] Preview hình ảnh đã upload
  - [ ] Download file đính kèm
  - [ ] Xóa file đính kèm
  - [ ] Giới hạn kích thước và định dạng file
  - [ ] Nén ảnh trước khi upload (optional)
- **Files liên quan:**
  - `src/components/common/FileUpload.tsx`
  - `src/pages/Specimen/SpecimenCreate.tsx`
  - `src/pages/TestRequest/TestRequestCreate.tsx`
- **Backend API:**
  - `POST /api/app/file/upload`
  - `GET /api/app/file/{id}`
  - `DELETE /api/app/file/{id}`

---

## III. QUY TRÌNH BÁO CÁO KẾT QUẢ THỬ NGHIỆM

### 3.1 Chuyển giao kết quả tự động đến tài khoản khách hàng
- **Mức độ ưu tiên:** 🟡 Trung bình
- **Mô tả:** Tạo portal cho khách hàng xem kết quả thử nghiệm
- **Chi tiết cần làm:**
  - [ ] Tạo trang Customer Portal riêng
  - [ ] Khách hàng đăng nhập bằng tài khoản riêng
  - [ ] Hiển thị danh sách yêu cầu thử nghiệm của khách hàng
  - [ ] Xem chi tiết kết quả thử nghiệm
  - [ ] Tải xuống phiếu báo cáo kết quả (PDF)
  - [ ] Xác minh phiếu báo cáo qua QR code
- **Files cần tạo:**
  - `src/pages/CustomerPortal/`
  - `src/pages/CustomerPortal/CustomerDashboard.tsx`
  - `src/pages/CustomerPortal/CustomerResults.tsx`

### 3.2 Gửi thông báo tự động qua email
- **Mức độ ưu tiên:** 🔴 Cao
- **Mô tả:** Gửi email thông báo tự động khi có sự kiện quan trọng
- **Chi tiết cần làm:**
  - [ ] Email khi tiếp nhận yêu cầu thử nghiệm
  - [ ] Email khi hoàn thành thử nghiệm
  - [ ] Email khi phê duyệt kết quả
  - [ ] Email nhắc nhở khi gần hết hạn TAT
  - [ ] Email thông báo NCR
  - [ ] Template email tiếng Việt
  - [ ] Cấu hình SMTP trong Settings
- **Backend responsibility:** Chủ yếu xử lý ở backend
- **Frontend cần làm:**
  - [ ] UI cấu hình email templates
  - [ ] UI xem lịch sử email đã gửi
  - [ ] Toggle bật/tắt từng loại thông báo

---

## IV. QUY TRÌNH CÔNG VIỆC KHÔNG PHÙ HỢP (NCR)

### 4.1 Phân quyền trách nhiệm, quyền hạn xử lý
- **Mức độ ưu tiên:** 🔴 Cao
- **Mô tả:** Implement hệ thống phân quyền RBAC (Role-Based Access Control)
- **Chi tiết cần làm:**
  - [ ] Định nghĩa các Role (Admin, LabManager, Technician, Reviewer, Approver, Customer)
  - [ ] Định nghĩa các Permission cho từng chức năng
  - [ ] Gán Permission cho Role
  - [ ] Gán Role cho User
  - [ ] UI quản lý Role và Permission
  - [ ] Ẩn/hiện menu theo quyền
  - [ ] Ẩn/hiện button theo quyền
  - [ ] API authorization check
- **Files cần tạo/sửa:**
  - `src/contexts/AuthContext.tsx` - Context lưu thông tin user và permissions
  - `src/components/common/PermissionGuard.tsx` - Component kiểm tra quyền
  - `src/pages/Settings/RoleManagement.tsx`
  - `src/pages/Settings/PermissionManagement.tsx`
- **Danh sách Roles đề xuất:**
  ```
  - Admin: Toàn quyền hệ thống
  - LabManager: Quản lý phòng thí nghiệm
  - Technician: Nhân viên kỹ thuật (nhập kết quả)
  - Reviewer: Người duyệt bước 1
  - Approver: Người phê duyệt bước 2
  - Receptionist: Nhân viên tiếp nhận
  - Customer: Khách hàng (chỉ xem kết quả)
  ```

---

## V. TỔNG KẾT - YÊU CẦU CHUNG

### 5.1 Giao diện cá nhân hóa theo người dùng
- **Mức độ ưu tiên:** 🟢 Thấp
- **Mô tả:** Cho phép người dùng tùy chỉnh giao diện theo sở thích
- **Chi tiết cần làm:**
  - [ ] Chọn theme (Light/Dark mode)
  - [ ] Chọn màu chủ đạo (primary color)
  - [ ] Tùy chỉnh layout sidebar (collapsed by default hoặc không)
  - [ ] Tùy chỉnh số dòng hiển thị mặc định trong bảng
  - [ ] Lưu cài đặt vào localStorage hoặc user profile
  - [ ] Dashboard widgets có thể sắp xếp lại
- **Files cần tạo/sửa:**
  - `src/contexts/ThemeContext.tsx`
  - `src/pages/Settings/UserPreferences.tsx`
  - `src/components/layout/MainLayout.tsx`

### 5.2 Sao lưu dữ liệu tự động
- **Mức độ ưu tiên:** 🟡 Trung bình
- **Mô tả:** Hệ thống backup dữ liệu định kỳ
- **Backend responsibility:** Xử lý hoàn toàn ở backend
- **Frontend cần làm:**
  - [ ] UI xem lịch sử backup
  - [ ] UI cấu hình lịch backup (hàng ngày, hàng tuần)
  - [ ] UI restore từ backup (Admin only)
  - [ ] Hiển thị trạng thái backup gần nhất
- **Files cần tạo:**
  - `src/pages/Settings/BackupManagement.tsx`

---

## VI. TÍNH NĂNG BỔ SUNG (Không có trong requirement nhưng cần thiết)

### 6.1 Xuất báo cáo PDF
- **Mức độ ưu tiên:** 🔴 Cao
- **Mô tả:** Xuất phiếu báo cáo kết quả thử nghiệm ra PDF
- **Chi tiết cần làm:**
  - [ ] Thiết kế template PDF theo mẫu chuẩn
  - [ ] Generate PDF phía client (jsPDF) hoặc server
  - [ ] Đính kèm QR code vào PDF
  - [ ] Chữ ký điện tử (optional)
  - [ ] Watermark cho bản preview
- **Libraries đề xuất:**
  - `jspdf` + `jspdf-autotable`
  - Hoặc generate từ backend

### 6.2 Tìm kiếm nâng cao
- **Mức độ ưu tiên:** 🟡 Trung bình
- **Mô tả:** Tìm kiếm với nhiều tiêu chí, lọc phức tạp
- **Chi tiết cần làm:**
  - [ ] Search box global (tìm theo mã, tên khách hàng, etc.)
  - [ ] Bộ lọc nâng cao cho từng danh sách
  - [ ] Lưu bộ lọc thường dùng
  - [ ] Export kết quả tìm kiếm

### 6.3 Notifications trong app
- **Mức độ ưu tiên:** 🟡 Trung bình
- **Mô tả:** Hiển thị thông báo realtime trong ứng dụng
- **Chi tiết cần làm:**
  - [ ] Icon notification trên header với badge đếm
  - [ ] Dropdown danh sách thông báo
  - [ ] Đánh dấu đã đọc/chưa đọc
  - [ ] Real-time update (SignalR/WebSocket)
- **Files cần tạo:**
  - `src/components/common/NotificationBell.tsx`
  - `src/services/notificationService.ts`

---

## Tổng hợp theo mức độ ưu tiên

### 🔴 Ưu tiên CAO (Cần làm trước)
1. Quản trị tài khoản, mật khẩu bảo mật
2. Phân quyền RBAC
3. Đính kèm file với backend
4. Gửi thông báo email
5. Xuất báo cáo PDF

### 🟡 Ưu tiên TRUNG BÌNH
1. Dữ liệu sai trả về đúng công đoạn
2. Customer Portal
3. Sao lưu dữ liệu
4. Tìm kiếm nâng cao
5. Notifications trong app

### 🟢 Ưu tiên THẤP
1. Giao diện cá nhân hóa

---

## Ghi chú

- Các tính năng đánh dấu **Backend responsibility** cần phối hợp với team backend
- Ưu tiên hoàn thành các tính năng 🔴 Cao trước khi release bản đầu tiên
- Cập nhật file này khi hoàn thành từng tính năng
