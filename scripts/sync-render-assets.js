const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const vendorDir = path.join(publicDir, 'vendor');
const wasmSourcePath = require.resolve('canvaskit-wasm/bin/canvaskit.wasm');
const jsSourcePath = require.resolve('canvaskit-wasm/bin/canvaskit.js');
const wasmTargetPath = path.join(vendorDir, 'canvaskit.wasm');
const jsTargetPath = path.join(vendorDir, 'canvaskit.js');

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function syncFile(sourcePath, targetPath) {
  const source = fs.readFileSync(sourcePath);
  const shouldWrite =
    !fs.existsSync(targetPath) ||
    fs.statSync(targetPath).size !== source.length;

  if (shouldWrite) {
    fs.writeFileSync(targetPath, source);
    return true;
  }

  return false;
}

function syncCanvasKitAssets() {
  ensureDirectory(vendorDir);

  const wroteJs = syncFile(jsSourcePath, jsTargetPath);
  const wroteWasm = syncFile(wasmSourcePath, wasmTargetPath);

  if (wroteJs || wroteWasm) {
    console.log('✅ [render-assets:update] 已同步 CanvasKit 运行时到 public/vendor');
    return;
  }

  console.log('ℹ️ [render-assets:update] CanvasKit 运行时已是最新版本。');
}

syncCanvasKitAssets();
