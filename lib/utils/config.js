const fs = require("fs");
const path = require("path");

const defaultConfig = {
  i18nFilePath: "/src/i18n",
  autoImportI18n: true,
  i18nImportPath: "@/i18n",
  templateI18nCall: "$t",
  scriptI18nCall: "i18n.global.t",
  keyFilePathLevel: 2,
  excludedExtensions: [
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".ico",
    ".md",
    ".txt",
    ".json",
    ".css",
    ".scss",
    ".less",
    ".sass",
    ".styl",
  ],
  excludedStrings: [
    "宋体",
    "黑体",
    "楷体",
    "仿宋",
    "微软雅黑",
    "华文",
    "方正",
    "苹方",
    "思源",
    "YYYY年MM月DD日",
  ],
  debug: false,
  freeGoogle: true,
  baidu: {
    appid: "",
    secretKey: "",
  },
  deepl: {
    authKey: "",
    isPro: false,
  },
};

function getRootPath() {
  return process.cwd();
}

function getConfigPath() {
  return path.join(getRootPath(), "automatically-i18n-config.json");
}

function readConfig() {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    return defaultConfig;
  }

  try {
    const configContent = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(configContent);
    return { ...defaultConfig, ...config };
  } catch (error) {
    console.error("读取配置文件时出现错误：", error);
    return defaultConfig;
  }
}

function writeConfig(config) {
  const configPath = getConfigPath();
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("写入配置文件时出现错误：", error);
    throw error;
  }
}

function ensureConfigExists() {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    // 检查父目录是否存在，不存在则创建
    const dirPath = path.dirname(configPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // 写入默认配置
    writeConfig(defaultConfig);
  }
}

// 规范化 i18n 基础路径，移除前导分隔符，避免在不同平台被解析为根路径
function normalizeI18nBasePath(i18nFilePath) {
  let normalizedPath = String(i18nFilePath || "");

  // 统一路径分隔符为正斜杠，便于处理
  normalizedPath = normalizedPath.replace(/\\/g, '/');

  // 移除前导分隔符，避免在不同平台被解析为根路径
  normalizedPath = normalizedPath.replace(/^\/+/, '');

  return normalizedPath;
}

// 解析 i18n 目录中的实际绝对路径
function resolveI18nPath(...segments) {
  const config = readConfig();
  const base = normalizeI18nBasePath(config.i18nFilePath);
  return path.join(getRootPath(), base, ...segments);
}

module.exports = {
  defaultConfig,
  getRootPath,
  getConfigPath,
  readConfig,
  writeConfig,
  ensureConfigExists,
  normalizeI18nBasePath,
  resolveI18nPath,
};
