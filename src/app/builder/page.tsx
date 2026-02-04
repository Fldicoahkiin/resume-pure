'use client';

export default function BuilderPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">简历编辑器</h1>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">编辑区域</h2>
            <p className="text-gray-600">编辑功能开发中...</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">预览区域</h2>
            <p className="text-gray-600">预览功能开发中...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
