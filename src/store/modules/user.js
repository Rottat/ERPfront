// src/store/modules/user.js
import { getUserList, addUser, updateUser, deleteUser, getUserInfo } from '@/api/user'

export default {
  namespaced: true,
  state: {
    list: [],
    total: 0,
    loading: false,
    userInfo: null,
    perms: [],      // 新增：存储权限字符串数组
    isSuperAdmin:false
  },
  mutations: {
    SET_LIST(state, { list, total }) {
      state.list = list
      state.total = total
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_USER(state, info) {
      state.userInfo = info
      state.perms = info?.perms || []   // 关键：存储权限
      state.isSuperAdmin = info?.isSuperAdmin || false   
    },
    // 可选：单独清除权限
    CLEAR_PERMS(state) {
      state.perms = []
      state.userInfo = null
    }
  },
  getters: {
    // 提供权限检查方法（方便组件中使用）
    hasPerm: (state) => (perm) => {
      if (state.isSuperAdmin) return true
      if (!perm) return true
      if (Array.isArray(perm)) {
        return perm.some(p => state.perms.includes(p))
      }
      return state.perms.includes(perm)
    }
  },
  actions: {
    async fetchUsers({ commit }, params = {}) {
      commit('SET_LOADING', true)
      try {
        const res = await getUserList(params)
        commit('SET_LIST', { list: res.data.list, total: res.data.total })
      } catch (error) {
        console.error('获取用户列表失败', error)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async addUser({ dispatch }, data) {
      await addUser(data)
      dispatch('fetchUsers', { page: 1, pageSize: 10, keyword: '' })
    },
    async updateUser({ dispatch }, { id, data }) {
      await updateUser(id, data)
      dispatch('fetchUsers')
    },
    async deleteUser({ dispatch }, id) {
      await deleteUser(id)
      dispatch('fetchUsers')
    },
    // 修改 fetchUserInfo 将返回的权限存入 store
    async fetchUserInfo({ commit }) {
      try {
        const res = await getUserInfo()
        commit('SET_USER', res.data)   // res.data 应包含 perms 字段
      } catch (error) {
        console.error('获取用户信息失败', error)
      }
    },
    // 登录成功后调用，保存 token 和用户信息（由 Login.vue 调用）
    loginSuccess({ commit }, { token, userInfo }) {
      localStorage.setItem('token', token)
      commit('SET_USER', userInfo)
    },
    // 退出登录
    logout({ commit }) {
      localStorage.removeItem('token')
      commit('CLEAR_PERMS')
    }
  }
}