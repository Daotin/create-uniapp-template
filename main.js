import App from './App'
import Vue from 'vue'
import store from './store/index.js'
import uView from 'uview-ui'
import { confirm, alert, showLoading, hideLoading, showToast } from './utils/toast.js'
import './uni.promisify.adaptor'

Vue.config.productionTip = false
App.mpType = 'app'

Vue.use(uView)

Vue.prototype.$confirm = confirm
Vue.prototype.$alert = alert
Vue.prototype.$showLoading = showLoading
Vue.prototype.$hideLoading = hideLoading
Vue.prototype.$showToast = showToast
Vue.prototype.$store = store

const app = new Vue({
	...App,
	store,
})
app.$mount()
