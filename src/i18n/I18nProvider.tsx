'use client';

import { useSyncExternalStore } from 'react';
import { I18nextProvider } from 'react-i18next';
import { ToastHost } from '@/components/Toast';
import { ConfirmDialogHost } from '@/components/ConfirmDialog';
import i18n from './config';

function subscribeToInitialization(onStoreChange: () => void) {
  i18n.on('initialized', onStoreChange);
  return () => i18n.off('initialized', onStoreChange);
}

function getInitializationSnapshot() {
  return i18n.isInitialized;
}

function getServerInitializationSnapshot() {
  return false;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const isReady = useSyncExternalStore(
    subscribeToInitialization,
    getInitializationSnapshot,
    getServerInitializationSnapshot,
  );

  if (!isReady) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
      <ToastHost />
      <ConfirmDialogHost />
    </I18nextProvider>
  );
}
