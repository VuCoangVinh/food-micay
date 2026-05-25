// API Service for FoodOrder Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to get auth token
const getToken = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.token || null;
};

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('No token found for API call to:', endpoint);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Handle empty response
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } else {
      data = {};
    }

    if (!response.ok) {
      const errorMessage = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      error.details = data.details;
      console.error('API Error Response:', {
        status: response.status,
        error: errorMessage,
        details: data.details,
        fullData: data
      });
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    // If it's a network error, provide a more helpful message
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.name === 'TypeError') {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra backend đã chạy chưa.');
    }
    // Re-throw the error with the message
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    // Store token in user object
    if (data.token && data.user) {
      const userWithToken = { ...data.user, token: data.token };
      localStorage.setItem('user', JSON.stringify(userWithToken));
    }
    
    return data;
  },

  register: async (name, email, password) => {
    const data = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    
    // Store token in user object
    if (data.token && data.user) {
      const userWithToken = { ...data.user, token: data.token };
      localStorage.setItem('user', JSON.stringify(userWithToken));
    }
    
    return data;
  }
};

// Menu API
export const menuAPI = {
  getAll: async (category = null) => {
    const query = category && category !== 'all' ? `?category=${category}` : '';
    return apiCall(`/menu${query}`);
  },

  getById: async (id) => {
    return apiCall(`/menu/${id}`);
  },

  create: async (item) => {
    return apiCall('/menu', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  },

  update: async (id, item) => {
    return apiCall(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item)
    });
  },

  delete: async (id) => {
    return apiCall(`/menu/${id}`, {
      method: 'DELETE'
    });
  }
};

// Orders API
export const ordersAPI = {
  getAll: async (status = null, search = null) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/orders${query}`);
  },

  getById: async (id) => {
    return apiCall(`/orders/${id}`);
  },

  getUserOrders: async (userId) => {
    return apiCall(`/orders/user/${userId}`);
  },

  create: async (orderData) => {
    return apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  updateStatus: async (id, status) => {
    return apiCall(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }
};

// Tables API
export const tablesAPI = {
  getAll: async () => {
    return apiCall('/tables');
  },

  getById: async (id) => {
    return apiCall(`/tables/${id}`);
  },

  create: async (tableData) => {
    return apiCall('/tables', {
      method: 'POST',
      body: JSON.stringify(tableData)
    });
  },

  update: async (id, tableData) => {
    return apiCall(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tableData)
    });
  },

  delete: async (id) => {
    return apiCall(`/tables/${id}`, {
      method: 'DELETE'
    });
  }
};

// Users API
export const usersAPI = {
  getAll: async (search = null, role = null) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/users${query}`);
  },

  getById: async (id) => {
    return apiCall(`/users/${id}`);
  },

  delete: async (id) => {
    return apiCall(`/users/${id}`, {
      method: 'DELETE'
    });
  }
};

// Upload API
export const uploadAPI = {
  uploadImage: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }
};

// Payment API
export const paymentAPI = {
  // E-wallet payment
  processEWalletPayment: async (orderId, phoneNumber, walletType) => {
    return apiCall('/payment/ewallet', {
      method: 'POST',
      body: JSON.stringify({ orderId, phoneNumber, walletType })
    });
  }
};


