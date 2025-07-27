import i18n from '@/i18n';
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { processFile } = require('../lib/core/processor');

// 测试配置
const testConfig = {
  testDir: path.join(__dirname, 'fixtures', 'test-files'),
  outputDir: path.join(__dirname, 'output'),
  expectedDir: path.join(__dirname, 'expected'),
};

// 确保输出目录存在
if (!fs.existsSync(testConfig.outputDir)) {
  fs.mkdirSync(testConfig.outputDir, { recursive: true });
}

// 测试文件列表
const testFiles = [
  'js-test.js',
  'react-test.jsx',
  'vue-test.vue',
  'ts-test.ts',
  'tsx-test.tsx',
];

async function runTests() {
  console.log(
    chalk.blue.bold(i18n.global.t('key_开始运行i18n处理器测试_668564c4'))
  );
  console.log('='.repeat(50));

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const fileName of testFiles) {
    console.log(chalk.cyan(`\n📁 测试文件: ${fileName}`));

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
      fs.copyFileSync(inputFile, outputFile);

      console.log(
        chalk.gray(`   原始文件大小: ${fs.statSync(inputFile).size} bytes`)
      );

      // 处理文件
      const result = await processFile(outputFile);

      totalTests++;

      if (result.success) {
        console.log(chalk.green(`   ✅ 处理成功`));
        console.log(chalk.green(`   🔄 替换了 ${result.changes} 个中文字符串`));

        if (result.changes > 0) {
          const outputContent = fs.readFileSync(outputFile, 'utf8');
          console.log(
            chalk.gray(`   处理后文件大小: ${outputContent.length} bytes`)
          );

          // 检查是否包含中文
          const remainingChinese = (
            outputContent.match(/[\u4e00-\u9fff]/g) || []
          ).length;
          if (remainingChinese > 0) {
            console.log(
              chalk.yellow(`   ⚠️  仍有 ${remainingChinese} 个中文字符未处理`)
            );
          } else {
            console.log(chalk.green(`   ✨ 所有中文字符已成功处理`));
          }
        }

        passedTests++;
      } else {
        console.log(chalk.red(`   ❌ 处理失败`));
        result.errors.forEach((error) => {
          console.log(chalk.red(`      ${error}`));
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
  console.log('\n' + '='.repeat(50));
  console.log(chalk.blue.bold(i18n.global.t('key_测试结果摘要_43fadef1')));
  console.log(`总测试数: ${totalTests}`);
  console.log(chalk.green(`通过: ${passedTests}`));
  console.log(chalk.red(`失败: ${failedTests}`));
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log(chalk.green.bold(i18n.global.t('key_所有测试通过_333d759f')));
  } else {
    console.log(
      chalk.red.bold(i18n.global.t('key_有测试失败请检查上述错误信息_e4d7beba'))
    );
  }

  // 生成语言包检查
  await checkLanguagePackage();
}

async function checkLanguagePackage() {
  console.log(chalk.blue(i18n.global.t('key_检查生成的语言包_9e00c0d9')));

  const zhPath = path.join(process.cwd(), 'src', 'i18n', 'locale', 'zh.json');

  if (fs.existsSync(zhPath)) {
    const zhData = JSON.parse(fs.readFileSync(zhPath, 'utf8'));
    const keyCount = Object.keys(zhData).length;

    console.log(chalk.green(`✅ 中文语言包存在`));
    console.log(chalk.green(`📝 包含 ${keyCount} 个翻译键`));

    if (keyCount > 0) {
      console.log(chalk.gray(i18n.global.t('key_前5个翻译键_92c342e4')));
      Object.entries(zhData)
        .slice(0, 5)
        .forEach(([key, value]) => {
          console.log(chalk.gray(`   ${key}: ${value}`));
        });
    }
  } else {
    console.log(chalk.yellow(`⚠️  中文语言包不存在: ${zhPath}`));
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch((error) => {
    console.error(
      chalk.red(i18n.global.t('key_测试运行器出错_6bf93e32')),
      error
    );
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testConfig,
};
