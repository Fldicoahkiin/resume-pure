'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function DocumentTitle() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = t('metadata.title');
  }, [t, i18n.language]);

  return null;
}
