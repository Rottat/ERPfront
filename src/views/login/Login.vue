<template>
  <div class="login-container">
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
    <div class="bg-shape shape-3"></div>

    <el-card class="login-card" shadow="never">
      <div class="login-header">
        <div class="logo-icon">📊</div>
        <h2>ERP 系统</h2>
        <p>欢迎回来，请登录您的账号</p>
      </div>

      <el-form :model="form" :rules="rules" ref="form" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            prefix-icon="el-icon-user"
            size="large"
            clearable
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            type="password"
            v-model="form.password"
            placeholder="密码"
            prefix-icon="el-icon-lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handleLogin"
            :loading="loading"
            class="login-btn"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <span>演示账号：admin / 123456</span>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'UserLogin',
  data() {
    return {
      form: {
        username: '',
        password: ''
      },
      loading: false,
      rules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      }
    }
  },
methods: {
  async handleLogin() {
  this.$refs.form.validate(async valid => {
    if (valid) {
      this.loading = true
      try {
        const res = await axios.post('/api/auth/login', {
          username: this.form.username,
          password: this.form.password
        })
        if (res.data.code === 200) {
          const { token, userInfo } = res.data.data
          // 调用 Vuex action 保存用户信息和 token
          await this.$store.dispatch('user/loginSuccess', { token, userInfo })
          this.$message.success('登录成功')
          this.$router.push('/dashboard')
        } else {
          this.$message.error(res.data.message || '登录失败')
        }
      } catch (error) {
        this.$message.error('登录失败，请检查网络')
      } finally {
        this.loading = false
      }
    }
  })
}
}
}
</script>

<style scoped>
.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

/* 动态背景装饰 */
.bg-shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 20s infinite ease-in-out;
  pointer-events: none;
}
.shape-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  left: -150px;
}
.shape-2 {
  width: 500px;
  height: 500px;
  bottom: -250px;
  right: -200px;
  animation-delay: -5s;
}
.shape-3 {
  width: 200px;
  height: 200px;
  top: 30%;
  left: 20%;
  animation-duration: 25s;
  animation-delay: -10s;
}

@keyframes float {
  0% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(30px, -20px) scale(1.1);
  }
  100% {
    transform: translate(0, 0) scale(1);
  }
}

/* 登录卡片 */
.login-card {
  width: 440px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.login-card:hover {
  transform: translateY(-5px);
}
.login-card ::v-deep .el-card__body {
  padding: 40px 32px;
}

/* 头部区域 */
.login-header {
  text-align: center;
  margin-bottom: 36px;
}
.logo-icon {
  font-size: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  width: 80px;
  height: 80px;
  line-height: 80px;
  margin: 0 auto 16px;
  border-radius: 30px;
  box-shadow: 0 10px 20px -5px rgba(102, 126, 234, 0.4);
}
.login-header h2 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 1px;
}
.login-header p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

/* 表单项调整 */
.login-card ::v-deep .el-form-item {
  margin-bottom: 24px;
}
.login-card ::v-deep .el-input__inner {
  height: 48px;
  line-height: 48px;
  border-radius: 24px;
  padding: 0 20px;
  border-color: #e2e8f0;
  transition: all 0.2s;
}
.login-card ::v-deep .el-input__inner:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}
.login-card ::v-deep .el-input__prefix {
  left: 16px;
  line-height: 48px;
}
.login-card ::v-deep .el-input__inner {
  padding-left: 42px;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 40px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(95deg, #667eea, #764ba2);
  border: none;
  box-shadow: 0 8px 16px -4px rgba(102, 126, 234, 0.4);
  transition: all 0.2s;
}
.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px -6px rgba(102, 126, 234, 0.5);
}
.login-btn:active {
  transform: translateY(0);
}

/* 底部提示 */
.login-footer {
  text-align: center;
  margin-top: 28px;
  font-size: 13px;
  color: #94a3b8;
}

/* 响应式 */
@media (max-width: 520px) {
  .login-card {
    width: 90%;
  }
  .login-card ::v-deep .el-card__body {
    padding: 32px 24px;
  }
  .logo-icon {
    width: 64px;
    height: 64px;
    line-height: 64px;
    font-size: 38px;
  }
  .login-header h2 {
    font-size: 24px;
  }
}
</style>