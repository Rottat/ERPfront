<template>
  <div class="finance-container">
    <div class="page-header">
      <div class="title-section">
        <div class="title-icon">💰</div>
        <div class="title-text">
          <h2>财务看板</h2>
          <p>实时监控财务状况与收支趋势</p>
        </div>
      </div>
    </div>

    <el-row :gutter="24">
      <el-col :xs="24" :sm="12" :md="6" v-for="item in metrics" :key="item.label">
        <el-card shadow="hover" class="metric-card" :body-style="{ padding: '20px' }">
          <div class="metric-icon" :style="{ backgroundColor: item.bgColor }">
            <i :class="item.icon"></i>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ item.value }}</div>
            <div class="metric-label">{{ item.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="chart-card" shadow="hover" style="margin-top: 24px;">
      <template #header>
        <div class="card-header">
          <span>📈 近7天收支趋势</span>
          <el-radio-group v-model="chartType" size="small">
            <el-radio-button label="income">收入</el-radio-button>
            <el-radio-button label="expense">支出</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div id="trendChart" style="height: 350px;"></div>
    </el-card>

    <el-row :gutter="24" style="margin-top: 24px;">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="pie-card">
          <template #header>
            <div class="card-header">收入分类占比</div>
          </template>
          <div id="incomePieChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="pie-card">
          <template #header>
            <div class="card-header">支出分类占比</div>
          </template>
          <div id="expensePieChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import axios from 'axios'

export default {
  name: 'FinanceDashboard',
  data() {
    return {
      chartType: 'income',
      trendChart: null,
      incomePieChart: null,
      expensePieChart: null,
      metrics: [
        { label: '总收入', value: '¥ 0', icon: 'el-icon-arrow-up', bgColor: '#E6F7EC' },
        { label: '总支出', value: '¥ 0', icon: 'el-icon-arrow-down', bgColor: '#FEF2E8' },
        { label: '净利润', value: '¥ 0', icon: 'el-icon-pie-chart', bgColor: '#E8F4FD' },
        { label: '待收款', value: '¥ 0', icon: 'el-icon-time', bgColor: '#FFF4E6' }
      ],
      trendData: { dates: [], income: [], expense: [] }
    }
  },
  async mounted() {
    await this.fetchMetrics()
    await this.fetchTrend()
    this.initCharts()
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    if (this.trendChart) this.trendChart.dispose()
    if (this.incomePieChart) this.incomePieChart.dispose()
    if (this.expensePieChart) this.expensePieChart.dispose()
  },
  methods: {
    async fetchMetrics() {
      try {
        const res = await axios.get('/api/finance/metrics')
        const data = res.data.data
        this.metrics[0].value = `¥ ${data.totalIncome.toFixed(2)}`
        this.metrics[1].value = `¥ ${data.totalExpense.toFixed(2)}`
        this.metrics[2].value = `¥ ${data.profit.toFixed(2)}`
        this.metrics[3].value = `¥ ${data.pendingIncome.toFixed(2)}`
      } catch (error) {
        console.error('获取指标失败', error)
      }
    },
    async fetchTrend() {
      try {
        const res = await axios.get('/api/finance/trend')
        this.trendData = res.data.data
      } catch (error) {
        console.error('获取趋势失败', error)
      }
    },
    initCharts() {
      this.trendChart = echarts.init(document.getElementById('trendChart'))
      this.updateTrendChart()
      this.incomePieChart = echarts.init(document.getElementById('incomePieChart'))
      this.expensePieChart = echarts.init(document.getElementById('expensePieChart'))
      this.updatePieCharts()
    },
    updateTrendChart() {
      const dates = this.trendData.dates || []
      const data = this.chartType === 'income' ? this.trendData.income : this.trendData.expense
      const option = {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: dates },
        yAxis: { type: 'value', name: '金额 (¥)' },
        series: [{
          type: 'line',
          data: data,
          smooth: true,
          lineStyle: { color: this.chartType === 'income' ? '#67C23A' : '#F56C6C', width: 3 },
          areaStyle: { opacity: 0.1 },
          symbol: 'circle',
          symbolSize: 8
        }]
      }
      this.trendChart.setOption(option)
    },
    async updatePieCharts() {
      // 此处分类数据仍可使用静态模拟，也可以增加 API 获取，为简化暂用固定数据
      this.incomePieChart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie', radius: '55%',
          data: [
            { name: '销售收入', value: 85600 },
            { name: '服务收入', value: 32600 },
            { name: '其他收入', value: 10400 }
          ],
          label: { show: true, formatter: '{b}: {d}%' }
        }]
      })
      this.expensePieChart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie', radius: '55%',
          data: [
            { name: '采购成本', value: 45800 },
            { name: '人力成本', value: 18600 },
            { name: '运营费用', value: 11920 }
          ],
          label: { show: true, formatter: '{b}: {d}%' }
        }]
      })
    },
    handleResize() {
      if (this.trendChart) this.trendChart.resize()
      if (this.incomePieChart) this.incomePieChart.resize()
      if (this.expensePieChart) this.expensePieChart.resize()
    }
  },
  watch: {
    chartType() {
      this.updateTrendChart()
    }
  }
}
</script>

<style scoped>
/* 样式与之前相同，省略 */
.finance-container { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { margin-bottom: 24px; }
.title-section { display: flex; align-items: center; gap: 16px; }
.title-icon { width: 52px; height: 52px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 10px 15px -6px rgba(245, 158, 11, 0.3); }
.title-text h2 { margin: 0; font-size: 26px; font-weight: 600; color: #0f172a; }
.title-text p { margin: 4px 0 0; font-size: 14px; color: #64748b; }
.metric-card { border-radius: 24px; transition: all 0.3s; }
.metric-card:hover { transform: translateY(-4px); box-shadow: 0 20px 30px -12px rgba(0,0,0,0.12); }
.metric-icon { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px; }
.metric-value { font-size: 28px; font-weight: 700; color: #1e293b; }
.metric-label { font-size: 14px; color: #64748b; margin-top: 8px; }
.chart-card, .pie-card { border-radius: 24px; border: 1px solid #eef2f6; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.02); }
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
</style>