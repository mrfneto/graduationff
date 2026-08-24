<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRequestStore } from '@/stores/request'
import { useCoordinatorStore } from '@/stores/coordinator'
import {
  sendEmail,
  getStatusColor,
  formatTimestamp,
  formatDateLong,
  finalStatusOptions
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
const sendingEmail = ref(false)

const id = computed(() => route.params.id || null)

const coordinatorOptions = computed(() => {
  return coordinatorStore.coordinators.map(
    coordinator => `${coordinator.siape} - ${coordinator.name}`
  )
})

// 🧮 Status sugerido automaticamente a partir das irregularidades marcadas
// como autorizadas/não autorizadas — serve de ponto de partida, mas a
// coordenação pode sobrescrever manualmente (ex.: escolher "Pendência" em
// vez de "Indeferido"/"Deferido-Parcial" quando é algo corrigível).
const computeAutoStatus = () => {
  const total = request.value.irregularities.length
  const authorizeds = request.value.irregularities.filter(
    i => i.authorized
  ).length

  return authorizeds === total
    ? 'Deferido'
    : authorizeds > 0
    ? 'Deferido-Parcial'
    : 'Indeferido'
}

const finalStatus = ref('Indeferido')
const statusManuallySet = ref(false)

// Enquanto a coordenação não mexer manualmente no campo de status, ele
// acompanha o cálculo automático conforme as irregularidades são marcadas.
watch(
  () => request.value?.irregularities.map(i => i.authorized),
  () => {
    if (request.value && !statusManuallySet.value) {
      finalStatus.value = computeAutoStatus()
    }
  },
  { deep: true }
)

const handleStatusOverride = () => {
  statusManuallySet.value = true
}

const resetStatusSuggestion = () => {
  statusManuallySet.value = false
  finalStatus.value = computeAutoStatus()
}

onMounted(async () => {
  await coordinatorStore.get([{ field: 'active', value: true }])
  const result = await requestStore.getById(id.value)
  request.value = result
  loading.value = false

  if (request.value && request.value.status !== 'Aguardando') {
    // Pedido já analisado antes: mantém o status decidido como ponto de
    // partida do campo (a coordenação pode ajustar e salvar de novo).
    finalStatus.value = request.value.status
    statusManuallySet.value = true
  } else if (request.value) {
    finalStatus.value = computeAutoStatus()
  }
})

const handleSubmit = async () => {
  saving.value = true
  try {
    request.value.status = finalStatus.value

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

// 📧 Envio manual do e-mail de notificação ao aluno — separado do "Salvar
// Parecer" para a coordenação poder revisar a decisão antes de notificar.
const handleSendEmail = async () => {
  sendingEmail.value = true
  try {
    await sendEmail(request.value)
    request.value.sentAt = new Date().toISOString()
    await requestStore.save(request.value, id.value)
    await sweet.success('E-mail enviado ao aluno com sucesso!')
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)
    await sweet.error('Não foi possível enviar o e-mail. Tente novamente.')
  } finally {
    sendingEmail.value = false
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
                <span class="font-medium">{{ item.name }}</span>

                <div class="space-x-4 flex items-center">
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      v-model="item.authorized"
                      :value="true"
                      class="form-radio h-4 w-4 text-green-600 outline-none"
                    />
                    <span class="text-sm text-gray-700">Autorizada</span>
                  </label>

                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      v-model="item.authorized"
                      :value="false"
                      class="form-radio h-4 w-4 text-red-600 outline-none"
                    />
                    <span class="text-sm text-gray-700">Não autorizada</span>
                  </label>
                </div>
              </div>
              <div>
                <p>
                  <span class="text-sm font-semibold">Justificativa:</span>
                  {{ item.description }}
                </p>
              </div>
              <div class="mt-2" v-if="!item.authorized">
                <label
                  :for="`coordinator-note-${index}`"
                  class="text-sm font-semibold block mb-1"
                >
                  Observação da coordenação
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

      <!-- Grupo 2: Parecer do Coordenador -->
      <BaseCard
        title="Parecer do Coordenador"
        :description="
          request.sentAt &&
          `Parecer enviado via e-mail em: ${formatDateLong(request?.sentAt)}`
        "
      >
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid md:grid-cols-2 gap-4">
            <BaseInput
              type="textarea"
              id="opinion"
              v-model="request.opinion"
              label="Parecer do coordenador"
              placeholder="Informe o parecer aqui"
              required
              hint="Em caso de pendência corrigível, use a observação em cada irregularidade acima e escolha o status 'Pendência' ao lado — o aluno poderá editar e reenviar a solicitação pelo próprio sistema."
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
                <BaseInput
                  id="finalStatus"
                  type="select"
                  v-model="finalStatus"
                  @change="handleStatusOverride"
                  :options="finalStatusOptions"
                  label="Status final do pedido"
                  required
                />
                <button
                  v-if="statusManuallySet"
                  type="button"
                  class="text-xs text-primary-600 underline mt-1"
                  @click="resetStatusSuggestion"
                >
                  Usar sugestão automática ({{ computeAutoStatus() }})
                </button>
                <p v-else class="text-xs text-gray-500 mt-1">
                  Sugestão automática com base nas irregularidades marcadas.
                  Você pode alterar, por exemplo para "Pendência".
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
              type="button"
              variant="secondary"
              :loading="sendingEmail"
              :disabled="request.status === 'Aguardando'"
              :title="
                request.status === 'Aguardando'
                  ? 'Salve o parecer antes de enviar o e-mail'
                  : 'Enviar e-mail com o parecer para o aluno'
              "
              @click="handleSendEmail"
            >
              Enviar E-mail ao Aluno
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
