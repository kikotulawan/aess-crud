// src/services/api.js
import axios from "axios";

const API = axios.create({
	baseURL: "http://localhost:5000/api",
});

export const getExams = () => API.get("/exams");
export const createExam = (exam) => API.post("/exams", exam);

export const getSchedules = () => API.get("/scheduler");
export const generateSchedule = (exams) => API.post("/scheduler", { exams });
