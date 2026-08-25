<script setup>
import { onMounted, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import { formatDate } from '@/helpers'
import { useSemesterStore } from '@/stores/semester'
import { useRequestStore } from '@/stores/request'

import sweet from '@/composables/sweet'
import AppLayout from '@/components/layouts/AppLayout.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const semesterStore = useSemesterStore()
const requestStore = useRequestStore()

const { activeSemester, predictedSemester } = storeToRefs(semesterStore)

const router = useRouter()

const state = reactive({
  loading: true,
  search: '',
  searching: false,
  errorMsg: null
})

const messages = {
  notFound: 'Não foi possível localizar o registro com o código informado.',
  error: 'Ocorreu um erro durante a consulta. Tente novamente.',
  invalidCode: 'Informe um código de acesso válido.'
}

const handleSubmit = async () => {
  state.searching = true
  state.errorMsg = null

  const code = state.search.trim().toUpperCase()

  if (!code) {
    state.errorMsg = messages.invalidCode
    state.searching = false
    return
  }

  try {
    const request = await requestStore.getById(code)

    if (request) {
      router.push({ name: 'request-result', params: { id: code } })
    } else {
      sweet.error(messages.notFound)
    }
  } catch (error) {
    console.error('Erro na consulta de código de acesso:', error)
    sweet.error(messages.error)
  } finally {
    state.searching = false
  }
}

onMounted(async () => {
  await semesterStore.get()
  state.loading = false
})
</script>

<template>
  <AppLayout>
    <div class="w-full max-w-5xl mx-auto px-4 md:px-6">
      <div class="text-center">
        <p class="text-lg font-bold mb-4 leading-none text-primary-600">
          Faculdade de Farmácia - UFRJ
        </p>
        <h1
          class="text-3xl md:text-4xl text-gray-900 font-extrabold tracking-tight leading-none mb-4"
        >
          Regularização de Inscrição em Disciplinas
        </h1>
        <p class="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
          Regularize sua inscrição em disciplinas preenchendo o formulário de
          regularização ou consulte o status do seu pedido informando o seu
          código de acesso
        </p>

        <AppLoader v-if="state.loading" />

        <div
          v-else
          class="flex flex-col space-y-4 w-full md:max-w-1/2 mx-auto mb-8"
        >
          <template v-if="activeSemester">
            <BaseButton
              :to="{ name: 'request-create' }"
              aria-label="Solicitar regularização de disciplinas"
            >
              Solicitar Regularização
            </BaseButton>
            <p v-if="activeSemester.resultDate" class="text-sm text-gray-600">
              Não enviamos e-mail de aviso — consulte o parecer da sua
              solicitação (com seu código de acesso) a partir de
              <strong>{{ formatDate(activeSemester.resultDate) }}</strong>.
            </p>
          </template>

          <BaseAlert variant="warning" v-else-if="predictedSemester">
            O período para solicitar regularização será de
            {{ formatDate(predictedSemester?.start || null) }} à
            {{ formatDate(predictedSemester.end || null) }}
          </BaseAlert>

          <BaseAlert v-else>
            No momento, não estamos aceitando solicitações. Avisaremos via
            e-mail SIGA quando o novo prazo for estipulado.
          </BaseAlert>
        </div>

        <SearchInput
          :loading="state.searching"
          v-model="state.search"
          @submitted="handleSubmit"
          placeholder="Informe seu código de acesso."
          class="mb-8"
        />

        <BaseAlert variant="danger" v-if="state.errorMsg">
          <span aria-live="polite">{{ state.errorMsg }}</span>
        </BaseAlert>

        <div class="mt-12 text-center">
          <p class="text-xs text-gray-600 max-w-2xl mx-auto">
            “Este sistema é destinado aos alunos para envio de solicitações
            acadêmicas. O acesso administrativo é restrito à
            secretaria/coordenação.”
          </p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
