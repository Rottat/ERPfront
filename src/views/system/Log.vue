<template>
  <div class="log-container">
    <div class="page-header">
      <div class="title-icon">📋</div>
      <div class="title-text">
        <h2>操作日志</h2>
        <p>用户操作记录</p>
      </div>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="用户">
          <el-input v-model="searchForm.username" placeholder="用户名" clearable />
        </el-form-item>
        <el-form-item label="操作">
          <el-input v-model="searchForm.action" placeholder="操作类型" clearable />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="logs" border>
        <el-table-column prop="time" label="时间" width="160" />
        <el-table-column prop="user" label="用户" width="100" />
        <el-table-column prop="action" label="操作" width="120" />
        <el-table-column prop="detail" label="详情" min-width="200" />
        <el-table-column prop="ip" label="IP" width="140" />
      </el-table>
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :current-page="page"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
        style="margin-top:20px"
      />
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'OperationLog',
  data() {
    return {
      searchForm: { username: '', action: '' },
      dateRange: [],
      page: 1,
      pageSize: 10,
      total: 0,
      logs: []
    }
  },
  mounted() {
    this.fetchLogs()
  },
  methods: {
    async fetchLogs() {
      const params = {
        page: this.page,
        pageSize: this.pageSize,
        username: this.searchForm.username,
        action: this.searchForm.action,
        startDate: this.dateRange ? this.dateRange[0] : '',
        endDate: this.dateRange ? this.dateRange[1] : ''
      }
      const res = await axios.get('/api/logs', { params })
      this.logs = res.data.data.list
      this.total = res.data.data.total
    },
    handleSearch() {
      this.page = 1
      this.fetchLogs()
    },
    resetSearch() {
      this.searchForm = { username: '', action: '' }
      this.dateRange = []
      this.page = 1
      this.fetchLogs()
    },
    handlePageChange(page) {
      this.page = page
      this.fetchLogs()
    },
    handleSizeChange(size) {
      this.pageSize = size
      this.page = 1
      this.fetchLogs()
    }
  }
}
</script>

<style scoped>
.log-container { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { margin-bottom: 24px;   display: flex;
  align-items: center;
  gap: 16px;}
.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}
.title-icon {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #f50b0b, #f73404);
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
.filter-card { margin-bottom: 20px; border-radius: 20px; }
</style>