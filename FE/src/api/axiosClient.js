import axios from 'axios';

const apiClient = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
	headers: {
		'Content-Type': 'application/json',
	},
});

apiClient.interceptors.request.use((config) => {
	const token = localStorage.getItem('access_token');

	if (token) {
		config.headers = config.headers || {};
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			const url = error.config?.url;
			if (url && !url.includes('/auth/login') && !url.includes('/otp/verify') && !url.includes('/password/reset')) {
				localStorage.removeItem('access_token');
				localStorage.removeItem('user');
				window.location.href = '/login';
			}
		}

		if (error.response?.data?.error?.message) {
			error.message = error.response.data.error.message;
		} else if (error.response?.data?.message) {
			error.message = error.response.data.message;
		}
		return Promise.reject(error);
	}
);

export const apiRequest = async (config) => {
	const response = await apiClient.request(config);
	return response.data?.data ?? response.data;
};

export default apiClient;