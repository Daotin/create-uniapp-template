<template>
	<view class="worker-add">
		<u-form :model="form" ref="uForm">
			<view class="form-group">
				<u-form-item label="姓名" prop="name" required :label-width="80">
					<u-input v-model="form.name" placeholder="请输入工人姓名" />
				</u-form-item>
				
				<u-form-item label="手机号" prop="phone" :label-width="80">
					<u-input v-model="form.phone" placeholder="请输入联系电话" type="number" maxlength="11" />
				</u-form-item>
			</view>
			
			<view class="form-group">
				<u-form-item label="备注" prop="remark" :label-width="80">
					<u-input v-model="form.remark" placeholder="请输入备注信息" />
				</u-form-item>
			</view>
		</u-form>
		
		<!-- 底部保存按钮 -->
		<view class="bottom-box">
			<u-button type="primary" :loading="submitting" @click="submit">保存</u-button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			form: {
				_id: '', // 编辑时有值，新增时为空
				name: '',
				phone: '',
				remark: ''
			},
			submitting: false, // 提交状态
			isEdit: false, // 是否是编辑模式
			rules: {
				name: [
					{
						required: true,
						message: '请输入工人姓名',
						trigger: ['blur', 'change']
					}
				],
				phone: [
					{
						pattern: /^$|^1[3-9]\d{9}$/,
						message: '手机号码格式不正确',
						trigger: ['blur', 'change']
					}
				]
			}
		}
	},
	onLoad(option) {
		this.initForm(option)
	},
	methods: {
		// 初始化表单
		async initForm(option) {
			if (option.id) {
				this.form._id = option.id
				this.isEdit = true
				uni.setNavigationBarTitle({
					title: '编辑工人'
				})
				await this.getWorkerDetail()
			} else {
				uni.setNavigationBarTitle({
					title: '添加工人'
				})
			}
			
			// 设置验证规则
			this.$refs.uForm.setRules(this.rules)
		},
		
		// 获取工人详情
		async getWorkerDetail() {
			try {
				this.$showLoading('加载中...')
				
				// 直接调用云对象
				const workerService = uniCloud.importObject('worker-service')
				const res = await workerService.getWorkerDetail({
					workerId: this.form._id
				})
				
				console.log('工人详情返回:', res)
				
				if (res.code === 0 && res.data) {
					const { name, phone, remark } = res.data
					this.form.name = name
					this.form.phone = phone || ''
					this.form.remark = remark || ''
				} else {
					this.$showToast.none(res.message || '获取工人信息失败')
				}
			} catch (e) {
				console.error('获取工人详情异常:', e)
				this.$showToast.none('获取工人信息失败，请重试')
			} finally {
				this.$hideLoading()
			}
		},
		
		// 提交表单
		submit() {
			this.$refs.uForm.validate(valid => {
				if (valid) {
					this.saveWorker()
				}
			})
		},
		
		// 保存工人
		async saveWorker() {
			try {
				this.submitting = true
				
				// 直接调用云对象
				const workerService = uniCloud.importObject('worker-service')
				const res = await workerService.saveWorker({
					_id: this.form._id,
					name: this.form.name,
					phone: this.form.phone,
					remark: this.form.remark
				})
				
				console.log('保存工人返回:', res)
				
				if (res.code === 0) {
					this.$showToast.success(this.isEdit ? '修改成功' : '添加成功')

          uni.$emit('needRefresh')
					
					// 等待提示显示后返回上一页
					setTimeout(() => {
						uni.navigateBack()
					}, 500)
				} else {
					this.$showToast.none(res.message || '保存失败')
				}
			} catch (e) {
				console.error('保存工人异常:', e)
				this.$showToast.none('保存失败，请重试')
			} finally {
				this.submitting = false
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.worker-add {
	min-height: 100vh;
	background-color: #f7f8fa;
	padding-bottom: 240rpx; // 为底部按钮留出空间
	
	.form-group {
		background: #fff;
		margin-top: 24rpx;
		padding: 0 24rpx;
	}
	
	::v-deep .u-form-item {
		min-height: 100rpx;
	}
	
	.bottom-box {
		position: fixed;
		left: 0;
		bottom: 0;
		width: 100%;
		padding: 20rpx 30rpx;
		background-color: #fff;
		box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
		z-index: 9;
		box-sizing: border-box;
		
		.u-button {
			width: 100%;
			height: 88rpx;
		}
	}
}
</style>