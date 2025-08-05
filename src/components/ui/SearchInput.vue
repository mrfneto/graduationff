<script setup>
import { Search, Loader } from 'lucide-vue-next'

const model = defineModel()

defineProps({
  placeholder: String,
  loading: Boolean,
  id: String
})

const emit = defineEmits(['submitted'])

const onSubmit = () => {
  emit('submitted')
}
</script>
<template>
  <form role="search" class="max-w-md mx-auto" @submit.prevent="onSubmit">
    <label
      for="default-search"
      class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
      >Search</label
    >
    <div class="relative">
      <div
        class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none"
      >
        <Loader
          v-if="loading"
          class="w-4 h-4 text-gray-500 dark:text-gray-400"
        />
        <Search v-else class="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </div>
      <input
        :id="id || 'search'"
        type="search"
        id="default-search"
        class="block w-full px-4 py-3.5 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
        :placeholder="placeholder"
        required
        v-model="model"
      />
      <button
        type="submit"
        class="text-white absolute end-2.5 bottom-1.5 bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2"
      >
        Buscar
      </button>
    </div>
  </form>
</template>
