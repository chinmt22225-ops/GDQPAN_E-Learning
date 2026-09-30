export type UserRole = 'student' | 'admin';

export interface IUser {
  _id: string;
  mssv: string;
  nameRaw: string;
  nameNormalized: string;
  email: string;
  role: UserRole;
  class?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface UserSessionData {
  userId: string;
  mssv: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  user: UserSessionData;
  token?: string;
}
