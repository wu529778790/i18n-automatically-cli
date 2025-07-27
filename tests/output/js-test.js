import i18n from '@/i18n';
// JavaScript 测试文件
function greetUser(name) {
  const greeting = i18n.global.t(i18n.global.t('key_key你好7eca689f_b8652a7b'));
  const message = `${greeting}，${name}！欢迎使用我们的应用`;

  console.log(
    i18n.global.t(i18n.global.t('key_key系统启动中afc09f06_5beee5a9'))
  );
  console.log(message);

  return {
    title: i18n.global.t(i18n.global.t('key_key主页b04ec75c_42ebb172')),
    description: i18n.global.t(
      i18n.global.t('key_key这是一个测试应用d342ce56_d10d9b19')
    ),
    status: i18n.global.t(i18n.global.t('key_key成功330363df_7c347816')),
    data: {
      userName: name,
      message: i18n.global.t(i18n.global.t('key_key登录成功71fa3bd0_b18f49a7')),
    },
  };
}

const config = {
  appName: i18n.global.t(i18n.global.t('key_key测试应用00153eee_c1a65c15')),
  version: '1.0.0',
  features: [
    i18n.global.t(i18n.global.t('key_key多语言支持013a6abf_58d05656')),
    i18n.global.t(i18n.global.t('key_key自动翻译0cc23eb3_379d5374')),
    i18n.global.t(i18n.global.t('key_key批量处理ba7290ac_4d7e4ede')),
  ],
};

export default greetUser;
