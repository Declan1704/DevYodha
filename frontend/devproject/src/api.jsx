import axios from "axios";

const api = axios.create({
  baseURL: "https://my-app.dev-yodha.workers.dev",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
