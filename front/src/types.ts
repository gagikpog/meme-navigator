import { MouseEventHandler } from "react";

export type Role = 'admin' | 'moderator' | 'writer' | 'user';

export type Permission = 'public' | 'moderate' | 'private';

export interface User {
  id: number;
  username: string;
  name?: string;
  surname?: string;
  role: Role;
  is_blocked?: number;
  created_at?: string;
  last_login?: string;
  avatar?: string;
  sessionsCount?: number;
}

export interface Meme {
  id: number;
  fileName: string;
  tags: string[];
  description: string;
  permissions: Permission;
  created_at: string;
  user_id: number;
  authorName?: string;
  authorSurname?: string;
  authorUsername?: string;
  commentsCount?: number;
  likesCount?: number;
  dislikesCount?: number;
  userRating?: number;
}

export interface Comment {
  id: number;
  meme_id: number;
  user_id: number;
  text: string;
  created_at: string;
  parent_id?: number | null;
  is_deleted?: number;
  authorName?: string;
  authorSurname?: string;
  authorUsername?: string;
  replies?: Comment[];
}

export interface Session {
  id: number;
  device_id: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  last_activity: string;
  is_active: number;
}

export type AuthFetch = (
  url: string,
  options?: RequestInit,
  confirmError?: boolean
) => Promise<Response>;

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
  hasModeratorAccess: () => boolean;
  canFilter: () => boolean;
  canCreateMeme: () => boolean;
  canEditMeme: (meme: Meme) => boolean;
  canDeleteMeme: (meme: Meme) => boolean;
  authFetch: AuthFetch;
}

export interface MemeContextValue {
  memes: Meme[];
  loading: boolean;
  refreshMemes: () => Promise<void>;
}

export interface IIconProps {
  size?: number,
  onClick?: MouseEventHandler<HTMLDivElement>
}
