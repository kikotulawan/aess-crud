<template>
	<div class="container mx-auto flex flex-col pt-[100px] min-h-screen pb-20">
		<form @submit.prevent="addSection" class="flex flex-col space-y-2 max-w-2xl">
			<h1 class="text-xl font-bold">Sections</h1>
			<div class="inline-flex items-center gap-2">
				<input v-model="sectionName" class="border p-2 w-full" placeholder="Section Name" required />
				<select v-model="yearLevel" class="border p-2 w-full appearance-none" required>
					<option value="" disabled>Select Year Level</option>
					<option value="1st Year">1st Year</option>
					<option value="2nd Year">2nd Year</option>
					<option value="3rd Year">3rd Year</option>
					<option value="4th Year">4th Year</option>
				</select>
				<select v-model="selectedCourseId" class="border p-2 w-full appearance-none" required>
					<option value="" disabled>Select Course</option>
					<option v-for="course in courses" :key="course.id" :value="course.id">
						{{ course.courseName }}
					</option>
				</select>
				<button class="w-full bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-400 active:bg-blue-600">Add New Section</button>
			</div>
		</form>

		<div class="mt-6 max-w-2xl">
			<input v-model="searchQuery" @input="fetchSections" type="text" class="w-full border p-2 rounded" placeholder="Search by section, year level, or course..." />
		</div>
		<table class="table-auto mt-10 w-full border-collapse border border-gray-200 rounded-lg">
			<thead class="bg-gray-100 text-left">
				<tr>
					<th class="p-3 border border-gray-200">Section Name</th>
					<th class="p-3 border border-gray-200">Year Level</th>
					<th class="p-3 border border-gray-200">Course</th>
					<th class="p-3 border border-gray-200">Actions</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="section in sections" :key="section.id" class="hover:bg-gray-50 transition">
					<td class="p-3 border border-gray-200">
						<template v-if="editId === section.id">
							<input v-model="editedSectionName" class="border p-1 w-full" />
						</template>
						<template v-else>
							{{ section.sectionName }}
						</template>
					</td>
					<td class="p-3 border border-gray-200">
						<template v-if="editId === section.id">
							<select v-model="editedYearLevel" class="border p-1 w-full appearance-none">
								<option value="1st Year">1st Year</option>
								<option value="2nd Year">2nd Year</option>
								<option value="3rd Year">3rd Year</option>
								<option value="4th Year">4th Year</option>
							</select>
						</template>
						<template v-else>
							{{ section.yearLevel }}
						</template>
					</td>
					<td class="p-3 border border-gray-200">
						<template v-if="editId === section.id">
							<select v-model="editedCourseId" class="border p-1 w-full appearance-none">
								<option v-for="course in courses" :key="course.id" :value="course.id">
									{{ course.courseName }}
								</option>
							</select>
						</template>
						<template v-else>
							{{ getCourseName(section.courseId) }}
						</template>
					</td>
					<td class="p-3 border border-gray-200 space-x-2">
						<template v-if="editId === section.id">
							<button @click="saveEdit(section.id)" class="text-green-600 hover:underline">Save</button>
							<button @click="cancelEdit" class="text-gray-500 hover:underline">Cancel</button>
						</template>
						<template v-else>
							<button @click="startEdit(section)" class="text-blue-600 hover:underline">Edit</button>
							<button @click="deleteSection(section.id)" class="text-red-600 hover:underline">Delete</button>
						</template>
					</td>
				</tr>
			</tbody>
		</table>

		<div class="flex justify-between items-center mt-6">
			<button @click="goToPrevPage" :disabled="isPrevDisabled" class="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"> Previous </button>

			<p class="text-sm text-gray-600">Page {{ currentPage }}</p>

			<button @click="goToNextPage" :disabled="isNextDisabled" class="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"> Next </button>
		</div>
	</div>
	<div v-if="isLoading" class="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
		<div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
	</div>
</template>

<script setup>
	import { ref, onMounted, watch } from "vue";
	import { db } from "../firebase";
	import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, updateDoc, serverTimestamp, query, orderBy, limit, startAfter, endBefore } from "firebase/firestore";

	const courses = ref([]);
	const sections = ref([]);
	const sectionName = ref("");
	const yearLevel = ref("");
	const selectedCourseId = ref("");
	const searchQuery = ref("");

	const editId = ref(null);
	const editedSectionName = ref("");
	const editedYearLevel = ref("");
	const editedCourseId = ref("");

	const pageSize = 10;
	const lastVisible = ref(null);
	const firstVisible = ref(null);
	const currentPageDocs = ref([]);
	const isNextDisabled = ref(false);
	const isPrevDisabled = ref(true);
	const currentPage = ref(1);
	const fullFilteredResults = ref([]);
	const totalSearchPages = ref(1);

	const isLoading = ref(false);

	const getCourseName = (id) => {
		const course = courses.value.find((c) => c.id === id);
		return course ? course.courseName : "Unknown";
	};

	const startEdit = (section) => {
		editId.value = section.id;
		editedSectionName.value = section.sectionName;
		editedYearLevel.value = section.yearLevel;
		editedCourseId.value = section.courseId;
	};

	const cancelEdit = () => {
		editId.value = null;
		editedSectionName.value = "";
		editedYearLevel.value = "";
	};

	const saveEdit = async (id) => {
		if (!editedSectionName.value || !editedYearLevel.value) {
			alert("Section name and year level are required");
			return;
		}

		isLoading.value = true;
		const sectionRef = doc(db, "sections", id);
		await updateDoc(sectionRef, {
			sectionName: editedSectionName.value,
			yearLevel: editedYearLevel.value,
			courseId: editedCourseId.value,
			createdAt: serverTimestamp(),
		});

		const updatedSection = {
			id,
			sectionName: editedSectionName.value,
			yearLevel: editedYearLevel.value,
			courseId: editedCourseId.value,
		};

		const index = sections.value.findIndex((section) => section.id === id);
		if (index !== -1) {
			sections.value[index] = updatedSection;
		}

		isLoading.value = false;

		cancelEdit();
	};

	const fetchCourses = async () => {
		const coursesRef = collection(db, "courses");
		onSnapshot(coursesRef, (snapshot) => {
			courses.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
		});
	};

	const fetchSections = async (direction = "initial") => {
		isLoading.value = true;

		if (searchQuery.value.trim() !== "" || direction === "search") {
			const snapshot = await getDocs(query(collection(db, "sections"), orderBy("createdAt", "desc")));
			const allDocs = snapshot.docs.map((doc) => ({
				...doc.data(),
				id: doc.id,
			}));

			const lowered = searchQuery.value.toLowerCase();
			fullFilteredResults.value = allDocs.filter((section) => {
				const courseName = getCourseName(section.courseId)?.toLowerCase() || "";
				return section.sectionName.toLowerCase().includes(lowered) || section.yearLevel.toLowerCase().includes(lowered) || courseName.includes(lowered);
			});

			totalSearchPages.value = Math.ceil(fullFilteredResults.value.length / pageSize);

			const start = (currentPage.value - 1) * pageSize;
			const end = start + pageSize;
			sections.value = fullFilteredResults.value.slice(start, end);

			isPrevDisabled.value = currentPage.value === 1;
			isNextDisabled.value = currentPage.value >= totalSearchPages.value;

			isLoading.value = false;
			return;
		}

		let q = query(collection(db, "sections"), orderBy("createdAt", "desc"), limit(pageSize));

		if (direction === "next" && lastVisible.value) {
			q = query(collection(db, "sections"), orderBy("createdAt", "desc"), startAfter(lastVisible.value), limit(pageSize));
		} else if (direction === "prev" && firstVisible.value) {
			q = query(collection(db, "sections"), orderBy("createdAt", "desc"), endBefore(firstVisible.value), limit(pageSize));
		}

		const snapshot = await getDocs(q);
		const docs = snapshot.docs.map((doc) => ({
			...doc.data(),
			id: doc.id,
		}));

		sections.value = docs;
		currentPageDocs.value = snapshot.docs;

		firstVisible.value = snapshot.docs[0];
		lastVisible.value = snapshot.docs[snapshot.docs.length - 1];

		isPrevDisabled.value = currentPage.value === 1;
		isNextDisabled.value = snapshot.docs.length < pageSize;
		isLoading.value = false;
	};

	const goToNextPage = () => {
		currentPage.value++;
		fetchSections(searchQuery.value ? "search" : "next");
	};

	const goToPrevPage = () => {
		if (currentPage.value > 1) {
			currentPage.value--;
			fetchSections(searchQuery.value ? "search" : "prev");
		}
	};

	const addSection = async () => {
		if (!sectionName.value || !yearLevel.value || !selectedCourseId.value) {
			alert("Section name, year level, and course are required");
			return;
		}

		isLoading.value = true;

		await addDoc(collection(db, "sections"), {
			sectionName: sectionName.value,
			yearLevel: yearLevel.value,
			courseId: selectedCourseId.value,
			createdAt: serverTimestamp(),
		});

		sectionName.value = "";
		yearLevel.value = "";
		selectedCourseId.value = "";

		if (searchQuery.value.trim()) {
			await fetchSections("search");
		} else {
			currentPage.value = 1;
			await fetchSections("initial");
		}

		isLoading.value = false;
	};

	const deleteSection = async (id) => {
		isLoading.value = true;
		await deleteDoc(doc(db, "sections", id));
	};

	watch(searchQuery, () => {
		currentPage.value = 1;
		fetchSections("initial");
	});
	onMounted(async () => {
		await fetchCourses();
		await fetchSections("initial");
	});
</script>
