import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { AppProviders } from './app/providers';
import { App } from './app/App';

const FAVICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#E7F3EC"/>' +
  '<path d="M32 52V32" fill="none" stroke="#1E8A63" stroke-width="4.5" stroke-linecap="round"/>' +
  '<path d="M32 38C22 38 16 30 16 20c11 0 16 7 16 18z" fill="#1E8A63"/>' +
  '<path d="M32 31C32 20 39 12 49 12c0 11-7 19-17 19z" fill="#3FB58A"/>' +
  '<path d="M14 52h36" fill="none" stroke="#0D2B5E" stroke-width="3.5" stroke-linecap="round" opacity=".55"/></svg>';

function setFavicon(): void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/svg+xml';
  link.href = 'data:image/svg+xml,' + encodeURIComponent(FAVICON_SVG);
}

setFavicon();

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <AppProviders>
    <App />
  </AppProviders>,
);
