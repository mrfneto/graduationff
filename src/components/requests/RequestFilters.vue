<script setup>
import BaseInput from '../ui/BaseInput.vue'

import { useRequestStore } from '@/stores/request'
import { statusOptions } from '@/helpers'
import BaseCard from '../ui/BaseCard.vue'

const requestStore = useRequestStore()
const filters = requestStore.filters
</script>

<template>
  <BaseCard small class="card mb-6 space-y-4">
    <h2 class="text-xl font-bold mb-2">Filtros</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <BaseInput
        id="filter-semester"
        label="Semestre"
        v-model="filters.semester"
        placeholder="Semestre (ex: 2025-2)"
      />
      <BaseInput
        id="filter-name"
        label="Nome"
        v-model="filters.name"
        placeholder="Buscar por nome"
        :disabled="!filters.semester"
      />

      <BaseInput
        type="select"
        id="filter-course"
        v-model="filters.course"
        :options="['Integral', 'Noturno']"
        placeholder="Todos os cursos"
        label="Curso"
        :disabled="!filters.semester"
      />
      <BaseInput
        type="select"
        v-model="filters.status"
        id="filter-status"
        class="capitalize"
        :options="statusOptions"
        placeholder="todos"
        label="Status"
        :disabled="!filters.semester"
      />
    </div>
  </BaseCard>
</template>
