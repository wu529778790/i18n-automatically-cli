"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFile = processFile;
const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;
const prettier = require("prettier");
const { readConfig } = require("../utils/config");
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
        const ext = path.extname(filePath);
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
                    await processJavaScriptFile(content, config));
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
        }
        else {
            result.success = true;
        }
        return result;
    }
    catch (error) {
        result.errors.push(`处理文件失败: ${error}`);
        return result;
    }
}
async function processJavaScriptFile(content, config) {
    let changes = 0;
    let hasI18nImport = false;
    try {
        const ast = parser.parse(content, {
            sourceType: "module",
            plugins: ["jsx", "typescript", "decorators-legacy"],
        });
        // 检查是否已有 i18n 导入
        traverse(ast, {
            ImportDeclaration(nodePath) {
                if (nodePath.node.source.value === config.i18nImportPath) {
                    hasI18nImport = true;
                }
            },
        });
        // 遍历 AST 并替换中文字符串
        traverse(ast, {
            StringLiteral(nodePath) {
                const value = nodePath.node.value;
                if (CHINESE_REGEX.test(value) &&
                    !config.excludedStrings.includes(value)) {
                    const key = generateI18nKey(value, config);
                    // 替换字符串为 i18n 调用
                    const callExpression = parser.parseExpression(`${config.scriptI18nCall}('${key}')`);
                    nodePath.replaceWith(callExpression);
                    // 更新语言包
                    updateLanguagePackage(key, value, config);
                    changes++;
                }
            },
            TemplateLiteral(nodePath) {
                // 处理模板字符串中的中文
                nodePath.node.quasis.forEach((quasi, index) => {
                    if (CHINESE_REGEX.test(quasi.value.raw)) {
                        const key = generateI18nKey(quasi.value.raw, config);
                        // 这里需要更复杂的处理逻辑来替换模板字符串
                        updateLanguagePackage(key, quasi.value.raw, config);
                        changes++;
                    }
                });
            },
        });
        // 如果有修改且需要自动导入 i18n
        if (changes > 0 && config.autoImportI18n && !hasI18nImport) {
            const importStatement = parser.parse(`import i18n from '${config.i18nImportPath}';`);
            ast.body.unshift(importStatement.body[0]);
        }
        const output = generator(ast, {}, content);
        const formattedContent = await prettier.format(output.code, {
            parser: "babel",
        });
        return { content: formattedContent, changes };
    }
    catch (error) {
        console.error("处理 JavaScript 文件失败:", error);
        return { content, changes: 0 };
    }
}
async function processVueFile(content, config) {
    let changes = 0;
    try {
        // 使用 Vue 编译器解析 SFC
        const { parse } = require("@vue/compiler-sfc");
        const { descriptor } = parse(content);
        let processedContent = content;
        // 处理 template 部分
        if (descriptor.template) {
            const templateContent = descriptor.template.content;
            let processedTemplate = templateContent;
            // 简单的正则替换中文（这里可以进一步优化）
            const chineseMatches = templateContent.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/g);
            if (chineseMatches) {
                chineseMatches.forEach((match) => {
                    if (!config.excludedStrings.includes(match)) {
                        const key = generateI18nKey(match, config);
                        processedTemplate = processedTemplate.replace(new RegExp(match, "g"), `{{ ${config.templateI18nCall}('${key}') }}`);
                        updateLanguagePackage(key, match, config);
                        changes++;
                    }
                });
            }
            processedContent = processedContent.replace(templateContent, processedTemplate);
        }
        // 处理 script 部分
        if (descriptor.script) {
            const scriptResult = await processJavaScriptFile(descriptor.script.content, config);
            if (scriptResult.changes > 0) {
                processedContent = processedContent.replace(descriptor.script.content, scriptResult.content);
                changes += scriptResult.changes;
            }
        }
        return { content: processedContent, changes };
    }
    catch (error) {
        console.error("处理 Vue 文件失败:", error);
        return { content, changes: 0 };
    }
}
function generateI18nKey(text, config) {
    // 生成 i18n key 的逻辑
    const key = text
        .replace(/[^\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/g, "")
        .substring(0, 20);
    return `key_${Buffer.from(key)
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 8)}`;
}
function updateLanguagePackage(key, value, config) {
    try {
        const zhPath = path.join(process.cwd(), config.i18nFilePath, "locale", "zh.json");
        let zhData = {};
        if (fs.existsSync(zhPath)) {
            zhData = JSON.parse(fs.readFileSync(zhPath, "utf8"));
        }
        // 确保目录存在
        const dir = path.dirname(zhPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // 更新中文语言包
        zhData[key] = value;
        fs.writeFileSync(zhPath, JSON.stringify(zhData, null, 2));
    }
    catch (error) {
        console.error("更新语言包失败:", error);
    }
}
module.exports = {
    processFile,
};
//# sourceMappingURL=processor.js.map