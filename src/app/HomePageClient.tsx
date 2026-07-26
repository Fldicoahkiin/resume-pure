'use client';

import Link from 'next/link';
import { FileText, ArrowRight, Github, Eye, HardDrive, Download, Database, FileSearch, ListChecks, Check } from 'lucide-react';
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
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center sm:text-left flex justify-center sm:justify-start">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
            {t('home.hero.title')}
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 mb-4 leading-relaxed max-w-2xl mx-auto sm:mx-0">
            {t('home.hero.description')}
          </p>
          <p className="text-sm sm:text-base text-gray-400 dark:text-gray-500 mb-8 max-w-2xl mx-auto sm:mx-0">
            {t('home.hero.subtext')}
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-colors duration-150 hover:bg-gray-800 sm:px-8 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {t('common.createResume')}
              <ArrowRight size={18} />
            </Link>
            <a
              href="https://github.com/Fldicoahkiin/resume-pure"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-6 py-3 font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 sm:px-8 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Github size={18} />
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 border-t border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
          {[
            {
              icon: <Eye size={22} />,
              title: t('home.features.livePreview.title'),
              desc: t('home.features.livePreview.description'),
            },
            {
              icon: <HardDrive size={22} />,
              title: t('home.features.localStorage.title'),
              desc: t('home.features.localStorage.description'),
            },
            {
              icon: <Download size={22} />,
              title: t('home.features.multiFormat.title'),
              desc: t('home.features.multiFormat.description'),
            },
            {
              icon: <FileSearch size={22} />,
              title: t('home.features.paperSize.title'),
              desc: t('home.features.paperSize.description'),
            },
            {
              icon: <Database size={22} />,
              title: t('home.features.rawData.title'),
              desc: t('home.features.rawData.description'),
            },
            {
              icon: <ListChecks size={22} />,
              title: t('home.features.editingFlow.title'),
              desc: t('home.features.editingFlow.description'),
            },
          ].map((feat) => (
            <div
              key={feat.title}
              className="border-t border-gray-200 pt-5 dark:border-gray-700"
            >
              <div className="mb-4 text-gray-700 dark:text-gray-300">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="py-16 sm:py-24 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 sm:mb-12">{t('home.why.title')}</h2>
          <ul className="mx-auto grid max-w-4xl grid-cols-1 gap-x-12 gap-y-5 text-left sm:grid-cols-2">
            {[
              t('home.why.reasons.pureFocus'),
              t('home.why.reasons.noAccount'),
              t('home.why.reasons.free'),
              t('home.why.reasons.professional'),
              t('home.why.reasons.control')
            ].map((reason) => (
              <li key={reason} className="flex items-start gap-3">
                <Check className="mt-0.5 shrink-0 text-gray-900 dark:text-white" size={18} strokeWidth={2.5} />
                <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">{reason}</span>
              </li>
            ))}
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
