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
  limit,
  where,
  serverTimestamp
} from 'firebase/firestore'

export const useSemesterStore = defineStore('semester', () => {
  const semesters = ref([])

  const collectionName = import.meta.env.VITE_FIREBASE_COLLECTION_SEMESTERS

  // 🔍 Semestre ativo no momento
  const activeSemester = computed(() => {
    return semesters.value.find(s => s.status === 'ativo') || null
  })

  // 🔮 Semestre futuro previsto
  const predictedSemester = computed(() => {
    return semesters.value.find(s => s.status === 'previsto') || null
  })

  // 📥 Buscar os últimos semestres
  const get = async () => {
    try {
      const q = query(
        collection(db, collectionName),
        orderBy('name', 'desc'),
        limit(3)
      )

      const snapshot = await getDocs(q)
      const now = new Date()

      semesters.value = snapshot.docs.map(snap => {
        const data = snap.data()
        const start = new Date(`${data.start}T00:00:00`)
        const end = new Date(`${data.end}T23:59:59`)

        let status = 'encerrado'
        if (now >= start && now <= end) status = 'ativo'
        else if (now < start) status = 'previsto'

        return {
          id: snap.id,
          ...data,
          status
        }
      })
    } catch (error) {
      console.error('[SemesterStore] Erro ao carregar semestres:', error)
    }
  }

  // 🔍 Buscar por ID
  const getById = async id => {
    try {
      const result = await getDoc(doc(db, collectionName, id))
      return result.exists() ? { ...result.data() } : null
    } catch (error) {
      console.error('[SemesterStore] Erro ao buscar semestre por ID:', error)
      return null
    }
  }

  // 🔍 Buscar pelo nome (ex.: "2025-2") — usado para achar a data de
  // consulta do parecer (resultDate) do semestre de uma solicitação.
  const getByName = async name => {
    try {
      const q = query(
        collection(db, collectionName),
        where('name', '==', name),
        limit(1)
      )
      const snapshot = await getDocs(q)
      return snapshot.empty ? null : { ...snapshot.docs[0].data() }
    } catch (error) {
      console.error('[SemesterStore] Erro ao buscar semestre por nome:', error)
      return null
    }
  }

  // 💾 Criar ou atualizar semestre
  const save = async (semester, id = null) => {
    const payload = { ...semester, update_at: serverTimestamp() }

    try {
      if (id) {
        await updateDoc(doc(db, collectionName, id), payload)
      } else {
        payload.created_at = serverTimestamp()
        await addDoc(collection(db, collectionName), payload)
      }
    } catch (error) {
      console.error('[SemesterStore] Erro ao salvar semestre:', error)
    }
  }

  // 🗑️ Remover semestre por ID
  const remove = async id => {
    try {
      await deleteDoc(doc(db, collectionName, id))
    } catch (error) {
      console.error('[SemesterStore] Erro ao remover semestre:', error)
    }
  }

  return {
    semesters,
    activeSemester,
    predictedSemester,
    get,
    getById,
    getByName,
    save,
    remove
  }
})
