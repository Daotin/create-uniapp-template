<script>
import { systemInfo } from '@/utils/system-info.js'
import { mapActions, mapGetters } from 'vuex'
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

		if (typeof document !== 'undefined' && document.documentElement) {
			document.documentElement.style.setProperty('--nav-bar-height', `${this.globalData.navHeight}rpx`)
			document.documentElement.style.setProperty('--safe-area-height', `${this.globalData.safeAreaHeight}rpx`)
			console.log('css变量设置成功')
		} else {
			console.warn('css变量设置失败')
		}
	},
	onShow: function () {
		console.log('App Show')
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

page {
	background-color: #f7f9fb;
	height: 100%;
	box-sizing: border-box;

	/* iOS < 11.2 */
	padding-bottom: constant(safe-area-inset-bottom);
	/* iOS >= 11.2, Android */
	padding-bottom: env(safe-area-inset-bottom);
}
</style>
