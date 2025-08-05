# Sistema de Gestão de Regularização Acadêmica

## Descrição

Este projeto é um sistema para gerenciamento de semestres acadêmicos, coordenadores e solicitações de regularização de matrícula. Permite o cadastro, edição e exclusão dessas entidades, além de filtrar e visualizar detalhes das solicitações.

## Tecnologias

- Vue 3 + Composition API
- Pinia para gerenciamento de estado
- Vue Router para navegação
- Tailwind CSS para estilização
- Axios para comunicação com backend RESTful
- Lucide Icons para ícones

## Funcionalidades

- **Semestres**: listar, criar, editar e excluir semestres, com status (ativo, previsto, encerrado).
- **Coordenadores**: gerenciar coordenadores com campos nome, SIAPE e status ativo/inativo.
- **Solicitações**: listar, filtrar, criar, editar e visualizar detalhes das solicitações de regularização.
- Upload de documentos anexos, status e pareceres de análise.

## Estrutura

- `/stores`: Pinia stores para semestres, coordenadores e solicitações.
- `/views`: componentes de página para listagem e formulários.
- `/components/ui`: componentes reutilizáveis (botões, cards, alertas).
- `/helpers`: funções utilitárias para downloadPDF, envio de emails, formatação e mapeamento de status.
- `/router`: definição das rotas da aplicação.

## Instalação e Execução

```bash
npm install
npm run dev
```
