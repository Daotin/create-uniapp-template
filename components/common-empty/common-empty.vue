<template>
	<view class="common-empty flex flex-col items-center">
		<image :src="src" mode="widthFix"></image>
		<text class="text">{{ text }}</text>
	</view>
</template>

<script>
export default {
	name: 'common-empty',
	props: {
		src: {
			type: String,
			default: '/static/images/common/empty.png',
		},
		text: {
			type: String,
			default: '暂无数据',
		},
	},
	data() {
		return {}
	},
	methods: {},
	onLoad(option) {
		console.log(option)
	},
}
</script>

<style lang="scss" scoped>
.common-empty {
	image {
		width: 176rpx;
		height: 176rpx;
	}
	.text {
		font-size: 26rpx;
		font-weight: 400;
		color: #dbdbdb;
	}
}
</style>
