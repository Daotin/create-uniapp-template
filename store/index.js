import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import demo from './modules/demo.js'

Vue.use(Vuex)

const store = new Vuex.Store({
	plugins: [
		createPersistedState({
			storage: {
				// 存储方式定义
				getItem: key => uni.getStorageSync(key), // 获取
				setItem: (key, value) => uni.setStorageSync(key, value), // 存储
				removeItem: key => uni.removeStorageSync(key), // 删除
			},
		}),
	],
	modules: {
		demo,
	},
	getters: {
		userId: state => state.demo.userId,
		nickName: state => state.demo.nickName,
		avatarUrl: state => state.demo.avatarUrl,
		isLogin: state => state.demo.isLogin,
	},
})

export default store
