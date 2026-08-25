<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useSemesterStore } from '@/stores/semester'
import { useRequestStore } from '@/stores/request'
import { getStatusColor } from '@/helpers'

import AppLayout from '@/components/layouts/AppLayout.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import sweet from '@/composables/sweet'
import { CheckCircle } from 'lucide-vue-next'

const semesterStore = useSemesterStore()
const requestStore = useRequestStore()

// Filtros próprios da tela — começam vazios/em "Não", independente dos
// filtros usados na tela de Pedidos (requestStore.filters).
const filters = reactive({
  semester: '',
  siga: 'Não'
})

const loading = ref(false)
const savingId = ref(null)

const semesterOptions = computed(() =>
  semesterStore.semesters.map(semester => semester.name)
)

// Só pedidos Deferidos ou Deferido-Parciais entram na efetivação — os
// demais status não têm nada aprovado pra lançar no SIGA.
const effectivationRequests = computed(() =>
  requestStore.requests.filter(
    r => r.status === 'Deferido' || r.status === 'Deferido-Parcial'
  )
)

const filteredRequests = computed(() =>
  effectivationRequests.value.filter(r => {
    if (filters.siga === 'Sim') return r.siga === true
    if (filters.siga === 'Não') return r.siga !== true
    return true
  })
)

const loadRequests = async () => {
  if (!filters.semester) return
  loading.value = true
  await requestStore.get(filters.semester)
  loading.value = false
}

const loadMore = () => requestStore.get(filters.semester)

onMounted(async () => {
  await semesterStore.get()
})

const toggleEfetivado = async request => {
  savingId.value = request.id
  const novoValor = !request.siga
  try {
    // requestStore.save() já atualiza requests.value[index] internamente
    // (e a v-for reage a isso), não precisa mutar `request` aqui também.
    await requestStore.save({ ...request, siga: novoValor }, request.id)
  } catch (error) {
    console.error('[Efetivação] Erro ao atualizar SIGA:', error)
    await sweet.error('Não foi possível salvar. Tente novamente.')
  } finally {
    savingId.value = null
  }
}

// Salva ao sair do campo (blur), não a cada tecla — evita gravar no
// Firestore a cada caractere digitado.
const saveSigaNote = async request => {
  savingId.value = request.id
  try {
    await requestStore.save(
      { ...request, sigaNote: (request.sigaNote || '').trim() },
      request.id
    )
  } catch (error) {
    console.error('[Efetivação] Erro ao salvar observação:', error)
    await sweet.error('Não foi possível salvar a observação. Tente novamente.')
  } finally {
    savingId.value = null
  }
}

const extractCoordinatorName = str => {
  return str?.split(' - ')[1] || str || ''
}
</script>

<template>
  <AppLayout
    title="Efetivação"
    description="Marque os pedidos deferidos já lançados no SIGA."
  >
    <BaseCard small class="mb-6">
      <h2 class="text-xl font-bold mb-4">Filtros</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseInput
          type="select"
          id="filter-semester"
          label="Semestre"
          v-model="filters.semester"
          :options="semesterOptions"
          placeholder="Selecione um semestre"
          @change="loadRequests"
        />
        <BaseInput
          type="select"
          id="filter-siga"
          label="Efetivado no SIGA"
          v-model="filters.siga"
          :options="['Sim', 'Não']"
          :disabled="!filters.semester"
        />
      </div>
    </BaseCard>

    <AppLoader v-if="loading" />

    <BaseCard
      v-else-if="!filters.semester"
      class="text-center text-gray-500 py-12 border border-gray-200 rounded-md"
    >
      Selecione um semestre para carregar os pedidos deferidos.
    </BaseCard>

    <BaseCard
      v-else-if="filteredRequests.length === 0"
      class="text-center text-gray-500 py-12 border border-gray-200 rounded-md"
    >
      Nenhum pedido deferido encontrado com esse filtro.
    </BaseCard>

    <div v-else class="space-y-3">
      <p class="text-sm text-gray-600 mb-2">
        {{ filteredRequests.length }} pedido(s) carregado(s)
      </p>

      <BaseCard
        v-for="request in filteredRequests"
        :key="request.id"
        small
      >
        <div class="flex flex-col md:flex-row md:items-start gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <h3 class="font-semibold">{{ request.name }}</h3>
              <BaseBadge :variant="getStatusColor(request.status)">
                {{ request.status }}
              </BaseBadge>
            </div>
            <p class="text-xs text-gray-500 mb-3">
              DRE: {{ request.register }} · {{ request.course }}
              <template v-if="request.coordinator">
                · Coordenador(a): {{ extractCoordinatorName(request.coordinator) }}
              </template>
            </p>

            <ul class="space-y-1">
              <li
                v-for="(irr, index) in request.irregularities"
                :key="index"
                class="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1"
              >
                <span>{{ irr.name }}</span>
                <BaseBadge :variant="getStatusColor(irr.status)">
                  {{ irr.status }}
                </BaseBadge>
              </li>
            </ul>

            <div class="mt-3">
              <label
                :for="`siga-note-${request.id}`"
                class="text-xs font-semibold text-gray-500 block mb-1"
              >
                Observação da secretaria
              </label>
              <textarea
                :id="`siga-note-${request.id}`"
                v-model="request.sigaNote"
                placeholder="Ex.: pendência com a secretaria acadêmica, aguardando confirmação..."
                class="w-full border border-gray-300 rounded-md p-2 text-sm min-h-[50px]"
                @blur="saveSigaNote(request)"
              ></textarea>
            </div>
          </div>

          <div
            class="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0"
          >
            <BaseButton
              :to="{ name: 'request-details', params: { id: request.id } }"
              variant="secondary"
              size="sm"
            >
              Ver pedido
            </BaseButton>

            <label
              class="flex items-center gap-2 cursor-pointer select-none"
              :class="savingId === request.id ? 'opacity-50 pointer-events-none' : ''"
            >
              <input
                type="checkbox"
                class="form-checkbox h-5 w-5 text-primary-600"
                :checked="request.siga === true"
                @change="toggleEfetivado(request)"
              />
              <span
                class="text-sm font-medium flex items-center gap-1"
                :class="request.siga ? 'text-green-600' : 'text-gray-600'"
              >
                <CheckCircle v-if="request.siga" class="w-4 h-4" />
                Efetivado
              </span>
            </label>
          </div>
        </div>
      </BaseCard>
    </div>

    <div v-if="!loading && filters.semester && requestStore.hasMore" class="text-center pt-4">
      <p class="text-xs text-gray-500 mb-2">
        O filtro de "Efetivado no SIGA" vale só pra o que já foi
        carregado — carregue mais pra ver mais resultados.
      </p>
      <BaseButton
        variant="secondary"
        :loading="requestStore.loadingMore"
        @click="loadMore"
      >
        Carregar mais
      </BaseButton>
    </div>
  </AppLayout>
</template>
