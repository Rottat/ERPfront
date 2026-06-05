<template>
  <div class="dict-container">
    <div class="page-header">
      <div class="title-icon">📖</div>
      <div class="title-text">
        <h2>数据字典</h2>
        <p>系统常量配置</p>
      </div>
    </div>
    <el-card>
      <el-tabs>
        <el-tab-pane label="订单状态">
          <el-table :data="orderStatus" border>
            <el-table-column prop="code" label="代码" />
            <el-table-column prop="name" label="名称" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="商品分类">
          <el-table :data="categories" border>
            <el-table-column prop="code" label="代码" />
            <el-table-column prop="name" label="名称" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'DataDict',
  data() {
    return {
      orderStatus: [],
      categories: []
    }
  },
  async mounted() {
    await this.fetchOrderStatus()
    await this.fetchCategories()
  },
  methods: {
    async fetchOrderStatus() {
      const res = await axios.get('/api/dict/order-status')
      this.orderStatus = res.data.data
    },
    async fetchCategories() {
      const res = await axios.get('/api/dict/categories')
      this.categories = res.data.data
    }
  }
}
</script>
<style scoped>
.dict-container { padding: 24px; background: #f5f7fb; min-height: 100vh; }
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
  background: linear-gradient(135deg, #05f119, #04f5cd);
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
</style>