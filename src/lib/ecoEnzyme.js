import apiClient from "./apiClient";

export async function fetchProjects() {
  const { data } = await apiClient.get(`/ecoenzim/projects`);
  return data;
}
export async function fetchProjectById(id) {
  const { data } = await apiClient.get(`/ecoenzim/projects/${id}`);
  return data;
}
export async function createProject(body) {
  const { data } = await apiClient.post(`/ecoenzim/projects`, body);
  return data.project || data;
}
export async function startProject(id) {
  const { data } = await apiClient.patch(`/ecoenzim/projects/${id}/start`);
  return data;
}
export async function deleteProject(id) {
  const { data } = await apiClient.delete(`/ecoenzim/projects/${id}`);
  return data;
}
export async function fetchUploadsByProject(projectId) {
  const { data } = await apiClient.get(`/ecoenzim/uploads/project/${projectId}`);
  return data;
}
export async function createUpload(uploadData) {
  const { data } = await apiClient.post(`/ecoenzim/uploads`, uploadData);
  return data.upload || data;
}
export async function claimPoints(projectId) {
  const { data } = await apiClient.post(`/ecoenzim/projects/${projectId}/claim`);
  return data;
}