import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:34869",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
