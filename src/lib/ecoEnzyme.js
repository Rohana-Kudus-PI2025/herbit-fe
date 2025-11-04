import apiClient from "./apiClient";

export async function fetchProjects(q = "") {
  const { data } = await apiClient.get(`/projects${q}`);
  return data;
}
export async function fetchProjectById(id) {
  const { data } = await apiClient.get(`/projects/${id}`);
  return data;
}
export async function createProject(body) {
  const { data } = await apiClient.post(`/projects`, body);
  return data.project || data;
}
export async function startProject(id) {
  const { data } = await apiClient.patch(`/projects/${id}/start`);
  return data;
}
export async function deleteProject(id) {
  const { data } = await apiClient.delete(`/projects/${id}`);
  return data;
}

// ==================== UPLOAD APIs ====================
export async function fetchUploadsByProject(projectId) {
  const { data } = await apiClient.get(`/uploads/project/${projectId}`);
  return data;
}

export async function createUpload(uploadData) {
  const { data } = await apiClient.post(`/uploads`, uploadData);
  return data.upload || data;
}

// ==================== CLAIM APIs ====================
export async function claimPoints(projectId) {
  const { data } = await apiClient.post(`/projects/${projectId}/claim`);
  return data;
}