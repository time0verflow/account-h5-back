'use strict';

const Service = require('egg').Service;

class HomeService extends Service {
  async user() {
    const { app } = this;
    const QUERY_STR = 'id,name';
    const sql = `select ${QUERY_STR} from list`;
    try {
      const result = await app.mysql.query(sql);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async addUser(name) {
    try {
      const result = await this.app.mysql.insert('list', { name });
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async editUser(id, name) {
    try {
      const result = await this.app.mysql.update('list', { name }, {
        where: {
          id,
        },
      });
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async deleteUser(id) {
    try {
      const result = await this.app.mysql.delete('list', { id });
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = HomeService;
