import axiosInstance from "@/lib/axios";
import { ApiResponse } from "@/types/api.types";
import { AuthResponse, AuthUser, ChangePasswordPayload, ForgotPasswordPayload, LoginPayload, RegisterPayload, ResetPasswordPayload, VerifyEmailPayload } from "@/types/auth.types";

export async function loginUser(payload: LoginPayload): Promise<ApiResponse<AuthResponse>> {
  const res = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/login', payload);
  return res.data;
}
export async function registerUser(payload: RegisterPayload): Promise<ApiResponse<AuthResponse>> {
  const res = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/register', payload);
  return res.data;
}
export async function getMe(): Promise<ApiResponse<AuthUser>> {
  const res = await axiosInstance.get<ApiResponse<AuthUser>>('/auth/me');
  return res.data;
}
export async function logoutUser(): Promise<ApiResponse> {
  const res = await axiosInstance.post<ApiResponse>('/auth/logout');
  return res.data;
}
export async function verifyEmail(payload: VerifyEmailPayload): Promise<ApiResponse> {
  const res = await axiosInstance.post<ApiResponse>('/auth/verify-email', payload);
  return res.data;
}
export async function forgotPassword(payload: ForgotPasswordPayload): Promise<ApiResponse> {
  const res = await axiosInstance.post<ApiResponse>('/auth/forgot-password', payload);
  return res.data;
}
export async function resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse> {
  const res = await axiosInstance.post<ApiResponse>('/auth/reset-password', payload);
  return res.data;
}
export async function changePassword(payload: ChangePasswordPayload): Promise<ApiResponse> {
  const res = await axiosInstance.post<ApiResponse>('/auth/change-password', payload);
  return res.data;
}
export async function refreshToken(): Promise<ApiResponse> {
  const res = await axiosInstance.post<ApiResponse>('/auth/refresh-token');
  return res.data;
}

export function initiateGoogleLogin(redirectPath = '/dashboard') {
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL;
  const encoded = encodeURIComponent(redirectPath);
  window.location.href = `${backendBase}/api/v1/auth/login/google?redirect=${encoded}`;
}
