# Lista de compras

Aplicativo estático sem build: `index.html` + `script.js` + `style.css`. Não há `package.json`, testes, lint ou CI.

## Rodando e verificando

- Para rodar, basta abrir `index.html` no navegador (não há servidor ou dev server).
- Para verificar alterações no JS: `node --check script.js` (única verificação automatizada disponível; o PowerShell desta máquina não aceita `&&` — rode comandos separados por `;`).

## Arquitetura e convenções

- Todo o estado vive em um IIFE em `script.js`. Estado: `state = { lists: [...], active }`, com `cur()` retornando a lista ativa e a variável `items` sempre apontando para `cur().items`.
- Nunca reatribua `items` diretamente (`items = ...`) — use `syncItems(novoArray)`, que atualiza também `cur().items`; caso contrário a mudança não é persistida.
- Persistência via `localStorage` na chave `lista-compras:v2`. A chave antiga `lista-compras:v1` (lista única) é migrada para a lista "casa" no `load()` — não remova essa migração.
- Todo texto de UI é pt-BR (mensagens, categorias, keywords de sugestão de seção). Novos textos devem seguir isso.
- Formatação monetária: BRL via `Intl.NumberFormat`; entrada de preço aceita vírgula (`parsePrice` em `script.js`).
- CSS usa variáveis em `:root` com tema escuro automático (`prefers-color-scheme`) — use as variáveis existentes, nunca cores fixas.
- `skill.md` é um arquivo de instruções de design (skill reutilizável), não faz parte do app — não o referencie no código.
