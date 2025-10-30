import apiClient from "./apiClient";

export async function getMe() {
  const response = await apiClient.get("/auth/me");
  const user = response.data?.data; 
  return { user };
}
