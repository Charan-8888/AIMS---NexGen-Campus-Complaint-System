import api from './axios';

export const complaintsApi = {
  // Create complaint (FormData for image uploads)
  create: (formData) => api.post('/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // List with filters
  getAll: (params) => api.get('/complaints', { params }),

  // Single complaint (includes work record + feedback)
  getById: (id) => api.get(`/complaints/${id}`),

  // Status update
  updateStatus: (id, status, note) => api.post(`/complaints/${id}/status`, { status, note }),

  // Assign to staff (manager/admin)
  assign: (id, staffId) => api.post(`/complaints/${id}/assign`, { staffId }),

  // User verification
  verify: (id, satisfied, reopenReason) =>
    api.post(`/complaints/${id}/verify`, { satisfied, reopenReason }),

  // Staff work update with optional images
  addWorkUpdate: (id, formData) => api.post(`/complaints/${id}/work-update`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Submit feedback
  submitFeedback: (id, data) => api.post(`/complaints/${id}/feedback`, data),

  // Override AI classification
  overrideAI: (id, data) => api.post(`/complaints/${id}/override-ai`, data),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getCategories: () => api.get('/analytics/categories'),
  getBuildings: () => api.get('/analytics/buildings'),
  getDepartments: () => api.get('/analytics/departments'),
  getMonthlyTrend: (year) => api.get('/analytics/monthly-trend', { params: { year } }),
  getStaffWorkload: () => api.get('/analytics/staff-workload'),
  getPriorityDistribution: () => api.get('/analytics/priority-distribution'),
  getRatings: () => api.get('/analytics/ratings'),
};

export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const adminApi = {
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  changeRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  toggleActive: (id) => api.patch(`/admin/users/${id}/toggle-active`),

  // Departments
  getDepartments: (params) => api.get('/admin/departments', { params }),
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (id, data) => api.patch(`/admin/departments/${id}`, data),

  // Categories
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.patch(`/admin/categories/${id}`, data),

  // Locations
  getLocations: (params) => api.get('/admin/locations', { params }),
  createLocation: (data) => api.post('/admin/locations', data),

  // Staff
  getStaff: (params) => api.get('/admin/staff', { params }),
  createStaffProfile: (data) => api.post('/admin/staff', data),

  // Audit logs
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),

  // Announcements
  getAnnouncements: () => api.get('/admin/announcements'),
  createAnnouncement: (data) => api.post('/admin/announcements', data),
};
