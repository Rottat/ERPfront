<template>
  <div class="inventory-report-container">
    <div class="page-header">
      <div class="title-section">
        <div class="title-icon">📊</div>
        <div class="title-text">
          <h2>库存报表</h2>
          <p>库存状态与预警分析</p>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="metric-card">
          <div class="metric-value">{{ summary.totalStock || 0 }}</div>
          <div>总库存量</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="metric-card">
          <div class="metric-value warning">{{ summary.lowStockCount || 0 }}</div>
          <div>低库存商品数</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="metric-card">
          <div class="metric-value">{{ summary.turnoverRate || 0 }}</div>
          <div>库存周转率 <span style="font-size:12px;">(次/月)</span></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top:24px">
      <template #header>库存分布（按仓库）</template>
      <div id="warehouseChart" style="height:300px"></div>
    </el-card>

    <el-card style="margin-top:24px">
      <template #header>低库存预警商品</template>
      <el-table :data="lowStockItems" border>
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column prop="threshold" label="阈值" width="100" />
      </el-table>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'
import * as echarts from 'echarts'

export default {
  name: 'InventoryReport',
  data() {
    return {
      summary: { totalStock: 0, lowStockCount: 0, turnoverRate: 0 },
      lowStockItems: []
    }
  },
  async mounted() {
    await this.fetchSummary()
    await this.fetchWarehouseDistribution()
    await this.fetchLowStock()
  },
  methods: {
    async fetchSummary() {
      try {
        const res = await axios.get('/api/reports/inventory/summary')
        this.summary = res.data.data
      } catch (error) {
        console.error('获取库存汇总失败', error)
      }
    },
    async fetchWarehouseDistribution() {
      try {
        const res = await axios.get('/api/reports/inventory/warehouse-distribution')
        const data = res.data.data
        const chart = echarts.init(document.getElementById('warehouseChart'))
        chart.setOption({
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: data.map(item => item.name) },
          yAxis: { type: 'value', name: '库存数量' },
          series: [{ type: 'bar', data: data.map(item => item.value), itemStyle: { color: '#409EFF' } }]
        })
      } catch (error) {
        console.error('获取仓库分布失败', error)
      }
    },
    async fetchLowStock() {
      try {
        const res = await axios.get('/api/reports/inventory/low-stock')
        this.lowStockItems = res.data.data
      } catch (error) {
        console.error('获取低库存商品失败', error)
      }
    }
  }
}
</script>

<style scoped>
.inventory-report-container { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { margin-bottom: 24px; }
.title-section { display: flex; align-items: center; gap: 16px; }
.title-icon { width: 52px; height: 52px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 10px 15px -6px rgba(59,130,246,0.3); }
.title-text h2 { margin: 0; font-size: 26px; font-weight: 600; color: #0f172a; }
.title-text p { margin: 4px 0 0; font-size: 14px; color: #64748b; }
.metric-card { text-align: center; border-radius: 20px; }
.metric-value { font-size: 32px; font-weight: bold; margin-bottom: 8px; }
.warning { color: #f56c6c; }
</style>