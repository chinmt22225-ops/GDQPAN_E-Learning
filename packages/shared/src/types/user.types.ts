export type UserRole = 'student' | 'admin';

export interface IUser {
  _id: string;
  mssv: string;
  phone?: string;  // Số điện thoại
  nameRaw: string;
  nameNormalized: string;
  email: string;
  role: UserRole;
  school?: string; // Trường Đại học / Cao đẳng
  class?: string;  // Lớp sinh hoạt
  googleId?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface UserSessionData {
  userId: string;
  mssv: string;
  phone?: string;
  name: string;
  email: string;
  role: UserRole;
  school?: string;
  class?: string;
}

export interface AuthResponse {
  user: UserSessionData;
  token?: string;
}
