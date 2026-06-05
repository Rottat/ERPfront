import { getInventoryList, addInventory, updateInventory, deleteInventory } from '@/api/inventory'

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
    async fetchInventory({ commit }, params = {}) {
      commit('SET_LOADING', true)
      try {
        const res = await getInventoryList(params)
        commit('SET_LIST', { list: res.data.list, total: res.data.total })
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async addInventory({ dispatch }, data) {
      await addInventory(data)
      dispatch('fetchInventory')
    },
    async updateInventory({ dispatch }, { id, data }) {
      await updateInventory(id, data)
      dispatch('fetchInventory')
    },
    async deleteInventory({ dispatch }, id) {
      await deleteInventory(id)
      dispatch('fetchInventory')
    }
  }
}