import { apiRequest } from './axiosClient';

export const apiPaths = {
	auth: {
		login: '/auth/login',
		register: '/auth/register',
		me: '/auth/me',
	},
	otp: {
		send: '/otp/send',
		verify: '/otp/verify',
		resend: '/otp/resend',
	},
	fields: {
		search: '/fields',
		detail: (fieldId) => `/fields/${fieldId}`,
	},
	bookings: {
		create: '/bookings',
		me: '/bookings/me',
		detail: (bookingId) => `/bookings/${bookingId}`,
		cancel: (bookingId) => `/bookings/${bookingId}`,
	},
	payments: {
		initiate: '/payments/initiate',
		detail: (bookingId) => `/payments/${bookingId}`,
		returnUrl: '/payments/vnpay-return',
		ipn: '/payments/vnpay-ipn',
	},
	user: {
		profile: '/users/profile',
	},
	password: {
		forgot: '/password/forgot',
		reset: '/password/reset',
		changeRequest: '/password/change-request',
		change: '/password/change',
	},
	owner: {
		fields: '/owner/fields',
		field: (fieldId) => `/owner/fields/${fieldId}`,
		batchSlots: (fieldId) => `/owner/fields/${fieldId}/slots/batch`,
		slot: (slotId) => `/owner/slots/${slotId}`,
		slotsByField: (fieldId) => `/owner/fields/${fieldId}/slots`,
	},
	admin: {
		approveField: (fieldId) => `/admin/fields/${fieldId}/approve`,
		rejectField: (fieldId) => `/admin/fields/${fieldId}/reject`,
		users: '/admin/users',
		userRole: (userId) => `/admin/users/${userId}/role`,
	},
};

const fallbackFieldImage =
	'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80';

const toNumber = (value) => {
	if (value === null || value === undefined || value === '') return 0;
	return Number(value);
};

const formatDateValue = (value) => {
	if (!value) return '';
	const date = typeof value === 'string' ? value : new Date(value).toISOString();
	return date.slice(0, 10);
};

export const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(toNumber(value))}đ`;

export const normalizeFieldBrief = (field) => ({
	id: field.id,
	name: field.name,
	location: field.location,
	pricePerHour: toNumber(field.price_per_hour ?? field.pricePerHour),
	isActive: field.is_active ?? field.isActive ?? false,
	images: Array.isArray(field.images) ? field.images : [],
	image: Array.isArray(field.images) && field.images.length ? field.images[0] : fallbackFieldImage,
});

export const normalizeSlot = (slot) => ({
	id: slot.id,
	fieldId: slot.field_id ?? slot.fieldId ?? null,
	date: formatDateValue(slot.date),
	startTime: slot.start_time ?? slot.startTime ?? '',
	endTime: slot.end_time ?? slot.endTime ?? '',
	priceOverride: slot.price_override ?? slot.priceOverride ?? null,
	isLocked: slot.is_locked ?? slot.isLocked ?? false,
	createdAt: slot.created_at ?? slot.createdAt ?? null,
	field: slot.field ? normalizeFieldBrief(slot.field) : null,
});

export const normalizeField = (field) => ({
	...normalizeFieldBrief(field),
	ownerId: field.owner_id ?? field.ownerId ?? null,
	description: field.description ?? '',
	createdAt: field.created_at ?? field.createdAt ?? null,
	updatedAt: field.updated_at ?? field.updatedAt ?? null,
	slots: Array.isArray(field.slots) ? field.slots.map(normalizeSlot) : [],
	bookedIntervals: field.bookedIntervals ?? [],
});

export const normalizeBooking = (booking) => ({
	id: booking.id,
	userId: booking.user_id ?? booking.userId ?? null,
	slotId: booking.slot_id ?? booking.slotId ?? null,
	status: booking.status,
	totalPrice: toNumber(booking.total_price ?? booking.totalPrice),
	createdAt: booking.created_at ?? booking.createdAt ?? null,
	updatedAt: booking.updated_at ?? booking.updatedAt ?? null,
	expiresAt: booking.expires_at ?? booking.expiresAt ?? null,
	slot: booking.slot
		? {
				...normalizeSlot(booking.slot),
				field: booking.slot.field ? normalizeFieldBrief(booking.slot.field) : null,
			}
		: null,
});

export const normalizePayment = (payment) => ({
	id: payment.id,
	bookingId: payment.booking_id ?? payment.bookingId ?? null,
	amount: toNumber(payment.amount),
	provider: payment.provider,
	status: payment.status,
	createdAt: payment.created_at ?? payment.createdAt ?? null,
	updatedAt: payment.updated_at ?? payment.updatedAt ?? null,
});

export const normalizeUser = (user) => ({
	id: user.id,
	email: user.email,
	fullName: user.full_name ?? user.fullName ?? '',
	phoneNumber: user.phone_number ?? user.phone ?? '',
	role: user.role,
	createdAt: user.created_at ?? user.createdAt ?? null,
});

export const loginRequest = (payload) => apiRequest({ method: 'POST', url: apiPaths.auth.login, data: payload });

export const registerRequest = (payload) =>
	apiRequest({ method: 'POST', url: apiPaths.auth.register, data: payload });

export const sendOTPRequest = (payload) => 
	apiRequest({ method: 'POST', url: apiPaths.otp.send, data: payload });

export const verifyOTPRequest = (payload) => 
	apiRequest({ method: 'POST', url: apiPaths.otp.verify, data: payload });

export const resendOTPRequest = (payload) => 
	apiRequest({ method: 'POST', url: apiPaths.otp.resend, data: payload });

export const getCurrentUser = async () => {
	const data = await apiRequest({ method: 'GET', url: apiPaths.auth.me });
	return data?.user ? normalizeUser(data.user) : normalizeUser(data);
};

export const searchFields = async (params = {}) => {
	const data = await apiRequest({
		method: 'GET',
		url: apiPaths.fields.search,
		params,
	});

	return {
		fields: (data.fields ?? data ?? []).map(normalizeField),
		pagination: data.pagination ?? null,
	};
};

export const getFieldDetail = async (fieldId, date) => {
	const data = await apiRequest({
		method: 'GET',
		url: apiPaths.fields.detail(fieldId),
		params: date ? { date } : undefined,
	});

	return normalizeField(data);
};

export const createBooking = async (payload) => {
	const data = await apiRequest({
		method: 'POST',
		url: apiPaths.bookings.create,
		data: payload,
	});

	return normalizeBooking(data);
};

export const getMyBookings = async () => {
	const data = await apiRequest({ method: 'GET', url: apiPaths.bookings.me });
	return (Array.isArray(data) ? data : []).map(normalizeBooking);
};

export const getBookingDetail = async (bookingId) => {
	const data = await apiRequest({ method: 'GET', url: apiPaths.bookings.detail(bookingId) });
	return normalizeBooking(data);
};

export const updateProfile = async (data) => {
	const result = await apiRequest({
		method: 'PATCH',
		url: apiPaths.user.profile,
		data,
	});
	return result;
};

export const forgotPassword = async (data) => {
	return await apiRequest({ method: 'POST', url: apiPaths.password.forgot, data });
};

export const resetPassword = async (data) => {
	return await apiRequest({ method: 'POST', url: apiPaths.password.reset, data });
};

export const requestChangePassword = async () => {
	return await apiRequest({ method: 'POST', url: apiPaths.password.changeRequest });
};

export const changePassword = async (data) => {
	return await apiRequest({ method: 'POST', url: apiPaths.password.change, data });
};

export const cancelBooking = async (bookingId) => {
	const data = await apiRequest({ method: 'DELETE', url: apiPaths.bookings.cancel(bookingId) });
	return data;
};

export const initiatePayment = async (bookingId, provider = 'sepay') => {
	console.log('[API] initiatePayment called with:', { bookingId, provider });
	const data = await apiRequest({
		method: 'POST',
		url: apiPaths.payments.initiate,
		data: { bookingId, provider },
	});

	return data;
};

export const getPaymentStatus = async (bookingId) => {
	const data = await apiRequest({ method: 'GET', url: apiPaths.payments.detail(bookingId) });
	return normalizePayment(data);
};

export const verifyVnPayReturn = async (queryParams) => {
	// Forward VNPay return query parameters to backend for verification/processing
	const data = await apiRequest({ method: 'GET', url: apiPaths.payments.returnUrl, params: queryParams });
	return data;
};

export const getOwnerFields = async () => {
	const data = await apiRequest({ method: 'GET', url: apiPaths.owner.fields });
	return (Array.isArray(data) ? data : []).map(normalizeField);
};

export const createOwnerField = async (payload) => {
	const data = await apiRequest({ method: 'POST', url: apiPaths.owner.fields, data: payload });
	return normalizeField(data);
};

export const updateOwnerField = async (fieldId, payload) => {
	const data = await apiRequest({ method: 'PATCH', url: apiPaths.owner.field(fieldId), data: payload });
	return normalizeField(data);
};

export const deleteOwnerField = async (fieldId) =>
	apiRequest({ method: 'DELETE', url: apiPaths.owner.field(fieldId) });

export const createBatchSlots = async (fieldId, slots) => {
	const data = await apiRequest({
		method: 'POST',
		url: apiPaths.owner.batchSlots(fieldId),
		data: { slots },
	});

	return data;
};

export const getOwnerSlotsByField = async (fieldId, date) => {
	const data = await apiRequest({
		method: 'GET',
		url: apiPaths.owner.slotsByField(fieldId),
		params: date ? { date } : undefined,
	});

	return (Array.isArray(data) ? data : []).map(normalizeSlot);
};

export const approveField = async (fieldId) => apiRequest({ method: 'PATCH', url: apiPaths.admin.approveField(fieldId) });

export const rejectField = async (fieldId) => apiRequest({ method: 'PATCH', url: apiPaths.admin.rejectField(fieldId) });

export const getAdminUsers = async () => {
	const data = await apiRequest({ method: 'GET', url: apiPaths.admin.users });
	return (Array.isArray(data) ? data : []).map(normalizeUser);
};

export const updateUserRole = async (userId, role) =>
	apiRequest({ method: 'PATCH', url: apiPaths.admin.userRole(userId), data: { role } });