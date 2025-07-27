const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { processFile } = require("../lib/core/processor");

// 测试配置
const testConfig = {
  testDir: path.join(__dirname, "fixtures", "test-files"),
  outputDir: path.join(__dirname, "output"),
  tempDir: path.join(__dirname, "temp"),
};

// 确保输出目录存在
function ensureTestDirs() {
  [testConfig.outputDir, testConfig.tempDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// 测试文件列表
const testFiles = [
  "js-test.js",
  "react-test.jsx",
  "vue-test.vue",
  "ts-test.ts",
  "tsx-test.tsx",
];

async function runTests() {
  console.log(chalk.blue.bold("🧪 i18n-auto CLI 扫描替换测试"));
  console.log(chalk.gray("测试范围：扫描中文字符串并替换为i18n调用"));
  console.log("=".repeat(60));

  ensureTestDirs();

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let totalReplacements = 0;

  for (const fileName of testFiles) {
    console.log(chalk.cyan(`\n📄 测试文件: ${fileName}`));

    const inputFile = path.join(testConfig.testDir, fileName);
    const outputFile = path.join(testConfig.outputDir, fileName);

    if (!fs.existsSync(inputFile)) {
      console.log(chalk.red(`❌ 输入文件不存在: ${inputFile}`));
      failedTests++;
      totalTests++;
      continue;
    }

    try {
      // 复制输入文件到输出目录
      const originalContent = fs.readFileSync(inputFile, "utf8");
      fs.copyFileSync(inputFile, outputFile);

      const originalSize = originalContent.length;
      const originalChinese = (originalContent.match(/[\u4e00-\u9fff]/g) || [])
        .length;

      console.log(
        chalk.gray(
          `   📊 原始文件: ${originalSize} bytes, ${originalChinese} 个中文字符`
        )
      );

      // 处理文件
      const result = await processFile(outputFile);

      totalTests++;

      if (result.success) {
        const processedContent = fs.readFileSync(outputFile, "utf8");
        const processedSize = processedContent.length;
        const remainingChinese = (
          processedContent.match(/[\u4e00-\u9fff]/g) || []
        ).length;
        const i18nCalls = (
          processedContent.match(/i18n-auto-[a-f0-9]{8}/g) || []
        ).length;

        console.log(chalk.green(`   ✅ 处理成功`));
        console.log(chalk.green(`   🔄 替换了 ${result.changes} 个中文字符串`));
        console.log(chalk.green(`   🎯 生成了 ${i18nCalls} 个 i18n-auto key`));
        console.log(
          chalk.gray(
            `   📈 处理后: ${processedSize} bytes, ${remainingChinese} 个中文字符`
          )
        );

        // 验证替换是否正确
        if (result.changes > 0) {
          if (i18nCalls !== result.changes) {
            console.log(
              chalk.yellow(`   ⚠️  警告: 替换数量与生成的key数量不匹配`)
            );
          }

          // 检查是否包含正确的i18n-auto前缀
          if (processedContent.includes("i18n-auto-")) {
            console.log(chalk.green(`   ✨ 正确使用了 i18n-auto 前缀`));
          } else {
            console.log(chalk.red(`   ❌ 未找到 i18n-auto 前缀`));
          }
        }

        totalReplacements += result.changes;
        passedTests++;
      } else {
        console.log(chalk.red(`   ❌ 处理失败`));
        result.errors.forEach((error) => {
          console.log(chalk.red(`      💥 ${error}`));
        });
        failedTests++;
      }
    } catch (error) {
      console.log(chalk.red(`   ❌ 测试异常: ${error.message}`));
      failedTests++;
      totalTests++;
    }
  }

  // 测试摘要
  console.log("\n" + "=".repeat(60));
  console.log(chalk.blue.bold("📊 测试结果摘要"));
  console.log(`📁 总测试文件: ${totalTests}`);
  console.log(chalk.green(`✅ 测试通过: ${passedTests}`));
  console.log(chalk.red(`❌ 测试失败: ${failedTests}`));
  console.log(chalk.cyan(`🔄 总替换数: ${totalReplacements} 个中文字符串`));
  console.log(`📈 成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  // 检查生成的语言包
  await checkLanguagePackage();

  if (failedTests === 0) {
    console.log(chalk.green.bold("\n🎉 所有测试通过！CLI 扫描替换功能正常"));
    process.exit(0);
  } else {
    console.log(chalk.red.bold("\n❌ 有测试失败，请检查上述错误信息"));
    process.exit(1);
  }
}

async function checkLanguagePackage() {
  console.log(chalk.blue("\n🌍 检查生成的语言包..."));

  const zhPath = path.join(process.cwd(), "src", "i18n", "locale", "zh.json");

  if (fs.existsSync(zhPath)) {
    const zhData = JSON.parse(fs.readFileSync(zhPath, "utf8"));
    const keyCount = Object.keys(zhData).length;
    const i18nAutoKeys = Object.keys(zhData).filter((key) =>
      key.startsWith("i18n-auto-")
    ).length;

    console.log(chalk.green(`✅ 中文语言包存在: ${zhPath}`));
    console.log(chalk.green(`📝 包含 ${keyCount} 个翻译键`));
    console.log(chalk.green(`🎯 其中 ${i18nAutoKeys} 个使用 i18n-auto 前缀`));

    if (keyCount > 0) {
      console.log(chalk.gray("示例翻译键:"));
      const sampleKeys = Object.entries(zhData).slice(0, 3);
      sampleKeys.forEach(([key, value]) => {
        const prefix = key.startsWith("i18n-auto-") ? "✅" : "❓";
        console.log(chalk.gray(`   ${prefix} ${key}: ${value}`));
      });
    }
  } else {
    console.log(chalk.yellow(`⚠️  中文语言包不存在: ${zhPath}`));
    console.log(chalk.gray("   这可能是因为没有处理任何文件或配置问题"));
  }
}

// 清理测试数据
function cleanup() {
  console.log(chalk.gray("\n🧹 清理测试数据..."));
  try {
    if (fs.existsSync(testConfig.outputDir)) {
      fs.rmSync(testConfig.outputDir, { recursive: true, force: true });
    }
    if (fs.existsSync(testConfig.tempDir)) {
      fs.rmSync(testConfig.tempDir, { recursive: true, force: true });
    }
    const zhPath = path.join(process.cwd(), "src", "i18n");
    if (fs.existsSync(zhPath)) {
      fs.rmSync(zhPath, { recursive: true, force: true });
    }
    const configPath = path.join(
      process.cwd(),
      "automatically-i18n-config.json"
    );
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    console.log(chalk.gray("✅ 测试数据清理完成"));
  } catch (error) {
    console.log(chalk.yellow(`⚠️  清理失败: ${error.message}`));
  }
}

// 运行测试
if (require.main === module) {
  // 捕获退出信号，确保清理
  process.on("SIGINT", () => {
    console.log(chalk.yellow("\n⚠️  测试被中断，正在清理..."));
    cleanup();
    process.exit(1);
  });

  process.on("exit", () => {
    cleanup();
  });

  runTests().catch((error) => {
    console.error(chalk.red("测试运行器出错:"), error);
    cleanup();
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testConfig,
  cleanup,
};
