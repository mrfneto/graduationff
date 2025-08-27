<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from '../stores/auth'

import AuthLayout from '../components/layouts/AuthLayout.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import { useRouter } from 'vue-router'
import BaseAlert from '../components/ui/BaseAlert.vue'

const authStore = useAuthStore()
const router = useRouter()

const loading = ref(false)
const error = ref('')

const form = reactive({
  email: '',
  password: ''
})

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    await authStore.login(form.email, form.password)
    router.replace({ name: 'home' })
  } catch (err) {
    error.value = 'Credenciais inválidas. Tente novamente.'
    console.log(err)
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <AuthLayout>
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold text-gray-900 mb-2">Bem-vindo de Volta</h2>
      <p class="text-gray-600">Entre na sua conta para continuar</p>
    </div>

    <form @submit.prevent="handleLogin" class="space-y-6">
      <BaseAlert variant="danger" v-if="error">{{ error }}</BaseAlert>

      <BaseInput
        id="email"
        v-model="form.email"
        type="email"
        label="E-mail"
        placeholder="seu@email.com"
        required
      />

      <BaseInput
        id="password"
        v-model="form.password"
        type="password"
        label="Senha"
        placeholder="••••••••"
        required
      />

      <BaseButton type="submit" :disabled="loading" size="lg" full-width>
        <span v-if="loading">Entrando...</span>
        <span v-else>Entrar</span>
      </BaseButton>
    </form>

    <!-- <div class="mt-6 text-center">
      <p class="text-gray-600">
        <a href="#" class="text-primary-600 hover:text-primary-500 font-medium">
          Esqueceu a senha?
        </a>
      </p>
    </div> -->
  </AuthLayout>
</template>
