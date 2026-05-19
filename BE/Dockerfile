FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

# Final stage
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

ENV NODE_ENV=production

EXPOSE 5000

CMD ["npm", "start"]
