<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useSemesterStore } from '@/stores/semester'
import { useRequestStore } from '@/stores/request'
import { getStatusColor, formatTimestamp, exportToCSV } from '@/helpers'
import AppLayout from '@/components/layouts/AppLayout.vue'
import RequestFilters from '../components/requests/RequestFilters.vue'
import AppLoader from '../components/ui/AppLoader.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseList from '../components/ui/BaseList.vue'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import { FileDown } from 'lucide-vue-next'

const authStore = useAuthStore()
const semesterStore = useSemesterStore()
const requestStore = useRequestStore()

const { filters, requests } = storeToRefs(requestStore)
const { activeSemester } = storeToRefs(semesterStore)
const { user } = storeToRefs(authStore)

const loading = ref(true)
const exporting = ref(false)

// ⚠️ Como a lista é paginada, esses filtros só se aplicam ao que já foi
// carregado (não ao semestre inteiro) — por isso o hint na tela quando um
// filtro está ativo e ainda há mais páginas pra carregar.
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

    const sigaMatch =
      filters.value.siga === '' ||
      (filters.value.siga === 'Sim' && r.siga === true) ||
      (filters.value.siga === 'Não' && r.siga === false)

    return nameMatch && semesterMatch && courseMatch && statusMatch && sigaMatch
  })
)

const hasActiveFilter = computed(
  () =>
    !!filters.value.name ||
    !!filters.value.course ||
    !!filters.value.status ||
    !!filters.value.siga
)

const loadMore = async () => {
  await requestStore.get(filters.value.semester)
}

watch(
  () => filters.value.semester,
  async () => {
    if (filters.value.semester) await loadMore()
  },
  { immediate: true }
)

onMounted(async () => {
  await semesterStore.get()
  filters.value.status = filters.value.status ?? 'Aguardando'
  filters.value.semester = activeSemester.value?.name
    ? activeSemester.value.name
    : filters.value.semester
  if (filters.value.semester) await loadMore()
  loading.value = false
})

// Exportar sempre traz o semestre inteiro, mesmo que a tela só tenha
// carregado algumas páginas até aqui.
const handleExport = async () => {
  exporting.value = true
  try {
    await requestStore.loadAll(filters.value.semester)
    exportToCSV(filteredRequests.value)
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <AppLayout
    title="Pedidos de Regularização"
    :description="`Olá, ${user?.email}`"
  >
    <template #actions>
      <div class="space-x-2 flex items-center">
        <BaseButton
          v-if="filteredRequests.length"
          @click="handleExport"
          :loading="exporting"
          variant="secondary"
          icon
          title="Exportar semestre inteiro para CSV"
        >
          <FileDown class="w-4 h-4" />
        </BaseButton>
        <span class="font-bold">
          {{ filteredRequests.length }} carregado(s)
        </span>
      </div>
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
            :active="request.siga"
            v-for="request in filteredRequests"
            :key="request.id"
            :to="{ name: 'request-details', params: { id: request.id } }"
          >
            <div class="flex justify-between items-start flex-wrap gap-2">
              <div>
                <h2 class="font-semibold text-lg">{{ request.name }}</h2>
              </div>
            </div>

            <div
              class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600"
            >
              <div class="text-xs">
                <p>{{ request.email }}</p>
                <p>DRE: {{ request.register }} - {{ request.course }}</p>
                <p class="text-sm text-green-700 mt-1" v-if="request.siga">
                  Efetivado no SIGA
                </p>
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

        <div v-if="!loading && requestStore.hasMore" class="text-center pt-2">
          <p
            v-if="hasActiveFilter"
            class="text-xs text-gray-500 mb-2"
          >
            Os filtros valem só pra o que já foi carregado — carregue mais
            pra ver mais resultados.
          </p>
          <BaseButton
            variant="secondary"
            :loading="requestStore.loadingMore"
            @click="loadMore"
          >
            Carregar mais
          </BaseButton>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
