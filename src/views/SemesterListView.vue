<script setup>
import { ref, onMounted } from 'vue'
import { useSemesterStore } from '@/stores/semester'
import { formatDate } from '../helpers'
import { Plus } from 'lucide-vue-next'

import AppLayout from '@/components/layouts/AppLayout.vue'
import AppLoader from '../components/ui/AppLoader.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseList from '../components/ui/BaseList.vue'

const semesterStore = useSemesterStore()

const state = ref({
  loading: true
})

onMounted(async () => {
  await semesterStore.get()
  state.value.loading = false
})

const getStatus = status => {
  const variants = {
    ativo: 'success',
    previsto: 'warning',
    encerrado: 'default'
  }
  return variants[status] || 'default'
}
</script>

<template>
  <AppLayout
    title="Semestres"
    description="Gerencie os semestres cadastrados ou cadastre um novo."
  >
    <template #actions>
      <BaseButton :to="{ name: 'semester-create' }">
        <Plus class="size-4 mr-2" />
        Novo semestre
      </BaseButton>
    </template>

    <div class="mt-8">
      <div class="flex flex-col space-y-4">
        <AppLoader v-if="state.loading" />
        <BaseCard
          v-else-if="semesterStore.semesters.length === 0"
          class="text-center text-gray-500 py-12 border border-gray-200 rounded-md"
        >
          Nenhum semestre cadastrado.
        </BaseCard>

        <BaseList
          v-for="semester in semesterStore.semesters"
          :key="semester.id"
          :to="{ name: 'semester-update', params: { id: semester.id } }"
        >
          <div class="flex-1">
            <div class="flex items-center space-x-4 mb-1">
              <h3 class="heading-lg mb-0">{{ semester.name }}</h3>
              <BaseBadge :variant="getStatus(semester.status)">
                {{ semester.status }}
              </BaseBadge>
            </div>
            <p class="text-gray-500 text-sm">
              {{ formatDate(semester.start) }} à {{ formatDate(semester.end) }}
            </p>
          </div>
        </BaseList>
      </div>
    </div>
  </AppLayout>
</template>
