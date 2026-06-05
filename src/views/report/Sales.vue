<template>
  <div class="sales-report-container">
    <div class="page-header">
      <div class="title-section">
        <div class="title-icon">📈</div>
        <div class="title-text">
          <h2>销售报表</h2>
          <p>销售业绩分析与商品排行</p>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="6"><el-card class="metric-card"><div class="metric-value">¥ 128,560</div><div>总销售额</div></el-card></el-col>
      <el-col :span="6"><el-card class="metric-card"><div class="metric-value">¥ 23,450</div><div>待收款</div></el-card></el-col>
      <el-col :span="6"><el-card class="metric-card"><div class="metric-value">856</div><div>订单总数</div></el-card></el-col>
      <el-col :span="6"><el-card class="metric-card"><div class="metric-value">12.5%</div><div>环比增长</div></el-card></el-col>
    </el-row>

    <el-card class="chart-card" style="margin-top:24px">
      <template #header><div class="card-header">近30天销售额趋势</div></template>
      <div id="salesTrend" style="height:350px"></div>
    </el-card>

    <el-card class="table-card" style="margin-top:24px">
      <template #header><div class="card-header">热销商品 TOP10</div></template>
      <el-table :data="hotProducts" border stripe>
        <el-table-column prop="rank" label="排名" width="80" />
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="soldCount" label="销量" width="120" />
        <el-table-column prop="amount" label="销售额" width="150" />
      </el-table>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios';
import * as echarts from 'echarts'
export default {
  name: 'SalesReport',
  data() {
    return {
      summary: { totalSales: 0, paidSales: 0, orderCount: 0, monthGrowth: 0 },
      hotProducts: []
    }
  },
  async mounted() {
    await this.fetchSummary()
    await this.fetchTopProducts()
    this.initTrendChart()
  },
 methods: {
    async fetchSummary() {
      const res = await axios.get('/api/reports/sales/summary')
      this.summary = res.data.data
    },
    async fetchTopProducts() {
      const res = await axios.get('/api/reports/sales/top-products')
      this.hotProducts = res.data.data.map((item, idx) => ({ rank: idx+1, ...item }))
    },
    async initTrendChart() {
      const res = await axios.get('/api/reports/sales/trend')
      const chart = echarts.init(document.getElementById('salesTrend'))
      chart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: res.data.data.days },
        yAxis: { type: 'value', name: '销售额 (¥)' },
        series: [{ type: 'line', data: res.data.data.trend, smooth: true }]
      })
    }
  }
}
</script>
<style scoped>
.sales-report-container { padding: 24px; background: #f5f7fb; }
.metric-card { text-align: center; border-radius: 20px; }
.metric-value { font-size: 28px; font-weight: 700; color: #1e293b; }
.chart-card, .table-card { border-radius: 24px; }
.card-header { font-weight: 600; }
.page-header { margin-bottom: 24px; }
.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}
.title-icon {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 10px 15px -6px rgba(245, 158, 11, 0.3);
}
.title-text h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  color: #0f172a;
}
.title-text p {
  margin: 4px 0 0;
  font-size: 14px;
  color: #64748b;
}
</style>