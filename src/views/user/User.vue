<template>
  <div class="user-container">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="title-section">
        <div class="title-icon">👤</div>
        <div class="title-text">
          <h2>用户管理</h2>
          <p>管理系统用户、角色与权限</p>
        </div>
      </div>
    </div>

    <!-- 搜索和新增操作栏 -->
    <el-card class="search-card" shadow="hover">
      <el-row :gutter="20" align="middle">
        <el-col :xs="24" :sm="16" :md="18">
          <div class="search-wrapper">
            <el-input
              v-model="searchQuery"
              placeholder="搜索用户名/姓名..."
              @keyup.enter="handleSearch"
              clearable
              prefix-icon="el-icon-search"
              class="search-input"
            />
          </div>
        </el-col>
        <el-col :xs="24" :sm="8" :md="6" class="action-buttons">
          <el-button type="primary" @click="handleAdd" icon="el-icon-plus" class="add-btn">新增用户</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 用户表格卡片 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="userList"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        class="user-table"
        :header-cell-style="{ background: '#f8fafc', color: '#1e293b', fontWeight: '600' }"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column prop="role" label="角色" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'info'" size="small" effect="plain">
              {{ roleFormatter(scope.row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="mini" @click="handleEdit(scope.row)" icon="el-icon-edit" circle />
            <el-button type="danger" size="mini" @click="handleDelete(scope.row.id)" icon="el-icon-delete" circle />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          background
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible="dialogVisible"
      @update:visible="val => dialogVisible = val"
      width="520px"
      class="user-dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="form" :rules="formRules" ref="form" label-width="80px" label-position="left">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!editId" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!editId">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入电话" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveUser" :loading="saving">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import axios from 'axios';

export default {
  name: 'UserManagement',
  data() {
    return {
      searchQuery: '',
      page: 1,
      pageSize: 10,
      dialogVisible: false,
      editId: null,
      saving: false,
      form: {
        username: '',
        password: '',
        realName: '',
        role: 'user',
        email: '',
        phone: ''
      },
      formRules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
        realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        role: [{ required: true, message: '请选择角色', trigger: 'change' }],
        email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
        phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }]
      }
    }
  },
  computed: {
    ...mapState('user', ['list', 'total', 'loading']),
    userList() {
      return this.list
    },
    dialogTitle() {
      return this.editId ? '✏️ 编辑用户' : '➕ 新增用户'
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    ...mapActions('user', ['fetchUsers', 'addUser', 'updateUser', 'deleteUser']),
    fetchData() {
      const params = {
        page: this.page,
        pageSize: this.pageSize,
        keyword: this.searchQuery
      }
      this.fetchUsers(params)
    },
    handleSearch() {
      this.page = 1
      this.fetchData()
    },
    handleSizeChange(val) {
      this.pageSize = val
      this.page = 1
      this.fetchData()
    },
    handleCurrentChange(val) {
      this.page = val
      this.fetchData()
    },
    handleAdd() {
      this.editId = null
      this.form = { username: '', password: '', realName: '', role: 'user', email: '', phone: '' }
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.form) this.$refs.form.clearValidate()
      })
    },
    handleEdit(row) {
      this.editId = row.id
      // 复制对象并移除 password 字段，避免未使用变量警告
      const { ...rest } = row
      delete rest.password
      this.form = { ...rest, password: '' }
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.form) this.$refs.form.clearValidate()
      })
    },
    async handleDelete(id) {
      try {
        await this.$confirm('确认删除该用户吗？删除后无法恢复。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        })
        await this.deleteUser(id)
        this.$message.success('删除成功')
        this.fetchData()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },
    async changePassword(userId, oldPassword, newPassword) {
  try {
    const res = await axios.put(`/api/users/${userId}/password`, {
      oldPassword,
      newPassword
    })
    if (res.data.code === 200) {
      this.$message.success('密码修改成功111')
      // 如果修改的是当前登录用户的密码，可提示重新登录
      if (this.$store.state.user.userInfo?.id === userId) {
        this.$confirm('密码已修改，请重新登录', '提示', {
          confirmButtonText: '确定',
          type: 'success'
        }).then(() => {
          localStorage.removeItem('token')
          this.$store.dispatch('user/logout')
          this.$router.push('/login')
        })
      }
    } else {
      this.$message.error(res.data.message || '修改失败')
    }
  } catch (error) {
    this.$message.error('请求失败')
  }
},
    async saveUser() {
      try {
        await this.$refs.form.validate()
        this.saving = true
        if (this.editId) {
          // 编辑时只传递修改的字段，不包含密码（如果密码为空则忽略）
          const updateData = { ...this.form }
          if (!updateData.password) delete updateData.password
          await this.updateUser({ id: this.editId, data: updateData })
        } else {
          await this.addUser(this.form)
        }
        this.$message.success('保存成功')
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
    roleFormatter(row) {
      const map = { admin: '管理员', user: '普通用户' }
      return map[row.role] || row.role
    }
  }
}
</script>

<style scoped>
.user-container {
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
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 10px 15px -6px rgba(139, 92, 246, 0.3);
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

/* 搜索卡片 */
.search-card {
  margin-bottom: 24px;
  border-radius: 20px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.2s;
}
.search-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}
.search-wrapper {
  display: flex;
  align-items: center;
}
.search-input {
  width: 100%;
  max-width: 360px;
}
.action-buttons {
  text-align: right;
}
.add-btn {
  border-radius: 40px;
  padding: 10px 22px;
  background: linear-gradient(95deg, #8b5cf6, #7c3aed);
  border: none;
  box-shadow: 0 4px 8px rgba(139, 92, 246, 0.25);
  transition: transform 0.1s;
}
.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(139, 92, 246, 0.3);
}

/* 表格卡片 */
.table-card {
  border-radius: 24px;
  border: 1px solid #eef2f6;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.02);
}
.user-table {
  border-radius: 20px;
}
.user-table ::v-deep .el-table__row {
  transition: background 0.2s;
}
.user-table ::v-deep .el-table__row:hover > td {
  background-color: #fafcff;
}

/* 分页 */
.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
}

/* 对话框美化 */
.user-dialog ::v-deep .el-dialog {
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.25);
}
.user-dialog ::v-deep .el-dialog__header {
  background: #f8fafc;
  padding: 18px 24px;
  border-bottom: 1px solid #eef2f6;
}
.user-dialog ::v-deep .el-dialog__title {
  font-weight: 600;
  font-size: 18px;
  color: #0f172a;
}
.user-dialog ::v-deep .el-dialog__body {
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
  .user-container {
    padding: 16px;
  }
  .action-buttons {
    text-align: left;
    margin-top: 12px;
  }
  .search-input {
    max-width: 100%;
  }
  .title-icon {
    width: 44px;
    height: 44px;
    font-size: 22px;
  }
  .title-text h2 {
    font-size: 22px;
  }
  .user-table ::v-deep .el-table__header th {
    font-size: 12px;
  }
}
</style>