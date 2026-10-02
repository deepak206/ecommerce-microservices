
const API_BASE = "/api/users";

async function request(endpoint, body) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export function loginUser(credentials) {
  return request("/login", credentials);
}

export function registerUser(userData) {
  return request("/register", userData);
}
