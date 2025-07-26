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
exports.initCommand = initCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chalk = require("chalk");
const inquirer = require("inquirer");
const ora = require("ora");
const config_1 = require("../utils/config");
async function initCommand() {
    console.log(chalk.blue.bold("🚀 欢迎使用 i18n-automatically CLI"));
    console.log(chalk.gray("正在初始化项目国际化配置..."));
    try {
        // 检查是否已存在配置文件
        const configPath = path.join((0, config_1.getRootPath)(), "automatically-i18n-config.json");
        if (fs.existsSync(configPath)) {
            const { overwrite } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "overwrite",
                    message: "配置文件已存在，是否覆盖？",
                    default: false,
                },
            ]);
            if (!overwrite) {
                console.log(chalk.yellow("取消初始化"));
                return;
            }
        }
        // 交互式配置
        const config = await promptForConfig();
        // 创建 i18n 目录结构
        const spinner = ora("创建项目结构...").start();
        await createProjectStructure(config);
        spinner.succeed("项目结构创建完成");
        // 保存配置
        (0, config_1.writeConfig)(config);
        console.log(chalk.green.bold("✅ 初始化完成！"));
        console.log(chalk.gray("你可以运行以下命令开始使用："));
        console.log(chalk.cyan("  i18n-auto scan          # 扫描单个文件"));
        console.log(chalk.cyan("  i18n-auto batch         # 批量扫描项目"));
        console.log(chalk.cyan("  i18n-auto generate      # 生成语言包"));
        console.log(chalk.cyan("  i18n-auto config        # 修改配置"));
    }
    catch (error) {
        console.error(chalk.red("初始化失败："), error);
        process.exit(1);
    }
}
async function promptForConfig() {
    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "i18nFilePath",
            message: "i18n 文件路径：",
            default: config_1.defaultConfig.i18nFilePath,
        },
        {
            type: "input",
            name: "i18nImportPath",
            message: "i18n 导入路径：",
            default: config_1.defaultConfig.i18nImportPath,
        },
        {
            type: "input",
            name: "templateI18nCall",
            message: "模板中的 i18n 调用方法：",
            default: config_1.defaultConfig.templateI18nCall,
        },
        {
            type: "input",
            name: "scriptI18nCall",
            message: "脚本中的 i18n 调用方法：",
            default: config_1.defaultConfig.scriptI18nCall,
        },
        {
            type: "confirm",
            name: "autoImportI18n",
            message: "是否自动导入 i18n？",
            default: config_1.defaultConfig.autoImportI18n,
        },
        {
            type: "confirm",
            name: "freeGoogle",
            message: "是否启用免费谷歌翻译？",
            default: config_1.defaultConfig.freeGoogle,
        },
    ]);
    return { ...config_1.defaultConfig, ...answers };
}
async function createProjectStructure(config) {
    const rootPath = (0, config_1.getRootPath)();
    const i18nPath = path.join(rootPath, config.i18nFilePath);
    const localePath = path.join(i18nPath, "locale");
    // 创建 i18n 目录
    if (!fs.existsSync(i18nPath)) {
        fs.mkdirSync(i18nPath, { recursive: true });
    }
    // 创建 locale 目录
    if (!fs.existsSync(localePath)) {
        fs.mkdirSync(localePath, { recursive: true });
    }
    // 创建示例语言文件
    const zhPath = path.join(localePath, "zh.json");
    if (!fs.existsSync(zhPath)) {
        fs.writeFileSync(zhPath, JSON.stringify({}, null, 2));
    }
    const enPath = path.join(localePath, "en.json");
    if (!fs.existsSync(enPath)) {
        fs.writeFileSync(enPath, JSON.stringify({}, null, 2));
    }
}
//# sourceMappingURL=init.js.map