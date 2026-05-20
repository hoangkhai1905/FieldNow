# BullMQ Dashboard Integration Guide

This document describes two ways to run the BullMQ Dashboard: **standalone** or **integrated** into the main backend.

## Option 1: Standalone (Recommended for Development)

Run the dashboard as a separate service on a different port.

### Setup

```bash
cd BullMQ_UI
cp .env.example .env
# Edit .env with your Redis connection
npm install
npm run dev
```

### Access
- Dashboard: http://localhost:3001/admin/queues
- Backend API: http://localhost:3000

**Pros:**
- Isolated, doesn't affect main backend
- Can run independently
- Easy to monitor while developing
- Scales separately in production

**Cons:**
- Extra process to manage
- Separate installation

## Option 2: Integrated into Main Backend (Optional)

Integrate the dashboard into your existing Express app in `BE/src/app.js`.

### Setup

1. **Copy queue setup** from `BullMQ_UI/server.js` into your main backend
2. **Add Bull Board to app.js**:

```javascript
// In BE/src/app.js
const { createBullBoard } = require('@bull-board/express');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { bookingEventsQueue, bookingExpirationQueue, emailQueue } = require('./infrastructure/queue');

// ... existing routes ...

// Setup Bull Board
const { router: bullBoardRouter } = createBullBoard({
  queues: [
    new BullAdapter(bookingEventsQueue),
    new BullAdapter(bookingExpirationQueue),
    new BullAdapter(emailQueue),
  ],
  uiConfig: {
    defaultLanguage: 'en',
    title: 'FieldNow - BullMQ Dashboard',
    baseUrl: '/admin/queues',
  },
});

app.use('/admin/queues', bullBoardRouter);
```

3. **Install dependencies in BE:**
```bash
npm install @bull-board/express @bull-board/ui
```

4. **Access:**
- Dashboard: http://localhost:3000/admin/queues (same port as backend)

**Pros:**
- Single process
- Simpler deployment
- Same Redis connection

**Cons:**
- Couples dashboard with main app
- Dashboard traffic affects API performance
- Requires modifying main app code

## Production Deployment

### Standalone (Recommended)
```bash
# Backend
cd BE && npm run start

# Dashboard (separate terminal/process)
cd BullMQ_UI && npm start
```

### Integrated
```bash
cd BE && npm run start
# Dashboard accessible at /admin/queues
```

## Monitoring in Production

### With Upstash
1. Use BullMQ_UI dashboard (standalone or integrated)
2. Also check Upstash Console for low-level monitoring
3. Set up alerts in Upstash for connection issues

### Deployment on AWS/Railway/Render
- Deploy BullMQ_UI as separate service
- Point to same Upstash Redis
- Dashboard accessible via service URL

## Recommendation

**Use Standalone for Development** → Better UX, isolated monitoring

**Choose Integration or Standalone for Production** based on:
- **Standalone**: If you have separate process management (Docker, systemd, etc.)
- **Integrated**: If you want single deployment unit

For most FieldNow scenarios, **Standalone is preferred** because it keeps concerns separated and scales independently.
