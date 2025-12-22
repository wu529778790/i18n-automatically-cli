const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");
const { readConfig, getRootPath, resolveI18nPath } = require("../utils/config");

// 动态导入 inquirer
async function getInquirer() {
  const inquirer = await import("inquirer");
  return inquirer.default;
}

async function generateCommand(options = {}) {
  try {
    const config = readConfig();
    const zhPath = resolveI18nPath("locale", "zh.json");

    // 检查中文语言包是否存在
    if (!fs.existsSync(zhPath)) {
      console.error(
        chalk.red(
          `在 ${config.i18nFilePath}/locale/ 文件夹下面未找到 zh.json 语言包文件`
        )
      );
      console.log(
        chalk.yellow('请先运行 "i18n-auto scan" 或 "i18n-auto batch" 扫描中文')
      );
      process.exit(1);
    }

    // 读取中文语言包
    const zhData = JSON.parse(fs.readFileSync(zhPath, "utf8"));
    const chineseTexts = Object.values(zhData);

    if (chineseTexts.length === 0) {
      console.log(chalk.yellow("中文语言包为空，无需生成其他语言包"));
      return;
    }

    console.log(
      chalk.blue(`📦 找到 ${chineseTexts.length} 个待翻译的中文文本`)
    );

    // 确定目标语言
    const targetLanguages = options.languages || ["en"];
    console.log(chalk.blue(`🌍 目标语言: ${targetLanguages.join(", ")}`));

    // 如果不需要翻译，只生成模板
    if (options.translate === false) {
      for (const lang of targetLanguages) {
        await generateLanguageTemplate(lang, zhData, config);
      }
      console.log(chalk.green("✅ 语言包模板生成完成！"));
      return;
    }

    // 选择翻译服务
    const translateService = await selectTranslateService(
      options.service,
      config
    );

    if (!translateService) {
      console.log(chalk.yellow("取消翻译，仅生成模板"));
      for (const lang of targetLanguages) {
        await generateLanguageTemplate(lang, zhData, config);
      }
      return;
    }

    // 开始翻译
    const spinner = ora("正在翻译...").start();

    try {
      for (const lang of targetLanguages) {
        spinner.text = `正在翻译到 ${lang}...`;
        await generateTranslatedLanguagePack(
          lang,
          zhData,
          translateService,
          config
        );
      }

      spinner.succeed(chalk.green("✅ 语言包生成完成！"));
      console.log(
        chalk.gray(
          `生成路径: ${path.join(getRootPath(), config.i18nFilePath, "locale")}`
        )
      );
    } catch (error) {
      spinner.fail(chalk.red("❌ 翻译失败"));
      console.error(chalk.red(error));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red("生成语言包失败："), error);
    process.exit(1);
  }
}

async function selectTranslateService(preferredService, config) {
  // 检查可用的翻译服务
  const availableServices = [];

  if (config.freeGoogle) {
    availableServices.push({ label: "免费谷歌翻译", value: "google" });
  }

  if (config.baidu && config.baidu.appid && config.baidu.secretKey) {
    availableServices.push({ label: "百度翻译", value: "baidu" });
  }

  if (config.deepl && config.deepl.authKey) {
    availableServices.push({ label: "DeepL 翻译", value: "deepl" });
  }

  if (availableServices.length === 0) {
    console.error(chalk.red("未配置任何翻译服务"));
    console.log(chalk.yellow('请运行 "i18n-auto config" 配置翻译服务'));
    return null;
  }

  // 如果指定了服务，检查是否可用
  if (preferredService) {
    const service = availableServices.find((s) => s.value === preferredService);
    if (service) {
      return preferredService;
    } else {
      console.log(chalk.yellow(`指定的翻译服务 "${preferredService}" 不可用`));
    }
  }

  // 交互式选择翻译服务
  const inquirer = await getInquirer();
  const { service } = await inquirer.prompt([
    {
      type: "list",
      name: "service",
      message: "选择翻译服务:",
      choices: [
        ...availableServices,
        { label: "跳过翻译，仅生成模板", value: "skip" },
      ],
    },
  ]);

  return service === "skip" ? null : service;
}

async function generateLanguageTemplate(language, zhData, config) {
  const langPath = resolveI18nPath("locale", `${language}.json`);

  // 生成空模板
  const template = {};
  for (const key of Object.keys(zhData)) {
    template[key] = "";
  }

  fs.writeFileSync(langPath, JSON.stringify(template, null, 2));
  console.log(chalk.gray(`  ✓ ${language}.json 模板已生成`));
}

async function generateTranslatedLanguagePack(
  language,
  zhData,
  service,
  config
) {
  const langPath = resolveI18nPath("locale", `${language}.json`);

  // 检查是否已存在语言包
  let existingData = {};
  if (fs.existsSync(langPath)) {
    existingData = JSON.parse(fs.readFileSync(langPath, "utf8"));
  }

  const translatedData = {};
  const textsToTranslate = [];

  // 收集需要翻译的文本
  for (const [key, text] of Object.entries(zhData)) {
    if (existingData[key] && existingData[key].trim()) {
      // 如果已存在翻译，保留原翻译
      translatedData[key] = existingData[key];
    } else {
      // 需要翻译
      textsToTranslate.push({ key, text });
    }
  }

  if (textsToTranslate.length === 0) {
    console.log(chalk.gray(`  ✓ ${language}.json 无需更新`));
    return;
  }

  console.log(
    chalk.gray(`  ⏳ 翻译 ${textsToTranslate.length} 个文本到 ${language}...`)
  );

  // 批量翻译
  const BATCH_SIZE = 20;
  for (let i = 0; i < textsToTranslate.length; i += BATCH_SIZE) {
    const batch = textsToTranslate.slice(i, i + BATCH_SIZE);
    const translations = await translateBatch(
      batch.map((item) => item.text),
      service,
      language,
      config
    );

    for (let j = 0; j < batch.length; j++) {
      translatedData[batch[j].key] = translations[j] || batch[j].text;
    }

    // 添加延迟以避免API限制
    if (i + BATCH_SIZE < textsToTranslate.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // 保存翻译结果
  fs.writeFileSync(langPath, JSON.stringify(translatedData, null, 2));
  console.log(chalk.gray(`  ✓ ${language}.json 已生成/更新`));
}

async function translateBatch(texts, service, targetLang, config) {
  try {
    switch (service) {
      case "google":
        return await translateWithGoogle(texts, targetLang);
      case "baidu":
        return await translateWithBaidu(texts, targetLang, config.baidu);
      case "deepl":
        return await translateWithDeepL(texts, targetLang, config.deepl);
      default:
        throw new Error(`不支持的翻译服务: ${service}`);
    }
  } catch (error) {
    console.error(chalk.yellow(`翻译失败，使用原文: ${error}`));
    return texts; // 翻译失败时返回原文
  }
}

async function translateWithGoogle(texts, targetLang) {
  const { translate } = require("@vitalets/google-translate-api");
  const results = await Promise.all(
    texts.map((text) => translate(text, { to: targetLang }))
  );
  return results.map((result) => result.text);
}

async function translateWithBaidu(texts, targetLang, baiduConfig) {
  // 检查是否配置了百度翻译凭据
  if (!baiduConfig || !baiduConfig.appid || !baiduConfig.secretKey) {
    throw new Error("百度翻译未正确配置：缺少 appid 或 secretKey");
  }

  // 这里需要实现百度翻译API调用
  console.log(chalk.yellow("百度翻译功能待实现"));
  return texts; // 暂时返回原文
}

async function translateWithDeepL(texts, targetLang, deeplConfig) {
  // 检查是否配置了DeepL凭据
  if (!deeplConfig || !deeplConfig.authKey) {
    throw new Error("DeepL翻译未正确配置：缺少 authKey");
  }

  // 这里需要实现DeepL翻译API调用
  console.log(chalk.yellow("DeepL翻译功能待实现"));
  return texts; // 暂时返回原文
}

module.exports = {
  generateCommand,
};
