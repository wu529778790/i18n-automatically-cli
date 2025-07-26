# i18n-automatically CLI

🌍 国际化多语言自动生成替换CLI工具

一个强大的命令行工具，可以自动扫描您的项目中的中文文本，并将其替换为国际化调用，同时支持自动翻译生成多语言包。

> 目前还在测试阶段，建议先使用插件

vscode 插件：<https://github.com/wu529778790/i18n-automatically>

## 特性

- 🔍 **智能扫描**: 自动扫描 JavaScript、TypeScript、Vue 文件中的中文文本
- 🔄 **自动替换**: 将中文文本替换为 i18n 调用
- 🌐 **多语言生成**: 支持自动翻译生成多语言包
- 🛠 **灵活配置**: 支持自定义配置文件
- 📦 **批量处理**: 支持批量扫描和处理多个文件
- 🎯 **智能过滤**: 可配置排除特定文件类型和字符串

## 安装

```bash
npm install -g i18n-automatically-cli
```

## 快速开始

### 1. 初始化项目

```bash
cd your-project
i18n-auto init
```

这会创建配置文件和基本的目录结构。

### 2. 扫描单个文件

```bash
i18n-auto scan src/components/Header.vue
```

### 3. 批量扫描项目

```bash
i18n-auto batch
```

### 4. 生成多语言包

```bash
i18n-auto generate -l en ja ko
```

## 命令详解

### `i18n-auto init`

初始化项目国际化配置，会交互式地引导您完成配置。

```bash
i18n-auto init
```

### `i18n-auto config`

打开配置文件进行编辑。

```bash
i18n-auto config
```

### `i18n-auto scan [filePath]`

扫描指定文件中的中文并替换为 i18n 调用。

```bash
# 扫描指定文件
i18n-auto scan src/App.vue

# 使用选项指定文件
i18n-auto scan --file src/components/Button.tsx
```

### `i18n-auto scan:batch` (或 `i18n-auto batch`)

批量扫描项目中的文件。

```bash
# 扫描当前目录
i18n-auto batch

# 指定目录
i18n-auto batch --dir src/

# 排除特定模式
i18n-auto batch --exclude node_modules test
```

**选项:**

- `-d, --dir <directory>`: 指定要扫描的目录 (默认: 当前目录)
- `-e, --exclude <patterns...>`: 排除的文件或目录模式

### `i18n-auto generate` (或 `i18n-auto gen`)

生成多语言包，支持自动翻译。

```bash
# 生成英文语言包
i18n-auto generate

# 生成多个语言包
i18n-auto generate -l en ja ko es

# 使用指定翻译服务
i18n-auto generate -s baidu -l en

# 只生成模板，不翻译
i18n-auto generate --no-translate -l en
```

**选项:**

- `-s, --service <service>`: 翻译服务 (google|baidu|deepl, 默认: google)
- `-l, --languages <langs...>`: 目标语言列表 (默认: ['en'])
- `--no-translate`: 不进行翻译，仅生成模板

### `i18n-auto switch <language>`

切换并查看指定语言包的内容。

```bash
i18n-auto switch en
i18n-auto switch zh
```

## 配置文件

运行 `i18n-auto init` 后，会在项目根目录生成 `automatically-i18n-config.json` 配置文件：

```json
{
  "i18nFilePath": "/src/i18n",
  "autoImportI18n": true,
  "i18nImportPath": "@/i18n", 
  "templateI18nCall": "$t",
  "scriptI18nCall": "i18n.global.t",
  "keyFilePathLevel": 2,
  "excludedExtensions": [
    ".svg", ".png", ".jpg", ".jpeg", ".gif", 
    ".bmp", ".ico", ".md", ".txt", ".json",
    ".css", ".scss", ".less", ".sass", ".styl"
  ],
  "excludedStrings": [
    "宋体", "黑体", "楷体", "仿宋", "微软雅黑", 
    "华文", "方正", "苹方", "思源", "YYYY年MM月DD日"
  ],
  "debug": false,
  "freeGoogle": true,
  "baidu": {
    "appid": "",
    "secretKey": ""
  },
  "deepl": {
    "authKey": "",
    "isPro": false
  }
}
```

### 配置项说明

- `i18nFilePath`: i18n 文件存放路径
- `autoImportI18n`: 是否自动导入 i18n
- `i18nImportPath`: i18n 导入路径
- `templateI18nCall`: 模板中的 i18n 调用方法
- `scriptI18nCall`: 脚本中的 i18n 调用方法
- `excludedExtensions`: 排除的文件扩展名
- `excludedStrings`: 排除的字符串
- `freeGoogle`: 是否启用免费谷歌翻译
- `baidu`: 百度翻译配置
- `deepl`: DeepL 翻译配置

## 翻译服务配置

### 免费谷歌翻译 (默认)

无需配置，直接使用。

### 百度翻译

1. 在 [百度翻译开放平台](https://fanyi-api.baidu.com/) 注册账号
2. 创建应用获取 APP ID 和密钥
3. 在配置文件中填入：

```json
{
  "baidu": {
    "appid": "你的APP_ID",
    "secretKey": "你的密钥"
  }
}
```

### DeepL 翻译

1. 在 [DeepL API](https://www.deepl.com/pro-api) 注册账号
2. 获取 Auth Key
3. 在配置文件中填入：

```json
{
  "deepl": {
    "authKey": "你的Auth_Key",
    "isPro": false
  }
}
```

## 支持的文件类型

- JavaScript (`.js`)
- TypeScript (`.ts`)
- JSX (`.jsx`)
- TSX (`.tsx`)
- Vue (`.vue`)

## 目录结构

扫描后的项目结构：

```
your-project/
├── src/
│   └── i18n/
│       └── locale/
│           ├── zh.json    # 中文语言包
│           ├── en.json    # 英文语言包
│           └── ...        # 其他语言包
├── automatically-i18n-config.json
└── ...
```

## 示例

### 扫描前的代码

```javascript
// src/App.js
function App() {
  return (
    <div>
      <h1>欢迎使用我的应用</h1>
      <button>点击这里</button>
    </div>
  );
}
```

### 扫描后的代码

```javascript
// src/App.js
import i18n from '@/i18n';

function App() {
  return (
    <div>
      <h1>{i18n.global.t('key_6K+Y6L+O')}</h1>
      <button>{i18n.global.t('key_54K55Lik')}</button>
    </div>
  );
}
```

### 生成的语言包

```json
// src/i18n/locale/zh.json
{
  "key_6K+Y6L+O": "欢迎使用我的应用",
  "key_54K55Lik": "点击这里"
}

// src/i18n/locale/en.json  
{
  "key_6K+Y6L+O": "Welcome to my app",
  "key_54K55Lik": "Click here"
}
```

## 常见问题

### Q: 如何排除某些文件或目录？

A: 使用 `--exclude` 选项或在配置文件中设置 `excludedExtensions`。

### Q: 翻译质量不理想怎么办？

A: 可以手动编辑生成的语言包文件，或尝试不同的翻译服务。

### Q: 支持哪些语言代码？

A: 支持标准的 ISO 639-1 语言代码，如：en, zh, ja, ko, es, fr, de 等。

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0

- 初始版本发布
- 支持 JavaScript/TypeScript/Vue 文件扫描
- 支持多种翻译服务
- 支持批量处理
