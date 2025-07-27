const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;
const prettier = require("prettier");
const { readConfig } = require("../utils/config");

// 中文字符正则表达式
const CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/;
const FULL_CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]+/g;

async function processFile(filePath) {
  const config = readConfig();
  const result = {
    success: false,
    changes: 0,
    errors: [],
  };

  try {
    if (!fs.existsSync(filePath)) {
      result.errors.push(`文件不存在: ${filePath}`);
      return result;
    }

    const ext = path.extname(filePath).toLowerCase();

    // 检查文件扩展名是否被排除
    if (config.excludedExtensions.includes(ext)) {
      result.errors.push(`文件类型被排除: ${ext}`);
      return result;
    }

    const content = fs.readFileSync(filePath, "utf8");

    let processedContent;
    let changeCount = 0;

    switch (ext) {
      case ".js":
      case ".jsx":
      case ".ts":
      case ".tsx":
        ({ content: processedContent, changes: changeCount } =
          await processJavaScriptFile(content, config, ext));
        break;
      case ".vue":
        ({ content: processedContent, changes: changeCount } =
          await processVueFile(content, config));
        break;
      default:
        result.errors.push(`不支持的文件类型: ${ext}`);
        return result;
    }

    if (changeCount > 0) {
      fs.writeFileSync(filePath, processedContent);
      result.changes = changeCount;
      result.success = true;
    } else {
      result.success = true;
    }

    return result;
  } catch (error) {
    result.errors.push(`处理文件失败: ${error.message}`);
    return result;
  }
}

async function processJavaScriptFile(content, config, ext) {
  let changes = 0;
  let hasI18nImport = false;
  let processedContent = content;

  try {
    // 配置 Babel 解析器
    const plugins = ["jsx"];
    if (ext === ".ts" || ext === ".tsx") {
      plugins.push("typescript");
    }
    plugins.push("decorators-legacy");

    const ast = parser.parse(content, {
      sourceType: "module",
      plugins,
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
    });

    // 收集需要替换的字符串位置和内容
    const replacements = [];

    // 检查是否已有 i18n 导入
    traverse(ast, {
      ImportDeclaration(nodePath) {
        if (nodePath.node.source.value === config.i18nImportPath) {
          hasI18nImport = true;
        }
      },
    });

    // 遍历 AST 并收集中文字符串
    traverse(ast, {
      StringLiteral(nodePath) {
        const value = nodePath.node.value;
        if (shouldProcessString(value, config)) {
          const key = generateI18nKey(value, config);
          const replacement = `${config.scriptI18nCall}('${key}')`;

          replacements.push({
            start: nodePath.node.start,
            end: nodePath.node.end,
            original: nodePath.node.raw,
            replacement: replacement,
            key: key,
            value: value,
          });

          changes++;
        }
      },

      TemplateLiteral(nodePath) {
        // 处理模板字符串中的静态中文部分
        nodePath.node.quasis.forEach((quasi, index) => {
          const rawValue = quasi.value.raw;
          if (shouldProcessString(rawValue, config)) {
            const key = generateI18nKey(rawValue, config);
            updateLanguagePackage(key, rawValue, config);
            changes++;
          }
        });
      },
    });

    // 应用字符串替换（从后往前，避免位置偏移）
    replacements.sort((a, b) => b.start - a.start);

    for (const replacement of replacements) {
      processedContent =
        processedContent.slice(0, replacement.start) +
        replacement.replacement +
        processedContent.slice(replacement.end);

      // 更新语言包
      updateLanguagePackage(replacement.key, replacement.value, config);
    }

    // 如果有修改且需要自动导入 i18n
    if (changes > 0 && config.autoImportI18n && !hasI18nImport) {
      const importStatement = `import i18n from '${config.i18nImportPath}';\n`;
      processedContent = importStatement + processedContent;
    }

    // 格式化代码
    if (changes > 0) {
      try {
        const parserType =
          ext === ".ts" || ext === ".tsx" ? "typescript" : "babel";
        processedContent = await prettier.format(processedContent, {
          parser: parserType,
          semi: true,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: "es5",
        });
      } catch (formatError) {
        // 如果格式化失败，使用原始处理结果
        console.warn(
          "代码格式化失败，使用未格式化的结果:",
          formatError.message
        );
      }
    }

    return { content: processedContent, changes };
  } catch (error) {
    console.error("处理 JavaScript 文件失败:", error);
    return { content, changes: 0 };
  }
}

async function processVueFile(content, config) {
  let changes = 0;
  let processedContent = content;

  try {
    // 使用 Vue 编译器解析 SFC
    const { parse } = require("@vue/compiler-sfc");
    const { descriptor } = parse(content);

    // 处理 template 部分
    if (descriptor.template) {
      const templateContent = descriptor.template.content;
      let processedTemplate = templateContent;

      // 查找模板中的中文文本
      const chineseMatches = Array.from(
        templateContent.matchAll(FULL_CHINESE_REGEX)
      );

      if (chineseMatches.length > 0) {
        // 从后往前替换，避免位置偏移
        chineseMatches.reverse().forEach((match) => {
          const chineseText = match[0];
          if (shouldProcessString(chineseText, config)) {
            const key = generateI18nKey(chineseText, config);
            const replacement = `{{ ${config.templateI18nCall}('${key}') }}`;

            // 检查是否已经在插值表达式中
            const beforeMatch = templateContent.slice(0, match.index);
            const afterMatch = templateContent.slice(
              match.index + chineseText.length
            );

            // 简单检查：如果前面有 {{ 且后面有 }}，可能已经在插值中
            const inInterpolation =
              beforeMatch.lastIndexOf("{{") > beforeMatch.lastIndexOf("}}") ||
              (afterMatch.indexOf("}}") < afterMatch.indexOf("{{") &&
                afterMatch.indexOf("}}") !== -1);

            if (!inInterpolation) {
              processedTemplate =
                processedTemplate.slice(0, match.index) +
                replacement +
                processedTemplate.slice(match.index + chineseText.length);

              updateLanguagePackage(key, chineseText, config);
              changes++;
            }
          }
        });
      }

      if (changes > 0) {
        processedContent = processedContent.replace(
          templateContent,
          processedTemplate
        );
      }
    }

    // 处理 script 部分
    if (descriptor.script || descriptor.scriptSetup) {
      const scriptDescriptor = descriptor.script || descriptor.scriptSetup;
      const scriptResult = await processJavaScriptFile(
        scriptDescriptor.content,
        config,
        ".js"
      );

      if (scriptResult.changes > 0) {
        processedContent = processedContent.replace(
          scriptDescriptor.content,
          scriptResult.content
        );
        changes += scriptResult.changes;
      }
    }

    return { content: processedContent, changes };
  } catch (error) {
    console.error("处理 Vue 文件失败:", error);
    return { content, changes: 0 };
  }
}

function shouldProcessString(text, config) {
  if (!text || typeof text !== "string") return false;

  // 检查是否包含中文
  if (!CHINESE_REGEX.test(text)) return false;

  // 检查是否在排除列表中
  if (config.excludedStrings.includes(text.trim())) return false;

  // 过滤掉纯符号或很短的字符串
  const cleanText = text.trim();
  if (cleanText.length < 1) return false;

  // 检查是否是单个字符的标点符号或数字
  if (
    cleanText.length === 1 &&
    /[，。、！？；：""''（）【】《》「」『』\d]/.test(cleanText)
  ) {
    return false;
  }

  return true;
}

function generateI18nKey(text, config) {
  // 清理文本，保留中文、英文、数字
  const cleanText = text
    .replace(/[^\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/g, "")
    .substring(0, 20);

  // 如果清理后的文本为空，使用原文的前几个字符
  const keyBase = cleanText || text.substring(0, 10);

  // 生成 hash
  const hash = require("crypto")
    .createHash("md5")
    .update(text)
    .digest("hex")
    .substring(0, 8);

  return `key_${keyBase}_${hash}`;
}

function updateLanguagePackage(key, value, config) {
  try {
    const zhDir = path.join(
      process.cwd(),
      config.i18nFilePath.replace(/^\//, ""),
      "locale"
    );
    const zhPath = path.join(zhDir, "zh.json");

    // 确保目录存在
    if (!fs.existsSync(zhDir)) {
      fs.mkdirSync(zhDir, { recursive: true });
    }

    let zhData = {};
    if (fs.existsSync(zhPath)) {
      const content = fs.readFileSync(zhPath, "utf8");
      try {
        zhData = JSON.parse(content);
      } catch (parseError) {
        console.warn("解析现有语言包失败，创建新的语言包");
        zhData = {};
      }
    }

    // 添加新的翻译键值对
    zhData[key] = value;

    // 写入文件
    fs.writeFileSync(zhPath, JSON.stringify(zhData, null, 2), "utf8");
  } catch (error) {
    console.error("更新语言包失败:", error);
  }
}

module.exports = {
  processFile,
};
