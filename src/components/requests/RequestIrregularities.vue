<script setup>
import { ref } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import BaseInput from '../ui/BaseInput.vue'
import BaseButton from '../ui/BaseButton.vue'

const props = defineProps({
  irregularities: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:irregularities'])

// Lista de tipos — um aluno pode ter mais de uma irregularidade do MESMO
// tipo (ex.: "Falta de requisito" em duas disciplinas diferentes), cada
// uma com sua própria justificativa e sua própria decisão da coordenação.
// Por isso isto não é mais um checklist de seleção única por tipo: cada
// clique em "Adicionar" cria um item novo na lista, independente dos
// outros — inclusive de mesmo nome.
const irregularitiesOptions = [
  'Falta de requisito',
  'Mais de 32 créditos',
  'Menos de 6 créditos',
  'Sobreposição de horários',
  'Outros'
]

const draftType = ref(irregularitiesOptions[0])
const draftDescription = ref('')

const addIrregularity = () => {
  const description = draftDescription.value.trim()
  if (!description || !draftType.value) return

  emit('update:irregularities', [
    ...props.irregularities,
    // "Não autorizado" aqui é só o valor inicial antes de qualquer
    // análise da coordenação (mesmo padrão usado antes).
    { name: draftType.value, description, status: 'Não autorizado' }
  ])

  draftDescription.value = ''
}

const removeIrregularity = index => {
  const updated = [...props.irregularities]
  updated.splice(index, 1)
  emit('update:irregularities', updated)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Formulário de adição -->
    <div class="p-4 border-2 border-gray-200 rounded-lg space-y-3 bg-white">
      <BaseInput
        id="irregularity-type"
        type="select"
        label="Tipo de irregularidade"
        v-model="draftType"
        :options="irregularitiesOptions"
      />
      <BaseInput
        id="irregularity-description"
        type="textarea"
        label="Descreva esta irregularidade"
        v-model="draftDescription"
        placeholder="Descreva detalhadamente a situação..."
        hint="Tem mais de uma ocorrência do mesmo tipo (ex.: falta de requisito em duas disciplinas)? Adicione uma de cada vez — cada uma será analisada separadamente."
      />
      <BaseButton
        type="button"
        variant="secondary"
        :disabled="!draftDescription.trim() || !draftType"
        @click="addIrregularity"
      >
        <Plus class="w-4 h-4 mr-2" />
        Adicionar irregularidade
      </BaseButton>
    </div>

    <!-- Lista de irregularidades já adicionadas -->
    <p v-if="irregularities.length === 0" class="text-sm text-gray-500">
      Nenhuma irregularidade adicionada ainda.
    </p>

    <ul v-else class="space-y-2">
      <li
        v-for="(irr, index) in irregularities"
        :key="index"
        class="flex items-start justify-between gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <div class="min-w-0">
          <p class="font-medium text-blue-900">{{ irr.name }}</p>
          <p class="text-sm text-blue-800 whitespace-pre-wrap">
            {{ irr.description }}
          </p>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-red-600 shrink-0"
          title="Remover"
          aria-label="Remover irregularidade"
          @click="removeIrregularity(index)"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </li>
    </ul>
  </div>
</template>
