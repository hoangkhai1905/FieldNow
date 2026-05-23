const prisma = require('../infrastructure/prisma');
const config = require('../config');

const FIELD_TYPES = ['FUTSAL', 'BADMINTON', 'BASKETBALL', 'VOLLEYBALL', 'TENNIS'];
const ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED'];

const toDateOnly = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const toTimeOnly = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 5);
  return date.toISOString().slice(11, 16);
};

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  return Number(value);
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
};

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

const parsePriceValue = (rawValue, unit, text) => {
  const normalizedValue = String(rawValue).replace(',', '.');
  const hasThousandsSeparator = /^\d{1,3}(\.\d{3})+$/.test(normalizedValue);
  const numericValue = hasThousandsSeparator
    ? Number(normalizedValue.replace(/\./g, ''))
    : Number(normalizedValue);

  if (Number.isNaN(numericValue)) return null;
  if (
    ['k', 'nghin', 'ngan'].includes(unit) ||
    (numericValue < 1000 && /\/\s*h|\bgio\b|\bgia\b/.test(text))
  ) {
    return Math.round(numericValue * 1000);
  }
  return Math.round(numericValue);
};

const extractFieldType = (message) => {
  const text = normalizeText(message);
  if (text.includes('futsal') || text.includes('bong da')) return 'FUTSAL';
  if (text.includes('cau long') || text.includes('badminton')) return 'BADMINTON';
  if (text.includes('bong ro') || text.includes('basketball')) return 'BASKETBALL';
  if (text.includes('bong chuyen') || text.includes('volleyball')) return 'VOLLEYBALL';
  if (text.includes('tennis') || text.includes('quan vot')) return 'TENNIS';
  return null;
};

const extractDate = (message) => {
  const text = normalizeText(message);
  const explicitDate = String(message).match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (explicitDate) return explicitDate[0];

  const today = new Date();
  if (text.includes('ngay mai') || text.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return toDateOnly(tomorrow);
  }
  if (text.includes('hom nay') || text.includes('today')) return toDateOnly(today);
  return null;
};

const extractLocation = (message) => {
  const text = String(message);
  const locationMatch = text.match(/(?:^|\s)(?:ở|o|tại|tai|gần|gan)\s+([^,.?!\n]{2,40})/i);
  if (!locationMatch) return null;
  return locationMatch[1]
    .replace(/\s+(gia|giá|duoi|dưới|toi da|tối đa|khong qua|không quá|khoang|khoảng|tam|tầm|chi tu|chỉ từ)(?:\s|$).*$/i, '')
    .trim();
};

const extractPriceFilters = (message) => {
  const text = normalizeText(message);
  const priceRegex = /\b(\d+(?:[.,]\d+)?)\s*(k|nghin|ngan|d|dong|vnd)?\s*(?:\/\s*(?:h|gio)|\s*(?:1h|mot gio|moi gio))?/g;
  const priceMatches = [...text.matchAll(priceRegex)];
  const priceMatch = priceMatches.find((match) => {
    const nearbyText = text.slice(Math.max(0, match.index - 16), match.index + match[0].length + 24);
    const explicitUnit = !!match[2] || /\/\s*(h|gio)|\b1h\b|\bmot gio\b|\bmoi gio\b/.test(match[0]);
    const priceContext = /\bgia\b|\bre\b|\bduoi\b|\btoi da\b|\bkhong qua\b|\btam\b|\bkhoang\b|\bchi tu\b/.test(nearbyText);
    const districtContext = /\bquan\s*$/.test(text.slice(Math.max(0, match.index - 8), match.index));

    return !districtContext && (explicitUnit || priceContext);
  });

  if (!priceMatch) return {};

  const price = parsePriceValue(priceMatch[1], priceMatch[2], text);
  if (!price) return {};

  if (includesPriceLowerBound(text)) return { minPrice: price };
  return { maxPrice: price };
};

const includesPriceLowerBound = (text) =>
  /\btu\s+\d|\btren\s+\d|\btoi thieu\s+\d|\bit nhat\s+\d/.test(text);

const asksForPublicFields = (message) => {
  const text = normalizeText(message);
  return includesAny(text, ['de dat', 'dat san', 'san public', 'san cong khai', 'tat ca san', 'tim san gan']);
};

const includesAny = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const sanitizeField = (field) => ({
  id: field.id,
  name: field.name,
  location: field.location,
  type: field.type,
  pricePerHour: toNumber(field.price_per_hour),
  openTime: toTimeOnly(field.open_time),
  closeTime: toTimeOnly(field.close_time),
  isActive: field.is_active,
});

const sanitizeSlot = (slot) => ({
  id: slot.id,
  fieldId: slot.field_id,
  date: toDateOnly(slot.date),
  startTime: toTimeOnly(slot.start_time),
  endTime: toTimeOnly(slot.end_time),
  priceOverride: toNumber(slot.price_override),
  isLocked: slot.is_locked,
});

const sanitizeBooking = (booking, { includeCustomer = false } = {}) => ({
  id: booking.id,
  fieldId: booking.field_id,
  date: toDateOnly(booking.date),
  startTime: toTimeOnly(booking.start_time),
  endTime: toTimeOnly(booking.end_time),
  status: booking.status,
  totalPrice: toNumber(booking.total_price),
  field: booking.field ? sanitizeField(booking.field) : null,
  payment: Array.isArray(booking.payments) && booking.payments.length
    ? sanitizePayment(booking.payments[0])
    : null,
  ...(includeCustomer
    ? {
        customer: {
          id: booking.user_id || null,
        },
      }
    : {}),
});

const sanitizePayment = (payment) => ({
  id: payment.id,
  bookingId: payment.booking_id,
  amount: toNumber(payment.amount),
  provider: payment.provider,
  status: payment.status,
  createdAt: payment.created_at,
});

const buildUserBookingSummary = async (userId) => {
  const [totalBookings, pendingBookings, confirmedBookings, cancelledBookings] = await Promise.all([
    prisma.booking.count({ where: { user_id: userId } }),
    prisma.booking.count({ where: { user_id: userId, status: 'PENDING' } }),
    prisma.booking.count({ where: { user_id: userId, status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { user_id: userId, status: 'CANCELLED' } }),
  ]);

  return {
    totalBookings,
    pendingBookings,
    confirmedBookings,
    cancelledBookings,
  };
};

const buildUserPaymentSummary = async (userId) => {
  const paidBookingWhere = {
    user_id: userId,
    status: { not: 'CANCELLED' },
    payments: { some: { status: 'COMPLETED' } },
  };

  const [paidBookings, pendingPaymentBookings, paidAmount] = await Promise.all([
    prisma.booking.count({ where: paidBookingWhere }),
    prisma.booking.count({
      where: {
        user_id: userId,
        status: { not: 'CANCELLED' },
        payments: { some: { status: 'PENDING' } },
      },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        booking: {
          user_id: userId,
          status: { not: 'CANCELLED' },
        },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    paidBookings,
    pendingPaymentBookings,
    paidAmount: toNumber(paidAmount._sum.amount) || 0,
  };
};

const buildOwnerRevenueSummary = async (ownerId) => {
  const { start, end } = getCurrentMonthRange();
  const completedOwnerPaymentWhere = {
    status: 'COMPLETED',
    booking: { field: { owner_id: ownerId } },
  };
  const monthlyOwnerPaymentWhere = {
    ...completedOwnerPaymentWhere,
    created_at: { gte: start, lt: end },
  };

  const [monthlyRevenue, monthlyCompletedPayments, totalRevenue] = await Promise.all([
    prisma.payment.aggregate({
      where: monthlyOwnerPaymentWhere,
      _sum: { amount: true },
    }),
    prisma.payment.count({ where: monthlyOwnerPaymentWhere }),
    prisma.payment.aggregate({
      where: completedOwnerPaymentWhere,
      _sum: { amount: true },
    }),
  ]);

  return {
    revenueMonthStart: start.toISOString(),
    revenueMonthEnd: end.toISOString(),
    monthlyRevenue: toNumber(monthlyRevenue._sum.amount) || 0,
    monthlyCompletedPayments,
    totalRevenue: toNumber(totalRevenue._sum.amount) || 0,
  };
};

const buildAdminSummary = async (message) => {
  const filters = buildPublicFilters(message);
  const { start, end } = getCurrentMonthRange();
  const bookingDateWhere = filters.date ? { date: new Date(filters.date) } : {};
  const completedMonthlyPaymentWhere = {
    status: 'COMPLETED',
    created_at: { gte: start, lt: end },
  };

  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    userRoleRows,
    totalFields,
    activeFields,
    inactiveFields,
    fieldTypeRows,
    totalBookings,
    pendingBookings,
    confirmedBookings,
    cancelledBookings,
    completedPayments,
    pendingPayments,
    failedPayments,
    expiredPayments,
    monthlyRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { is_active: true } }),
    prisma.user.count({ where: { is_active: false } }),
    prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
      orderBy: { role: 'asc' },
    }),
    prisma.field.count(),
    prisma.field.count({ where: { is_active: true } }),
    prisma.field.count({ where: { is_active: false } }),
    prisma.field.groupBy({
      by: ['type'],
      _count: { _all: true },
      orderBy: { type: 'asc' },
    }),
    prisma.booking.count({ where: bookingDateWhere }),
    prisma.booking.count({
      where: {
        status: 'PENDING',
        ...bookingDateWhere,
      },
    }),
    prisma.booking.count({
      where: {
        status: 'CONFIRMED',
        ...bookingDateWhere,
      },
    }),
    prisma.booking.count({
      where: {
        status: 'CANCELLED',
        ...bookingDateWhere,
      },
    }),
    prisma.payment.count({ where: { status: 'COMPLETED' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.payment.count({ where: { status: 'FAILED' } }),
    prisma.payment.count({ where: { status: 'EXPIRED' } }),
    prisma.payment.aggregate({
      where: completedMonthlyPaymentWhere,
      _sum: { amount: true },
    }),
  ]);

  return {
    filters,
    summary: {
      revenueMonthStart: start.toISOString(),
      revenueMonthEnd: end.toISOString(),
      monthlyRevenue: toNumber(monthlyRevenue._sum.amount) || 0,
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleCounts: userRoleRows.map((row) => ({ role: row.role, count: row._count._all })),
      totalFields,
      activeFields,
      inactiveFields,
      typeCounts: fieldTypeRows.map((row) => ({ type: row.type, count: row._count._all })),
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      completedPayments,
      pendingPayments,
      failedPayments,
      expiredPayments,
    },
  };
};

const buildPublicFilters = (message) => ({
  type: extractFieldType(message),
  date: extractDate(message),
  location: extractLocation(message),
  ...extractPriceFilters(message),
});

const buildFieldWhere = (message, user) => {
  const filters = buildPublicFilters(message);
  const useOwnerScope = user?.role === 'OWNER' && !asksForPublicFields(message);
  const where = useOwnerScope ? { owner_id: user.userId } : { is_active: true };

  if (filters.type) where.type = filters.type;
  if (filters.location) {
    where.location = { contains: filters.location, mode: 'insensitive' };
  }
  if (filters.minPrice || filters.maxPrice) {
    where.price_per_hour = {};
    if (filters.minPrice) where.price_per_hour.gte = filters.minPrice;
    if (filters.maxPrice) where.price_per_hour.lte = filters.maxPrice;
  }

  return {
    filters,
    where,
    fieldScope: useOwnerScope ? 'owner_fields' : 'public_fields',
  };
};

const buildFieldSummary = async (where) => {
  const [totalFields, typeRows] = await Promise.all([
    prisma.field.count({ where }),
    prisma.field.groupBy({
      by: ['type'],
      where,
      _count: { _all: true },
      orderBy: { type: 'asc' },
    }),
  ]);

  return {
    totalFields,
    typeCounts: typeRows.map((row) => ({
      type: row.type,
      count: row._count._all,
    })),
  };
};

const findPublicFields = async (message, user = null) => {
  const { filters, where, fieldScope } = buildFieldWhere(message, user);
  const [fields, summary] = await Promise.all([
    prisma.field.findMany({
      where,
      orderBy: filters.minPrice || filters.maxPrice
        ? [{ price_per_hour: 'asc' }, { created_at: 'desc' }]
        : { created_at: 'desc' },
      take: config.ai.maxContextDocs,
    }),
    buildFieldSummary(where),
  ]);

  return {
    filters,
    fieldScope,
    summary,
    fields: fields.map(sanitizeField),
  };
};

const findFieldTypes = async (message, user = null) => {
  const { filters, where, fieldScope } = buildFieldWhere(message, user);
  const summary = await buildFieldSummary(where);

  return {
    filters,
    fieldScope,
    summary,
    fields: [],
    supportedTypes: FIELD_TYPES,
  };
};

const findFieldAvailability = async (message, user = null) => {
  const { filters, where, fieldScope } = buildFieldWhere(message, user);

  const fields = await prisma.field.findMany({
    where,
    include: {
      slots: {
        where: filters.date ? { date: new Date(filters.date) } : undefined,
        orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
        take: 24,
      },
      bookings: {
        where: {
          status: { in: ACTIVE_BOOKING_STATUSES },
          ...(filters.date ? { date: new Date(filters.date) } : {}),
        },
        orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
        take: 24,
      },
    },
    orderBy: filters.minPrice || filters.maxPrice
      ? [{ price_per_hour: 'asc' }, { created_at: 'desc' }]
      : { created_at: 'desc' },
    take: Math.max(1, Math.min(config.ai.maxContextDocs, 3)),
  });

  return {
    filters,
    fieldScope,
    fields: fields.map((field) => ({
      ...sanitizeField(field),
      slots: field.slots.map(sanitizeSlot),
      bookedIntervals: field.bookings.map((booking) => ({
        id: booking.id,
        date: toDateOnly(booking.date),
        startTime: toTimeOnly(booking.start_time),
        endTime: toTimeOnly(booking.end_time),
        status: booking.status,
      })),
    })),
  };
};

const findUserBookings = async (userId) => {
  const [bookings, summary] = await Promise.all([
    prisma.booking.findMany({
      where: { user_id: userId },
      include: {
        field: true,
        payments: { orderBy: { created_at: 'desc' }, take: 1 },
      },
      orderBy: { created_at: 'desc' },
      take: config.ai.maxContextDocs,
    }),
    buildUserBookingSummary(userId),
  ]);

  return { summary, bookings: bookings.map(sanitizeBooking) };
};

const findUserPaymentStatus = async (userId) => {
  const [bookings, bookingSummary, paymentSummary] = await Promise.all([
    prisma.booking.findMany({
    where: { user_id: userId },
    include: {
      field: true,
      payments: { orderBy: { created_at: 'desc' }, take: 1 },
    },
    orderBy: { created_at: 'desc' },
    take: config.ai.maxContextDocs,
    }),
    buildUserBookingSummary(userId),
    buildUserPaymentSummary(userId),
  ]);

  return { summary: { ...bookingSummary, ...paymentSummary }, bookings: bookings.map(sanitizeBooking) };
};

const findOwnerSchedule = async (ownerId, message) => {
  const filters = buildPublicFilters(message);
  const bookings = await prisma.booking.findMany({
    where: {
      field: { owner_id: ownerId },
      ...(filters.date ? { date: new Date(filters.date) } : {}),
    },
    include: {
      field: true,
      payments: { orderBy: { created_at: 'desc' }, take: 1 },
    },
    orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
    take: config.ai.maxContextDocs,
  });

  const fields = await prisma.field.findMany({
    where: { owner_id: ownerId },
    include: {
      slots: {
        where: filters.date ? { date: new Date(filters.date) } : undefined,
        orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
        take: 12,
      },
    },
    orderBy: { created_at: 'desc' },
    take: config.ai.maxContextDocs,
  });

  return {
    filters,
    fields: fields.map((field) => ({
      ...sanitizeField(field),
      slots: field.slots.map(sanitizeSlot),
    })),
    bookings: bookings.map((booking) => sanitizeBooking(booking, { includeCustomer: true })),
  };
};

const findOwnerCashPayments = async (ownerId) => {
  const payments = await prisma.payment.findMany({
    where: {
      provider: { equals: 'cash', mode: 'insensitive' },
      booking: { field: { owner_id: ownerId } },
    },
    include: {
      booking: {
        include: {
          field: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
    take: config.ai.maxContextDocs,
  });

  return {
    payments: payments.map((payment) => ({
      ...sanitizePayment(payment),
      booking: sanitizeBooking(payment.booking, { includeCustomer: true }),
    })),
  };
};

const findOwnerInsights = async (ownerId, message) => {
  const [schedule, cashPayments, revenueSummary] = await Promise.all([
    findOwnerSchedule(ownerId, message),
    findOwnerCashPayments(ownerId),
    buildOwnerRevenueSummary(ownerId),
  ]);

  const confirmedBookings = schedule.bookings.filter((booking) => booking.status === 'CONFIRMED').length;
  const pendingBookings = schedule.bookings.filter((booking) => booking.status === 'PENDING').length;
  const openSlots = schedule.fields.reduce(
    (total, field) => total + field.slots.filter((slot) => !slot.isLocked).length,
    0
  );

  return {
    ...schedule,
    cashPayments: cashPayments.payments,
    summary: {
      confirmedBookings,
      pendingBookings,
      openSlots,
      pendingCashPayments: cashPayments.payments.filter((payment) => payment.status === 'PENDING').length,
      ...revenueSummary,
    },
  };
};

const findAdminInsights = async (message) => buildAdminSummary(message);

module.exports = {
  FIELD_TYPES,
  findPublicFields,
  findFieldTypes,
  findFieldAvailability,
  findUserBookings,
  findUserPaymentStatus,
  findOwnerSchedule,
  findOwnerCashPayments,
  findOwnerInsights,
  findAdminInsights,
};
