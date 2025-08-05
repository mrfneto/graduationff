<!-- exluir -->

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MoveLeft, Trash2, Trash } from 'lucide-vue-next'

import { useSemesterStore } from '@/stores/semester'
import { useRequestStore } from '@/stores/request'
import { getStatus } from '@/helpers'

import FormLabel from '@/components/ui/FormLabel.vue'
import FormInput from '@/components/ui/FormInput.vue'
import FormSelect from '@/components/ui/FormSelect.vue'
import FormTextarea from '@/components/ui/FormTextarea.vue'
import FormError from '@/components/ui/FormError.vue'
import FormSubmit from '@/components/ui/FormSubmit.vue'
import FileUpload from '@/components/ui/FileUpload.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const semesterStore = useSemesterStore()
const requestStore = useRequestStore()

const router = useRouter()
const route = useRoute()
const id = computed(() => route.params.id || null)

const loading = ref(false)
const errors = ref({})

const form = ref({
  name: '',
  email: '',
  register: '',
  course: '',
  semester: '',
  irregularities: [{ name: '', authorized: false }],
  files: [],
  justifications: '',
  status: 'aguardando',
  feedback: '',
  coordinator: ''
})

const irregularitiesOptions = [
  'Falta de requisito',
  'Mais de 32 créditos',
  'Menos de 6 créditos',
  'Sobreposição de horários',
  'Outros'
]

const addIrregularity = () => {
  if (form.value.irregularities.length < 5) {
    form.value.irregularities.push({ name: '', authorized: false })
  }
}

const removeIrregularity = index => {
  form.value.irregularities.splice(index, 1)
}

const canEdit = computed(() => {
  return form.value.status === 'aguardando'
})

const hasActiveSemester = computed(() => {
  return !!semesterStore.activeSemester
})

const handleSubmit = async () => {
  if (!hasActiveSemester.value) return
  loading.value = true
  errors.value = {}

  try {
    // Valida irregularidades
    if (!form.value.irregularities.length) {
      errors.value.irregularities = 'Adicione pelo menos uma irregularidade.'
    } else {
      const invalid = form.value.irregularities.some(
        i => !i.name || i.name.trim() === ''
      )
      if (invalid) {
        errors.value.irregularities =
          'Todas as irregularidades devem estar preenchidas.'
      }
    }

    // Valida arquivos
    if (!form.value.files.length) {
      errors.value.files = 'Envie pelo menos um documento (PDF).'
    }

    // Se tem algum erro, não prossegue
    if (Object.keys(errors.value).length) {
      loading.value = false
      return
    }

    form.value.semester = semesterStore.activeSemester?.title || ''
    const code = await requestStore.save(form.value, id.value)
    router.push({ name: 'success', params: { code } })
  } catch (err) {
    console.error('Erro ao salvar solicitação:', err)
  } finally {
    loading.value = false
  }
}

// const handleSubmit = async () => {
//   if (!hasActiveSemester.value) return
//   loading.value = true
//   errors.value = {}
//   try {
//     // Verifica pelo menos uma irregularidade
//     if (!form.value.irregularities.length) {
//       errors.value.irregularities = 'Adicione pelo menos uma irregularidade.'
//       return
//     }

//     // Verifica se todas as irregularidades têm nome válido
//     const irregularitiesInvalid = form.value.irregularities.some(
//       i => !i.name || i.name.trim() === ''
//     )
//     if (irregularitiesInvalid) {
//       errors.value.irregularities =
//         'Todas as irregularidades devem estar preenchidas.'
//       return
//     }

//     // Verifica pelo menos um arquivo
//     if (!form.value.files.length) {
//       errors.value.files = 'Envie pelo menos um documento (PDF).'
//       return
//     }
//     form.value.semester = semesterStore.activeSemester?.title || ''
//     const code = await requestStore.save(form.value, id.value)
//     router.push({ name: 'success', params: { code } })
//   } catch (err) {
//     console.error('Erro ao salvar solicitação:', err)
//   } finally {
//     loading.value = false
//   }
// }

const handleRemoveFile = async index => {
  if (!hasActiveSemester.value) return
  const file = form.value.files[index]
  if (file?.path) {
    try {
      await requestStore.removeFile(file.path)
    } catch (err) {
      console.error('Erro ao remover arquivo do Storage:', err)
    }
  }
  form.value.files.splice(index, 1)
}

const handleDeleteRequest = async () => {
  if (!id.value || !canEdit.value) return
  if (confirm('Tem certeza que deseja excluir esta solicitação?')) {
    try {
      await requestStore.remove(id.value)
      router.push({ name: 'home' })
    } catch (err) {
      console.error('Erro ao excluir solicitação:', err)
    }
  }
}

onMounted(async () => {
  await semesterStore.fetch()
  if (id.value) {
    form.value = await requestStore.fetchById(id.value)
  } else if (!hasActiveSemester.value) {
    alert(
      'Não estamos aceitando novas solicitações. Entre em contato com a coordenação.'
    )
    router.push({ name: 'home' })
  }
})
</script>
<template>
  <div class="py-12 container-sm">
    <div class="card">
      <RouterLink
        :to="
          id ? { name: 'request-result', params: { id: id } } : { name: 'home' }
        "
        class="btn btn-ghost mb-3"
      >
        <MoveLeft class="w-4 h-4 mr-2" />
        <span>Voltar</span>
      </RouterLink>

      <h1 class="heading-2xl mb-4">Regularização de Inscrição</h1>

      <div class="p-4 bg-gray-50 rounded-lg mb-6" v-if="id">
        <p class="space-x-2">
          <span class="font-medium">Status da Solicitação:</span>
          <BaseBadge :variant="getStatus(form.status)">{{
            form.status
          }}</BaseBadge>
        </p>
      </div>

      <p class="mb-6">
        Preencha o formulário abaixo para regularizar sua inscrição em
        disciplinas.
      </p>

      <form class="space-y-6" @submit.prevent="handleSubmit">
        <hr class="my-6 border border-gray-200" />

        <!-- Dados do aluno -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormLabel for="name">Nome Completo</FormLabel>
            <FormInput
              v-model="form.name"
              id="name"
              type="text"
              placeholder="Seu nome completo"
              required
            />
          </div>
          <div>
            <FormLabel for="email">E-mail</FormLabel>
            <FormInput
              v-model="form.email"
              id="email"
              type="email"
              placeholder="Seu e-mail"
              required
            />
          </div>
          <div>
            <FormLabel for="register">DRE</FormLabel>
            <FormInput
              v-model="form.register"
              id="register"
              type="text"
              placeholder="Sua matrícula"
              required
              pattern="^\d{9}$"
              maxlength="9"
              inputmode="numeric"
            />
          </div>
          <div>
            <FormLabel for="course">Curso</FormLabel>
            <FormSelect
              v-model="form.course"
              id="course"
              required
              :options="['Integral', 'Noturno']"
            />
          </div>
        </div>

        <hr class="my-6 border border-gray-200" />

        <!-- Irregularidades -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <FormLabel
              for="irregularities"
              hint="Clique no botão ao lado para adicionar irregularidades"
            >
              Irregularidades
            </FormLabel>

            <button
              type="button"
              class="btn btn-secondary"
              @click="addIrregularity"
              :disabled="!hasActiveSemester || !canEdit"
            >
              Adicionar
            </button>
          </div>

          <FormError
            v-if="errors?.irregularities"
            :message="errors?.irregularities"
          />

          <div
            v-for="(irregularity, index) in form.irregularities"
            :key="index"
            class="flex items-center space-x-2 mt-4"
          >
            <FormSelect
              v-model="irregularity.name"
              :options="irregularitiesOptions"
              class="flex-1"
              :disabled="!hasActiveSemester || !canEdit"
            />
            <button
              type="button"
              class="btn btn-ghost btn-icon"
              @click="removeIrregularity(index)"
              :disabled="!hasActiveSemester || !canEdit"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <div class="mt-6">
            <FormLabel for="justifications">Justificativas</FormLabel>
            <FormTextarea
              v-model="form.justifications"
              id="justifications"
              rows="4"
              placeholder="Justifique suas irregularidades aqui"
              :disabled="!canEdit"
              required
            ></FormTextarea>
          </div>
        </div>

        <hr class="my-6 border border-gray-200" />

        <!-- Documentos -->
        <FileUpload
          v-model="form.files"
          label="Documentos"
          @remove="handleRemoveFile"
          :disabled="!hasActiveSemester || !canEdit"
          hint="Envie a CRID, o BOA se for concluínte e outro arquivo que achar necessário. Máximo 3 arquivos PDF."
        />
        <FormError v-if="errors?.files" :message="errors?.files" />
        {{ errors?.files }}

        <div class="flex items-center space-x-4 mt-6">
          <FormSubmit
            :loading="loading"
            class="btn-primary w-full"
            :disabled="!hasActiveSemester"
          >
            Enviar Solicitação
          </FormSubmit>
          <!-- Botão de exclusão -->
          <button
            v-if="id && canEdit"
            type="button"
            class="btn btn-secondary"
            @click="handleDeleteRequest"
          >
            <Trash class="w-4 h-4 mr-1" />
            Excluir
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
