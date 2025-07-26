"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configCommand = configCommand;
const child_process_1 = require("child_process");
const chalk = require("chalk");
const config_1 = require("../utils/config");
async function configCommand(options) {
    try {
        const configPath = options.path || (0, config_1.getConfigPath)();
        // 确保配置文件存在
        (0, config_1.ensureConfigExists)();
        console.log(chalk.blue(`正在打开配置文件: ${configPath}`));
        // 尝试用默认编辑器打开配置文件
        await openFileInEditor(configPath);
    }
    catch (error) {
        console.error(chalk.red("打开配置文件失败："), error);
        process.exit(1);
    }
}
function openFileInEditor(filePath) {
    return new Promise((resolve, reject) => {
        // 根据操作系统选择合适的编辑器
        let command;
        let args;
        if (process.platform === "win32") {
            command = "notepad";
            args = [filePath];
        }
        else if (process.platform === "darwin") {
            command = "open";
            args = ["-t", filePath];
        }
        else {
            // Linux/Unix
            const editor = process.env.EDITOR || "nano";
            command = editor;
            args = [filePath];
        }
        const child = (0, child_process_1.spawn)(command, args, {
            stdio: "inherit",
            detached: true,
        });
        child.on("error", (error) => {
            console.log(chalk.yellow("无法打开默认编辑器，请手动编辑配置文件："));
            console.log(chalk.cyan(filePath));
            resolve();
        });
        child.on("close", () => {
            resolve();
        });
        // 对于某些编辑器，立即解析
        if (process.platform === "darwin" || process.platform === "win32") {
            setTimeout(() => {
                resolve();
            }, 1000);
        }
    });
}
//# sourceMappingURL=config.js.map