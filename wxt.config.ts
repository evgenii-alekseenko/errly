import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Errly',
    description: 'Pass-through error logger — catches HTTP failures and JS exceptions in the background, surfaces them as color-coded toasts with a searchable history.',
    permissions: ['webRequest', 'tabs', 'storage'],
    host_permissions: ['<all_urls>'],
  },
});
