'use strict';

// Executa antes do CSS para abrir diretamente no tema escolhido, sem clarão.
(() => {
  const key = 'dockscan.manual.tema';
  const root = document.documentElement;
  let initialTheme = 'light';
  try {
    if (localStorage.getItem(key) === 'dark') initialTheme = 'dark';
  } catch {
    // A alternância continua disponível se o navegador bloquear o armazenamento.
  }

  function applyTheme(theme) {
    const dark = theme === 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="color-scheme"]').content = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#101b25' : '#ffffff';
    const button = document.querySelector('#theme-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? 'Voltar ao tema claro' : 'Ativar tema escuro';
    }
  }

  applyTheme(initialTheme);
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#theme-toggle');
    applyTheme(root.dataset.theme);
    button.hidden = false;
    button.addEventListener('click', () => {
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
      try { localStorage.setItem(key, root.dataset.theme); } catch { /* Tema válido nesta página. */ }
    });
  });
})();
