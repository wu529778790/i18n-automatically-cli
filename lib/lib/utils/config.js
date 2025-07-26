"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.getRootPath = getRootPath;
exports.getConfigPath = getConfigPath;
exports.readConfig = readConfig;
exports.writeConfig = writeConfig;
exports.ensureConfigExists = ensureConfigExists;
const fs = require("fs");
const path = require("path");
exports.defaultConfig = {
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
        return exports.defaultConfig;
    }
    try {
        const configContent = fs.readFileSync(configPath, "utf8");
        const config = JSON.parse(configContent);
        return { ...exports.defaultConfig, ...config };
    }
    catch (error) {
        console.error("读取配置文件时出现错误：", error);
        return exports.defaultConfig;
    }
}
function writeConfig(config) {
    const configPath = getConfigPath();
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
    catch (error) {
        console.error("写入配置文件时出现错误：", error);
        throw error;
    }
}
function ensureConfigExists() {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
        writeConfig(exports.defaultConfig);
    }
}
module.exports = {
    defaultConfig: exports.defaultConfig,
    getRootPath,
    getConfigPath,
    readConfig,
    writeConfig,
    ensureConfigExists,
};
//# sourceMappingURL=config.js.map