'use strict';

const Controller = require('egg').Controller;

function dateFormat(fmt, date) {
  let ret;
  const opt = {
    'Y+': date.getFullYear().toString(), // 年
    'm+': (date.getMonth() + 1).toString(), // 月
    'd+': date.getDate().toString(), // 日
    'H+': date.getHours().toString(), // 时
    'M+': date.getMinutes().toString(), // 分
    'S+': date.getSeconds().toString(), // 秒
    // 有其他格式化字符需求可以继续添加，必须转化成字符串
  };
  for (const k in opt) {
    ret = new RegExp('(' + k + ')').exec(fmt);
    if (ret) {
      fmt = fmt.replace(ret[1], (ret[1].length === 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, '0')));
    }
  }
  return fmt;
}

class BillController extends Controller {
  async add() {
    const { ctx, app } = this;
    const { amount, type_id, type_name, pay_type, remark = '' } = ctx.request.body;

    // 判空处理
    if (!amount || !type_id || !type_name || !pay_type) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
      return;
    }

    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.id;

      // user_id添加到每个账单项，作为后续获取用户指定账单的标识
      await ctx.service.bill.add({
        amount,
        type_id,
        type_name,
        pay_type,
        remark,
        user_id,
      });

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '请求失败',
        data: null,
      };
    }
  }

  async list() {
    const { ctx, app } = this;

    const { date, page = 1, page_size = 5, type_id = 'all' } = ctx.query;

    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.id;
      // 拿到当前用户账单列表
      const list = await ctx.service.bill.list(user_id);
      /*       console.log(list, 'list');
      console.log(Object.prototype.toString.call(list[0].date)); */
      // 过滤出月份和类型所对应的账单列表
      const _list = list.filter(item => {
        if (type_id !== 'all') {
          return dateFormat('YYYY-mm', item.date) === date && type_id === item.type_id;
        }
        return dateFormat('YYYY-mm', item.date) === date;
      });

      // 格式化数据，变成之前设置好的对象格式
      const listMap = _list.reduce((cur, item) => {

        // 将时间格式化为YYYY-MM-DD
        const date = dateFormat('YYYY-mm-dd', item.date);
        console.log(date);
        // 在当前数组将数据直接添加到bill项中
        if (cur && cur.length && cur.findIndex(item => item.date === date) > -1) {
          const index = cur.findIndex(item => item.date === date);
          cur[index].bills.push(item);
          // 所添加数组找不到日期项的，再建新项
        } else {
          cur.push({
            date,
            bills: [ item ],
          });
        }
        return cur;
      }, []);

      listMap.sort((a, b) => {
        if (a.date > b.date) return -1;
        return 1;
      });

      // 分页处理
      const filterListMap = listMap.slice((page - 1) * page_size, page * page_size);
      // 计算当月总收入和总支出
      const __list = list.filter(item => dateFormat('YYYY-mm', item.date) === date);
      // 计算累积支出
      const totalExpense = __list.reduce((cur, item) => {
        if (item.pay_type === '1') {
          cur += Number(item.amount);
        }
        return cur;
      }, 0);

      const totalIncome = __list.reduce((cur, item) => {
        if (item.pay_type === '2') {
          cur += Number(item.amount);
        }
        return cur;
      }, 0);

      // 返回数据
      ctx.body = {
        code: 200,
        msg: '获取成功',
        data: {
          totalExpense,
          totalIncome,
          totalPage: Math.ceil(listMap.length / page_size),
          list: filterListMap || [],
        },
      };
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: error,
      };
    }
  }

  async detail() {
    const { ctx, app } = this;
    // 获取账单id参数
    const { id = '' } = ctx.query;
    const token = ctx.request.header.authorization;
    // 获取用户信息
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    if (!decode) return;
    const user_id = decode.id;
    // 判断是否传入账单id
    if (!id) {
      ctx.body = {
        code: 500,
        msg: '订单id不能为空',
        data: null,
      };
      return;
    }

    try {
      const detail = await ctx.service.bill.detail(id, user_id);
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: detail,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }

  async update() {
    const { ctx, app } = this;
    const { id, amount, type_id, type_name, pay_type, remark = '', date = new Date() } = ctx.request.body;

    if (!amount || !type_id || !type_name || !pay_type) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
      return;
    }

    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.id;
      // 根据账单id和user_id，修改账单数据
      await ctx.service.bill.update({
        id,
        amount,
        type_id,
        type_name,
        date,
        pay_type,
        remark,
        user_id,
      });

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      };
      return;

    } catch (error) {
      console.log(error);
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }

  async delete() {
    const { ctx, app } = this;
    const { id } = ctx.request.body;

    if (!id) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
      return;
    }

    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.id;
      await ctx.service.bill.delete(id, user_id);

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

  async data() {
    const { ctx, app } = this;
    const { date = '' } = ctx.query;
    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.id;
      const result = await ctx.service.bill.list(user_id);
      const _data = result.filter(item => dateFormat('YYYY-mm', item.date) === date);

      // 计算累积支出
      const totalExpense = _data.reduce((acc, item) => {
        if (item.pay_type === '1') {
          acc += Number(item.amount);
        }
        return acc;
      }, 0);

      // 计算累计收入
      const totalIncome = _data.reduce((acc, item) => {
        if (item.pay_type === '2') {
          acc += Number(item.amount);
        }
        return acc;
      }, 0);

      const totalData = _data.reduce((acc, cur) => {
        const index = acc.findIndex(item => item.type_id === cur.type_id);
        if (index === -1) {
          const { type_id, type_name, pay_type } = cur;
          acc.push({
            type_id,
            type_name,
            pay_type,
            number: Number(cur.amount),
          });
        } else {
          acc[index].number += Number(cur.amount);
        }
        return acc;
      }, []);

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          totalExpense: Number(totalExpense).toFixed(2),
          totalIncome: Number(totalIncome).toFixed(2),
          totalData: totalData || [],
        },
      };
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }
}

module.exports = BillController;
