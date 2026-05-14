// API Configuration
// Empty base => use relative paths so vite dev server can proxy /api in dev,
// and a reverse proxy can serve /api -> backend in prod.
export const API_BASE_URL = 'https://api.kantan.space'
export const API_ENDPOINTS = {
  EXECUTE_CODE: `${API_BASE_URL}/api/execute`,
  HEALTH: `${API_BASE_URL}/health`,
};
