export interface IRegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface ILoginUserPayload {
  email: string;
  password: string;
}

export interface IVerifyEmailPayload {
  otp: string,
  email: string
}

export interface IChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface IResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}