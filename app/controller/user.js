'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {
  async register() {
    const { ctx } = this;
    const { username, password } = ctx.request.body;

    // 判空操作
    if (!username || !password) {
      ctx.body = {
        code: 500,
        msg: '账号密码不能为空',
        data: null,
      };
      return;
    }

    // 判断数据库中是否有该账户名
    const userInfo = await ctx.service.user.getUserByName(username);

    // 判断是否已经存在
    if (userInfo && userInfo.id) {
      ctx.body = {
        code: 500,
        msg: '账户名已被注册，请重新输入',
        data: null,
      };
      return;
    }

    // 默认头像
    const defaultAvatar = 'http://s.yezgea02.com/1615973940679/WeChat77d6d2ac093e247c361f0b8a7aeb6c2a.png';
    // 调用service方法，将数据存入数据库
    const result = await ctx.service.user.register({
      username,
      password,
      signature: '默认个性签名',
      avatar: defaultAvatar,
    });

    if (result) {
      ctx.body = {
        code: 200,
        msg: '注册成功',
        data: null,
      };
    } else {
      ctx.body = {
        code: 500,
        msg: '注册失败',
        data: null,
      };
    }
  }

  async login() {
    const { ctx, app } = this;
    const { username, password } = ctx.request.body;

    // 根据用户名在数据库里查找响应的id
    const userInfo = await ctx.service.user.getUserByName(username);
    // 没找到说明没有该用户
    if (!userInfo || !userInfo.id) {
      ctx.body = {
        code: 500,
        msg: '账号不存在',
        data: null,
      };
      return;
    }

    if (userInfo && password !== userInfo.password) {
      ctx.body = {
        code: 500,
        msg: '账号密码错误',
        data: null,
      };
      return;
    }

    // 签名+密钥生成token,用户id+name+到期时间加密形成token
    const token = app.jwt.sign({
      id: userInfo.id,
      username: userInfo.username,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // token有效期为24小时
    }, app.config.jwt.secret);

    ctx.body = {
      code: 200,
      message: '登陆成功',
      data: {
        token,
      },
    };
  }

  // 验证方法
  async test() {
    const { ctx, app } = this;
    // 通过token解析,拿到user_id
    const token = ctx.request.header.authorization;
    // 通过app.jwt.verify+加密字符串 解析出token的值
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    // 响应接口
    ctx.body = {
      code: 200,
      message: '获取成功',
      data: {
        ...decode,
      },
    };
  }

  async getUserInfo() {
    const defaultAvatar = 'http://s.yezgea02.com/1615973940679/WeChat77d6d2ac093e247c361f0b8a7aeb6c2a.png';
    const { ctx, app } = this;
    const token = ctx.request.header.authorization;
    // 通过app.jwt.verify方法，解析出token内的用户信息
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    // 以username为参数，从数据库获取用户名下的相关信息
    const userInfo = await ctx.service.user.getUserByName(decode.username);
    // userInfo中需要返回的相关信息
    const { id, username, signature, avatar } = userInfo;
    ctx.body = {
      code: 200,
      msg: '请求成功',
      data: {
        id,
        username,
        signature: signature || '',
        avatar: avatar || defaultAvatar,
      },
    };
  }

  async editUserInfo() {
    const { ctx, app } = this;

    // 通过post请求，在请求体中获取签名字段signature
    const { signature = '', avatar = '' } = ctx.request.body;

    try {
      const token = ctx.request.header.authorization;

      // 解密token中的用户名称
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.id;
      const userInfo = await ctx.service.user.getUserByName(decode.username);

      await ctx.service.user.editUserInfo({
        ...userInfo,
        signature,
        avatar,
      });

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          id: user_id,
          signature,
          username: userInfo.username,
          avatar,
        },
      };
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async modifyPass() {
    const { ctx, app } = this;
    const { old_pass = '', new_pass = '', new_pass2 = '' } = ctx.request.body;

    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      if (decode.username === 'admin') {
        ctx.body = {
          code: 400,
          msg: '管理员账户，不允许修改密码！',
          data: null,
        };
        return;
      }

      const userInfo = await ctx.service.user.getUserByName(decode.username);

      if (old_pass !== userInfo.password) {
        ctx.body = {
          code: 400,
          msg: '原密码错误',
          data: null,
        };
        return;
      }

      if (new_pass !== new_pass2) {
        ctx.body = {
          code: 400,
          msg: '新密码不一致',
          data: null,
        };
        return;
      }

      await ctx.service.user.modifyPass({
        ...userInfo,
        password: new_pass,
      });

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }
}

module.exports = UserController;
