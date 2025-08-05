<script setup>
import { CheckCircle } from 'lucide-vue-next'

// Props e emits
const props = defineProps({
  irregularities: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:irregularities'])

// Lista de opções
const irregularitiesOptions = [
  'Falta de requisito',
  'Mais de 32 créditos',
  'Menos de 6 créditos',
  'Sobreposição de horários',
  'Outros'
]

// Verifica se está selecionada
function isSelected(option) {
  return props.irregularities.some(irr => irr.name === option)
}

// Obtém descrição atual
function getIrregularityDescription(option) {
  const irr = props.irregularities.find(irr => irr.name === option)
  return irr ? irr.description : ''
}

// Alterna item selecionado
function toggleIrregularity(option) {
  const updated = [...props.irregularities]
  const index = updated.findIndex(irr => irr.name === option)

  if (index !== -1) {
    updated.splice(index, 1)
  } else {
    updated.push({ name: option, description: '', authorized: false })
  }

  emit('update:irregularities', updated)
}

// Atualiza descrição
function updateIrregularityDescription(option, value) {
  const updated = props.irregularities.map(irr =>
    irr.name === option ? { ...irr, description: value } : irr
  )
  emit('update:irregularities', updated)
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="option in irregularitiesOptions"
      :key="option"
      class="space-y-3"
    >
      <div
        :class="[
          'p-4 border-2 rounded-lg cursor-pointer transition-all',
          isSelected(option)
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 bg-white'
        ]"
        @click="toggleIrregularity(option)"
      >
        <div class="flex items-center space-x-3">
          <div
            :class="[
              'w-5 h-5 rounded border-2 flex items-center justify-center',
              isSelected(option)
                ? 'bg-blue-500 border-blue-500'
                : 'border-gray-300'
            ]"
          >
            <CheckCircle v-if="isSelected(option)" class="w-3 h-3 text-white" />
          </div>
          <span
            :class="[
              'font-medium',
              isSelected(option) ? 'text-blue-700' : 'text-gray-700'
            ]"
          >
            {{ option }}
          </span>
        </div>
      </div>

      <div v-if="isSelected(option)" class="ml-8 space-y-2">
        <label :for="`desc-${option}`" class="text-sm">
          Descreva esta irregularidade *
        </label>
        <textarea
          :id="`desc-${option}`"
          :placeholder="`Descreva detalhadamente a situação relacionada a '${option}'...`"
          :value="getIrregularityDescription(option)"
          @input="updateIrregularityDescription(option, $event.target.value)"
          class="min-h-[80px] w-full border border-gray-300 rounded-md p-2"
          required
        ></textarea>
      </div>
    </div>
  </div>
</template>
