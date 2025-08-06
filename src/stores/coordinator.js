import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import {
  collection,
  query,
  updateDoc,
  doc,
  deleteDoc,
  addDoc,
  getDocs,
  getDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'

export const useCoordinatorStore = defineStore('coordinator', () => {
  const coordinators = ref([])

  const collectionName = import.meta.env.VITE_FIREBASE_COLLECTION_COORDINATORS

  // 🔄 Carrega coordenadores com ordenação
  const get = async () => {
    try {
      const q = query(collection(db, collectionName), orderBy('name'))
      const snapshot = await getDocs(q)

      coordinators.value = snapshot.docs.map(snap => ({
        id: snap.id,
        ...snap.data()
      }))
    } catch (error) {
      console.error('[CoordinatorStore] Erro ao buscar coordenadores:', error)
    }
  }

  // 🔍 Busca dados por ID (sem retornar o ID)
  const getById = async id => {
    try {
      const result = await getDoc(doc(db, collectionName, id))
      return result.exists() ? { ...result.data() } : null
    } catch (error) {
      console.error('[CoordinatorStore] Erro ao buscar por ID:', error)
      return null
    }
  }

  // 💾 Salvar ou atualizar coordenador
  const save = async (coordinator, id = null) => {
    const payload = { ...coordinator, update_at: serverTimestamp() }

    try {
      if (id) {
        await updateDoc(doc(db, collectionName, id), payload)
      } else {
        payload.created_at = serverTimestamp()
        await addDoc(collection(db, collectionName), payload)
      }
    } catch (error) {
      console.error('[CoordinatorStore] Erro ao salvar coordenador:', error)
    }
  }

  // 🗑️ Excluir coordenador
  const remove = async id => {
    try {
      await deleteDoc(doc(db, collectionName, id))
    } catch (error) {
      console.error('[CoordinatorStore] Erro ao remover coordenador:', error)
    }
  }

  // ✅ Computado auxiliar
  const hasCoordinators = computed(() => coordinators.value.length > 0)

  return {
    coordinators,
    hasCoordinators,
    get,
    getById,
    save,
    remove
  }
})
