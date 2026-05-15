import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const USER_EMAIL = __ENV.USER_EMAIL || 'user@fieldnow.dev';
const USER_PASSWORD = __ENV.USER_PASSWORD || 'password123';
const SPIKE_VUS = Number(__ENV.SPIKE_VUS || 80);
const INCLUDE_SEARCH = (__ENV.INCLUDE_SEARCH || 'false').toLowerCase() === 'true';

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      gracefulRampDown: '15s',
      stages: [
        { duration: __ENV.WARMUP || '30s', target: Number(__ENV.WARMUP_VUS || 5) },
        { duration: __ENV.SPIKE_RAMP || '10s', target: SPIKE_VUS },
        { duration: __ENV.SPIKE_HOLD || '1m', target: SPIKE_VUS },
        { duration: __ENV.RECOVERY_RAMP || '10s', target: Number(__ENV.RECOVERY_VUS || 5) },
        { duration: __ENV.RECOVERY_HOLD || '1m', target: Number(__ENV.RECOVERY_VUS || 5) },
        { duration: __ENV.RAMP_DOWN || '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.08'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    checks: ['rate>0.92'],
    server_errors: ['rate<0.02'],
    recovery_failures: ['count<1'],
  },
};

const rateLimited = new Counter('rate_limited');
const serverErrors = new Rate('server_errors');
const recoveryFailures = new Counter('recovery_failures');

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

  const response = http.get(
    `${BASE_URL}/fields?page=1&limit=20`,
    { tags: { name: 'SETUP GET /fields' } }
  );
  recordStatus(response);
  const data = dataOf(response);
  const fields = data && Array.isArray(data.fields) ? data.fields : [];

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

  group('spike read path', () => {
    const detailResponse = http.get(
      `${BASE_URL}/fields/${fieldId}`,
      { tags: { name: 'GET /fields/:id' } }
    );
    recordStatus(detailResponse);
    check(detailResponse, {
      'field detail returns 200': (res) => res.status === 200,
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
    check(bookingsResponse, {
      'my bookings returns 200': (res) => res.status === 200,
    });
  });

  if (INCLUDE_SEARCH) {
    const searchResponse = http.get(
      `${BASE_URL}/fields?page=1&limit=12`,
      { tags: { name: 'GET /fields' } }
    );
    recordStatus(searchResponse);
    check(searchResponse, {
      'field search returns 200 or 429': (res) => res.status === 200 || res.status === 429,
    });
  }

  if (__ITER > 0 && __VU <= Number(__ENV.RECOVERY_VUS || 5)) {
    const recoveryResponse = http.get(
      `${BASE_URL}/auth/me`,
      { headers: authHeaders, tags: { name: 'RECOVERY GET /auth/me' } }
    );
    recordStatus(recoveryResponse);
    if (recoveryResponse.status !== 200) {
      recoveryFailures.add(1);
    }
  }

  sleep(Number(__ENV.THINK_TIME || 0.1));
}
