<script setup lang="ts">
import AppLogo from '../ui/AppLogo.vue'
import BaseCard from '../ui/BaseCard.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <AppLogo to="/" class="mx-auto" />
      </div>

      <!-- Auth Content -->
      <BaseCard>
        <slot />
      </BaseCard>

      <!-- Back to Home -->
      <div class="text-center mt-6">
        <router-link
          :to="{ name: 'home' }"
          class="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
        >
          ← Voltar ao início
        </router-link>
      </div>
    </div>
  </div>
</template>
