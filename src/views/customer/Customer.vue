<template>
  <div class="customer-container">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="title-section">
        <div class="title-icon">👥</div>
        <div class="title-text">
          <h2>客户管理</h2>
          <p>管理您的客户信息与联系记录</p>
        </div>
      </div>
    </div>

    <!-- 筛选卡片 -->
    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="searchForm" size="default">
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.name" placeholder="请输入" clearable prefix-icon="el-icon-search" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="searchForm.contact" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="searchForm.phone" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="statusFilter" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" icon="el-icon-search">查询</el-button>
          <el-button @click="resetSearch" icon="el-icon-refresh-right">重置</el-button>
          <el-button type="success" @click="handleAdd" icon="el-icon-plus">新增客户</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 客户表格卡片 -->
    <el-card class="table-card" shadow="never">
      <div v-if="filteredData.length === 0" class="empty-state">
        <i class="el-icon-user-solid"></i>
        <p>暂无符合条件的客户数据</p>
      </div>
      <el-table
        v-else
        :data="paginatedData"
        border
        stripe
        style="width: 100%"
        class="customer-table"
        :header-cell-style="{ background: '#f8fafc', color: '#1e293b', fontWeight: '600' }"
      >
        <el-table-column prop="id" label="客户ID" width="80" align="center" />
        <el-table-column prop="name" label="客户名称" min-width="130" show-overflow-tooltip />
        <el-table-column prop="contact" label="联系人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="120" />
        <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'" size="small" effect="plain">
              {{ scope.row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="scope">
            <el-button type="primary" size="mini" @click="handleEdit(scope.row)" icon="el-icon-edit" circle />
            <el-button type="info" size="mini" @click="handleView(scope.row)" icon="el-icon-view" circle />
            <el-button type="danger" size="mini" @click="handleDelete(scope.row)" icon="el-icon-delete" circle />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="filteredData.length > 0">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredData.length"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogType === 'add' ? '➕ 新增客户' : '✏️ 编辑客户'"
      :visible="dialogVisible"
      @update:visible="val => dialogVisible = val"
      width="560px"
      class="customer-dialog"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <el-form ref="customerForm" :model="currentCustomer" :rules="formRules" label-width="100px" label-position="left">
        <el-form-item label="客户名称" prop="name">
          <el-input v-model="currentCustomer.name" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="currentCustomer.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="currentCustomer.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="currentCustomer.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="currentCustomer.address" type="textarea" rows="2" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="currentCustomer.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCustomer" :loading="saving">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 客户详情对话框 -->
    <el-dialog
      title="📋 客户详情"
      :visible="detailVisible"
      @update:visible="val => detailVisible = val"
      width="520px"
      class="detail-dialog"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="客户ID">{{ viewCustomer.id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ viewCustomer.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ viewCustomer.contact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ viewCustomer.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ viewCustomer.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地址">{{ viewCustomer.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewCustomer.createTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="viewCustomer.status === 'active' ? 'success' : 'danger'" effect="plain">
            {{ viewCustomer.status === 'active' ? '启用' : viewCustomer.status === 'inactive' ? '禁用' : '-' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="detailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'CustomerManagement',
  data() {
    return {
      searchForm: { name: '', contact: '', phone: '' },
      statusFilter: '',
      currentPage: 1,
      pageSize: 10,
      dialogVisible: false,
      dialogType: 'add',
      currentCustomer: this.getEmptyCustomer(),
      detailVisible: false,
      viewCustomer: {},
      saving: false,
      formRules: {
        name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
        contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
        phone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
        status: [{ required: true, message: '请选择状态', trigger: 'change' }]
      }
    }
  },
  computed: {
    ...mapState('customer', ['list', 'total', 'loading']),
    filteredData() {
      return this.list.filter(item => {
        const matchName = !this.searchForm.name || item.name.includes(this.searchForm.name)
        const matchContact = !this.searchForm.contact || item.contact.includes(this.searchForm.contact)
        const matchPhone = !this.searchForm.phone || item.phone.includes(this.searchForm.phone)
        const matchStatus = !this.statusFilter || item.status === this.statusFilter
        return matchName && matchContact && matchPhone && matchStatus
      })
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredData.slice(start, end)
    }
  },
  mounted() {
    this.fetchCustomers({ page: 1, pageSize: 999 })
  },
  methods: {
    ...mapActions('customer', ['fetchCustomers', 'addCustomer', 'updateCustomer', 'deleteCustomer']),
    getEmptyCustomer() {
      return { id: null, name: '', contact: '', phone: '', email: '', address: '', createTime: '', status: 'active' }
    },
    handleSearch() {
      this.currentPage = 1
    },
    resetSearch() {
      this.searchForm = { name: '', contact: '', phone: '' }
      this.statusFilter = ''
      this.currentPage = 1
    },
    handleAdd() {
      this.dialogType = 'add'
      this.currentCustomer = this.getEmptyCustomer()
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.customerForm) this.$refs.customerForm.clearValidate()
      })
    },
    handleEdit(row) {
      this.dialogType = 'edit'
      this.currentCustomer = { ...row }
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.customerForm) this.$refs.customerForm.clearValidate()
      })
    },
    handleView(row) {
      this.viewCustomer = { ...row }
      this.detailVisible = true
    },
    handleDelete(row) {
      this.$confirm(`确认删除客户“${row.name}”吗？删除后无法恢复。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      }).then(async () => {
        await this.deleteCustomer(row.id)
        this.$message.success('删除成功')
        if (this.paginatedData.length === 1 && this.currentPage > 1) this.currentPage--
      }).catch(() => {})
    },
    async saveCustomer() {
      try {
        await this.$refs.customerForm.validate()
        this.saving = true
        if (this.dialogType === 'add') {
          await this.addCustomer(this.currentCustomer)
          this.$message.success('新增成功')
        } else {
          const { id, name, contact, phone, email, address, status } = this.currentCustomer
          await this.updateCustomer({ id, data: { name, contact, phone, email, address, status } })
          this.$message.success('编辑成功')
        }
        this.dialogVisible = false
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('保存失败，请重试')
        }
      } finally {
        this.saving = false
      }
    },
    resetForm() {
      if (this.$refs.customerForm) this.$refs.customerForm.clearValidate()
      this.currentCustomer = this.getEmptyCustomer()
    },
    handlePageChange(page) {
      this.currentPage = page
    },
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
    }
  }
}
</script>

<style scoped>
.customer-container {
  padding: 24px;
  background: #f5f7fb;
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  margin-bottom: 24px;
}
.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}
.title-icon {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 10px 15px -6px rgba(16, 185, 129, 0.3);
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

/* 筛选卡片 */
.filter-card {
  margin-bottom: 24px;
  border-radius: 20px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.2s;
}
.filter-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}
.filter-card ::v-deep .el-form-item {
  margin-bottom: 8px;
}
.filter-card .el-button--primary,
.filter-card .el-button--success {
  /* border-radius: 40px; */
  padding: 12px 18px;
}

/* 表格卡片 */
.table-card {
  border-radius: 24px;
  border: 1px solid #eef2f6;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.02);
}
.customer-table {
  border-radius: 20px;
}
.customer-table ::v-deep .el-table__row {
  transition: background 0.2s;
}
.customer-table ::v-deep .el-table__row:hover > td {
  background-color: #fafcff;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 64px 0;
  color: #9ca3af;
}
.empty-state i {
  font-size: 56px;
  margin-bottom: 16px;
  opacity: 0.5;
}
.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* 分页 */
.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
}

/* 对话框美化 */
.customer-dialog ::v-deep .el-dialog,
.detail-dialog ::v-deep .el-dialog {
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.25);
}
.customer-dialog ::v-deep .el-dialog__header,
.detail-dialog ::v-deep .el-dialog__header {
  background: #f8fafc;
  padding: 18px 24px;
  border-bottom: 1px solid #eef2f6;
}
.customer-dialog ::v-deep .el-dialog__title,
.detail-dialog ::v-deep .el-dialog__title {
  font-weight: 600;
  font-size: 18px;
  color: #0f172a;
}
.customer-dialog ::v-deep .el-dialog__body,
.detail-dialog ::v-deep .el-dialog__body {
  padding: 24px;
}
.dialog-footer {
  text-align: right;
}
.dialog-footer .el-button {
  border-radius: 40px;
  padding: 8px 24px;
}

/* 响应式 */
@media (max-width: 768px) {
  .customer-container {
    padding: 16px;
  }
  .title-icon {
    width: 44px;
    height: 44px;
    font-size: 22px;
  }
  .title-text h2 {
    font-size: 22px;
  }
  .filter-card ::v-deep .el-form--inline .el-form-item {
    display: block;
    margin-right: 0;
  }
}
</style>