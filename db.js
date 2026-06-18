const API_URL = 'https://airports-spider-applicant-scenarios.trycloudflare.com/api';
const CURRENT_USER_KEY = 'vprostudent_current_user';

async function apiFetch(endpoint, method = 'GET', body = null) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_URL}${endpoint}`, options);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, message: 'Gagal terhubung ke server.' };
  }
}

export async function uploadFileToAPI(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    return await res.json();
  } catch (err) {
    console.error('File Upload Error:', err);
    return { success: false, message: 'Gagal mengunggah file.' };
  }
}

export async function cancelOrder(orderId) {
  const user = getCurrentUser();
  const role = user ? user.role : 'user';
  return await apiFetch(`/orders/${orderId}?role=${role}`, 'DELETE');
}

export async function initializeDb() {
  return await apiFetch('/init', 'GET');
}

export async function login(email, password) {
  const data = await apiFetch('/login', 'POST', { email, password });
  if (data.success && data.user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
  }
  return data;
}

export async function register(nama, nim, universitas, email, password) {
  const data = await apiFetch('/register', 'POST', { nama, nim, universitas, email, password });
  if (data.success && data.user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
  }
  return data;
}

export function getCurrentUser() {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export async function createOrder(orderData) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: 'Harus login terlebih dahulu.' };

  const payload = { ...orderData, userId: user.id, userName: user.nama };
  return await apiFetch('/orders', 'POST', payload);
}

export async function getOrders(userId = null) {
  const endpoint = userId ? `/orders?userId=${userId}` : '/orders';
  return await apiFetch(endpoint, 'GET');
}

export async function updateOrderStatus(orderId, status) {
  return await apiFetch(`/orders/${orderId}/status`, 'PATCH', { status });
}

export async function uploadPaymentReceipt(orderId, receiptFileName) {
  return await apiFetch(`/orders/${orderId}/receipt`, 'POST', { receiptFileName });
}

export async function verifyPayment(orderId, isApproved) {
  return await apiFetch(`/orders/${orderId}/verify`, 'POST', { isApproved });
}

export async function uploadEditResult(orderId, resultUrl) {
  return await apiFetch(`/orders/${orderId}/result`, 'POST', { resultUrl });
}

export async function getUsers() {
  return await apiFetch('/users', 'GET');
}

export async function getPackages() {
  return await apiFetch('/packages', 'GET');
}

export async function savePackage(pkg) {
  return await apiFetch('/packages', 'POST', pkg);
}

export async function deletePackage(pkgId) {
  return await apiFetch(`/packages/${pkgId}`, 'DELETE');
}

export async function getNotifications(userId) {
  return await apiFetch(`/notifications?userId=${userId}`, 'GET');
}

export async function addNotification(userId, message) {
  return await apiFetch('/notifications', 'POST', { userId, message });
}

export async function markNotificationsAsRead(userId) {
  return await apiFetch('/notifications/read', 'PUT', { userId });
}

export async function getAdminStats() {
  return await apiFetch('/stats', 'GET');
}