<template>
  <div class="dashboard">
    <!-- 顶部区域增强视觉 -->
    <div class="dashboard-header">
      <div class="title-section">
        <div class="title-icon">📊</div>
        <div class="title-text">
          <h2>ERP 数据仪表盘</h2>
          <p>实时监控业务核心指标</p>
        </div>
      </div>
      <el-button type="primary" size="medium" @click="refreshData" :loading="refreshing" icon="el-icon-refresh-right" class="refresh-btn">
        刷新数据
      </el-button>
    </div>

    <!-- 第一行：核心指标卡片 - 增强动效和视觉 -->
    <el-row :gutter="24">
      <el-col :xs="24" :sm="12" :md="6" v-for="(item, index) in coreMetrics" :key="index">
        <el-card shadow="hover" class="metric-card" :body-style="{ padding: '20px' }">
          <div class="metric-icon" :style="{ backgroundColor: item.bgColor }">
            <span class="icon">{{ item.icon }}</span>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ item.value }}</div>
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-trend" v-if="item.trend">
              <i :class="item.trendIcon"></i> {{ item.trend }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第二行：活跃度、库存健康度、订单状态分布 -->
    <el-row :gutter="24" style="margin-top: 24px;">
      <el-col :xs="24" :md="12" :lg="8">
        <el-card shadow="hover" class="analytics-card">
          <template #header>
            <div class="card-header">
              <span>👥 客户活跃度</span>
              <el-tag size="mini" type="success">本月活跃</el-tag>
            </div>
          </template>
          <div class="active-container">
            <el-progress
              type="circle"
              :percentage="activeCustomerPercent"
              :format="() => `${activeCustomerCount} / ${totalCustomers}`"
              :width="140"
              :stroke-width="8"
              color="#5E7CE2"
            />
            <div class="active-stats">
              <div class="stat-item">
                <span class="label">活跃率</span>
                <span class="number">{{ activeCustomerPercent }}%</span>
              </div>
              <div class="stat-item">
                <span class="label">总客户</span>
                <span class="number">{{ totalCustomers }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12" :lg="8">
        <el-card shadow="hover" class="analytics-card">
          <template #header>
            <div class="card-header">
              <span>📦 商品库存健康度</span>
              <el-tag size="mini" type="warning">动态监控</el-tag>
            </div>
          </template>
          <div class="stock-health">
            <div class="stock-info">
              <div class="info-label">
                <span class="dot healthy"></span> 健康库存 (≥100)
              </div>
              <el-progress :percentage="healthyStockPercent" :color="'#67C23A'" :stroke-width="8" />
            </div>
            <div class="stock-info">
              <div class="info-label">
                <span class="dot warning"></span> 预警库存 (50-99)
              </div>
              <el-progress :percentage="warningStockPercent" :color="'#E6A23C'" :stroke-width="8" />
            </div>
            <div class="stock-info">
              <div class="info-label">
                <span class="dot danger"></span> 低库存 (&lt;50)
              </div>
              <el-progress :percentage="lowStockPercent" :color="'#F56C6C'" :stroke-width="8" />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12" :lg="8">
        <el-card shadow="hover" class="analytics-card">
          <template #header>
            <div class="card-header">
              <span>📋 订单状态分布</span>
              <el-tag size="mini" type="info">实时统计</el-tag>
            </div>
          </template>
          <div class="order-status">
            <div v-for="(item, idx) in orderStatusStats" :key="idx" class="status-item">
              <div class="status-label">
                <span class="status-name">{{ item.label }}</span>
                <span class="status-count">{{ item.count }}单</span>
              </div>
              <el-progress
                :percentage="item.percent"
                :color="item.color"
                :stroke-width="8"
                :format="() => ''"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第三行：销售趋势 + 库存预警清单 -->
    <el-row :gutter="24" style="margin-top: 24px;">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>📈 近7天销售趋势（销售额）</span>
              <el-button type="text" size="small" @click="refreshSalesChart" icon="el-icon-refresh">刷新</el-button>
            </div>
          </template>
          <div id="salesTrendChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="warning-card">
          <template #header>
            <div class="card-header">
              <span>⚠️ 库存预警商品</span>
              <el-tag size="mini" type="danger">低库存 TOP5</el-tag>
            </div>
          </template>
          <el-table :data="lowStockProducts" size="medium" stripe style="width:100%" :show-header="true" class="warning-table">
            <el-table-column prop="name" label="商品名称" show-overflow-tooltip>
              <template #default="scope">
                <div class="product-name-cell">
                  <span class="warning-dot"></span>
                  {{ scope.row.name }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="stock" label="库存" width="80" align="center">
              <template #default="scope">
                <span class="stock-number" :class="{'critical': scope.row.stock < 20}">{{ scope.row.stock }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="scope">
                <el-button type="text" size="small" @click="gotoInventory(scope.row)" class="view-btn">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="lowStockProducts.length === 0" class="empty-state">
            <i class="el-icon-check"></i> 暂无低库存商品，库存健康
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第四行：热门商品排行 + 新增商品趋势 -->
    <el-row :gutter="24" style="margin-top: 24px; margin-bottom: 20px;">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="ranking-card">
          <template #header>
            <div class="card-header">
              <span>🔥 热门商品排行</span>
              <span class="subtitle">按销量排序</span>
            </div>
          </template>
          <el-table :data="hotProducts" size="medium" stripe class="ranking-table" :show-header="true">
            <el-table-column prop="rank" label="排名" width="70" align="center">
              <template #default="scope">
                <div class="rank-badge" :class="'rank-' + scope.row.rank">
                  {{ scope.row.rank }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="商品名称" show-overflow-tooltip />
            <el-table-column prop="soldCount" label="销量" width="100" align="center">
              <template #default="scope">
                <span class="sold-count">{{ scope.row.soldCount }}</span>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="hotProducts.length === 0" class="empty-state">
            <i class="el-icon-sold-out"></i> 暂无销售数据
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>📊 最近7天新增商品趋势</span>
              <el-tag size="mini" type="success">模拟数据</el-tag>
            </div>
          </template>
          <div id="productTrendChart" class="chart-container" style="height: 280px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import * as echarts from 'echarts'

export default {
  name: 'AppDashboard',
  data() {
    return {
      refreshing: false,
      salesChart: null,
      productChart: null
    }
  },
  computed: {
    ...mapState('product', {
      productList: 'list',
      productTotal: 'total'
    }),
    ...mapGetters('product', ['lowStockCount']),
    ...mapState('customer', ['list']),
    ...mapState('user', {
      userList: 'list',
      userTotal: 'total'
    }),
    ...mapState('order', {
      orderList: 'list'
    }),
    // 核心指标数据（用于美化展示）
    coreMetrics() {
      return [
        { icon: '📦', label: '总商品数', value: this.totalProducts, bgColor: '#E8F4FD', trend: null },
        { icon: '👥', label: '总客户数', value: this.totalCustomers, bgColor: '#FFF0E6', trend: null },
        { icon: '💰', label: '总销售额', value: `¥ ${this.totalSales.toFixed(2)}`, bgColor: '#E6F7EC', trend: '+12% 较上周' },
        { icon: '📋', label: '订单总数', value: this.orderCount, bgColor: '#F4E8FF', trend: null }
      ]
    },
    totalProducts() {
      return this.productList?.length || 0
    },
    totalCustomers() {
      return this.list?.length || 0
    },
    totalUsers() {
      return this.userList?.length || 0
    },
    totalSales() {
      if (!this.orderList) return 0
      return this.orderList
        .filter(order => order.status !== 'cancelled')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    },
    orderCount() {
      return this.orderList?.length || 0
    },
    activeCustomerCount() {
      return this.list?.filter(c => c.status === 'active').length || 0
    },
    activeCustomerPercent() {
      if (this.totalCustomers === 0) return 0
      return Math.round((this.activeCustomerCount / this.totalCustomers) * 100)
    },
    healthyStockCount() {
      return this.productList?.filter(p => p.stock >= 100).length || 0
    },
    warningStockCount() {
      return this.productList?.filter(p => p.stock >= 50 && p.stock < 100).length || 0
    },
    healthyStockPercent() {
      if (this.totalProducts === 0) return 0
      return Math.round((this.healthyStockCount / this.totalProducts) * 100)
    },
    warningStockPercent() {
      if (this.totalProducts === 0) return 0
      return Math.round((this.warningStockCount / this.totalProducts) * 100)
    },
    lowStockPercent() {
      if (this.totalProducts === 0) return 0
      return Math.round((this.lowStockCount / this.totalProducts) * 100)
    },
    orderStatusStats() {
      const statusMap = {
        pending: { label: '待付款', color: '#E6A23C' },
        paid: { label: '已付款', color: '#409EFF' },
        shipped: { label: '已发货', color: '#67C23A' },
        completed: { label: '已完成', color: '#909399' },
        cancelled: { label: '已取消', color: '#F56C6C' }
      }
      const counts = {}
      this.orderList?.forEach(order => {
        counts[order.status] = (counts[order.status] || 0) + 1
      })
      const total = this.orderCount || 1
      return Object.entries(counts).map(([status, count]) => ({
        label: statusMap[status]?.label || status,
        count,
        percent: Math.round((count / total) * 100),
        color: statusMap[status]?.color || '#909399'
      }))
    },
    lowStockProducts() {
      if (!this.productList) return []
      return this.productList
        .filter(p => p.stock < 50)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5)
        .map(p => ({ id: p.id, name: p.name, stock: p.stock, threshold: 50 }))
    },
    hotProducts() {
      if (!this.orderList) return []
      let allItems = []
      this.orderList.forEach(order => {
        if (order.items && order.items.length) {
          allItems.push(...order.items)
        }
      })
      const salesMap = new Map()
      allItems.forEach(item => {
        const pid = item.productId
        const existing = salesMap.get(pid) || { name: item.productName, soldCount: 0 }
        existing.soldCount += item.quantity
        salesMap.set(pid, existing)
      })
      return Array.from(salesMap.values())
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 5)
        .map((item, idx) => ({ rank: idx + 1, ...item }))
    }
  },
  mounted() {
    this.initCharts()
    this.loadData()
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    if (this.salesChart) this.salesChart.dispose()
    if (this.productChart) this.productChart.dispose()
  },
  methods: {
    ...mapActions('product', ['fetchProducts']),
    ...mapActions('customer', ['fetchCustomers']),
    ...mapActions('user', ['fetchUsers']),
    ...mapActions('order', ['fetchOrders']),
    handleResize() {
      if (this.salesChart) this.salesChart.resize()
      if (this.productChart) this.productChart.resize()
    },
    async loadData() {
      try {
        await Promise.all([
          this.fetchProducts({ page: 1, pageSize: 999 }),
          this.fetchCustomers({ page: 1, pageSize: 999 }),
          this.fetchUsers({ page: 1, pageSize: 999 }),
          this.fetchOrders({ page: 1, pageSize: 999 })
        ])
        this.$nextTick(() => {
          this.updateSalesChart()
          this.updateProductChart()
        })
      } catch (error) {
        this.$message.error('数据加载失败')
      }
    },
    async refreshData() {
      this.refreshing = true
      await this.loadData()
      this.refreshing = false
      this.$message.success('数据已刷新')
    },
    refreshSalesChart() {
      this.updateSalesChart()
    },
    initCharts() {
      const salesDom = document.getElementById('salesTrendChart')
      if (salesDom) {
        this.salesChart = echarts.init(salesDom)
      }
      const productDom = document.getElementById('productTrendChart')
      if (productDom) {
        this.productChart = echarts.init(productDom)
        this.updateProductChart()
      }
    },
    updateSalesChart() {
      if (!this.salesChart) return
      if (!this.orderList || this.orderList.length === 0) {
        this.salesChart.setOption({
          title: { text: '暂无销售数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 14 } }
        })
        return
      }
      this.salesChart.setOption({ title: null })
      const days = this.getLast7Days()
      const salesData = days.map(day => {
        const targetDate = new Date(day.full)
        let dailyTotal = 0
        this.orderList.forEach(order => {
          if (order.status === 'cancelled') return
          const orderDate = new Date(order.createTime)
          if (orderDate.toDateString() === targetDate.toDateString()) {
            dailyTotal += order.totalAmount || 0
          }
        })
        return dailyTotal
      })
      const option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>销售额: ¥{c}' },
        grid: { top: 30, left: 50, right: 20, bottom: 20, containLabel: true },
        xAxis: { type: 'category', data: days.map(d => d.label), axisLabel: { rotate: 30, fontWeight: 500 }, axisLine: { lineStyle: { color: '#ccc' } } },
        yAxis: { type: 'value', name: '销售额 (¥)', nameTextStyle: { color: '#666' }, splitLine: { lineStyle: { type: 'dashed' } } },
        series: [{ type: 'line', data: salesData, smooth: true, lineStyle: { color: '#5E7CE2', width: 3 }, areaStyle: { opacity: 0.1, color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#5E7CE2' }, { offset: 1, color: '#ffffff' }
        ]) }, symbol: 'circle', symbolSize: 8, itemStyle: { color: '#5E7CE2', borderColor: '#fff', borderWidth: 2 } }]
      }
      this.salesChart.setOption(option)
    },
    updateProductChart() {
      if (!this.productChart) return
      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      const data = days.map(() => Math.floor(Math.random() * 30) + 5)
      const option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { top: 30, left: 40, right: 10, bottom: 20 },
        xAxis: { type: 'category', data: days, axisLabel: { fontWeight: 500 } },
        yAxis: { type: 'value', name: '新增数量', nameTextStyle: { color: '#666' } },
        series: [{ type: 'bar', data, itemStyle: { borderRadius: [6, 6, 0, 0], color: '#67C23A' }, barWidth: '40%', label: { show: true, position: 'top', color: '#67C23A' } }]
      }
      this.productChart.setOption(option)
    },
    getLast7Days() {
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        days.push({ full: `${year}-${month}-${day}`, label: `${month}/${day}` })
      }
      return days
    },
    gotoInventory(product) {
      this.$router.push({ path: '/stock', query: { productName: product.name } })
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* 头部区域 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  background: white;
  padding: 16px 24px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}
.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}
.title-icon {
  font-size: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  box-shadow: 0 8px 16px -6px rgba(102, 126, 234, 0.3);
}
.title-text h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  background: linear-gradient(135deg, #2d3e50, #1a2a3a);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.title-text p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #7c8a9a;
}
.refresh-btn {
  border-radius: 40px;
  padding: 10px 20px;
  background: linear-gradient(95deg, #5E7CE2 0%, #4A65C0 100%);
  border: none;
  box-shadow: 0 4px 8px rgba(94, 124, 226, 0.2);
}

/* 核心指标卡片 */
.metric-card {
  border-radius: 24px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
  border: 1px solid rgba(0, 0, 0, 0.03);
}
.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 30px -12px rgba(0, 0, 0, 0.12);
}
.metric-icon {
  width: 56px;
  height: 56px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.metric-icon .icon {
  font-size: 28px;
}
.metric-content {
  text-align: left;
}
.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.5px;
  line-height: 1.2;
}
.metric-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 6px;
}
.metric-trend {
  font-size: 12px;
  color: #10b981;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 通用卡片样式 */
.analytics-card, .chart-card, .warning-card, .ranking-card {
  border-radius: 24px;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.04);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  color: #1e293b;
  border-bottom: 1px solid #eff3f8;
  padding-bottom: 12px;
}
.card-header .subtitle {
  font-size: 12px;
  color: #94a3b8;
  font-weight: normal;
}

/* 活跃度圆环样式 */
.active-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}
.active-stats {
  display: flex;
  gap: 32px;
  margin-top: 20px;
}
.stat-item {
  text-align: center;
}
.stat-item .label {
  font-size: 13px;
  color: #6b7280;
}
.stat-item .number {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-left: 6px;
}

/* 库存健康度 */
.stock-health {
  padding: 8px 0;
}
.stock-info {
  margin-bottom: 20px;
}
.info-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 8px;
  font-weight: 500;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 10px;
  display: inline-block;
}
.dot.healthy { background: #67C23A; box-shadow: 0 0 0 2px rgba(103,194,58,0.2);}
.dot.warning { background: #E6A23C; box-shadow: 0 0 0 2px rgba(230,162,60,0.2);}
.dot.danger { background: #F56C6C; box-shadow: 0 0 0 2px rgba(245,108,108,0.2);}

/* 订单状态 */
.order-status {
  padding: 8px 0;
}
.status-item {
  margin-bottom: 18px;
}
.status-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 6px;
}
.status-name {
  font-weight: 500;
}
.status-count {
  color: #5e6f8d;
}

/* 预警表格与产品名称 */
.warning-table ::v-deep .el-table__row {
  transition: background 0.2s;
}
.product-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.warning-dot {
  width: 6px;
  height: 6px;
  background: #F56C6C;
  border-radius: 50%;
  display: inline-block;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0% { opacity: 0.4; transform: scale(0.8);}
  100% { opacity: 1; transform: scale(1.2);}
}
.stock-number.critical {
  color: #F56C6C;
  font-weight: 700;
}
.view-btn {
  color: #5E7CE2;
  font-weight: 500;
}
.empty-state {
  text-align: center;
  padding: 32px;
  color: #9aa6b5;
  font-size: 14px;
}
.empty-state i {
  font-size: 28px;
  margin-bottom: 8px;
  display: block;
}

/* 排名表 */
.ranking-table ::v-deep .el-table__row:hover {
  background-color: #fafbff;
}
.rank-badge {
  width: 28px;
  height: 28px;
  background: #f1f5f9;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
}
.rank-badge.rank-1 { background: #FFD966; color: #8a6300; }
.rank-badge.rank-2 { background: #E2E8F0; color: #475569; }
.rank-badge.rank-3 { background: #E6CCB2; color: #9c6e3e; }
.sold-count {
  font-weight: 600;
  color: #1e293b;
}

/* 图表容器 */
.chart-container {
  height: 340px;
  width: 100%;
}

/* 响应式 */
@media (max-width: 768px) {
  .dashboard {
    padding: 12px;
  }
  .metric-value {
    font-size: 24px;
  }
  .chart-container {
    height: 260px;
  }
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .title-icon {
    width: 44px;
    height: 44px;
  }
}
</style>