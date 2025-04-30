// worker-service云对象
const db = uniCloud.database();
const dbCmd = db.command;

module.exports = {
  _before: async function () {
    // 通用前置处理
    this.startTime = Date.now();
  },

  /**
   * 获取工人列表
   * @param {String} keyword - 搜索关键词
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @returns {Object} 包含工人列表和分页信息
   */
  async getWorkerList(params) {
    const { keyword = '', page = 1, pageSize = 20 } = params;
    const workersCollection = db.collection('workers');
    
    // 构建查询条件
    let whereCondition = {};
    if (keyword) {
      whereCondition.name = new RegExp(keyword, 'i');
    }
    
    // 计算总数
    const countResult = await workersCollection.where(whereCondition).count();
    const total = countResult.total;
    
    // 查询数据
    const list = await workersCollection
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
      .then(res => res.data);
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        list,
        total,
        page,
        pageSize
      }
    };
  },

  /**
   * 添加/修改工人基本信息
   * @param {String} _id - 工人ID，有则修改，无则新增
   * @param {String} name - 工人姓名
   * @param {String} phone - 联系电话
   * @param {String} remark - 备注
   * @returns {Object} 保存后的工人信息
   */
  async saveWorker(params) {
    const { _id, name, phone, remark } = params;
    
    // 参数校验
    if (!name) {
      return {
        code: -1,
        message: '工人姓名不能为空'
      };
    }
    
    // 手机号格式校验（如果有提供）
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      return {
        code: -1,
        message: '手机号码格式不正确'
      };
    }
    
    const workersCollection = db.collection('workers');
    const now = new Date();
    
    // 新增或修改
    if (_id) {
      // 修改
      const updateData = {
        name,
        updateTime: now
      };
      
      if (phone !== undefined) updateData.phone = phone;
      if (remark !== undefined) updateData.remark = remark;
      
      await workersCollection.doc(_id).update(updateData);
      
      // 查询更新后的完整数据
      const updatedData = await workersCollection.doc(_id).get().then(res => res.data[0]);
      
      return {
        code: 0,
        message: '更新成功',
        data: updatedData
      };
    } else {
      // 新增
      const insertData = {
        name,
        createTime: now,
        updateTime: now
      };
      
      if (phone) insertData.phone = phone;
      if (remark) insertData.remark = remark;
      
      const insertResult = await workersCollection.add(insertData);
      
      // 查询新增后的完整数据
      const newData = await workersCollection.doc(insertResult.id).get().then(res => res.data[0]);
      
      return {
        code: 0,
        message: '添加成功',
        data: newData
      };
    }
  },

  /**
   * 删除工人
   * @param {String} workerId - 工人ID
   * @returns {Object} 操作结果
   */
  async deleteWorker(params) {
    const { workerId } = params;
    
    if (!workerId) {
      return {
        code: -1,
        message: '工人ID不能为空'
      };
    }
    
    // 使用事务处理
    const transaction = await db.startTransaction();
    try {
      // 1. 检查工人是否关联了工地
      const siteWorkerCount = await transaction.collection('site_worker')
        .where({ workerId })
        .count()
        .then(res => res.total);
      
      if (siteWorkerCount > 0) {
        await transaction.rollback();
        return {
          code: -1,
          message: `该工人关联了${siteWorkerCount}个工地，请先移除关联关系再删除`
        };
      }
      
      // 2. 检查工人是否有工时记录
      const workHourCount = await transaction.collection('work_hours')
        .where({ workerId })
        .count()
        .then(res => res.total);
      
      if (workHourCount > 0) {
        await transaction.rollback();
        return {
          code: -1,
          message: `该工人有${workHourCount}条工时记录，无法删除`
        };
      }
      
      // 3. 删除工人
      await transaction.collection('workers').doc(workerId).remove();
      
      // 提交事务
      await transaction.commit();
      
      return {
        code: 0,
        message: '删除成功'
      };
    } catch (error) {
      await transaction.rollback();
      console.error('[deleteWorker error]', error);
      return {
        code: -1,
        message: '删除失败：' + error.message
      };
    }
  },

  /**
   * 获取工人详细信息
   * @param {String} workerId - 工人ID
   * @returns {Object} 工人详细信息
   */
  async getWorkerDetail(params) {
    const { workerId } = params;
    
    if (!workerId) {
      return {
        code: -1,
        message: '工人ID不能为空'
      };
    }
    
    const workerInfo = await db.collection('workers')
      .doc(workerId)
      .get()
      .then(res => res.data[0]);
    
    if (!workerInfo) {
      return {
        code: -1,
        message: '工人不存在'
      };
    }
    
    return {
      code: 0,
      message: '获取成功',
      data: workerInfo
    };
  }
}; 