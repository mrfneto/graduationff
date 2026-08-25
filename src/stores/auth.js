import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth } from '@/firebase'
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  // A store é um singleton (Pinia), então este listener é registrado uma
  // única vez para toda a sessão — evita acumular um novo listener a cada
  // chamada de getCurrentUser() (ex.: em cada navegação de rota).
  let resolveReady
  const readyPromise = new Promise(resolve => {
    resolveReady = resolve
  })

  onAuthStateChanged(auth, u => {
    user.value = u
    resolveReady()
  })

  // Resolve com o usuário atual assim que o Firebase confirmar o estado
  // inicial de autenticação (e a cada chamada subsequente, sem novo listener).
  const getCurrentUser = async () => {
    await readyPromise
    return user.value
  }

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)
  const logout = () => signOut(auth)
  const register = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password)

  return {
    user,
    login,
    logout,
    register,
    getCurrentUser
  }
})
