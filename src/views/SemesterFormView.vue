<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSemesterStore } from '@/stores/semester'

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
const semesterStore = useSemesterStore()

const state = ref({
  loading: true,
  saving: false,
  deleting: false,
  confirmDelete: false,
  error: null
})

const form = ref({
  name: '',
  start: '',
  end: ''
})

const id = route.params.id || null

const setError = msg => {
  state.value.error = msg
}

const handleSubmit = async () => {
  state.value.error = null
  if (!form.value.name.trim()) {
    return setError('O nome do semestre é obrigatório.')
  }

  state.value.saving = true
  try {
    await semesterStore.save(form.value, id)
    await sweet.success('Registro salvo com success')
    router.push({ name: 'semesters' })
  } catch (err) {
    setError(err.message || 'Erro ao salvar o semestre.')
  } finally {
    state.value.saving = false
  }
}

const handleDelete = async () => {
  if (!id) return
  if (!state.value.confirmDelete) {
    state.value.confirmDelete = true
    setTimeout(() => (state.value.confirmDelete = false), 3000)
    return
  }

  state.value.deleting = true
  try {
    await semesterStore.remove(id)
    await sweet.success('Registro excluído com success')
    router.push({ name: 'semesters' })
  } catch (err) {
    setError(err.message || 'Erro ao excluir o semestre.')
  } finally {
    state.value.deleting = false
    state.value.confirmDelete = false
  }
}

onMounted(async () => {
  if (!id) {
    state.value.loading = false
    return
  }

  try {
    const semester = await semesterStore.getById(id)
    if (semester) {
      form.value = semester
    } else {
      setError('Semestre não encontrado.')
    }
  } catch {
    setError('Erro ao carregar semestre.')
  } finally {
    state.value.loading = false
  }
})
</script>

<template>
  <AppLayout
    :title="id ? 'Editar Semestre' : 'Novo Semestre'"
    :description="
      id
        ? 'Atualize as informações do semestre'
        : 'Preencha os dados para cadastrar um novo semestre'
    "
  >
    <template #actions>
      <BaseButton :to="{ name: 'semesters' }" variant="secondary">
        <MoveLeft class="size-4 mr-2" />
        Voltar
      </BaseButton>
    </template>

    <BaseCard class="w-full max-w-2xl mx-auto">
      <AppLoader v-if="state.loading" />

      <form v-else @submit.prevent="handleSubmit" class="space-y-6">
        <div class="grid md:grid-cols-3 gap-4">
          <BaseInput
            id="name"
            label="Semestre"
            placeholder="Ex: 2025-2"
            v-model="form.name"
            :disabled="state.saving"
            required
          />
          <BaseInput
            id="start"
            type="date"
            label="Data de Início"
            v-model="form.start"
            :disabled="state.saving"
            required
          />
          <BaseInput
            id="end"
            type="date"
            label="Data de Término"
            v-model="form.end"
            :disabled="state.saving"
            required
          />
        </div>

        <div class="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <BaseButton :loading="state.saving" class="flex-1">
            {{ id ? 'Salvar alterações' : 'Cadastrar semestre' }}
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
            <span v-else class="text-red-500">Excluir semestre</span>
          </BaseButton>
        </div>
      </form>

      <BaseAlert variant="danger" v-if="state.error">
        {{ state.error }}
      </BaseAlert>
    </BaseCard>
  </AppLayout>
</template>
