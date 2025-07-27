import i18n from '@/i18n';
// JavaScript 测试文件
function greetUser(name) {
  const greeting = i18n.global.t('key_你好_7eca689f');
  const message = `${greeting}，${name}！欢迎使用我们的应用`;

  console.log(i18n.global.t('key_系统启动中_afc09f06'));
  console.log(message);

  return {
    title: i18n.global.t('key_主页_b04ec75c'),
    description: i18n.global.t('key_这是一个测试应用_d342ce56'),
    status: i18n.global.t('key_成功_330363df'),
    data: {
      userName: name,
      message: i18n.global.t('key_登录成功_71fa3bd0'),
    },
  };
}

const config = {
  appName: i18n.global.t('key_测试应用_00153eee'),
  version: '1.0.0',
  features: [
    i18n.global.t('key_多语言支持_013a6abf'),
    i18n.global.t('key_自动翻译_0cc23eb3'),
    i18n.global.t('key_批量处理_ba7290ac'),
  ],
};

export default greetUser;
