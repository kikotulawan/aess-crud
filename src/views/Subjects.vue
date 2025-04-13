<template>
	<div class="container mx-auto flex flex-col pt-[100px] min-h-screen pb-20">
		<form @submit.prevent="addSubject" class="flex flex-col space-y-2">
			<h1 class="text-xl font-bold">Subjects</h1>
			<div class="grid grid-cols-3 gap-2">
				<input v-model="subjectName" class="border p-2 w-full" placeholder="Subject Name" required />
				<input v-model="subjectCode" class="border p-2 w-full" placeholder="Subject Code" required />
				<select v-model="semester" class="border p-2 w-full appearance-none" required>
					<option value="" disabled>Select Semester</option>
					<option value="1st Semester">1st Semester</option>
					<option value="2nd Semester">2nd Semester</option>
					<option value="3rd Semester">3rd Semester</option>
				</select>
				<select v-model="yearLevel" class="border p-2 w-full appearance-none" required>
					<option value="" disabled>Select Year Level</option>
					<option value="1st Year">1st Year</option>
					<option value="2nd Year">2nd Year</option>
					<option value="3rd Year">3rd Year</option>
					<option value="4th Year">4th Year</option>
				</select>
				<select v-model="selectedInstructorId" class="border p-2 w-full appearance-none" required>
					<option value="" disabled>Select Instructor</option>
					<option v-for="instructor in instructors" :key="instructor.id" :value="instructor.id">
						{{ instructor.instructorName }}
					</option>
				</select>

				<select v-model="unit" class="border p-2 w-full appearance-none" required>
					<option value="" disabled>Select Unit</option>
					<option v-for="i in 5" :key="i" :value="i">{{ i }}</option>
				</select>

				<input v-model="room" class="border p-2 w-full" placeholder="Room" required />
				<button class="w-full bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-400 active:bg-blue-600">Add New Subject</button>
			</div>
		</form>

		<div class="mt-6 max-w-2xl">
			<input v-model="searchQuery" @input="fetchSubjects" type="text" class="w-full border p-2 rounded" placeholder="Search by subject, course, or instructor..." />
		</div>
		<table class="table-auto mt-10 w-full border-collapse border border-gray-200 rounded-lg">
			<thead class="bg-gray-100 text-left">
				<tr>
					<th class="p-3 border border-gray-200">Subject Name</th>
					<th class="p-3 border border-gray-200">Subject Code</th>
					<th class="p-3 border border-gray-200">Semester</th>
					<th class="p-3 border border-gray-200">Year Level</th>
					<th class="p-3 border border-gray-200">Instructor</th>
					<th class="p-3 border border-gray-200">Unit</th>
					<th class="p-3 border border-gray-200">Room</th>
					<th class="p-3 border border-gray-200">Actions</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="subject in subjects" :key="subject.id" class="hover:bg-gray-50 transition">
					<td class="p-3 border border-gray-200">
						<template v-if="editId === subject.id">
							<input v-model="editedSubjectName" class="border p-1 w-full" />
						</template>
						<template v-else>
							{{ subject.subjectName }}
						</template>
					</td>
					<td class="p-3 border border-gray-200">
						<template v-if="editId === subject.id">
							<input v-model="editedSubjectCode" class="border p-1 w-full" />
						</template>
						<template v-else>
							{{ subject.subjectCode }}
						</template>
					</td>
					<td class="p-3 border border-gray-200">
						<template v-if="editId === subject.id">
							<select v-model="editedSemester" class="border p-1 w-full appearance-none">
								<option value="1st Semester">1st Semester</option>
								<option value="2nd Semester">2nd Semester</option>
								<option value="3rd Semester">3rd Semester</option>
							</select>
						</template>
						<template v-else>
							{{ subject.semester }}
						</template>
					</td>
					<td class="p-3 border border-gray-200">
						<template v-if="editId === subject.id">
							<select v-model="editedYearLevel" class="border p-1 w-full appearance-none">
								<option value="1st Year">1st Year</option>
								<option value="2nd Year">2nd Year</option>
								<option value="3rd Year">3rd Year</option>
								<option value="4th Year">4th Year</option>
							</select>
						</template>
						<template v-else>
							{{ subject.yearLevel }}
						</template>
					</td>
					<td class="p-3 border border-gray-200">
						<template v-if="editId === subject.id">
							<select v-model="editedInstructorId" class="border p-1 w-full appearance-none">
								<option v-for="instructor in instructors" :key="instructor.id" :value="instructor.id">
									{{ instructor.instructorName }}
								</option>
							</select>
						</template>
						<template v-else>
							{{ getInstructorName(subject.instructorId) }}
						</template>
					</td>
					<td class="p-3 border border-gray-200">
						<template v-if="editId === subject.id">
							<select v-model="editedUnit" class="border p-1 w-full appearance-none">
								<option value="" disabled>Select Unit</option>
								<option v-for="i in 5" :key="i" :value="i">{{ i }}</option>
							</select>
						</template>
						<template v-else>
							{{ subject.unit }}
						</template>
					</td>
					<td class="p-3 border border-gray-200">
						<template v-if="editId === subject.id">
							<input v-model="editedRoom" class="border p-1 w-full" />
						</template>
						<template v-else>
							{{ subject.room }}
						</template>
					</td>
					<td class="p-3 border border-gray-200 space-x-2">
						<template v-if="editId === subject.id">
							<button @click="saveEdit(subject.id)" class="text-green-600 hover:underline">Save</button>
							<button @click="cancelEdit" class="text-gray-500 hover:underline">Cancel</button>
						</template>
						<template v-else>
							<button @click="startEdit(subject)" class="text-blue-600 hover:underline">Edit</button>
							<button @click="deleteSubject(subject.id)" class="text-red-600 hover:underline">Delete</button>
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

	const instructors = ref([]);
	const subjects = ref([]);
	const subjectName = ref("");
	const subjectCode = ref("");
	const semester = ref("");
	const yearLevel = ref("");
	const selectedInstructorId = ref("");
	const unit = ref("");
	const room = ref("");
	const searchQuery = ref("");

	const editId = ref(null);
	const editedSubjectName = ref("");
	const editedSubjectCode = ref("");
	const editedSemester = ref("");
	const editedYearLevel = ref("");
	const editedInstructorId = ref("");
	const editedUnit = ref("");
	const editedRoom = ref("");

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

	const getInstructorName = (id) => {
		const instructor = instructors.value.find((i) => i.id === id);
		return instructor ? instructor.instructorName : "Unknown";
	};

	const startEdit = (subject) => {
		editId.value = subject.id;
		editedSubjectName.value = subject.subjectName;
		editedSubjectCode.value = subject.subjectCode;
		editedSemester.value = subject.semester;
		editedYearLevel.value = subject.yearLevel;
		editedInstructorId.value = subject.instructorId;
		editedUnit.value = subject.unit;
		editedRoom.value = subject.room;
	};

	const cancelEdit = () => {
		editId.value = null;
		editedSubjectName.value = "";
		editedSubjectCode.value = "";
		editedSemester.value = "";
		editedYearLevel.value = "";
		editedInstructorId.value = "";
		editedUnit.value = "";
		editedRoom.value = "";
	};

	const saveEdit = async (id) => {
		if (!editedSubjectName.value || !editedSubjectCode.value || !editedInstructorId.value || !editedUnit.value) {
			alert("All fields are required");
			return;
		}

		isLoading.value = true;
		const subjectRef = doc(db, "subjects", id);
		await updateDoc(subjectRef, {
			subjectName: editedSubjectName.value,
			subjectCode: editedSubjectCode.value,
			semester: editedSemester.value,
			yearLevel: editedYearLevel.value,
			unit: editedUnit.value,
			instructorId: editedInstructorId.value,
			room: editedRoom.value,
			createdAt: serverTimestamp(),
		});

		const updatedSubject = {
			id,
			subjectName: editedSubjectName.value,
			subjectCode: editedSubjectCode.value,
			semester: editedSemester.value,
			yearLevel: editedYearLevel.value,
			unit: editedUnit.value,
			room: editedRoom.value,
			instructorId: editedInstructorId.value,
		};

		const index = subjects.value.findIndex((subject) => subject.id === id);
		if (index !== -1) {
			subjects.value[index] = updatedSubject;
		}

		isLoading.value = false;

		cancelEdit();
	};

	const fetchInstructors = async () => {
		const instructorsRef = collection(db, "instructors");
		onSnapshot(instructorsRef, (snapshot) => {
			instructors.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
		});
	};

	const fetchSubjects = async (direction = "initial") => {
		isLoading.value = true;

		if (searchQuery.value.trim() !== "" || direction === "search") {
			const snapshot = await getDocs(query(collection(db, "subjects"), orderBy("createdAt", "desc")));
			const allDocs = snapshot.docs.map((doc) => ({
				...doc.data(),
				id: doc.id,
			}));

			const lowered = searchQuery.value.toLowerCase();
			fullFilteredResults.value = allDocs.filter((subject) => {
				const instructorName = getInstructorName(subject.instructorId)?.toLowerCase() || "";
				return subject.subjectName.toLowerCase().includes(lowered) || subject.subjectCode.toLowerCase().includes(lowered) || instructorName.includes(lowered);
			});

			totalSearchPages.value = Math.ceil(fullFilteredResults.value.length / pageSize);

			const start = (currentPage.value - 1) * pageSize;
			const end = start + pageSize;
			subjects.value = fullFilteredResults.value.slice(start, end);

			isPrevDisabled.value = currentPage.value === 1;
			isNextDisabled.value = currentPage.value >= totalSearchPages.value;

			isLoading.value = false;
			return;
		}

		let q = query(collection(db, "subjects"), orderBy("createdAt", "desc"), limit(pageSize));

		if (direction === "next" && lastVisible.value) {
			q = query(collection(db, "subjects"), orderBy("createdAt", "desc"), startAfter(lastVisible.value), limit(pageSize));
		} else if (direction === "prev" && firstVisible.value) {
			q = query(collection(db, "subjects"), orderBy("createdAt", "desc"), endBefore(firstVisible.value), limit(pageSize));
		}

		const snapshot = await getDocs(q);
		const docs = snapshot.docs.map((doc) => ({
			...doc.data(),
			id: doc.id,
		}));

		subjects.value = docs;
		currentPageDocs.value = snapshot.docs;

		firstVisible.value = snapshot.docs[0];
		lastVisible.value = snapshot.docs[snapshot.docs.length - 1];

		isPrevDisabled.value = currentPage.value === 1;
		isNextDisabled.value = snapshot.docs.length < pageSize;
		isLoading.value = false;
	};

	const goToNextPage = () => {
		currentPage.value++;
		fetchSubjects(searchQuery.value ? "search" : "next");
	};

	const goToPrevPage = () => {
		if (currentPage.value > 1) {
			currentPage.value--;
			fetchSubjects(searchQuery.value ? "search" : "prev");
		}
	};

	const addSubject = async () => {
		if (!subjectName.value || !subjectCode.value || !selectedInstructorId.value || !unit.value) {
			alert("Subject name, subject code, course, instructor, and unit are required");
			return;
		}

		isLoading.value = true;

		await addDoc(collection(db, "subjects"), {
			subjectName: subjectName.value,
			subjectCode: subjectCode.value,
			semester: semester.value,
			yearLevel: yearLevel.value,
			unit: unit.value,
			instructorId: selectedInstructorId.value,
			room: room.value,
			createdAt: serverTimestamp(),
		});

		subjectName.value = "";
		subjectCode.value = "";
		semester.value = "";
		yearLevel.value = "";
		unit.value = "";
		room.value = "";
		selectedInstructorId.value = "";

		if (searchQuery.value.trim()) {
			await fetchSubjects("search");
		} else {
			currentPage.value = 1;
			await fetchSubjects("initial");
		}

		isLoading.value = false;
	};

	const deleteSubject = async (id) => {
		isLoading.value = true;
		await deleteDoc(doc(db, "subjects", id));
	};

	watch(searchQuery, () => {
		currentPage.value = 1;
		fetchSubjects("initial");
	});
	onMounted(async () => {
		await fetchInstructors();
		await fetchSubjects("initial");
	});
</script>
