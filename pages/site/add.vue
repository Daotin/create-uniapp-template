<template>
	<view class="site-add common-page-container has-btm-btn">
		<u-form :model="form" ref="uForm">
			<view class="form-group">
				<u-form-item label="工地名称" prop="name" required :label-width="100">
					<u-input v-model="form.name" placeholder="请输入工地名称" />
				</u-form-item>

				<u-form-item label="地址" prop="address" :label-width="100">
					<u-input v-model="form.address" placeholder="请输入工地地址" />
				</u-form-item>
			</view>

			<view class="form-group">
				<u-form-item label="备注" prop="remark" :label-width="100">
					<u-input v-model="form.remark" placeholder="请输入备注信息" type="textarea" height="100" />
				</u-form-item>
			</view>
		</u-form>

		<!-- 底部保存按钮 -->
		<view class="common-btm-btn">
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
				address: '',
				remark: '',
			},
			submitting: false, // 提交状态
			isEdit: false, // 是否是编辑模式
			rules: {
				name: [
					{
						required: true,
						message: '请输入工地名称',
						trigger: ['blur', 'change'],
					},
				],
			},
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
					title: '编辑工地',
				})
				await this.getSiteDetail()
			} else {
				uni.setNavigationBarTitle({
					title: '添加工地',
				})
			}

			// 设置验证规则
			this.$refs.uForm.setRules(this.rules)
		},

		// 获取工地详情
		async getSiteDetail() {
			try {
				this.$showLoading('加载中...')

				// 直接调用云对象
				const siteService = uniCloud.importObject('site-service')
				const res = await siteService.getSiteDetail({
					siteId: this.form._id,
				})

				console.log('工地详情返回:', res)

				if (res.code === 0 && res.data) {
					const { name, address, remark } = res.data
					this.form.name = name
					this.form.address = address || ''
					this.form.remark = remark || ''
				} else {
					this.$showToast.none(res.message || '获取工地信息失败')
				}
			} catch (e) {
				console.error('获取工地详情异常:', e)
				this.$showToast.none('获取工地信息失败，请重试')
			} finally {
				this.$hideLoading()
			}
		},

		// 提交表单
		async submit() {
			console.log('提交表单')
			await this.$refs.uForm.validate()
			console.log('表单验证通过')
			this.saveSite()
		},

		// 保存工地
		async saveSite() {
			try {
				this.submitting = true
				console.log('保存工地', this.form)

				// 直接调用云对象
				const siteService = uniCloud.importObject('site-service')
				const res = await siteService.saveSite({
					_id: this.form._id,
					name: this.form.name,
					address: this.form.address,
					remark: this.form.remark,
				})

				console.log('保存工地返回:', res)

				if (res.code === 0) {
					this.$showToast.success(this.isEdit ? '修改成功' : '添加成功')

					// 触发刷新事件
					uni.$emit('needRefresh')

					// 等待提示显示后返回上一页
					setTimeout(() => {
						uni.navigateBack()
					}, 500)
				} else {
					this.$showToast.none(res.message || '保存失败')
				}
			} catch (e) {
				console.error('保存工地异常:', e)
				this.$showToast.none('保存失败，请重试')
			} finally {
				this.submitting = false
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.site-add {
	.form-group {
		background: #fff;
		margin-top: 24rpx;
		padding: 0 24rpx;
	}

	::v-deep .u-form-item {
		min-height: 100rpx;
	}
}
</style>
