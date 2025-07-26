"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchCommand = switchCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chalk = require("chalk");
const inquirer = require("inquirer");
const config_1 = require("../utils/config");
async function switchCommand(targetLanguage) {
    try {
        const config = (0, config_1.readConfig)();
        const localeDir = path.join((0, config_1.getRootPath)(), config.i18nFilePath, "locale");
        // 检查 locale 目录是否存在
        if (!fs.existsSync(localeDir)) {
            console.error(chalk.red(`locale 目录不存在: ${localeDir}`));
            console.log(chalk.yellow('请先运行 "i18n-auto init" 初始化项目'));
            process.exit(1);
        }
        // 获取可用的语言列表
        const availableLanguages = getAvailableLanguages(localeDir);
        if (availableLanguages.length === 0) {
            console.error(chalk.red("未找到任何语言包文件"));
            console.log(chalk.yellow('请先运行 "i18n-auto generate" 生成语言包'));
            process.exit(1);
        }
        console.log(chalk.blue("📋 可用语言:"));
        availableLanguages.forEach((lang) => {
            console.log(chalk.gray(`  - ${lang}`));
        });
        let selectedLanguage = targetLanguage;
        // 如果没有指定语言，让用户选择
        if (!selectedLanguage) {
            const { language } = await inquirer.prompt([
                {
                    type: "list",
                    name: "language",
                    message: "选择要切换到的语言:",
                    choices: availableLanguages,
                },
            ]);
            selectedLanguage = language;
        }
        // 验证选择的语言是否存在
        if (!availableLanguages.includes(selectedLanguage)) {
            console.error(chalk.red(`语言 "${selectedLanguage}" 不存在`));
            console.log(chalk.yellow(`可用语言: ${availableLanguages.join(", ")}`));
            process.exit(1);
        }
        // 显示语言包内容
        await displayLanguagePackage(selectedLanguage, localeDir);
        console.log(chalk.green(`✅ 已切换到语言: ${selectedLanguage}`));
        console.log(chalk.gray(`语言包路径: ${path.join(localeDir, `${selectedLanguage}.json`)}`));
    }
    catch (error) {
        console.error(chalk.red("切换语言失败："), error);
        process.exit(1);
    }
}
function getAvailableLanguages(localeDir) {
    try {
        const files = fs.readdirSync(localeDir);
        return files
            .filter((file) => file.endsWith(".json"))
            .map((file) => file.replace(".json", ""))
            .sort();
    }
    catch (error) {
        return [];
    }
}
async function displayLanguagePackage(language, localeDir) {
    try {
        const filePath = path.join(localeDir, `${language}.json`);
        const content = fs.readFileSync(filePath, "utf8");
        const data = JSON.parse(content);
        const entries = Object.entries(data);
        if (entries.length === 0) {
            console.log(chalk.yellow(`${language}.json 语言包为空`));
            return;
        }
        console.log(chalk.blue(`\n📖 ${language}.json 语言包内容 (${entries.length} 条):`));
        // 显示前10条记录作为预览
        const preview = entries.slice(0, 10);
        preview.forEach(([key, value]) => {
            const displayValue = value ? String(value) : chalk.gray("(未翻译)");
            console.log(chalk.gray(`  ${key}: ${displayValue}`));
        });
        if (entries.length > 10) {
            console.log(chalk.gray(`  ... 还有 ${entries.length - 10} 条记录`));
        }
        // 统计翻译进度
        const translatedCount = entries.filter(([_, value]) => value && String(value).trim()).length;
        const progress = Math.round((translatedCount / entries.length) * 100);
        console.log(chalk.blue(`\n📊 翻译进度: ${translatedCount}/${entries.length} (${progress}%)`));
        if (progress < 100) {
            console.log(chalk.yellow(`💡 提示: 运行 "i18n-auto generate -l ${language}" 来完善翻译`));
        }
    }
    catch (error) {
        console.error(chalk.red(`读取语言包失败: ${error}`));
    }
}
//# sourceMappingURL=switch.js.map