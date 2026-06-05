<template>
  <div class="permission-container">
    <div class="page-header">
      <div class="title-icon">🔐</div>
      <div class="title-text">
        <h2>权限管理</h2>
        <p>角色权限配置</p>
      </div>
    </div>
    <el-card>
      <el-table :data="roles" border>
        <el-table-column prop="roleName" label="角色" width="120" />
        <el-table-column label="权限">
          <template #default="scope">
            <el-tag
              v-for="p in scope.row.perms"
              :key="p"
              size="small"
              style="margin-right: 8px; margin-bottom: 4px;"
            >{{ p }}</el-tag>
            <el-button type="text" size="small" @click="editPermissions(scope.row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑权限对话框（分组选择） -->
    <el-dialog
  :visible="dialogVisible"
  @update:visible="dialogVisible = $event"
  :title="'编辑角色权限 - ' + currentRole?.roleName"
  width="600px"
  :close-on-click-modal="false"
>
      <div class="perm-group" v-for="group in permissionGroups" :key="group.name">
        <div class="group-title">{{ group.name }}</div>
        <el-checkbox-group v-model="selectedPerms">
          <el-checkbox
            v-for="perm in group.perms"
            :key="perm"
            :label="perm"
            class="perm-checkbox"
          >{{ perm }}</el-checkbox>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePermissions" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'PermissionManagement',
  data() {
    return {
      roles: [],
      // 权限分组（可根据实际业务调整）
      permissionGroups: [
        {
          name: '基础资料',
          perms: ['商品管理', '客户管理']
        },
        {
          name: '业务管理',
          perms: ['订单管理', '库存管理']
        },
        {
          name: '财务管理',
          perms: ['财务管理', '财务报表查看']
        },
        {
          name: '系统管理',
          perms: ['用户管理', '员工管理', '权限管理', '操作日志', '数据字典']
        },
        {
          name: '报表中心',
          perms: ['销售报表', '库存报表', '财务报表']
        },
        {
          name: '其他',
          perms: ['个人中心']
        }
      ],
      dialogVisible: false,
      currentRole: null,
      selectedPerms: [],
      saving: false
    }
  },
  async mounted() {
    await this.fetchRoles()
  },
  methods: {
    async fetchRoles() {
      try {
        const res = await axios.get('/api/permissions/roles')
        this.roles = res.data.data
      } catch (error) {
        console.error('获取角色权限失败', error)
        this.$message.error('加载失败')
      }
    },
    editPermissions(row) {
      if (!row) return
      this.currentRole = row
      this.selectedPerms = [...row.perms]
      this.dialogVisible = true
      console.log('dialogVisible:', this.dialogVisible, 'currentRole:', this.currentRole)
    },
    async savePermissions() {
      this.saving = true
      try {
        const payload = {
          role: this.currentRole.role,
          perms: this.selectedPerms
        }
        console.log('保存权限请求参数：', payload)
        const res = await axios.put('/api/permissions/roles', payload)
        console.log('保存权限响应：', res.data)
        if (res.data.code === 200) {
          this.$message.success('保存成功')
          this.dialogVisible = false
          await this.fetchRoles()
           const currentUserRole = this.$store.state.user.userInfo?.role
      if (currentUserRole === this.currentRole.role) {
        // 重新获取当前用户信息，更新权限
        await this.$store.dispatch('user/fetchUserInfo')
      }
        } else {
          this.$message.error(res.data.message || '保存失败')
        }
      } catch (error) {
        console.error('保存权限失败', error)
        this.$message.error('保存失败：' + (error.response?.data?.message || error.message))
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.permission-container { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { margin-bottom: 24px;  display: flex;
  align-items: center;
  gap: 16px; }
.title-section { display: flex; align-items: center; gap: 16px; }
.title-icon { width: 52px; height: 52px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 10px 15px -6px rgba(139,92,246,0.3); }
.title-text h2 { margin: 0; font-size: 26px; font-weight: 600; color: #0f172a; }
.title-text p { margin: 4px 0 0; font-size: 14px; color: #64748b; }

.perm-group {
  margin-bottom: 20px;
  border-bottom: 1px solid #eef2f6;
  padding-bottom: 10px;
}
.group-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: #1e293b;
  font-size: 15px;
}
.perm-checkbox {
  margin-right: 16px;
  margin-bottom: 8px;
}
.el-dialog__wrapper {
  z-index: 9999 !important;
}
</style>