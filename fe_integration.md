# TÀI LIỆU TÍCH HỢP FRONTEND (FE INTEGRATION GUIDE)

Tài liệu này dành cho team Frontend để cập nhật UI/UX tương thích với bộ API Backend hoàn toàn mới (đã áp dụng kiến trúc Interval-based & Caching).

## 1. Thay đổi API Tìm kiếm Sân (`GET /api/v1/fields`)
- **Backend thay đổi:** Đã áp dụng `tsvector` PostgreSQL (CQRS Read Model) để tìm kiếm full-text tiếng Việt siêu tốc độ và có `X-Cache` từ Redis.
- **Frontend cần làm:**
  - Call API với param `?location=...` (backend hiện dùng `location` cho full-text)
  - Tốc độ response giờ sẽ rất nhanh (dưới 50ms nếu Hit Cache). FE có thể làm tính năng "Search as you type" (Live search dropdown) với `debounce` khoảng 300ms mà không sợ sập server.

## 2. API Chi Tiết Sân (`GET /api/v1/fields/:id`)
- **Backend thay đổi:** Tách biệt dữ liệu Tĩnh (Thông tin sân, giá) được lưu ở Cache, và dữ liệu Động (`bookedIntervals` - các khung giờ đã có người đặt) được query Real-time.
- **Frontend cần làm:**
  - Dữ liệu trả về sẽ có thêm mảng `bookedIntervals` là **list booking objects** (VD: `{ id, date, start_time, end_time, slot_id, status }`).
  - FE cần map lại thành các khoảng thời gian để bôi xám (disable) các ô giờ trên giao diện lịch.

## 3. Chức năng Đặt Sân Tuỳ Chọn (Custom Booking)
- **Backend thay đổi:** Bảng `Booking` giờ lưu trực tiếp `start_time`, `end_time`, `date`. Không còn khái niệm "Slot" cứng nhắc.
- **Frontend cần làm:**
  - **Giao diện cũ (Template Slot):** Vẫn hiển thị các Slot gợi ý của chủ sân. User click vào thì gửi lên cả `slot_id`, `start_time`, `end_time`.
  - **Giao diện mới (Custom Interval):** Thêm tính năng kéo thả (hoặc 2 ô input chọn giờ Từ - Đến). 
  - **Gọi API Đặt sân:** 
    ```json
    POST /api/v1/bookings
    {
      "fieldId": "uuid",
      "date": "2026-05-11",
      "startTime": "14:15",
      "endTime": "15:45"
    }
    ```
  - **Bắt lỗi 409 Conflict:** Nếu user chọn đè lên giờ người khác vừa đặt, BE sẽ trả mã 409. FE cần hiện popup: "Khung giờ này vừa có người đặt mất rồi, bạn chọn giờ khác nhé!"

## 4. Thanh Toán (Payment Strategy)
- **Backend thay đổi:** Đã chuẩn hoá luồng thanh toán qua Strategy Pattern (hỗ trợ SePay/VNPay). Luồng gọi và trả về rất ổn định.
- **Frontend cần làm:**
  - SePay: nhận `checkoutUrl` + `formFields`, FE cần build form POST để redirect.
  - VNPay: nhận `checkoutUrl`, FE redirect trực tiếp.
  - Chuẩn bị sẵn 3 trang UI (Routing): 
    - `/payment/success` (Giao diện xanh lá, rụng pháo hoa)
    - `/payment/cancel` (Giao diện báo huỷ, có nút thử lại)
    - `/payment/error` (Báo lỗi hệ thống)
