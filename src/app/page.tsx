'use client';

import Link from 'next/link';
import { FileText, Download, Upload, Settings, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-500" size={32} />
            <h1 className="text-2xl font-bold">Resume Pure</h1>
          </div>
          <Link
            href="/builder"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            开始使用
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            纯粹的简历编辑器
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            专注于内容，无需 PDF 导入。支持实时预览、多格式导出、组件级自定义配置
          </p>
          <Link
            href="/builder"
            className="inline-block px-8 py-4 bg-blue-500 text-white text-lg rounded-lg hover:bg-blue-600 transition shadow-lg"
          >
            立即创建简历
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">核心特性</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="text-blue-500" size={24} />
            </div>
            <h4 className="text-xl font-semibold mb-2">实时编辑预览</h4>
            <p className="text-gray-600">
              所见即所得，编辑内容实时反映在预览区域
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Settings className="text-purple-500" size={24} />
            </div>
            <h4 className="text-xl font-semibold mb-2">组件级自定义</h4>
            <p className="text-gray-600">
              自定义每个组件的显示/隐藏、顺序和布局
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Download className="text-green-500" size={24} />
            </div>
            <h4 className="text-xl font-semibold mb-2">多格式导出</h4>
            <p className="text-gray-600">
              支持 JSON、YAML、PDF、PNG 多种格式导出
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Upload className="text-orange-500" size={24} />
            </div>
            <h4 className="text-xl font-semibold mb-2">数据导入导出</h4>
            <p className="text-gray-600">
              通过 JSON/YAML 格式轻松备份和迁移简历数据
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">技术栈</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-3">核心技术</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Next.js 14 (App Router)</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Zustand + Persist</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">导出功能</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• @react-pdf/renderer (PDF)</li>
                <li>• html-to-image (PNG)</li>
                <li>• js-yaml (YAML)</li>
                <li>• 原生 JSON 支持</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-12 text-white">
          <Sparkles className="mx-auto mb-4" size={48} />
          <h3 className="text-3xl font-bold mb-4">开始创建你的简历</h3>
          <p className="text-xl mb-8 opacity-90">
            纯粹、简洁、高效的简历编辑体验
          </p>
          <Link
            href="/builder"
            className="inline-block px-8 py-4 bg-white text-blue-500 text-lg rounded-lg hover:bg-gray-100 transition shadow-lg font-semibold"
          >
            立即开始
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>© 2024 Resume Pure. 基于 Next.js 构建</p>
      </footer>
    </div>
  );
}
