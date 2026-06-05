<template>
  <div class="purchase-order-container">
    <div class="page-header">
      <div class="title-section">
        <div class="title-icon">📦</div>
        <div class="title-text">
          <h2>采购订单</h2>
          <p>管理采购订单及明细</p>
        </div>
      </div>
    </div>

    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="searchForm" size="default">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="searchForm.supplierName" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待审核" value="pending" />
            <el-option label="已审核" value="approved" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" icon="el-icon-search">查询</el-button>
          <el-button @click="resetSearch" icon="el-icon-refresh-right">重置</el-button>
          <el-button type="success" @click="handleAdd" icon="el-icon-plus">新增采购订单</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe class="purchase-table" :header-cell-style="{ background: '#f8fafc', fontWeight: '600' }">
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="supplierName" label="供应商" min-width="150" />
        <el-table-column prop="totalAmount" label="总金额" width="120" align="right">
          <template #default="scope">¥ {{ scope.row.totalAmount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="orderDate" label="订单日期" width="120" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)" effect="plain">{{ statusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="mini" @click="handleEdit(scope.row)" icon="el-icon-edit" circle />
            <el-button type="danger" size="mini" @click="handleDelete(scope.row.id)" icon="el-icon-delete" circle />
            <el-dropdown @command="cmd => handleStatusChange(scope.row, cmd)">
              <el-button type="text" size="small">状态变更</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="approved" :disabled="scope.row.status !== 'pending'">审核</el-dropdown-item>
                  <el-dropdown-item command="completed" :disabled="scope.row.status !== 'approved'">完成</el-dropdown-item>
                  <el-dropdown-item command="cancelled">取消</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total" :current-page="page" :page-size="pageSize" @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" :visible="dialogVisible" @update:visible="val => dialogVisible = val" width="800px" class="order-dialog" :close-on-click-modal="false">
      <el-form :model="form" :rules="formRules" ref="orderForm" label-width="100px">
        <el-form-item label="供应商" prop="supplierId">
          <el-select v-model="form.supplierId" placeholder="请选择供应商" filterable style="width: 100%" @change="onSupplierChange">
            <el-option v-for="sup in supplierList" :key="sup.id" :label="sup.name" :value="sup.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单日期" prop="orderDate">
          <el-date-picker v-model="form.orderDate" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" style="width: 100%" />
        </el-form-item>
        <el-form-item label="订单明细" prop="items">
          <el-table :data="form.items" border size="small">
            <el-table-column label="商品名称" prop="productName" min-width="150" />
            <el-table-column label="单价" width="130">
              <template #default="scope">
                <el-input-number v-model="scope.row.unitPrice" :min="0" :precision="2" controls-position="right" style="width: 120px" @change="calcTotal" />
              </template>
            </el-table-column>
            <el-table-column label="数量" width="130">
              <template #default="scope">
                <el-input-number v-model="scope.row.quantity" :min="1" controls-position="right" style="width: 120px" @change="calcTotal" />
              </template>
            </el-table-column>
            <el-table-column label="小计" width="120">
              <template #default="scope">¥ {{ (scope.row.unitPrice * scope.row.quantity).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="70">
              <template #default="scope">
                <el-button type="text" size="small" @click="removeItem(scope.$index)" style="color:#f56c6c">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" size="small" style="margin-top:12px" @click="showProductDialog = true" icon="el-icon-plus">添加商品</el-button>
        </el-form-item>
        <el-form-item label="订单总额">
          <span class="total-amount">¥ {{ form.totalAmount.toFixed(2) }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveOrder" :loading="saving">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 选择商品对话框 -->
    <el-dialog title="选择商品" :visible="showProductDialog" @update:visible="val => showProductDialog = val" width="650px">
      <el-table :data="productList" @row-click="selectProduct" highlight-current-row style="cursor:pointer">
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="price" label="单价" width="100" />
        <el-table-column prop="stock" label="库存" width="100" />
      </el-table>
      <template #footer><el-button @click="showProductDialog = false">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'PurchaseOrder',
  data() {
    return {
      searchForm: { orderNo: '', supplierName: '', status: '' },
      page: 1,
      pageSize: 10,
      loading: false,
      total: 0,
      tableData: [],
      dialogVisible: false,
      editId: null,
      saving: false,
      form: { supplierId: null, supplierName: '', orderDate: '', items: [], totalAmount: 0 },
      formRules: {
        supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
        orderDate: [{ required: true, message: '请选择订单日期', trigger: 'change' }]
      },
      supplierList: [],
      productList: [],
      showProductDialog: false
    }
  },
  computed: {
    dialogTitle() {
      return this.editId ? '编辑采购订单' : '新增采购订单'
    }
  },
  created() {
    this.fetchData()
    this.loadSuppliers()
    this.loadProducts()
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const params = {
          page: this.page,
          pageSize: this.pageSize,
          orderNo: this.searchForm.orderNo,
          supplierName: this.searchForm.supplierName,
          status: this.searchForm.status
        }
        const res = await axios.get('/api/purchase/orders', { params })
        this.tableData = res.data.data.list
        this.total = res.data.data.total
      } catch (error) {
        console.error('获取采购订单列表失败', error)
        this.$message.error('加载数据失败')
      } finally {
        this.loading = false
      }
    },
    async loadSuppliers() {
      try {
        const res = await axios.get('/api/suppliers', { params: { page: 1, pageSize: 100 } })
        this.supplierList = res.data.data.list
      } catch (error) {
        console.error('加载供应商失败', error)
      }
    },
    async loadProducts() {
      try {
        const res = await axios.get('/api/products', { params: { page: 1, pageSize: 100 } })
        this.productList = res.data.data.list
      } catch (error) {
        console.error('加载商品失败', error)
      }
    },
    handleSearch() {
      this.page = 1
      this.fetchData()
    },
    resetSearch() {
      this.searchForm = { orderNo: '', supplierName: '', status: '' }
      this.page = 1
      this.fetchData()
    },
    handleAdd() {
      this.editId = null
      this.form = { supplierId: null, supplierName: '', orderDate: '', items: [], totalAmount: 0 }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.orderForm?.clearValidate())
    },
    handleEdit(row) {
      this.editId = row.id
      this.form = {
        supplierId: row.supplierId,
        supplierName: row.supplierName,
        orderDate: row.orderDate,
        items: row.items ? row.items.map(i => ({ ...i })) : [],
        totalAmount: row.totalAmount
      }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.orderForm?.clearValidate())
    },
    async handleDelete(id) {
      try {
        await this.$confirm('确认删除该采购订单吗？', '提示', { type: 'warning' })
        await axios.delete(`/api/purchase/orders/${id}`)
        this.$message.success('删除成功')
        this.fetchData()
      } catch (error) {
        if (error !== 'cancel') {
          console.error(error)
          this.$message.error('删除失败')
        }
      }
    },
    async handleStatusChange(row, newStatus) {
      try {
        await axios.patch(`/api/purchase/orders/${row.id}/status`, { status: newStatus })
        this.$message.success(`状态已更新为${this.statusText(newStatus)}`)
        this.fetchData()
      } catch (error) {
        this.$message.error('状态更新失败')
      }
    },
    onSupplierChange(val) {
      const sup = this.supplierList.find(s => s.id === val)
      if (sup) this.form.supplierName = sup.name
    },
    selectProduct(product) {
      const exists = this.form.items.find(i => i.productId === product.id)
      if (exists) {
        this.$message.warning('商品已存在')
        return
      }
      this.form.items.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 1
      })
      this.calcTotal()
      this.showProductDialog = false
    },
    removeItem(index) {
      this.form.items.splice(index, 1)
      this.calcTotal()
    },
    calcTotal() {
      this.form.totalAmount = this.form.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
    },
    async saveOrder() {
      try {
        await this.$refs.orderForm.validate()
        if (this.form.items.length === 0) {
          this.$message.warning('请至少添加一个商品')
          return
        }
        this.saving = true
        if (this.editId) {
          await axios.put(`/api/purchase/orders/${this.editId}`, this.form)
          this.$message.success('修改成功')
        } else {
          await axios.post('/api/purchase/orders', this.form)
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
    },
    statusText(status) {
      const map = { pending: '待审核', approved: '已审核', completed: '已完成', cancelled: '已取消' }
      return map[status] || status
    },
    statusTagType(status) {
      const map = { pending: 'warning', approved: 'success', completed: 'info', cancelled: 'danger' }
      return map[status] || 'info'
    }
  }
}
</script>

<style scoped>

.purchase-order-container { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { margin-bottom: 24px; }
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
.filter-card, .table-card { border-radius: 24px; margin-bottom: 24px; }
.pagination-wrapper { margin-top: 24px; display: flex; justify-content: flex-end; }
.total-amount { font-size: 18px; font-weight: 700; color: #dc2626; }
</style>