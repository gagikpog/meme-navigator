import { Request } from 'express';

// Database types
export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'writer' | 'user';
  created_at: string;
  is_blocked: number;
  last_login?: string;
  name?: string;
  surname?: string;
  avatar?: string;
}

export interface Meme {
  id: number;
  fileName: string;
  tags: string;
  description?: string;
  permissions: 'public' | 'private';
  created_at: string;
  user_id: number;
}

export interface UserSession {
  id: number;
  user_id: number;
  device_id: string;
  device_info?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  last_activity: string;
  is_active: number;
}

export interface Subscription {
  id: number;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
  session_id?: number;
  user_id?: number;
}

// JWT Payload
export interface JWTPayload {
  id: number;
  sessionId: number;
  username: string;
  role: 'admin' | 'writer' | 'user';
  deviceId: string;
}

// Request extensions
export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
  token?: string;
}

// Notification types
export interface NotificationData {
  title: string;
  body: string;
  icon: string;
  url: string;
}

export interface NotificationFilter {
  userIds?: number[];
  sessionIds?: number[];
  excludeUserIds?: number[];
  excludeSessionIds?: number[];
  permissions?: string[];
}

// Push subscription types
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  data?: T;
}

export interface PaginationResponse<T> {
  users?: T[];
  sessions?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Multer file type
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Request with file
export interface RequestWithFile {
  user: JWTPayload;
  token?: string;
  file?: MulterFile;
  params: any;
  body: any;
  query: any;
  headers: any;
  method: string;
  path: string;
}

// Database callback types
export type DatabaseCallback<T = any> = (err: Error | null, result?: T) => void;
export type DatabaseRunCallback = (err: Error | null, changes?: number, lastID?: number) => void;
