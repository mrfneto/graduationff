<script setup>
import { Loader2 } from 'lucide-vue-next'
import { computed } from 'vue'

// ✅ Primeiro defineProps
const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: value => ['primary', 'secondary', 'danger'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: value => ['sm', 'md', 'lg'].includes(value)
  },
  type: {
    type: String,
    default: 'submit',
    validator: value => ['submit', 'button'].includes(value)
  },
  to: [String, Object],
  icon: Boolean,
  disabled: Boolean,
  loading: Boolean,
  fullWidth: Boolean
})

const buttonClasses = computed(() => {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer'

  const variant = {
    primary:
      'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary:
      'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  }

  const size = {
    sm: props.icon ? 'p-1.5' : 'py-1.5 px-3 text-sm',
    md: props.icon ? 'p-2' : 'py-2 px-4',
    lg: props.icon ? 'p-3' : 'py-3 px-6 text-lg'
  }

  const isDisabled =
    props.loading || props.disabled ? 'opacity-50 cursor-not-allowed' : ''
  const isFullWidth = props.fullWidth ? 'w-full' : ''

  return [
    base,
    variant[props.variant],
    size[props.size],
    isDisabled,
    isFullWidth
  ]
    .filter(Boolean)
    .join(' ')
})

const iconClasses = computed(() => {
  return {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[props.size]
})
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="buttonClasses">
    <slot />
  </RouterLink>

  <button v-else :type="type" :disabled="disabled" :class="buttonClasses">
    <Loader2 v-if="loading" :class="iconClasses" class="mr-2 animate-spin" />
    <slot />
  </button>
</template>
