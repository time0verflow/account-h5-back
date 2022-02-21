'use strict';

const Service = require('egg').Service;

class UserService extends Service {

  async getUserByName(username) {
    try {
      const result = await this.app.mysql.get('user', { username });
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async register(params) {
    try {
      const result = await this.app.mysql.insert('user', params);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async editUserInfo(params) {
    const { app } = this;
    try {
      const result = await app.mysql.update('user', {
        ...params,
      }, {
        id: params.id, // 筛选出id等于params.id的用户
      });
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async modifyPass(params) {
    const { app } = this;
    try {
      const result = await app.mysql.update('user', {
        ...params,
      }, {
        id: params.id,
      });
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}


module.exports = UserService;
