<template>
  <div class="records-container">
    <div class="page-header">
      <div class="title-section">
        <div class="title-icon">📋</div>
        <div class="title-text">
          <h2>收支记录</h2>
          <p>管理所有收入与支出流水</p>
        </div>
      </div>
    </div>

    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="searchForm" size="default">
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 100px">
            <el-option label="收入" value="income" />
            <el-option label="支出" value="expense" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="searchForm.category" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" icon="el-icon-search">查询</el-button>
          <el-button @click="resetSearch" icon="el-icon-refresh-right">重置</el-button>
          <el-button type="success" @click="handleAdd" icon="el-icon-plus">新增记录</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe class="records-table" :header-cell-style="{ background: '#f8fafc', fontWeight: '600' }">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="type" label="类型" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'income' ? 'success' : 'danger'" effect="plain">
              {{ scope.row.type === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="scope">
            <span :style="{ color: scope.row.type === 'income' ? '#67C23A' : '#F56C6C' }">
              {{ scope.row.type === 'income' ? '+' : '-' }} ¥ {{ scope.row.amount.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="备注" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="mini" @click="handleEdit(scope.row)" icon="el-icon-edit" circle />
            <el-button type="danger" size="mini" @click="handleDelete(scope.row.id)" icon="el-icon-delete" circle />
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :current-page="page"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog :title="dialogTitle" :visible="dialogVisible" @update:visible="val => dialogVisible = val" width="500px" class="record-dialog" :close-on-click-modal="false">
      <el-form :model="form" :rules="formRules" ref="recordForm" label-width="80px">
        <el-form-item label="日期" prop="date">
          <el-date-picker v-model="form.date" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" style="width: 100%" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio label="income">收入</el-radio>
            <el-radio label="expense">支出</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-input v-model="form.category" placeholder="如：销售收入、采购成本" />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :precision="2" :min="0" :step="100" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input v-model="form.description" type="textarea" rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveRecord" :loading="saving">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'FinanceRecords',
  data() {
    return {
      searchForm: { type: '', category: '' },
      dateRange: [],
      page: 1,
      pageSize: 10,
      loading: false,
      total: 0,
      tableData: [],
      dialogVisible: false,
      editId: null,
      saving: false,
      form: { date: '', type: 'income', category: '', amount: 0, description: '' },
      formRules: {
        date: [{ required: true, message: '请选择日期', trigger: 'change' }],
        category: [{ required: true, message: '请输入分类', trigger: 'blur' }],
        amount: [{ required: true, type: 'number', min: 0.01, message: '请输入金额', trigger: 'blur' }]
      }
    }
  },
  computed: {
    dialogTitle() {
      return this.editId ? '编辑收支记录' : '新增收支记录'
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const params = {
          page: this.page,
          pageSize: this.pageSize,
          type: this.searchForm.type || undefined,
          category: this.searchForm.category || undefined,
          startDate: this.dateRange ? this.dateRange[0] : undefined,
          endDate: this.dateRange ? this.dateRange[1] : undefined
        }
        const res = await axios.get('/api/finance/records', { params })
        this.tableData = res.data.data.list
        this.total = res.data.data.total
      } catch (error) {
        console.error('获取记录失败', error)
        this.$message.error('加载数据失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() { this.page = 1; this.fetchData() },
    resetSearch() {
      this.searchForm = { type: '', category: '' }
      this.dateRange = []
      this.page = 1
      this.fetchData()
    },
    handleAdd() {
      this.editId = null
      this.form = { date: new Date().toISOString().slice(0,10), type: 'income', category: '', amount: 0, description: '' }
      this.dialogVisible = true
      this.$nextTick(() => { if (this.$refs.recordForm) this.$refs.recordForm.clearValidate() })
    },
    handleEdit(row) {
      this.editId = row.id
      this.form = { ...row }
      this.dialogVisible = true
      this.$nextTick(() => { if (this.$refs.recordForm) this.$refs.recordForm.clearValidate() })
    },
    async handleDelete(id) {
      try {
        await this.$confirm('确认删除该记录吗？', '提示', { type: 'warning' })
        await axios.delete(`/api/finance/records/${id}`)
        this.$message.success('删除成功')
        this.fetchData()
      } catch (error) {
        if (error !== 'cancel') {
          console.error(error)
          this.$message.error('删除失败')
        }
      }
    },
    async saveRecord() {
      try {
        await this.$refs.recordForm.validate()
        this.saving = true
        if (this.editId) {
          await axios.put(`/api/finance/records/${this.editId}`, this.form)
          this.$message.success('修改成功')
        } else {
          await axios.post('/api/finance/records', this.form)
          this.$message.success('新增成功')
        }
        this.dialogVisible = false
        this.fetchData()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('保存失败，请重试')
        }
      } finally {
        this.saving = false
      }
    },
    handlePageChange(page) { this.page = page; this.fetchData() },
    handleSizeChange(size) { this.pageSize = size; this.page = 1; this.fetchData() }
  }
}
</script>

<style scoped>
/* 样式与之前相同，为节省篇幅不再重复，可复制之前的样式 */
.records-container { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { margin-bottom: 24px; }
.title-section { display: flex; align-items: center; gap: 16px; }
.title-icon { width: 52px; height: 52px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 10px 15px -6px rgba(59,130,246,0.3); }
.title-text h2 { margin: 0; font-size: 26px; font-weight: 600; color: #0f172a; }
.title-text p { margin: 4px 0 0; font-size: 14px; color: #64748b; }
.filter-card, .table-card { border-radius: 24px; border: none; margin-bottom: 24px; }
.records-table { border-radius: 20px; }
.pagination-wrapper { margin-top: 24px; display: flex; justify-content: flex-end; }
.record-dialog ::v-deep .el-dialog { border-radius: 28px; }
.dialog-footer { text-align: right; }
</style>