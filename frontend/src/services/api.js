/**
 * API client service for SAARTHI
 * Communicates with the Python / Django REST Framework backend
 */

const DEFAULT_BASE_URL = 'http://127.0.0.1:8000/api';
const rawUrl = import.meta.env.VITE_API_URL || DEFAULT_BASE_URL;
const cleanUrl = rawUrl.replace(/\/+$/, '');
const BASE_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

class ApiService {
  async request(endpoint, options = {}) {
    let url = `${BASE_URL}${endpoint}`;
    const headers = { ...options.headers };

    // Skip ngrok interstitial warning if using an ngrok tunnel
    if (url.includes('ngrok-free') || url.includes('ngrok.io') || url.includes('ngrok.dev')) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }

    // If body is FormData, delete Content-Type so browser sets multipart boundary automatically
    if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
      delete headers['Content-Type'];
      delete headers['content-type'];
    } else if (!headers['Content-Type'] && !headers['content-type'] && options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const token = localStorage.getItem('saarthi_token');
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    try {
      let response;
      try {
        response = await fetch(url, { ...options, headers });
      } catch (networkErr) {
        // If 127.0.0.1 fails, attempt localhost fallback in dev mode
        if (url.includes('127.0.0.1:8000')) {
          const fallbackUrl = url.replace('127.0.0.1:8000', 'localhost:8000');
          try {
            response = await fetch(fallbackUrl, { ...options, headers });
          } catch {
            throw networkErr;
          }
        } else if (url.includes('localhost:8000')) {
          const fallbackUrl = url.replace('localhost:8000', '127.0.0.1:8000');
          try {
            response = await fetch(fallbackUrl, { ...options, headers });
          } catch {
            throw networkErr;
          }
        } else {
          throw networkErr;
        }
      }

      const contentType = response.headers.get('content-type');
      let data = null;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        const error = new Error(
          data?.message || (data?.errors && JSON.stringify(data.errors)) || `Request failed with status ${response.status}`
        );
        error.status = response.status;
        error.data = data;
        error.errors = data?.errors || {};
        throw error;
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
        const helpfulError = new Error(
          'Cannot connect to the backend server. Please verify that the Django backend server is running at http://127.0.0.1:8000'
        );
        helpfulError.isNetworkError = true;
        helpfulError.originalError = error;
        throw helpfulError;
      }
      console.error(`Network request error at ${endpoint}:`, error);
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  post(endpoint, data, options = {}) {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? data : (data !== undefined ? JSON.stringify(data) : undefined),
      ...options,
    });
  }

  put(endpoint, data, options = {}) {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request(endpoint, {
      method: 'PUT',
      body: isFormData ? data : (data !== undefined ? JSON.stringify(data) : undefined),
      ...options,
    });
  }

  patch(endpoint, data, options = {}) {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request(endpoint, {
      method: 'PATCH',
      body: isFormData ? data : (data !== undefined ? JSON.stringify(data) : undefined),
      ...options,
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }

  upload(endpoint, formData, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      ...options,
    });
  }
}

export const api = new ApiService();
