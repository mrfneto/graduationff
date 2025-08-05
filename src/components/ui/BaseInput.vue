<script setup>
import { computed } from 'vue'

const model = defineModel()

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: false },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  options: { type: Array, default: () => [] }
})

const inputClasses = computed(() => {
  const baseClasses =
    'block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors duration-200'
  const errorClasses = props.error
    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
  const disabledClasses = props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''

  return [baseClasses, errorClasses, disabledClasses].filter(Boolean).join(' ')
})
</script>
<template>
  <div>
    <div class="mb-1">
      <label
        v-if="label"
        :for="id"
        class="block text-sm font-medium text-gray-700 mb-1"
      >
        {{ label }}
        <span v-if="required" class="text-red-500">*</span>
      </label>
    </div>
    <select
      :id="id"
      :name="id"
      v-if="type === 'select'"
      :required="required"
      :disabled="disabled"
      :class="inputClasses"
      v-model="model"
    >
      <option value="">{{ placeholder || 'Selecione um opção' }}</option>
      <option
        v-for="option in options"
        :key="option.value || option"
        :value="option.value || option"
      >
        {{ option.label || option.title || option.name || option }}
      </option>
    </select>

    <textarea
      :id="id"
      :name="id"
      v-else-if="type === 'textarea'"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :class="inputClasses"
      v-model="model"
      rows="4"
    />
    <input
      v-else
      :id="id"
      :name="id"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :class="inputClasses"
      v-model="model"
    />
    <p v-if="hint" class="mt-1 text-sm text-gray-600">{{ hint }}</p>
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>
