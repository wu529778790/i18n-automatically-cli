#!/usr/bin/env node
"use strict";
const { Command } = require("commander");
const chalk = require("chalk");
const { scanCommand } = require("./commands/scan");
const { scanBatchCommand } = require("./commands/scan-batch");
const { generateCommand } = require("./commands/generate");
const { switchCommand } = require("./commands/switch");
const { configCommand } = require("./commands/config");
const { initCommand } = require("./commands/init");
const program = new Command();
program
    .name("i18n-auto")
    .description("国际化多语言自动生成替换CLI工具")
    .version("1.0.0");
// 初始化配置
program.command("init").description("初始化项目国际化配置").action(initCommand);
// 配置设置
program
    .command("config")
    .description("打开或创建配置文件")
    .option("-p, --path <path>", "指定配置文件路径")
    .action(configCommand);
// 扫描单个文件
program
    .command("scan [filePath]")
    .description("扫描指定文件或当前目录中的中文")
    .option("-f, --file <file>", "指定要扫描的文件路径")
    .action(scanCommand);
// 批量扫描
program
    .command("scan:batch")
    .alias("batch")
    .description("批量扫描项目中的中文")
    .option("-d, --dir <directory>", "指定要扫描的目录", ".")
    .option("-e, --exclude <patterns...>", "排除的文件或目录模式")
    .action(scanBatchCommand);
// 生成语言包
program
    .command("generate")
    .alias("gen")
    .description("生成多语言包")
    .option("-s, --service <service>", "翻译服务 (baidu|deepl|google)", "google")
    .option("-l, --languages <langs...>", "目标语言列表", ["en"])
    .option("--no-translate", "不进行翻译，仅生成模板")
    .action(generateCommand);
// 切换语言
program
    .command("switch <language>")
    .description("切换项目语言")
    .action(switchCommand);
// 错误处理
program.on("command:*", () => {
    console.error(chalk.red(`Invalid command: ${program.args.join(" ")}`));
    console.log(chalk.yellow("See --help for a list of available commands."));
    process.exit(1);
});
// 解析命令行参数
program.parse();
// 如果没有提供任何命令，显示帮助
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=cli.js.map