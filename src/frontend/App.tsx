import { HomePage } from './pages/home/page.js';

const routes: Record<string, typeof HomePage> = {
  '/': HomePage,
  '/home': HomePage,
};

export function App() {
  const Page = routes[window.location.pathname] ?? HomePage;
  return <Page />;
}

export default App;
