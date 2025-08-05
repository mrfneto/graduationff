<script setup>
defineProps({
  title: String,
  description: String,
  small: Boolean
})
</script>
<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100">
    <!-- header -->
    <div
      v-if="title"
      class="border-b border-gray-200"
      :class="small ? 'p-4' : 'p-6'"
    >
      <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
      <p class="text-gray-600 mt-2">
        {{ description }}
      </p>
    </div>
    <div :class="small ? 'p-4' : 'p-6'">
      <slot />
    </div>
    <!-- content -->
  </div>
</template>
