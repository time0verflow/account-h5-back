'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    await ctx.render('index.html', {
      title: '我是',
    });
  }

  async user() {
    const { ctx } = this;
    const result = await ctx.service.home.user();
    ctx.body = result;
  }

  async add() {
    const { ctx } = this;
    const { title } = ctx.request.body;

    ctx.body = {
      title,
    };
  }

  async addUser() {
    const { ctx } = this;
    const { name } = ctx.request.body;
    try {
      const result = await ctx.service.home.addUser(name);
      ctx.body = {
        code: 200,
        msg: '添加成功',
        data: result,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '添加失败',
        data: null,
      };
    }
  }

  async editUser() {
    const { ctx } = this;
    const { id, name } = ctx.request.body;
    try {
      const result = await ctx.service.home.editUser(id, name);
      ctx.body = {
        code: 200,
        msg: '添加成功',
        data: result,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '添加失败',
        data: null,
      };
    }
  }

  async deleteUser() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    try {
      const result = await ctx.service.home.deleteUser(id);
      ctx.body = {
        code: 200,
        msg: '删除成功',
        data: result,
      };
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: 500,
        msg: '删除失败',
        data: null,
      };
    }
  }
}

module.exports = HomeController;
