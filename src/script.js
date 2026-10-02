(function () {
  'use strict';

  var STORAGE_KEY = 'lista-compras:v2';
  var LEGACY_KEY = 'lista-compras:v1';

  var CATS = [
    { id: 'hortifruti', label: 'Hortifruti' },
    { id: 'padaria', label: 'Padaria' },
    { id: 'acougue', label: 'Açougue e peixaria' },
    { id: 'laticinios', label: 'Laticínios e frios' },
    { id: 'mercearia', label: 'Mercearia' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'limpeza', label: 'Limpeza' },
    { id: 'higiene', label: 'Higiene e beleza' },
    { id: 'outros', label: 'Outros' }
  ];

  // Palavras usadas para sugerir a seção automaticamente
  var KEYWORDS = {
    hortifruti: ['banana', 'maca', 'laranja', 'limao', 'tomate', 'cebola', 'alho', 'batata', 'cenoura', 'alface', 'couve', 'abacate', 'mamao', 'manga', 'uva', 'melancia', 'abacaxi', 'morango', 'pepino', 'abobrinha', 'brocolis', 'pimentao', 'cheiro verde', 'mandioca', 'beterraba', 'salada', 'fruta', 'verdura', 'legume', 'pera', 'melao', 'gengibre', 'repolho', 'espinafre', 'rucula'],
    padaria: ['pao', 'paes', 'pao de forma', 'bolo', 'torrada', 'bisnaga', 'croissant', 'pao de queijo'],
    acougue: ['carne', 'carne moida', 'frango', 'peixe', 'linguica', 'salsicha', 'bife', 'picanha', 'patinho', 'acem', 'costela', 'file', 'salmao', 'tilapia', 'camarao', 'hamburguer', 'bacon', 'coxa', 'sobrecoxa'],
    laticinios: ['leite', 'queijo', 'iogurte', 'manteiga', 'margarina', 'requeijao', 'presunto', 'mussarela', 'ovo', 'creme de leite', 'leite condensado', 'nata', 'peito de peru', 'salame', 'mortadela', 'ricota', 'cream cheese'],
    mercearia: ['arroz', 'feijao', 'macarrao', 'farinha', 'acucar', 'sal', 'oleo', 'azeite', 'cafe', 'molho', 'extrato de tomate', 'biscoito', 'bolacha', 'cereal', 'aveia', 'atum', 'sardinha', 'milho', 'ervilha', 'vinagre', 'tempero', 'massa', 'granola', 'chocolate', 'geleia', 'fermento', 'lentilha', 'grao de bico', 'pipoca', 'amendoim'],
    bebidas: ['agua', 'suco', 'refrigerante', 'cerveja', 'vinho', 'cha', 'energetico', 'agua com gas', 'isotonico', 'guarana'],
    limpeza: ['detergente', 'sabao em po', 'sabao', 'amaciante', 'desinfetante', 'agua sanitaria', 'esponja', 'saco de lixo', 'multiuso', 'alvejante', 'limpador', 'papel aluminio', 'papel toalha', 'pano de chao', 'lava roupas', 'veja'],
    higiene: ['shampoo', 'condicionador', 'sabonete', 'creme dental', 'pasta de dente', 'escova de dente', 'papel higienico', 'desodorante', 'absorvente', 'fio dental', 'fralda', 'algodao', 'hidratante', 'protetor solar', 'lamina de barbear']
  };

  var SUGGESTIONS = ['Arroz', 'Feijão', 'Macarrão', 'Açúcar', 'Sal', 'Óleo de soja', 'Azeite', 'Café', 'Farinha de trigo', 'Leite', 'Ovos', 'Queijo mussarela', 'Iogurte', 'Manteiga', 'Pão de forma', 'Banana', 'Maçã', 'Tomate', 'Cebola', 'Batata', 'Alho', 'Cenoura', 'Alface', 'Frango', 'Carne moída', 'Linguiça', 'Presunto', 'Água mineral', 'Suco', 'Refrigerante', 'Detergente', 'Sabão em pó', 'Amaciante', 'Desinfetante', 'Papel higiênico', 'Papel toalha', 'Sabonete', 'Shampoo', 'Creme dental', 'Saco de lixo'];

  var state = load();
  function cur() {
    return state.lists.filter(function (l) { return l.id === state.active; })[0] || state.lists[0];
  }
  var items = cur().items;
  function syncItems(arr) { cur().items = arr; items = arr; }
  var filter = 'all';
  var catTouched = false;
  var toastTimer = null;

  var $ = function (id) { return document.getElementById(id); };
  var listEl = $('list'), formEl = $('addForm'), nameEl = $('name'), qtyEl = $('qty'),
      catEl = $('cat'), priceEl = $('price'), errEl = $('err'), toastEl = $('toast'),
      toolsEl = $('tools');

  var money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  function fmt(n) { return money.format(n); }

  function norm(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function guessCategory(name) {
    var n = norm(name);
    if (!n) return 'outros';
    for (var i = 0; i < CATS.length; i++) {
      var words = KEYWORDS[CATS[i].id];
      if (!words) continue;
      for (var j = 0; j < words.length; j++) {
        if (new RegExp('\\b' + escapeRe(words[j]) + '(s|es)?\\b').test(n)) return CATS[i].id;
      }
    }
    return 'outros';
  }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // Armazenamento (pode falhar em alguns navegadores; as listas continuam funcionando na sessão)
  function defaultState() {
    return {
      lists: [
        { id: 'casa', name: 'Minha casa', items: [] },
        { id: 'mae', name: 'Mãe', items: [] }
      ],
      active: 'casa'
    };
  }
  function sanitizeItems(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.filter(function (i) { return i && typeof i.name === 'string'; }).map(function (i) {
      return {
        id: String(i.id || uid()),
        name: i.name,
        qty: Math.min(99, Math.max(1, parseInt(i.qty, 10) || 1)),
        cat: CATS.some(function (c) { return c.id === i.cat; }) ? i.cat : 'outros',
        price: typeof i.price === 'number' && isFinite(i.price) && i.price >= 0 ? i.price : null,
        done: !!i.done
      };
    });
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && Array.isArray(d.lists) && d.lists.length) {
          var lists = d.lists.map(function (l, i) {
            return {
              id: String((l && l.id) || 'l' + i),
              name: l && typeof l.name === 'string' && l.name.trim() ? l.name : 'Lista ' + (i + 1),
              items: sanitizeItems(l && l.items)
            };
          });
          var active = lists.some(function (l) { return l.id === d.active; }) ? d.active : lists[0].id;
          return { lists: lists, active: active };
        }
      }
      // Migração da versão anterior (uma lista só) para a lista "Minha casa"
      var s = defaultState();
      var legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) s.lists[0].items = sanitizeItems(JSON.parse(legacy));
      return s;
    } catch (e) { return defaultState(); }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* sem armazenamento */ }
  }

  function parsePrice(str) {
    var s = String(str).replace(/[R$\s]/g, '');
    if (!s) return null;
    if (s.indexOf(',') !== -1) s = s.replace(/\./g, '').replace(',', '.');
    var n = parseFloat(s);
    if (!isFinite(n) || n < 0 || !/^[0-9.]+$/.test(s)) return NaN;
    return n;
  }

  function clampQty(v) {
    var n = parseInt(v, 10);
    if (!isFinite(n) || n < 1) n = 1;
    return Math.min(99, n);
  }

  // Avisos
  function toast(msg, undo) {
    toastEl.replaceChildren();
    var span = document.createElement('span');
    span.textContent = msg;
    toastEl.append(span);
    if (undo) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Desfazer';
      b.addEventListener('click', function () { undo(); hideToast(); });
      toastEl.append(b);
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 6000);
  }
  function hideToast() { clearTimeout(toastTimer); toastEl.replaceChildren(); }

  function showError(msg) { errEl.textContent = msg; errEl.hidden = false; }
  function clearError() { errEl.textContent = ''; errEl.hidden = true; }

  // Ações
  function removeWhere(pred, msg) {
    var before = JSON.parse(JSON.stringify(items));
    syncItems(items.filter(function (i) { return !pred(i); }));
    save(); render();
    toast(msg, function () { syncItems(before); save(); render(); });
  }

  function itemEl(it) {
    var li = document.createElement('li');
    li.className = 'item' + (it.done ? ' done' : '');

    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = 'c-' + it.id;
    cb.checked = it.done;
    cb.dataset.key = it.id + ':chk';
    cb.addEventListener('change', function () { it.done = cb.checked; save(); render(); });

    var txt = document.createElement('div');
    txt.className = 'txt';
    var lab = document.createElement('label');
    lab.htmlFor = cb.id;
    lab.textContent = it.name;
    txt.append(lab);
    if (it.price !== null) {
      var small = document.createElement('small');
      small.textContent = fmt(it.price) + ' cada';
      txt.append(small);
    }

    var qty = document.createElement('div');
    qty.className = 'qty';
    qty.setAttribute('role', 'group');
    qty.setAttribute('aria-label', 'Quantidade de ' + it.name);
    var dec = document.createElement('button');
    dec.type = 'button';
    dec.textContent = '−';
    dec.disabled = it.qty <= 1;
    dec.dataset.key = it.id + ':dec';
    dec.setAttribute('aria-label', 'Diminuir quantidade de ' + it.name);
    dec.addEventListener('click', function () { it.qty = Math.max(1, it.qty - 1); save(); render(); });
    var num = document.createElement('span');
    num.textContent = it.qty;
    var inc = document.createElement('button');
    inc.type = 'button';
    inc.textContent = '+';
    inc.disabled = it.qty >= 99;
    inc.dataset.key = it.id + ':inc';
    inc.setAttribute('aria-label', 'Aumentar quantidade de ' + it.name);
    inc.addEventListener('click', function () { it.qty = Math.min(99, it.qty + 1); save(); render(); });
    qty.append(dec, num, inc);

    var tot = document.createElement('span');
    tot.className = 'tot';
    tot.textContent = it.price !== null ? fmt(it.price * it.qty) : '';

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'del';
    del.textContent = '×';
    del.setAttribute('aria-label', 'Remover ' + it.name);
    del.addEventListener('click', function () {
      removeWhere(function (x) { return x.id === it.id; }, '“' + it.name + '” removido.');
    });

    li.append(cb, txt, qty, tot, del);
    return li;
  }

  function render() {
    var active = document.activeElement;
    var focusKey = active && active.dataset ? active.dataset.key : null;

    // Abas das listas
    document.querySelectorAll('[data-list]').forEach(function (b) {
      var l = state.lists.filter(function (x) { return x.id === b.dataset.list; })[0];
      b.setAttribute('aria-pressed', String(cur().id === b.dataset.list));
      b.querySelector('.lcount').textContent = l ? l.items.length : 0;
    });

    // Resumo
    var total = items.length;
    var done = items.filter(function (i) { return i.done; }).length;
    var pending = total - done;
    var est = 0, cart = 0, noPrice = 0;
    items.forEach(function (i) {
      if (i.price === null) { noPrice++; return; }
      var line = i.price * i.qty;
      est += line;
      if (i.done) cart += line;
    });

    $('progressText').textContent = total === 0
      ? 'Nenhum item ainda'
      : done + ' de ' + total + (total === 1 ? ' item' : ' itens') + ' no carrinho';
    $('bar').style.width = total ? Math.round((done / total) * 100) + '%' : '0%';

    var parts = est.toFixed(2).split('.');
    $('totInt').textContent = Number(parts[0]).toLocaleString('pt-BR');
    $('totDec').textContent = ',' + parts[1];
    $('cartTotal').textContent = 'No carrinho: ' + fmt(cart);
    var np = $('noPrice');
    if (noPrice > 0) {
      np.hidden = false;
      np.textContent = noPrice === 1 ? '1 item sem preço não entra na soma.' : noPrice + ' itens sem preço não entram na soma.';
    } else { np.hidden = true; }

    // Ferramentas
    toolsEl.hidden = total === 0;
    $('copyBtn').disabled = pending === 0;
    $('uncheckBtn').disabled = done === 0;
    $('clearBtn').disabled = done === 0;
    document.querySelectorAll('[data-filter]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.filter === filter));
    });

    // Lista
    listEl.replaceChildren();
    if (total === 0) {
      listEl.append(emptyBox('A lista "' + cur().name + '" está vazia', 'Adicione o primeiro item no campo acima.'));
    } else {
      var visible = items.filter(function (i) {
        return filter === 'all' || (filter === 'todo' && !i.done) || (filter === 'done' && i.done);
      });
      if (visible.length === 0) {
        listEl.append(filter === 'todo'
          ? emptyBox('Nada faltando', 'Todos os itens já estão no carrinho.')
          : emptyBox('Carrinho vazio', 'Marque os itens conforme colocar no carrinho.'));
      }
      CATS.forEach(function (cat) {
        var inCat = visible.filter(function (i) { return i.cat === cat.id; })
          .sort(function (a, b) { return Number(a.done) - Number(b.done); });
        if (!inCat.length) return;
        var sec = document.createElement('section');
        sec.className = 'group';
        var h = document.createElement('h2');
        var t = document.createElement('span');
        t.textContent = cat.label;
        var c = document.createElement('span');
        c.className = 'count';
        c.textContent = inCat.length;
        h.append(t, c);
        var ul = document.createElement('ul');
        ul.className = 'rows';
        inCat.forEach(function (it) { ul.append(itemEl(it)); });
        sec.append(h, ul);
        listEl.append(sec);
      });
    }

    if (focusKey) {
      var el = document.querySelector('[data-key="' + focusKey + '"]');
      if (el && !el.disabled) el.focus();
    }
  }

  function emptyBox(title, text) {
    var d = document.createElement('div');
    d.className = 'empty';
    var s = document.createElement('strong');
    s.textContent = title;
    d.append(s, document.createTextNode(text));
    return d;
  }

  // Copiar o que falta comprar
  function listAsText() {
    var lines = ['Lista de compras — ' + cur().name];
    CATS.forEach(function (cat) {
      var todo = items.filter(function (i) { return i.cat === cat.id && !i.done; });
      if (!todo.length) return;
      lines.push('', cat.label);
      todo.forEach(function (i) { lines.push('- ' + (i.qty > 1 ? i.qty + 'x ' : '') + i.name); });
    });
    return lines.join('\n');
  }
  function copyText(text) {
    var fallback = function () {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.append(ta);
        ta.select();
        var ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch (e) { return false; }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
    }
    return Promise.resolve(fallback());
  }

  // Eventos
  formEl.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = nameEl.value.trim().replace(/\s+/g, ' ');
    if (!name) { showError('Digite o nome do item.'); nameEl.focus(); return; }
    var price = parsePrice(priceEl.value);
    if (Number.isNaN(price)) { showError('Preço inválido. Use números, como 4,90.'); priceEl.focus(); return; }
    clearError();

    var qty = clampQty(qtyEl.value);
    var key = norm(name);
    var existing = items.filter(function (i) { return norm(i.name) === key && !i.done; })[0];
    if (existing) {
      existing.qty = Math.min(99, existing.qty + qty);
      if (price !== null) existing.price = price;
      toast('“' + existing.name + '” já estava na lista. Somei à quantidade.');
    } else {
      items.push({ id: uid(), name: name, qty: qty, cat: catEl.value, price: price, done: false });
    }
    save();

    nameEl.value = '';
    qtyEl.value = 1;
    priceEl.value = '';
    catTouched = false;
    catEl.value = 'outros';
    render();
    nameEl.focus();
  });

  nameEl.addEventListener('input', function () {
    if (!catTouched) catEl.value = guessCategory(nameEl.value);
    if (!errEl.hidden) clearError();
  });
  catEl.addEventListener('change', function () { catTouched = true; });
  priceEl.addEventListener('input', function () { if (!errEl.hidden) clearError(); });

  document.querySelectorAll('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () { filter = b.dataset.filter; render(); });
  });

  document.querySelectorAll('[data-list]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (cur().id === b.dataset.list) return;
      state.active = b.dataset.list;
      items = cur().items;
      save(); render();
    });
  });

  $('uncheckBtn').addEventListener('click', function () {
    var before = JSON.parse(JSON.stringify(items));
    items.forEach(function (i) { i.done = false; });
    save(); render();
    toast('Todos os itens foram desmarcados.', function () { syncItems(before); save(); render(); });
  });
  $('clearBtn').addEventListener('click', function () {
    var n = items.filter(function (i) { return i.done; }).length;
    if (!n) return;
    removeWhere(function (i) { return i.done; }, n === 1 ? '1 item removido.' : n + ' itens removidos.');
  });
  $('copyBtn').addEventListener('click', function () {
    copyText(listAsText()).then(function (ok) {
      toast(ok ? 'Lista copiada.' : 'Não foi possível copiar a lista.');
    });
  });

  // Início
  CATS.forEach(function (c) {
    var o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.label;
    catEl.append(o);
  });
  catEl.value = 'outros';
  var dl = $('suggestions');
  SUGGESTIONS.forEach(function (s) {
    var o = document.createElement('option');
    o.value = s;
    dl.append(o);
  });
  render();
})();