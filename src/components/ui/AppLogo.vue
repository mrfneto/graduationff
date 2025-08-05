<script setup>
defineProps({
  to: [String, Object]
})
</script>

<template>
  <router-link :to="to" class="flex items-center space-x-2">
    <div
      class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"
    >
      <span class="text-white text-lg font-bold">A</span>
    </div>
    <span class="text-xl font-semibold text-gray-900">App</span>
  </router-link>
</template>
