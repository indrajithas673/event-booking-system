import axiosInstance from './axiosInstance';

export const uploadImage = async (formData, onUploadProgress) => {
  const response = await axiosInstance.post('/api/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return response.data;
};

export const deleteImage = async (filename) => {
  const response = await axiosInstance.delete(`/api/upload/${filename}`);
  return response.data;
};
