import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../views/login/Login.vue'
import Layout from '../components/AppLayout.vue'
import store from '@/store'

Vue.use(VueRouter)  // 这一行不能出错

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/Dashboard.vue')},
      { path: 'product', name: 'Product', component: () => import('@/views/product/Product.vue'), meta: { perms: ['商品管理'] } },
      { path: 'customer', name: 'Customer', component: () => import('@/views/customer/Customer.vue'), meta: { perms: ['客户管理'] } },
      { path: 'order', name: 'Order', component: () => import('@/views/order/Order.vue'), meta: { perms: ['订单管理'] } },
      { path: 'stock', name: 'Stock', component: () => import('@/views/stock/Stock.vue'), meta: { perms: ['库存管理'] } },
      { path: 'user', name: 'User', component: () => import('@/views/user/User.vue'), meta: { perms: ['用户管理'] } },
      { path: 'profile', name: 'Profile', component: () => import('@/views/profile/Profile.vue'), meta: { perms: ['个人中心'] } },
      {path: 'finance',name: 'Finance',component: () => import('@/views/finance/Finance.vue'), meta: { perms: ['财务看板'] } },
      {path: 'finance/records',name: 'Records',component: () => import('@/views/finance/Records.vue'), meta: { perms: ['收支记录'] } },
      {path: 'employee',name: 'Employee',component: () => import('@/views/user/Employee.vue'), meta: { perms: ['员工管理'] } },
      { path: '/purchase/supplier', name: 'SupplierManagement',component: () => import('@/views/purchase/Supplier.vue') , meta: { perms: ['供应商管理'] }},
      { path: '/purchase/orderpur', name: 'OrderPur',component: () => import('@/views/purchase/OrderPur.vue') , meta: { perms: ['采购订单'] }},
      { path: '/report/sales', name: 'SalesReport',component: () => import('@/views/report/Sales.vue') , meta: { perms: ['销售报表'] }},
      { path: '/report/inventory', name: 'InventoryReport',component: () => import('@/views/report/Inventory.vue'), meta: { perms: ['库存报表'] } },
      { path: '/report/financerep', name: 'financerep',component: () => import('@/views/report/FinanceRep.vue') , meta: { perms: ['财务报表'] }},
      { path: '/system/permission',name: 'PermissionManagement', component: () => import('@/views/system/Permission.vue'), meta: { perms: ['权限管理'] } },
      { path: '/system/log', name: 'OperationLog',component: () => import('@/views/system/Log.vue'), meta: { perms: ['操作日志'] } },
      { path: '/system/dict', name: 'DataDict',component: () => import('@/views/system/Dict.vue'), meta: { perms: ['数据字典'] } },
      {path: '/403',name: 'ForbiddenFour',component: () => import('@/views/error/403.vue')},
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

let fetchUserInfoPromise = null

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
    return
  }
  if (to.path === '/login' && token) {
    next('/dashboard')
    return
  }
  
  // 2. 已登录但用户信息未加载，则先加载用户信息（使用 Promise 回调）
  if (token && !store.state.user.userInfo) {
    if (!fetchUserInfoPromise) {
      fetchUserInfoPromise = store.dispatch('user/fetchUserInfo')
    }
    // 等待用户信息加载完成后再继续权限检查
    fetchUserInfoPromise
      .then(() => {
        // 加载完成后重置 promise 标识
        fetchUserInfoPromise = null
        // 继续权限检查
        checkPermissionAndProceed(to, next)
      })
      .catch(() => {
        // 加载失败，可能是 token 无效，跳转登录
        localStorage.removeItem('token')
        next('/login')
      })
  } else {
    // 用户信息已存在，直接检查权限
    checkPermissionAndProceed(to, next)
  }
})

function checkPermissionAndProceed(to, next) {
  const requiredPerms = to.meta?.perms
  if (requiredPerms && requiredPerms.length) {
    const isSuperAdmin = store.state.user.isSuperAdmin
    if (!isSuperAdmin) {
      const perms = store.state.user.perms || []
      const hasPerm = requiredPerms.some(p => perms.includes(p))
      if (!hasPerm) {
        next('/403')
        return
      }
    }
  }
  next()
}

export default router