<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCoordinatorStore } from '@/stores/coordinator'
import { formatDate } from '@/helpers'
import { Edit, Plus } from 'lucide-vue-next'

import AppLayout from '@/components/layouts/AppLayout.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseList from '@/components/ui/BaseList.vue'

const coordinatorStore = useCoordinatorStore()

const loading = ref(true)

const hasCoordinators = computed(() => coordinatorStore.hasCoordinators)

onMounted(async () => {
  await coordinatorStore.get()
  loading.value = false
})
</script>

<template>
  <AppLayout
    title="Coordenadores"
    description="Gerencie os coordenadores cadastrados ou cadastre um novo."
  >
    <template #actions>
      <BaseButton :to="{ name: 'coordinator-create' }">
        <Plus class="size-4 mr-2" />
        Novo coordenador
      </BaseButton>
    </template>

    <div class="mt-8">
      <div class="flex flex-col space-y-4">
        <AppLoader v-if="loading" />

        <BaseCard
          v-else-if="!hasCoordinators"
          class="text-center text-gray-500 py-12 border border-gray-200 rounded-md"
        >
          Nenhum coordenador cadastrado.
        </BaseCard>

        <BaseList
          v-for="coordinator in coordinatorStore.coordinators"
          :key="coordinator.id"
          :to="{ name: 'coordinator-update', params: { id: coordinator.id } }"
        >
          <div class="flex-1">
            <h3 class="heading-lg">
              <span>{{ coordinator.name }}</span>
            </h3>
            <div class="flex items-center space-x-4">
              <p class="text-gray-500 text-sm">
                <span class="text-xs">SIAPE: </span>{{ coordinator.siape }}
              </p>
              <BaseBadge :variant="coordinator.active ? 'success' : 'danger'">
                {{ coordinator.active ? 'Ativo' : 'Inativo' }}
              </BaseBadge>
            </div>
          </div>
        </BaseList>
      </div>
    </div>
  </AppLayout>
</template>
