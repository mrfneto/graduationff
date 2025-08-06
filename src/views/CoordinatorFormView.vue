<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCoordinatorStore } from '@/stores/coordinator'
//
import AppLayout from '@/components/layouts/AppLayout.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import sweet from '@/composables/sweet'

import { MoveLeft } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const coordinatorStore = useCoordinatorStore()

const id = route.params.id || null

const state = reactive({
  loading: true,
  saving: false,
  deleting: false,
  confirmDelete: false,
  error: null
})

const form = ref({
  name: '',
  siape: '',
  active: true
})

const setError = msg => {
  state.error = msg
}

const handleSubmit = async () => {
  state.error = null

  if (!form.value.name.trim()) return setError('O nome é obrigatório.')
  if (!form.value.siape.trim()) return setError('O SIAPE é obrigatório.')

  state.saving = true

  try {
    await coordinatorStore.save(form.value, id)
    await sweet.success('Registro salvo com success')
    router.push({ name: 'coordinators' })
  } catch (err) {
    setError(err.message || 'Erro ao salvar o coordenador.')
  } finally {
    state.saving = false
  }
}

const handleDelete = async () => {
  if (!id) return

  if (!state.confirmDelete) {
    state.confirmDelete = true
    setTimeout(() => (state.confirmDelete = false), 3000)
    return
  }

  state.deleting = true

  try {
    await coordinatorStore.remove(id)
    await sweet.success('Registro excluído com success')
    router.push({ name: 'coordinators' })
  } catch (err) {
    setError(err.message || 'Erro ao excluir o coordenador.')
  } finally {
    state.deleting = false
    state.confirmDelete = false
  }
}

onMounted(async () => {
  if (!id) {
    state.loading = false
    return
  }

  try {
    const coordinator = await coordinatorStore.getById(id)
    if (coordinator) {
      form.value = coordinator
    } else {
      setError('Coordenador não encontrado.')
    }
  } catch {
    setError('Erro ao carregar coordenador.')
  } finally {
    state.loading = false
  }
})
</script>

<template>
  <AppLayout
    :title="id ? 'Editar Coordenador' : 'Novo Coordenador'"
    :description="
      id
        ? 'Atualize as informações do coordenador'
        : 'Preencha os dados para cadastrar um novo coordenador'
    "
  >
    <template #actions>
      <BaseButton :to="{ name: 'coordinators' }" variant="secondary">
        <MoveLeft class="size-4 mr-2" />
        Voltar
      </BaseButton>
    </template>

    <BaseCard class="w-full max-w-2xl mx-auto">
      <AppLoader v-if="state.loading" />

      <form v-else @submit.prevent="handleSubmit" class="space-y-6">
        <div class="grid md:grid-cols-4 gap-4">
          <BaseInput
            id="name"
            label="Nome do Coordenador"
            v-model="form.name"
            :disabled="state.saving"
            required
            class="md:col-span-2"
          />
          <BaseInput
            id="siape"
            label="SIAPE"
            placeholder="Ex: 1236547"
            v-model="form.siape"
            :disabled="state.saving"
            required
          />

          <div
            class="flex items-center space-x-1 p-0.5 border border-gray-200 mt-6"
          >
            <BaseButton
              v-for="type in [true, false]"
              :key="type"
              type="button"
              @click="form.active = type"
              :variant="form.active === type ? 'primary' : 'secondary'"
              full-width
            >
              {{ type ? 'Ativo' : 'Inativo' }}
            </BaseButton>
          </div>
        </div>

        <div class="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <BaseButton :loading="state.saving" class="flex-1">
            {{ id ? 'Alterar' : 'Cadastrar' }} Coordenador
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
            <span v-else class="text-red-500">Excluir Coordenador</span>
          </BaseButton>
        </div>
      </form>

      <BaseAlert variant="danger" v-if="state.error">
        {{ state.error }}
      </BaseAlert>
    </BaseCard>
  </AppLayout>
</template>
