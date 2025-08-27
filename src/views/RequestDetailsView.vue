<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRequestStore } from '@/stores/request'
import { useCoordinatorStore } from '@/stores/coordinator'
import {
  sendEmail,
  getStatusColor,
  formatTimestamp,
  formatDateLong
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

onMounted(async () => {
  await coordinatorStore.get([{ field: 'active', value: true }])
  const result = await requestStore.getById(id.value)
  request.value = result
  loading.value = false
})

const handleSubmit = async () => {
  saving.value = true
  try {
    const total = request.value.irregularities.length
    const authorizeds = request.value.irregularities.filter(
      i => i.authorized
    ).length

    request.value.status =
      authorizeds === total
        ? 'Deferido'
        : authorizeds > 0
        ? 'Deferido-Parcial'
        : 'Indeferido'

    await requestStore.save(request.value, id.value)

    if (
      request.value.status === 'Deferido-Parcial' ||
      request.value.status === 'Indeferido'
    ) {
      await sendEmail(request.value)
      request.value.sentAt = new Date().toISOString()
      await requestStore.save(request.value, id.value)
      await sweet.success('Parecer salvo e e-mail enviado com sucesso!')
    } else {
      await sweet.info('Parecer salvo com sucesso.')
    }

    // const confirmed = await sweet.confirm(
    //   'Deseja enviar e-mail com o parecer para o aluno?',
    //   'Você pode enviar agora ou apenas salvar o parecer e enviar depois clicando em salvar.'
    // )
    // if (confirmed) {
    //   await sendEmail(request.value)
    //   request.value.sentAt = new Date().toISOString()
    //   await requestStore.save(request.value, id.value)
    //   await sweet.success('Parecer salvo e e-mail enviado com sucesso!')
    // } else {
    //   await sweet.info('Parecer salvo com sucesso.')
    // }

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
            </div>

            <!-- Documentos do aluno -->
            <div v-if="request.files?.length">
              <h3 class="text-lg font-semibold">Arquivos Anexados</h3>
              <ul class="list-disc ml-6">
                <li v-for="file in request.files" :key="file.name">
                  <a
                    :href="file.url"
                    target="_blank"
                    class="text-blue-600 underline"
                  >
                    {{ file.name }}
                  </a>
                </li>
              </ul>
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
              hint="Em caso de **pendências**, marque a opção *não autorizado* e solicite que o aluno envie e-mail para a coordanção com os documentos ou informações necessárias."
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
              <div>
                <label
                  class="inline-flex items-center space-x-2 cursor-pointer mt-8"
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

          <div class="flex items-center space-x-4">
            <BaseButton :loading="saving" class="w-full">
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
