'use client';

import Link from 'next/link';
import { FileText, ArrowRight, Github, Eye, HardDrive, Download, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-gray-800 dark:text-gray-200" size={28} />
            <span className="text-xl font-semibold dark:text-white">Resume Pure</span>
          </div>
          <div className="flex items-center gap-4">
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
              开始编辑
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            简单好用的在线简历编辑器
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
            不用注册，不用下载，打开就能写。数据存本地，导出免费。
          </p>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            适合想快速做份干净简历的人。
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition"
          >
            立即制作简历
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">实时预览</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              A4 尺寸 1:1 渲染，左边编辑右边看，不用反复导出。
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <HardDrive className="text-gray-700 dark:text-gray-300" size={20} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">本地存储</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              数据存在浏览器本地，没网也能用，隐私不担心。
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Download className="text-gray-700 dark:text-gray-300" size={20} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">多格式导出</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              PDF / PNG / JSON / YAML，投简历、备份、换设备都方便。
            </p>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="container mx-auto px-6 py-16 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-gray-700 dark:text-gray-300" size={20} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">为什么要用 Resume Pure</h2>
          </div>
          <ul className="space-y-3 text-gray-600 dark:text-gray-400">
            <li>· 不用注册账号，打开即用</li>
            <li>· 没有付费墙，所有功能免费</li>
            <li>· 排版简洁专业，不用自己调格式</li>
            <li>· 数据自己掌控，随时可以导出备份</li>
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
