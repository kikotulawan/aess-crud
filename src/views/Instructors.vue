<template>
	<div class="container mx-auto flex flex-col pt-[100px] min-h-screen pb-20">
		<form @submit.prevent="addInstructor" class="flex flex-col space-y-2 max-w-lg">
			<h1 class="text-xl font-bold">Instructors</h1>
			<div class="inline-flex items-center gap-2">
				<input v-model="instructorName" class="border p-2 w-full" placeholder="Instructor Name" required />
				<input v-model="instructorId" class="border p-2 w-full" placeholder="ID No." required />
				<button class="w-full bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-400 active:bg-blue-600"> Add New Instructor </button>
			</div>
		</form>

		<div class="mt-6 max-w-lg">
			<input v-model="searchQuery" @input="fetchInstructors" type="text" class="w-full border p-2 rounded" placeholder="Search instructor name or ID..." />
		</div>

		<table class="table-auto mt-10 w-full border-collapse border border-gray-200 rounded-lg">
			<thead class="bg-gray-100 text-left">
				<tr>
					<th class="p-3 border border-gray-200">Instructor Name</th>
					<th class="p-3 border border-gray-200">Instructor ID</th>
					<th class="p-3 border border-gray-200">Actions</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="instructor in instructors" :key="instructor.id" class="hover:bg-gray-50 transition">
					<td class="p-3 border border-gray-200">
						<template v-if="editId === instructor.id">
							<input v-model="editedInstructorName" class="border p-1 w-full" />
						</template>
						<template v-else>
							{{ instructor.instructorName }}
						</template>
					</td>
					<td class="p-3 border border-gray-200">
						<template v-if="editId === instructor.id">
							<input v-model="editedInstructorId" class="border p-1 w-full" />
						</template>
						<template v-else>
							{{ instructor.instructorId }}
						</template>
					</td>
					<td class="p-3 border border-gray-200 space-x-2">
						<template v-if="editId === instructor.id">
							<button @click="saveEdit(instructor.id)" class="text-green-600 hover:underline">Save</button>
							<button @click="cancelEdit" class="text-gray-500 hover:underline">Cancel</button>
						</template>
						<template v-else>
							<button @click="startEdit(instructor)" class="text-blue-600 hover:underline">Edit</button>
							<button @click="deleteInstructor(instructor.id)" class="text-red-600 hover:underline">Delete</button>
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
	import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy, limit, startAfter, endBefore } from "firebase/firestore";

	const instructors = ref([]);
	const instructorName = ref("");
	const instructorId = ref("");

	const editId = ref(null);
	const editedInstructorName = ref("");
	const editedInstructorId = ref("");

	const isLoading = ref(false);
	const searchQuery = ref("");

	const pageSize = 5;
	const lastVisible = ref(null);
	const firstVisible = ref(null);
	const currentPage = ref(1);
	const fullFilteredResults = ref([]);
	const totalSearchPages = ref(1);
	const isNextDisabled = ref(false);
	const isPrevDisabled = ref(true);

	const startEdit = (instructor) => {
		editId.value = instructor.id;
		editedInstructorName.value = instructor.instructorName;
		editedInstructorId.value = instructor.instructorId;
	};

	const cancelEdit = () => {
		editId.value = null;
		editedInstructorName.value = "";
		editedInstructorId.value = "";
	};

	const saveEdit = async (id) => {
		if (!editedInstructorName.value || !editedInstructorId.value) {
			alert("Both fields are required");
			return;
		}

		isLoading.value = true;
		const instructorRef = doc(db, "instructors", id);
		await updateDoc(instructorRef, {
			instructorName: editedInstructorName.value,
			instructorId: editedInstructorId.value,
			createdAt: serverTimestamp(),
		});
		isLoading.value = false;

		cancelEdit();
		await fetchInstructors();
	};

	const fetchInstructors = async (direction = "initial") => {
		isLoading.value = true;

		if (searchQuery.value.trim() !== "" || direction === "search") {
			const snapshot = await getDocs(query(collection(db, "instructors"), orderBy("createdAt", "desc")));
			const allDocs = snapshot.docs.map((doc) => ({
				...doc.data(),
				id: doc.id,
			}));

			const lowered = searchQuery.value.toLowerCase();
			fullFilteredResults.value = allDocs.filter((instructor) => {
				return instructor.instructorName.toLowerCase().includes(lowered) || instructor.instructorId.toLowerCase().includes(lowered);
			});

			totalSearchPages.value = Math.ceil(fullFilteredResults.value.length / pageSize);

			const start = (currentPage.value - 1) * pageSize;
			const end = start + pageSize;
			instructors.value = fullFilteredResults.value.slice(start, end);

			isPrevDisabled.value = currentPage.value === 1;
			isNextDisabled.value = currentPage.value >= totalSearchPages.value;

			isLoading.value = false;
			return;
		}

		let q = query(collection(db, "instructors"), orderBy("createdAt", "desc"), limit(pageSize));

		if (direction === "next" && lastVisible.value) {
			q = query(collection(db, "instructors"), orderBy("createdAt", "desc"), startAfter(lastVisible.value), limit(pageSize));
		} else if (direction === "prev" && firstVisible.value) {
			q = query(collection(db, "instructors"), orderBy("createdAt", "desc"), endBefore(firstVisible.value), limit(pageSize));
		}

		const snapshot = await getDocs(q);
		instructors.value = snapshot.docs.map((doc) => ({
			...doc.data(),
			id: doc.id,
		}));

		firstVisible.value = snapshot.docs[0];
		lastVisible.value = snapshot.docs[snapshot.docs.length - 1];

		isPrevDisabled.value = currentPage.value === 1;
		isNextDisabled.value = snapshot.docs.length < pageSize;
		isLoading.value = false;
	};

	const goToNextPage = () => {
		currentPage.value++;
		fetchInstructors(searchQuery.value ? "search" : "next");
	};

	const goToPrevPage = () => {
		if (currentPage.value > 1) {
			currentPage.value--;
			fetchInstructors(searchQuery.value ? "search" : "prev");
		}
	};

	const addInstructor = async () => {
		if (!instructorName.value || !instructorId.value) {
			alert("Instructor Name and ID are required");
			return;
		}

		isLoading.value = true;

		await addDoc(collection(db, "instructors"), {
			instructorName: instructorName.value,
			instructorId: instructorId.value,
			createdAt: serverTimestamp(),
		});

		instructorName.value = "";
		instructorId.value = "";

		if (searchQuery.value.trim()) {
			await fetchInstructors("search");
		} else {
			currentPage.value = 1;
			await fetchInstructors("initial");
		}

		isLoading.value = false;
	};

	const deleteInstructor = async (id) => {
		isLoading.value = true;
		await deleteDoc(doc(db, "instructors", id));
		await fetchInstructors(searchQuery.value ? "search" : "initial");
		isLoading.value = false;
	};

	watch(searchQuery, () => {
		currentPage.value = 1;
		fetchInstructors("search");
	});

	onMounted(fetchInstructors);
</script>
