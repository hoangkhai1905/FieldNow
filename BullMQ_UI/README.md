# 📊 BullMQ Dashboard - FieldNow Queue Monitoring

Real-time monitoring dashboard for FieldNow background jobs using BullMQ and Bull Board.

## 🚀 Features

- **Queue Monitoring**: View pending, active, completed, and failed jobs in real-time
- **Job Inspector**: Inspect job details, data, and execution logs
- **Job Management**: 
  - Retry failed jobs
  - Delete jobs
  - Clear queues
- **Multi-Queue Support**: Monitor all 3 FieldNow queues:
  - `booking-events` - Immediate post-booking tasks
  - `booking-expiration` - Delayed jobs (15min timeout for unpaid bookings)
  - `notification-email` - Email notifications (OTP, confirmations, cancellations)
- **Upstash Support**: Works seamlessly with Upstash Redis (cloud)

## 📦 Installation

### Prerequisites
- Node.js 14+
- Redis connection (local or Upstash)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Redis connection
# For Upstash: use REDIS_URL
# For local: use REDIS_HOST, REDIS_PORT, etc.
```

## ⚙️ Configuration

### Local Redis
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
PORT=3001
```

### Upstash Redis
```env
REDIS_URL=redis://:password@host:port
PORT=3001
```

> Get your Upstash connection string from: https://console.upstash.com → Your Redis DB → Connect

## 🏃 Running

### Development
```bash
npm run dev  # with nodemon (auto-reload)
```

### Production
```bash
npm start
```

## 🌐 Access

Once running, open your browser:
- **Dashboard**: http://localhost:3001/admin/queues
- **Health Check**: http://localhost:3001/health
- **Home**: http://localhost:3001

## 📖 Usage Guide

### View Queues
1. Open http://localhost:3001/admin/queues
2. Select a queue from the sidebar (booking-events, booking-expiration, notification-email)

### Job States
- **Waiting** ⏳ - Scheduled but not yet running
- **Active** 🔄 - Currently being processed
- **Completed** ✅ - Successfully finished
- **Failed** ❌ - Error during execution
- **Delayed** ⏰ - Waiting for delay to pass (e.g., 15min for booking expiration)

### Job Actions
- **Inspect**: Click a job to see full details (data, attempts, stack trace)
- **Retry**: Re-run a failed job
- **Delete**: Remove a job from the queue
- **Empty**: Clear all jobs of a specific state

## 🔍 Common Operations

### Find a specific booking expiration job
1. Click "booking-expiration" queue
2. Search for booking ID in job data
3. View scheduled expiration time

### Check email sending status
1. Click "notification-email" queue
2. View "Completed" tab for successfully sent emails
3. View "Failed" tab for sending errors

### Inspect OTP sending
1. Go to "notification-email" queue
2. Filter jobs by data (OTP code, user email)
3. Check job logs for SMTP response

## 🐛 Troubleshooting

### Cannot connect to Redis
```
Error: ECONNREFUSED 127.0.0.1:6379
```
**Solution**: 
- Check Redis is running locally: `redis-cli ping`
- Or verify Upstash REDIS_URL is correct
- Or update REDIS_HOST/REDIS_PORT

### Dashboard shows no queues
**Solution**:
- Ensure backend (`npm run dev` in BE folder) is running
- Check that backend is using same Redis connection
- Verify .env REDIS_URL/HOST matches backend

### Jobs not appearing
**Solution**:
- Check backend workers are started: `src/workers/index.js`
- Look at backend logs for job scheduling
- Verify Redis has data: use Upstash Console or `redis-cli KEYS "booking*"`

## 📝 Architecture

```
BullMQ_UI (Dashboard)
    ↓
Express Server (port 3001)
    ↓
Bull Board UI (Web interface)
    ↓
BullMQ Adapters
    ├─ booking-events
    ├─ booking-expiration
    └─ notification-email
    ↓
Redis (Upstash or local)
```

## 🔗 Related

- **Backend Queues**: [BE/src/infrastructure/queue.js](../BE/src/infrastructure/queue.js)
- **Workers**: [BE/src/workers/](../BE/src/workers/)
- **Job Scheduling**: [BE/src/services/booking-side-effect.service.js](../BE/src/services/booking-side-effect.service.js)

## 📚 Documentation

- [BullMQ Docs](https://docs.bullmq.io/)
- [Bull Board Docs](https://github.com/felixmosh/bull-board)
- [Upstash Console](https://console.upstash.com)

## ⚡ Tips

1. **Monitor booking expiration**: Watch the "booking-expiration" queue to ensure unpaid bookings are being auto-cancelled after 15 minutes
2. **Check email failures**: If customers report not receiving emails, check "notification-email" → Failed tab
3. **Debug job data**: Click any job to inspect its full data payload and execution history
4. **Local development**: Run both `npm run dev` in BE (for workers) and `npm run dev` in BullMQ_UI (for dashboard)

## 📄 License

MIT
