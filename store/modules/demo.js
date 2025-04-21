export default {
	namespaced: true,
	state: {
		userId: '11223344',
	},
	mutations: {
		SET_DEL_ALL: (state, val) => {
			state.userId = ''
		},
		SET_USER_ID: (state, val) => {
			state.userId = val
		},
	},
	actions: {
		setUserDelAll({ commit }, val) {
			commit('SET_DEL_ALL', val)
		},
		SET_USER_ID({ commit }, val) {
			commit('SET_USER_ID', val)
		},
	},
}
