import jsPDF from 'jspdf'
import emailjs from '@emailjs/browser'
import { customAlphabet } from 'nanoid'

export const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6)

export const formatDate = dateStr => {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export const formatTimestamp = date => {
  return date?.toDate().toLocaleDateString('pt-BR') ?? '—'
}

export const statusOptions = [
  'Deferido',
  'Indeferido',
  'Deferido-Parcial',
  'Aguardando'
]

export const getStatusColor = status => {
  switch (status) {
    case 'Deferido':
      return 'success'
    case 'Indeferido':
      return 'danger'
    case 'Deferido-Parcial':
      return 'info'
    default:
      return 'default'
  }
}

export const sendEmail = async request => {
  const siteUrl = import.meta.env.VITE_SITE_URL

  const irregularitiesSummary = request.irregularities
    .map(
      irregularity =>
        `- ${irregularity.name}: ${
          irregularity.authorized ? 'Autorizada' : 'Não autorizada'
        }`
    )
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

// export const generatePDF = request => {
//   const doc = new jsPDF()
//   const marginLeft = 20
//   let currentY = 30

//   // --- Cabeçalho ---
//   doc.setFontSize(20)
//   doc.text('Comprovante de Solicitação', marginLeft, currentY)

//   currentY += 20
//   doc.setFontSize(12)
//   doc.text(`Código de Acesso: ${request.access_code}`, marginLeft, currentY)

//   currentY += 8
//   doc.text(
//     'Link para consulta: https://gradff-ufrj.web.app/',
//     marginLeft,
//     currentY
//   )

//   currentY += 8
//   doc.text(
//     `Data:  ${formatTimestamp(request.created_at ?? new Date())}`,

//     marginLeft,
//     currentY
//   )

//   // --- Solicitante ---
//   currentY += 15
//   doc.setFontSize(14)
//   doc.text('Dados do Solicitante:', marginLeft, currentY)

//   doc.setFontSize(11)
//   currentY += 10
//   doc.text(`Nome: ${request.name}`, marginLeft, currentY)

//   currentY += 8
//   doc.text(`Matrícula: ${request.register}`, marginLeft, currentY)

//   currentY += 8
//   doc.text(`Email: ${request.email}`, marginLeft, currentY)

//   currentY += 8
//   doc.text(`Curso: ${request.course}`, marginLeft, currentY)

//   currentY += 8
//   doc.text(`Semestre: ${request.semester}`, marginLeft, currentY)

//   // --- Irregularidades ---
//   currentY += 15
//   doc.setFontSize(14)
//   doc.text('Irregularidades:', marginLeft, currentY)

//   doc.setFontSize(11)
//   currentY += 10
//   if (request.irregularities?.length) {
//     request.irregularities.forEach((item, index) => {
//       doc.text(`${index + 1}. ${item.name}`, marginLeft, currentY)
//       currentY += 7
//       doc.text(`* ${item.description}`, marginLeft, currentY)
//       currentY += 7
//     })
//   } else {
//     doc.text('Nenhuma irregularidade registrada.', marginLeft, currentY)
//     currentY += 7
//   }

//   // --- Observações ---
//   currentY += 10
//   doc.setFontSize(14)
//   doc.text('Observações:', marginLeft, currentY)

//   doc.setFontSize(11)
//   currentY += 8
//   const obsText = doc.splitTextToSize(request.obs || '—', 170)
//   doc.text(obsText, marginLeft, currentY)

//   // --- Salvar PDF ---
//   doc.save(`comprovante-${request.access_code}.pdf`)
// }
