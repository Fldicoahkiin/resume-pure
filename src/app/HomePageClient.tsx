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
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center sm:text-left flex justify-center sm:justify-start">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {t('common.startEditing')}
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-400 mb-6 tracking-tight leading-tight">
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
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 bg-gray-900 text-white font-medium rounded-xl shadow-lg shadow-gray-900/20 hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-gray-900/30 dark:bg-white dark:text-gray-900 dark:shadow-white/10 dark:hover:bg-gray-100 dark:hover:shadow-white/20 transition-all duration-300"
            >
              {t('common.createResume')}
              <ArrowRight size={18} />
            </Link>
            <a
              href="https://github.com/Fldicoahkiin/resume-pure"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Github size={18} />
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 border-t border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: <Eye className="text-blue-500 dark:text-blue-400" size={22} />,
              title: t('home.features.livePreview.title'),
              desc: t('home.features.livePreview.description'),
            },
            {
              icon: <HardDrive className="text-green-500 dark:text-green-400" size={22} />,
              title: t('home.features.localStorage.title'),
              desc: t('home.features.localStorage.description'),
            },
            {
              icon: <Download className="text-purple-500 dark:text-purple-400" size={22} />,
              title: t('home.features.multiFormat.title'),
              desc: t('home.features.multiFormat.description'),
            },
            {
              icon: <FileSearch className="text-amber-500 dark:text-amber-400" size={22} />,
              title: t('home.features.paperSize.title'),
              desc: t('home.features.paperSize.description'),
            },
            {
              icon: <Database className="text-pink-500 dark:text-pink-400" size={22} />,
              title: t('home.features.rawData.title'),
              desc: t('home.features.rawData.description'),
            },
            {
              icon: <ListChecks className="text-cyan-500 dark:text-cyan-400" size={22} />,
              title: t('home.features.editingFlow.title'),
              desc: t('home.features.editingFlow.description'),
            },
          ].map((feat, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none dark:hover:border-gray-700 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
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
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {[
              t('home.why.reasons.pureFocus'),
              t('home.why.reasons.noAccount'),
              t('home.why.reasons.free'),
              t('home.why.reasons.professional'),
              t('home.why.reasons.control')
            ].map((reason, i) => (
              <div key={i} className="flex items-start gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">{reason}</span>
              </div>
            ))}
          </div>
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
