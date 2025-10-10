// Fetch-style API client wrapper for axios
import { apiClient as axiosClient } from './api-client';

class FetchLikeResponse {
  ok: boolean;
  status: number;
  data: any;

  constructor(ok: boolean, status: number, data: any) {
    this.ok = ok;
    this.status = status;
    this.data = data;
  }

  async json() {
    return this.data;
  }
}

export const apiClient = {
  async get(url: string) {
    try {
      const response = await axiosClient.get(url);
      return new FetchLikeResponse(true, response.status, response.data);
    } catch (error: any) {
      return new FetchLikeResponse(false, error.response?.status || 500, error.response?.data || {});
    }
  },

  async post(url: string, data?: any) {
    try {
      const response = await axiosClient.post(url, data);
      return new FetchLikeResponse(true, response.status, response.data);
    } catch (error: any) {
      return new FetchLikeResponse(false, error.response?.status || 500, error.response?.data || {});
    }
  },

  async put(url: string, data?: any) {
    try {
      const response = await axiosClient.put(url, data);
      return new FetchLikeResponse(true, response.status, response.data);
    } catch (error: any) {
      return new FetchLikeResponse(false, error.response?.status || 500, error.response?.data || {});
    }
  },

  async delete(url: string) {
    try {
      const response = await axiosClient.delete(url);
      return new FetchLikeResponse(true, response.status, response.data);
    } catch (error: any) {
      return new FetchLikeResponse(false, error.response?.status || 500, error.response?.data || {});
    }
  },

  async patch(url: string, data?: any) {
    try {
      const response = await axiosClient.patch(url, data);
      return new FetchLikeResponse(true, response.status, response.data);
    } catch (error: any) {
      return new FetchLikeResponse(false, error.response?.status || 500, error.response?.data || {});
    }
  },
};