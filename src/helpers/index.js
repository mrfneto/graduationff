import jsPDF from 'jspdf'
import emailjs from '@emailjs/browser'
import { customAlphabet } from 'nanoid'

// ⚙️ Configurações do nanoid para gerar códigos de acesso
// 10 caracteres: o código também é usado como ID do documento no Firestore
// (busca pública por "get" direto, nunca por "list"), então precisa de
// espaço suficiente para não ser viável de adivinhar por força bruta.
export const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 10)

// 🎨 Formata data de "YYYY-MM-DD" para "DD/MM/YYYY"
export const formatDate = dateStr => {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

// 🎨 Formata timestamp do Firestore para data legível
export const formatTimestamp = date => {
  return date?.toDate().toLocaleDateString('pt-BR') ?? '—'
}

// 🎨 Formata data em estilo longo
export const formatDateLong = date => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(date).toLocaleDateString('pt-BR', options)
}

// 🎨 Opções de status para filtros e seleção
export const statusOptions = [
  'Deferido',
  'Indeferido',
  'Deferido-Parcial',
  'Pendência',
  'Aguardando'
]

// 🎨 Status finais que a coordenação pode escolher ao analisar um pedido
// (não inclui "Aguardando", que é só o estado inicial)
export const finalStatusOptions = [
  'Deferido',
  'Deferido-Parcial',
  'Indeferido',
  'Pendência'
]

// 🎨 Mapeia status para cores
export const getStatusColor = status => {
  switch (status) {
    case 'Deferido':
      return 'success'
    case 'Indeferido':
      return 'danger'
    case 'Deferido-Parcial':
      return 'info'
    case 'Pendência':
      return 'warning'
    default:
      return 'default'
  }
}

// 📧 Envia e-mail ao solicitante com EmailJS
export const sendEmail = async request => {
  const siteUrl = import.meta.env.VITE_SITE_URL

  const irregularitiesSummary = request.irregularities
    .map(irregularity => {
      const line = `- ${irregularity.name}: ${
        irregularity.authorized ? 'Autorizada' : 'Não autorizada'
      }`
      return irregularity.authorized || !irregularity.coordinatorNote
        ? line
        : `${line}\n  Observação da coordenação: ${irregularity.coordinatorNote}`
    })
    .join('\n')

  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      {
        to_name: request.name,
        to_email: request.email,
        status: request.status,
        access_code: request.access_code,
        message: request.opinion,
        irregularities_summary: irregularitiesSummary,
        site_url: siteUrl
      },
      import.meta.env.VITE_PUBLIC_KEY
    )
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)
    throw error // ou lidar de outra forma
  }
}

// 📄 Gera PDF do comprovante de solicitação
export const generatePDF = request => {
  const doc = new jsPDF()
  const marginLeft = 20
  let currentY = 30

  const pageHeight = doc.internal.pageSize.height

  // Função para adicionar texto com quebra automática e controle de página
  const addWrappedText = (text, x, y, maxWidth, lineHeight) => {
    const lines = doc.splitTextToSize(text, maxWidth)
    lines.forEach(line => {
      if (y + lineHeight > pageHeight - 20) {
        doc.addPage()
        y = 30
      }
      doc.text(line, x, y)
      y += lineHeight
    })
    return y
  }

  // --- Cabeçalho ---
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text('Comprovante de Solicitação', marginLeft, currentY)

  currentY += 10
  doc.setDrawColor(0)
  doc.line(marginLeft, currentY, 190, currentY) // linha separadora

  currentY += 10
  doc.setFontSize(12)
  doc.setFont(undefined, 'normal')
  doc.text(`Código de Acesso: ${request.access_code}`, marginLeft, currentY)

  currentY += 8
  doc.text(
    'Link para consulta: https://gradff-ufrj.web.app/',
    marginLeft,
    currentY
  )

  currentY += 8
  doc.text(
    `Data: ${formatTimestamp(request.created_at ?? new Date())}`,
    marginLeft,
    currentY
  )

  // --- Solicitante ---
  currentY += 15
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('Dados do Solicitante:', marginLeft, currentY)

  currentY += 10
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  currentY = addWrappedText(
    `Nome: ${request.name}`,
    marginLeft,
    currentY,
    170,
    7
  )
  currentY = addWrappedText(
    `Matrícula: ${request.register}`,
    marginLeft,
    currentY,
    170,
    7
  )
  currentY = addWrappedText(
    `Email: ${request.email}`,
    marginLeft,
    currentY,
    170,
    7
  )
  currentY = addWrappedText(
    `Curso: ${request.course}`,
    marginLeft,
    currentY,
    170,
    7
  )
  currentY = addWrappedText(
    `Semestre: ${request.semester}`,
    marginLeft,
    currentY,
    170,
    7
  )

  // --- Irregularidades ---
  currentY += 15
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('Irregularidades:', marginLeft, currentY)

  currentY += 10
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')

  if (request.irregularities?.length) {
    request.irregularities.forEach((item, index) => {
      if (currentY + 7 > pageHeight - 20) {
        doc.addPage()
        currentY = 30
      }

      doc.setFont(undefined, 'bold')
      doc.text(`${index + 1}. ${item.name}`, marginLeft, currentY)
      currentY += 7

      doc.setFont(undefined, 'normal')
      currentY = addWrappedText(
        `* ${item.description}`,
        marginLeft,
        currentY,
        170,
        7
      )
    })
  } else {
    currentY = addWrappedText(
      'Nenhuma irregularidade registrada.',
      marginLeft,
      currentY,
      170,
      7
    )
  }

  // --- Observações ---
  currentY += 15
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('Observações:', marginLeft, currentY)

  currentY += 8
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  currentY = addWrappedText(request.obs || '—', marginLeft, currentY, 170, 7)

  // --- Salvar PDF ---
  doc.save(`comprovante-${request.access_code}.pdf`)
}

// 📥 Exporta dados para CSV
export const exportToCSV = (data, filename = 'pedidos.csv') => {
  if (!data.length) return

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','), // cabeçalho
    ...data.map(row =>
      headers
        .map(field => {
          let value = row[field]

          // 🔄 Se for array, transforma em string separada por ponto e vírgula
          if (Array.isArray(value)) {
            value = value
              .map(item => {
                if (typeof item === 'object') {
                  return JSON.stringify(item)
                }
                return item
              })
              .join('; ')
          }

          // 🔄 Se for objeto, transforma em JSON
          if (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value)
          ) {
            value = JSON.stringify(value)
          }

          // 🔄 Se for nulo ou indefinido
          if (value === null || value === undefined) {
            value = ''
          }

          // 🔄 Escapa aspas
          return `"${value.toString().replace(/"/g, '""')}"`
        })
        .join(',')
    )
  ]

  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
