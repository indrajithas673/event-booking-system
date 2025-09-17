import axiosInstance from './axiosInstance';

export const getDashboardStats = async () => {
  const response = await axiosInstance.get('/api/organizer/dashboard');
  return response.data;
};

export const getRevenueBreakdown = async () => {
  const response = await axiosInstance.get('/api/organizer/revenue');
  return response.data;
};

export const getRecentRegistrations = async () => {
  const response = await axiosInstance.get(
    '/api/organizer/recent-registrations'
  );
  return response.data;
};

export const getUpcomingEvents = async () => {
  const response = await axiosInstance.get('/api/organizer/upcoming-events');
  return response.data;
};
