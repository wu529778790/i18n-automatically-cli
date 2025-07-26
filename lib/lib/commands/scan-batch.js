"use strict";
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");
const { processFile } = require("../core/processor");
const { ensureConfigExists, readConfig } = require("../utils/config");
async function scanBatchCommand(options = {}) {
    try {
        // 确保配置文件存在
        ensureConfigExists();
        const config = readConfig();
        const targetDir = path.resolve(options.dir || ".");
        const excludePatterns = options.exclude || [];
        console.log(chalk.blue(`🔍 开始批量扫描目录: ${targetDir}`));
        if (!fs.existsSync(targetDir)) {
            console.error(chalk.red(`目录不存在: ${targetDir}`));
            process.exit(1);
        }
        const spinner = ora("正在扫描文件...").start();
        try {
            const files = getFilesToProcess(targetDir, config.excludedExtensions, excludePatterns);
            if (files.length === 0) {
                spinner.warn(chalk.yellow("未找到需要处理的文件"));
                return;
            }
            spinner.text = `找到 ${files.length} 个文件，开始处理...`;
            let totalChanges = 0;
            let processedFiles = 0;
            let errorFiles = 0;
            const errors = [];
            for (const file of files) {
                spinner.text = `处理中 (${processedFiles + 1}/${files.length}): ${path.relative(targetDir, file)}`;
                try {
                    const result = await processFile(file);
                    if (result.success) {
                        totalChanges += result.changes;
                        processedFiles++;
                    }
                    else {
                        errorFiles++;
                        errors.push(`${file}: ${result.errors.join(", ")}`);
                    }
                }
                catch (error) {
                    errorFiles++;
                    errors.push(`${file}: ${error}`);
                }
            }
            if (errorFiles > 0) {
                spinner.fail(chalk.yellow(`⚠️  批量扫描完成，但有 ${errorFiles} 个文件处理失败`));
                console.log(chalk.green(`✅ 成功处理: ${processedFiles} 个文件`));
                console.log(chalk.green(`🔄 总共替换: ${totalChanges} 个中文字符串`));
                console.log(chalk.red(`❌ 失败文件: ${errorFiles} 个`));
                if (errors.length > 0) {
                    console.log(chalk.red("\n错误详情:"));
                    errors.forEach((error) => {
                        console.log(chalk.red(`  ${error}`));
                    });
                }
            }
            else {
                spinner.succeed(chalk.green(`✅ 批量扫描完成！`));
                console.log(chalk.green(`📁 处理文件: ${processedFiles} 个`));
                console.log(chalk.green(`🔄 总共替换: ${totalChanges} 个中文字符串`));
            }
            if (totalChanges > 0) {
                console.log(chalk.cyan('\n💡 提示: 运行 "i18n-auto generate" 来生成多语言包'));
            }
        }
        catch (error) {
            spinner.fail(chalk.red("❌ 批量扫描过程中出现错误"));
            console.error(chalk.red(error));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk.red("批量扫描命令执行失败："), error);
        process.exit(1);
    }
}
function getFilesToProcess(dir, excludedExtensions, excludePatterns) {
    const files = [];
    function walkDir(currentDir) {
        const items = fs.readdirSync(currentDir);
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                // 跳过常见的忽略目录
                if (shouldSkipDirectory(item)) {
                    continue;
                }
                // 检查是否匹配排除模式
                if (excludePatterns.some((pattern) => item.includes(pattern))) {
                    continue;
                }
                walkDir(fullPath);
            }
            else if (stat.isFile()) {
                const ext = path.extname(fullPath);
                // 检查文件扩展名
                if (excludedExtensions.includes(ext)) {
                    continue;
                }
                // 只处理支持的文件类型
                if ([".js", ".jsx", ".ts", ".tsx", ".vue"].includes(ext)) {
                    // 检查是否匹配排除模式
                    if (!excludePatterns.some((pattern) => fullPath.includes(pattern))) {
                        files.push(fullPath);
                    }
                }
            }
        }
    }
    walkDir(dir);
    return files;
}
function shouldSkipDirectory(dirName) {
    const skipDirs = [
        "node_modules",
        ".git",
        ".svn",
        ".hg",
        ".DS_Store",
        "dist",
        "build",
        "coverage",
        ".nyc_output",
        ".next",
        ".nuxt",
        "out",
        "temp",
        "tmp",
    ];
    return skipDirs.includes(dirName) || dirName.startsWith(".");
}
module.exports = {
    scanBatchCommand,
};
//# sourceMappingURL=scan-batch.js.map