import axios from 'axios'
import { getAuthSession, clearAuthSession } from './session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token automatically from session cookies / storage
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const { token } = getAuthSession()
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 Unauthorized
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      clearAuthSession()
    }
    return Promise.reject(err)
  }
)

// ── Unified API Wrapper returning unwrapped response data ─────
export const api = {
  // Auth
  register: (data: { name: string; email: string; password: string }) =>
    axiosInstance.post('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    axiosInstance.post('/auth/login', data).then((r) => r.data),
  getMe: () => axiosInstance.get('/auth/me').then((r) => r.data),

  // Research Management
  startResearch: (data: {
    topic: string
    description?: string
    url?: string
    research_mode?: string
    file?: File
  }) => {
    const formData = new FormData()
    formData.append('topic', data.topic)
    if (data.description) formData.append('description', data.description)
    if (data.url) formData.append('url', data.url)
    if (data.research_mode) formData.append('research_mode', data.research_mode)
    if (data.file) formData.append('file', data.file)
    return axiosInstance
      .post('/research/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  getProjects: () => axiosInstance.get('/research/list').then((r) => r.data),
  getProject: (id: string) => axiosInstance.get(`/research/${id}`).then((r) => r.data),
  getReport: (id: string) => axiosInstance.get(`/research/${id}/report`).then((r) => r.data),
  getEvidence: (id: string) => axiosInstance.get(`/research/${id}/evidence`).then((r) => r.data),
  getVerifications: (id: string) => axiosInstance.get(`/research/${id}/verifications`).then((r) => r.data),
  getSources: (id: string) => axiosInstance.get(`/research/${id}/sources`).then((r) => r.data),
  getCritiques: (id: string) => axiosInstance.get(`/research/${id}/critiques`).then((r) => r.data),
  getCost: (id: string) => axiosInstance.get(`/research/${id}/cost`).then((r) => r.data),
  getPlan: (id: string) => axiosInstance.get(`/research/${id}/plan`).then((r) => r.data),
  getDiagram: (id: string) => axiosInstance.get(`/research/${id}/diagram`).then((r) => r.data),
  getSlides: (id: string) => axiosInstance.get(`/research/${id}/slides`).then((r) => r.data),
  getLogs: (id: string) => axiosInstance.get(`/research/${id}/logs`).then((r) => r.data),
  deleteProject: (id: string) => axiosInstance.delete(`/research/${id}`).then((r) => r.data),
  chat: (id: string, question: string) =>
    axiosInstance.post(`/research/${id}/chat`, { question }).then((r) => r.data),
  agentChat: (data: { agent: string; question: string; project_id?: string }) =>
    axiosInstance.post('/research/agent-chat', data).then((r) => r.data),
}

// Backward-compatible individual API maps
export const authAPI = {
  register: api.register,
  login: api.login,
  me: api.getMe,
}

export const researchAPI = {
  create: (formData: FormData) =>
    axiosInstance.post('/research/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: () => axiosInstance.get('/research/list'),
  get: (id: string) => axiosInstance.get(`/research/${id}`),
  getReport: (id: string) => axiosInstance.get(`/research/${id}/report`),
  getSlides: (id: string) => axiosInstance.get(`/research/${id}/slides`),
  getDiagram: (id: string) => axiosInstance.get(`/research/${id}/diagram`),
  getEvidence: (id: string) => axiosInstance.get(`/research/${id}/evidence`),
  getVerifications: (id: string) => axiosInstance.get(`/research/${id}/verifications`),
  getSources: (id: string) => axiosInstance.get(`/research/${id}/sources`),
  getCritiques: (id: string) => axiosInstance.get(`/research/${id}/critiques`),
  getCost: (id: string) => axiosInstance.get(`/research/${id}/cost`),
  getPlan: (id: string) => axiosInstance.get(`/research/${id}/plan`),
  getLogs: (id: string) => axiosInstance.get(`/research/${id}/logs`),
  delete: (id: string) => axiosInstance.delete(`/research/${id}`),
  askQuestion: (id: string, question: string) => axiosInstance.post(`/research/${id}/chat`, { question }),
}

export const agentsAPI = {
  list: () => axiosInstance.get('/agents/'),
  status: (projectId: string) => axiosInstance.get(`/agents/status/${projectId}`),
}

// ── WebSocket Helper ───────────────────────────────────────────
export function createWS(projectId: string): WebSocket {
  let WS_URL = process.env.NEXT_PUBLIC_WS_URL
  if (!WS_URL) {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const hostname = window.location.hostname || 'localhost'
      WS_URL = `${protocol}//${hostname}:8000/ws`
    } else {
      WS_URL = 'ws://localhost:8000/ws'
    }
  }
  return new WebSocket(`${WS_URL}/${projectId}`)
}
