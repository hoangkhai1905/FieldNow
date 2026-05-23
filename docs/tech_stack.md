# Tech Stack - FieldNow

Tài liệu này liệt kê các công nghệ đang được sử dụng trong FieldNow và vai trò
của từng công nghệ trong kiến trúc hệ thống.

## 1. Backend (BE)

| Công nghệ | Phiên bản / package | Mục đích | Trạng thái |
| :--- | :--- | :--- | :--- |
| **Node.js** | Node 18+ / 20+ khuyến nghị | Runtime JavaScript cho API server và workers. | Đã sử dụng |
| **Express** | `express ^5.2.1` | Web framework chính để xây REST API. | Đã sử dụng |
| **Prisma** | `prisma ^6.19.3`, `@prisma/client ^6.19.3` | ORM, migration, schema mapping với PostgreSQL. | Đã sử dụng |
| **PostgreSQL** | Supabase-hosted hoặc Docker local | Cơ sở dữ liệu quan hệ chính. | Đã sử dụng |
| **Supabase SDK** | `@supabase/supabase-js ^2.105.1` | Supabase Storage cho upload ảnh sân; database vẫn truy cập qua Prisma/PostgreSQL. | Đã sử dụng |
| **Zod** | `zod ^3.24.0` | Validate request body cho auth, booking, field, slot, OTP, password. | Đã sử dụng |
| **JWT** | `jsonwebtoken ^9.0.3` | Access token cho authentication. | Đã sử dụng |
| **bcryptjs** | `bcryptjs ^3.0.3` | Hash và kiểm tra mật khẩu. | Đã sử dụng |
| **Refresh token repository** | DB table `RefreshToken` | Lưu refresh token dạng hash, hỗ trợ rotation và revoke. | Đã sử dụng |
| **Multer** | `multer ^2.1.1` | Nhận multipart image upload trước khi đưa lên Supabase Storage. | Đã sử dụng |
| **Redis** | `ioredis ^5.10.1` | Booking lock, cache, BullMQ backend. | Đã sử dụng |
| **BullMQ** | `bullmq ^5.76.4` | Delayed expiration job và email notification jobs. | Đã sử dụng |
| **Node-cron** | `node-cron ^4.2.1` | Cron fallback cleanup stale pending bookings. | Đã sử dụng |
| **Nodemailer** | `nodemailer ^8.0.7` | Email OTP, password reset/change, booking notifications. | Đã sử dụng |
| **SePay provider** | `sepay-pg-node ^1.0.0` + custom provider | Online payment initiation và IPN callback handling. | Đã sử dụng |
| **VNPay provider** | custom provider | Provider strategy còn tồn tại cho payment extensibility/sandbox. | Có trong code |
| **Pino** | `pino ^10.3.1`, `pino-http ^11.0.0` | Structured application/request logging. | Đã sử dụng |
| **Swagger / OpenAPI** | `swagger-jsdoc`, `swagger-ui-express` | API documentation ở môi trường development. | Đã sử dụng |
| **Helmet** | `helmet ^8.1.0` | Security headers. | Đã sử dụng |
| **CORS** | `cors ^2.8.6` | Cấu hình origin theo environment. | Đã sử dụng |
| **Compression** | `compression ^1.8.1` | Nén response HTTP. | Đã sử dụng |
| **Express Rate Limit** | `express-rate-limit ^8.4.1` | Rate limit search, OTP, password reset/change. | Đã sử dụng |
| **Groq API** | Native `fetch`, OpenAI-compatible chat completions | AI chatbot read-only, model cấu hình qua `AI_MODEL_NAME`. | Đã sử dụng |
| **Jest** | `jest ^29.7.0` | Unit và integration tests. | Đã sử dụng |
| **Supertest** | `supertest ^7.1.0` | Test HTTP API endpoints. | Đã sử dụng |
| **ESLint** | `eslint ^10.3.0` | Static analysis/lint backend. | Đã sử dụng |
| **k6** | external CLI | Load, stress, spike scripts trong `BE/tests/load`. | Script có sẵn |

Ghi chú:

- Package `redlock` có trong dependency nhưng booking lock hiện tại dùng Redis
  `SET NX PX` kèm Lua compare-token release trong service, chưa dùng Redlock API.
- Backend được tổ chức theo Layered Architecture:
  `routes -> middlewares -> controllers -> services/pipelines -> repositories -> Prisma -> PostgreSQL`.

## 2. Frontend (FE)

| Công nghệ | Phiên bản / package | Mục đích | Trạng thái |
| :--- | :--- | :--- | :--- |
| **React** | `react ^19.2.4`, `react-dom ^19.2.4` | Xây dựng giao diện người dùng. | Đã sử dụng |
| **Vite** | `vite ^8.0.3` | Dev server và production build. | Đã sử dụng |
| **React Router** | `react-router-dom ^7.14.0` | Routing, protected routes, page navigation. | Đã sử dụng |
| **TanStack Query** | `@tanstack/react-query ^5.100.11` | Query cache và fetch state cho các public read flows như trang home/search. | Đã sử dụng |
| **Axios** | `axios ^1.14.0` | API client, auth header interceptor, error normalization. | Đã sử dụng |
| **Framer Motion** | `framer-motion ^12.38.0` | Animation/transitions trong UI. | Đã sử dụng |
| **Lucide React** | `lucide-react ^1.14.0` | Icon library. | Đã sử dụng |
| **Tailwind CSS** | `tailwindcss ^4.2.4`, `@tailwindcss/postcss ^4.2.2` | Styling utility framework / PostCSS pipeline. | Đã sử dụng |
| **PostCSS / Autoprefixer** | `postcss`, `autoprefixer` | CSS processing. | Đã sử dụng |
| **Chatbot Widget** | `FE/src/components/chatbot/ChatbotWidget.jsx` | Floating/mobile-friendly AI widget cho public, user, owner và admin pages. | Đã sử dụng |

Frontend structure:

- `FE/src/api`: Axios client, endpoint paths, response normalization.
- `FE/src/context`: auth context.
- `FE/src/routes`: route config and protected route handling.
- `FE/src/pages`: public, auth, user, owner, admin pages.
- `FE/src/components`: common UI and layout components.
- Owner scheduling UI supports manual slot creation, quick one-day generation,
  and recurring multi-day generation. The recurring flow is frontend
  orchestration over the existing owner batch slot API, not a background job.
- Chatbot UI uses the same Axios auth interceptor, so authenticated requests
  carry the current access token while guests can still ask public/general
  questions.

## 3. Database and Storage

| Công nghệ | Mục đích | Trạng thái |
| :--- | :--- | :--- |
| **PostgreSQL** | Lưu users, fields, slots, bookings, payments, refresh tokens. | Đã sử dụng |
| **Prisma Migrations** | Quản lý schema evolution. | Đã sử dụng |
| **PostgreSQL GIST Exclusion Constraint** | Chặn double booking trên cùng sân/ngày/khung giờ active. | Đã sử dụng |
| **PostgreSQL Full Text Search** | `tsvector` + GIN index cho tìm sân theo location/search vector. | Đã sử dụng |
| **Supabase Storage** | Lưu ảnh sân, backend dùng service role key qua env. | Đã sử dụng |

## 4. Redis, Queue, and Background Jobs

| Thành phần | Mục đích | Trạng thái |
| :--- | :--- | :--- |
| **Redis lock** | Giảm contention khi nhiều người đặt cùng sân/ngày. | Đã sử dụng |
| **Redis cache** | Cache public field search/detail. | Đã sử dụng |
| **BullMQ booking-expiration** | Hủy booking online còn `PENDING` sau 15 phút. | Đã sử dụng |
| **BullMQ notification-email** | Gửi email bất đồng bộ. | Đã sử dụng |
| **Cron cleanup fallback** | Dọn stale pending bookings nếu delayed job bị miss. | Đã sử dụng |

Redis/BullMQ are not responsible for generating owner schedules. Owner manual,
quick, and recurring schedules are written synchronously through the slot API;
queues are reserved for booking expiration, notifications, and cleanup safety.

## 5. AI Chatbot

| Thành phần | Mục đích | Trạng thái |
| :--- | :--- | :--- |
| **`POST /api/v1/chatbot/message`** | Endpoint chatbot request/response thường, không streaming. | Đã sử dụng |
| **`optionalAuthMiddleware`** | Cho phép guest hỏi public/general; nếu token hợp lệ thì scope theo role. | Đã sử dụng |
| **Intent classifier** | Route câu hỏi vào `field_search`, `my_bookings`, `owner_insights`, `admin_insights`, v.v. | Đã sử dụng |
| **Context service allowlist** | Đọc DB read-only theo role, sanitize context trước khi gửi LLM. | Đã sử dụng |
| **Deterministic guards** | Override câu trả lời mâu thuẫn cho field results, booking/payment count, owner/admin revenue. | Đã sử dụng |
| **Groq client** | Gọi Groq Chat Completions bằng native `fetch`, không thêm SDK. | Đã sử dụng |

Default model nên để qua env. Với demo cần chất lượng trả lời tốt hơn, có thể
dùng `llama-3.3-70b-versatile`; nếu ưu tiên latency/chi phí, dùng
`llama-3.1-8b-instant`.

## 6. Infrastructure and DevOps

| Công nghệ | Mục đích | Trạng thái |
| :--- | :--- | :--- |
| **Docker** | Container hóa backend. | Đã sử dụng |
| **Docker Compose** | Chạy local API + PostgreSQL + Redis. | Đã sử dụng |
| **dotenv** | Load environment variables cho local/dev. | Đã sử dụng |
| **GitHub Actions** | Validate Prisma, migrate, test, build Docker image, deploy BE. | Đã sử dụng |
| **AWS Elastic Beanstalk** | Target deploy backend Docker qua workflow `deploy-be-elasticbeanstalk.yml`. | Có trong workflow |
| **GitNexus** | Code intelligence, impact analysis, architecture review. | Đã sử dụng |

Environment variables quan trọng:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `REFRESH_TOKEN_TTL_DAYS`
- `REFRESH_TOKEN_MAX_PER_USER`
- `REDIS_URL`
- `CORS_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `EMAIL_PROVIDER`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SENDGRID_API_KEY`
- `FRONTEND_URL`
- `MAIL_FROM`
- `PAYMENT_PROVIDER`
- `SEPAY_MERCHANT_ID`
- `SEPAY_SECRET_KEY`
- `SEPAY_ENV`
- `SEPAY_SUCCESS_URL`
- `SEPAY_ERROR_URL`
- `SEPAY_CANCEL_URL`
- `VNP_TMNCODE`
- `VNP_HASHSECRET`
- `VNP_URL`
- `VNP_RETURN_URL`
- `GROQ_API_KEY`
- `GROQ_BASE_URL`
- `AI_MODEL_NAME`
- `AI_TEMPERATURE`
- `AI_MAX_TOKENS`
- `GROQ_TIMEOUT_MS`
- `CHATBOT_MAX_CONTEXT_DOCS`

Frontend environment variables:

- `VITE_API_BASE_URL`
- `VITE_API_URL`

## 7. Verification Commands

Backend:

```bash
cd BE
npx prisma validate
npx jest --verbose --runInBand
npx jest --runInBand tests/unit/chatbot.service.test.js tests/unit/chatbot.context.service.test.js
npm run lint
```

Frontend:

```bash
cd FE
npm run build
```

Deploy readiness:

```bash
docker-compose up -d --build
curl http://localhost:5000/health
curl http://localhost:5000/ready
```
