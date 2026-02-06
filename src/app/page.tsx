'use client';

import Link from 'next/link';
import { FileText, ArrowRight, Github, Eye, HardDrive, Download, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-gray-800 dark:text-gray-200" size={28} />
            <span className="text-xl font-semibold dark:text-white">{t('common.appName')}</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <ThemeToggle />
            <a
              href="https://github.com/Fldicoahkiin/resume-pure"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition"
            >
              <Github size={22} />
            </a>
            <Link
              href="/builder"
              className="px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition"
            >
              {t('common.startEditing')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {t('home.hero.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
            {t('home.hero.description')}
          </p>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {t('home.hero.subtext')}
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition"
          >
            {t('common.createResume')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-16 border-t border-gray-200 dark:border-gray-700">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="text-gray-700 dark:text-gray-300" size={20} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('home.features.livePreview.title')}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {t('home.features.livePreview.description')}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <HardDrive className="text-gray-700 dark:text-gray-300" size={20} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('home.features.localStorage.title')}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {t('home.features.localStorage.description')}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Download className="text-gray-700 dark:text-gray-300" size={20} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('home.features.multiFormat.title')}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {t('home.features.multiFormat.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="container mx-auto px-6 py-16 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-gray-700 dark:text-gray-300" size={20} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('home.why.title')}</h2>
          </div>
          <ul className="space-y-3 text-gray-600 dark:text-gray-400">
            <li>· {t('home.why.reasons.noAccount')}</li>
            <li>· {t('home.why.reasons.free')}</li>
            <li>· {t('home.why.reasons.professional')}</li>
            <li>· {t('home.why.reasons.control')}</li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>
          <a
            href="https://github.com/Fldicoahkiin/resume-pure"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700 dark:hover:text-gray-200"
          >
            GitHub
          </a>
          <span className="mx-2">·</span>
          MIT License
        </p>
      </footer>
    </div>
  );
}
