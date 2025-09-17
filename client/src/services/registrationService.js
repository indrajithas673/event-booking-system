import axiosInstance from './axiosInstance';

export const registerForEvent = async (eventId, data) => {
  const response = await axiosInstance.post(
    `/api/events/${eventId}/register`,
    data
  );
  return response.data;
};

export const cancelRegistration = async (id) => {
  const response = await axiosInstance.delete(`/api/registrations/${id}`);
  return response.data;
};

export const getMyRegistrations = async (params) => {
  const response = await axiosInstance.get('/api/registrations/my', { params });
  return response.data;
};

export const getRegistrationById = async (id) => {
  const response = await axiosInstance.get(`/api/registrations/${id}`);
  return response.data;
};

export const getRegistrationByCode = async (code) => {
  const response = await axiosInstance.get(`/api/registrations/code/${code}`);
  return response.data;
};

export const checkInAttendee = async (id) => {
  const response = await axiosInstance.put(
    `/api/registrations/${id}/check-in`
  );
  return response.data;
};
