// store/modules/customer.js
import { getCustomerList, addCustomer, updateCustomer, deleteCustomer } from '@/api/customer'

export default {
  namespaced: true,
  state: {
    list: [],      // 客户列表数据
    total: 0,
    loading: false
  },
  mutations: {
    SET_LIST(state, { list, total }) {
      state.list = list
      state.total = total
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    }
  },
  actions: {
    async fetchCustomers({ commit }, params = {}) {
      commit('SET_LOADING', true)
      try {
        const res = await getCustomerList(params)
        commit('SET_LIST', { list: res.data.list, total: res.data.total })
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async addCustomer({ dispatch }, data) {
      await addCustomer(data)
      dispatch('fetchCustomers')
    },
    async updateCustomer({ dispatch }, { id, data }) {
      await updateCustomer(id, data)
      dispatch('fetchCustomers')
    },
    async deleteCustomer({ dispatch }, id) {
      await deleteCustomer(id)
      dispatch('fetchCustomers')
    }
  }
}