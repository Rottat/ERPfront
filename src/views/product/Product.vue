<template>
  <div class="product-container">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="title-section">
        <div class="title-icon">📦</div>
        <div class="title-text">
          <h2>商品管理</h2>
          <p>管理您的商品库存、价格与信息</p>
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
              placeholder="搜索商品名称..."
              @keyup.enter="handleSearch"
              clearable
              prefix-icon="el-icon-search"
              class="search-input"
            />
          </div>
        </el-col>
        <el-col :xs="24" :sm="8" :md="6" class="action-buttons">
          <el-button type="primary" @click="handleAdd" icon="el-icon-plus" class="add-btn">新增商品</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 商品表格卡片 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="productList"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        class="product-table"
        :header-cell-style="{ background: '#f8fafc', color: '#1e293b', fontWeight: '600' }"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="商品名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="price" label="价格 (¥)" width="130" align="right">
          <template #default="scope">
            <span class="price-text">¥ {{ scope.row.price.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" align="center">
          <template #default="scope">
            <span class="stock-badge" :class="getStockClass(scope.row.stock)">
              {{ scope.row.stock }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
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

    <!-- 新增/编辑对话框（移除 .sync，使用 :visible + @update:visible） -->
    <el-dialog
      :title="dialogTitle"
      :visible="dialogVisible"
      @update:visible="val => dialogVisible = val"
      width="520px"
      class="product-dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="form" :rules="formRules" ref="form" label-width="80px" label-position="left">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" autofocus />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number
            v-model="form.price"
            :precision="2"
            :min="0"
            :step="0.5"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number
            v-model="form.stock"
            :min="0"
            :step="1"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveProduct" :loading="saving">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'ProductManagement',
  data() {
    return {
      searchQuery: '',
      page: 1,
      pageSize: 10,
      dialogVisible: false,
      editId: null,
      saving: false,
      form: { name: '', price: 0, stock: 0 },
      formRules: {
        name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
        price: [
          { required: true, type: 'number', message: '请输入价格', trigger: 'blur' },
          { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
        ],
        stock: [
          { required: true, type: 'number', message: '请输入库存', trigger: 'blur' },
          { type: 'number', min: 0, message: '库存不能小于0', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    ...mapState('product', ['list', 'total', 'loading']),
    productList() {
      return this.list
    },
    dialogTitle() {
      return this.editId ? '✏️ 编辑商品' : '➕ 新增商品'
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    ...mapActions('product', ['fetchProducts', 'addProduct', 'updateProduct', 'deleteProduct']),
    fetchData() {
      const params = {
        page: this.page,
        pageSize: this.pageSize,
        keyword: this.searchQuery
      }
      this.fetchProducts(params)
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
      this.form = { name: '', price: 0, stock: 0 }
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.form) this.$refs.form.clearValidate()
      })
    },
    handleEdit(row) {
      this.editId = row.id
      this.form = { ...row }
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.form) this.$refs.form.clearValidate()
      })
    },
    async handleDelete(id) {
      try {
        await this.$confirm('确认删除该商品吗？删除后无法恢复。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        })
        await this.deleteProduct(id)
        this.$message.success('删除成功')
        this.fetchData()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },
    saveProduct() {
      this.$refs.form.validate(async valid => {
        if (valid) {
          this.saving = true
          try {
            if (this.editId) {
              await this.updateProduct({ id: this.editId, data: this.form })
            } else {
              await this.addProduct(this.form)
            }
            this.$message.success('保存成功')
            this.dialogVisible = false
            this.fetchData()
          } catch (error) {
            this.$message.error('保存失败，请重试')
          } finally {
            this.saving = false
          }
        }
      })
    },
    getStockClass(stock) {
      if (stock <= 0) return 'stock-critical'
      if (stock < 20) return 'stock-low'
      if (stock < 100) return 'stock-medium'
      return 'stock-high'
    }
  }
}
</script>

<style scoped>
.product-container {
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
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 10px 15px -6px rgba(59, 130, 246, 0.3);
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
  background: linear-gradient(95deg, #3b82f6, #2563eb);
  border: none;
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.25);
  transition: transform 0.1s;
}
.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3);
}

/* 表格卡片 */
.table-card {
  border-radius: 24px;
  border: 1px solid #eef2f6;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.02);
}
.product-table {
  border-radius: 20px;
}
.product-table ::v-deep .el-table__row {
  transition: background 0.2s;
}
.product-table ::v-deep .el-table__row:hover > td {
  background-color: #fafcff;
}
.price-text {
  font-weight: 600;
  color: #1e293b;
}
.stock-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 40px;
  font-size: 12px;
  font-weight: 600;
  min-width: 56px;
  background: #f1f5f9;
  color: #334155;
}
.stock-critical {
  background: #fee2e2;
  color: #dc2626;
}
.stock-low {
  background: #ffedd5;
  color: #ea580c;
}
.stock-medium {
  background: #fef9c3;
  color: #b45309;
}
.stock-high {
  background: #dcfce7;
  color: #16a34a;
}

/* 分页 */
.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
}

/* 对话框美化 */
.product-dialog ::v-deep .el-dialog {
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.25);
}
.product-dialog ::v-deep .el-dialog__header {
  background: #f8fafc;
  padding: 18px 24px;
  border-bottom: 1px solid #eef2f6;
}
.product-dialog ::v-deep .el-dialog__title {
  font-weight: 600;
  font-size: 18px;
  color: #0f172a;
}
.product-dialog ::v-deep .el-dialog__body {
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
  .product-container {
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
  .product-table ::v-deep .el-table__header th {
    font-size: 12px;
  }
}
</style>