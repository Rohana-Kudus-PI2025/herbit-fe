import baseURL from "./apiClient.js";

export const getDailyTasks = () => baseURL.get("/checklists/today");
export const getChecklists = () => baseURL.get("/checklists");
export const completeTask = (id) => baseURL.patch(`/checklists/${id}/complete`);
export const uncheckTask = (id) => baseURL.patch(`/checklists/${id}/uncheck`);
export const getLeaves = () => baseURL.get("/leaves");
export const getFruits = () => baseURL.get("/fruits");
export const claimFruit = (id) => baseURL.patch(`/fruits/${id}/claim`);
export const getTree = () => baseURL.get("/tree");
