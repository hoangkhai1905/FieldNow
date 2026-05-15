import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const USER_EMAIL = __ENV.USER_EMAIL || 'user@fieldnow.dev';
const USER_PASSWORD = __ENV.USER_PASSWORD || 'password123';
const SEARCH_LIMIT = Number(__ENV.SEARCH_LIMIT || 12);
const FIELD_TYPES = ['FUTSAL', 'BADMINTON', 'BASKETBALL', 'VOLLEYBALL', 'TENNIS'];

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 2),
      duration: __ENV.DURATION || '1m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    checks: ['rate>0.98'],
    field_search_rate_limited: ['count<1'],
  },
};

const authFailures = new Counter('auth_failures');
const fieldSearchRateLimited = new Counter('field_search_rate_limited');
const usableFieldDetail = new Rate('usable_field_detail');

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const parseJson = (response) => {
  try {
    return response.json();
  } catch {
    return null;
  }
};

const dataOf = (response) => {
  const body = parseJson(response);
  return body && body.data ? body.data : null;
};

const login = () => {
  const response = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD }),
    { headers: jsonHeaders, tags: { name: 'POST /auth/login' } }
  );

  const data = dataOf(response);
  const token = data && (data.token || data.accessToken);
  const ok = check(response, {
    'login returns 200': (res) => res.status === 200,
    'login returns token': () => Boolean(token),
  });

  if (!ok) authFailures.add(1);
  return token;
};

export function setup() {
  const token = login();
  if (!token) {
    throw new Error(`Could not login as ${USER_EMAIL}. Run prisma seed or pass USER_EMAIL/USER_PASSWORD.`);
  }

  const searchResponse = http.get(
    `${BASE_URL}/fields?page=1&limit=1`,
    { tags: { name: 'SETUP GET /fields' } }
  );
  const searchData = dataOf(searchResponse);
  const fields = searchData && Array.isArray(searchData.fields) ? searchData.fields : [];

  return {
    token,
    fieldId: __ENV.FIELD_ID || (fields[0] && fields[0].id) || '',
  };
}

export default function ({ token, fieldId }) {
  const authHeaders = {
    ...jsonHeaders,
    Authorization: `Bearer ${token}`,
  };

  group('public field browsing', () => {
    const type = FIELD_TYPES[__ITER % FIELD_TYPES.length];
    const params = __ITER % 2 === 0
      ? `page=1&limit=${SEARCH_LIMIT}`
      : `page=1&limit=5&type=${type}`;
    const searchResponse = http.get(
      `${BASE_URL}/fields?${params}`,
      { tags: { name: 'GET /fields' } }
    );

    if (searchResponse.status === 429) {
      fieldSearchRateLimited.add(1);
    }

    const data = dataOf(searchResponse);
    const fields = data && Array.isArray(data.fields) ? data.fields : [];

    check(searchResponse, {
      'field search returns 200': (res) => res.status === 200,
      'field search returns list': () => fields.length > 0,
      'field search has pagination': () => Boolean(data && data.pagination && data.pagination.total >= fields.length),
      'field type filter matches when used': () => !params.includes('type=') || fields.every((field) => field.type === type),
    });
  });

  group('field detail', () => {
    if (!fieldId) {
      usableFieldDetail.add(false);
      return;
    }

    const detailResponse = http.get(
      `${BASE_URL}/fields/${fieldId}`,
      { tags: { name: 'GET /fields/:id' } }
    );
    const field = dataOf(detailResponse);

    usableFieldDetail.add(detailResponse.status === 200);
    check(detailResponse, {
      'field detail returns 200': (res) => res.status === 200,
      'field detail has id': () => field && field.id === fieldId,
    });
  });

  group('authenticated user reads', () => {
    const meResponse = http.get(
      `${BASE_URL}/auth/me`,
      { headers: authHeaders, tags: { name: 'GET /auth/me' } }
    );
    check(meResponse, {
      'me returns 200': (res) => res.status === 200,
      'me returns user claims': (res) => Boolean(dataOf(res)),
    });

    const bookingsResponse = http.get(
      `${BASE_URL}/bookings/me?page=1&limit=6`,
      { headers: authHeaders, tags: { name: 'GET /bookings/me' } }
    );
    const bookingsData = dataOf(bookingsResponse);
    check(bookingsResponse, {
      'my bookings returns 200': (res) => res.status === 200,
      'my bookings has pagination': () => Boolean(bookingsData && bookingsData.pagination),
    });
  });

  sleep(Number(__ENV.SLEEP || 8));
}
