<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: false }
})
</script>
<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ title }}</h1>
          <p v-if="description" class="text-gray-600 mt-2">
            {{ description }}
          </p>
        </div>
        <div class="mt-4 md:mt-0" v-if="$slots.actions">
          <slot name="actions" />
        </div>
      </div>
    </div>

    <slot />
  </div>
</template>
