<!-- components/ui/Alert.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: v =>
      ['default', 'success', 'warning', 'danger', 'info'].includes(v)
  }
})

const variants = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800'
}

const alertClass = computed(
  () =>
    `w-full p-4 rounded-md font-semibold ${
      variants[props.variant] || variants.default
    }`
)
</script>

<template>
  <span :class="alertClass" role="alert">
    <slot />
  </span>
</template>
