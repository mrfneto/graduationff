<script setup>
import { Trash2 } from 'lucide-vue-next'
import { ref, computed, watch } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  label: { type: String, default: 'Documentos' },
  hint: { type: String, default: 'Anexe até 3 arquivos PDF.' },
  modelValue: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'remove'])

const internalFiles = ref([])

watch(
  () => props.modelValue,
  newVal => {
    internalFiles.value = [...newVal]
  },
  { immediate: true }
)

const maxFiles = 3
const remaining = computed(() => maxFiles - internalFiles.value.length)
const hasReachedLimit = computed(() => remaining.value <= 0)

const handleFileChange = e => {
  const selectedFiles = Array.from(e.target.files)

  if (internalFiles.value.length + selectedFiles.length > maxFiles) {
    alert(`Você só pode anexar no máximo ${maxFiles} arquivos.`)
    return
  }

  const validFiles = selectedFiles.filter(
    file => file.type === 'application/pdf'
  )

  // internalFiles.value.push(...validFiles)
  internalFiles.value = [...internalFiles.value, ...validFiles]
  emit('update:modelValue', internalFiles.value)
}

const removeFile = index => {
  // internalFiles.value.splice(index, 1)
  // emit('update:modelValue', internalFiles.value)
  // emit('remove', index)
  const updated = [...internalFiles.value]
  updated.splice(index, 1)
  internalFiles.value = updated
  emit('update:modelValue', updated)
  emit('remove', index)
}

const fileLabel = file => {
  if (file.name) return file.name
  if (typeof file === 'string') return file
  return 'Arquivo'
}
</script>

<template>
  <div>
    <label class="font-medium block mb-1">{{ label }}</label>
    <p v-if="hint" class="text-xs text-gray-500 mb-2">{{ hint }}</p>

    <!-- Botão customizado que aciona o input -->
    <BaseButton
      variant="secondary"
      type="button"
      :disabled="hasReachedLimit || disabled"
      @click="$refs.fileInput.click()"
      class="mb-2"
    >
      Adicionar Arquivo PDF
    </BaseButton>

    <!-- Input escondido -->
    <input
      ref="fileInput"
      id="files"
      type="file"
      multiple
      accept="application/pdf"
      class="hidden"
      :disabled="hasReachedLimit || disabled"
      @change="handleFileChange"
    />

    <p
      class="text-xs mt-1"
      :class="hasReachedLimit ? 'text-red-500' : 'text-gray-500'"
    >
      {{
        hasReachedLimit
          ? 'Limite máximo de arquivos atingido.'
          : `Você pode adicionar mais ${remaining} arquivo(s).`
      }}
    </p>

    <ul class="mt-2 space-y-2 text-sm">
      <li
        v-for="(file, index) in internalFiles"
        :key="index"
        class="flex items-center justify-between bg-gray-50 border border-gray-300 px-3 py-2 rounded-md"
      >
        <span>
          <template v-if="file.url">
            <a
              :href="file.url"
              target="_blank"
              rel="noopener"
              class="text-primary-600 underline"
            >
              {{ file.name || 'Arquivo' }}
            </a>
          </template>
          <template v-else>
            {{ fileLabel(file) }}
          </template>
        </span>

        <button
          type="button"
          class="ml-2 text-gray-500 hover:text-red-500 disabled:opacity-50"
          @click="removeFile(index)"
          :disabled="disabled"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </li>
    </ul>
  </div>
</template>

<!-- How to use
        <FileUpload
          v-model="form.files"
          label="Documentos"
          @remove="handleRemoveFile"
          :disabled="!hasActiveSemester || !canEdit"
          hint="Envie a CRID, o BOA se for concluínte e outro arquivo que achar necessário. Máximo 3 arquivos PDF."
        />
        -->
