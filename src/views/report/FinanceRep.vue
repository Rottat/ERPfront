<template>
  <div class="finance-report-container">
    <div class="page-header">
      <div class="title-section">
        <div class="title-icon">💰</div>
        <div class="title-text">
          <h2>财务报表</h2>
          <p>利润表与收支明细</p>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="metric-card">
          <div class="metric-value">¥ {{ profitData.totalIncome?.toFixed(2) || 0 }}</div>
          <div>总收入</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="metric-card">
          <div class="metric-value warning">¥ {{ profitData.totalExpense?.toFixed(2) || 0 }}</div>
          <div>总支出</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="metric-card">
          <div class="metric-value">¥ {{ profitData.profit?.toFixed(2) || 0 }}</div>
          <div>净利润</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top:24px">
      <template #header>近7天收支趋势</template>
      <div id="profitChart" style="height:350px"></div>
    </el-card>

    <el-card style="margin-top:24px">
      <template #header>最新收支明细</template>
      <el-table :data="records" border>
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'income' ? 'success' : 'danger'" effect="plain">
              {{ scope.row.type === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="scope">¥ {{ scope.row.amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="description" label="备注" min-width="150" show-overflow-tooltip />
      </el-table>
      <div class="pagination-wrapper" style="margin-top:16px; text-align:right">
        <el-pagination background layout="prev, pager, next" :total="recordTotal" :page-size="5" @current-change="loadRecords" />
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'
import * as echarts from 'echarts'

export default {
  name: 'FinanceReport',
  data() {
    return {
      profitData: {},
      records: [],
      recordTotal: 0,
      page: 1
    }
  },
  async mounted() {
    await this.fetchProfit()
    await this.fetchTrend()
    await this.loadRecords(1)
  },
  methods: {
    async fetchProfit() {
      try {
        const res = await axios.get('/api/reports/finance/profit')
        this.profitData = res.data.data
      } catch (error) {
        console.error('获取利润数据失败', error)
      }
    },
    async fetchTrend() {
      try {
        const res = await axios.get('/api/reports/finance/trend')
        const { dates, income, expense } = res.data.data
        const chart = echarts.init(document.getElementById('profitChart'))
        chart.setOption({
          tooltip: { trigger: 'axis' },
          legend: { data: ['收入', '支出'] },
          xAxis: { type: 'category', data: dates },
          yAxis: { type: 'value', name: '金额 (¥)' },
          series: [
            { name: '收入', type: 'line', data: income, smooth: true, lineStyle: { color: '#67C23A' } },
            { name: '支出', type: 'line', data: expense, smooth: true, lineStyle: { color: '#F56C6C' } }
          ]
        })
      } catch (error) {
        console.error('获取趋势数据失败', error)
      }
    },
    async loadRecords(page = 1) {
      this.page = page
      try {
        const res = await axios.get('/api/reports/finance/records', { params: { page: this.page, pageSize: 5 } })
        this.records = res.data.data.list
        this.recordTotal = res.data.data.total
      } catch (error) {
        console.error('获取收支明细失败', error)
      }
    }
  }
}
</script>

<style scoped>
.finance-report-container { padding: 24px; background: #f5f7fb; min-height: 100vh; }
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
.metric-card { text-align: center; border-radius: 20px; }
.metric-value { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
.warning { color: #f56c6c; }
</style>