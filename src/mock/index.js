import Mock from 'mockjs'


// 在文件开头或 permissions 相关部分定义
const permissionGroups = [
  { name: '基础资料', perms: ['商品管理', '客户管理'] },
  { name: '业务管理', perms: ['订单管理', '库存管理'] },
  { name: '财务管理', perms: ['财务看板', '收支记录'] },
  { name: '采购管理', perms: ['采购订单', '供应商管理'] },
  { name: '报表中心', perms: ['销售报表', '库存报表', '财务报表'] },
  { name: '系统管理', perms: ['用户管理', '员工管理', '权限管理', '操作日志', '数据字典'] },
  { name: '其他', perms: ['个人中心'] }
]

// 角色权限存储（提前声明，供登录 / 用户信息回调引用）
const rolePermissionsStore = [
  {
    role: 'admin',
    roleName: '管理员',
    perms: [
      '商品管理', '客户管理', '订单管理', '库存管理',
      '财务看板', '收支记录', '采购订单', '供应商管理',
      '销售报表', '库存报表', '财务报表',
      '用户管理', '员工管理', '权限管理', '操作日志', '数据字典',
      '个人中心'
    ]
  },
  {
    role: 'user',
    roleName: '普通用户',
    perms: ['商品管理', '客户管理', '订单管理', '个人中心']
  }
]
// ---------- 生成随机产品名称（杯壶罐盒类） ----------
function generateProductName() {
  const categories = [
    { type: '杯', features: ['保温', '随手', '咖啡', '运动水', '双层', '吸管', '啤酒', '刻度'] },
    { type: '壶', features: ['运动水', '户外水', '油', '喷', '长嘴', '茶', '咖啡'] },
    { type: '罐', features: ['密封', '储物', '奶粉', '糖果', '茶叶', '调味', '防潮'] },
    { type: '盒', features: ['保鲜', '饭', '分格', '收纳', '便当', '密封', '冰箱收纳'] }
  ]
  const materials = ['PP', 'Tritan', 'PPSU', 'ABS', 'PC', 'PET', 'HDPE', 'PS', 'SAN']
  const capacities = ['150ml', '200ml', '350ml', '500ml', '750ml', '1L', '1.2L', '1.5L', '2L', '2.5L', '3L', '5L']
  const colors = ['透明', '白色', '黑色', '蓝色', '绿色', '粉色', '磨砂', '渐变色']
  const category = Mock.Random.pick(categories)
  const feature = Mock.Random.pick(category.features)
  const capacity = Mock.Random.pick(capacities)
  const material = Mock.Random.pick(materials)
  const color = Mock.Random.pick(colors)
  return `${capacity}${feature}${category.type}（${material}）${color}`
}

let productList = []
let inventoryList = []
let nextProductId = 1
let nextInventoryId = 1

function recalcProductStock(productId) {
  const total = inventoryList.filter(item => item.productId === productId).reduce((sum, item) => sum + item.quantity, 0)
  const product = productList.find(p => p.id === productId)
  if (product) product.stock = total
  return total
}

function generateInventoryForProduct(product) {
  const warehouses = ['A区-01货架', 'A区-02货架', 'B区-01货架', 'B区-02货架', 'C区-01货架', 'C区-02货架', 'D区-01货架']
  const recordCount = Mock.Random.integer(1, 2)
  const totalStock = product.stock
  let remaining = totalStock
  for (let i = 0; i < recordCount; i++) {
    let quantity
    if (i === recordCount - 1) { quantity = remaining } else { quantity = Mock.Random.integer(0, remaining); remaining -= quantity }
    inventoryList.push({ id: nextInventoryId++, productId: product.id, productName: product.name, sku: `SKU-${String(product.id).padStart(4, '0')}`, quantity: quantity, warehouse: Mock.Random.pick(warehouses), threshold: Mock.Random.integer(500, 1500) })
  }
}

function initData() {
  productList = []; inventoryList = []; nextProductId = 1; nextInventoryId = 1
  const productCount = Mock.Random.integer(40, 80)
  for (let i = 1; i <= productCount; i++) {
    const product = { id: i, name: generateProductName(), price: parseFloat(Mock.Random.float(8, 180, 0, 2).toFixed(2)), stock: Mock.Random.integer(0, 30000) }
    productList.push(product); generateInventoryForProduct(product)
  }
  productList.forEach(p => recalcProductStock(p.id))
}
initData()

Mock.mock(/\/api\/products(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1); const pageSize = parseInt(url.searchParams.get('pageSize') || 10); const keyword = url.searchParams.get('keyword') || ''
  let filtered = productList.filter(p => !keyword || p.name.includes(keyword))
  filtered.forEach(p => recalcProductStock(p.id))
  const start = (page - 1) * pageSize
  return { code: 200, data: { list: filtered.slice(start, start + pageSize).map(p => ({ ...p })), total: filtered.length } }
})

Mock.mock('/api/products', 'post', (options) => {
  const body = JSON.parse(options.body)
  const newProduct = { id: nextProductId++, name: body.name || generateProductName(), price: body.price, stock: body.stock || 0 }
  productList.push(newProduct); generateInventoryForProduct(newProduct); recalcProductStock(newProduct.id)
  return { code: 200, data: { ...newProduct } }
})

Mock.mock(/\/api\/products\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/products\/(\d+)/)[1]); const body = JSON.parse(options.body)
  const product = productList.find(p => p.id === id)
  if (!product) return { code: 404, message: '商品不存在' }
  if (body.name) product.name = body.name
  if (body.price !== undefined) product.price = body.price
  recalcProductStock(id)
  return { code: 200, data: { ...product } }
})

Mock.mock(/\/api\/products\/\d+/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/api\/products\/(\d+)/)[1])
  const index = productList.findIndex(p => p.id === id)
  if (index === -1) return { code: 404, message: '商品不存在' }
  productList.splice(index, 1); inventoryList = inventoryList.filter(item => item.productId !== id)
  return { code: 200, message: '删除成功' }
})

Mock.mock(/\/api\/inventory(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1); const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const productName = url.searchParams.get('productName') || ''; const sku = url.searchParams.get('sku') || ''; const warehouse = url.searchParams.get('warehouse') || ''; const warningFilter = url.searchParams.get('warningFilter') || ''
  let filtered = inventoryList.filter(item => {
    if (productName && !item.productName.includes(productName)) return false
    if (sku && !item.sku.includes(sku)) return false
    if (warehouse && !item.warehouse.includes(warehouse)) return false
    if (warningFilter === 'below' && !(item.quantity <= item.threshold)) return false
    if (warningFilter === 'normal' && !(item.quantity > item.threshold)) return false
    return true
  })
  const start = (page - 1) * pageSize
  return { code: 200, data: { list: filtered.slice(start, start + pageSize), total: filtered.length } }
})

Mock.mock('/api/inventory', 'post', (options) => {
  const body = JSON.parse(options.body)
  const product = productList.find(p => p.id === body.productId)
  if (!product) return { code: 400, message: '商品不存在，无法添加入库记录' }
  const newInventory = { id: nextInventoryId++, productId: body.productId, productName: product.name, sku: body.sku || `SKU-${String(product.id).padStart(4, '0')}`, quantity: body.quantity, warehouse: body.warehouse, threshold: body.threshold }
  inventoryList.push(newInventory); recalcProductStock(product.id)
  return { code: 200, data: newInventory }
})

Mock.mock(/\/api\/inventory\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/inventory\/(\d+)/)[1]); const body = JSON.parse(options.body)
  const inv = inventoryList.find(i => i.id === id)
  if (!inv) return { code: 404, message: '库存记录不存在' }
  Object.assign(inv, body); recalcProductStock(inv.productId)
  return { code: 200, data: inv }
})

Mock.mock(/\/api\/inventory\/\d+/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/api\/inventory\/(\d+)/)[1])
  const index = inventoryList.findIndex(i => i.id === id)
  if (index === -1) return { code: 404, message: '库存记录不存在' }
  const productId = inventoryList[index].productId
  inventoryList.splice(index, 1); recalcProductStock(productId)
  return { code: 200, message: '删除成功' }
})

const userCount = Mock.Random.integer(20, 60)
let userList = []
for (let i = 1; i <= userCount; i++) {
  userList.push({ id: i, username: Mock.Random.name(), realName: Mock.Random.cname(), role: Mock.Random.pick(['admin', 'user']), email: Mock.Random.email(), phone: Mock.Random.string('number', 11), password: '123456' })
}
if (!userList.some(u => u.username === 'master')) {
  userList.unshift({ id: 0, username: 'master', realName: '超级管理员', role: 'super_admin', isSuperAdmin: true, email: 'master@erp.com', phone: '18888888888', password: '123123' })
}
if (!userList.some(u => u.username === 'admin')) {
  userList.unshift({ id: 9999, username: 'admin', realName: '管理员', role: 'admin', email: 'admin@example.com', phone: '13800138000', password: '123456' })
}

Mock.mock(/\/api\/users(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1); const pageSize = parseInt(url.searchParams.get('pageSize') || 10); const keyword = url.searchParams.get('keyword') || ''
  let filtered = userList.filter(item => !item.isSuperAdmin)
  if (keyword) { filtered = filtered.filter(item => item.username.includes(keyword) || item.realName.includes(keyword)) }
  const start = (page - 1) * pageSize
  return { code: 200, data: { list: filtered.slice(start, start + pageSize), total: filtered.length } }
})

Mock.mock('/api/users', 'post', (options) => {
  const body = JSON.parse(options.body)
  const newUser = { id: userList.length + 1, ...body }
  userList.push(newUser)
  return { code: 200, data: newUser }
})

Mock.mock(/\/api\/users\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/users\/(\d+)/)[1]); const body = JSON.parse(options.body)
  const index = userList.findIndex(u => u.id === id)
  if (index !== -1) { userList[index] = { ...userList[index], ...body }; return { code: 200, data: userList[index] } }
  return { code: 404, message: '用户不存在' }
})

Mock.mock(/\/api\/users\/\d+/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/api\/users\/(\d+)/)[1])
  const index = userList.findIndex(u => u.id === id)
  if (index !== -1) { userList.splice(index, 1); return { code: 200, message: '删除成功' } }
  return { code: 404, message: '用户不存在' }
})

Mock.mock(/\/api\/users\/(\d+)\/password/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/users\/(\d+)\/password/)[1])
  const { oldPassword, newPassword } = JSON.parse(options.body)
  const user = userList.find(u => u.id === id)  if (!user) {
    return { code: 404, message: '用户不存在' }
  }
  if (user.password !== oldPassword) {
    return { code: 400, message: '原密码错误' }
  }
  user.password = newPassword
  return { code: 200, message: '密码修改成功' }
})
// 获取当前用户信息（用于刷新权限）
Mock.mock('/api/user/info', 'get', () => {
  const token = localStorage.getItem('token')
  let userId = 1
  if (token && token.startsWith('mock-token-')) { userId = parseInt(token.split('-')[2]) }
  const user = userList.find(u => u.id === userId) || userList[0]
  let perms = []
  if (user.isSuperAdmin) {
    const allPerms = []
    permissionGroups.forEach(group => { allPerms.push(...group.perms) })
    perms = [...new Set(allPerms)]
  } else {
    const rolePerm = rolePermissionsStore.find(r => r.role === user.role)
    perms = rolePerm ? rolePerm.perms : []
  }
  const userInfo = { ...user, perms }
  delete userInfo.password
  return { code: 200, data: userInfo }
})

const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆', '苏州', '天津', '长沙', '郑州', '东莞']
const industries = ['科技', '信息', '网络', '软件', '贸易', '咨询', '实业', '文化传媒', '广告', '金融', '投资', '医疗', '教育', '物流', '建筑']
const suffixes = ['有限公司', '股份有限公司', '集团', '有限责任公司', '科技有限公司', '信息技术有限公司']

const customerCount = Mock.Random.integer(20, 60)
let globalCustomerList = []
for (let i = 1; i <= customerCount; i++) {
  globalCustomerList.push({ id: i, name: generateCompanyName(), contact: Mock.Random.cname(), phone: Mock.Random.string('number', 11), email: Mock.Random.email(), address: Mock.Random.county(true) + ' ', createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'), status: Mock.Random.pick(['active', 'inactive']) })
}

Mock.mock(/\/api\/customers(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1); const pageSize = parseInt(url.searchParams.get('pageSize') || 10); const keyword = url.searchParams.get('keyword') || ''
  let filtered = globalCustomerList
  if (keyword) { filtered = globalCustomerList.filter(c => c.name.includes(keyword) || c.contact.includes(keyword)) }
  const start = (page - 1) * pageSize
  return { code: 200, data: { list: filtered.slice(start, start + pageSize), total: filtered.length } }
})

Mock.mock('/api/customers', 'post', (options) => {
  const body = JSON.parse(options.body)
  const newId = globalCustomerList.length + 1
  const newCustomer = { id: newId, ...body, createTime: new Date().toLocaleString('zh-CN') }
  globalCustomerList.push(newCustomer)
  return { code: 200, data: newCustomer }
})

Mock.mock(/\/api\/customers\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/customers\/(\d+)/)[1]); const body = JSON.parse(options.body)
  const index = globalCustomerList.findIndex(c => c.id === id)
  if (index !== -1) { globalCustomerList[index] = { ...globalCustomerList[index], ...body }; return { code: 200, data: globalCustomerList[index] } }
  return { code: 404, message: '客户不存在' }
})

Mock.mock(/\/api\/customers\/\d+/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/api\/customers\/(\d+)/)[1])
  const index = globalCustomerList.findIndex(c => c.id === id)
  if (index !== -1) { globalCustomerList.splice(index, 1); return { code: 200, message: '删除成功' } }
  return { code: 404, message: '客户不存在' }
})

function generateCompanyName() {
  const city = Mock.Random.pick(cities); const industry = Mock.Random.pick(industries)
  if (Mock.Random.boolean(30)) { return industry + Mock.Random.pick(suffixes) }
  return city + industry + Mock.Random.pick(suffixes)
}

let orderList = []; let orderItemList = []; let nextOrderId = 1; let nextOrderItemId = 1

function calcOrderTotal(items) { return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) }
function getOrderItems(orderId) { return orderItemList.filter(item => item.orderId === orderId) }
function updateOrderTotal(orderId) { const order = orderList.find(o => o.id === orderId); if (order) { order.totalAmount = calcOrderTotal(getOrderItems(orderId)) } }

function adjustInventoryByOrder(orderId, direction) {
  const items = getOrderItems(orderId)
  items.forEach(item => {
    let inventoryRec = inventoryList.find(inv => inv.productId === item.productId)
    if (!inventoryRec) return
    if (direction === 'deduct') { inventoryRec.quantity = Math.max(0, inventoryRec.quantity - item.quantity) }
    else if (direction === 'restore') { inventoryRec.quantity += item.quantity }
    recalcProductStock(item.productId)
  })
}

function generateOrderItems(orderId) {
  const itemCount = Mock.Random.integer(1, 3)
  const shuffled = [...productList]
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]] }
  const selectedProducts = shuffled.slice(0, Math.min(itemCount, shuffled.length))
  const items = []
  selectedProducts.forEach(product => {
    const quantity = Mock.Random.integer(100, 10000); const unitPrice = product.price
    items.push({ id: nextOrderItemId++, orderId: orderId, productId: product.id, productName: product.name, quantity: quantity, unitPrice: unitPrice, subtotal: quantity * unitPrice })
  })
  return items
}

function initOrders() {
  orderList = []; orderItemList = []; nextOrderId = 1; nextOrderItemId = 1
  const statusFlow = ['pending', 'paid', 'shipped', 'completed', 'cancelled']
  const orderCount = Mock.Random.integer(20, 60)
  for (let i = 1; i <= orderCount; i++) {
    const randomCustomer = Mock.Random.pick(globalCustomerList)
    const status = Mock.Random.pick(statusFlow)
    const daysAgo = Mock.Random.integer(0, 30)
    const createTime = new Date(); createTime.setDate(createTime.getDate() - daysAgo)
    const createTimeStr = createTime.toISOString().slice(0, 19).replace('T', ' ')
    const order = { id: nextOrderId++, orderNo: `ORD${Mock.Random.date('yyyyMMdd')}${Mock.Random.string('number', 4)}`, customerName: randomCustomer.name, status: status, totalAmount: 0, createTime: createTimeStr, customerId: randomCustomer.id }
    orderList.push(order)
    const items = generateOrderItems(order.id)
    orderItemList.push(...items)
    updateOrderTotal(order.id)
    if (status === 'paid' || status === 'shipped' || status === 'completed') { adjustInventoryByOrder(order.id, 'deduct') }
  }
}
initOrders()

Mock.mock(/\/api\/orders(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1); const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const orderNo = url.searchParams.get('orderNo') || ''; const customerName = url.searchParams.get('customerName') || ''; const status = url.searchParams.get('status') || ''
  let filtered = orderList.filter(order => {
    if (orderNo && !order.orderNo.includes(orderNo)) return false
    if (customerName && !order.customerName.includes(customerName)) return false
    if (status && order.status !== status) return false
    return true
  })
  const start = (page - 1) * pageSize
  return { code: 200, data: { list: filtered.slice(start, start + pageSize).map(order => ({ ...order, items: getOrderItems(order.id) })), total: filtered.length } }
})

Mock.mock('/api/orders', 'post', (options) => {
  const body = JSON.parse(options.body)
  const { customerName, items } = body
  const newOrder = { id: nextOrderId++, orderNo: `ORD${Mock.Random.date('yyyyMMdd')}${Mock.Random.string('number', 4)}`, customerName: customerName, status: 'pending', totalAmount: 0, createTime: new Date().toLocaleString('zh-CN') }
  orderList.push(newOrder)
  const orderItems = items.map(item => ({ id: nextOrderItemId++, orderId: newOrder.id, productId: item.productId, productName: item.productName, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.quantity * item.unitPrice }))
  orderItemList.push(...orderItems)
  updateOrderTotal(newOrder.id)
  return { code: 200, data: { ...newOrder, items: orderItems } }
})

Mock.mock(/\/api\/orders\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/orders\/(\d+)/)[1]); const body = JSON.parse(options.body)
  const order = orderList.find(o => o.id === id)
  if (!order) return { code: 404, message: '订单不存在' }
  if (body.customerName) order.customerName = body.customerName
  return { code: 200, data: order }
})

Mock.mock(/\/api\/orders\/\d+\/status/, 'patch', (options) => {
  const id = parseInt(options.url.match(/\/api\/orders\/(\d+)/)[1]); const { status } = JSON.parse(options.body)
  const order = orderList.find(o => o.id === id)
  if (!order) return { code: 404, message: '订单不存在' }
  const oldStatus = order.status
  if (oldStatus === status) return { code: 200, data: order }
  if (oldStatus === 'pending' && status === 'paid') { adjustInventoryByOrder(id, 'deduct') }
  else if (oldStatus === 'paid' && status === 'cancelled') { adjustInventoryByOrder(id, 'restore') }
  order.status = status
  return { code: 200, data: order }
})

Mock.mock(/\/api\/orders\/\d+/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/api\/orders\/(\d+)/)[1])
  const orderIndex = orderList.findIndex(o => o.id === id)
  if (orderIndex === -1) return { code: 404, message: '订单不存在' }
  const order = orderList[orderIndex]
  if (['paid', 'shipped', 'completed'].includes(order.status)) { adjustInventoryByOrder(id, 'restore') }
  orderItemList = orderItemList.filter(item => item.orderId !== id)
  orderList.splice(orderIndex, 1)
  return { code: 200, message: '删除成功' }
})

function calculateFinanceMetrics() {
  const paidOrders = orderList.filter(o => ['paid', 'shipped', 'completed'].includes(o.status))
  const totalIncome = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  let totalExpense = 0
  inventoryList.forEach(inv => { const product = productList.find(p => p.id === inv.productId); if (product) { totalExpense += inv.quantity * product.price * 0.6 } })
  const profit = totalIncome - totalExpense
  const pendingIncome = orderList.filter(o => o.status === 'pending').reduce((s, o) => s + o.totalAmount, 0)
  return { totalIncome, totalExpense, profit, pendingIncome }
}

function getTrendData() {
  const days = []
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().slice(0, 10)) }  }
  const incomeTrend = days.map(date => orderList.filter(o => o.createTime.startsWith(date) && ['paid','shipped','completed'].includes(o.status)).reduce((s, o) => s + o.totalAmount, 0))
  const expenseTrend = days.map(() => Mock.Random.integer(5000, 15000))
  return { dates: days, income: incomeTrend, expense: expenseTrend }
}

let financeRecordList = []
let nextRecordId = 1

function initFinanceRecords() {
  financeRecordList = []; nextRecordId = 1
  orderList.forEach(order => {
    if (['paid','shipped','completed'].includes(order.status)) {
      financeRecordList.push({ id: nextRecordId++, date: order.createTime.slice(0,10), type: 'income', category: '销售收入', amount: order.totalAmount, description: `订单 ${order.orderNo}`, refId: order.id, refType: 'order' })
    }
  })
  const expenseCategories = ['采购成本', '人力成本', '运营费用', '税费', '办公费']
  for (let i = 0; i < 30; i++) {
    const daysAgo = Mock.Random.integer(1, 60)
    const date = new Date(); date.setDate(date.getDate() - daysAgo)
    financeRecordList.push({ id: nextRecordId++, date: date.toISOString().slice(0,10), type: 'expense', category: Mock.Random.pick(expenseCategories), amount: Mock.Random.float(500, 5000, 0, 2), description: [`支出 WORKNEED${i+1}`], refId: null, refType: null })
  }
}

Mock.mock('/api/finance/metrics', 'get', () => ({ code: 200, data: calculateFinanceMetrics() }))
Mock.mock('/api/finance/trend', 'get', () => ({ code: 200, data: getTrendData() }))

Mock.mock(/\/api\/finance\/records(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1); const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const type = url.searchParams.get('type') || ''; const category = url.searchParams.get('category') || ''
  const startDate = url.searchParams.get('startDate'); const endDate = url.searchParams.get('endDate')
  let filtered = financeRecordList.filter(r => {
    if (type && r.type !== type) return false
    if (category && !r.category.includes(category)) return false
    if (startDate && r.date < startDate) return false
    if (endDate && r.date > endDate) return false
    return true
  })
  filtered.sort((a,b) => b.date.localeCompare(a.date))
  const start = (page-1)*pageSize
  return { code: 200, data: { list: filtered.slice(start, start+pageSize), total: filtered.length } }
})

Mock.mock('/api/finance/records', 'post', (options) => {
  const body = JSON.parse(options.body)
  const newRecord = { id: nextRecordId++, date: body.date, type: body.type, category: body.category, amount: body.amount, description: body.description || '', refId: null, refType: null }
  financeRecordList.push(newRecord)
  return { code: 200, data: newRecord }
})

Mock.mock(/\/api\/finance\/records\/(\d+)/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/finance\/records\/(\d+)/)[1]); const body = JSON.parse(options.body)
  const index = financeRecordList.findIndex(r => r.id === id)
  if (index === -1) return { code: 404, message: '记录不存在' }
  financeRecordList[index] = { ...financeRecordList[index], ...body }
  return { code: 200, data: financeRecordList[index] }
})

Mock.mock(/\/api\/finance\/records\/(\d+)/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/api\/finance\/records\/(\d+)/)[1])
  const index = financeRecordList.findIndex(r => r.id === id)
  if (index === -1) return { code: 404, message: '记录不存在' }
  financeRecordList.splice(index, 1)
  return { code: 200, message: '删除成功' }
})

let employeeList = []
let nextEmployeeId = 1
const departments = ['技术部', '销售部', '财务部', '人事部', '运营部', '市场部', '产品部']
const positions = ['专员', '主管', '经理', '总监', '工程师', '分析师', '助理']

function initEmployees() {
  employeeList = []; nextEmployeeId = 1
  for (let i = 1; i <= userList.length; i++) {
    const user = userList[i-1]
    employeeList.push({ id: nextEmployeeId++, name: user.realName, department: Mock.Random.pick(departments), position: Mock.Random.pick(positions), phone: user.phone, email: user.email, hireDate: new Date(Date.now() - Mock.Random.integer(30, 800) * 24 * 3600 * 1000).toISOString().slice(0,10), userId: user.id })
  }
  while (employeeList.length < 20) {
    employeeList.push({ id: nextEmployeeId++, name: Mock.Random.cname(), department: Mock.Random.pick(departments), position: Mock.Random.pick(positions), phone: Mock.Random.string('number', 11), email: Mock.Random.email(), hireDate: new Date(Date.now() - Mock.Random.integer(30, 800) * 24 * 3600 * 1000).toISOString().slice(0,10), userId: null })
  }
}
initEmployees()

Mock.mock(/\/api\/employees(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1); const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const name = url.searchParams.get('name') || ''; const department = url.searchParams.get('department') || ''; const position = url.searchParams.get('position') || ''
  let filtered = employeeList.filter(e => {
    if (name && !e.name.includes(name)) return false
    if (department && !e.department.includes(department)) return false
    if (position && !e.position.includes(position)) return false
    return true
  })
  const start = (page-1)*pageSize
  return { code: 200, data: { list: filtered.slice(start, start+pageSize), total: filtered.length } }
})

Mock.mock('/api/employees', 'post', (options) => { const body = JSON.parse(options.body); const ne = { id: nextEmployeeId++, ...body }; employeeList.push(ne); return { code: 200, data: ne } })

Mock.mock(/\/api\/employees\/(\d+)/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/employees\/(\d+)/)[1]); const body = JSON.parse(options.body)
  const index = employeeList.findIndex(e => e.id === id)
  if (index === -1) return { code: 404, message: '员工不存在' }
  employeeList[index] = { ...employeeList[index], ...body }
  return { code: 200, data: employeeList[index] }
})

Mock.mock(/\/api\/employees\/(\d+)/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/api\/employees\/(\d+)/)[1])
  const index = employeeList.findIndex(e => e.id === id)
  if (index === -1) return { code: 404, message: '员工不存在' }
  employeeList.splice(index, 1)
  return { code: 200, message: '删除成功' }
})

initFinanceRecords()

let supplierList = []
let nextSupplierId = 1

function initSuppliers() {
  supplierList = []; nextSupplierId = 1
  const supplierNames = ['宏达塑胶制品有限公司', '鑫源电子科技', '顺丰包装材料', '宏达实业', '宏达科技有限公司', '华威精密制造', '南方物流集团', '嘉盛商贸', '恒通贸易', '诚信供应链', '金源纺织', '东方电机', '长城轴承']
  for (let i = 1; i <= 20; i++) {
    const name = supplierNames[i % supplierNames.length] + (i > supplierNames.length ? `（${i}）` : '')
    supplierList.push({ id: nextSupplierId++, name: name, contact: Mock.Random.cname(), phone: Mock.Random.string('number', 11), email: Mock.Random.email(), address: Mock.Random.county(true), status: Mock.Random.pick(['active', 'inactive']) })
  }
}
initSuppliers()

Mock.mock(/\/api\/suppliers(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1); const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const name = url.searchParams.get('name') || ''; const contact = url.searchParams.get('contact') || ''; const status = url.searchParams.get('status') || ''
  let filtered = supplierList.filter(s => {
    if (name && !s.name.includes(name)) return false
    if (contact && !s.contact.includes(contact)) return false
    if (status && s.status !== status) return false
    return true
  })
  const start = (page - 1) * pageSize
  return { code: 200, data: { list: filtered.slice(start, start + pageSize), total: filtered.length } }
})

Mock.mock('/api/suppliers', 'post', (options) => { const body = JSON.parse(options.body); const ns = { id: nextSupplierId++, ...body, createTime: new Date().toLocaleString('zh-CN') }; supplierList.push(ns); return { code: 200, data: ns } })

Mock.mock(/\/api\/suppliers\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/suppliers\/(\d+)/)[1]); const body = JSON.parse(options.body)
  const index = supplierList.findIndex(s => s.id === id)
  if (index === -1) return { code: 404, message: '供应商不存在' }
  supplierList[index] = { ...supplierList[index], ...body }
  return { code: 200, data: supplierList[index] }
})

Mock.mock(/\/api\/suppliers\/\d+/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/api\/suppliers\/(\d+)/)[1])
  const index = supplierList.findIndex(s => s.id === id)
  if (index === -1) return { code: 404, message: '供应商不存在' }
  supplierList.splice(index, 1)
  return { code: 200, message: '删除成功' }
})

let purchaseOrderList = []
let purchaseOrderItemList = []
let nextPurchaseOrderId = 1
let nextPurchaseOrderItemId = 1

function initPurchaseOrders() {
  purchaseOrderList = []; purchaseOrderItemList = []; nextPurchaseOrderId = 1; nextPurchaseOrderItemId = 1
  const statusFlow = ['pending', 'approved', 'completed', 'cancelled']
  for (let i = 1; i <= 30; i++) {
    const supplier = Mock.Random.pick(supplierList)
    const status = Mock.Random.pick(statusFlow)
    const daysAgo = Mock.Random.integer(0, 60)
    const orderDate = new Date(); orderDate.setDate(orderDate.getDate() - daysAgo)
    const orderDateStr = orderDate.toISOString().slice(0,10)
    const totalAmount = Mock.Random.float(1000, 50000, 0, 2)
    const order = { id: nextPurchaseOrderId++, orderNo: `PO${Mock.Random.date('yyyyMMdd')}${Mock.Random.string('number', 4)}`, supplierId: supplier.id, supplierName: supplier.name, totalAmount: totalAmount, orderDate: orderDateStr, status: status, createTime: orderDateStr + ' ' + Mock.Random.time('HH:mm:ss') }
    purchaseOrderList.push(order)
    const itemCount = Mock.Random.integer(1, 3)
    const shuffledProducts = [...productList].sort(() => 0.5 - Math.random())
    shuffledProducts.slice(0, itemCount).forEach(product => {
      const quantity = Mock.Random.integer(10, 500); const unitPrice = product.price
      purchaseOrderItemList.push({ id: nextPurchaseOrderItemId++, orderId: order.id, productId: product.id, productName: product.name, quantity: quantity, unitPrice: unitPrice, subtotal: quantity * unitPrice })
    })
  }
}
initPurchaseOrders()

function getPurchaseOrderItems(orderId) {  return purchaseOrderItemList.filter(item => item.orderId === orderId)
}

Mock.mock(/\/api\/purchase\/orders(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1); const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const orderNo = url.searchParams.get('orderNo') || ''; const supplierName = url.searchParams.get('supplierName') || ''; const status = url.searchParams.get('status') || ''
  let filtered = purchaseOrderList.filter(o => {
    if (orderNo && !o.orderNo.includes(orderNo)) return false
    if (supplierName && !o.supplierName.includes(supplierName)) return false
    if (status && o.status !== status) return false
    return true
  })
  const start = (page - 1) * pageSize
  return { code: 200, data: { list: filtered.slice(start, start + pageSize).map(order => ({ ...order, items: getPurchaseOrderItems(order.id) })), total: filtered.length } }
})

Mock.mock('/api/purchase/orders', 'post', (options) => {
  const body = JSON.parse(options.body)
  const newOrder = { id: nextPurchaseOrderId++, orderNo: `PO${Mock.Random.date('yyyyMMdd')}${Mock.Random.string('number', 4)}`, supplierId: body.supplierId, supplierName: body.supplierName, totalAmount: body.totalAmount, orderDate: body.orderDate, status: 'pending', createTime: new Date().toLocaleString('zh-CN') }
  purchaseOrderList.push(newOrder)
  const items = body.items.map(item => ({ id: nextPurchaseOrderItemId++, orderId: newOrder.id, productId: item.productId, productName: item.productName, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.quantity * item.unitPrice }))
  purchaseOrderItemList.push(...items)
  return { code: 200, data: { ...newOrder, items } }
})

Mock.mock(/\/api\/purchase\/orders\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/purchase\/orders\/(\d+)/)[1]); const body = JSON.parse(options.body)
  const orderIndex = purchaseOrderList.findIndex(o => o.id === id)
  if (orderIndex === -1) return { code: 404, message: '订单不存在' }
  purchaseOrderList[orderIndex] = { ...purchaseOrderList[orderIndex], ...body }
  purchaseOrderItemList = purchaseOrderItemList.filter(item => item.orderId !== id)
  const newItems = body.items.map(item => ({ id: nextPurchaseOrderItemId++, orderId: id, productId: item.productId, productName: item.productName, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.quantity * item.unitPrice }))
  purchaseOrderItemList.push(...newItems)
  return { code: 200, data: { ...purchaseOrderList[orderIndex], items: newItems } }
})

Mock.mock(/\/api\/purchase\/orders\/\d+\/status/, 'patch', (options) => {
  const id = parseInt(options.url.match(/\/api\/purchase\/orders\/(\d+)/)[1]); const { status } = JSON.parse(options.body)
  const order = purchaseOrderList.find(o => o.id === id)
  if (!order) return { code: 404, message: '订单不存在' }
  order.status = status
  return { code: 200, data: order }
})

Mock.mock(/\/api\/purchase\/orders\/\d+/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/api\/purchase\/orders\/(\d+)/)[1])
  const orderIndex = purchaseOrderList.findIndex(o => o.id === id)
  if (orderIndex === -1) return { code: 404, message: '订单不存在' }
  purchaseOrderList.splice(orderIndex, 1)
  purchaseOrderItemList = purchaseOrderItemList.filter(item => item.orderId !== id)
  return { code: 200, message: '删除成功' }
})

Mock.mock('/api/reports/sales/summary', 'get', () => {
  const totalSales = orderList.reduce((sum, o) => sum + o.totalAmount, 0)
  const paidSales = orderList.filter(o => ['paid','shipped','completed'].includes(o.status)).reduce((s,o) => s + o.totalAmount, 0)
  return { code: 200, data: { totalSales, paidSales, orderCount: orderList.length, monthGrowth: 12.5 } }
})
Mock.mock('/api/reports/sales/trend', 'get', () => {
  const days = Array.from({length:30},(_,i)=>{ const d = new Date(); d.setDate(d.getDate() - (29-i)); return d.toISOString().slice(0,10) })
  const trend = days.map(() => Mock.Random.integer(8000, 25000))
  return { code: 200, data: { days, trend } }
})
Mock.mock('/api/reports/sales/top-products', 'get', () => {
  const productSales = new Map()
  orderItemList.forEach(item => {
    const existing = productSales.get(item.productId) || { name: item.productName, soldCount: 0, amount: 0 }
    existing.soldCount += item.quantity; existing.amount += item.quantity * item.unitPrice
    productSales.set(item.productId, existing)
  })
  const top10 = Array.from(productSales.values()).sort((a,b) => b.soldCount - a.soldCount).slice(0,10)
  return { code: 200, data: top10 }
})

Mock.mock('/api/reports/inventory/summary', 'get', () => {
  const totalStock = productList.reduce((s,p) => s + p.stock, 0)
  const lowStockCount = productList.filter(p => p.stock < 50).length
  return { code: 200, data: { totalStock, lowStockCount, turnoverRate: 3.2 } }
})
Mock.mock('/api/reports/inventory/warehouse-distribution', 'get', () => {
  const warehouseMap = new Map()
  inventoryList.forEach(inv => { const wh = inv.warehouse; warehouseMap.set(wh, (warehouseMap.get(wh) || 0) + inv.quantity) })
  return { code: 200, data: Array.from(warehouseMap.entries()).map(([name, value]) => ({ name, value })) }
})
Mock.mock('/api/reports/inventory/low-stock', 'get', () => ({ code: 200, data: productList.filter(p => p.stock < 50).slice(0,10).map(p => ({ name: p.name, stock: p.stock, threshold: 50 })) }))

Mock.mock('/api/reports/finance/profit', 'get', () => {
  const metrics = calculateFinanceMetrics()
  return { code: 200, data: { profit: metrics.profit, totalIncome: metrics.totalIncome, totalExpense: metrics.totalExpense } }
})
Mock.mock('/api/reports/finance/trend', 'get', () => ({ code: 200, data: getTrendData() }))
Mock.mock(/\/api\/reports\/finance\/records/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1); const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  let list = [...financeRecordList].sort((a, b) => b.date.localeCompare(a.date))
  const total = list.length; const start = (page - 1) * pageSize
  return { code: 200, data: { list: list.slice(start, start + pageSize), total } }
})

userList.forEach(u => {
  if (!u.isSuperAdmin) u.password = '123456'
})

Mock.mock('/api/auth/login', 'post', (options) => {
  const { username, password } = JSON.parse(options.body)
  const user = userList.find(u => u.username === username && u.password === password)
  if (user) {
    let perms = []
    if (user.isSuperAdmin) {
      const allPerms = []
      permissionGroups.forEach(group => { allPerms.push(...group.perms) })
      perms = [...new Set(allPerms)]
    } else {
      const rolePerm = rolePermissionsStore.find(r => r.role === user.role)
      perms = rolePerm ? rolePerm.perms : []
    }
    const token = 'mock-token-' + user.id
    const userInfo = { ...user, perms }; delete userInfo.password
    return { code: 200, data: { token, userInfo } }
  } else {
    return { code: 401, message: '用户名或密码错误' }
  }
})

let operationLogs = []
let nextLogId = 1

function initOperationLogs() {
  operationLogs = []; nextLogId = 1
  const actions = ['登录', '登出', '新增商品', '编辑商品', '删除商品', '新增客户', '编辑客户', '新增订单', '修改订单状态', '新增用户', '编辑用户']
  const users = [...userList]
  for (let i = 0; i < 200; i++) {
    const user = Mock.Random.pick(users); const action = Mock.Random.pick(actions); const daysAgo = Mock.Random.integer(0, 30)
    const logTime = new Date(); logTime.setDate(logTime.getDate() - daysAgo)
    operationLogs.push({ id: nextLogId++, time: logTime.toISOString().slice(0, 19).replace('T', ' '), user: user.realName, username: user.username, action: action, detail: `执行了${action}操作`, ip: Mock.Random.ip(), userAgent: 'Chrome/120.0.0.0' })
  }
  operationLogs.sort((a, b) => b.time.localeCompare(a.time))
}
initOperationLogs()

Mock.mock(/\/api\/logs(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1); const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const username = url.searchParams.get('username') || ''; const action = url.searchParams.get('action') || ''
  const startDate = url.searchParams.get('startDate'); const endDate = url.searchParams.get('endDate')
  let filtered = operationLogs.filter(log => {
    if (username && !log.username.includes(username)) return false
    if (action && !log.action.includes(action)) return false
    if (startDate && log.time < startDate) return false
    if (endDate && log.time > endDate) return false
    return true
  })
  const total = filtered.length; const start = (page - 1) * pageSize
  return { code: 200, data: { list: filtered.slice(start, start + pageSize), total } }
})

Mock.mock('/api/logs', 'post', (options) => {
  const body = JSON.parse(options.body)
  const newLog = { id: nextLogId++, time: new Date().toISOString().slice(0, 19).replace('T', ' '), ...body }
  operationLogs.unshift(newLog)
  return { code: 200, data: newLog }
})

const orderStatusDict = [{ code: 'pending', name: '待付款' }, { code: 'paid', name: '已付款' }, { code: 'shipped', name: '已发货' }, { code: 'completed', name: '已完成' }, { code: 'cancelled', name: '已取消' }]
const categoryDict = [{ code: 'cup', name: '杯类' }, { code: 'bottle', name: '壶类' }, { code: 'jar', name: '罐类' }, { code: 'box', name: '盒类' }]

Mock.mock('/api/dict/order-status', 'get', () => ({ code: 200, data: orderStatusDict }))
Mock.mock('/api/dict/categories', 'get', () => ({ code: 200, data: categoryDict }))

Mock.mock('/api/permissions/roles', 'get', () => ({ code: 200, data: rolePermissionsStore }))

Mock.mock('/api/permissions/roles', 'put', (options) => {
  const { role, perms } = JSON.parse(options.body)
  const index = rolePermissionsStore.findIndex(r => r.role === role)
  if (index !== -1) {
    rolePermissionsStore[index].perms = perms
    return { code: 200, data: rolePermissionsStore[index], message: '保存成功' }
  }
  return { code: 404, message: '角色不存在' }
})
