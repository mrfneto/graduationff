<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRequestStore } from '@/stores/request'

import AppLayout from '@/components/layouts/AppLayout.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import AppLoader from '@/components/ui/AppLoader.vue'

import {
  ArrowLeft,
  Calendar,
  Mail,
  User,
  BookOpen,
  FileText,
  MoveLeft,
  Edit
} from 'lucide-vue-next'
import { formatTimestamp, formatDateLong, getStatusColor } from '../helpers'

const route = useRoute()
const requestStore = useRequestStore()

const request = ref(null)
const notFound = ref(false)
const loading = ref(true)

const id = computed(() => route.params.id)

const hasPendingIrregularity = computed(() =>
  request.value?.irregularities?.some(i => i.status === 'Pendente')
)

onMounted(async () => {
  request.value = await requestStore.getById(id.value)
  notFound.value = !request.value
  loading.value = false
})

const extractName = str => {
  return str.split(' - ')[1] || ''
}
</script>

<template>
  <AppLayout
    title="Detalhes da Solicitação"
    :description="`Código: ${request?.access_code}`"
  >
    <template #actions>
      <div class="flex items-center space-x-4">
        <BaseButton :to="{ name: 'home' }" variant="secondary">
          <MoveLeft class="size-4 mr-2" />
          Voltar
        </BaseButton>
        <BaseButton :to="{ name: 'request-update', params: { id: id } }">
          <Edit class="size-4 mr-2" />
          Editar
        </BaseButton>
      </div>
    </template>
    <AppLoader v-if="loading" />

    <BaseCard v-else-if="notFound" class="w-full max-w-md mx-auto text-center">
      <h2 class="heading-xl text-red-600 mb-2">Solicitação não encontrada</h2>
      <p class="text-sm text-gray-500 mb-6">
        Verifique se o código foi digitado corretamente
      </p>
      <BaseButton :to="{ name: 'home' }">
        <template #icon><ArrowLeft class="w-4 h-4 mr-2" /></template>
        Voltar ao Início
      </BaseButton>
    </BaseCard>

    <div v-else class="w-full max-w-2xl mx-auto space-y-6">
      <BaseAlert v-if="hasPendingIrregularity" variant="warning">
        Sua solicitação tem pendências a corrigir. Veja as observações abaixo
        e clique em "Editar" para ajustar e reenviar.
      </BaseAlert>

      <BaseCard>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold">Status Geral</h2>
          <BaseBadge :variant="getStatusColor(request.status)">
            {{ request.status }}
          </BaseBadge>
        </div>
        <div class="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-gray-500" />
            <span>Enviado em: {{ formatTimestamp(request.created_at) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <BookOpen class="w-4 h-4 text-gray-500" />
            <span>Curso: {{ request.course }}</span>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <h2 class="text-lg font-bold mb-4">Dados do Solicitante</h2>
        <div class="space-y-3 text-gray-700 text-sm">
          <div class="flex items-center gap-2">
            <User class="w-4 h-4 text-gray-500" />
            <span>{{ request.name }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Mail class="w-4 h-4 text-gray-500" />
            <span>{{ request.email }}</span>
          </div>
          <div class="flex items-center gap-2">
            <FileText class="w-4 h-4 text-gray-500" />
            <span>Matrícula: {{ request.register }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-gray-500" />
            <span>Semestre: {{ request.semester }}</span>
          </div>
        </div>
      </BaseCard>

      <!-- IRREGULARITIES -->
      <BaseCard>
        <h2 class="text-lg font-bold mb-4">Irregularidades</h2>
        <div class="space-y-3">
          <div
            v-for="(irr, index) in request.irregularities"
            :key="index"
            class="p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium">{{ irr.name }}</span>
              <BaseBadge
                v-if="request.status !== 'Aguardando'"
                :variant="getStatusColor(irr.status)"
              >
                {{ irr.status }}
              </BaseBadge>
            </div>
            <p
              v-if="irr.status !== 'Autorizado' && irr.coordinatorNote"
              class="text-sm text-gray-600 mt-2"
            >
              <strong>Observação da coordenação:</strong>
              {{ irr.coordinatorNote }}
            </p>
          </div>
        </div>
      </BaseCard>

      <!-- OPINIOS -->
      <BaseCard>
        <h2 class="text-lg font-bold mb-2">Parecer</h2>
        <p
          class="text-gray-700 whitespace-pre-wrap text-sm mb-2"
          v-if="request.opinion"
        >
          {{ request.opinion }}
        </p>
        <p
          class="text-gray-700 font-bold whitespace-pre-wrap text-sm border-t border-gray-200 pt-2 mb-2"
          v-if="request.coordinator"
        >
          <span class="text-sm font-normal">Coordenador(a): </span
          >{{ extractName(request.coordinator) }}
        </p>
        <p
          class="text-primary-800 font-normal whitespace-pre-wrap text-sm"
          v-if="request?.sentAt"
        >
          <span class="text-sm font-normal">E-mail enviado em: </span>
          {{ formatDateLong(request.sentAt) }}
        </p>

        <p
          v-if="!request.opinion"
          class="text-gray-700 whitespace-pre-wrap text-sm"
        >
          Aguardando análise da coordenação.
        </p>

        <p
          :class="request.siga ? 'text-green-600' : 'text-red-600'"
          class="mt-6 text-sm"
          v-if="
            request.status === 'Deferido' ||
            request.status === 'Deferido-Parcial'
          "
        >
          {{
            request.siga
              ? 'Autorização efetivada no siga. Confira a sua CRID'
              : 'Autorização ainda não efetivada no SIGA.'
          }}
        </p>
      </BaseCard>

      <!-- FILES -->
      <BaseCard v-if="request.driveLink">
        <h2 class="text-lg font-bold mb-4">Documentos</h2>
        <a
          :href="request.driveLink"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-2 p-2 bg-gray-50 rounded text-primary-600 underline break-all"
        >
          <FileText class="w-4 h-4 text-gray-500 shrink-0" />
          <span class="text-sm">Abrir documentos no Google Drive</span>
        </a>
      </BaseCard>
    </div>
  </AppLayout>
</template>
