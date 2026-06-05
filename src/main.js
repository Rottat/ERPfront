import '@/mock' 
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'          // 确保导入 store
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import './styles/index.scss'


if (process.env.NODE_ENV === 'development') {
  require('./mock')
}

Vue.use(ElementUI)

Vue.config.productionTip = false

new Vue({
  router,
  store,                             // 注入 store
  render: h => h(App)
}).$mount('#app')