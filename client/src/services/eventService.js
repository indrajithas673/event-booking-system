import axiosInstance from './axiosInstance';

export const getEvents = async (params) => {
  const response = await axiosInstance.get('/api/events', { params });
  return response.data;
};

export const getEventBySlug = async (slug) => {
  const response = await axiosInstance.get(`/api/events/${slug}`);
  return response.data;
};

export const getEventById = async (id) => {
  const response = await axiosInstance.get(`/api/events/id/${id}`);
  return response.data;
};

export const getFeaturedEvents = async () => {
  const response = await axiosInstance.get('/api/events/featured');
  return response.data;
};

export const getCategories = async () => {
  const response = await axiosInstance.get('/api/events/categories');
  return response.data;
};

export const createEvent = async (data) => {
  const response = await axiosInstance.post('/api/events', data);
  return response.data;
};

export const updateEvent = async (id, data) => {
  const response = await axiosInstance.put(`/api/events/${id}`, data);
  return response.data;
};

export const deleteEvent = async (id) => {
  const response = await axiosInstance.delete(`/api/events/${id}`);
  return response.data;
};

export const publishEvent = async (id) => {
  const response = await axiosInstance.put(`/api/events/${id}/publish`);
  return response.data;
};

export const cancelEvent = async (id) => {
  const response = await axiosInstance.put(`/api/events/${id}/cancel`);
  return response.data;
};

export const getMyOrganizedEvents = async (params) => {
  const response = await axiosInstance.get('/api/events/my/organized', {
    params,
  });
  return response.data;
};

export const getEventRegistrations = async (id, params) => {
  const response = await axiosInstance.get(
    `/api/events/${id}/registrations`,
    { params }
  );
  return response.data;
};

export const getEventStats = async (id) => {
  const response = await axiosInstance.get(`/api/events/${id}/stats`);
  return response.data;
};
