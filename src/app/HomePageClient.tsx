'use client';

import Link from 'next/link';
import { FileText, ArrowRight, Github, Eye, HardDrive, Download, Database, FileSearch, ListChecks } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-gray-800 dark:text-gray-200" size={24} />
            <span className="text-lg sm:text-xl font-semibold dark:text-white">{t('common.appName')}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageToggle />
            <ThemeToggle />
            <a
              href="https://github.com/Fldicoahkiin/resume-pure"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition"
            >
              <Github size={22} />
            </a>
            <Link
              href="/builder"
              className="px-4 sm:px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition whitespace-nowrap"
            >
              {t('common.startEditing')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            {t('common.startEditing')}
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {t('home.hero.title')}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
            {t('home.hero.description')}
          </p>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-2">
            {t('home.hero.subtext')}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-900 text-white text-sm sm:text-base rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition"
            >
              {t('common.createResume')}
              <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
            </Link>
            <a
              href="https://github.com/Fldicoahkiin/resume-pure"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 text-sm sm:text-base rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 transition"
            >
              <Github size={16} className="sm:w-[18px] sm:h-[18px]" />
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Eye className="text-gray-700 dark:text-gray-300 flex-shrink-0" size={18} />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('home.features.livePreview.title')}</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {t('home.features.livePreview.description')}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <HardDrive className="text-gray-700 dark:text-gray-300 flex-shrink-0" size={18} />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('home.features.localStorage.title')}</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {t('home.features.localStorage.description')}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Download className="text-gray-700 dark:text-gray-300 flex-shrink-0" size={18} />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('home.features.multiFormat.title')}</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {t('home.features.multiFormat.description')}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <FileSearch className="text-gray-700 dark:text-gray-300 flex-shrink-0" size={18} />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('home.features.paperSize.title')}</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {t('home.features.paperSize.description')}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Database className="text-gray-700 dark:text-gray-300 flex-shrink-0" size={18} />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('home.features.rawData.title')}</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {t('home.features.rawData.description')}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <ListChecks className="text-gray-700 dark:text-gray-300 flex-shrink-0" size={18} />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('home.features.editingFlow.title')}</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {t('home.features.editingFlow.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="max-w-2xl">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">{t('home.why.title')}</h2>
          <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">·</span>
              <span>{t('home.why.reasons.pureFocus')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">·</span>
              <span>{t('home.why.reasons.noAccount')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">·</span>
              <span>{t('home.why.reasons.free')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">·</span>
              <span>{t('home.why.reasons.professional')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">·</span>
              <span>{t('home.why.reasons.control')}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <a
            href="https://github.com/Fldicoahkiin/resume-pure"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center gap-1"
          >
            <Github size={14} className="sm:w-4 sm:h-4" />
            GitHub
          </a>
          <span>·</span>
          <span>MIT License</span>
        </p>
      </footer>
    </div>
  );
}
