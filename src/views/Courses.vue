<template>
	<div class="container mx-auto flex flex-col pt-[100px] min-h-screen pb-20">
		<form @submit.prevent="addCourse" class="flex flex-col space-y-2 max-w-lg">
			<h1 class="text-xl font-bold">Courses</h1>
			<div class="inline-flex items-center gap-2">
				<input v-model="courseName" class="border p-2 w-full" placeholder="Course Name" required />
				<input v-model="courseCode" class="border p-2 w-full" placeholder="Course Code" required />
				<button class="w-full bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-400 active:bg-blue-600">Add New Course</button>
			</div>
		</form>

		<table class="table-auto mt-10 w-full border-collapse border border-gray-200 rounded-lg">
			<thead class="bg-gray-100 text-left">
				<tr>
					<th class="p-3 border border-gray-200">Course Name</th>
					<th class="p-3 border border-gray-200">Course Code</th>
					<th class="p-3 border border-gray-200">Actions</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="course in courses" :key="course.id" class="hover:bg-gray-50 transition">
					<td class="p-3 border border-gray-200">
						<template v-if="editId === course.id">
							<input v-model="editedCourseName" class="border p-1 w-full" />
						</template>
						<template v-else>
							{{ course.courseName }}
						</template>
					</td>
					<td class="p-3 border border-gray-200">
						<template v-if="editId === course.id">
							<input v-model="editedCourseCode" class="border p-1 w-full" />
						</template>
						<template v-else>
							{{ course.courseCode }}
						</template>
					</td>
					<td class="p-3 border border-gray-200 space-x-2">
						<template v-if="editId === course.id">
							<button @click="saveEdit(course.id)" class="text-green-600 hover:underline">Save</button>
							<button @click="cancelEdit" class="text-gray-500 hover:underline">Cancel</button>
						</template>
						<template v-else>
							<button @click="startEdit(course)" class="text-blue-600 hover:underline">Edit</button>
							<button @click="deleteCourse(course.id)" class="text-red-600 hover:underline">Delete</button>
						</template>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
	<div v-if="isLoading" class="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
		<div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
	</div>
</template>

<script setup>
	import { ref, onMounted } from "vue";
	import { db } from "../firebase";
	import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

	const courses = ref([]);
	const courseName = ref("");
	const courseCode = ref("");

	const editId = ref(null);
	const editedCourseName = ref("");
	const editedCourseCode = ref("");

	const isLoading = ref(false);

	const startEdit = (course) => {
		editId.value = course.id;
		editedCourseName.value = course.courseName;
		editedCourseCode.value = course.courseCode;
	};

	const cancelEdit = () => {
		editId.value = null;
		editedCourseName.value = "";
		editedCourseCode.value = "";
	};

	const saveEdit = async (id) => {
		if (!editedCourseName.value || !editedCourseCode.value) {
			alert("Both fields are required");
			return;
		}

		isLoading.value = true;
		const courseRef = doc(db, "courses", id);
		await updateDoc(courseRef, {
			courseName: editedCourseName.value,
			courseCode: editedCourseCode.value,
			createdAt: serverTimestamp(),
		});
		isLoading.value = false;

		cancelEdit();
	};

	const fetchCourses = () => {
		isLoading.value = true;
		const coursesRef = collection(db, "courses");

		const q = query(coursesRef, orderBy("createdAt", "desc"));

		onSnapshot(q, (snapshot) => {
			courses.value = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
			isLoading.value = false;
		});
	};

	const addCourse = async () => {
		if (!courseName.value || !courseCode.value) return alert("Course Name and Code are required");
		isLoading.value = true;
		await addDoc(collection(db, "courses"), { courseCode: courseCode.value, courseName: courseName.value, createdAt: serverTimestamp() });
		courseName.value = "";
		courseCode.value = "";
	};

	const deleteCourse = async (id) => {
		isLoading.value = true;
		await deleteDoc(doc(db, "courses", id));
	};

	onMounted(fetchCourses);
</script>
