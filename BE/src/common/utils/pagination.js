const parsePositiveInt = (value, fallback, max) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
};

const parsePagination = (query = {}, defaults = {}) => {
  const page = parsePositiveInt(query.page, defaults.page || 1);
  const limit = parsePositiveInt(query.limit, defaults.limit || 10, defaults.maxLimit || 100);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const buildPagination = ({ page, limit, total }) => ({
  page,
  currentPage: page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

module.exports = {
  parsePagination,
  buildPagination,
};
