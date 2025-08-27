<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Stores
import { useSemesterStore } from '@/stores/semester'
import { useRequestStore } from '@/stores/request'

// Componentes
import { MoveLeft } from 'lucide-vue-next'
import AppLayout from '@/components/layouts/AppLayout.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseUpload from '@/components/ui/BaseUpload.vue'
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
  files: [],
  obs: '',
  status: 'Aguardando',
  feedback: '',
  coordinator: '',
  siga: false
})

const errors = ref({})

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
const canEdit = computed(() => form.value.status === 'Aguardando')

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
    if (!form.value.irregularities.length) {
      errors.value.irregularities = 'Adicione pelo menos uma irregularidade.'
    }

    if (!form.value.files.length) {
      errors.value.files = 'Envie pelo menos um documento (PDF).'
    }

    if (Object.keys(errors.value).length > 0) {
      state.saving = false
      return
    }

    if (!id) {
      form.value.semester = semesterStore.activeSemester?.name || ''
    }

    const access_code = await requestStore.save(form.value, id)
    router.push({ name: 'request-success', params: { code: access_code } })
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

// Remoção de arquivo
const handleRemoveFile = async index => {
  if (!hasActiveSemester.value) return
  const file = form.value.files[index]
  if (file?.path) {
    try {
      await requestStore.removeFile(file.path)
    } catch (err) {
      console.error('Erro ao remover arquivo:', err)
    }
  }
  form.value.files.splice(index, 1)
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
      <div class="mb-8">
        <form @submit.prevent="handleSubmit">
          <!-- Dados pessoais -->
          <div class="mb-8">
            <h3
              class="mb-6 border-b-2 border-gray-300 text-xl font-bold text-gray-900"
            >
              Dados pessoais
            </h3>

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
          </div>

          <!-- Irregularidades -->
          <div class="mb-8">
            <h3
              class="mb-6 border-b-2 border-gray-300 text-xl font-bold text-gray-900"
            >
              Irregularidades
            </h3>
            <RequestIrregularities
              v-model:irregularities="form.irregularities"
            />
          </div>

          <!-- Documentos -->
          <div class="mb-8">
            <h3
              class="mb-6 border-b-2 border-gray-300 text-xl font-bold text-gray-900"
            >
              Documentos
            </h3>
            <BaseUpload v-model="form.files" />
          </div>

          <!-- Observações -->
          <div class="mb-8">
            <h3
              class="mb-6 border-b-2 border-gray-300 text-xl font-bold text-gray-900"
            >
              Observações
            </h3>
            <BaseInput
              id="obs"
              type="textarea"
              v-model="form.obs"
              hint="Preencha esse campo caso tenha alguma informação extra para o coordenador"
            />
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
