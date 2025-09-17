import axiosInstance from './axiosInstance';

export const getPublicProfile = async (id) => {
  const response = await axiosInstance.get(`/api/users/${id}/profile`);
  return response.data;
};

export const getOrganizerProfile = async (id) => {
  const response = await axiosInstance.get(`/api/users/${id}/organizer`);
  return response.data;
};

export const getMyStats = async () => {
  const response = await axiosInstance.get('/api/users/me/stats');
  return response.data;
};
