import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { db } from '@/firebase'
import {
  collection,
  query,
  updateDoc,
  setDoc,
  doc,
  deleteDoc,
  getDocs,
  getDoc,
  limit,
  orderBy,
  runTransaction,
  serverTimestamp,
  startAfter,
  where
} from 'firebase/firestore'
import { nanoid } from '../helpers'

const PAGE_SIZE = 10

export const useRequestStore = defineStore('request', () => {
  const requests = ref([])

  // 📄 Estado da paginação da listagem por semestre — get() busca 10 por
  // vez em vez de trazer o semestre inteiro de uma tacada só.
  const paginatedSemester = ref(null)
  const lastDoc = ref(null)
  const hasMore = ref(true)
  const loadingMore = ref(false)

  const collectionName = import.meta.env.VITE_FIREBASE_COLLECTION_REQUESTS
  const lockCollectionName = import.meta.env
    .VITE_FIREBASE_COLLECTION_REQUEST_LOCKS

  // 🔐 ID determinístico do "cadeado" semestre+matrícula (nunca uma query),
  // pra permitir checar duplicidade publicamente sem precisar de list().
  const buildLockId = (semester, register) => {
    const clean = str =>
      (str || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
    return `${clean(semester)}_${clean(register)}`
  }

  const filters = ref({
    name: '',
    semester: '',
    course: '',
    status: 'Aguardando',
    siga: ''
  })

  // ✅ Computado auxiliar
  const hasRequests = computed(() => requests.value.length > 0)

  // 🔄 Carrega a PRÓXIMA página (10 por vez) de solicitações do semestre
  // informado, ordenadas por data de criação e nome. Trocar de semestre
  // reinicia a paginação do zero; chamar de novo com o MESMO semestre
  // busca a página seguinte — é o que o botão "Carregar mais" faz.
  const get = async semester => {
    if (!semester) {
      requests.value = []
      paginatedSemester.value = null
      lastDoc.value = null
      hasMore.value = true
      return
    }

    if (paginatedSemester.value !== semester) {
      requests.value = []
      paginatedSemester.value = semester
      lastDoc.value = null
      hasMore.value = true
    }

    if (!hasMore.value || loadingMore.value) return

    loadingMore.value = true
    try {
      let q = query(
        collection(db, collectionName),
        where('semester', '==', semester),
        orderBy('created_at', 'asc'),
        orderBy('name'),
        limit(PAGE_SIZE)
      )

      if (lastDoc.value) {
        q = query(q, startAfter(lastDoc.value))
      }

      const snapshot = await getDocs(q)
      const page = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }))

      requests.value = [...requests.value, ...page]
      lastDoc.value = snapshot.docs.at(-1) ?? lastDoc.value
      hasMore.value = snapshot.docs.length === PAGE_SIZE
    } catch (error) {
      console.error('[RequestStore] Erro ao buscar registros:', error)
    } finally {
      loadingMore.value = false
    }
  }

  // 📦 Carrega TODAS as páginas restantes do semestre — usado só pela
  // exportação em CSV, que precisa do conjunto completo, não apenas do
  // que já foi paginado na tela.
  const loadAll = async semester => {
    if (paginatedSemester.value !== semester) {
      await get(semester)
    }
    while (hasMore.value) {
      await get(semester)
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

  // 🔍 Verifica se já existe solicitação para esta matrícula neste
  // semestre (checagem rápida/consultiva antes de submeter — a garantia
  // real contra corrida/duplicidade é a transação dentro de save()).
  const checkDuplicate = async (register, semester) => {
    try {
      const lockId = buildLockId(semester, register)
      const snap = await getDoc(doc(db, lockCollectionName, lockId))
      return snap.exists()
    } catch (error) {
      console.error('[RequestStore] Erro ao verificar duplicidade:', error)
      return false
    }
  }

  // 🔐 Gera um código de acesso garantidamente livre (ele também é o ID do
  // documento, então checamos colisão antes de gravar — extremamente raro,
  // mas silenciosamente sobrescrever outra solicitação seria grave).
  const generateUniqueAccessCode = async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = nanoid()
      const existing = await getDoc(doc(db, collectionName, code))
      if (!existing.exists()) return code
    }
    throw new Error(
      'Não foi possível gerar um código de acesso único. Tente novamente.'
    )
  }

  // 💾 Cria ou atualiza um registro
  // OBS: o ID do documento é o próprio access_code — isso permite que a
  // consulta pública de status use um get() direto (getById) em vez de uma
  // query com "list", que não pode ser restringida por regra do Firestore.
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

        return payload.access_code
      }

      const accessCode = await generateUniqueAccessCode()
      payload.access_code = accessCode
      payload.created_at = serverTimestamp()

      const lockId = buildLockId(payload.semester, payload.register)
      const lockRef = doc(db, lockCollectionName, lockId)
      const requestRef = doc(db, collectionName, accessCode)

      // Transação: cria o cadeado e o pedido juntos, atomicamente. Se já
      // existir um cadeado pra essa matrícula+semestre (mesmo que tenha
      // sido criado no instante entre o checkDuplicate() e este ponto),
      // a transação falha e nada é gravado.
      await runTransaction(db, async tx => {
        const lockSnap = await tx.get(lockRef)
        if (lockSnap.exists()) {
          throw new Error(
            'Já existe uma solicitação registrada para esta matrícula neste semestre.'
          )
        }

        tx.set(lockRef, {
          semester: payload.semester,
          register: payload.register,
          access_code: accessCode,
          created_at: serverTimestamp()
        })
        tx.set(requestRef, payload)
      })

      return accessCode
    } catch (error) {
      console.error('[RequestStore] Erro ao salvar registro:', error)
      throw error
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
    hasMore,
    loadingMore,
    get,
    loadAll,
    getById,
    checkDuplicate,
    save,
    remove
  }
})
