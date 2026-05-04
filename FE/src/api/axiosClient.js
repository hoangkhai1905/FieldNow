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
		const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Request failed';
		return Promise.reject(new Error(message));
	}
);

export const apiRequest = async (config) => {
	const response = await apiClient.request(config);
	return response.data?.data ?? response.data;
};

export default apiClient;