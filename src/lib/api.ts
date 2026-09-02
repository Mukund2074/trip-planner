import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach Member JWT Token to requests
apiClient.interceptors.request.use((requestConfig) => {
  const memberToken = localStorage.getItem("member_token");
  if (memberToken && requestConfig.headers) {
    requestConfig.headers.Authorization = `Bearer ${memberToken}`;
  }
  return requestConfig;
});
