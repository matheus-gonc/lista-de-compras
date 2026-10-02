# Lista de compras

Aplicativo estático sem build: `index.html` (raiz) referencia `src/script.js` e `src/style.css`. Não há `package.json`, testes, lint ou CI.

## Rodando e verificando

- Para rodar, basta abrir `index.html` no navegador (não há servidor ou dev server).
- Para verificar alterações no JS: `node --check src/script.js` (única verificação automatizada disponível; o PowerShell desta máquina não aceita `&&` — rode comandos separados por `;`).

## Arquitetura e convenções

- O código fica em `src/`; o `script.js` na raiz é um stub vazio — não edite nem remova sem verificar.
- Todo o estado vive em um IIFE em `src/script.js`. Estado: `state = { lists: [...], active }`, com `cur()` retornando a lista ativa e a variável `items` sempre apontando para `cur().items`.
- Nunca reatribua `items` diretamente (`items = ...`) — use `syncItems(novoArray)`, que atualiza também `cur().items`; caso contrário a mudança não é persistida.
- Persistência via `localStorage` na chave `lista-compras:v2`. A chave antiga `lista-compras:v1` (lista única) é migrada para a lista "casa" no `load()` — não remova essa migração.
- Todo texto de UI é pt-BR (mensagens, categorias, keywords de sugestão de seção). Novos textos devem seguir isso.
- Itens não têm preço: a estrutura é `{ id, name, qty, cat, done }` — não reintroduza campos monetários (a interface não exibe totais).
- CSS usa variáveis em `:root` com tema escuro automático (`prefers-color-scheme`) e override manual via `data-theme="light"|"dark"` — use as variáveis existentes, nunca cores fixas.
- `skills/skill.md` é um arquivo de instruções de design (skill reutilizável), não faz parte do app — não o referencie no código.
