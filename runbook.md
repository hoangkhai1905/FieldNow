# FieldNow Deployment Runbook

## Overview
This runbook covers the steps to deploy the FieldNow backend infrastructure (Node.js API + BullMQ workers, PostgreSQL, and Redis).

## Prerequisites
- Docker and Docker Compose installed on the host machine.
- Node.js 20+ for local development and build.
- Remote PostgreSQL database (e.g., Supabase, AWS RDS) or a local Docker instance.
- Remote Redis server (e.g., Upstash, ElastiCache) or a local Docker instance.
- Payment integration: VNPay Sandbox credentials (`VNP_TMNCODE`, `VNP_HASHSECRET`).

## Deployment via Docker Compose (Single Node / Local)
1. **Clone the repository.**
   ```bash
   git clone <repo-url>
   cd FieldNow
   ```

2. **Configure Environment Variables.**
   Create a `.env` file in the `BE/` directory by copying `.env.example`:
   ```bash
   cp BE/.env.example BE/.env
   ```
   *Ensure you update `DATABASE_URL` and `REDIS_URL` if not using the local Docker Compose services. Update `JWT_SECRET` and VNPay variables.*

3. **Start the Infrastructure.**
   Run the following from the root directory to build and start the API, DB, and Redis containers:
   ```bash
   docker-compose up -d --build
   ```
   *The `api` service automatically runs Prisma migrations and seeds the database before starting.*

4. **Verify the Deployment.**
   Check the API health endpoint:
   ```bash
   curl http://localhost:5000/health
   ```
   Expected response: `{"status":"OK","timestamp":"..."}`

## Deployment via Traditional Hosting (PM2 / Systemd)

1. **Install Dependencies.**
   ```bash
   cd BE
   npm ci
   ```

2. **Run Migrations.**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

3. **Start with PM2.**
   It is recommended to run the server with a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name "fieldnow-api"
   pm2 save
   pm2 startup
   ```

## Managing Workers
FieldNow integrates BullMQ workers within the main API process by default (see `src/server.js` and `startWorkers()`).
For larger scale deployments, you can decouple the API and the Workers by creating a separate entry point (`src/worker-server.js`) that only executes `startWorkers()` without starting `app.listen()`.

## Environment Variables
Key variables to maintain:
- `DATABASE_URL`: Connection string.
- `REDIS_URL`: Connection string.
- `JWT_SECRET`: Used for Auth.
- `CORS_ORIGIN`: Must be set for production to limit access.
- `VNP_TMNCODE`, `VNP_HASHSECRET`: VNPay integration.

## Troubleshooting
- **Database Connection Errors**: Verify `DATABASE_URL` and check if PostgreSQL is running (`docker ps`).
- **Redis Connection/Lock Errors**: Verify `REDIS_URL`. The app will fail to start if Redis is unavailable.
- **Workers Not Processing**: Check the Redis connection. BullMQ requires Redis to queue and execute tasks.
