<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useSemesterStore } from '@/stores/semester'
import { useRequestStore } from '@/stores/request'
import { getStatusColor, formatTimestamp } from '@/helpers'
import AppLayout from '@/components/layouts/AppLayout.vue'
import RequestFilters from '../components/requests/RequestFilters.vue'
import AppLoader from '../components/ui/AppLoader.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseList from '../components/ui/BaseList.vue'
import BaseBadge from '../components/ui/BaseBadge.vue'

const authStore = useAuthStore()
const semesterStore = useSemesterStore()
const requestStore = useRequestStore()

const loading = ref(true)
const { filters, requests } = storeToRefs(requestStore)
const { activeSemester } = storeToRefs(semesterStore)
const { user } = storeToRefs(authStore)

const filteredRequests = computed(() =>
  requests.value.filter(r => {
    const nameMatch = r.name
      .toLowerCase()
      .includes(filters.value.name.toLowerCase())
    const semesterMatch = filters.value.semester
      ? r.semester === filters.value.semester
      : true
    const courseMatch =
      filters.value.course === '' || r.course === filters.value.course
    const statusMatch =
      filters.value.status === '' || r.status === filters.value.status
    return nameMatch && semesterMatch && courseMatch && statusMatch
  })
)

const loadRequest = async () => {
  await requestStore.get([
    {
      field: 'semester',
      value: filters.value.semester
    }
  ])
}

watch(
  () => filters.value.semester,
  async newSemester => {
    if (newSemester) {
      loadRequest()
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await semesterStore.get()
  filters.value.semester = activeSemester.value?.name || ''
  await loadRequest()
  loading.value = false
})
</script>

<template>
  <AppLayout
    title="Pedidos de Regularização"
    :description="`Olá, ${user?.email}`"
  >
    <template #actions>
      <span class="font-bold">
        Total de pedidos: {{ filteredRequests.length }}
      </span>
    </template>
    <!-- Section: Filtros -->
    <RequestFilters />

    <div class="mt-8">
      <div class="flex flex-col space-y-4">
        <AppLoader v-if="loading" />
        <BaseCard
          v-else-if="filteredRequests.length === 0"
          class="text-center text-gray-500 py-12 border border-gray-200 rounded-md"
        >
          Nenhum pedido de regularização encontrado. Informe um semestre para
          carregar a lista.
        </BaseCard>

        <div class="space-y-2" v-else>
          <BaseList
            v-for="request in filteredRequests"
            :key="request.id"
            :to="{ name: 'request-details', params: { id: request.id } }"
          >
            <div class="flex justify-between items-start flex-wrap gap-2">
              <div>
                <h2 class="font-semibold text-lg">{{ request.name }}</h2>
                <!-- <p class="text-sm text-gray-500">
                  {{ request.register }} — {{ request.course }}
                </p> -->
              </div>
            </div>

            <div
              class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600"
            >
              <div class="text-xs">
                <p>{{ request.email }}</p>
                <p>DRE: {{ request.register }} - {{ request.course }}</p>
              </div>
              <div>
                <strong class="block text-gray-500">Semestre</strong>
                {{ request.semester }}
              </div>
              <div>
                <strong class="block text-gray-500">Status</strong>
                <BaseBadge :variant="getStatusColor(request.status)">{{
                  request.status
                }}</BaseBadge>
              </div>
              <div>
                <strong class="block text-gray-500">Data</strong>
                {{ formatTimestamp(request.created_at) }}
              </div>
            </div>
          </BaseList>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
