import van from 'vanjs-core';


const { div, header, span, h1, button, main, iframe, h2, p } = van.tags;

function AppShell() {
  const activeTab = van.state<string>('authservice');

  return div(
    { className: 'krnl-app-shell' },
    header(
      { className: 'krnl-header' },
      div(
        { style: 'display: flex; align-items: center; gap: 0.65rem;' },
        span({ style: 'font-size: 1.2rem; line-height: 1;' }, '⬡'),
        h1('MyMagneticSystem')
      )
    ),
    div(
      { className: 'krnl-nav-tabs' },
      
      button({ className: () => `krnl-tab-btn ${activeTab.val === 'authservice' ? 'active' : ''}`, onclick: () => activeTab.val = 'authservice', title: 'authservice' }, span('📦'), span({ className: 'krnl-tab-label' }, 'authservice')),
      button({ className: () => `krnl-tab-btn ${activeTab.val === 'nonkrnlapp' ? 'active' : ''}`, onclick: () => activeTab.val = 'nonkrnlapp', title: 'nonkrnlapp' }, span('📦'), span({ className: 'krnl-tab-label' }, 'nonkrnlapp'))
    ),
    main(
      { className: 'krnl-main-body' },
      
      () => activeTab.val === 'authservice' ? iframe({ src: '/authservice/frontend/', title: 'authservice', style: 'width: 100%; height: calc(100vh - 160px); border: none; border-radius: 8px;' }) : null,
      () => activeTab.val === 'nonkrnlapp' ? iframe({ src: '/nonkrnlapp/frontend/', title: 'nonkrnlapp', style: 'width: 100%; height: calc(100vh - 160px); border: none; border-radius: 8px;' }) : null
    )
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  van.add(rootElement, AppShell());
}
