<script setup>
defineProps({
  to: [String, Object]
})
</script>

<template>
  <router-link :to="to" class="flex items-center space-x-2">
    <img
      src="@/assets/logo-farmc3a1cia.jpg"
      alt="Logo Faculdade de Farmácia - UFRJ"
      class="h-10 w-auto"
    />
  </router-link>
</template>
