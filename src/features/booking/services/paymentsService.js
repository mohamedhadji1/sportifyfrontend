import axios from 'axios';

const BOOKING_API_URL = process.env.REACT_APP_BOOKING_SERVICE_URL || 'http://localhost:5005/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Axios instance with auth header
const paymentsApi = axios.create({
  baseURL: `${BOOKING_API_URL}/payments`,
});

paymentsApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Payment Services
export const paymentsService = {
  // Create payment intent
  createPaymentIntent: async (bookingId, amount, currency = 'eur') => {
    const response = await paymentsApi.post('/create-payment-intent', {
      bookingId,
      amount,
      currency
    });
    return response.data;
  },

  // Confirm payment
  confirmPayment: async (paymentIntentId, bookingId) => {
    const response = await paymentsApi.post('/confirm-payment', {
      paymentIntentId,
      bookingId
    });
    return response.data;
  },

  // Create refund
  createRefund: async (bookingId, amount = null) => {
    const response = await paymentsApi.post('/refund', {
      bookingId,
      amount
    });
    return response.data;
  },

  // Get payment status
  getPaymentStatus: async (bookingId) => {
    const response = await paymentsApi.get(`/booking/${bookingId}/status`);
    return response.data;
  }
};

export default paymentsService;