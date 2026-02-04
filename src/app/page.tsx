'use client';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-12 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Resume Pure
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          纯粹的简历编辑器 - 专注于内容，支持 JSON/YAML 导入导出
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
          <div className="p-6 bg-blue-50 rounded-lg">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-semibold text-lg mb-2">实时编辑</h3>
            <p className="text-gray-600 text-sm">
              所见即所得，实时预览简历效果
            </p>
          </div>

          <div className="p-6 bg-indigo-50 rounded-lg">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="font-semibold text-lg mb-2">高度自定义</h3>
            <p className="text-gray-600 text-sm">
              自定义组件显示、顺序和布局
            </p>
          </div>

          <div className="p-6 bg-purple-50 rounded-lg">
            <div className="text-3xl mb-3">💾</div>
            <h3 className="font-semibold text-lg mb-2">多格式导出</h3>
            <p className="text-gray-600 text-sm">
              支持 JSON、YAML、PDF、PNG 导出
            </p>
          </div>
        </div>

        <a
          href="/builder"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
        >
          开始创建简历
        </a>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            所有数据保存在本地浏览器，隐私安全
          </p>
        </div>
      </div>
    </main>
  );
}
