export default {
	namespaced: true,
	state: {
		userId: '',
		nickName: '',
		avatarUrl: '',
		isLogin: false,
	},
	mutations: {
		SET_DEL_ALL: state => {
			state.userId = ''
			state.nickName = ''
			state.avatarUrl = ''
			state.isLogin = false
		},
		SET_USER_ID: (state, val) => {
			state.userId = val
		},
		SET_USER_INFO: (state, userInfo) => {
			if (userInfo) {
				state.nickName = userInfo.nickName || ''
				state.avatarUrl = userInfo.avatarUrl || ''
				state.isLogin = true
			}
		},
		UPDATE_USER_AVATAR: (state, avatarUrl) => {
			state.avatarUrl = avatarUrl
		},
		UPDATE_USER_NICKNAME: (state, nickName) => {
			state.nickName = nickName
		},
	},
	actions: {
		setUserDelAll({ commit }) {
			commit('SET_DEL_ALL')
		},
		setUserId({ commit }, val) {
			commit('SET_USER_ID', val)
		},
		setUserInfo({ commit }, userInfo) {
			commit('SET_USER_INFO', userInfo)
		},
		updateUserAvatar({ commit }, avatarUrl) {
			commit('UPDATE_USER_AVATAR', avatarUrl)
		},
		updateUserNickname({ commit }, nickName) {
			commit('UPDATE_USER_NICKNAME', nickName)
		},
	},
}
