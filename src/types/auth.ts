export type User = {
  id: number;
  email: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
};

export type LoginRequest = {
  email: string;
  password: string;
  remember_me?: boolean;
};

export type RegisterRequest = {
  email: string;
  password: string;
  display_name?: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string | null;
  token_type: string;
  user: User;
};

export type RefreshTokenRequest = {
  refresh_token: string;
};

export type RefreshTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type ChangePasswordRequest = {
  current_password: string;
  new_password: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  new_password: string;
};

export type ProfileUpdateRequest = {
  display_name?: string;
  email?: string;
};

export type AuthState = {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};
