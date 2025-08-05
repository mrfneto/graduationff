<!-- components/ui/Badge.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default'
  }
})

const variants = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800'
}

const badgeClass = computed(
  () =>
    `inline-block px-2 py-0.5 text-xs font-medium rounded  ${
      variants[props.variant] || variants.default
    }`
)
</script>

<template>
  <span :class="badgeClass">
    <slot />
  </span>
</template>
