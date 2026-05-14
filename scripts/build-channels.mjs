import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const channelsDir = path.join(rootDir, 'configs', 'channels');
const runtimeTarget = path.join(rootDir, 'js', 'channel-configs.js');
const distDir = path.join(rootDir, 'dist', 'channels');
const indexTemplatePath = path.join(rootDir, 'index.html');
const simulatorCssPath = path.join(rootDir, 'css', 'simulador.css');
const simulatorJsPath = path.join(rootDir, 'js', 'simulador.js');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readChannelConfigs() {
  const files = fs
    .readdirSync(channelsDir)
    .filter((file) => file.endsWith('.json'))
    .sort();

  const output = {};

  for (const file of files) {
    const fullPath = path.join(channelsDir, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const config = JSON.parse(raw);

    if (!config.channelId) {
      throw new Error(`Config sin channelId: ${file}`);
    }

    output[config.channelId] = config;
  }

  return output;
}

function writeRuntimeConfig(configs) {
  const serialized = JSON.stringify(configs, null, 2);
  const content = `window.SIMULADOR_CONFIGS = ${serialized};\n`;
  fs.writeFileSync(runtimeTarget, content, 'utf8');
}

function renderChannelIndex(template, channelId) {
  const scriptTag = '<script src="js/channel-configs.js"></script>';
  let html = template;

  if (!html.includes(scriptTag)) {
    html = html.replace('<script src="js/simulador.js"></script>', `${scriptTag}\n  <script src="js/simulador.js"></script>`);
  }

  html = html.replace(
    '<html lang="es">',
    `<html lang="es" data-canal="${channelId}">`,
  );

  return html;
}

function writeChannelRuntimeConfig(channelDir, channelConfig) {
  const runtimeConfig = `window.SIMULADOR_CONFIGS = ${JSON.stringify({ [channelConfig.channelId]: channelConfig }, null, 2)};\n`;
  const jsDir = path.join(channelDir, 'js');
  ensureDir(jsDir);
  fs.writeFileSync(path.join(jsDir, 'channel-configs.js'), runtimeConfig, 'utf8');
}

function copyChannelAssets(channelDir) {
  const cssDir = path.join(channelDir, 'css');
  const jsDir = path.join(channelDir, 'js');
  ensureDir(cssDir);
  ensureDir(jsDir);

  fs.copyFileSync(simulatorCssPath, path.join(cssDir, 'simulador.css'));
  fs.copyFileSync(simulatorJsPath, path.join(jsDir, 'simulador.js'));
}

function writeBuildOutputs(configs) {
  ensureDir(distDir);
  const template = fs.readFileSync(indexTemplatePath, 'utf8');

  Object.keys(configs).forEach((channelId) => {
    const channelConfig = configs[channelId];
    const channelDir = path.join(distDir, channelId);
    ensureDir(channelDir);

    copyChannelAssets(channelDir);
    writeChannelRuntimeConfig(channelDir, channelConfig);

    const html = renderChannelIndex(template, channelId);
    fs.writeFileSync(path.join(channelDir, 'index.html'), html, 'utf8');
  });
}

function main() {
  const configs = readChannelConfigs();
  writeRuntimeConfig(configs);
  writeBuildOutputs(configs);
  console.log(`Canales procesados: ${Object.keys(configs).length}`);
}

main();
