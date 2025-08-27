<script setup>
import BaseInput from '../ui/BaseInput.vue'
import { useSemesterStore } from '@/stores/semester'
import { useRequestStore } from '@/stores/request'
import { statusOptions } from '@/helpers'
import BaseCard from '../ui/BaseCard.vue'
import { computed, onMounted } from 'vue'

const semesterStore = useSemesterStore()
const requestStore = useRequestStore()

const filters = requestStore.filters

const semesterOptions = computed(() => {
  return semesterStore.semesters.map(semester => semester.name)
})

onMounted(async () => {
  await semesterStore.get()
})
</script>

<template>
  <BaseCard small class="card mb-6 space-y-4">
    <h2 class="text-xl font-bold mb-2">Filtros</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <BaseInput
        type="select"
        id="filter-semester"
        label="Semestre"
        v-model="filters.semester"
        :options="semesterOptions"
        placeholder="Selecione um semestre"
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
