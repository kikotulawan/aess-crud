<template>
	<div class="bg-gray-100 text-gray-800">
		<nav class="bg-white shadow px-6 py-4 flex justify-between items-center fixed inset-x-0 top-0">
			<h1 class="text-xl font-bold text-blue-600 inline-flex items-center gap-1">
				<img src="/aess-logo.png" alt="aess" class="w-10" />
			</h1>
			<div class="space-x-4">
				<router-link to="/courses" class="hover:underline">Courses</router-link>
				<router-link to="/instructors" class="hover:underline">Instructors</router-link>
				<router-link to="/sections" class="hover:underline">Sections</router-link>
				<router-link to="/subjects" class="hover:underline">Subjects</router-link>
				<router-link to="/scheduler" class="hover:underline">Scheduler</router-link>
			</div>
		</nav>

		<main>
			<router-view />
		</main>
	</div>
</template>

<script setup>
	// nothing needed here unless you want global state/hooks
</script>
