# Changelog

Todas as mudanças relevantes deste projeto serão documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
e esse projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

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
