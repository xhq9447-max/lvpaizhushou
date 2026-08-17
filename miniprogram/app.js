const { getEnvironment } = require('./config/env');

App({
  onLaunch() {
    const config = getEnvironment();
    if (config.transport === 'cloudContainer' && config.cloudEnv) {
      wx.cloud.init({ env: config.cloudEnv, traceUser: true });
    }
  },
});
