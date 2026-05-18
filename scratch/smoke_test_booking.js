// Simple smoke test script: login -> find field with available slot -> create booking -> initiate payment
const BASE = process.env.BASE || 'http://localhost:5000/api/v1';
const EMAIL = process.env.TEST_EMAIL || 'user@fieldnow.dev';
const PASSWORD = process.env.TEST_PASSWORD || 'password123';

async function post(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: Object.assign({ 'content-type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
    body: JSON.stringify(body),
  });
  return res.json();
}

async function get(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res.json();
}

(async () => {
  try {
    console.log('Login...');
    const login = await post('/auth/login', { email: EMAIL, password: PASSWORD });
    if (!login || !login.data) {
      console.error('Login failed', login);
      process.exit(2);
    }
    const token = login.data.token || login.token;

    console.log('Searching fields...');
    const fieldsRes = await get('/fields?limit=5', token);
    const fields = fieldsRes.data?.fields || fieldsRes.fields || fieldsRes;
    if (!fields || fields.length === 0) {
      console.error('No fields');
      console.dir(fieldsRes);
      process.exit(3);
    }

    // find a field with an available slot
    let chosenSlot = null;
    let chosenField = null;
    for (const f of fields) {
      const detail = await get(`/fields/${f.id}`, token);
      const slots = detail.data?.slots || detail.slots || detail;
      const slot = Array.isArray(slots) ? slots.find(s => !s.is_locked) : null;
      if (slot) {
        chosenSlot = slot;
        chosenField = f;
        break;
      }
    }

    if (!chosenSlot) {
      console.error('No available slot found');
      process.exit(4);
    }

    console.log('Creating booking for slot', chosenSlot.id);
    const bookingRes = await post('/bookings', { slotId: chosenSlot.id }, token);
    console.log('Booking response:', JSON.stringify(bookingRes, null, 2));

    const bookingId = bookingRes.data?.id || bookingRes.id || bookingRes.data?.booking?.id;
    if (!bookingId) {
      console.error('No booking id in response');
      process.exit(5);
    }

    console.log('Initiating payment for booking', bookingId);
    const payRes = await post('/payments/initiate', { bookingId }, token);
    console.log('Payment initiate response:', JSON.stringify(payRes, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error during smoke test', err);
    process.exit(1);
  }
})();
