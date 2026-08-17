const environments = {
  develop: { transport: 'cloudContainer', apiBaseUrl: '', cloudEnv: 'travel-prod-d3g22et6u30870d6a', serviceName: 'travel-api' },
  trial: { transport: 'cloudContainer', apiBaseUrl: '', cloudEnv: 'travel-prod-d3g22et6u30870d6a', serviceName: 'travel-api' },
  release: { transport: 'cloudContainer', apiBaseUrl: '', cloudEnv: 'travel-prod-d3g22et6u30870d6a', serviceName: 'travel-api' },
};

function getEnvironment() {
  const account = wx.getAccountInfoSync();
  const version = account.miniProgram.envVersion || 'develop';
  const config = environments[version];
  return { ...config, apiBaseUrl: wx.getStorageSync('apiBaseUrl') || config.apiBaseUrl };
}

module.exports = { getEnvironment };
