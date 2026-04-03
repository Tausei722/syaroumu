import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Auth ----
export const login = (email: string, password: string) =>
  api.post<{ access_token: string }>("/auth/login", { email, password });

export const getMe = () => api.get("/auth/me");

export const registerPushToken = (token: string) =>
  api.post(`/auth/push-token?token=${token}`);

// ---- Events ----
export const getEvents = (company_id: string, start?: string, end?: string) =>
  api.get("/events/", { params: { company_id, start, end } });

export const createEvent = (data: object) => api.post("/events/", data);

export const deleteEvent = (id: string) => api.delete(`/events/${id}`);

// ---- Leave ----
export const getRemainingPaidLeave = () => api.get<number>("/leave/remaining");

export const getLeaveRequests = (company_id: string) =>
  api.get("/leave/requests", { params: { company_id } });

export const createLeaveRequest = (data: object) =>
  api.post("/leave/requests", data);

export const approveLeaveRequest = (id: string) =>
  api.patch(`/leave/requests/${id}/approve`);

export const rejectLeaveRequest = (id: string) =>
  api.patch(`/leave/requests/${id}/reject`);

// ---- Timeline ----
export const getTimeline = (company_id?: string) =>
  api.get("/timeline/", { params: { company_id } });

export const createTimelinePost = (data: object) =>
  api.post("/timeline/", data);

export const deleteTimelinePost = (id: string) =>
  api.delete(`/timeline/${id}`);
