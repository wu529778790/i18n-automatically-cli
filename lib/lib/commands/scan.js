"use strict";
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");
const { processFile } = require("../core/processor");
const { ensureConfigExists } = require("../utils/config");
async function scanCommand(filePath, options = {}) {
    try {
        // 确保配置文件存在
        ensureConfigExists();
        const targetFile = filePath || options.file;
        if (!targetFile) {
            console.error(chalk.red("请指定要扫描的文件路径"));
            console.log(chalk.yellow("用法: i18n-auto scan <filePath>"));
            console.log(chalk.yellow("或者: i18n-auto scan --file <filePath>"));
            process.exit(1);
        }
        const resolvedPath = path.resolve(targetFile);
        const spinner = ora(`正在扫描文件: ${resolvedPath}`).start();
        try {
            const result = await processFile(resolvedPath);
            if (result.success) {
                if (result.changes > 0) {
                    spinner.succeed(chalk.green(`✅ 扫描完成！找到并替换了 ${result.changes} 个中文字符串`));
                    console.log(chalk.gray(`文件: ${resolvedPath}`));
                }
                else {
                    spinner.succeed(chalk.blue("✅ 扫描完成！未发现需要替换的中文字符串"));
                }
            }
            else {
                spinner.fail(chalk.red("❌ 扫描失败"));
                result.errors.forEach((error) => {
                    console.error(chalk.red(`  ${error}`));
                });
                process.exit(1);
            }
        }
        catch (error) {
            spinner.fail(chalk.red("❌ 扫描过程中出现错误"));
            console.error(chalk.red(error));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk.red("扫描命令执行失败："), error);
        process.exit(1);
    }
}
module.exports = {
    scanCommand,
};
//# sourceMappingURL=scan.js.map