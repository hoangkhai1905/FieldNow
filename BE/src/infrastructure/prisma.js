const { PrismaClient } = require('@prisma/client');

/**
 * Prisma Client singleton.
 * Connection URL is read from DATABASE_URL env var via schema.prisma datasource block.
 */
const prisma = new PrismaClient();

module.exports = prisma;