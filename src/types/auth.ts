export interface LoginDto {
  email: string;
  password: string;
}

export type LoginResponse = {
  accessToken?: string;
  access_token?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    role?: string;
  };
} | string;
