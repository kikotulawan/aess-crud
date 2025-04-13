<template>
	<div class="container mx-auto pt-20 pb-10 min-h-screen">
		<h1 class="text-2xl font-bold mb-6">Examination Schedule</h1>

		<div class="grid grid-cols-3 gap-4 mb-6">
			<select v-model="selectedSemester" class="border p-2 rounded appearance-none" required>
				<option value="" disabled>Select Semester</option>
				<option value="1st Semester">1st Semester</option>
				<option value="2nd Semester">2nd Semester</option>
				<option value="3rd Semester">3rd Semester</option>
			</select>

			<select v-model="selectedYearLevel" class="border p-2 rounded appearance-none" required>
				<option value="" disabled>Select Year Level</option>
				<option value="1st Year">1st Year</option>
				<option value="2nd Year">2nd Year</option>
				<option value="3rd Year">3rd Year</option>
				<option value="4th Year">4th Year</option>
			</select>
		</div>

		<div v-if="showSubjects" class="mb-6">
			<h2 class="text-lg font-semibold mb-2">Select Subjects</h2>
			<div class="grid grid-cols-3 gap-2">
				<label v-for="subject in filteredSubjects" :key="subject.id" class="flex items-center space-x-2">
					<input type="checkbox" :value="subject" v-model="selectedSubjects" />
					<span>{{ subject.subjectName }} ({{ subject.subjectCode }})</span>
				</label>
			</div>
		</div>

		<div class="inline-flex items-center gap-2">
			<select v-model="selectedCourseId" class="border p-2 rounded appearance-none" required>
				<option value="" disabled>Select Course</option>
				<option v-for="course in courses" :key="course.id" :value="course.id">{{ course.courseName }}</option>
			</select>
			<button @click="generateSchedule" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50" :disabled="!selectedSubjects.length"> Generate Schedule </button>
		</div>

		<div v-if="generatedSchedule.length" class="mt-10">
			<h2 class="text-lg font-semibold mb-4">Generated Schedule</h2>

			<div v-for="(sectionSchedule, sectionName) in groupedSchedule" :key="sectionName" class="mb-8">
				<h3 class="font-bold mb-2">Section: {{ sectionName }}</h3>
				<table class="table-auto w-full border-collapse border border-gray-200">
					<thead class="bg-gray-100">
						<tr>
							<th class="border p-2">Code</th>
							<th class="border p-2">Subject</th>
							<th class="border p-2">Day</th>
							<th class="border p-2">Time</th>
							<th class="border p-2">Instructor</th>
							<th class="border p-2">Room</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="item in sectionSchedule" :key="item.subjectId + item.sectionId">
							<td class="border p-2">{{ item.subjectCode }}</td>
							<td class="border p-2">{{ item.subjectName }}</td>
							<td class="border p-2">{{ item.day }}</td>
							<td class="border p-2">{{ item.time }}</td>
							<td class="border p-2">{{ item.instructorName }}</td>
							<td class="border p-2">{{ item.room }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref, computed, onMounted, watch } from "vue";
	import { db } from "../firebase";
	import { collection, getDocs } from "firebase/firestore";

	const courses = ref([]);
	const subjects = ref([]);
	const sections = ref([]);
	const instructors = ref([]);

	const selectedSemester = ref("");
	const selectedYearLevel = ref("");
	const selectedCourseId = ref("");
	const selectedSubjects = ref([]);
	const generatedSchedule = ref([]);
	const filteredSubjects = ref([]);

	const fetchData = async () => {
		const courseSnap = await getDocs(collection(db, "courses"));
		courses.value = courseSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

		const subjectSnap = await getDocs(collection(db, "subjects"));
		subjects.value = subjectSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

		const sectionSnap = await getDocs(collection(db, "sections"));
		sections.value = sectionSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

		const instructorSnap = await getDocs(collection(db, "instructors"));
		instructors.value = instructorSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
	};

	const showSubjects = computed(() => {
		return selectedSemester.value && selectedYearLevel.value && filteredSubjects.value.length;
	});

	const getInstructorName = (id) => {
		const instructor = instructors.value.find((i) => i.id === id);
		return instructor ? instructor.instructorName : "Unknown";
	};

	const generateSchedule = () => {
		if (!selectedCourseId.value) return alert("Select a course to generate schedule");

		const timeSlots = [];
		let start = 6 * 60; // in minutes (6:00 AM)
		const end = 19 * 60; // in minutes (0:00 PM)

		const breakTime = { start: 10 * 60, end: 10 * 60 + 30 }; // 10:00 AM - 10:30 AM
		const lunchTime = { start: 12 * 60, end: 13 * 60 }; // 12:00 PM - 1:00 PM

		// Build 90-minute slots, skip over break and lunch
		while (start + 90 <= end) {
			const slotEnd = start + 90;

			// Skip if overlaps with break or lunch
			if ((start < breakTime.end && slotEnd > breakTime.start) || (start < lunchTime.end && slotEnd > lunchTime.start)) {
				start = slotEnd; // move to next slot
				continue;
			}

			timeSlots.push(`${formatTime(start)} - ${formatTime(slotEnd)}`);
			start = slotEnd;
		}

		const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
		const schedule = [];
		const usedSlots = new Set();
		const dailyLimit = 2;

		const relatedSections = sections.value.filter((sec) => sec.courseId === selectedCourseId.value && sec.yearLevel === selectedYearLevel.value);

		const sectionDailyCount = {};

		const sectionChunks = chunkSections(relatedSections, 5); // 5 sections per group
		let slotIndex = 0;

		sectionChunks.forEach((chunk, groupIndex) => {
			const localUsedSlots = new Set(); // isolated per group

			chunk.forEach((section) => {
				let sectionDailyCount = {};

				selectedSubjects.value.forEach((subject) => {
					let assigned = false;
					let tries = 0;

					while (!assigned && tries < days.length * timeSlots.length) {
						const day = days[tries % days.length];
						if (!sectionDailyCount[day]) sectionDailyCount[day] = 0;

						if (sectionDailyCount[day] >= 2 && tries < days.length) {
							tries++;
							continue;
						}

						for (let time of timeSlots) {
							const slotKey = `${groupIndex}-${day}-${time}`;

							if (!localUsedSlots.has(slotKey)) {
								localUsedSlots.add(slotKey);
								sectionDailyCount[day]++;

								schedule.push({
									sectionId: section.id,
									sectionName: section.sectionName,
									subjectId: subject.id,
									subjectCode: subject.subjectCode,
									subjectName: subject.subjectName,
									instructorName: getInstructorName(subject.instructorId),
									room: subject.room,
									day,
									time,
								});
								assigned = true;
								break;
							}
						}
						tries++;
					}
				});
			});
		});

		// relatedSections.forEach((section) => {
		// 	sectionDailyCount[section.id] = {};

		// 	selectedSubjects.value.forEach((subject) => {
		// 		let assigned = false;

		// 		let tries = 0;
		// 		while (!assigned && tries < days.length * 2) {
		// 			const d = tries % days.length;
		// 			const day = days[d];

		// 			if (!sectionDailyCount[section.id][day]) {
		// 				sectionDailyCount[section.id][day] = 0;
		// 			}

		// 			// allow 2 exams/day, relax to 3 if absolutely needed
		// 			if (sectionDailyCount[section.id][day] >= 2 && tries < days.length) {
		// 				tries++;
		// 				continue;
		// 			}

		// 			for (let t = 0; t < timeSlots.length; t++) {
		// 				const time = timeSlots[t];
		// 				const slotKey = `${day}-${time}`;

		// 				if (!usedSlots.has(slotKey)) {
		// 					usedSlots.add(slotKey);
		// 					sectionDailyCount[section.id][day]++;

		// 					schedule.push({
		// 						sectionId: section.id,
		// 						sectionName: section.sectionName,
		// 						subjectId: subject.id,
		// 						subjectCode: subject.subjectCode,
		// 						subjectName: subject.subjectName,
		// 						day,
		// 						time,
		// 					});

		// 					assigned = true;
		// 					break;
		// 				}
		// 			}

		// 			tries++;
		// 		}

		// 		if (!assigned) {
		// 			console.warn(`Could not assign time for subject ${subject.subjectCode} for section ${section.sectionName}`);
		// 		}
		// 	});
		// });

		generatedSchedule.value = schedule;
	};

	const chunkSections = (array, size) => array.reduce((acc, _, i) => (i % size ? acc : [...acc, array.slice(i, i + size)]), []);

	const formatTime = (minutes) => {
		const hour = Math.floor(minutes / 60);
		const min = minutes % 60;
		const suffix = hour >= 12 ? "PM" : "AM";
		const displayHour = hour % 12 === 0 ? 12 : hour % 12;
		const displayMin = min.toString().padStart(2, "0");
		return `${displayHour}:${displayMin} ${suffix}`;
	};

	const groupedSchedule = computed(() => {
		const groups = {};
		generatedSchedule.value.forEach((item) => {
			if (!groups[item.sectionName]) groups[item.sectionName] = [];
			groups[item.sectionName].push(item);
		});
		return groups;
	});

	const hasSectionConflict = (subject, day, time, schedule) => {
		const relatedSections = sections.value.filter((sec) => sec.courseId === selectedCourseId.value && sec.yearLevel === selectedYearLevel.value);

		if (relatedSections.length <= 1) return false;

		// Check if another subject with the same day/time is already scheduled for any of the related sections
		return schedule.some((entry) => {
			if (entry.day !== day || entry.time !== time) return false;

			// Now check if the conflicting subject is linked to the same course/year level (thus overlapping students)
			const otherSubject = selectedSubjects.value.find((s) => s.id === entry.subjectId);

			if (!otherSubject) return false;

			const sectionsA = sections.value.filter((sec) => sec.courseId === selectedCourseId.value && sec.yearLevel === selectedYearLevel.value && sec.id === subject.sectionId);
			const sectionsB = sections.value.filter((sec) => sec.courseId === selectedCourseId.value && sec.yearLevel === selectedYearLevel.value && sec.id === otherSubject.sectionId);

			// If the two subjects belong to different sections but same course/year, consider it a conflict
			return sectionsA.length && sectionsB.length && subject.id !== otherSubject.id;
		});
	};

	const formatHour = (hour) => {
		const suffix = hour >= 12 ? "PM" : "AM";
		const displayHour = hour % 12 === 0 ? 12 : hour % 12;
		return `${displayHour}:00 ${suffix}`;
	};

	watch([selectedSemester, selectedYearLevel], async ([semester, year]) => {
		console.log(selectedSemester.value, selectedYearLevel.value);
		if (semester && year) {
			const subjectSnap = await getDocs(collection(db, "subjects"));
			filteredSubjects.value = subjectSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).filter((sub) => sub.semester === semester && sub.yearLevel === year);
		} else {
			filteredSubjects.value = [];
		}
	});

	onMounted(() => {
		fetchData();
	});
</script>
