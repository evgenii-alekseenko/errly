import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Error Logger',
    description: 'Passive logger for network and runtime errors',
    permissions: ['webRequest', 'tabs', 'storage'],
    host_permissions: ['<all_urls>'],
  },
});
