// API Configuration
// Empty base => use relative paths so vite dev server can proxy /api in dev,
// and a reverse proxy can serve /api -> backend in prod.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
export const API_ENDPOINTS = {
  EXECUTE_CODE: `${API_BASE_URL}/api/execute`,
  HEALTH: `${API_BASE_URL}/health`,
};
