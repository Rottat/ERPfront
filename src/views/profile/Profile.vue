<template>
  <div class="profile-container">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="title-section">
        <div class="title-icon">👤</div>
        <div class="title-text">
          <h2>个人中心</h2>
          <p>查看与编辑个人信息</p>
        </div>
      </div>
    </div>

    <!-- 个人信息卡片 -->
    <el-card class="profile-card" shadow="hover">
      <el-form label-width="100px" label-position="left" class="profile-form">
        <el-form-item label="用户名">
          <div class="info-value">{{ userInfo.username }}</div>
        </el-form-item>
        <el-form-item label="姓名">
          <div class="info-value">{{ userInfo.realName }}</div>
        </el-form-item>
        <el-form-item label="角色">
          <el-tag :type="userInfo?.role === 'admin' ? 'danger' : 'info'" effect="plain" size="small">
            {{ roleText }}
          </el-tag>
        </el-form-item>
        <el-form-item label="邮箱">
          <div class="info-value">{{ userInfo.email }}</div>
        </el-form-item>
        <el-form-item label="电话">
          <div class="info-value">{{ userInfo.phone }}</div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="showPasswordDialog = true" icon="el-icon-key" class="change-pwd-btn">
            修改密码
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 修改密码对话框（修复 :visible.sync 废弃语法） -->
    <el-dialog
      title="🔐 修改密码"
      :visible="showPasswordDialog"
      @update:visible="val => showPasswordDialog = val"
      width="460px"
      class="password-dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="pwdForm" :rules="pwdRules" ref="pwdForm" label-width="80px" label-position="left">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" placeholder="请输入原密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showPasswordDialog = false">取消</el-button>
          <el-button type="primary" @click="changePassword" :loading="changing">确认修改</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'UserProfile',
  data() {
    // 自定义确认密码校验函数（需要在 data 中定义以便访问 this）
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.pwdForm.newPassword) {
        callback(new Error('两次输入密码不一致'))
      } else {
        callback()
      }
    }

    return {
      showPasswordDialog: false,
      changing: false,
      pwdForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      pwdRules: {
        oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码长度至少6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认新密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    ...mapState('user', ['userInfo']),
    roleText() {
      const map = { admin: '管理员', user: '普通用户' }
      return map[this.userInfo?.role] || this.userInfo?.role || '-'
    }
  },
  created() {
    if (!this.userInfo) {
      this.$store.dispatch('user/fetchUserInfo')
    }
  },
  methods: {
    async changePassword() {
      try {
        await this.$refs.pwdForm.validate()
        this.changing = true
        // 调用修改密码 API
        await this.$store.dispatch('user/changePassword', {
          oldPassword: this.pwdForm.oldPassword,
          newPassword: this.pwdForm.newPassword
        })
        this.$message.success('密码修改成功')
        this.showPasswordDialog = false
        this.pwdForm = { oldPassword: '', newPassword: '', confirmPassword: '' }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('密码修改失败，请重试')
        }
      } finally {
        this.changing = false
      }
    }
  }
}
</script>

<style scoped>
.profile-container {
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

/* 个人中心卡片 */
.profile-card {
  max-width: 600px;
  border-radius: 24px;
  border: 1px solid #eef2f6;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.02);
  transition: box-shadow 0.2s;
}
.profile-card:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
}
.profile-form {
  padding: 8px 0;
}
.profile-form ::v-deep .el-form-item {
  margin-bottom: 20px;
}
.profile-form ::v-deep .el-form-item__label {
  font-weight: 500;
  color: #475569;
}
.info-value {
  color: #1e293b;
  font-size: 15px;
  line-height: 32px;
}
.change-pwd-btn {
  border-radius: 40px;
  padding: 10px 24px;
  background: linear-gradient(95deg, #10b981, #059669);
  border: none;
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.25);
  transition: transform 0.1s;
}
.change-pwd-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(16, 185, 129, 0.3);
}

/* 修改密码对话框 */
.password-dialog ::v-deep .el-dialog {
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.25);
}
.password-dialog ::v-deep .el-dialog__header {
  background: #f8fafc;
  padding: 18px 24px;
  border-bottom: 1px solid #eef2f6;
}
.password-dialog ::v-deep .el-dialog__title {
  font-weight: 600;
  font-size: 18px;
  color: #0f172a;
}
.password-dialog ::v-deep .el-dialog__body {
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
  .profile-container {
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
  .profile-card {
    max-width: 100%;
  }
}
</style>