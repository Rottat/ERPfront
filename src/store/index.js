import Vue from 'vue'
import Vuex from 'vuex'
import product from './modules/product'
import user from './modules/user'
import customer from './modules/customer'
import order from './modules/order'
import inventory from './modules/inventory'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    product,
    user,
    customer,
    order,
    inventory
  }
})