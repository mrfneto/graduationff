<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRequestStore } from '@/stores/request'
import { useCoordinatorStore } from '@/stores/coordinator'
import {
  getStatusColor,
  formatTimestamp,
  irregularityStatusOptions,
  computeRequestStatus
} from '@/helpers'

//
import { MoveLeft } from 'lucide-vue-next'
import AppLayout from '@/components/layouts/AppLayout.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import sweet from '@/composables/sweet'

const route = useRoute()
const router = useRouter()

const requestStore = useRequestStore()
const coordinatorStore = useCoordinatorStore()

const request = ref(null)
const loading = ref(true)
const saving = ref(false)

const id = computed(() => route.params.id || null)

const coordinatorOptions = computed(() => {
  return coordinatorStore.coordinators.map(
    coordinator => `${coordinator.siape} - ${coordinator.name}`
  )
})

// 🧮 O status do pedido nunca é escolhido manualmente — é sempre calculado
// a partir do status de cada irregularidade (ver computeRequestStatus em
// helpers/index.js). A coordenação expressa a decisão marcando cada item
// individualmente como Autorizado / Não autorizado / Pendente.
const previewStatus = computed(() =>
  request.value ? computeRequestStatus(request.value.irregularities) : null
)

onMounted(async () => {
  await coordinatorStore.get([{ field: 'active', value: true }])
  const result = await requestStore.getById(id.value)
  request.value = result
  loading.value = false
})

const handleSubmit = async () => {
  saving.value = true
  try {
    request.value.status = previewStatus.value

    await requestStore.save(request.value, id.value)
    await sweet.info('Parecer salvo com sucesso.')

    router.push({ name: 'requests' })
  } catch (error) {
    console.error(error)
    await sweet.error('Ocorreu um erro ao salvar.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppLayout
    title="Análise da Solicitação"
    :description="`Código: ${request?.access_code}`"
  >
    <template #actions>
      <BaseButton :to="{ name: 'requests' }" variant="secondary">
        <MoveLeft class="size-4 mr-2" />
        Voltar
      </BaseButton>
    </template>
    <AppLoader v-if="loading" />

    <p v-else-if="!request" class="text-center text-red-500">
      Solicitação não encontrada.
    </p>

    <div v-else>
      <!-- Grupo 1: Detalhes do pedido -->
      <BaseCard class="space-y-6 mb-4">
        <div>
          <h2 class="font-semibold text-lg mb-2">Informações do Aluno</h2>
          <!-- Dados pessoais -->
          <div class="grid md:grid-cols-2 text-sm">
            <p><strong>Nome:</strong> {{ request.name }}</p>
            <p>
              <strong>Status:</strong>
              <BaseBadge :variant="getStatusColor(request.status)">
                {{ request.status }}
              </BaseBadge>
            </p>
            <p><strong>Email:</strong> {{ request.email }}</p>
            <p><strong>Curso:</strong> {{ request.course }}</p>
            <p><strong>Matrícula:</strong> {{ request.register }}</p>
            <p>
              <strong>Data:</strong> {{ formatTimestamp(request.created_at) }}
            </p>
          </div>
          <!-- Observações -->
          <div class="mb-4">
            <h3 class="font-semibold text-lg mb-2 mt-4">
              Observações do Aluno
            </h3>
            <p class="whitespace-pre-wrap">{{ request.obs }}</p>
          </div>

          <div class="space-y-4">
            <!-- Lista de irregularidas -->
            <h3 class="text-lg font-semibold">Irregularidades</h3>
            <div
              v-for="(item, index) in request.irregularities"
              :key="index"
              class="bg-gray-100 rounded-md p-2"
            >
              <div class="grid md:grid-cols-2 md:gap-4 items-center mb-1">
                <span class="font-medium">
                  {{ item.name }}
                  <span
                    v-if="item.appealUsed"
                    class="text-xs font-normal text-gray-500"
                  >
                    (recurso já utilizado)
                  </span>
                </span>

                <div class="space-x-4 flex items-center flex-wrap">
                  <label
                    v-for="option in irregularityStatusOptions"
                    :key="option"
                    class="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      v-model="item.status"
                      :value="option"
                      class="form-radio h-4 w-4 outline-none"
                      :class="{
                        'text-green-600': option === 'Autorizado',
                        'text-red-600': option === 'Não autorizado',
                        'text-yellow-600': option === 'Pendente'
                      }"
                    />
                    <span class="text-sm text-gray-700">{{ option }}</span>
                  </label>
                </div>
              </div>
              <div>
                <p>
                  <span class="text-sm font-semibold">Justificativa:</span>
                  {{ item.description }}
                </p>
              </div>

              <div class="mt-2" v-if="item.status !== 'Autorizado'">
                <label
                  :for="`coordinator-note-${index}`"
                  class="text-sm font-semibold block mb-1"
                >
                  Parecer do coordenador
                  <span class="font-normal text-gray-500">
                    (visível para o aluno)
                  </span>
                </label>
                <textarea
                  :id="`coordinator-note-${index}`"
                  v-model="item.coordinatorNote"
                  placeholder="Explique o que precisa ser corrigido ou complementado nesta irregularidade..."
                  class="w-full border border-gray-300 rounded-md p-2 text-sm min-h-[70px]"
                ></textarea>
              </div>

              <!-- Recurso enviado pelo aluno (se houver) -->
              <div
                v-if="item.appeal"
                class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md"
              >
                <p class="text-sm font-semibold text-blue-900">
                  Recurso do aluno:
                </p>
                <p class="text-sm text-blue-900 whitespace-pre-wrap">
                  {{ item.appeal }}
                </p>
              </div>

              <!-- Resposta do aluno a uma pendência (se houver) -->
              <div
                v-if="item.pendingResponse"
                class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md"
              >
                <p class="text-sm font-semibold text-yellow-900">
                  Resposta do aluno à pendência:
                </p>
                <p class="text-sm text-yellow-900 whitespace-pre-wrap">
                  {{ item.pendingResponse }}
                </p>
              </div>
            </div>

            <!-- Documentos do aluno -->
            <div v-if="request.driveLink">
              <h3 class="text-lg font-semibold">Documentos</h3>
              <a
                :href="request.driveLink"
                target="_blank"
                rel="noopener"
                class="text-blue-600 underline break-all"
              >
                Abrir documentos no Google Drive
              </a>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Grupo 2: Decisão da Coordenação -->
      <BaseCard title="Decisão da Coordenação">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid md:grid-cols-2 gap-4">
            <BaseInput
              type="textarea"
              id="opinion"
              v-model="request.opinion"
              label="Observações gerais"
              placeholder="Opcional — use o parecer de cada irregularidade acima para explicar decisões específicas"
              hint="Em caso de pendência corrigível, marque a irregularidade como 'Pendente' e use o parecer dela — o aluno poderá editar e reenviar a solicitação pelo próprio sistema. Se indeferir, o aluno poderá abrir um recurso (uma única vez por irregularidade)."
            />

            <div>
              <BaseInput
                id="coordinator"
                type="select"
                v-model="request.coordinator"
                :options="coordinatorOptions"
                label="Coordenador Responsável"
                placeholder="Nome do coordenador"
                required
              />

              <div class="mt-4">
                <span class="text-sm font-medium text-gray-700 block mb-1">
                  Status do pedido (calculado automaticamente)
                </span>
                <BaseBadge :variant="getStatusColor(previewStatus)">
                  {{ previewStatus }}
                </BaseBadge>
                <p class="text-xs text-gray-500 mt-1">
                  Calculado a partir do status marcado em cada irregularidade
                  acima.
                </p>
              </div>

              <div>
                <label
                  class="inline-flex items-center space-x-2 cursor-pointer mt-4"
                >
                  <input
                    type="checkbox"
                    v-model="request.siga"
                    class="form-checkbox h-5 w-5 text-primary-600"
                  />
                  <span
                    :class="request.siga ? 'text-green-600' : 'text-red-600'"
                    >{{
                      request.siga
                        ? 'Lançado no SIGA pela Secretaria'
                        : 'Não lançado no SIGA pela Secretaria'
                    }}</span
                  >
                </label>
              </div>
            </div>
          </div>

          <div class="flex items-center flex-wrap gap-4">
            <BaseButton :loading="saving" class="flex-1">
              Salvar Parecer
            </BaseButton>
            <BaseButton
              :to="{ name: 'requests' }"
              type="button"
              variant="secondary"
            >
              Cancelar
            </BaseButton>
          </div>
        </form>
      </BaseCard>
    </div>
  </AppLayout>
</template>
