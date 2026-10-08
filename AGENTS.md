# Lista de compras

Aplicativo estático sem build: `index.html` (raiz) referencia `src/script.js` e `src/style.css`. Não há `package.json`, testes, lint ou CI.

**Contexto do produto:** app mobile-first para cuidadores/filhos de idosos que fazem compras para duas casas ("Minha casa" e "Mãe"). Toda decisão de UI deve priorizar: uso com uma mão, alvos de toque ≥ 44px (variável `--touch` no CSS), contraste AA e textos grandes. Não degrade essas propriedades ao alterar o CSS. Detalhes de produto e UX no `README.md`.

## Rodando e verificando

- Para rodar, basta abrir `index.html` no navegador (não há servidor ou dev server).
- Para verificar alterações no JS: `node --check src/script.js` (única verificação automatizada disponível; o PowerShell desta máquina não aceita `&&` — rode comandos separados por `;`).

## Arquitetura e convenções

- Todo o estado vive em um IIFE em `src/script.js`. Estado: `state = { lists: [...], active }`, com `cur()` retornando a lista ativa e a variável `items` sempre apontando para `cur().items`.
- Nunca reatribua `items` diretamente (`items = ...`) — use `syncItems(novoArray)`, que atualiza também `cur().items`; caso contrário a mudança não é persistida. (Exceção já existente: o listener de troca de abas faz `items = cur().items` de propósito.)
- As abas de listas são hardcoded: os botões `[data-list]` em `index.html` precisam bater com os ids em `state.lists`/`defaultState()`. Nova lista exige editar os dois lugares.
- Persistência via `localStorage` na chave `lista-compras:v2`. A chave antiga `lista-compras:v1` (lista única) é migrada para a lista "casa" no `load()` — não remova essa migração.
- Todo texto de UI é pt-BR (mensagens, categorias, keywords de sugestão de seção). Novos textos devem seguir isso.
- Itens não têm preço: a estrutura é `{ id, name, qty, cat, done }` — não reintroduza campos monetários (a interface não exibe totais).
- CSS usa variáveis em `:root` com tema escuro automático (`prefers-color-scheme`) e override manual via `data-theme="light"|"dark"` — use as variáveis existentes, nunca cores fixas. O override é controlado pelo botão `#themeToggle` no cabeçalho (lógica no IIFE de `src/script.js`); a preferência persiste na chave `localStorage` `lista-compras:tema`.
- Mobile-first: alvos de toque usam a variável `--touch` (44px); `touch-action: manipulation` nos botões evita o atraso de 300ms no iOS — não remova. Inputs devem manter fonte ≥ 16px para evitar o auto-zoom do iOS Safari. Textos da lista podem ser compactos (~15px), mas áreas de toque seguem ≥ 44px (label do item usa padding vertical para isso).
- O `render()` reconstrói a lista inteira (`replaceChildren()`). Ele preserva `window.scrollY` e restaura o foco com `focus({ preventScroll: true })` — não introduza `scrollIntoView`, âncoras ou `focus()` sem `preventScroll`, pois isso rola a página quando um item marcado se move para o fim da seção.
- `skills/` contém material de design reutilizável, não faz parte do app — não o referencie no código.

## Material de referência em `skills/`

Biblioteca local de design/UX (não faz parte do app; **nunca** importe ou referencie no código de `index.html`/`src/`):

- `skills/*.md` — guias de design: `frontend.md`, `frontend-design.md`, `frontend-design-v2.md` (design distintivo, anti-"AI slop", tokens, DFII), `frontend-ui-engineering.md` (WCAG 2.1 AA, estados de loading/erro/vazio, breakpoints), `frontend-ui-dark.md` (tema dark), `frontend-developer.md` (React/Next — não aplicável a este app), `mobile-design.md` (mobile/touch-first; alinha com as regras deste projeto: toque ≥44px, zona do polegar).
- `skills/.claude/skills/` — bundle "claudekit" com 7 skills: `ui-ux-pro-max` (buscador local de estilos/paletas/tipografia/UX), `design` (logo, CIP, slides, banners, ícones), `brand`, `design-system` (tokens primitive→semantic→component), `ui-styling` (shadcn/Tailwind), `slides`, `banner-design`.
- `skills/stack/` — "Claude Website Design Stack": combina ui-ux-pro-max + frontend-design + feedback visual (Playwright) + auditoria de design.
- As demais pastas (`src/ui-ux-pro-max`, `cli`, `gallery`, `projects`, `docs`, `scripts`) são o código-fonte/dados dos skills acima; `cli/assets` é um espelho.

Uso prático: para decisões visuais fundamentadas, consulte o banco local — ex.: `python skills\src\ui-ux-pro-max\scripts\search.py "<query>" --domain style|color|typography|ux|landing` ou `--design-system`. Requer Python 3.x.
