const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;
const prettier = require("prettier");
const { readConfig, resolveI18nPath } = require("../utils/config");

// 中文字符正则表达式
const CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/;

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
          await processJavaScriptFile(content, config, ext, filePath));
        break;
      case ".vue":
        ({ content: processedContent, changes: changeCount } =
          await processVueFile(content, config, filePath));
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

async function processJavaScriptFile(content, config, ext, filePath) {
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
            replacement: replacement,
            key: key,
            value: value,
          });

          changes++;
        }
      },

      TemplateLiteral(nodePath) {
        const { quasis, expressions } = nodePath.node;
        // 完全静态模板字符串，直接整体替换
        if (expressions.length === 0 && quasis.length === 1) {
          const rawValue = quasis[0].value.raw;
          if (shouldProcessString(rawValue, config)) {
            const key = generateI18nKey(rawValue, config);
            const replacement = `${config.scriptI18nCall}('${key}')`;
            replacements.push({
              start: nodePath.node.start,
              end: nodePath.node.end,
              replacement,
              key,
              value: rawValue,
            });
            changes++;
          }
          return;
        }
        // 含表达式：仅记录静态段到语言包
        quasis.forEach((quasi) => {
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
        // 交给 Prettier 依据 filepath 自动推断解析器，提升 TSX/JSX 兼容性
        const prettierFilepath =
          filePath && !String(filePath).endsWith(".vue")
            ? filePath
            : `__virtual__${ext}`;
        processedContent = await prettier.format(processedContent, {
          filepath: prettierFilepath,
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

async function processVueFile(content, config, filePath) {
  let changes = 0;
  let processedContent = content;

  try {
    // 使用 Vue 编译器解析 SFC
    const { parse } = require("@vue/compiler-sfc");
    const { descriptor } = parse(content);

    // 处理 template 部分
    if (descriptor.template) {
      const templateContent = descriptor.template.content;
      let processedTemplate = processVueTemplate(templateContent, config);

      if (processedTemplate.changes > 0) {
        processedContent = processedContent.replace(
          templateContent,
          processedTemplate.content
        );
        changes += processedTemplate.changes;
      }
    }

    // 处理 script 部分
    if (descriptor.script) {
      const lang = descriptor.script.lang === "ts" ? ".ts" : ".js";
      const scriptResult = await processJavaScriptFile(
        descriptor.script.content,
        config,
        lang,
        filePath
      );
      if (scriptResult.changes > 0) {
        processedContent = processedContent.replace(
          descriptor.script.content,
          scriptResult.content
        );
        changes += scriptResult.changes;
      }
    }

    if (descriptor.scriptSetup) {
      const langSetup = descriptor.scriptSetup.lang === "ts" ? ".ts" : ".js";
      const scriptSetupResult = await processJavaScriptFile(
        descriptor.scriptSetup.content,
        config,
        langSetup,
        filePath
      );
      if (scriptSetupResult.changes > 0) {
        processedContent = processedContent.replace(
          descriptor.scriptSetup.content,
          scriptSetupResult.content
        );
        changes += scriptSetupResult.changes;
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
  // 生成 md5 hash
  const hash = require("crypto")
    .createHash("md5")
    .update(text)
    .digest("hex")
    .substring(0, 8);

  // 使用 i18n-auto 开头，便于宣传我们的CLI工具
  return `i18n-auto-${hash}`;
}

function updateLanguagePackage(key, value, config) {
  try {
    const zhDir = resolveI18nPath("locale");
    const zhPath = resolveI18nPath("locale", "zh.json");

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

function processVueTemplate(templateContent, config) {
  let processedTemplate = templateContent;
  let changes = 0;

  // 匹配属性值中的中文字符串
  // 例如: title="中文标题" 或 :title="'中文标题'"
  const attributeRegex =
    /(\s+)([a-zA-Z-]+)(=["'])([^"']*[\u4e00-\u9fff\u3400-\u4dbf][^"']*)(["'])/g;

  // 匹配文本内容中的中文字符串
  // 例如: >中文文本< 或 > 中文文本 <
  const textContentRegex =
    /(>)(\s*[^<]*[\u4e00-\u9fff\u3400-\u4dbf][^<]*\s*)(<)/g;

  const replacements = [];

  // 处理属性值中的中文
  let match;
  while ((match = attributeRegex.exec(templateContent)) !== null) {
    const [fullMatch, space, attrName, equalQuote, chineseText, closeQuote] =
      match;

    if (shouldProcessString(chineseText, config)) {
      const key = generateI18nKey(chineseText, config);

      // 检查属性名是否已经有冒号前缀
      const hasColon = attrName.startsWith(":");
      const cleanAttrName = hasColon ? attrName.slice(1) : attrName;

      // 生成替换文本，确保有冒号前缀
      const replacement = `${space}:${cleanAttrName}="${config.templateI18nCall}('${key}')"`;

      replacements.push({
        start: match.index,
        end: match.index + fullMatch.length,
        replacement: replacement,
        key: key,
        value: chineseText,
      });

      changes++;
    }
  }

  // 处理文本内容中的中文
  while ((match = textContentRegex.exec(templateContent)) !== null) {
    const [fullMatch, openBracket, chineseText, closeBracket] = match;
    const trimmedText = chineseText.trim();

    if (shouldProcessString(trimmedText, config)) {
      const key = generateI18nKey(trimmedText, config);

      // 检查是否已经在插值表达式中
      const beforeMatch = templateContent.slice(0, match.index);
      const inInterpolation =
        beforeMatch.lastIndexOf("{{") > beforeMatch.lastIndexOf("}}");

      if (!inInterpolation) {
        const replacement = `${openBracket}{{ ${config.templateI18nCall}('${key}') }}${closeBracket}`;

        replacements.push({
          start: match.index,
          end: match.index + fullMatch.length,
          replacement: replacement,
          key: key,
          value: trimmedText,
        });

        changes++;
      }
    }
  }

  // 应用替换（从后往前，避免位置偏移）
  replacements.sort((a, b) => b.start - a.start);

  for (const replacement of replacements) {
    processedTemplate =
      processedTemplate.slice(0, replacement.start) +
      replacement.replacement +
      processedTemplate.slice(replacement.end);

    // 更新语言包
    updateLanguagePackage(replacement.key, replacement.value, config);
  }

  return { content: processedTemplate, changes };
}

module.exports = {
  processFile,
};
