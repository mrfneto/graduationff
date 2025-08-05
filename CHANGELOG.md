# Changelog

Todas as mudanças relevantes deste projeto serão documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
e esse projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [0.4.0] - 2025-08-05

### Added

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
