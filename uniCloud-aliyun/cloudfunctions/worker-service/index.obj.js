// worker-service云对象
const db = uniCloud.database()
const dbCmd = db.command

module.exports = {
	_before: async function () {
		// 获取客户端信息和token
		const clientInfo = this.getClientInfo()
		const token = this.getUniIdToken()

		if (!token) {
			const err = new Error('用户未登录，请先登录')
			err.code = 401
			throw err
		}

		// 校验token
		const uniIDCommon = require('uni-id-common')
		const uniID = uniIDCommon.createInstance({
			clientInfo,
		})

		// 校验token
		const checkTokenRes = await uniID.checkToken(token)
		if (checkTokenRes.errCode) {
			const err = new Error('登录状态已过期，请重新登录')
			err.code = 403
			throw err
		}

		// 将用户ID存入上下文
		this.context = {
			uid: checkTokenRes.uid,
			role: checkTokenRes.role,
			permission: checkTokenRes.permission,
		}

		this.startTime = Date.now()
	},

	/**
	 * 获取工人列表
	 * @param {String} keyword - 搜索关键词
	 * @returns {Object} 包含工人列表
	 */
	async getWorkerList(params) {
		const { keyword = '' } = params
		const user_id = this.context.uid
		const workersCollection = db.collection('workers')

		// 构建查询条件，添加用户ID限制
		let whereCondition = {
			user_id,
		}
		if (keyword) {
			whereCondition.name = new RegExp(keyword, 'i')
		}

		console.log('查询条件:', whereCondition)

		// 查询数据，不再使用分页
		const list = await workersCollection
			.where(whereCondition)
			.orderBy('createTime', 'desc')
			.get()
			.then(res => res.data)

		return {
			code: 0,
			message: '获取成功',
			data: {
				list,
			},
		}
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
		const { _id, name, phone, remark } = params
		const user_id = this.context.uid

		// 参数校验
		if (!name) {
			return {
				code: -1,
				message: '工人姓名不能为空',
			}
		}

		// 手机号格式校验（如果有提供）
		if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
			return {
				code: -1,
				message: '手机号码格式不正确',
			}
		}

		const workersCollection = db.collection('workers')
		const now = new Date()

		// 新增或修改
		if (_id) {
			// 修改前检查是否为当前用户创建的数据
			const existingWorker = await workersCollection
				.where({
					_id,
					user_id,
				})
				.get()

			if (!existingWorker.data.length) {
				return {
					code: -1,
					message: '工人不存在或无权操作',
				}
			}

			// 修改
			const updateData = {
				name,
				updateTime: now,
			}

			if (phone !== undefined) updateData.phone = phone
			if (remark !== undefined) updateData.remark = remark

			await workersCollection.doc(_id).update(updateData)

			// 查询更新后的完整数据
			const updatedData = await workersCollection
				.doc(_id)
				.get()
				.then(res => res.data[0])

			return {
				code: 0,
				message: '更新成功',
				data: updatedData,
			}
		} else {
			// 新增
			const insertData = {
				name,
				user_id, // 添加用户ID
				createTime: now,
				updateTime: now,
			}

			if (phone) insertData.phone = phone
			if (remark) insertData.remark = remark

			const insertResult = await workersCollection.add(insertData)

			// 查询新增后的完整数据
			const newData = await workersCollection
				.doc(insertResult.id)
				.get()
				.then(res => res.data[0])

			return {
				code: 0,
				message: '添加成功',
				data: newData,
			}
		}
	},

	/**
	 * 删除工人
	 * @param {String} workerId - 工人ID
	 * @returns {Object} 操作结果
	 */
	async deleteWorker(params) {
		const { workerId } = params
		const user_id = this.context.uid

		if (!workerId) {
			return {
				code: -1,
				message: '工人ID不能为空',
			}
		}

		// 使用事务处理
		const transaction = await db.startTransaction()
		try {
			// 检查工人是否存在且属于当前用户
			const workerInfo = await transaction
				.collection('workers')
				.where({
					_id: workerId,
					user_id,
				})
				.get()
				.then(res => res.data[0])

			if (!workerInfo) {
				await transaction.rollback()
				return {
					code: -1,
					message: '工人不存在或无权操作',
				}
			}

			// 1. 检查工人是否关联了工地
			const siteWorkerCount = await transaction
				.collection('site_worker')
				.where({ workerId, user_id })
				.count()
				.then(res => res.total)

			if (siteWorkerCount > 0) {
				await transaction.rollback()
				return {
					code: -1,
					message: `该工人关联了${siteWorkerCount}个工地，请先移除关联关系再删除`,
				}
			}

			// 2. 检查工人是否有工时记录
			const workHourCount = await transaction
				.collection('work_hours')
				.where({ workerId, user_id })
				.count()
				.then(res => res.total)

			if (workHourCount > 0) {
				await transaction.rollback()
				return {
					code: -1,
					message: `该工人有${workHourCount}条工时记录，无法删除`,
				}
			}

			// 3. 删除工人
			await transaction
				.collection('workers')
				.where({
					_id: workerId,
					user_id,
				})
				.remove()

			// 提交事务
			await transaction.commit()

			return {
				code: 0,
				message: '删除成功',
			}
		} catch (error) {
			await transaction.rollback()
			console.error('[deleteWorker error]', error)
			return {
				code: -1,
				message: '删除失败：' + error.message,
			}
		}
	},

	/**
	 * 获取工人详细信息
	 * @param {String} workerId - 工人ID
	 * @returns {Object} 工人详细信息
	 */
	async getWorkerDetail(params) {
		const { workerId } = params
		const user_id = this.context.uid

		if (!workerId) {
			return {
				code: -1,
				message: '工人ID不能为空',
			}
		}

		const workerInfo = await db
			.collection('workers')
			.where({
				_id: workerId,
				user_id,
			})
			.get()
			.then(res => res.data[0])

		if (!workerInfo) {
			return {
				code: -1,
				message: '工人不存在或无权查看',
			}
		}

		return {
			code: 0,
			message: '获取成功',
			data: workerInfo,
		}
	},
}
