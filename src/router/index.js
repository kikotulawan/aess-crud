import { createRouter, createWebHistory } from "vue-router";
import Courses from "../views/Courses.vue";
import Instructors from "../views/Instructors.vue";
import Sections from "../views/Sections.vue";
import Subjects from "../views/Subjects.vue";
import ExaminationSchedule from "../views/ExaminationSchedule.vue";

const routes = [
	{ path: "/courses", component: Courses },
	{ path: "/instructors", component: Instructors },
	{ path: "/sections", component: Sections },
	{ path: "/subjects", component: Subjects },
	{ path: "/scheduler", component: ExaminationSchedule },
];

export default createRouter({
	history: createWebHistory(),
	routes,
});
