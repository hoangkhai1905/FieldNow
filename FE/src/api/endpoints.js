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
	},
	chatbot: {
		message: '/chatbot/message',
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
		toggleStatus: (fieldId) => `/owner/fields/${fieldId}/toggle-status`,
		bookings: '/owner/bookings',
		cashPayments: '/owner/payments/cash',
		confirmCashPayment: (bookingId) => `/owner/payments/${bookingId}/confirm-cash`,
		rejectBooking: (bookingId) => `/owner/bookings/${bookingId}/reject`,
		stats: '/owner/stats',
	},
	admin: {
		stats: '/admin/stats',
		fields: '/admin/fields',
		approveField: (fieldId) => `/admin/fields/${fieldId}/approve`,
		rejectField: (fieldId) => `/admin/fields/${fieldId}/reject`,
		users: '/admin/users',
		userRole: (userId) => `/admin/users/${userId}/role`,
		userStatus: (userId) => `/admin/users/${userId}/status`,
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

const formatTimeValue = (value) => {
	if (!value) return '';
	const time = typeof value === 'string' ? value : new Date(value).toISOString();
	return time.includes('T') ? time.split('T')[1].slice(0, 5) : time.slice(0, 5);
};

export const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(toNumber(value))}đ`;

const normalizePhoneForZalo = (phoneNumber) => {
	if (!phoneNumber) return '';
	return String(phoneNumber).replace(/\D/g, '');
};

export const buildZaloUrlFromPhoneNumber = (phoneNumber) => {
	const normalizedPhone = normalizePhoneForZalo(phoneNumber);
	return normalizedPhone ? `https://zalo.me/${normalizedPhone}` : '';
};

export const normalizeFieldBrief = (field) => ({
	id: field.id,
	name: field.name,
	location: field.location,
	pricePerHour: toNumber(field.price_per_hour ?? field.pricePerHour),
	type: field.type ?? 'FUTSAL',
	isActive: field.is_active ?? field.isActive ?? false,
	images: Array.isArray(field.images) ? field.images : [],
	image: Array.isArray(field.images) && field.images.length ? field.images[0] : fallbackFieldImage,
	ownerId: field.owner_id ?? field.ownerId ?? field.owner?.id ?? null,
	ownerPhoneNumber: field.owner?.phone_number ?? field.owner?.phoneNumber ?? field.owner_phone_number ?? field.ownerPhoneNumber ?? '',
});

export const normalizeSlot = (slot) => ({
	id: slot.id,
	fieldId: slot.field_id ?? slot.fieldId ?? null,
	date: formatDateValue(slot.date),
	startTime: formatTimeValue(slot.start_time ?? slot.startTime ?? ''),
	endTime: formatTimeValue(slot.end_time ?? slot.endTime ?? ''),
	priceOverride: slot.price_override ?? slot.priceOverride ?? null,
	isLocked: slot.is_locked ?? slot.isLocked ?? false,
	createdAt: slot.created_at ?? slot.createdAt ?? null,
	field: slot.field ? normalizeFieldBrief(slot.field) : null,
});

export const normalizeField = (field) => ({
	...normalizeFieldBrief(field),
	description: field.description ?? '',
	openTime: formatTimeValue(field.open_time ?? field.openTime),
	closeTime: formatTimeValue(field.close_time ?? field.closeTime),
	open_time: formatTimeValue(field.open_time ?? field.openTime),
	close_time: formatTimeValue(field.close_time ?? field.closeTime),
	createdAt: field.created_at ?? field.createdAt ?? null,
	updatedAt: field.updated_at ?? field.updatedAt ?? null,
	slots: Array.isArray(field.slots) ? field.slots.map(normalizeSlot) : [],
	bookedIntervals: field.bookedIntervals ?? [],
});

export const normalizeBooking = (booking) => ({
	id: booking.id,
	userId: booking.user_id ?? booking.userId ?? null,
	fieldId: booking.field_id ?? booking.fieldId ?? null,
	slotId: booking.slot_id ?? booking.slotId ?? null,
	date: formatDateValue(booking.date ?? booking.slot?.date),
	startTime: formatTimeValue(booking.start_time ?? booking.startTime ?? booking.slot?.start_time ?? booking.slot?.startTime),
	endTime: formatTimeValue(booking.end_time ?? booking.endTime ?? booking.slot?.end_time ?? booking.slot?.endTime),
	status: booking.status,
	totalPrice: toNumber(booking.total_price ?? booking.totalPrice),
	createdAt: booking.created_at ?? booking.createdAt ?? null,
	updatedAt: booking.updated_at ?? booking.updatedAt ?? null,
	expiresAt: booking.expires_at ?? booking.expiresAt ?? null,
	field: booking.field ? normalizeFieldBrief(booking.field) : null,
	user: booking.user
		? {
				fullName: booking.user.full_name ?? booking.user.fullName ?? '',
				phoneNumber: booking.user.phone_number ?? booking.user.phoneNumber ?? '',
				email: booking.user.email ?? '',
			}
		: null,
	payments: Array.isArray(booking.payments) ? booking.payments.map(normalizePayment) : [],
	payment: booking.payment ? normalizePayment(booking.payment) : (
		Array.isArray(booking.payments) && booking.payments.length ? normalizePayment(booking.payments[0]) : null
	),
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

export const normalizeCashPayment = (payment) => ({
	...normalizePayment(payment),
	booking: payment.booking ? normalizeBooking(payment.booking) : null,
	user: payment.booking?.user ?? null,
	field: payment.booking?.field ? normalizeFieldBrief(payment.booking.field) : null,
});

export const normalizeUser = (user) => ({
	id: user.id,
	email: user.email,
	fullName: user.full_name ?? user.fullName ?? '',
	phoneNumber: user.phone_number ?? user.phone ?? '',
	role: user.role,
	isActive: user.is_active ?? user.isActive ?? true,
	deactivatedAt: user.deactivated_at ?? user.deactivatedAt ?? null,
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

export const getMyBookings = async (params = {}) => {
	const data = await apiRequest({ method: 'GET', url: apiPaths.bookings.me, params });
	const rawBookings = Array.isArray(data) ? data : data.bookings ?? [];
	return {
		bookings: rawBookings.map(normalizeBooking),
		pagination: data.pagination ?? null,
	};
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

export const resetPassword = async (payload) => {
	const { email, otp, newPassword } = payload;
	return await apiRequest({ 
		method: 'POST', 
		url: apiPaths.password.reset, 
		data: { email, otp_code: otp, new_password: newPassword } 
	});
};

export const requestChangePassword = async () => {
	return await apiRequest({ method: 'POST', url: apiPaths.password.changeRequest });
};

export const changePassword = async (payload) => {
	const { otp, newPassword } = payload;
	return await apiRequest({ 
		method: 'POST', 
		url: apiPaths.password.change, 
		data: { otp_code: otp, new_password: newPassword } 
	});
};

export const cancelBooking = async (bookingId) => {
	const data = await apiRequest({ method: 'DELETE', url: apiPaths.bookings.cancel(bookingId) });
	return data;
};

export const initiatePayment = async (bookingId, provider = 'sepay') => {
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

export const sendChatbotMessage = async (message) => {
	const data = await apiRequest({
		method: 'POST',
		url: apiPaths.chatbot.message,
		data: { message },
	});

	return data;
};

export const getOwnerFields = async (params = {}) => {
	const data = await apiRequest({ method: 'GET', url: apiPaths.owner.fields, params });
	const rawFields = Array.isArray(data) ? data : data.fields ?? [];
	return {
		fields: rawFields.map(normalizeField),
		pagination: data.pagination ?? null,
		summary: data.summary ?? null,
	};
};

export const getOwnerField = async (fieldId) => {
	const data = await apiRequest({ method: 'GET', url: apiPaths.owner.field(fieldId) });
	return normalizeField(data);
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

export const toggleOwnerFieldStatus = async (fieldId) =>
	apiRequest({ method: 'PATCH', url: apiPaths.owner.toggleStatus(fieldId) });

export const uploadImages = async (files) => {
	const formData = new FormData();
	files.forEach((file) => {
		formData.append('images', file);
	});
	const data = await apiRequest({
		method: 'POST',
		url: '/upload/images',
		data: formData,
		headers: { 'Content-Type': 'multipart/form-data' },
	});
	return data.urls;
};

export const getOwnerBookings = async (params = {}) => {
	const data = await apiRequest({ method: 'GET', url: apiPaths.owner.bookings, params });
	const rawBookings = Array.isArray(data) ? data : data.bookings ?? [];
	return {
		bookings: rawBookings.map(normalizeBooking),
		pagination: data.pagination ?? null,
	};
};

export const rejectOwnerBooking = async (bookingId) => {
	const data = await apiRequest({ method: 'PATCH', url: apiPaths.owner.rejectBooking(bookingId) });
	return normalizeBooking(data);
};

export const getOwnerCashPayments = async (params = {}) => {
	const data = await apiRequest({ method: 'GET', url: apiPaths.owner.cashPayments, params });
	const rawPayments = Array.isArray(data) ? data : data.payments ?? [];
	return {
		payments: rawPayments.map(normalizeCashPayment),
		pagination: data.pagination ?? null,
	};
};

export const confirmOwnerCashPayment = async (bookingId) => {
	const data = await apiRequest({ method: 'PATCH', url: apiPaths.owner.confirmCashPayment(bookingId) });
	return normalizePayment(data);
};

export const getOwnerStats = async () => {
	const data = await apiRequest({ method: 'GET', url: apiPaths.owner.stats });
	return data;
};

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

export const getAdminStats = async () => apiRequest({ method: 'GET', url: apiPaths.admin.stats });

export const getAdminFields = async (params = {}) => {
	const data = await apiRequest({ method: 'GET', url: apiPaths.admin.fields, params });
	const rawFields = Array.isArray(data) ? data : data.fields ?? [];
	return {
		fields: rawFields.map(normalizeField),
		pagination: data.pagination ?? null,
	};
};

export const getAdminUsers = async (params = {}) => {
	const data = await apiRequest({ method: 'GET', url: apiPaths.admin.users, params });
	const rawUsers = Array.isArray(data) ? data : data.users ?? [];
	return {
		users: rawUsers.map(normalizeUser),
		pagination: data.pagination ?? null,
		summary: data.summary ?? null,
	};
};

export const updateUserRole = async (userId, role) =>
	apiRequest({ method: 'PATCH', url: apiPaths.admin.userRole(userId), data: { role } });

export const updateUserStatus = async (userId, isActive) => {
	const data = await apiRequest({ method: 'PATCH', url: apiPaths.admin.userStatus(userId), data: { isActive } });
	return normalizeUser(data);
};

export const deleteOwnerSlot = async (slotId) =>
	apiRequest({ method: 'DELETE', url: apiPaths.owner.slot(slotId) });

export const updateOwnerSlot = async (slotId, payload) => {
	const data = await apiRequest({ method: 'PATCH', url: apiPaths.owner.slot(slotId), data: payload });
	return normalizeSlot(data);
};
