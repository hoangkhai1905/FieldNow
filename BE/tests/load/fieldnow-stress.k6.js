import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const USER_EMAIL = __ENV.USER_EMAIL || 'user@fieldnow.dev';
const USER_PASSWORD = __ENV.USER_PASSWORD || 'password123';
const INCLUDE_SEARCH = (__ENV.INCLUDE_SEARCH || 'false').toLowerCase() === 'true';
const THINK_TIME = Number(__ENV.THINK_TIME || 0.2);

const stage = (duration, target) => ({ duration, target });

export const options = {
  scenarios: {
    api_stress: {
      executor: 'ramping-vus',
      gracefulRampDown: '20s',
      stages: [
        stage(__ENV.RAMP_1 || '1m', Number(__ENV.VUS_1 || 5)),
        stage(__ENV.HOLD_1 || '1m', Number(__ENV.VUS_1 || 5)),
        stage(__ENV.RAMP_2 || '1m', Number(__ENV.VUS_2 || 15)),
        stage(__ENV.HOLD_2 || '2m', Number(__ENV.VUS_2 || 15)),
        stage(__ENV.RAMP_3 || '1m', Number(__ENV.VUS_3 || 30)),
        stage(__ENV.HOLD_3 || '2m', Number(__ENV.VUS_3 || 30)),
        stage(__ENV.RAMP_DOWN || '30s', 0),
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.95'],
    server_errors: ['rate<0.01'],
  },
};

const rateLimited = new Counter('rate_limited');
const serverErrors = new Rate('server_errors');
const detailOk = new Rate('field_detail_ok');
const bookingsOk = new Rate('bookings_ok');

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

const recordStatus = (response) => {
  if (response.status === 429) rateLimited.add(1);
  serverErrors.add(response.status >= 500);
};

const login = () => {
  const response = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD }),
    { headers: jsonHeaders, tags: { name: 'POST /auth/login' } }
  );
  recordStatus(response);

  const data = dataOf(response);
  const token = data && (data.token || data.accessToken);
  check(response, {
    'login returns 200': (res) => res.status === 200,
    'login returns token': () => Boolean(token),
  });
  return token;
};

export function setup() {
  const token = login();
  if (!token) {
    throw new Error(`Could not login as ${USER_EMAIL}. Run prisma seed or pass USER_EMAIL/USER_PASSWORD.`);
  }

  const searchResponse = http.get(
    `${BASE_URL}/fields?page=1&limit=20`,
    { tags: { name: 'SETUP GET /fields' } }
  );
  recordStatus(searchResponse);
  const searchData = dataOf(searchResponse);
  const fields = searchData && Array.isArray(searchData.fields) ? searchData.fields : [];

  if (!fields.length && !__ENV.FIELD_ID) {
    throw new Error('No public fields found. Run prisma seed or pass FIELD_ID.');
  }

  return {
    token,
    fieldIds: __ENV.FIELD_ID ? [__ENV.FIELD_ID] : fields.map((field) => field.id),
  };
}

export default function ({ token, fieldIds }) {
  const authHeaders = {
    ...jsonHeaders,
    Authorization: `Bearer ${token}`,
  };
  const fieldId = fieldIds[(__VU + __ITER) % fieldIds.length];

  group('hot read APIs', () => {
    const detailResponse = http.get(
      `${BASE_URL}/fields/${fieldId}`,
      { tags: { name: 'GET /fields/:id' } }
    );
    recordStatus(detailResponse);
    const field = dataOf(detailResponse);
    detailOk.add(detailResponse.status === 200);
    check(detailResponse, {
      'field detail returns 200': (res) => res.status === 200,
      'field detail has expected id': () => field && field.id === fieldId,
    });

    const meResponse = http.get(
      `${BASE_URL}/auth/me`,
      { headers: authHeaders, tags: { name: 'GET /auth/me' } }
    );
    recordStatus(meResponse);
    check(meResponse, {
      'me returns 200': (res) => res.status === 200,
    });

    const bookingsResponse = http.get(
      `${BASE_URL}/bookings/me?page=1&limit=6`,
      { headers: authHeaders, tags: { name: 'GET /bookings/me' } }
    );
    recordStatus(bookingsResponse);
    const bookingsData = dataOf(bookingsResponse);
    bookingsOk.add(bookingsResponse.status === 200);
    check(bookingsResponse, {
      'my bookings returns 200': (res) => res.status === 200,
      'my bookings has pagination': () => Boolean(bookingsData && bookingsData.pagination),
    });
  });

  if (INCLUDE_SEARCH) {
    group('rate-limited public search', () => {
      const searchResponse = http.get(
        `${BASE_URL}/fields?page=1&limit=12`,
        { tags: { name: 'GET /fields' } }
      );
      recordStatus(searchResponse);
      check(searchResponse, {
        'field search returns 200 or 429': (res) => res.status === 200 || res.status === 429,
      });
    });
  }

  sleep(THINK_TIME);
}
