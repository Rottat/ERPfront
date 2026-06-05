<template>
  <div class="order-container">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="title-section">
        <div class="title-icon">📋</div>
        <div class="title-text">
          <h2>订单管理</h2>
          <p>管理订单流程与状态变更</p>
        </div>
      </div>
    </div>

    <!-- 筛选卡片 -->
    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="searchForm" size="default">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入" clearable prefix-icon="el-icon-document" />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customerName" placeholder="请输入" clearable prefix-icon="el-icon-user" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="statusFilter" placeholder="全部" clearable style="width: 140px">
            <el-option label="待付款" value="pending" />
            <el-option label="已付款" value="paid" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" icon="el-icon-search">查询</el-button>
          <el-button @click="resetSearch" icon="el-icon-refresh-right">重置</el-button>
          <el-button type="success" @click="handleAdd" icon="el-icon-plus">新增订单</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单表格卡片 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="orderList"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
        class="order-table"
        :header-cell-style="{ background: '#f8fafc', color: '#1e293b', fontWeight: '600' }"
      >
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="customerName" label="客户名称" min-width="130" show-overflow-tooltip />
        <el-table-column prop="totalAmount" label="订单金额" width="130" align="right">
          <template #default="scope">
            <span class="amount-text">¥ {{ scope.row.totalAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)" size="small" effect="plain">
              {{ statusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="160" />
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="scope">
            <el-button type="primary" size="mini" @click="handleEdit(scope.row)" icon="el-icon-edit" circle />
            <el-button type="info" size="mini" @click="handleView(scope.row)" icon="el-icon-view" circle />
            <el-button type="danger" size="mini" @click="handleDelete(scope.row.id)" icon="el-icon-delete" circle />
            <el-dropdown @command="(cmd) => handleStatusChange(scope.row, cmd)"  trigger="click">
              <el-button type="text" size="small" class="status-dropdown-btn">
                状态变更 <i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="paid" :disabled="scope.row.status !== 'pending'">标记付款</el-dropdown-item>
                  <el-dropdown-item command="shipped" :disabled="scope.row.status !== 'paid'">确认发货</el-dropdown-item>
                  <el-dropdown-item command="completed" :disabled="scope.row.status !== 'shipped'">完成订单</el-dropdown-item>
                  <el-dropdown-item command="cancelled" :disabled="scope.row.status !== 'cnacelled'" divided>取消订单</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
          :current-page="page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          background
        />
      </div>
    </el-card>

    <!-- 新增/编辑订单对话框 -->
    <el-dialog
      :title="dialogType === 'add' ? '➕ 新增订单' : '✏️ 编辑订单'"
      :visible="dialogVisible"
      @update:visible="val => dialogVisible = val"
      width="800px"
      class="order-dialog"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <el-form ref="orderForm" :model="currentOrder" :rules="formRules" label-width="100px" label-position="left">
        <el-form-item label="客户名称" prop="customerName">
          <el-input v-model="currentOrder.customerName" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="订单明细" prop="items">
          <el-table :data="currentOrder.items" border class="items-table" size="small">
            <el-table-column label="商品名称" prop="productName" min-width="150" show-overflow-tooltip />
            <el-table-column label="单价" width="130" align="right">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.unitPrice"
                  :min="0"
                  :precision="2"
                  size="small"
                  controls-position="right"
                  style="width: 120px"
                />
              </template>
            </el-table-column>
            <el-table-column label="数量" width="130" align="right">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.quantity"
                  :min="1"
                  size="small"
                  controls-position="right"
                  style="width: 120px"
                  @change="recalcTotal"
                />
              </template>
            </el-table-column>
            <el-table-column label="小计" width="120" align="right">
              <template #default="scope">
                <span class="subtotal-text">¥ {{ (scope.row.unitPrice * scope.row.quantity).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="scope">
                <el-button type="text" size="small" @click="removeItem(scope.$index)" style="color: #f56c6c">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" size="small" style="margin-top: 12px" @click="productDialogVisible = true" icon="el-icon-plus">添加商品</el-button>
        </el-form-item>
        <el-form-item label="订单总额">
          <span class="total-amount">¥ {{ totalAmountCalc.toFixed(2) }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveOrder" :loading="saving">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      title="📄 订单详情"
      :visible="detailVisible"
      @update:visible="val => detailVisible = val"
      width="700px"
      class="detail-dialog"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="订单号">{{ viewOrder.orderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ viewOrder.customerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="statusTagType(viewOrder.status)" effect="plain">{{ statusText(viewOrder.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ viewOrder.createTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商品明细">
          <el-table :data="viewOrder.items" border size="small" style="width:100%">
            <el-table-column prop="productName" label="商品名称" min-width="150" />
            <el-table-column prop="quantity" label="数量" width="80" align="center" />
            <el-table-column prop="unitPrice" label="单价" width="100" align="right">
              <template #default="scope">¥ {{ scope.row.unitPrice.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="小计" width="100" align="right">
              <template #default="scope">¥ {{ (scope.row.unitPrice * scope.row.quantity).toFixed(2) }}</template>
            </el-table-column>
          </el-table>
        </el-descriptions-item>
        <el-descriptions-item label="订单总额">
          <span class="total-amount">¥ {{ (viewOrder.totalAmount || 0).toFixed(2) }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="detailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 选择商品对话框 -->
    <el-dialog
      title="选择商品"
      :visible="productDialogVisible"
      @update:visible="val => productDialogVisible = val"
      width="650px"
      class="product-select-dialog"
    >
      <el-table :data="productList" @row-click="selectProduct" highlight-current-row style="cursor: pointer">
        <el-table-column prop="name" label="商品名称" show-overflow-tooltip />
        <el-table-column prop="price" label="单价 (¥)" width="110" align="right">
          <template #default="scope">¥ {{ scope.row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" align="center" />
      </el-table>
      <div v-if="productList.length === 0" class="empty-state">
        <i class="el-icon-goods"></i> 暂无商品数据
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="productDialogVisible = false">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { getProductList } from '@/api/product'

export default {
  name: 'OrderManagement',
  data() {
    return {
      searchForm: { orderNo: '', customerName: '' },
      statusFilter: '',
      page: 1,
      pageSize: 10,
      dialogVisible: false,
      dialogType: 'add',
      currentOrder: this.getEmptyOrder(),
      detailVisible: false,
      viewOrder: {},
      productDialogVisible: false,
      productList: [],
      saving: false,
      formRules: {
        customerName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
        items: [{ type: 'array', min: 1, message: '请至少添加一个商品', trigger: 'change' }]
      }
    }
  },
  computed: {
    ...mapState('order', ['list', 'total', 'loading']),
    orderList() {
      return this.list
    },
    totalAmountCalc() {
      if (!this.currentOrder.items) return 0
      return this.currentOrder.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    }
  },
  mounted() {
    this.fetchData()
    this.loadProducts()
  },
  methods: {
    ...mapActions('order', ['fetchOrders', 'addOrder', 'updateOrder', 'deleteOrder', 'updateOrderStatus']),
    async loadProducts() {
      try {
        const res = await getProductList({ page: 1, pageSize: 999 })
        this.productList = res.data.list || []
      } catch (error) {
        console.error('加载商品列表失败', error)
      }
    },
    getEmptyOrder() {
      return {
        id: null,
        customerId: null,
        customerName: '',
        items: []
      }
    },
    fetchData() {
      const params = {
        page: this.page,
        pageSize: this.pageSize,
        orderNo: this.searchForm.orderNo,
        customerName: this.searchForm.customerName,
        status: this.statusFilter
      }
      this.fetchOrders(params)
    },
    handleSearch() {
      this.page = 1
      this.fetchData()
    },
    resetSearch() {
      this.searchForm = { orderNo: '', customerName: '' }
      this.statusFilter = ''
      this.page = 1
      this.fetchData()
    },
    handleAdd() {
      this.dialogType = 'add'
      this.currentOrder = this.getEmptyOrder()
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.orderForm) this.$refs.orderForm.clearValidate()
      })
    },
    handleEdit(row) {
      this.dialogType = 'edit'
      this.currentOrder = {
        id: row.id,
        customerId: row.customerId,
        customerName: row.customerName,
        items: (row.items || []).map(item => ({ ...item }))
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.orderForm) this.$refs.orderForm.clearValidate()
      })
    },
    handleView(row) {
      this.viewOrder = { ...row, items: row.items ? [...row.items] : [] }
      this.detailVisible = true
    },
    async handleDelete(id) {
      try {
        await this.$confirm('确认删除该订单吗？删除后无法恢复。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        })
        await this.deleteOrder(id)
        this.$message.success('删除成功')
        this.fetchData()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },
    async handleStatusChange(row, newStatus) {
      try {
        await this.updateOrderStatus({ id: row.id, status: newStatus })
        this.$message.success(`订单状态已更新为「${this.statusText(newStatus)}」`)
        this.fetchData()
      } catch (error) {
        this.$message.error('状态更新失败')
      }
    },
    selectProduct(product) {
      const existing = this.currentOrder.items.find(i => i.productId === product.id)
      if (existing) {
        this.$message.warning('该商品已添加，可修改数量')
        return
      }
      this.currentOrder.items.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 1
      })
      this.productDialogVisible = false
    },
    removeItem(index) {
      this.currentOrder.items.splice(index, 1)
      this.recalcTotal()
    },
    recalcTotal() {
      // 触发计算属性更新，无需额外操作
      this.$forceUpdate()
    },
    async saveOrder() {
      try {
        await this.$refs.orderForm.validate()
        if (this.currentOrder.items.length === 0) {
          this.$message.warning('请至少添加一个商品')
          return
        }
        this.saving = true
        const orderData = {
          customerName: this.currentOrder.customerName,
          items: this.currentOrder.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        }
        if (this.dialogType === 'add') {
          await this.addOrder(orderData)
        } else {
          await this.updateOrder({ id: this.currentOrder.id, data: orderData })
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
      if (this.$refs.orderForm) this.$refs.orderForm.clearValidate()
      this.currentOrder = this.getEmptyOrder()
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
    statusText(status) {
      const map = { pending: '待付款', paid: '已付款', shipped: '已发货', completed: '已完成', cancelled: '已取消' }
      return map[status] || status
    },
    statusTagType(status) {
      const map = { pending: 'warning', paid: 'success', shipped: 'primary', completed: 'info', cancelled: 'danger' }
      return map[status] || 'info'
    }
  }
}
</script>

<style scoped>
.order-container {
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
  background: linear-gradient(135deg, #f59e0b, #d97706);
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
.order-table {
  border-radius: 20px;
}
.order-table ::v-deep .el-table__row {
  transition: background 0.2s;
}
.order-table ::v-deep .el-table__row:hover > td {
  background-color: #fafcff;
}
.amount-text {
  font-weight: 600;
  color: #1e293b;
}
.status-dropdown-btn {
  margin-left: 8px;
  color: #5e7ce2;
}
.status-dropdown-btn i {
  font-size: 12px;
}

/* 分页 */
.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
}

/* 对话框美化 */
.order-dialog ::v-deep .el-dialog,
.detail-dialog ::v-deep .el-dialog,
.product-select-dialog ::v-deep .el-dialog {
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.25);
}
.order-dialog ::v-deep .el-dialog__header,
.detail-dialog ::v-deep .el-dialog__header,
.product-select-dialog ::v-deep .el-dialog__header {
  background: #f8fafc;
  padding: 18px 24px;
  border-bottom: 1px solid #eef2f6;
}
.order-dialog ::v-deep .el-dialog__title,
.detail-dialog ::v-deep .el-dialog__title,
.product-select-dialog ::v-deep .el-dialog__title {
  font-weight: 600;
  font-size: 18px;
  color: #0f172a;
}
.order-dialog ::v-deep .el-dialog__body,
.detail-dialog ::v-deep .el-dialog__body,
.product-select-dialog ::v-deep .el-dialog__body {
  padding: 24px;
}
.dialog-footer {
  text-align: right;
}
.dialog-footer .el-button {
  border-radius: 40px;
  padding: 8px 24px;
}
.items-table ::v-deep .el-input-number {
  width: 100%;
}
.subtotal-text {
  font-weight: 500;
  color: #059669;
}
.total-amount {
  font-size: 18px;
  font-weight: 700;
  color: #dc2626;
}
.empty-state {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}
.empty-state i {
  font-size: 48px;
  margin-bottom: 12px;
  display: block;
}

/* 响应式 */
@media (max-width: 768px) {
  .order-container {
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