/**
 * API Service for making HTTP requests to the CitySense backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to make authenticated requests
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token from localStorage or session
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, mergedOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
    });
  }

  // Issues endpoints
  async getIssues(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/issues${queryParams ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getIssueById(id) {
    return this.makeRequest(`/issues/${id}`);
  }

  async createIssue(issueData) {
    return this.makeRequest('/issues', {
      method: 'POST',
      body: JSON.stringify(issueData),
    });
  }

  async updateIssue(id, updates) {
    return this.makeRequest(`/issues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteIssue(id) {
    return this.makeRequest(`/issues/${id}`, {
      method: 'DELETE',
    });
  }

  async upvoteIssue(id) {
    return this.makeRequest(`/issues/${id}/upvote`, {
      method: 'POST',
    });
  }

  async downvoteIssue(id) {
    return this.makeRequest(`/issues/${id}/downvote`, {
      method: 'POST',
    });
  }

  // Admin endpoints
  async getAdminStats() {
    return this.makeRequest('/admin/stats');
  }

  async updateIssueStatus(id, status) {
    return this.makeRequest(`/admin/issues/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getUsers() {
    return this.makeRequest('/admin/users');
  }

  async updateUserRole(userId, role) {
    return this.makeRequest(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  // Export endpoints
  async exportIssues(format = 'csv', filters = {}) {
    const queryParams = new URLSearchParams({ format, ...filters }).toString();
    const endpoint = `/export/issues${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await this.makeRequest(endpoint);
    return response; // This should be a blob or file download
  }

  async getExportStatus(exportId) {
    return this.makeRequest(`/export/status/${exportId}`);
  }

  // File upload helper
  async uploadFile(file, endpoint) {
    const formData = new FormData();
    formData.append('file', file);

    return this.makeRequest(endpoint, {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData, let the browser set it
        Authorization: `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`,
      },
      body: formData,
    });
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export specific methods for convenience
export const {
  login,
  register,
  logout,
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  upvoteIssue,
  downvoteIssue,
  getAdminStats,
  updateIssueStatus,
  getUsers,
  updateUserRole,
  exportIssues,
  getExportStatus,
  uploadFile,
  healthCheck,
} = apiService;
