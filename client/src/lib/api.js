import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for consistent error logging
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // If 401, clear token and redirect to login
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/')) {
      localStorage.removeItem('nexus_token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    console.error('[api]', err.config?.url, err.response?.status, err.message);
    return Promise.reject(err);
  }
);

// Wrapper — returns { data, error } so callers don't need try/catch
async function call(fn) {
  try {
    const res = await fn();
    return { data: res.data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err.response?.data?.error || err.message || 'Unknown error',
    };
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const login = (email, password) =>
  call(() => api.post('/auth/login', { email, password }));

export const register = (name, email, password, role) =>
  call(() => api.post('/auth/register', { name, email, password, role }));

export const getMe = () =>
  call(() => api.get('/auth/me'));

export const logout = () => {
  localStorage.removeItem('nexus_token');
};

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------
export const uploadDocument = (file, docType, extraFields = {}) => {
  const form = new FormData();
  form.append('file', file);
  form.append('doc_type', docType || 'SOP');
  form.append('title', extraFields.title || file.name);
  if (extraFields.equipment_tags)
    form.append('equipment_tags', JSON.stringify(extraFields.equipment_tags));

  return call(() =>
    api.post('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
  );
};

export const getDocuments = (page = 1, limit = 20) =>
  call(() => api.get('/documents', { params: { page, limit } }));

export const getDocumentStatus = (docId) =>
  call(() => api.get(`/documents/${docId}/status`));

export const deleteDocument = (docId) =>
  call(() => api.delete(`/documents/${docId}`));

// ---------------------------------------------------------------------------
// Query / ORACLE
// ---------------------------------------------------------------------------
export const searchQuery = (query, filters = {}, conversationHistory = []) =>
  call(() => api.post('/query/search', { query, filters, conversationHistory }));

export const voiceQuery = (transcript, filters = {}, conversationHistory = []) =>
  call(() => api.post('/query/voice', { transcript, filters, conversationHistory }));

export const getQuerySuggestions = () =>
  call(() => api.get('/query/suggestions'));

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------
export const getAssets = () => call(() => api.get('/assets'));

export const getAsset = (tag) => call(() => api.get(`/assets/${tag}`));

export const updateAsset = (tag, data) =>
  call(() => api.patch(`/assets/${tag}`, data));

// ---------------------------------------------------------------------------
// Compliance
// ---------------------------------------------------------------------------
export const getComplianceDashboard = () =>
  call(() => api.get('/compliance/dashboard'));

export const getComplianceGaps = (filters = {}) =>
  call(() => api.get('/compliance/gaps', { params: filters }));

export const resolveGap = (id, note) =>
  call(() => api.patch(`/compliance/gaps/${id}/resolve`, { resolution_note: note }));

export const updateGapStatus = (id, status) =>
  call(() => api.patch(`/compliance/gaps/${id}/status`, { status }));

export const runComplianceAudit = (regulationDocId) =>
  call(() => api.post('/compliance/audit', { regulation_doc_id: regulationDocId }));

// ---------------------------------------------------------------------------
// Chronicle
// ---------------------------------------------------------------------------
export const getFailurePatterns = () =>
  call(() => api.get('/chronicle/patterns'));

export const minePatterns = () =>
  call(() => api.post('/chronicle/mine'));

export const getExpertInterviews = () =>
  call(() => api.get('/chronicle/expert/interviews'));

export const generateExpertQuestions = (engineerId, engineerName) =>
  call(() => api.post('/chronicle/expert/questions', { engineer_id: engineerId, engineer_name: engineerName }));

export const saveExpertResponse = (data) =>
  call(() => api.post('/chronicle/expert/save', data));

export default api;
