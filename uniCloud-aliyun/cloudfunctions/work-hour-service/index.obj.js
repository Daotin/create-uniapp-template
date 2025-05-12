// work-hour-service云对象
const db = uniCloud.database()
const dbCmd = db.command
const $ = db.command.aggregate

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
	 * 工时记录/修改
	 * @param {String} _id - 工时记录ID，有则修改，无则新增
	 * @param {String} siteId - 工地ID
	 * @param {String} workerId - 工人ID，新增时支持多个ID用逗号分隔，修改时只能是单个ID
	 * @param {Date} date - 工作日期
	 * @param {Number} hours - 工作小时数
	 * @returns {Object} 操作结果
	 */
	async saveWorkHours(params) {
		const { _id, siteId, workerId, date, hours } = params

		// 参数校验
		if (!siteId) {
			return {
				code: -1,
				message: '工地ID不能为空',
			}
		}

		if (!workerId) {
			return {
				code: -1,
				message: '工人ID不能为空',
			}
		}

		if (!date) {
			return {
				code: -1,
				message: '工作日期不能为空',
			}
		}

		if (hours === undefined || hours === null || hours < 0) {
			return {
				code: -1,
				message: '工作小时数必须大于等于0',
			}
		}

		const workHoursCollection = db.collection('work_hours')
		const now = new Date()
		let workDate = new Date(date)
		const user_id = this.context.uid // 获取当前用户ID

		// 修改模式
		if (_id) {
			// 检查记录是否存在且属于当前用户
			const existRecord = await workHoursCollection
				.where({
					_id,
					user_id,
				})
				.get()
				.then(res => res.data[0])

			if (!existRecord) {
				return {
					code: -1,
					message: '记录不存在或您无权修改',
				}
			}

			// 修改单条记录
			const updateData = {
				siteId,
				workerId,
				date: workDate,
				hours: Number(hours),
				updateTime: now,
			}

			await workHoursCollection.doc(_id).update(updateData)

			// 查询更新后的完整数据
			const updatedData = await workHoursCollection
				.doc(_id)
				.get()
				.then(res => res.data[0])

			return {
				code: 0,
				message: '更新成功',
				data: {
					successCount: 1,
					records: [updatedData],
				},
			}
		} else {
			// 新增模式，支持批量
			const workerIds = workerId.split(',').filter(id => id.trim())

			if (workerIds.length === 0) {
				return {
					code: -1,
					message: '工人ID格式错误',
				}
			}

			// 校验工地是否存在且属于当前用户
			const siteExists = await db
				.collection('sites')
				.where({
					_id: siteId,
					user_id,
				})
				.get()
				.then(res => res.data.length > 0)

			if (!siteExists) {
				return {
					code: -1,
					message: '工地不存在或您无权操作',
				}
			}

			// 校验工人是否存在且关联到指定工地
			const siteWorkerRelations = await db
				.collection('site_worker')
				.where({
					siteId,
					workerId: dbCmd.in(workerIds),
					user_id,
				})
				.get()
				.then(res => res.data)

			// 获取实际有关联的工人ID
			const relatedWorkerIds = siteWorkerRelations.map(item => item.workerId)

			// 找出未关联的工人ID
			const unrelatedWorkerIds = workerIds.filter(id => !relatedWorkerIds.includes(id))

			if (unrelatedWorkerIds.length > 0) {
				return {
					code: -1,
					message: `以下工人ID未关联到指定工地: ${unrelatedWorkerIds.join(', ')}`,
				}
			}

			// 批量插入工时记录
			const insertData = workerIds.map(workerId => ({
				siteId,
				workerId,
				date: workDate,
				hours: Number(hours),
				createTime: now,
				updateTime: now,
				user_id, // 添加用户ID
			}))

			const insertResult = await workHoursCollection.add(insertData)

			// 查询新增后的完整数据
			const newRecords = await workHoursCollection
				.where({
					_id: dbCmd.in(insertResult.ids),
					user_id,
				})
				.get()
				.then(res => res.data)

			return {
				code: 0,
				message: '添加成功',
				data: {
					successCount: newRecords.length,
					records: newRecords,
				},
			}
		}
	},

	/**
	 * 获取工时列表
	 * @param {String} siteId - 工地ID
	 * @param {String} workerId - 工人ID，多个ID用逗号分隔
	 * @param {Date} startDate - 开始日期
	 * @param {Date} endDate - 结束日期
	 * @returns {Object} 包含工时记录列表和分页信息
	 */
	async getWorkHourList(params) {
		const { siteId, workerId, startDate, endDate } = params
		const user_id = this.context.uid // 获取当前用户ID

		// 构建查询条件
		const whereCondition = {
			user_id, // 添加用户ID条件
		}
		if (siteId) whereCondition.siteId = siteId

		// 支持多工人查询（逗号分隔）
		if (workerId) {
			const workerIds = workerId.split(',').filter(id => id.trim())
			if (workerIds.length === 1) {
				whereCondition.workerId = workerIds[0]
			} else if (workerIds.length > 1) {
				whereCondition.workerId = dbCmd.in(workerIds)
			}
		}

		// 处理日期范围
		if (startDate || endDate) {
			whereCondition.date = {}
			if (startDate) whereCondition.date = { ...whereCondition.date, $gte: new Date(startDate) }
			if (endDate) whereCondition.date = { ...whereCondition.date, $lte: new Date(endDate) }
		}

		// 使用聚合查询获取关联信息
		const aggregateQuery = db
			.collection('work_hours')
			.aggregate()
			.match(whereCondition)
			.lookup({
				from: 'sites',
				localField: 'siteId',
				foreignField: '_id',
				as: 'siteInfo',
			})
			.lookup({
				from: 'workers',
				localField: 'workerId',
				foreignField: '_id',
				as: 'workerInfo',
			})
			.unwind({
				path: '$siteInfo',
				preserveNullAndEmptyArrays: true,
			})
			.unwind({
				path: '$workerInfo',
				preserveNullAndEmptyArrays: true,
			})
			.sort({
				date: -1,
				createTime: -1,
			})
			.project({
				_id: 1,
				siteId: 1,
				workerId: 1,
				date: 1,
				hours: 1,
				createTime: 1,
				updateTime: 1,
				siteName: '$siteInfo.name',
				workerName: '$workerInfo.name',
				user_id: 1,
			})

		// 查询数据
		const result = await aggregateQuery.end()

		return {
			code: 0,
			message: '获取成功',
			data: {
				list: result.data,
			},
		}
	},

	/**
	 * 删除工时记录
	 * @param {String} workHourId - 工时记录ID
	 * @returns {Object} 操作结果
	 */
	async deleteWorkHour(params) {
		const { workHourId } = params
		const user_id = this.context.uid // 获取当前用户ID

		if (!workHourId) {
			return {
				code: -1,
				message: '工时记录ID不能为空',
			}
		}

		// 检查记录是否存在且属于当前用户
		const recordExists = await db
			.collection('work_hours')
			.where({
				_id: workHourId,
				user_id,
			})
			.get()
			.then(res => res.data.length > 0)

		if (!recordExists) {
			return {
				code: -1,
				message: '工时记录不存在或您无权删除',
			}
		}

		// 删除记录
		await db.collection('work_hours').doc(workHourId).remove()

		return {
			code: 0,
			message: '删除成功',
		}
	},

	/**
	 * 工时统计
	 * @param {String} siteId - 工地ID
	 * @param {String} workerId - 工人ID，多个ID用逗号分隔
	 * @param {Date} startDate - 开始日期
	 * @param {Date} endDate - 结束日期
	 * @returns {Object} 工时统计结果
	 */
	async getWorkHourStats(params) {
		const { siteId, workerId, startDate, endDate } = params
		const user_id = this.context.uid // 获取当前用户ID

		// 构建查询条件
		const matchCondition = {
			user_id, // 添加用户ID条件
		}
		if (siteId) matchCondition.siteId = siteId

		// 支持多工人查询（逗号分隔）
		if (workerId) {
			const workerIds = workerId.split(',').filter(id => id.trim())
			if (workerIds.length === 1) {
				matchCondition.workerId = workerIds[0]
			} else if (workerIds.length > 1) {
				matchCondition.workerId = dbCmd.in(workerIds)
			}
		}

		// 处理日期范围
		if (startDate || endDate) {
			matchCondition.date = {}
			if (startDate) matchCondition.date = { ...matchCondition.date, $gte: new Date(startDate) }
			if (endDate) matchCondition.date = { ...matchCondition.date, $lte: new Date(endDate) }
		}

		// 使用聚合查询按工人分组统计
		const result = await db
			.collection('work_hours')
			.aggregate()
			.match(matchCondition)
			.lookup({
				from: 'workers',
				localField: 'workerId',
				foreignField: '_id',
				as: 'workerInfo',
			})
			.lookup({
				from: 'sites',
				localField: 'siteId',
				foreignField: '_id',
				as: 'siteInfo',
			})
			.unwind({
				path: '$workerInfo',
				preserveNullAndEmptyArrays: true,
			})
			.unwind({
				path: '$siteInfo',
				preserveNullAndEmptyArrays: true,
			})
			.group({
				_id: '$workerId',
				workerName: $.first('$workerInfo.name'),
				totalHours: $.sum('$hours'),
				siteId: $.first('$siteId'),
				siteName: $.first('$siteInfo.name'),
				workDays: $.addToSet('$date'),
			})
			.project({
				_id: 0,
				workerId: '$_id',
				workerName: 1,
				totalHours: 1,
				siteId: 1,
				siteName: 1,
				workDayCount: $.size('$workDays'),
			})
			.sort({
				totalHours: -1,
			})
			.end()

		// 计算总工时和工人数
		const totalStats = result.data.reduce(
			(acc, curr) => {
				acc.totalHours += curr.totalHours
				return acc
			},
			{ totalHours: 0, workerCount: result.data.length },
		)

		return {
			code: 0,
			message: '获取成功',
			data: {
				list: result.data,
				total: totalStats,
			},
		}
	},

	/**
	 * 获取月度工时统计，返回指定月份每天的工时总数
	 * @param {String} siteId - 工地ID
	 * @param {Number} year - 年份
	 * @param {Number} month - 月份
	 * @returns {Object} 月度工时统计结果，包含每天的工时总数
	 */
	async getMonthlyWorkHourStats(params) {
		const { siteId, year, month } = params
		const user_id = this.context.uid // 获取当前用户ID

		console.log('[getMonthlyWorkHourStats] 获取月度工时统计，参数:', params)

		// 参数校验
		if (!siteId) {
			return {
				code: -1,
				message: '工地ID不能为空',
			}
		}

		if (!year || !month) {
			return {
				code: -1,
				message: '年份和月份不能为空',
			}
		}

		try {
			// 构建月份的开始和结束日期 (UTC)
			const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
			const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0))
			// endDate设置为下个月第一天的0点，查询时使用 $lt (小于)

			console.log('[getMonthlyWorkHourStats] 查询日期范围 (UTC):', startDate.toISOString(), '至', endDate.toISOString())

			// 构建查询条件
			const matchCondition = {
				user_id,
				siteId,
				date: {
					$gte: startDate,
					$lt: endDate, // 使用 $lt (小于下个月第一天) 来包含当月所有时间
				},
			}

			console.log('[getMonthlyWorkHourStats] 聚合查询条件:', JSON.stringify(matchCondition))

			// 使用聚合查询，按日期分组统计每天的工时总数
			const result = await db
				.collection('work_hours')
				.aggregate()
				.match(matchCondition)
				.addFields({
					// 将日期转换为指定时区（如东八区）的日期字符串，用于分组
					dateString: {
						$dateToString: {
							format: '%Y-%m-%d',
							date: '$date', // 使用原始日期字段
							timezone: '+0800', // 指定时区为东八区 (CST)
						},
					},
				})
				.group({
					_id: '$dateString', // 按转换后的日期字符串分组
					totalHours: $.sum('$hours'), // 求和计算总工时
				})
				.project({
					_id: 0,
					date: '$_id', // 将分组的键 (_id, 即日期字符串) 重命名为 date
					totalHours: 1, // 保留总工时
				})
				.sort({
					date: 1, // 按日期字符串排序 (YYYY-MM-DD 格式可直接排序)
				})
				.end()

			console.log('[getMonthlyWorkHourStats] 聚合查询结果:', result)

			return {
				code: 0,
				message: '获取成功',
				data: {
					list: result.data,
				},
			}
		} catch (e) {
			console.error('[getMonthlyWorkHourStats] 获取月度工时统计异常:', e)
			return {
				code: -1,
				message: '获取月度工时统计失败: ' + e.message,
			}
		}
	},
}
