<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ChevronDown, Users } from 'lucide-vue-next'
import AppLogo from '../ui/AppLogo.vue'
import BaseButton from '../ui/BaseButton.vue'

defineProps({
  title: String,
  description: String
})

const router = useRouter()
const { user, logout } = useAuthStore()

const showUserMenu = ref(false)
const userMenuRef = ref()

const links = [
  { label: 'Pedidos', to: 'requests' },
  { label: 'Semestres', to: 'semesters' },
  { label: 'Coordenadores', to: 'coordinators' }
]

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const handleLogout = async () => {
  try {
    await logout()
    router.replace({ name: 'login' })
  } catch (error) {
    console.log('Erro ao fazer logout:', error)
  }
}

const handleClickOutside = event => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const initials = computed(() => {
  if (user.name) return user.name.charAt(0).toUpperCase()
  if (user.email) return user.email.charAt(0).toUpperCase()
  return '?'
})
</script>
<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <AppLogo to="/" />
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-8" v-if="user">
            <router-link
              v-for="(link, index) in links"
              :key="index"
              :to="{ name: link.to }"
              class="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              :class="{
                'text-primary-600 font-medium': $route.name === link.to
              }"
            >
              {{ link.label }}
            </router-link>
          </div>

          <!-- User Menu -->
          <div class="relative" ref="userMenuRef" v-if="user">
            <button
              @click="toggleUserMenu"
              class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200"
            >
              <img
                v-if="user && user.avatar"
                :src="user?.avatar"
                :alt="user?.name"
                class="w-8 h-8 rounded-full object-cover"
              />
              <div
                v-else
                class="w-8 h-8 rounded-full object-cover flex items-center justify-evenly bg-primary-500"
              >
                {{ initials }}
              </div>
              <!-- <div class="hidden md:block text-left">
                <p class="text-sm font-medium text-gray-900">
                  {{ user?.name }}
                </p>
                <p class="text-xs text-gray-500">{{ user?.email }}</p>
              </div> -->
              <ChevronDown class="w-4 h-4 text-gray-400" />
            </button>

            <!-- Dropdown Menu -->
            <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-show="showUserMenu"
                class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-grau-50 focus:outline-none z-50"
              >
                <div class="py-1">
                  <!-- <router-link
                    to="#"
                    @click="showUserMenu = false"
                    class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  >
                    Meu Perfil
                  </router-link>
                  <router-link
                    to="#"
                    @click="showUserMenu = false"
                    class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  >
                    Configurações
                  </router-link> -->
                  <div v-if="links.length" class="md:hidden">
                    <div class="border-t border-gray-100"></div>
                    <router-link
                      v-for="(link, index) in links"
                      :key="index"
                      :to="{ name: link.to }"
                      class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-2000"
                    >
                      {{ link.label }}
                    </router-link>
                  </div>

                  <div class="border-t border-gray-100"></div>
                  <button
                    @click="handleLogout"
                    class="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <BaseButton v-else :to="{ name: 'login' }" variant="secondary">
            <Users class="size-4 mr-2" />
            Área Admin<span class="hidden md:flex">istrativa</span>
          </BaseButton>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1 py-8">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div
            class="flex flex-col md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h1 v-if="title" class="text-3xl font-bold text-gray-900">
                {{ title }}
              </h1>
              <p v-if="description" class="text-gray-600 mt-2">
                {{ description }}
              </p>
            </div>
            <div class="mt-4 md:mt-0" v-if="$slots.actions">
              <slot name="actions" />
            </div>
          </div>
        </div>
        <slot />
      </div>
    </main>
    <!-- Footer -->
    <footer
      class="text-center text-sm text-gray-500 py-4 border-t border-gray-300"
    >
      &copy; {{ new Date().getFullYear() }} FF — Regularização de Inscrição em
      Disciplina.
    </footer>
  </div>
</template>
