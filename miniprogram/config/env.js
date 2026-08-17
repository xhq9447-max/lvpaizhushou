const environments = {
  develop: { transport: 'https', apiBaseUrl: '', cloudEnv: '', serviceName: '' },
  trial: { transport: 'cloudContainer', apiBaseUrl: '', cloudEnv: '', serviceName: '' },
  release: { transport: 'cloudContainer', apiBaseUrl: '', cloudEnv: '', serviceName: '' },
};

function getEnvironment() {
  const account = wx.getAccountInfoSync();
  const version = account.miniProgram.envVersion || 'develop';
  const config = environments[version];
  return { ...config, apiBaseUrl: wx.getStorageSync('apiBaseUrl') || config.apiBaseUrl };
}

module.exports = { getEnvironment };
