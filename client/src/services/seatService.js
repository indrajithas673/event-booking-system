import api from './axiosInstance';

export const getSeats = async (eventId) => {
  const response = await api.get(`/events/${eventId}/seats`);
  return response.data;
};

export const lockSeat = async (eventId, seatId) => {
  const response = await api.post(`/events/${eventId}/seats/${seatId}/lock`);
  return response.data;
};

export const unlockSeat = async (eventId, seatId) => {
  const response = await api.post(`/events/${eventId}/seats/${seatId}/unlock`);
  return response.data;
};
