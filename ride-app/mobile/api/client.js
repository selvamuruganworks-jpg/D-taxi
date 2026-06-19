import { API_BASE_URL } from "../theme";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export const api = {
  geocode: (place) =>
    request(`/geocode/?place=${encodeURIComponent(place)}`),

  categories: () => request(`/categories/`),

  estimate: (payload) =>
    request(`/estimate/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  bookRide: (payload) =>
    request(`/book/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getRide: (id) => request(`/rides/${id}/`),

  cancelRide: (id) =>
    request(`/rides/${id}/cancel/`, { method: "POST" }),
};
