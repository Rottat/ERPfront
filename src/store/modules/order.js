import { getOrderList, addOrder, updateOrder, deleteOrder, updateOrderStatus } from '@/api/order'

export default {
  namespaced: true,
  state: {
    list: [],
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
    async fetchOrders({ commit }, params = {}) {
      commit('SET_LOADING', true)
      try {
        const res = await getOrderList(params)
        commit('SET_LIST', { list: res.data.list, total: res.data.total })
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async addOrder({ dispatch }, data) {
      await addOrder(data)
      dispatch('fetchOrders')
    },
    async updateOrder({ dispatch }, { id, data }) {
      await updateOrder(id, data)
      dispatch('fetchOrders')
    },
    async updateOrderStatus({ dispatch }, { id, status }) {
      await updateOrderStatus(id, status)
      dispatch('fetchOrders')
    },
    async deleteOrder({ dispatch }, id) {
      await deleteOrder(id)
      dispatch('fetchOrders')
    }
  }
}