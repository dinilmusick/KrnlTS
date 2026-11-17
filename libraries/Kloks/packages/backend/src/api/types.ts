export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface ApiError {
  message: string;
  code?: string;
}

export interface RouteConfig {
  auth?: boolean;
  admin?: boolean;
  rateLimit?: boolean;
}
