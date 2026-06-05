<template>
  <div class="stock-container">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="title-section">
        <div class="title-icon">🏭</div>
        <div class="title-text">
          <h2>库存管理</h2>
          <p>监控商品库存、预警阈值与仓库位置</p>
        </div>
      </div>
    </div>

    <!-- 筛选卡片 -->
    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="searchForm" size="default">
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入" clearable prefix-icon="el-icon-goods" />
        </el-form-item>
        <el-form-item label="SKU">
          <el-input v-model="searchForm.sku" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="仓库">
          <el-input v-model="searchForm.warehouse" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="库存预警">
          <el-select v-model="warningFilter" placeholder="全部" clearable style="width: 120px">
            <el-option label="低于阈值" value="below" />
            <el-option label="正常" value="normal" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" icon="el-icon-search">查询</el-button>
          <el-button @click="resetSearch" icon="el-icon-refresh-right">重置</el-button>
          <el-button type="success" @click="handleAdd" icon="el-icon-plus">新增库存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 库存表格卡片 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="inventoryList"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
        class="stock-table"
        :header-cell-style="{ background: '#f8fafc', color: '#1e293b', fontWeight: '600' }"
      >
        <el-table-column prop="productName" label="商品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="sku" label="SKU" width="140" />
        <el-table-column prop="quantity" label="库存数量" width="110" align="right">
          <template #default="scope">
            <span :class="getStockQuantityClass(scope.row.quantity, scope.row.threshold)">
              {{ scope.row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="warehouse" label="仓库位置" min-width="140" />
        <el-table-column prop="threshold" label="预警阈值" width="110" align="right" />
        <el-table-column label="库存状态" width="110" align="center">
          <template #default="scope">
            <el-tag
              :type="scope.row.quantity <= scope.row.threshold ? 'danger' : 'success'"
              size="small"
              effect="plain"
            >
              {{ scope.row.quantity <= scope.row.threshold ? '低于阈值' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="scope">
            <el-button type="primary" size="mini" @click="handleEdit(scope.row)" icon="el-icon-edit" circle />
            <el-button type="info" size="mini" @click="handleView(scope.row)" icon="el-icon-view" circle />
            <el-button type="danger" size="mini" @click="handleDelete(scope.row.id)" icon="el-icon-delete" circle />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :current-page="page"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogType === 'add' ? '➕ 新增库存' : '✏️ 编辑库存'"
      :visible="dialogVisible"
      @update:visible="val => dialogVisible = val"
      width="540px"
      class="stock-dialog"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <el-form ref="inventoryForm" :model="currentItem" :rules="formRules" label-width="100px" label-position="left">
        <el-form-item label="商品名称" prop="productName">
          <el-input v-model="currentItem.productName" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="SKU" prop="sku">
          <el-input v-model="currentItem.sku" placeholder="请输入SKU" />
        </el-form-item>
        <el-form-item label="库存数量" prop="quantity">
          <el-input-number v-model="currentItem.quantity" :min="0" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="仓库位置" prop="warehouse">
          <el-input v-model="currentItem.warehouse" placeholder="请输入仓库位置" />
        </el-form-item>
        <el-form-item label="预警阈值" prop="threshold">
          <el-input-number v-model="currentItem.threshold" :min="0" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveItem" :loading="saving">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      title="📋 库存详情"
      :visible="detailVisible"
      @update:visible="val => detailVisible = val"
      width="520px"
      class="detail-dialog"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="商品名称">{{ viewItem.productName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="SKU">{{ viewItem.sku || '-' }}</el-descriptions-item>
        <el-descriptions-item label="库存数量">
          <span :class="getStockQuantityClass(viewItem.quantity, viewItem.threshold)">
            {{ viewItem.quantity }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="仓库位置">{{ viewItem.warehouse || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预警阈值">{{ viewItem.threshold }}</el-descriptions-item>
        <el-descriptions-item label="库存状态">
          <el-tag :type="viewItem.quantity <= viewItem.threshold ? 'danger' : 'success'" effect="plain">
            {{ viewItem.quantity <= viewItem.threshold ? '低于阈值' : '正常' }}
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
  name: 'InventoryManagement',
  data() {
    return {
      searchForm: {
        productName: '',
        sku: '',
        warehouse: ''
      },
      warningFilter: '',
      page: 1,
      pageSize: 10,
      dialogVisible: false,
      dialogType: 'add',
      currentItem: this.getEmptyItem(),
      detailVisible: false,
      viewItem: {},
      saving: false,
      formRules: {
        productName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
        sku: [{ required: true, message: '请输入SKU', trigger: 'blur' }],
        quantity: [{ required: true, message: '请输入库存数量', trigger: 'blur' }],
        warehouse: [{ required: true, message: '请输入仓库位置', trigger: 'blur' }],
        threshold: [{ required: true, message: '请输入预警阈值', trigger: 'blur' }]
      }
    }
  },
  computed: {
    ...mapState('inventory', ['list', 'total', 'loading']),
    inventoryList() {
      return this.list
    }
  },
  mounted() {
    const { productName } = this.$route.query
    if (productName) {
      this.searchForm.productName = productName
      this.handleSearch()
    } else {
      this.fetchData()
    }
  },
  methods: {
    ...mapActions('inventory', ['fetchInventory', 'addInventory', 'updateInventory', 'deleteInventory']),
    getEmptyItem() {
      return {
        id: null,
        productName: '',
        sku: '',
        quantity: 0,
        warehouse: '',
        threshold: 0
      }
    },
    fetchData() {
      const params = {
        page: this.page,
        pageSize: this.pageSize,
        productName: this.searchForm.productName,
        sku: this.searchForm.sku,
        warehouse: this.searchForm.warehouse,
        warningFilter: this.warningFilter
      }
      this.fetchInventory(params)
    },
    handleSearch() {
      this.page = 1
      this.fetchData()
    },
    resetSearch() {
      this.searchForm = { productName: '', sku: '', warehouse: '' }
      this.warningFilter = ''
      this.page = 1
      this.fetchData()
    },
    handleAdd() {
      this.dialogType = 'add'
      this.currentItem = this.getEmptyItem()
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.inventoryForm) this.$refs.inventoryForm.clearValidate()
      })
    },
    handleEdit(row) {
      this.dialogType = 'edit'
      this.currentItem = { ...row }
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.inventoryForm) this.$refs.inventoryForm.clearValidate()
      })
    },
    handleView(row) {
      this.viewItem = { ...row }
      this.detailVisible = true
    },
    async handleDelete(id) {
      try {
        await this.$confirm('确认删除该库存记录吗？删除后无法恢复。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        })
        await this.deleteInventory(id)
        this.$message.success('删除成功')
        this.fetchData()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },
    async saveItem() {
      try {
        await this.$refs.inventoryForm.validate()
        this.saving = true
        if (this.dialogType === 'add') {
          await this.addInventory(this.currentItem)
        } else {
          const { id, productName, sku, quantity, warehouse, threshold } = this.currentItem
          await this.updateInventory({ id, data: { productName, sku, quantity, warehouse, threshold } })
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
    resetForm() {
      if (this.$refs.inventoryForm) this.$refs.inventoryForm.clearValidate()
      this.currentItem = this.getEmptyItem()
    },
    handlePageChange(page) {
      this.page = page
      this.fetchData()
    },
    handleSizeChange(size) {
      this.pageSize = size
      this.page = 1
      this.fetchData()
    },
    getStockQuantityClass(quantity, threshold) {
      if (quantity <= threshold) return 'stock-critical'
      if (quantity < 50) return 'stock-low'
      return 'stock-normal'
    }
  }
}
</script>

<style scoped>
.stock-container {
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
.stock-table {
  border-radius: 20px;
}
.stock-table ::v-deep .el-table__row {
  transition: background 0.2s;
}
.stock-table ::v-deep .el-table__row:hover > td {
  background-color: #fafcff;
}

/* 库存数量颜色 */
.stock-critical {
  color: #f56c6c;
  font-weight: 700;
}
.stock-low {
  color: #e6a23c;
  font-weight: 500;
}
.stock-normal {
  color: #1e293b;
}

/* 分页 */
.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
}

/* 对话框美化 */
.stock-dialog ::v-deep .el-dialog,
.detail-dialog ::v-deep .el-dialog {
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.25);
}
.stock-dialog ::v-deep .el-dialog__header,
.detail-dialog ::v-deep .el-dialog__header {
  background: #f8fafc;
  padding: 18px 24px;
  border-bottom: 1px solid #eef2f6;
}
.stock-dialog ::v-deep .el-dialog__title,
.detail-dialog ::v-deep .el-dialog__title {
  font-weight: 600;
  font-size: 18px;
  color: #0f172a;
}
.stock-dialog ::v-deep .el-dialog__body,
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
.stock-dialog ::v-deep .el-input-number {
  width: 100%;
}

/* 响应式 */
@media (max-width: 768px) {
  .stock-container {
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