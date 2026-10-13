# cht-design-system

Biblioteca de UI compartilhada entre os frontends do ecossistema.

## O que é

O `cht-design-system` concentra componentes visuais reutilizáveis e padrões de interface.
São componentes Vue 3 (Options API) estilizados com Tailwind 4. Não há app aqui: quem monta e exibe os componentes é o `cht-base`, que importa esta pasta pelo alias `@design`.

## O que faz

- Fornece componentes Vue padronizados.
- Centraliza estilos e consistência visual.
- Evita duplicação de código de interface entre base e clientes.
- Serve como fonte única para evolução de UI do projeto.

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `src/components/*.vue` | Primitivos: Accordion, Avatar, Badge, Button, Card, Carousel, Checkbox, CheckboxSwitch, Dropdown, Image, Input, InputOTP, Item, ItemIcon, Marker, MediaUploader, Modal, Option, Popover, ProgressBar, QrCode, Radio, Scrollable, Select, Skeleton, Table, Tabs, Toast, Toggle, Toggleable e ViewportCenter. |
| `src/components/custom/` | Compostos: Chat, ConfirmationModal, ContextMenu, NavBar, NotFoundPage, Pagination, Resizable, Sidebar, SideBarLinks, Steps, TableCharts e Tooltip. |
| `src/components/custom/charts/` | Gráficos: `BarChart` e `WaveChart`, mais as funções de cor, polaridade e agrupamento. |
| `src/components/form/` | `FormRenderer`: monta um formulário a partir de uma lista de campos (`FormField`, do `cht-shared`). |
| `src/components/internal/` | Peças internas (painel flutuante, lista de opções, atalhos, mensagem de erro de input). **Não** são globais: importe pelo caminho. |
| `src/toast/` | Plugin e API de toast (`$toast`). |
| `src/plugin.ts` | `designSystemPlugin`: registra primitivos, compostos e gráficos globalmente. |
| `src/textContrast.ts` | Ajusta a cor do texto ao fundo sobre o qual ele aparece. |
| `src/css/intellisense.css` | Só para o editor (autocomplete do Tailwind). Não entra no build. |

Os componentes são registrados globalmente pelo nome do componente. Nos templates, use `<Button>`, `<Modal>`, `<Table>` etc. sem importar.

## Cores e temas

Os tokens de cor (`success`, `info`, `warning`, `destructive`, cada um com `*-foreground`, além de `primary`, `background`, `foreground`, `border` e outros) são gerados pelo `cht-base` (`configs/theme`) a partir dos padrões e do `theme.config.json` do cliente, e trocados pelo tema ativo (claro ou escuro). O design system só os consome. A cor de um cliente específico entra pelo tema do cliente, nunca aqui.

## Estado dos componentes

Cada componente tem um estado de prontidão, mostrado como banner na página dele no modo dev e guardado em `cht-base/src/devApp/data/componentReadiness.json`:

| Estado | Contrato |
| --- | --- |
| Pronto para uso | API estável. Só mudanças aditivas. |
| Implementado | Prefere mudanças aditivas. |
| Em evolução | Pode mudar para ser completado. A página de docs acompanha. |
| Em implementação | Ainda não está para produção. |

Regras completas em [CONTRIBUTING.md](../CONTRIBUTING.md).

## Documentação

Cada componente tem uma página com exemplos e tabela de props no modo dev:

```bash
npx chtmain dev
```

Abra `/docs/components/<nome>`. A página de docs é o contrato de uso: os exemplos precisam continuar funcionando.

## Scripts

```bash
npm run dev       # Vite
npm run build     # vue-tsc + vite build
```

Alguns módulos têm um check executável ao lado do código, por exemplo `src/components/custom/charts/chartColors.check.js` e `src/components/internal/otpCells.check.js` (`node <arquivo>`).

## Regras

- Options API nos componentes. Identificadores e comentários técnicos em inglês; texto de UI em português.
- Não importa código de clientes.
- Novo componente: página de docs, rota, item de navegação e entrada de prontidão, no mesmo PR.
