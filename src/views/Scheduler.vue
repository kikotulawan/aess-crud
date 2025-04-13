<template>
	<div class="p-4 max-w-4xl mx-auto">
		<h1 class="text-2xl font-bold mb-4">Scheduler</h1>
		<button @click="runScheduler" class="px-4 py-2 bg-green-600 text-white rounded mb-4">Generate Schedule</button>

		<div v-if="schedules.length">
			<h2 class="text-xl font-semibold mb-2">Generated Schedule</h2>
			<ul class="space-y-2">
				<li v-for="schedule in schedules" :key="schedule.id" class="border p-3 rounded bg-white">
					<p><strong>Exam:</strong> {{ schedule.title }}</p>
					<p><strong>Room:</strong> {{ schedule.room }}</p>
					<p><strong>Time:</strong> {{ schedule.time }}</p>
				</li>
			</ul>
		</div>
	</div>
</template>

<script setup>
	import { ref } from "vue";
	import { getExams, generateSchedule, getSchedules } from "../api";

	const schedules = ref([]);

	const runScheduler = async () => {
		const exams = (await getExams()).data;
		await generateSchedule(exams);
		const result = await getSchedules();
		schedules.value = result.data;
	};
</script>
