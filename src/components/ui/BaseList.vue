<script setup>
import { Edit } from 'lucide-vue-next'
import BaseButton from './BaseButton.vue'

defineProps({
  to: [String, Object]
})
</script>
<template>
  <li
    class="bg-white px-4 py-2 rounded-md shadow-sm flex items-start space-x-3"
  >
    <div class="flex-1 overflow-hidden text-ellipsis">
      <slot />
    </div>

    <BaseButton
      icon
      size="sm"
      :to="to"
      variant="secondary"
      title="Gerenciar"
      aria-label="Gerenciar"
    >
      <Edit class="w-4 h-4 text-primary-500" />
    </BaseButton>
  </li>
</template>

<style scoped></style>
