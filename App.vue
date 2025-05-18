<script>
import { systemInfo } from '@/utils/system-info.js'
import { mapActions, mapGetters } from 'vuex'
import uniIdPageInit from '@/uni_modules/uni-id-pages/init.js'
export default {
	computed: {
		...mapGetters(['userId']),
	},
	globalData: {
		navHeight: 0, //头部导航栏总高度
		isIOS: false, //是否是IOS系统
		isIPhoneX: false, //是否是iPhoneX以上的手机
		safeAreaHeight: 0, //安全区域高度
	},
	onLaunch: async function () {
		this.globalData.navHeight = systemInfo().navHeight + systemInfo().statusBarHeight
		this.globalData.isIOS = systemInfo().isIOS
		this.globalData.isIPhoneX = systemInfo().isIPhoneX
		this.globalData.safeAreaHeight = systemInfo().safeAreaHeight

		console.log('navHeight:', this.globalData.navHeight)
		console.log('isIOS:', this.globalData.isIOS)
		console.log('isIPhoneX:', this.globalData.isIPhoneX)
		console.log('safeAreaHeight:', this.globalData.safeAreaHeight)

		// 初始化uni-id-pages
		await uniIdPageInit()
	},
	onShow: function () {
		console.log('App Show')

		uni.$on('uni-id-pages-login-success', () => {
			console.log('==== 登录成功 ====')
			this.$showToast.success('登录成功')

			// setTimeout(() => {
			//   uni.switchTab({
			//     url: '/pages/about/index',
			//   })
			// }, 1000);
		})

		uni.$on('uni-id-pages-logout', () => {
			console.log('==== 退出登录 ====')
			this.$showToast.success('退出登录')

			// setTimeout(() => {
			// 	uni.switchTab({
			// 		url: '/pages/about/index',
			// 	})
			// }, 1000)
		})
	},
	onHide: function () {
		console.log('App Hide')
	},
	methods: {},
}
</script>

<style lang="scss">
/*每个页面公共css */
@import 'uview-ui/index.scss';

@import './style/base.scss';
// 引入字体缩放样式
// @import './style/font-scale.scss';

page {
	background-color: #f7f9fb;
	height: 100%;
	box-sizing: border-box;
	padding: 0; // 确保没有默认padding

	/* iOS < 11.2 */
	padding-bottom: constant(safe-area-inset-bottom);
	/* iOS >= 11.2, Android */
	padding-bottom: env(safe-area-inset-bottom);
}
</style>
