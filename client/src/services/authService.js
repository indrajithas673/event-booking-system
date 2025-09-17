import axiosInstance from './axiosInstance';

export const register = async (data) => {
  const response = await axiosInstance.post('/api/auth/register', data);
  return response.data;
};

export const login = async (data) => {
  const response = await axiosInstance.post('/api/auth/login', data);
  return response.data;
};

export const getMe = async () => {
  const response = await axiosInstance.get('/api/auth/me');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await axiosInstance.put('/api/auth/profile', data);
  return response.data;
};

export const changePassword = async (data) => {
  const response = await axiosInstance.put('/api/auth/change-password', data);
  return response.data;
};

export const deleteAccount = async (data) => {
  const response = await axiosInstance.delete('/api/auth/delete-account', {
    data,
  });
  return response.data;
};
