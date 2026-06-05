import { getProductList, addProduct, updateProduct, deleteProduct } from '@/api/product'

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
    async fetchProducts({ commit }, params = {}) {
      commit('SET_LOADING', true)
      try {
        const res = await getProductList(params)
        commit('SET_LIST', { list: res.data.list, total: res.data.total })
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async addProduct({ dispatch }, data) {
      await addProduct(data)
      dispatch('fetchProducts') // 刷新列表
    },
    async updateProduct({ dispatch }, { id, data }) {
      await updateProduct(id, data)
      dispatch('fetchProducts')
    },
    async deleteProduct({ dispatch }, id) {
      await deleteProduct(id)
      dispatch('fetchProducts')
    }
  },
  // store/modules/product.js (添加 getters)
getters: {
  lowStockCount: state => state.list.filter(p => p.stock < 50).length
}
}