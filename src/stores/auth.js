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

  const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(
        auth,
        u => {
          user.value = u
          resolve(u)
        },

        e => reject(e)
      )
    })
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
