import axios from 'axios';
import type { User, Activity, Summary } from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withCredentials: true,
});

// Auth
export const getAuthUrl = () =>
  api.get<{ url: string }>('/auth/github');

export const loginWithCode = (code: string) =>
  api.post<{ user: User }>('/auth/github/callback', { code });

export const getCurrentUser = () =>
  api.get<{ user: User | null }>('/auth/me');

export const logout = () =>
  api.post('/auth/logout');

// Activity
export const fetchActivity = (days = 1) =>
  api.get<{
    activities: Activity[];
    grouped: Record<string, { commits: Activity[]; prs: Activity[]; reviews: Activity[] }>;
    summary: string;
    count: number;
  }>(`/api/activity?days=${days}`);

export const getActivityHistory = (limit = 30) =>
  api.get<{ activities: Activity[] }>(`/api/activity/history?limit=${limit}`);

// Summaries
export const saveSummary = (date: string, content: string) =>
  api.post<{ summary: Summary }>('/api/summaries', { date, content });

export const getSummaries = (limit = 14) =>
  api.get<{ summaries: Summary[] }>(`/api/summaries?limit=${limit}`);

export const getSummaryByDate = (date: string) =>
  api.get<{ summary: Summary | null }>(`/api/summaries/${date}`);

export default api;
