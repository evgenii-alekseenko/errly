import ReactDOM from 'react-dom/client';
import type { ShowToastMessage } from '@/lib/types';
import { pushToast } from '@/lib/toast-store';
import { ToastQueue } from './Toast';
import './style.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  cssInjectionMode: 'ui',
  async main(ctx) {
    browser.runtime.onMessage.addListener((message: unknown) => {
      const msg = message as ShowToastMessage | undefined;
      if (msg?.type === 'show-toast') pushToast(msg.record);
    });

    const ui = await createShadowRootUi(ctx, {
      name: 'error-logger-toast',
      position: 'overlay',
      alignment: 'bottom-right',
      zIndex: 2_147_483_647,
      onMount: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(<ToastQueue />);
        return root;
      },
      onRemove: (root) => root?.unmount(),
    });
    ui.mount();
  },
});
