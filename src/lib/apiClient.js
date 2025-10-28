import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

const rawToken = process.env.NEXT_PUBLIC_MOCK_TOKEN?.trim();
const mockToken = rawToken
  ? rawToken.startsWith("Bearer ")
    ? rawToken
    : `Bearer ${rawToken}`
  : null;
if (mockToken) {
  apiClient.defaults.headers.common.Authorization = mockToken;
}

export default apiClient;
