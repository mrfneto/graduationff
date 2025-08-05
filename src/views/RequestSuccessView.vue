<script setup>
import { onMounted, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRequestStore } from '@/stores/request'
import { generatePDF } from '@/helpers'
import { CheckCircle, Download, Home, Loader2 } from 'lucide-vue-next'

import AppLayout from '@/components/layouts/AppLayout.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'

const route = useRoute()
const router = useRouter()
const requestStore = useRequestStore()

const state = reactive({
  loading: false,
  error: null
})

const code = computed(() => route.params.code)

const getRequest = async codeValue => {
  try {
    const results = await requestStore.get([
      {
        field: 'access_code',
        value: code.value
      }
    ])
    if (!results.length) throw new Error('Código não encontrado.')
    return results[0]
  } catch (error) {
    throw new Error(error.message || 'Erro ao buscar a solicitação.')
  }
}

const downloadPDF = async () => {
  state.loading = true
  state.error = null

  try {
    await requestStore.get([
      {
        field: 'access_code',
        value: code.value
      }
    ])
    if (requestStore.hasRequests) {
      generatePDF(requestStore.requests[0])
    } else {
      throw new Error('Código não encontrado.')
    }
  } catch (error) {
    console.error('[DownloadPDF]', error)
    state.error = error.message || 'Erro ao gerar o comprovante.'
  } finally {
    state.loading = false
  }
}
</script>

<template>
  <AppLayout>
    <BaseCard class="w-full max-w-md mx-auto text-center">
      <CheckCircle class="w-16 h-16 text-green-500 mb-4 mx-auto" />
      <h1 class="heading-xl text-green-500 mb-0">Solicitação Enviada!</h1>
      <p class="mb-6 text-sm">Sua solicitação foi recebida com sucesso.</p>

      <div class="bg-green-50 p-4 rounded-lg mb-6">
        <p class="mb-2">Seu código de acesso é:</p>
        <h2 class="heading-xl text-primary-700">{{ code }}</h2>
        <p class="text-sm">
          Guarde este código para consultar o status da sua solicitação.
        </p>
      </div>

      <BaseButton
        :loading="state.loading"
        class="w-full mb-4"
        @click="downloadPDF"
      >
        <template #icon>
          <Loader2 v-if="state.loading" class="w-4 h-4 mr-2" />
          <Download v-else class="w-4 h-4 mr-2" />
        </template>
        Baixar Comprovante
      </BaseButton>

      <BaseButton
        :to="{ name: 'home' }"
        variant="secondary"
        class="w-full mb-4"
      >
        <template #icon>
          <Home class="w-4 h-4 mr-2" />
        </template>
        Voltar ao Início
      </BaseButton>

      <BaseAlert variant="danger" v-if="state.error">{{
        state.error
      }}</BaseAlert>
    </BaseCard>
  </AppLayout>
</template>
