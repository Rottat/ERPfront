<template>
  <div class="supplier-container">
    <div class="page-header">
      <div class="title-section">
        <div class="title-icon">🏭</div>
        <div class="title-text">
          <h2>供应商管理</h2>
          <p>管理供应商信息与合作状态</p>
        </div>
      </div>
    </div>

    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="searchForm" size="default">
        <el-form-item label="供应商名称">
          <el-input v-model="searchForm.name" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="searchForm.contact" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 100px">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" icon="el-icon-search">查询</el-button>
          <el-button @click="resetSearch" icon="el-icon-refresh-right">重置</el-button>
          <el-button type="success" @click="handleAdd" icon="el-icon-plus">新增供应商</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe class="supplier-table" :header-cell-style="{ background: '#f8fafc', fontWeight: '600' }">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="供应商名称" min-width="150" />
        <el-table-column prop="contact" label="联系人" width="100" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'" effect="plain">
              {{ scope.row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="mini" @click="handleEdit(scope.row)" icon="el-icon-edit" circle />
            <el-button type="danger" size="mini" @click="handleDelete(scope.row.id)" icon="el-icon-delete" circle />
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total" :current-page="page" :page-size="pageSize" :page-sizes="[10, 20, 50]" @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </el-card>

    <el-dialog :title="dialogTitle" :visible="dialogVisible" @update:visible="val => dialogVisible = val" width="560px" class="supplier-dialog" :close-on-click-modal="false">
      <el-form :model="form" :rules="formRules" ref="supplierForm" label-width="100px">
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" type="textarea" rows="2" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSupplier" :loading="saving">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'SupplierManagement',
  data() {
    return {
      searchForm: { name: '', contact: '', status: '' },
      page: 1,
      pageSize: 10,
      loading: false,
      total: 0,
      tableData: [],
      dialogVisible: false,
      editId: null,
      saving: false,
      form: { name: '', contact: '', phone: '', email: '', address: '', status: 'active' },
      formRules: {
        name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
        contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
        phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
        email: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }]
      }
    }
  },
  computed: {
    dialogTitle() {
      return this.editId ? '编辑供应商' : '新增供应商'
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const params = {
          page: this.page,
          pageSize: this.pageSize,
          name: this.searchForm.name,
          contact: this.searchForm.contact,
          status: this.searchForm.status
        }
        const res = await axios.get('/api/suppliers', { params })
        this.tableData = res.data.data.list
        this.total = res.data.data.total
      } catch (error) {
        console.error('获取供应商列表失败', error)
        this.$message.error('加载数据失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.page = 1
      this.fetchData()
    },
    resetSearch() {
      this.searchForm = { name: '', contact: '', status: '' }
      this.page = 1
      this.fetchData()
    },
    handleAdd() {
      this.editId = null
      this.form = { name: '', contact: '', phone: '', email: '', address: '', status: 'active' }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.supplierForm?.clearValidate())
    },
    handleEdit(row) {
      this.editId = row.id
      this.form = { ...row }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.supplierForm?.clearValidate())
    },
    async handleDelete(id) {
      try {
        await this.$confirm('确认删除该供应商吗？', '提示', { type: 'warning' })
        await axios.delete(`/api/suppliers/${id}`)
        this.$message.success('删除成功')
        this.fetchData()
      } catch (error) {
        if (error !== 'cancel') {
          console.error(error)
          this.$message.error('删除失败')
        }
      }
    },
    async saveSupplier() {
      try {
        await this.$refs.supplierForm.validate()
        this.saving = true
        if (this.editId) {
          await axios.put(`/api/suppliers/${this.editId}`, this.form)
          this.$message.success('修改成功')
        } else {
          await axios.post('/api/suppliers', this.form)
          this.$message.success('新增成功')
        }
        this.dialogVisible = false
        this.fetchData()
      } catch (error) {
        if (error !== 'cancel') {
          console.error(error)
          this.$message.error('保存失败')
        }
      } finally {
        this.saving = false
      }
    },
    handlePageChange(page) {
      this.page = page
      this.fetchData()
    },
    handleSizeChange(size) {
      this.pageSize = size
      this.page = 1
      this.fetchData()
    }
  }
}
</script>

<style scoped>
.supplier-container { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { margin-bottom: 24px; }
.title-section { display: flex; align-items: center; gap: 16px; }
.title-icon { width: 52px; height: 52px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 10px 15px -6px rgba(59,130,246,0.3); }
.title-text h2 { margin: 0; font-size: 26px; font-weight: 600; color: #0f172a; }
.title-text p { margin: 4px 0 0; font-size: 14px; color: #64748b; }
.filter-card, .table-card { border-radius: 24px; border: none; margin-bottom: 24px; }
.supplier-table { border-radius: 20px; }
.pagination-wrapper { margin-top: 24px; display: flex; justify-content: flex-end; }
.supplier-dialog ::v-deep .el-dialog { border-radius: 28px; }
.dialog-footer { text-align: right; }
</style>