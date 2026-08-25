<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Stores
import { useSemesterStore } from '@/stores/semester'
import { useRequestStore } from '@/stores/request'

// Helpers
import { getStatusColor } from '@/helpers'

// Componentes
import { MoveLeft } from 'lucide-vue-next'
import AppLayout from '@/components/layouts/AppLayout.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import RequestIrregularities from '@/components/requests/RequestIrregularities.vue'

// Stores
const semesterStore = useSemesterStore()
const requestStore = useRequestStore()

// Router
const router = useRouter()
const route = useRoute()
const id = route.params.id || null

// Formulário
const form = ref({
  name: '',
  email: '',
  register: '',
  course: '',
  semester: '',
  irregularities: [],
  driveLink: '',
  obs: '',
  status: 'Aguardando',
  feedback: '',
  coordinator: '',
  siga: false
})

const errors = ref({})

// Aceita links de arquivo, pasta ou apresentação do Google Drive/Docs
const driveLinkPattern = /^https:\/\/(drive|docs)\.google\.com\/.+/i

// Estado reativo da view
const state = reactive({
  loading: true,
  saving: false,
  deleting: false,
  confirmDelete: false,
  error: null,
  isEmpty: false
})

// Computeds
const hasActiveSemester = computed(() => !!semesterStore.activeSemester)

// Reabre a edição sempre que existir ao menos uma irregularidade marcada
// como "Pendente" pela coordenação, ou "Não autorizada" com recurso ainda
// disponível — independente do status agregado do pedido (que pode ser
// Pendente, Deferido-Parcial ou Indeferido-Parcial, dependendo da
// combinação — ver computeRequestStatus em helpers/index.js).
const hasPendingIrregularity = computed(() =>
  form.value.irregularities.some(i => i.status === 'Pendente')
)
const hasAppealableIrregularity = computed(() =>
  form.value.irregularities.some(
    i => i.status === 'Não autorizado' && !i.appealUsed
  )
)
const canEdit = computed(
  () =>
    form.value.status === 'Aguardando' ||
    hasPendingIrregularity.value ||
    hasAppealableIrregularity.value
)

// Só entra no modo restrito (dados pessoais/documentos travados, só a
// irregularidade pendente ou o recurso editáveis) depois que o pedido já
// foi analisado ao menos uma vez. Antes disso (pedido novo, ou reaberto e
// ainda não reavaliado), a edição continua completa como sempre foi.
const isRestrictedEdit = computed(
  () => !!id && form.value.status !== 'Aguardando'
)

// Carrega dados na montagem
onMounted(async () => {
  await semesterStore.get()

  if (id) {
    const data = await requestStore.getById(id)
    if (data) {
      form.value = { ...form.value, ...data }
    } else {
      state.isEmpty = true
    }
  } else if (!hasActiveSemester.value) {
    state.isNotSemesterActive = true
  }

  state.loading = false
})

// Submissão
const handleSubmit = async () => {
  errors.value = {}
  state.saving = true

  try {
    if (!id) {
      if (!form.value.irregularities.length) {
        errors.value.irregularities =
          'Adicione pelo menos uma irregularidade.'
      }

      const driveLink = form.value.driveLink.trim()
      if (!driveLink) {
        errors.value.driveLink =
          'Informe o link do Google Drive com os documentos.'
      } else if (!driveLinkPattern.test(driveLink)) {
        errors.value.driveLink =
          'Informe um link válido do Google Drive (drive.google.com ou docs.google.com).'
      }

      if (Object.keys(errors.value).length > 0) {
        state.saving = false
        return
      }

      form.value.semester = semesterStore.activeSemester?.name || ''

      const isDuplicate = await requestStore.checkDuplicate(
        form.value.register,
        form.value.semester
      )
      if (isDuplicate) {
        errors.value.register =
          'Esta matrícula já possui uma solicitação registrada neste semestre.'
        state.saving = false
        return
      }
    } else if (isRestrictedEdit.value) {
      // Transforma recursos preenchidos: uma irregularidade "Não
      // autorizada" com texto de recurso novo volta a ficar "Pendente"
      // (reentra na fila de análise) e o recurso é marcado como usado —
      // não é permitido um segundo recurso para a mesma irregularidade.
      form.value.irregularities = form.value.irregularities.map(irr => {
        if (
          irr.status === 'Não autorizado' &&
          !irr.appealUsed &&
          irr.appeal?.trim()
        ) {
          return { ...irr, status: 'Pendente', appealUsed: true }
        }
        return irr
      })

      form.value.status = 'Aguardando'
    }

    const access_code = await requestStore.save(form.value, id)
    router.push({
      name: 'request-success',
      params: { code: access_code },
      // Só baixa o comprovante automaticamente em pedidos novos, não em
      // reenvios de pendência/recurso.
      query: id ? {} : { new: '1' }
    })
  } catch (err) {
    state.error = err.message || 'Erro ao salvar'
  } finally {
    state.saving = false
  }
}

// Exclusão
const handleDelete = async () => {
  if (!state.confirmDelete) {
    state.confirmDelete = true
    return
  }

  state.deleting = true
  try {
    await requestStore.remove(id)
    router.push({ name: 'home' })
  } catch (err) {
    state.error = err.message || 'Erro ao excluir'
  } finally {
    state.deleting = false
  }
}
</script>

<template>
  <AppLayout
    :title="`Nova Solicitação ${semesterStore.activeSemester?.name}`"
    :description="
      id
        ? 'Atualize as informações da sua solicitação'
        : 'Preencha o formulário abaixo para solicitar regularização de matrícula.'
    "
  >
    <template #actions>
      <BaseButton :to="{ name: 'home' }" variant="secondary">
        <MoveLeft class="size-4 mr-2" />
        Voltar
      </BaseButton>
    </template>
    <AppLoader v-if="state.loading" />
    <BaseAlert v-else-if="state.isEmpty" variant="danger">
      Nenhum pedido encontrado.
    </BaseAlert>
    <BaseAlert v-else-if="state.isNotSemesterActive" variant="danger">
      Não estamos aceitando novas solicitações. Entre em contato com a
      coordenação.
    </BaseAlert>
    <BaseCard v-else class="w-full max-w-2xl mx-auto">
      <BaseAlert
        v-if="isRestrictedEdit && hasPendingIrregularity"
        variant="warning"
        class="mb-6"
      >
        <p class="font-semibold mb-2">
          A coordenação identificou pendências neste pedido. Corrija os
          pontos abaixo e reenvie.
        </p>
        <ul class="list-disc ml-5 space-y-1">
          <li
            v-for="(irr, index) in form.irregularities.filter(
              i => i.status === 'Pendente' && i.coordinatorNote
            )"
            :key="index"
          >
            <strong>{{ irr.name }}:</strong> {{ irr.coordinatorNote }}
          </li>
        </ul>
      </BaseAlert>

      <BaseAlert
        v-if="isRestrictedEdit && hasAppealableIrregularity"
        variant="danger"
        class="mb-6"
      >
        <p class="font-semibold mb-2">
          Uma ou mais irregularidades foram indeferidas. Se quiser, você
          pode abrir um recurso — uma única vez por irregularidade —
          explicando por que discorda da decisão.
        </p>
        <ul class="list-disc ml-5 space-y-1">
          <li
            v-for="(irr, index) in form.irregularities.filter(
              i => i.status === 'Não autorizado' && !i.appealUsed && i.coordinatorNote
            )"
            :key="index"
          >
            <strong>{{ irr.name }}:</strong> {{ irr.coordinatorNote }}
          </li>
        </ul>
      </BaseAlert>

      <div class="mb-8">
        <form @submit.prevent="handleSubmit">
          <!-- Dados pessoais -->
          <div class="mb-8">
            <h3
              class="mb-6 border-b-2 border-gray-300 text-xl font-bold text-gray-900"
            >
              Dados pessoais
            </h3>

            <template v-if="!isRestrictedEdit">
              <BaseInput
                id="name"
                v-model="form.name"
                label="Nome completo required"
                class="mb-4"
              />
              <BaseInput
                id="email"
                v-model="form.email"
                label="E-mail required"
                type="email"
                class="mb-4"
              />
              <div class="grid md:grid-cols-2 gap-4">
                <BaseInput
                  id="register"
                  v-model="form.register"
                  label="Matrícula"
                  :error="errors.register"
                  required
                />
                <BaseInput
                  id="course"
                  type="select"
                  v-model="form.course"
                  label="Curso"
                  :options="['Integral', 'Noturno']"
                  required
                />
              </div>
            </template>
            <div v-else class="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
              <p><strong>Nome:</strong> {{ form.name }}</p>
              <p><strong>E-mail:</strong> {{ form.email }}</p>
              <p><strong>Matrícula:</strong> {{ form.register }}</p>
              <p><strong>Curso:</strong> {{ form.course }}</p>
            </div>
          </div>

          <!-- Irregularidades -->
          <div class="mb-8">
            <h3
              class="mb-6 border-b-2 border-gray-300 text-xl font-bold text-gray-900"
            >
              Irregularidades
            </h3>

            <RequestIrregularities
              v-if="!isRestrictedEdit"
              v-model:irregularities="form.irregularities"
            />

            <div v-else class="space-y-3">
              <div
                v-for="(irr, index) in form.irregularities"
                :key="index"
                class="p-3 border border-gray-200 rounded-lg"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium">{{ irr.name }}</span>
                  <BaseBadge :variant="getStatusColor(irr.status)">
                    {{ irr.status }}
                  </BaseBadge>
                </div>
                <p class="text-sm text-gray-600">{{ irr.description }}</p>
                <p
                  v-if="irr.coordinatorNote"
                  class="text-sm text-gray-600 mt-1"
                >
                  <strong>Observação da coordenação:</strong>
                  {{ irr.coordinatorNote }}
                </p>

                <!-- Recurso já enviado anteriormente (histórico) -->
                <p v-if="irr.appeal" class="text-sm text-gray-600 mt-1">
                  <strong>Seu recurso:</strong> {{ irr.appeal }}
                </p>

                <!-- Pendente: aluno responde num campo próprio, sem
                     sobrescrever a justificativa original -->
                <div v-if="irr.status === 'Pendente'" class="mt-2">
                  <label
                    :for="`irr-response-${index}`"
                    class="text-sm font-semibold block mb-1"
                  >
                    Responda à pendência
                  </label>
                  <textarea
                    :id="`irr-response-${index}`"
                    v-model="irr.pendingResponse"
                    placeholder="Explique o que foi corrigido ou complementado nesta irregularidade..."
                    class="w-full border border-gray-300 rounded-md p-2 text-sm min-h-[80px]"
                    required
                  ></textarea>
                </div>

                <!-- Não autorizada, recurso ainda disponível -->
                <div
                  v-else-if="irr.status === 'Não autorizado' && !irr.appealUsed"
                  class="mt-2"
                >
                  <label
                    :for="`irr-appeal-${index}`"
                    class="text-sm font-semibold block mb-1"
                  >
                    Justificativa do recurso
                  </label>
                  <textarea
                    :id="`irr-appeal-${index}`"
                    v-model="irr.appeal"
                    placeholder="Explique por que você discorda dessa decisão..."
                    class="w-full border border-gray-300 rounded-md p-2 text-sm min-h-[80px]"
                  ></textarea>
                  <p class="text-xs text-gray-500 mt-1">
                    Se precisar comprovar com um novo documento, adicione-o
                    à mesma pasta do Google Drive que você já compartilhou
                    — não é necessário enviar um novo link.
                  </p>
                </div>

                <p
                  v-else-if="irr.status === 'Não autorizado' && irr.appealUsed"
                  class="text-xs text-gray-500 mt-2"
                >
                  Recurso já enviado para esta irregularidade. A decisão é
                  definitiva.
                </p>
              </div>
            </div>
          </div>

          <!-- Documentos -->
          <div class="mb-8">
            <h3
              class="mb-6 border-b-2 border-gray-300 text-xl font-bold text-gray-900"
            >
              Documentos
            </h3>
            <BaseInput
              v-if="!isRestrictedEdit"
              id="driveLink"
              type="url"
              v-model="form.driveLink"
              label="Link do Google Drive"
              placeholder="https://drive.google.com/drive/folders/..."
              :error="errors.driveLink"
              hint="Crie uma pasta no Google Drive com a CRID, o BOA (se concluinte) e demais documentos necessários, defina o acesso como 'Qualquer pessoa com o link pode visualizar' e cole o link aqui."
              required
            />
            <div v-else-if="form.driveLink">
              <a
                :href="form.driveLink"
                target="_blank"
                rel="noopener"
                class="text-primary-600 underline break-all text-sm"
              >
                Abrir pasta no Google Drive
              </a>
              <p class="text-xs text-gray-500 mt-1">
                Precisa anexar um novo documento? Adicione-o a esta mesma
                pasta — não é necessário enviar um novo link.
              </p>
            </div>
          </div>

          <!-- Observações -->
          <div class="mb-8" v-if="!isRestrictedEdit || form.obs">
            <h3
              class="mb-6 border-b-2 border-gray-300 text-xl font-bold text-gray-900"
            >
              Observações
            </h3>
            <BaseInput
              v-if="!isRestrictedEdit"
              id="obs"
              type="textarea"
              v-model="form.obs"
              hint="Preencha esse campo caso tenha alguma informação extra para o coordenador"
            />
            <p v-else class="text-sm text-gray-700 whitespace-pre-wrap">
              {{ form.obs }}
            </p>
          </div>

          <div class="flex items-center space-x-2 mb-8" v-if="canEdit">
            <BaseButton :loading="state.saving" class="flex-1">
              {{ id ? 'Alterar' : 'Cadastrar' }} Solicitação
            </BaseButton>

            <BaseButton
              v-if="id"
              type="button"
              variant="secondary"
              :loading="state.deleting"
              tabindex="-1"
              @click="handleDelete"
            >
              <span v-if="state.confirmDelete" class="text-primary-500">
                Confirme exclusão
              </span>
              <span v-else class="text-red-500">Excluir Solicitação</span>
            </BaseButton>
          </div>
          <BaseAlert v-else
            >Não é mais possível alterar as informações</BaseAlert
          >
        </form>
      </div>
      <BaseAlert variant="danger" v-if="state.error">{{
        state.error
      }}</BaseAlert>
    </BaseCard>
  </AppLayout>
</template>
