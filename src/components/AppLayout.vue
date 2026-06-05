<template>
  <div class="app-wrapper" :class="{ 'hide-sidebar': isCollapse }">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar-container">
      <div class="logo-container" @click="toggleSidebar">
        <div class="logo-icon">📊</div>
        <span class="logo-text" v-show="!isCollapse">ERP System</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        router
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        class="side-menu"
      >
        <!-- 动态渲染菜单树 -->
        <template v-for="item in visibleMenus">
          <el-menu-item v-if="!item.children || !item.children.length" :key="item.path" :index="item.path">
            <i :class="item.icon"></i>
            <template #title><span>{{ item.name }}</span></template>
          </el-menu-item>
          <el-submenu v-else :key="item.path" :index="item.path">
            <template #title>
              <i :class="item.icon"></i>
              <span>{{ item.name }}</span>
            </template>
            <el-menu-item v-for="child in item.children" :key="child.path" :index="child.path">
              {{ child.name }}
            </el-menu-item>
          </el-submenu>
        </template>
      </el-menu>

      <div class="collapse-btn" @click="toggleSidebar">
        <i :class="isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'"></i>
      </div>
    </el-aside>

    <!-- 右侧主区域 -->
    <div class="main-container">
      <div class="app-header" :class="{ 'header-collapsed': isHeaderCollapsed }">
        <div class="header-content">
          <div class="header-left">
            <i class="el-icon-menu" @click="toggleSidebar"></i>
            <el-breadcrumb separator="/" class="breadcrumb">
              <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-if="currentPath">{{ currentPath }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-tooltip content="折叠顶部栏" placement="bottom">
              <i class="el-icon-arrow-up header-fold-icon" @click="toggleHeader"></i>
            </el-tooltip>
            <el-dropdown @command="handleCommand" class="user-dropdown">
              <div class="user-info">
                <el-avatar :size="32" :icon="userAvatar" class="user-avatar"></el-avatar>
                <span class="user-name">{{ userInfo ? userInfo.realName : '管理员' }}</span>
                <i class="el-icon-arrow-down el-icon--right"></i>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <div class="app-main">
        <router-view />
      </div>
    </div>

    <div v-if="isHeaderCollapsed" class="header-sensor-area">
      <div class="expand-header-btn" @click="toggleHeader">
        <i class="el-icon-arrow-down"></i>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'AppLayout',
  data() {
    return {
      isCollapse: false,
      isHeaderCollapsed: false,
      // 全量菜单配置（权限标识符 perms 数组，为空表示不需要权限）
      allMenus: [
        { path: '/dashboard', name: '仪表盘', icon: 'el-icon-s-home', perms: [] },
        { 
          path: '/base', name: '基础资料', icon: 'el-icon-document', perms: [],
          children: [
            { path: '/product', name: '商品管理', perms: ['商品管理'] },
            { path: '/customer', name: '客户管理', perms: ['客户管理'] }
          ]
        },
        {
          path: '/business', name: '业务管理', icon: 'el-icon-s-order', perms: [],
          children: [
            { path: '/order', name: '订单管理', perms: ['订单管理'] },
            { path: '/stock', name: '库存管理', perms: ['库存管理'] }
          ]
        },
        {
          path: '/finance', name: '财务管理', icon: 'el-icon-money', perms: [],
          children: [
            { path: '/finance', name: '财务看板', perms: ['财务管理'] },
            { path: '/finance/records', name: '收支记录', perms: ['财务管理'] }
          ]
        },
        {
          path: '/system', name: '系统管理', icon: 'el-icon-setting', perms: [],
          children: [
            { path: '/user', name: '用户管理', perms: ['用户管理'] },
            { path: '/employee', name: '员工管理', perms: ['员工管理'] }
          ]
        },
        {
          path: '/purchase', name: '采购管理', icon: 'el-icon-shopping-cart-2', perms: [],
          children: [
            { path: '/purchase/orderpur', name: '采购订单', perms: ['采购订单'] },
            { path: '/purchase/supplier', name: '供应商管理', perms: ['供应商管理'] }
          ]
        },
        {
          path: '/report', name: '报表中心', icon: 'el-icon-data-line', perms: [],
          children: [
            { path: '/report/sales', name: '销售报表', perms: ['销售报表'] },
            { path: '/report/inventory', name: '库存报表', perms: ['库存报表'] },
            { path: '/report/financerep', name: '财务报表', perms: ['财务报表'] }
          ]
        },
        {
          path: '/settings', name: '系统设置', icon: 'el-icon-setting', perms: [],
          children: [
            { path: '/system/permission', name: '权限管理', perms: ['权限管理'] },
            { path: '/system/log', name: '操作日志', perms: ['操作日志'] },
            { path: '/system/dict', name: '数据字典', perms: ['数据字典'] }
          ]
        }
      ]
    }
  },
  computed: {
    ...mapState('user', ['userInfo']),
    // 用户权限数组
    userPerms() {
      return this.userInfo?.perms || []
    },
    // 根据权限过滤后的可见菜单
    visibleMenus() {
      const isSuperAdmin = this.userInfo?.isSuperAdmin
      if (isSuperAdmin) {
        // 超级管理员直接返回完整菜单（无需过滤）
        return JSON.parse(JSON.stringify(this.allMenus))
      }
      const filterMenu = (menus) => {
        return menus.filter(menu => {
          // 检查当前菜单权限
          if (menu.perms && menu.perms.length) {
            const hasPerm = menu.perms.some(p => this.userPerms.includes(p))
            if (!hasPerm) return false
          }
          // 处理子菜单
          if (menu.children && menu.children.length) {
            const filteredChildren = filterMenu(menu.children)
            if (filteredChildren.length === 0) return false
            menu.children = filteredChildren
          }
          return true
        })
      }
      // 深拷贝避免修改原配置
      const cloneMenus = JSON.parse(JSON.stringify(this.allMenus))
      return filterMenu(cloneMenus)
    },
    activeMenu() {
      const route = this.$route
      const { meta, path } = route
      if (meta.activeMenu) return meta.activeMenu
      return path
    },
    currentPath() {
      const routeMap = {
        '/dashboard': '仪表盘',
        '/product': '商品管理',
        '/customer': '客户管理',
        '/order': '订单管理',
        '/stock': '库存管理',
        '/user': '用户管理',
        '/employee': '员工管理',
        '/finance': '财务看板',
        '/finance/records': '收支记录',
        '/profile': '个人中心',
        '/purchase/supplier': '供应商管理',
        '/purchase/orderpur': '采购订单',
        '/report/sales': '销售报表',
        '/report/inventory':'库存报表',
        '/report/financerep':'财务报表',
        '/system/permission': '权限管理',
        '/system/log': '操作日志',
        '/system/dict': '数据字典'
      }
      return routeMap[this.$route.path] || ''
    },
    userAvatar() {
      return this.userInfo?.role === 'admin' ? 'el-icon-user-solid' : 'el-icon-user'
    }
  },
  created() {
    if (!this.userInfo) this.$store.dispatch('user/fetchUserInfo')
    const savedCollapse = localStorage.getItem('sidebarCollapse')
    if (savedCollapse !== null) this.isCollapse = savedCollapse === 'true'
    const savedHeader = localStorage.getItem('headerCollapsed')
    if (savedHeader !== null) this.isHeaderCollapsed = savedHeader === 'true'
  },
  methods: {
    toggleSidebar() {
      this.isCollapse = !this.isCollapse
      localStorage.setItem('sidebarCollapse', this.isCollapse)
    },
    toggleHeader() {
      this.isHeaderCollapsed = !this.isHeaderCollapsed
      localStorage.setItem('headerCollapsed', this.isHeaderCollapsed)
    },
    handleCommand(cmd) {
      if (cmd === 'logout') {
        this.$confirm('确定退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          localStorage.removeItem('token')
          this.$store.commit('user/SET_USER', null)
          this.$router.push('/login')
          this.$message.success('已退出登录')
        }).catch(() => {})
      } else if (cmd === 'profile') {
        this.$router.push('/profile')
      }
    }
  }
}
</script>

<style scoped>
/* 原有样式保持不变，此处省略（与原文件相同） */
.app-wrapper {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.sidebar-container {
  background-color: #304156;
  transition: width 0.28s;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.05);
}
.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2b3a4a;
  margin-bottom: 16px;
  cursor: pointer;
}
.logo-icon { font-size: 28px; margin-right: 8px; color: #fff; }
.logo-text { font-size: 18px; font-weight: 600; color: #fff; white-space: nowrap; }
.side-menu { border-right: none; flex: 1; }
.side-menu:not(.el-menu--collapse) { width: 100%; }
.el-menu--collapse .logo-text { margin-right: 0; }
.collapse-btn {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2b3a4a;
  color: #bfcbd9;
  font-size: 20px;
  cursor: pointer;
  margin-top: auto;
}
.collapse-btn:hover { background: #1f2d3a; color: #fff; }
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f0f2f5;
}
.app-header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  transition: height 0.3s ease, visibility 0.3s;
  overflow: hidden;
}
.app-header:not(.header-collapsed) {
  height: 60px;
}
.header-collapsed {
  height: 0;
  visibility: hidden;
}
.header-content {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}
.header-left { display: flex; align-items: center; gap: 16px; }
.header-left .el-icon-menu { font-size: 20px; cursor: pointer; color: #5a5e66; }
.header-left .el-icon-menu:hover { color: #409EFF; }
.breadcrumb { font-size: 14px; }
.header-right { display: flex; align-items: center; gap: 16px; }
.header-fold-icon { font-size: 18px; cursor: pointer; color: #5a5e66; }
.header-fold-icon:hover { color: #409EFF; }
.user-dropdown { cursor: pointer; }
.user-info { display: flex; align-items: center; gap: 8px; }
.user-avatar { background-color: #409EFF; }
.user-name { font-size: 14px; color: #2c3e50; }
.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.app-main::-webkit-scrollbar { width: 6px; }
.app-main::-webkit-scrollbar-thumb { background: #c0c4cc; border-radius: 3px; }
.header-sensor-area {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 40px;
  z-index: 1999;
  pointer-events: auto;
}
.header-sensor-area .expand-header-btn {
  position: absolute;
  top: 8px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  color: #409EFF;
  transition: all 0.2s;
  opacity: 0;
  visibility: hidden;
}
.header-sensor-area:hover .expand-header-btn {
  opacity: 1;
  visibility: visible;
}
.expand-header-btn:hover {
  background: #409EFF;
  color: #fff;
  transform: scale(1.05);
}
@media (max-width: 768px) {
  .sidebar-container {
    position: absolute;
    z-index: 1000;
    height: 100%;
    transition: transform 0.28s;
  }
  .hide-sidebar .sidebar-container {
    transform: translateX(-100%);
  }
  .collapse-btn {
    display: none;
  }
  .header-sensor-area {
    height: 30px;
  }
  .header-sensor-area .expand-header-btn {
    top: 4px;
    right: 12px;
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
}
</style>