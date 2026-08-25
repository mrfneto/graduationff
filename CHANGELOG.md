# Changelog

Todas as mudanças relevantes deste projeto serão documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
e esse projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Removed
- Checkbox "Lançado no SIGA pela Secretaria" tirado da tela de análise
  (RequestDetailsView) — ficou redundante com a página dedicada de
  Efetivação. O campo `siga` continua existindo nos dados, só não é mais
  editável por ali.

### Added
- Nova página **Efetivação** (`/efetivacao`, menu da secretaria/coordenação):
  filtro por semestre (começa vazio) e por "Efetivado no SIGA"
  (Sim/Não, começa em "Não"). Lista os pedidos **Deferidos** ou
  **Deferido-Parciais** do semestre selecionado com nome, DRE,
  irregularidades (com status individual) e um checkbox que salva
  `siga` imediatamente ao marcar/desmarcar — fluxo pensado pra secretaria
  abrir a página, ver quem falta lançar no SIGA, e ir confirmando um por
  um. Reaproveita o cache de `requestStore` por semestre, sem precisar de
  nenhum índice novo no Firestore (filtro de status feito no cliente,
  igual já era feito em `RequestFilters.vue`).

### Changed (feedback de uso real da tela de análise, parte 3)
- Removido o card "Decisão da Coordenação" (que já tinha ficado só com o
  seletor de coordenador, o checkbox do SIGA e os botões) — esse conteúdo
  subiu pro mesmo card de "Informações do Aluno", que agora tem um único
  `<form>` cobrindo a tela inteira de análise.

### Changed (feedback de uso real da tela de análise, parte 2)
- Removido o campo "Observações gerais" (antigo parecer geral) por
  completo do formulário de análise — não fazia mais sentido existir
  separado do parecer por irregularidade. Pedidos antigos que já tinham
  esse texto salvo continuam exibindo-o normalmente na consulta pública
  (não apagamos dados existentes, só a possibilidade de editar).
- Removido o preview "Status do pedido (calculado automaticamente)" da
  tela de análise — duplicava o badge de status que já aparece no topo da
  página.

### Changed (feedback de uso real da tela de análise)
- O parecer geral do pedido (`request.opinion`) deixou de ser obrigatório
  — agora é um campo opcional de "Observações gerais", já que cada
  irregularidade tem seu próprio parecer.
- Na análise (RequestDetailsView), o campo por irregularidade foi
  renomeado de "Observação da coordenação" para "Parecer do coordenador"
  e reordenado para aparecer ANTES do recurso/resposta de pendência do
  aluno (antes vinha depois) — fica mais natural ler a manifestação do
  aluno como resposta ao parecer, não o contrário.
- RequestResultView: a mensagem "Aguardando análise da coordenação" agora
  depende do status do pedido (`'Aguardando'`), não mais da ausência do
  parecer geral (que passou a ser opcional e pode ficar vazio mesmo em
  pedidos já analisados).

### Fixed (encontrado em teste real, pós-deploy)
- `firestore.rules`: a regra de criação de pedido exigia que o campo
  `coordinator` estivesse **ausente**, mas o formulário sempre envia
  `coordinator: ''` (string vazia) — nunca omite a chave. Isso bloqueava
  toda criação de pedido em produção com "Missing or insufficient
  permissions". Corrigido para `get('coordinator', '') == ''`.
- `RequestResultView.vue`: como toda irregularidade nova nasce com status
  provisório `'Não autorizado'` (até a coordenação decidir de verdade), a
  tela de consulta pública mostrava "irregularidade indeferida, abra um
  recurso" em pedidos que ainda nem tinham sido analisados (status
  `'Aguardando'`). Corrigido para só mostrar o aviso/CTA de recurso quando
  o pedido já foi de fato analisado.
- `RequestResultView.vue`: mesmo princípio para o aviso de pendência — ao
  reenviar uma resposta de pendência, o item continua `'Pendente'`
  internamente (a coordenação ainda vai reavaliar) e o status do pedido
  volta pra `'Aguardando'`, então o alerta "corrija e reenvie" reaparecia
  logo após o aluno já ter corrigido e reenviado. Agora só mostra esse
  aviso quando o pedido está fora de `'Aguardando'` (o alerta de "ainda
  estamos analisando" já cobre o caso de reenvio recente).

### Added (parte 2)
- Comprovante em PDF é **baixado automaticamente** ao criar um pedido novo
  (não em reenvios de pendência/recurso, que passam pela mesma tela).
- Checagem de duplicidade: não é possível criar uma segunda solicitação
  para a mesma matrícula no mesmo semestre. Implementado com uma coleção
  `requestLocks` (ID determinístico semestre+matrícula, nunca uma query —
  mesmo princípio do access_code) e uma transação do Firestore que cria o
  cadeado e o pedido atomicamente, evitando duplicidade mesmo em caso de
  corrida (dois envios simultâneos).
- Comprovante em PDF agora mostra "Consulte o parecer a partir de"
  quando o semestre tem `resultDate` definido.
- Corrigido link fixo (domínio antigo `gradff-ufrj.web.app`) no
  comprovante em PDF — agora usa `VITE_SITE_URL` do `.env`.

### Fixed
- `BaseAlert.vue` usava `<span>` (inline) como elemento raiz — ao colocar
  parágrafos/listas dentro (ex.: alertas de pendência/recurso), o HTML
  ficava inválido e o box quebrava visualmente, sem largura responsiva
  (`w-full` não tem efeito em elemento inline). Trocado para `<div>`.

### Added
- Campo próprio (`pendingResponse`) para o aluno responder a uma
  irregularidade "Pendente", sem sobrescrever a justificativa original
  (`description`) — mesmo princípio já usado no recurso (`appeal`).
  Visível para a coordenação (RequestDetailsView) e ecoado de volta para
  o aluno (RequestResultView).
- Campo **"Consultar parecer a partir de"** (`resultDate`) no cadastro de
  semestre — substitui o aviso por e-mail. Exibido na Home (semestre
  ativo) e na consulta de status (enquanto "Aguardando").
- **Recurso por irregularidade**: quando uma irregularidade é indeferida,
  o aluno pode abrir um recurso (justificativa de texto, uma única vez por
  irregularidade) editando a solicitação. Ao enviar, a irregularidade
  volta para "Pendente" e o pedido reentra na fila de análise; a
  coordenação vê o recurso destacado ao lado da própria observação.
- Edição de pedido já analisado agora é **restrita**: dados pessoais,
  link do Drive e observações ficam somente-leitura; só é possível editar
  a justificativa de uma irregularidade "Pendente" ou o texto de recurso
  de uma "Não autorizada" ainda sem recurso usado. Antes da primeira
  análise (status "Aguardando"), a edição continua completa.
- Cada irregularidade agora tem um status individual (`item.status`):
  **Autorizado**, **Não autorizado** ou **Pendente** — antes era um simples
  booleano `authorized`.
- O status do PEDIDO deixa de ser escolhido manualmente e passa a ser
  sempre calculado a partir do status de cada irregularidade
  (`computeRequestStatus` em `src/helpers/index.js`):
  - todas Autorizadas → **Deferido**
  - todas Não autorizadas → **Indeferido**
  - todas Pendentes → **Pendente**
  - mix com ao menos 1 Autorizada → **Deferido-Parcial**
  - mix de Não autorizada + Pendente, sem nenhuma Autorizada →
    **Indeferido-Parcial**
- Observação da coordenação por irregularidade (`coordinatorNote`), visível
  para o aluno tanto na consulta de status quanto na tela de edição.
- Pedidos com ao menos uma irregularidade "Pendente" voltam a ficar
  editáveis para o aluno; ao reenviar, o status do pedido retorna
  automaticamente para "Aguardando" (nova fila de análise).

### Changed
- Substituído o upload de arquivos (Firebase Storage) por um campo de link do Google Drive (`driveLink`) para o aluno anexar os documentos.
- `RequestDetailsView` e `RequestResultView` agora exibem um link para os documentos no Drive em vez da lista de arquivos.

### Removed
- Módulo de e-mail (EmailJS) removido por completo: dependência
  `@emailjs/browser`, `sendEmail()`, botão "Enviar E-mail ao Aluno", envio
  automático, campo `sentAt` e variáveis `VITE_EMAILJS_*`/`VITE_PUBLIC_KEY`/
  `VITE_SITE_URL` do `.env`.
- Removida a dependência do Firebase Storage (`getStorage`, `uploadFile`, `removeFile`) e o componente `BaseUpload.vue`.
- Removido `vercel.json` (deploy consolidado apenas em Firebase Hosting).
- Removidos arquivos não utilizados: `src/components/modelo.vue` e a imagem de logo duplicada.

### Fixed
- Corrigido redirecionamento para rota inexistente (`'request'` → `'requests'`) no guard de rotas `requiresGuest`.
- Corrigido vazamento de listener do Firebase Auth: `getCurrentUser()` criava um novo `onAuthStateChanged` a cada navegação de rota, sem `unsubscribe`.
- Removida função morta e quebrada (`getRequest`) em `RequestSuccessView.vue`.
- Trocados `console.log` residuais por `console.error` em tratamento de erros (`AppLayout.vue`, `LoginView.vue`).
- `.gitignore` agora ignora `.env` e `.env.local` explicitamente (antes só cobria `.env.production` e `*.local`).

## [0.4.0] - 2025-08-05

### Added
- Logo oficial da Faculdade de Farmácia - UFRJ em formato JPEG.

- Configuração de deploy inicial para Firebase Hosting com suporte a SPA (Vite + Vue.js)

- Página de edição e criação de coordenadores (`coordinator-form.vue`)
- Página de listagem de coordenadores (`coordinators.vue`)
- Componente `BaseAlert` para exibição de mensagens de erro
- Componentes de layout e UI com shadcn-vue
- Lógica de exclusão com duplo clique (confirmação)
- Dicas contextuais no input de parecer do coordenador
- Rewrite SPA no `firebase.json` para evitar erro 404
- Script de build e deploy via Firebase Hosting
- Página `request-result.vue` para resultado do envio
- Validações de formulário centralizadas e mensagens de erro

### Changed

- Refatoração do `coordinatorStore` para usar padrão padrão `async/await` e `getById`
- Refatoração dos inputs com `v-model` + `ref()` no formulário
- Refatoração do sistema de stores para maior coesão
- Correção no uso de `.forEach` para `.map` ao gerar opções de coordenadores
- Melhoria nos placeholders e textos auxiliares
- Tipagem clara para os dados de formulário

### Fixed

- Corrigido erro de retorno incorreto ao tentar mapear coordenadores
- Corrigido problema de navegação após salvar ou excluir coordenador
- Corrigido erro de build e 404 após deploy no Firebase com Vite
- Corrigida exportação de variáveis de ambiente com `.env` via GitHub sem `export`

---

## [0.3.0] - 2025-07-30

### Added

- Página de listagem de solicitações (`requests.vue`)
- Página de criação e edição de solicitação (`request-form.vue`)
- Store `requestStore` com regras específicas de acesso, status e validação
- Componente de upload de arquivos com limite de 3 PDFs
- Integração com Firebase Storage para uploads
- Status por semestre com base em datas (ativo, previsto, encerrado)

### Changed

- Atualização de UI para melhor experiência no envio da solicitação
- Implementação de `v-model` nos uploads para facilitar uso no formulário pai

---

## [0.2.0] - 2025-07-22

### Added

- Dashboard do professor com busca por disciplinas
- Store `coordinatorStore` com base em Firebase
- Filtragem de turmas por departamento
- Semestres com campos `title`, `start`, `end` e `result_date`
- Store `semesterStore` com funções `getActiveSemester` e `getPlannedSemester`

---

## [0.1.0] - 2025-06-16

### Added

- Setup inicial com Vite + Vue 3 + Tailwind CSS + Firebase
- Autenticação com Firebase Auth
- Layout base com `AppLayout.vue`
- Rotas protegidas com `router.beforeEach`
- Página de login e registro
- Estrutura inicial de stores com Pinia
- Navegação com Vue Router 4
