<template>
  <div class="employee-container">
    <div class="page-header">
      <div class="title-section">
        <div class="title-icon">👥</div>
        <div class="title-text">
          <h2>员工管理</h2>
          <p>管理公司员工信息与职位</p>
        </div>
      </div>
    </div>

    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="searchForm" size="default">
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="searchForm.department" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="searchForm.position" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" icon="el-icon-search">查询</el-button>
          <el-button @click="resetSearch" icon="el-icon-refresh-right">重置</el-button>
          <el-button type="success" @click="handleAdd" icon="el-icon-plus">新增员工</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe class="employee-table" :header-cell-style="{ background: '#f8fafc', fontWeight: '600' }">
        <el-table-column prop="id" label="工号" width="80" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="职位" width="120" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="hireDate" label="入职日期" width="120" />
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

    <el-dialog :title="dialogTitle" :visible="dialogVisible" @update:visible="val => dialogVisible = val" width="520px" class="employee-dialog" :close-on-click-modal="false">
      <el-form :model="form" :rules="formRules" ref="employeeForm" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input v-model="form.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="职位" prop="position">
          <el-input v-model="form.position" placeholder="请输入职位" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="入职日期" prop="hireDate">
          <el-date-picker v-model="form.hireDate" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEmployee" :loading="saving">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'EmployeeManagement',
  data() {
    return {
      searchForm: { name: '', department: '', position: '' },
      page: 1,
      pageSize: 10,
      loading: false,
      total: 0,
      tableData: [],
      dialogVisible: false,
      editId: null,
      saving: false,
      form: { name: '', department: '', position: '', phone: '', email: '', hireDate: '' },
      formRules: {
        name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        department: [{ required: true, message: '请输入部门', trigger: 'blur' }],
        position: [{ required: true, message: '请输入职位', trigger: 'blur' }],
        phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
        email: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }],
        hireDate: [{ required: true, message: '请选择入职日期', trigger: 'change' }]
      }
    }
  },
  computed: {
    dialogTitle() {
      return this.editId ? '编辑员工' : '新增员工'
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
          name: this.searchForm.name || undefined,
          department: this.searchForm.department || undefined,
          position: this.searchForm.position || undefined
        }
        const res = await axios.get('/api/employees', { params })
        this.tableData = res.data.data.list
        this.total = res.data.data.total
      } catch (error) {
        console.error('获取员工列表失败', error)
        this.$message.error('加载数据失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() { this.page = 1; this.fetchData() },
    resetSearch() {
      this.searchForm = { name: '', department: '', position: '' }
      this.page = 1
      this.fetchData()
    },
    handleAdd() {
      this.editId = null
      this.form = { name: '', department: '', position: '', phone: '', email: '', hireDate: '' }
      this.dialogVisible = true
      this.$nextTick(() => { if (this.$refs.employeeForm) this.$refs.employeeForm.clearValidate() })
    },
    handleEdit(row) {
      this.editId = row.id
      this.form = { ...row }
      this.dialogVisible = true
      this.$nextTick(() => { if (this.$refs.employeeForm) this.$refs.employeeForm.clearValidate() })
    },
    async handleDelete(id) {
      try {
        await this.$confirm('确认删除该员工吗？', '提示', { type: 'warning' })
        await axios.delete(`/api/employees/${id}`)
        this.$message.success('删除成功')
        this.fetchData()
      } catch (error) {
        if (error !== 'cancel') {
          console.error(error)
          this.$message.error('删除失败')
        }
      }
    },
    async saveEmployee() {
      try {
        await this.$refs.employeeForm.validate()
        this.saving = true
        if (this.editId) {
          await axios.put(`/api/employees/${this.editId}`, this.form)
          this.$message.success('修改成功')
        } else {
          await axios.post('/api/employees', this.form)
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
/* 样式可复用之前提供的员工管理样式 */
.employee-container { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { margin-bottom: 24px; }
.title-section { display: flex; align-items: center; gap: 16px; }
.title-icon { width: 52px; height: 52px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 10px 15px -6px rgba(139,92,246,0.3); }
.title-text h2 { margin: 0; font-size: 26px; font-weight: 600; color: #0f172a; }
.title-text p { margin: 4px 0 0; font-size: 14px; color: #64748b; }
.filter-card, .table-card { border-radius: 24px; border: none; margin-bottom: 24px; }
.employee-table { border-radius: 20px; }
.pagination-wrapper { margin-top: 24px; display: flex; justify-content: flex-end; }
.employee-dialog ::v-deep .el-dialog { border-radius: 28px; }
.dialog-footer { text-align: right; }
</style>