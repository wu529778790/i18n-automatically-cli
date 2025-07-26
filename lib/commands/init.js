const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");
const { defaultConfig, writeConfig, getRootPath } = require("../utils/config");

// 动态导入 inquirer
async function getInquirer() {
  const inquirer = await import("inquirer");
  return inquirer.default;
}

async function initCommand() {
  console.log(chalk.blue.bold("🚀 欢迎使用 i18n-automatically CLI"));
  console.log(chalk.gray("正在初始化项目国际化配置..."));

  try {
    // 检查是否已存在配置文件
    const configPath = path.join(
      getRootPath(),
      "automatically-i18n-config.json"
    );
    if (fs.existsSync(configPath)) {
      const inquirer = await getInquirer();
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
    writeConfig(config);

    console.log(chalk.green.bold("✅ 初始化完成！"));
    console.log(chalk.gray("你可以运行以下命令开始使用："));
    console.log(chalk.cyan("  i18n-auto scan          # 扫描单个文件"));
    console.log(chalk.cyan("  i18n-auto batch         # 批量扫描项目"));
    console.log(chalk.cyan("  i18n-auto generate      # 生成语言包"));
    console.log(chalk.cyan("  i18n-auto config        # 修改配置"));
  } catch (error) {
    console.error(chalk.red("初始化失败："), error);
    process.exit(1);
  }
}

async function promptForConfig() {
  const inquirer = await getInquirer();
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "i18nFilePath",
      message: "i18n 文件路径：",
      default: defaultConfig.i18nFilePath,
    },
    {
      type: "input",
      name: "i18nImportPath",
      message: "i18n 导入路径：",
      default: defaultConfig.i18nImportPath,
    },
    {
      type: "input",
      name: "templateI18nCall",
      message: "模板中的 i18n 调用方法：",
      default: defaultConfig.templateI18nCall,
    },
    {
      type: "input",
      name: "scriptI18nCall",
      message: "脚本中的 i18n 调用方法：",
      default: defaultConfig.scriptI18nCall,
    },
    {
      type: "confirm",
      name: "autoImportI18n",
      message: "是否自动导入 i18n？",
      default: defaultConfig.autoImportI18n,
    },
    {
      type: "confirm",
      name: "freeGoogle",
      message: "是否启用免费谷歌翻译？",
      default: defaultConfig.freeGoogle,
    },
  ]);

  return { ...defaultConfig, ...answers };
}

async function createProjectStructure(config) {
  const rootPath = getRootPath();
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

module.exports = {
  initCommand,
};
