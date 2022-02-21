/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1636635513416_1960';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    uploadDir: 'app/public/upload',
  };

  config.security = {
    csrf: {
      enable: false,
      ignoreJSON: true,
    },
    domainWhiteList: [ '*' ],
  };

  // view文件夹下的.html文件识别为.ejs
  config.view = {
    mapping: { '.html': 'ejs' },
  };

  config.mysql = {
    client: {
      // host
      host: 'localhost',
      // 端口号
      port: '3306',
      // 用户名
      user: 'root',
      // 密码
      password: 'root',
      // 数据库名
      database: 'userinfo',
    },
    app: true,
    agent: false,
  };

  // jwt密钥
  config.jwt = {
    secret: 'Peng',
  };

  config.multipart = {
    mode: 'file',
  };

  config.cors = {
    origin: '*', // 允许所有跨域访问
    credentials: true,
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  };
  return {
    ...config,
    ...userConfig,
  };
};
