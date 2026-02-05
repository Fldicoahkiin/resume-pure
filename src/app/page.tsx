'use client';

import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-gray-800" size={28} />
            <span className="text-xl font-semibold">Resume Pure</span>
          </div>
          <Link
            href="/builder"
            className="px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition"
          >
            开始编辑
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
            写简历，不折腾
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            一个干净的简历编辑器。填写内容，实时预览，导出 PDF。没有注册，没有水印，数据存在本地。
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            开始写简历
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-16 border-t">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">实时预览</h3>
            <p className="text-gray-600">
              左边编辑，右边预览。改一个字，立刻看到效果。
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">本地存储</h3>
            <p className="text-gray-600">
              数据保存在浏览器里，关掉页面再打开，内容还在。
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">导出 PDF</h3>
            <p className="text-gray-600">
              一键导出标准 A4 尺寸的 PDF 文件，直接投递。
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t text-center text-gray-500 text-sm">
        <p>Resume Pure · 开源项目</p>
      </footer>
    </div>
  );
}
