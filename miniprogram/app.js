const { getEnvironment } = require('./config/env');

App({
  globalData: { healthCheck: null },
  onLaunch() {
    const config = getEnvironment();
    if (config.transport === 'cloudContainer' && config.cloudEnv) {
      wx.cloud.init({ env: config.cloudEnv, traceUser: true });
      this.globalData.healthCheck = wx.cloud.callContainer({
        config: { env: config.cloudEnv },
        path: '/api/health',
        method: 'GET',
        header: { 'X-WX-SERVICE': config.serviceName },
      }).then((response) => {
        if (response.statusCode !== 200 || !response.data || response.data.status !== 'ok') {
          throw new Error('travel-api 健康检查失败');
        }
        console.info('travel-api health check passed', response.data);
        return response.data;
      }).catch((error) => {
        console.error('travel-api health check failed', error);
        return null;
      });
    }
  },
});
