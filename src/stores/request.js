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
  serverTimestamp,
  where
} from 'firebase/firestore'
import { nanoid } from '../helpers'
import { useSemesterStore } from './semester'

export const useRequestStore = defineStore('request', () => {
  const requests = ref([])
  const requestsCache = ref({})

  const collectionName = import.meta.env.VITE_FIREBASE_COLLECTION_REQUESTS

  const filters = ref({
    name: '',
    semester: '',
    course: '',
    status: 'Aguardando',
    siga: ''
  })

  // ✅ Computado auxiliar
  const hasRequests = computed(() => requests.value.length > 0)

  // 🔄 Busca registros com ordenação e filtro opcional
  const get = async (arrayFilters = []) => {
    // alterado
    const semestreFilter = arrayFilters.find(f => f.field === 'semester')
    const semestre = semestreFilter?.value

    if (semestre && requestsCache.value[semestre]) {
      requests.value = requestsCache.value[semestre]
      return
    }

    try {
      let q = query(
        collection(db, collectionName),
        orderBy('created_at', 'asc'),
        orderBy('name')
      )

      arrayFilters.forEach(f => {
        q = query(q, where(f.field, '==', f.value))
      })

      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }))

      requests.value = data
      if (semestre) {
        requestsCache.value[semestre] = data
      }

      // console.log('[RequestStore] Registros carregados:', requests.value.length)
    } catch (error) {
      console.error('[RequestStore] Erro ao buscar registros:', error)
    }
  }

  // 🔍 Busca um registro por ID (retorna apenas os dados)
  const getById = async id => {
    try {
      const result = await getDoc(doc(db, collectionName, id))
      return result.exists() ? { ...result.data() } : null
    } catch (error) {
      console.error('[RequestStore] Erro ao buscar por ID:', error)
      return null
    }
  }

  // 💾 Cria ou atualiza um registro
  const save = async (request, id = null) => {
    const payload = { ...request, update_at: serverTimestamp() }

    payload.driveLink = (payload.driveLink || '').trim()

    try {
      if (id) {
        await updateDoc(doc(db, collectionName, id), payload)

        // Atualiza o cache se o registro estiver presente
        const index = requests.value.findIndex(r => r.id === id)
        if (index !== -1) {
          requests.value[index] = { ...requests.value[index], ...payload }
        }
      } else {
        payload.access_code = `${nanoid()}/${payload.semester}`
        payload.created_at = serverTimestamp()
        await addDoc(collection(db, collectionName), payload)
      }

      return payload.access_code
    } catch (error) {
      console.error('[RequestStore] Erro ao salvar registro:', error)
    }
  }

  // 🗑️ Remove um registro por ID
  const remove = async id => {
    try {
      await deleteDoc(doc(db, collectionName, id))
    } catch (error) {
      console.error('[RequestStore] Erro ao remover registro:', error)
    }
  }

  return {
    filters,
    requests,
    hasRequests,
    get,
    getById,
    save,
    remove
  }
})
