
const API_BASE = "/api/orders";

async function request(endpoint, token, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to process order");
  }

  return data;
}

export function createOrder(token, orderData) {
  return request("", token, {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}

export function getMyOrders(token) {
  return request("/my-orders", token);
}

export function getOrderById(token, orderId) {
  return request(`/${encodeURIComponent(orderId)}`, token);
}
