'use strict';

document.documentElement.classList.add('js');

const sidebar = document.querySelector('#sidebar');
const menu = document.querySelector('#menu-toggle');
const search = document.querySelector('#busca');
const chapters = [...document.querySelectorAll('.chapter')];
const links = [...document.querySelectorAll('#chapters a')];
const panels = [...document.querySelectorAll('[data-manual-panel]')];
const tabs = [...document.querySelectorAll('[data-panel]')];
const searchStatus = document.querySelector('#busca-status');
const printButton = document.querySelector('#print-manual');
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
let activePanel;

// Textos que o script escreve na p\u00e1gina, no idioma dela (as tradu\u00e7\u00f5es ficam em en/, es/, fr/, de/ e ja/).
const TEXTOS = {
  'pt-BR': {encontrados: n => `${n} ${n === 1 ? 'cap\u00edtulo encontrado' : 'cap\u00edtulos encontrados'} nesta aba.`, todos: 'Todos os cap\u00edtulos desta aba est\u00e3o vis\u00edveis.',
    copiar: 'Copiar', copiado: 'Copiado', selecionado: 'Texto selecionado', avisoCopiado: 'Comando copiado para a \u00e1rea de transfer\u00eancia.', avisoSelecionado: 'Texto selecionado. Use a op\u00e7\u00e3o Copiar do seu navegador.'},
  en: {encontrados: n => `${n} ${n === 1 ? 'chapter' : 'chapters'} found in this tab.`, todos: 'All chapters in this tab are visible.',
    copiar: 'Copy', copiado: 'Copied', selecionado: 'Text selected', avisoCopiado: 'Command copied to the clipboard.', avisoSelecionado: 'Text selected. Use your browser\u2019s Copy option.'},
  es: {encontrados: n => `${n} ${n === 1 ? 'cap\u00edtulo encontrado' : 'cap\u00edtulos encontrados'} en esta pesta\u00f1a.`, todos: 'Todos los cap\u00edtulos de esta pesta\u00f1a est\u00e1n visibles.',
    copiar: 'Copiar', copiado: 'Copiado', selecionado: 'Texto seleccionado', avisoCopiado: 'Comando copiado al portapapeles.', avisoSelecionado: 'Texto seleccionado. Usa la opci\u00f3n Copiar del navegador.'},
  fr: {encontrados: n => `${n} ${n === 1 ? 'chapitre trouv\u00e9' : 'chapitres trouv\u00e9s'} dans cet onglet.`, todos: 'Tous les chapitres de cet onglet sont visibles.',
    copiar: 'Copier', copiado: 'Copi\u00e9', selecionado: 'Texte s\u00e9lectionn\u00e9', avisoCopiado: 'Commande copi\u00e9e dans le presse-papiers.', avisoSelecionado: 'Texte s\u00e9lectionn\u00e9. Utilisez l\u2019option Copier de votre navigateur.'},
  de: {encontrados: n => `${n} Kapitel in diesem Tab gefunden.`, todos: 'Alle Kapitel dieses Tabs sind sichtbar.',
    copiar: 'Kopieren', copiado: 'Kopiert', selecionado: 'Text markiert', avisoCopiado: 'Befehl in die Zwischenablage kopiert.', avisoSelecionado: 'Text markiert. Verwenden Sie die Kopierfunktion Ihres Browsers.'},
  ja: {encontrados: n => `\u3053\u306e\u30bf\u30d6\u3067 ${n} \u4ef6\u306e\u7ae0\u304c\u898b\u3064\u304b\u308a\u307e\u3057\u305f\u3002`, todos: '\u3053\u306e\u30bf\u30d6\u306e\u3059\u3079\u3066\u306e\u7ae0\u3092\u8868\u793a\u3057\u3066\u3044\u307e\u3059\u3002',
    copiar: '\u30b3\u30d4\u30fc', copiado: '\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f', selecionado: '\u30c6\u30ad\u30b9\u30c8\u3092\u9078\u629e\u3057\u307e\u3057\u305f', avisoCopiado: '\u30b3\u30de\u30f3\u30c9\u3092\u30af\u30ea\u30c3\u30d7\u30dc\u30fc\u30c9\u306b\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f\u3002', avisoSelecionado: '\u30c6\u30ad\u30b9\u30c8\u3092\u9078\u629e\u3057\u307e\u3057\u305f\u3002\u30d6\u30e9\u30a6\u30b6\u30fc\u306e\u30b3\u30d4\u30fc\u6a5f\u80fd\u3092\u4f7f\u3063\u3066\u304f\u3060\u3055\u3044\u3002'},
};
const T = TEXTOS[document.documentElement.lang] || TEXTOS['pt-BR'];

function closeMenu() {
  sidebar.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
}

function inActivePanel(chapter) {
  return chapter.closest('[data-manual-panel]').id === activePanel;
}

function markChapter(id) {
  for (const link of links) {
    if (link.hash === `#${id}` && !link.hidden) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

function filterChapters() {
  const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
  let found = 0;
  for (const chapter of chapters) {
    const text = normalize(`${chapter.textContent} ${chapter.dataset.keywords || ''}`);
    const match = terms.every(term => text.includes(term));
    chapter.hidden = !match;
    const link = links.find(item => item.hash === `#${chapter.id}`);
    if (link) link.hidden = !match || (terms.length > 0 && !inActivePanel(chapter));
    if (match && inActivePanel(chapter)) found += 1;
  }
  document.querySelector('#sem-resultados').hidden = found !== 0;
  searchStatus.textContent = terms.length ? T.encontrados(found) : T.todos;
  const current = chapters.find(chapter => !chapter.hidden && inActivePanel(chapter));
  markChapter(current ? current.id : '');
}

function activatePanel(id) {
  activePanel = id;
  panels.forEach(panel => { panel.hidden = panel.id !== id; });
  tabs.forEach(tab => {
    const selected = tab.dataset.panel === id;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  filterChapters();
}

function revealTarget(target) {
  const panel = target.closest('[data-manual-panel]');
  if (!panel) return;
  if (panel.id !== activePanel) {
    search.value = '';
    activatePanel(panel.id);
  }
  const chapter = target.closest('.chapter');
  if (chapter?.hidden) {
    search.value = '';
    filterChapters();
  }
  const disclosure = target.closest('details');
  if (disclosure) disclosure.open = true;
  if (chapter) markChapter(chapter.id);
}

// Os dois painéis ficam disponíveis sem JavaScript e na impressão.
document.querySelector('#manual-tabs').setAttribute('role', 'tablist');
tabs.forEach(tab => {
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-controls', tab.dataset.panel);
  const panel = document.getElementById(tab.dataset.panel);
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', tab.id);
  tab.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    // A navegação nativa por âncora tiraria o foco da aba ao usar as setas.
    event.preventDefault();
    revealTarget(document.getElementById(tab.hash.slice(1)));
    if (location.hash !== tab.hash) history.pushState(null, '', tab.hash);
    closeMenu();
  });
  tab.addEventListener('keydown', event => {
    if (event.key === ' ') {
      event.preventDefault();
      tab.click();
      return;
    }
    const index = tabs.indexOf(tab);
    const next = {ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1}[event.key];
    if (next === undefined) return;
    event.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  });
});

const initialTarget = document.getElementById(location.hash.slice(1));
activatePanel(initialTarget?.closest('[data-manual-panel]')?.id || panels[0].id);
if (initialTarget) revealTarget(initialTarget);

menu.hidden = false;
document.querySelector('#search-control').hidden = false;
printButton.hidden = false;
menu.addEventListener('click', () => {
  const open = sidebar.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  if (open) search.focus();
});

search.addEventListener('input', filterChapters);
search.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    const first = chapters.find(chapter => !chapter.hidden && inActivePanel(chapter));
    closeMenu();
    if (first) {
      first.scrollIntoView({block: 'start'});
      const heading = first.querySelector('h1, h2');
      heading.setAttribute('tabindex', '-1');
      heading.focus({preventScroll: true});
    }
  }
});
document.querySelector('#limpar-busca').addEventListener('click', () => {
  search.value = '';
  filterChapters();
  if (window.matchMedia('(max-width: 760px)').matches) {
    sidebar.classList.add('open');
    menu.setAttribute('aria-expanded', 'true');
  }
  search.focus();
});

document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const target = document.getElementById(link.hash.slice(1));
  if (!target) return;
  revealTarget(target);
  closeMenu();
}));
window.addEventListener('hashchange', () => {
  const target = document.getElementById(location.hash.slice(1));
  if (target) revealTarget(target);
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(() => {
    const visible = chapters.filter(chapter => !chapter.hidden && inActivePanel(chapter));
    const current = visible.find(chapter => chapter.getBoundingClientRect().bottom > 160);
    if (current) markChapter(current.id);
  }, {rootMargin: '-80px 0px -55% 0px', threshold: 0});
  chapters.forEach(chapter => observer.observe(chapter));
}

// Idioma: trocar de língua mantém o capítulo aberto; clique fora ou Esc fecha a lista.
const languages = document.querySelector('.lang-menu');
languages?.querySelectorAll('a[data-idioma]').forEach(link => link.addEventListener('click', () => {
  link.href = link.href.split('#')[0] + location.hash;
}));
document.addEventListener('click', event => {
  if (languages?.open && !languages.contains(event.target)) languages.open = false;
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (languages?.open) {
      languages.open = false;
      languages.querySelector('summary').focus();
      return;
    }
    const menuWasOpen = sidebar.classList.contains('open');
    closeMenu();
    if (menuWasOpen) menu.focus();
  }
});

document.querySelectorAll('[data-copy]').forEach(button => {
  button.hidden = false;
  button.addEventListener('click', async () => {
    const code = button.parentElement.querySelector('code');
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Área de transferência indisponível');
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = T.copiado;
      document.querySelector('#copy-status').textContent = T.avisoCopiado;
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = T.selecionado;
      document.querySelector('#copy-status').textContent = T.avisoSelecionado;
    }
    setTimeout(() => { button.textContent = T.copiar; }, 2400);
  });
});

// Inclui as respostas recolhidas e todos os capítulos no PDF ou na impressão.
let detailsBeforePrint = [];
window.addEventListener('beforeprint', () => {
  detailsBeforePrint = [...document.querySelectorAll('details')].map(details => [details, details.open]);
  detailsBeforePrint.forEach(([details]) => { details.open = true; });
});
window.addEventListener('afterprint', () => {
  detailsBeforePrint.forEach(([details, open]) => { details.open = open; });
  detailsBeforePrint = [];
});
printButton.addEventListener('click', () => window.print());
