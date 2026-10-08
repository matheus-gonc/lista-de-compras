# Lista de compras

Aplicativo web **mobile-first** para organizar as compras do mercado, pensado para quem faz compras por duas casas ao mesmo tempo: a própria e a de pais idosos (ou familiares com mobilidade reduzida).

> Projeto nascido de uma **dor real** do dia a dia de quem cuida de familiares idosos, e desenvolvido no espírito **Vibe Coding**: iterar rápido focando na experiência de uso, com o código servindo ao problema — e não o contrário.

## Visão geral e propósito

Quem cuida de pais idosos costuma sair do mercado com dois carrinhos mentais em um só. Este app resolve isso com duas listas paralelas — **"Minha casa"** e **"Mãe"** — alternáveis por abas grandes na parte superior da tela. Em uma única passada pelo mercado, a pessoa cuidadora marca item a item o que já colocou no carrinho, em qualquer uma das listas, e no final pode **copiar o que falta** para enviar por mensagem a quem for receber ou conferir as compras.

Funcionalidades principais:

- Duas listas independentes com contador de itens em cada aba.
- Itens organizados automaticamente por **seções do mercado** (hortifruti, padaria, açougue…) — a seção é sugerida pelo nome do item (ex.: digitar "banana" já seleciona Hortifruti).
- Quantidade ajustável com botões `−`/`+` (1 a 99).
- Filtros **Todos / Faltam / No carrinho**, barra de progresso da compra e ações em lote (desmarcar tudo, remover marcados).
- Toast com **Desfazer** nas remoções.
- Tema claro/escuro: automático (segue o sistema) **e botão de alternância manual** (☀️/🌙) ao lado do título — a escolha fica salva e persiste ao recarregar.
- Rodapé com direitos autorais, afastado da barra de gestos do celular.
- Offline por padrão (dados em `localStorage`).

## Decisões de UX/UI (mobile-first)

- **Uma mão só:** as ações mais usadas (alternar lista, adicionar, marcar item) ficam na metade inferior/superior de fácil alcance do polegar; botões primários ocupam a largura total no celular.
- **Alvos de toque ≥ 44px** (diretriz iOS/Android) em todos os controles: abas (52px), botões de quantidade (44px), excluir (44px), campo de texto e select (48px), botão Adicionar (52px). Ações secundárias (`Copiar`, `Desmarcar`) têm altura mínima real, não apenas texto sublinhado clicável.
- **Lei de Fitts:** tocar no nome do item marca/desmarca — a área clicável é a linha inteira, não só o quadrado do checkbox.
- **Sem pulo de rolagem:** ao marcar um item (que vai para o fim da seção), a página fica exatamente onde está — o re-render preserva `window.scrollY` e o foco é restaurado com `preventScroll`, sem `scrollIntoView`.
- **Itens compactos:** linhas de produto ~25% mais baixas (paddings, margens e fontes reduzidos) para mais itens visíveis por tela; os botões de quantidade/excluir e a área de toque da linha seguem ≥ 44px.
- **Sem atraso de toque:** `touch-action: manipulation` elimina os 300ms de espera e o zoom de duplo toque no iOS; `-webkit-tap-highlight-color: transparent` remove o flash cinza ao tocar.
- **Fonte ≥ 16px nos inputs** para evitar o auto-zoom do iOS Safari ao focar o campo; `enterkeyhint="done"` mostra a tecla "concluir" no teclado virtual.
- **Safe areas:** respeita os recortes (notch) de telas modernas via `env(safe-area-inset-*)` nos quatro lados; o rodapé soma o `safe-area-inset-bottom` ao seu padding para não ser coberto pela barra de gestos do iOS/Android.
- **Acessibilidade:** contraste AA nas duas paletas, `:focus-visible` evidente, `aria-pressed` nas abas e filtros, labels com `aria-label` descritivos ("Aumentar quantidade de arroz"), `role="status"/"alert"` para toast e erros, e respeito a `prefers-reduced-motion`.
- **Robustez:** se o `localStorage` falhar (modo privado etc.), a lista continua funcionando na sessão; dados antigos (v1) são migrados automaticamente.

## Instalação e execução

O app está publicado em **https://lista-de-compras-list.vercel.app/** — basta abrir no navegador do celular ou computador.

Para rodar localmente, não há build nem dependências. Duas opções:

1. **Abrir direto:** dê dois cliques em `index.html` — funciona em qualquer navegador moderno.
2. **Servidor local (opcional, recomendado para testar no celular):**

```powershell
# Na pasta do projeto (Python já instalado na maioria dos sistemas)
python -m http.server 8080
```

Depois acesse `http://localhost:8080` no navegador, ou `http://<IP-do-computador>:8080` no celular conectado à mesma rede Wi-Fi.

> Para "instalar" como app no celular, abra no Chrome/Safari e use **Adicionar à tela inicial** — os dados ficam salvos no aparelho.

## Stack tecnológico

- **HTML5** semântico (`index.html`)
- **CSS3** puro com custom properties e tema claro/escuro (`src/style.css`)
- **JavaScript** vanilla, sem frameworks, em um IIFE (`src/script.js`)
- Persistência: **`localStorage`** (chave `lista-compras:v2`, com migração automática da v1; preferência de tema na chave `lista-compras:tema`)
- Fonte: Bricolage Grotesque (Google Fonts, única dependência externa; o app funciona sem ela via fallback de fontes do sistema)

Sem `package.json`, bundler, testes automatizados ou CI. Verificação de sintaxe do JS: `node --check src/script.js`.

## Estrutura do projeto

```
lista-de-compras/
├── index.html        # Marcação completa da tela única (abas, formulário, lista, toast, rodapé)
├── src/
│   ├── script.js     # Todo o estado e lógica (IIFE): listas, itens, categorize, tema, render, persistência
│   └── style.css     # Tema via CSS custom properties, layout mobile-first, safe areas
├── skills/           # Documentos de design reutilizáveis (não fazem parte do app)
├── AGENTS.md         # Convenções e cuidados para agentes de código
└── README.md
```

Os dados seguem o modelo `{ lists: [{ id, name, items: [{ id, name, qty, cat, done }] }], active }`, salvos a cada alteração no `localStorage`.
