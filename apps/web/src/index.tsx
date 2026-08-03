/* @refresh reload */
import { render } from 'solid-js/web';
import { HashRouter } from '@solidjs/router';
import './index.css';
import App from './App';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

CapacitorUpdater.notifyAppReady();

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(
  () => (
    <HashRouter>
      <App />
    </HashRouter>
  ),
  root!
);
