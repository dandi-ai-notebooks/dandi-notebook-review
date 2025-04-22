export const API_BASE_URL = 'http://localhost:3000/api';

export const createHeaders = (userEmail: string, apiToken: string) => ({
  'Content-Type': 'application/json',
  'X-User-Email': userEmail,
  'X-Api-Token': apiToken
});

export const createAdminHeaders = (adminToken: string) => ({
  'Content-Type': 'application/json',
  'X-Admin-Token': adminToken
});
