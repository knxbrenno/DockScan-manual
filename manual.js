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
  searchStatus.textContent = terms.length ? `${found} ${found === 1 ? 'capítulo encontrado' : 'capítulos encontrados'} nesta aba.` : 'Todos os capítulos desta aba estão visíveis.';
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

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
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
      button.textContent = 'Copiado';
      document.querySelector('#copy-status').textContent = 'Comando copiado para a área de transferência.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = 'Texto selecionado';
      document.querySelector('#copy-status').textContent = 'Texto selecionado. Use a opção Copiar do seu navegador.';
    }
    setTimeout(() => { button.textContent = 'Copiar'; }, 2400);
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
