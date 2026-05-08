# SePay Payment Gateway Integration

> Tài liệu này mô tả toàn bộ thay đổi khi chuyển từ VNPay sang SePay Cổng Thanh Toán, hướng dẫn test local, go-live, và tích hợp phía Frontend.

---

## 1. Những gì đã thay đổi

### Tổng quan

| Thành phần | Trước (VNPay) | Sau (SePay) |
|---|---|---|
| Provider | `vnpay.provider.js` (crypto + HMAC-SHA512) | `sepay.provider.js` (SDK `sepay-pg-node`) |
| Service | `handleVNPayReturn`, `handleVNPayIpn` | `handleSepayIpn` |
| Controller | `handleVNPayReturn`, `handleVNPayIpn` | `handleSepayIpn` |
| Routes | `GET /vnpay-return`, `GET /vnpay-ipn` | `POST /sepay-ipn` |
| Luồng | Redirect URL → người dùng quay về | Form POST → trang SePay → IPN callback |
| Auth IPN | HMAC-SHA512 query string | `X-Secret-Key` header |

### Files đã tạo / sửa

```
BE/
├── src/
│   ├── providers/
│   │   ├── sepay.provider.js       ← MỚI: wrap sepay-pg-node SDK
│   │   └── vnpay.provider.js       ← CÒN LẠI (có thể xóa)
│   ├── services/
│   │   └── payment.service.js      ← SỬA: dùng sepayProvider, thêm handleSepayIpn
│   ├── controllers/
│   │   └── payment.controller.js   ← SỬA: bỏ VNPay handlers, thêm handleSepayIpn
│   └── routes/
│       └── payment.routes.js       ← SỬA: POST /sepay-ipn, cập nhật Swagger
├── .env                            ← SỬA: thêm SEPAY_*, xóa VNP_*
├── .env.example                    ← SỬA: template SePay
└── package.json                    ← SỬA: thêm sepay-pg-node
```

### API endpoint thay đổi

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/v1/payments/initiate` | Tạo checkout — **response format thay đổi** (xem FE Integration) |
| `POST` | `/api/v1/payments/sepay-ipn` | IPN webhook từ SePay (server-to-server, không có auth JWT) |
| `GET` | `/api/v1/payments/:bookingId` | Lấy chi tiết payment — **không đổi** |
| ~~GET~~ | ~~`/api/v1/payments/vnpay-return`~~ | **Đã xóa** |
| ~~GET~~ | ~~`/api/v1/payments/vnpay-ipn`~~ | **Đã xóa** |

### Luồng thanh toán mới

```
[User bấm "Thanh toán"]
    │
    ▼
POST /api/v1/payments/initiate  { bookingId }
    │
    ▼  BE trả về:
    {
      checkoutUrl: "https://pay.sepay.vn/v1/checkout/init",
      formFields:  { merchant, operation, signature, ... },
      paymentId:   "uuid"
    }
    │
    ▼  FE tạo hidden form + auto-submit
[Trang SePay — User quét QR / nhập thẻ]
    │
    ├──► Thành công → redirect về SEPAY_SUCCESS_URL
    ├──► Thất bại   → redirect về SEPAY_ERROR_URL
    └──► Hủy       → redirect về SEPAY_CANCEL_URL
    │
    ▼  (song song, server-to-server)
POST /api/v1/payments/sepay-ipn  ← SePay gọi vào BE
    │
    ▼  BE verify X-Secret-Key → cập nhật DB:
    payment.status  = COMPLETED | FAILED
    booking.status  = CONFIRMED | PENDING
    emailQueue.add('email.booking_confirmed', ...)
```

---

## 2. Test Local

### 2.1 Cấu hình `.env`

Mở `BE/.env`, kiểm tra section Payment:

```env
PAYMENT_PROVIDER=sepay
SEPAY_ENV=production
SEPAY_MERCHANT_ID=SP-LIVE-NH784885
SEPAY_SECRET_KEY=spsk_live_6krHF5du2tfvuD2LknsAgnPK3FyRzidZ

# Sẽ cập nhật sau khi có ngrok URL:
SEPAY_IPN_URL=https://xxxx.ngrok.io/api/v1/payments/sepay-ipn

SEPAY_SUCCESS_URL=http://localhost:3000/payment/success
SEPAY_ERROR_URL=http://localhost:3000/payment/error
SEPAY_CANCEL_URL=http://localhost:3000/payment/cancel
```

### 2.2 Chạy server

```bash
cd BE
npm run dev
```

### 2.3 Expose local server qua ngrok

SePay **phải** gọi được vào IPN endpoint qua HTTPS public URL. Dùng ngrok:

```bash
# Cài ngrok nếu chưa có: https://ngrok.com/download
ngrok http 5000
```

Ngrok sẽ cấp URL dạng `https://xxxx.ngrok-free.app`.  
Cập nhật `.env`:

```env
SEPAY_IPN_URL=https://xxxx.ngrok-free.app/api/v1/payments/sepay-ipn
```

Khởi động lại server sau khi đổi `.env`.

### 2.4 Cấu hình IPN trên SePay Dashboard

1. Vào [my.sepay.vn](https://my.sepay.vn) → đăng nhập
2. **Cổng thanh toán** → **Cấu hình** → **IPN**
3. Nhập URL: `https://xxxx.ngrok-free.app/api/v1/payments/sepay-ipn`
4. **Auth type**: chọn `SECRET_KEY`
5. Lưu cấu hình

### 2.5 Thử tạo checkout (curl / Postman)

```bash
# 1. Đăng nhập lấy JWT
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 2. Initiate payment
curl -X POST http://localhost:5000/api/v1/payments/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"bookingId":"<UUID_CỦA_BOOKING_PENDING>"}'
```

Response mong đợi:

```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://pay.sepay.vn/v1/checkout/init",
    "formFields": {
      "merchant": "SP-LIVE-NH784885",
      "operation": "PURCHASE",
      "payment_method": "BANK_TRANSFER",
      "order_invoice_number": "<bookingId>",
      "order_amount": "150000",
      "currency": "VND",
      "order_description": "Payment for booking <bookingId>",
      "success_url": "http://localhost:3000/payment/success",
      "error_url": "http://localhost:3000/payment/error",
      "cancel_url": "http://localhost:3000/payment/cancel",
      "signature": "<hmac-sha256-signed>"
    },
    "paymentId": "<uuid>"
  }
}
```

### 2.6 Test IPN thủ công

Dùng curl để giả lập SePay gọi IPN về BE:

```bash
curl -X POST http://localhost:5000/api/v1/payments/sepay-ipn \
  -H "Content-Type: application/json" \
  -H "X-Secret-Key: spsk_live_6krHF5du2tfvuD2LknsAgnPK3FyRzidZ" \
  -d '{
    "timestamp": 1700000000,
    "notification_type": "ORDER_PAID",
    "order": {
      "order_invoice_number": "<BOOKING_ID_HỢP_LỆ>",
      "order_status": "CAPTURED",
      "order_amount": "150000.00",
      "order_currency": "VND"
    },
    "transaction": {
      "transaction_status": "APPROVED",
      "payment_method": "BANK_TRANSFER",
      "transaction_amount": "150000"
    }
  }'
```

Response mong đợi:

```json
{ "success": true }
```

Kiểm tra DB: `payment.status` = `COMPLETED`, `booking.status` = `CONFIRMED`.

### 2.7 Test thanh toán thật qua trang SePay

Sử dụng công cụ [Thanh toán thử](https://developer.sepay.vn/vi/thanh-toan-demo) hoặc:

1. Dùng response từ bước 2.5, copy `checkoutUrl` + `formFields`
2. Tạo HTML form tạm:

```html
<form id="f" action="https://pay.sepay.vn/v1/checkout/init" method="POST">
  <!-- paste từng field từ formFields vào đây -->
  <input type="hidden" name="merchant" value="SP-LIVE-NH784885"/>
  <!-- ... -->
</form>
<script>document.getElementById('f').submit();</script>
```

3. Mở file trên trình duyệt → sẽ redirect sang trang SePay để thanh toán QR

---

## 3. Khi đã có Server Public (Deploy)

### 3.1 Cập nhật biến môi trường trên server

```env
SEPAY_ENV=production
SEPAY_MERCHANT_ID=SP-LIVE-NH784885
SEPAY_SECRET_KEY=spsk_live_6krHF5du2tfvuD2LknsAgnPK3FyRzidZ
SEPAY_IPN_URL=https://api.fieldnow.com/api/v1/payments/sepay-ipn
SEPAY_SUCCESS_URL=https://fieldnow.com/payment/success
SEPAY_ERROR_URL=https://fieldnow.com/payment/error
SEPAY_CANCEL_URL=https://fieldnow.com/payment/cancel
```

### 3.2 Cập nhật IPN URL trên SePay Dashboard

1. Vào [my.sepay.vn](https://my.sepay.vn) → **Cổng thanh toán** → **Cấu hình** → **IPN**
2. Cập nhật URL thành: `https://api.fieldnow.com/api/v1/payments/sepay-ipn`
3. Lưu cấu hình

> **Lưu ý:** IPN URL phải là **HTTPS** và phải trả về HTTP 200 trong vòng 30 giây.  
> SePay sẽ retry nếu không nhận được 200.

### 3.3 Whitelist IP SePay (nếu server có firewall)

Xem danh sách IP SePay tại: [developer.sepay.vn/vi/dia-chi-ip](https://developer.sepay.vn/vi/dia-chi-ip)  
Cho phép các IP đó truy cập vào port của server BE.

### 3.4 Kiểm tra IPN sau deploy

```bash
# Gọi IPN từ server public để xác nhận endpoint hoạt động
curl -X POST https://api.fieldnow.com/api/v1/payments/sepay-ipn \
  -H "Content-Type: application/json" \
  -H "X-Secret-Key: spsk_live_6krHF5du2tfvuD2LknsAgnPK3FyRzidZ" \
  -d '{"notification_type":"TEST","order":{"order_invoice_number":"test"},"transaction":{"transaction_status":"TEST"}}'
```

> Response sẽ là `{"success":false,...}` vì booking "test" không tồn tại — nhưng endpoint accessible là OK.

---

## 4. Frontend Integration

### 4.1 Response mới từ `POST /payments/initiate`

Trước đây (VNPay) trả về `paymentUrl` → FE redirect thẳng.  
Giờ (SePay) trả về `checkoutUrl` + `formFields` → FE phải **tạo form và submit**.

```ts
// Kiểu dữ liệu
interface InitiatePaymentResponse {
  success: boolean;
  data: {
    checkoutUrl: string;       // URL form action
    formFields: Record<string, string>;  // hidden inputs
    paymentId: string;
  };
}
```

### 4.2 Hàm submit form (Vanilla JS / React)

```ts
/**
 * Redirect user to SePay payment page.
 * Creates a hidden form and auto-submits it.
 */
function redirectToSePay(checkoutUrl: string, formFields: Record<string, string>) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkoutUrl;
  form.style.display = 'none';

  Object.entries(formFields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
```

### 4.3 Ví dụ sử dụng trong React

```tsx
const handlePay = async (bookingId: string) => {
  try {
    const res = await fetch('/api/v1/payments/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingId }),
    });

    const { data } = await res.json();

    // Lưu paymentId vào state nếu cần theo dõi
    setCurrentPaymentId(data.paymentId);

    // Redirect user sang trang SePay
    redirectToSePay(data.checkoutUrl, data.formFields);
  } catch (err) {
    console.error('Lỗi khởi tạo thanh toán:', err);
  }
};
```

### 4.4 Xử lý các trang kết quả

SePay redirect user về 3 URL sau khi hoàn tất:

| URL | Khi nào | Ghi chú |
|---|---|---|
| `SEPAY_SUCCESS_URL` | User thanh toán thành công | **Chỉ hiển thị UI** — đừng confirm booking tại đây |
| `SEPAY_ERROR_URL` | Thanh toán thất bại | Cho phép user thử lại |
| `SEPAY_CANCEL_URL` | User bấm Hủy | Quay về trang booking |

> ⚠️ **Quan trọng:** Đừng dùng `success_url` để xác nhận booking.  
> Booking chỉ được xác nhận qua **IPN** (server-to-server). User có thể đóng tab trước khi redirect.  
> FE nên **poll** `GET /api/v1/payments/:bookingId` để lấy trạng thái thực tế.

### 4.5 Trang Success — Poll trạng thái

```tsx
// pages/payment/success.tsx
const PaymentSuccess = () => {
  const [status, setStatus] = useState<'loading' | 'confirmed' | 'pending'>('loading');
  const bookingId = useSearchParams().get('bookingId'); // nếu FE truyền bookingId vào success_url

  useEffect(() => {
    if (!bookingId) return;

    // Poll mỗi 2s, tối đa 10 lần
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const res = await fetch(`/api/v1/payments/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data } = await res.json();

      if (data.status === 'COMPLETED') {
        setStatus('confirmed');
        clearInterval(interval);
      } else if (attempts >= 10) {
        setStatus('pending'); // IPN chưa về, thông báo user chờ
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [bookingId]);

  if (status === 'confirmed') return <div>✅ Đặt sân thành công! Email xác nhận đã được gửi.</div>;
  if (status === 'pending')   return <div>⏳ Đang xử lý thanh toán, vui lòng chờ...</div>;
  return <div>🔄 Đang kiểm tra kết quả...</div>;
};
```

### 4.6 Truyền `bookingId` vào redirect URL (tuỳ chọn)

Để FE biết booking nào vừa thanh toán, cập nhật `.env`:

```env
SEPAY_SUCCESS_URL=https://fieldnow.com/payment/success?bookingId=ORDER_INVOICE_NUMBER
SEPAY_ERROR_URL=https://fieldnow.com/payment/error?bookingId=ORDER_INVOICE_NUMBER
```

> SePay **không** tự động thêm query params vào redirect URL. Hiện tại `order_invoice_number` = `bookingId` → FE có thể lấy từ state/localStorage nếu cần.

---

## 5. Checklist Trước Khi Go-Live

- [ ] `SEPAY_IPN_URL` đã trỏ về HTTPS server thật
- [ ] IPN URL đã được cấu hình tại my.sepay.vn
- [ ] `SEPAY_SUCCESS_URL`, `SEPAY_ERROR_URL`, `SEPAY_CANCEL_URL` đã trỏ về domain FE thật
- [ ] Test IPN thủ công (curl) → booking status cập nhật đúng
- [ ] Test thanh toán thật qua trang SePay (QR hoặc thẻ)
- [ ] FE đã dùng form-submit thay vì redirect URL
- [ ] FE trang Success đã poll `/payments/:bookingId` để confirm status
- [ ] Email xác nhận booking gửi đúng sau khi IPN về
