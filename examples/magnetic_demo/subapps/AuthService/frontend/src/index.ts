import van from 'vanjs-core';


const { div, header, span, h1, button, main, iframe, h2, p } = van.tags;

function AppShell() {
  const activeTab = van.state<string>('welcome');

  return div(
    { className: 'krnl-app-shell' },
    header(
      { className: 'krnl-header' },
      div(
        { style: 'display: flex; align-items: center; gap: 0.65rem;' },
        span({ style: 'font-size: 1.2rem; line-height: 1;' }, '⬡'),
        h1('AuthService')
      )
    ),
    div(
      { className: 'krnl-nav-tabs' },
      
      
    ),
    main(
      { className: 'krnl-main-body' },
      
      
    )
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  van.add(rootElement, AppShell());
}
