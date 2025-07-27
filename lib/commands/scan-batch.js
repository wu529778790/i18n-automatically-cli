const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");
const { processFile } = require("../core/processor");
const { ensureConfigExists, readConfig } = require("../utils/config");

// 动态导入 inquirer
async function getInquirer() {
  const inquirer = await import("inquirer");
  return inquirer.default;
}

async function scanBatchCommand(options = {}) {
  try {
    // 确保配置文件存在
    ensureConfigExists();
    const config = readConfig();

    let targetDir;

    // 如果没有指定目录，让用户选择
    if (!options.dir || options.dir === ".") {
      targetDir = await selectTargetDirectory();
    } else {
      targetDir = path.resolve(options.dir);
    }

    const excludePatterns = options.exclude || [];

    console.log(chalk.blue(`🔍 开始批量扫描目录: ${targetDir}`));

    if (!fs.existsSync(targetDir)) {
      console.error(chalk.red(`目录不存在: ${targetDir}`));
      process.exit(1);
    }

    const spinner = ora("正在扫描文件...").start();

    try {
      const files = getFilesToProcess(
        targetDir,
        config.excludedExtensions,
        excludePatterns
      );

      if (files.length === 0) {
        spinner.warn(chalk.yellow("未找到需要处理的文件"));
        return;
      }

      spinner.text = `找到 ${files.length} 个文件，开始处理...`;

      // 显示将要处理的文件列表
      console.log(chalk.gray("\n将要处理的文件类型:"));
      const filesByExt = groupFilesByExtension(files);
      Object.entries(filesByExt).forEach(([ext, count]) => {
        console.log(chalk.gray(`  ${ext}: ${count} 个文件`));
      });

      let shouldContinue = true;

      // 如果没有指定 --yes 选项，询问用户是否继续
      if (!options.yes) {
        const inquirer = await getInquirer();
        const response = await inquirer.prompt([
          {
            type: "confirm",
            name: "shouldContinue",
            message: `确认要处理这 ${files.length} 个文件吗？`,
            default: true,
          },
        ]);
        shouldContinue = response.shouldContinue;
      } else {
        console.log(
          chalk.cyan(`💫 使用 --yes 选项，自动确认处理 ${files.length} 个文件`)
        );
      }

      if (!shouldContinue) {
        spinner.info(chalk.yellow("用户取消操作"));
        return;
      }

      let totalChanges = 0;
      let processedFiles = 0;
      let errorFiles = 0;
      const errors = [];

      console.log(chalk.blue(`\n🚀 开始处理文件...`));

      for (const file of files) {
        const relativePath = path.relative(targetDir, file);
        spinner.text = `处理中 (${processedFiles + 1}/${files.length}): ${relativePath}`;

        try {
          const result = await processFile(file);

          if (result.success) {
            totalChanges += result.changes;
            processedFiles++;

            // 显示处理结果
            if (result.changes > 0) {
              console.log(
                chalk.green(`  ✓ ${relativePath} (${result.changes} 处修改)`)
              );
            } else {
              console.log(chalk.gray(`  - ${relativePath} (无需修改)`));
            }
          } else {
            errorFiles++;
            errors.push(`${file}: ${result.errors.join(", ")}`);
            console.log(chalk.red(`  ✗ ${relativePath} (处理失败)`));
          }
        } catch (error) {
          errorFiles++;
          errors.push(`${file}: ${error}`);
          console.log(
            chalk.red(`  ✗ ${relativePath} (异常: ${error.message})`)
          );
        }
      }

      if (errorFiles > 0) {
        spinner.fail(
          chalk.yellow(`⚠️  批量扫描完成，但有 ${errorFiles} 个文件处理失败`)
        );
        console.log(chalk.green(`✅ 成功处理: ${processedFiles} 个文件`));
        console.log(chalk.green(`🔄 总共替换: ${totalChanges} 个中文字符串`));
        console.log(chalk.red(`❌ 失败文件: ${errorFiles} 个`));

        if (errors.length > 0) {
          console.log(chalk.red("\n错误详情:"));
          errors.forEach((error) => {
            console.log(chalk.red(`  ${error}`));
          });
        }
      } else {
        spinner.succeed(chalk.green(`✅ 批量扫描完成！`));
        console.log(chalk.green(`📁 处理文件: ${processedFiles} 个`));
        console.log(chalk.green(`🔄 总共替换: ${totalChanges} 个中文字符串`));
      }

      if (totalChanges > 0) {
        console.log(
          chalk.cyan('\n💡 提示: 运行 "i18n-auto generate" 来生成多语言包')
        );
      }
    } catch (error) {
      spinner.fail(chalk.red("❌ 批量扫描过程中出现错误"));
      console.error(chalk.red(error));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red("批量扫描命令执行失败："), error);
    process.exit(1);
  }
}

async function selectTargetDirectory() {
  const currentDir = process.cwd();
  const availableDirs = getSubDirectories(currentDir);

  if (availableDirs.length === 0) {
    console.log(chalk.yellow("当前目录下没有子目录，将扫描当前目录"));
    return currentDir;
  }

  const inquirer = await getInquirer();
  const choices = [
    { name: ". (当前目录)", value: currentDir },
    ...availableDirs.map((dir) => ({
      name: `${dir}/`,
      value: path.join(currentDir, dir),
    })),
    { name: "📝 手动输入路径", value: "custom" },
  ];

  const { selectedDir } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedDir",
      message: "选择要扫描的目录:",
      choices,
      pageSize: 10,
    },
  ]);

  if (selectedDir === "custom") {
    const { customPath } = await inquirer.prompt([
      {
        type: "input",
        name: "customPath",
        message: "请输入目录路径:",
        validate: (input) => {
          const resolvedPath = path.resolve(input);
          if (!fs.existsSync(resolvedPath)) {
            return "路径不存在，请重新输入";
          }
          if (!fs.statSync(resolvedPath).isDirectory()) {
            return "请输入有效的目录路径";
          }
          return true;
        },
      },
    ]);
    return path.resolve(customPath);
  }

  return selectedDir;
}

function getSubDirectories(dir) {
  try {
    const items = fs.readdirSync(dir);
    const directories = [];

    for (const item of items) {
      const fullPath = path.join(dir, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !shouldSkipDirectory(item)) {
          directories.push(item);
        }
      } catch (error) {
        // 忽略无法访问的目录
        continue;
      }
    }

    return directories.sort();
  } catch (error) {
    return [];
  }
}

function groupFilesByExtension(files) {
  const groups = {};
  files.forEach((file) => {
    const ext = path.extname(file) || "无扩展名";
    groups[ext] = (groups[ext] || 0) + 1;
  });
  return groups;
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
      } else if (stat.isFile()) {
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
    "vendor",
    ".idea",
    ".vscode",
    "logs",
    "public",
    "static",
  ];

  return skipDirs.includes(dirName) || dirName.startsWith(".");
}

module.exports = {
  scanBatchCommand,
};
