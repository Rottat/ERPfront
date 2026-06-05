import Mock from 'mockjs'

// 在文件开头或 permissions 相关部分定义
const permissionGroups = [
  { name: '基础资料', perms: ['商品管理', '客户管理'] },
  { name: '业务管理', perms: ['订单管理', '库存管理'] },
  { name: '财务管理', perms: ['财务管理', '财务报表查看'] },
  { name: '系统管理', perms: ['用户管理', '员工管理', '权限管理', '操作日志', '数据字典'] },
  { name: '报表中心', perms: ['销售报表', '库存报表', '财务报表'] },
  { name: '采购管理', perms: ['采购订单', '供应商管理'] },
  { name: '其他', perms: ['个人中心'] }
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

// ---------- 数据存储 ----------
let productList = []       // 商品主数据：{ id, name, price, stock (动态计算，不直接存储) }
let inventoryList = []    // 库存记录：{ id, productId, productName, sku, quantity, warehouse, threshold }
let nextProductId = 1
let nextInventoryId = 1

// 辅助函数：重新计算某个商品的总库存
function recalcProductStock(productId) {
  const total = inventoryList
    .filter(item => item.productId === productId)
    .reduce((sum, item) => sum + item.quantity, 0)
  // 更新 productList 中对应商品的 stock 字段（直接修改对象）
  const product = productList.find(p => p.id === productId)
  if (product) product.stock = total
  return total
}

// 辅助函数：为指定商品生成库存记录（1~2 条，分配总数量）
function generateInventoryForProduct(product) {
  const warehouses = ['A区-01货架', 'A区-02货架', 'B区-01货架', 'B区-02货架', 'C区-01货架', 'C区-02货架', 'D区-01货架']
  const recordCount = Mock.Random.integer(1, 2)
  const totalStock = product.stock   // 商品的总库存（已随机生成）
  let remaining = totalStock
  for (let i = 0; i < recordCount; i++) {
    let quantity
    if (i === recordCount - 1) {
      quantity = remaining   // 最后一条分剩余全部
    } else {
      quantity = Mock.Random.integer(0, remaining)
      remaining -= quantity
    }
    const warehouse = Mock.Random.pick(warehouses)
    const threshold = Mock.Random.integer(500, 1500)
    inventoryList.push({
      id: nextInventoryId++,
      productId: product.id,
      productName: product.name,
      sku: `SKU-${String(product.id).padStart(4, '0')}`,
      quantity: quantity,
      warehouse: warehouse,
      threshold: threshold
    })
  }
}

// ---------- 初始化数据：生成 50 个商品，每个商品附带 1~2 条库存记录 ----------
function initData() {
  productList = []
  inventoryList = []
  nextProductId = 1
  nextInventoryId = 1

  const productCount = Mock.Random.integer(40, 80)
  for (let i = 1; i <= productCount; i++) {
    const product = {
      id: i,
      name: generateProductName(),
      price: parseFloat(Mock.Random.float(8, 180, 0, 2).toFixed(2)),
      stock: Mock.Random.integer(0, 30000)   // 先随机总库存
    }
    productList.push(product)
    // 根据总库存生成库存记录
    generateInventoryForProduct(product)
  }
  // 最后确保所有商品的 stock 与库存记录一致（其实上面生成时已经保证，但再校验一次）
  productList.forEach(p => recalcProductStock(p.id))
}

initData()   // 模块加载时执行一次

// ---------- 商品接口 Mock（保持总库存由库存记录动态决定） ----------
Mock.mock(/\/api\/products(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1)
  const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const keyword = url.searchParams.get('keyword') || ''
  let filtered = productList.filter(p => !keyword || p.name.includes(keyword))
  // 重新计算每个商品的 stock（确保最新）
  filtered.forEach(p => recalcProductStock(p.id))
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageData = filtered.slice(start, end).map(p => ({ ...p }))  // 浅拷贝
  return {
    code: 200,
    data: { list: pageData, total: filtered.length }
  }
})

Mock.mock('/api/products', 'post', (options) => {
  const body = JSON.parse(options.body)
  const newProduct = {
    id: nextProductId++,
    name: body.name || generateProductName(),
    price: body.price,
    stock: body.stock || 0
  }
  productList.push(newProduct)
  // 为新商品生成库存记录（即使 stock 为 0 也要生成一条空记录？可选）
  generateInventoryForProduct(newProduct)
  recalcProductStock(newProduct.id)
  return { code: 200, data: { ...newProduct } }
})

Mock.mock(/\/api\/products\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/products\/(\d+)/)[1])
  const body = JSON.parse(options.body)
  const product = productList.find(p => p.id === id)
  if (!product) return { code: 404, message: '商品不存在' }
  // 注意：修改商品名称、价格等，不直接修改 stock（stock 由库存决定）
  if (body.name) product.name = body.name
  if (body.price !== undefined) product.price = body.price
  // 如果 body 中包含了 stock，忽略它（禁止直接修改总库存）
  recalcProductStock(id)
  return { code: 200, data: { ...product } }
})

Mock.mock(/\/api\/products\/\d+/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/api\/products\/(\d+)/)[1])
  const index = productList.findIndex(p => p.id === id)
  if (index === -1) return { code: 404, message: '商品不存在' }
  productList.splice(index, 1)
  // 同时删除该商品的所有库存记录
  inventoryList = inventoryList.filter(item => item.productId !== id)
  return { code: 200, message: '删除成功' }
})

// ---------- 库存接口 Mock（操作时自动同步商品总库存） ----------
Mock.mock(/\/api\/inventory(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1)
  const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const productName = url.searchParams.get('productName') || ''
  const sku = url.searchParams.get('sku') || ''
  const warehouse = url.searchParams.get('warehouse') || ''
  const warningFilter = url.searchParams.get('warningFilter') || ''

  let filtered = inventoryList.filter(item => {
    if (productName && !item.productName.includes(productName)) return false
    if (sku && !item.sku.includes(sku)) return false
    if (warehouse && !item.warehouse.includes(warehouse)) return false
    if (warningFilter === 'below' && !(item.quantity <= item.threshold)) return false
    if (warningFilter === 'normal' && !(item.quantity > item.threshold)) return false
    return true
  })
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageData = filtered.slice(start, end)
  return {
    code: 200,
    data: { list: pageData, total: filtered.length }
  }
})

Mock.mock('/api/inventory', 'post', (options) => {
  const body = JSON.parse(options.body)
  // 确保 productId 存在（前端应传入）
  const product = productList.find(p => p.id === body.productId)
  if (!product) return { code: 400, message: '商品不存在，无法添加入库记录' }
  const newInventory = {
    id: nextInventoryId++,
    productId: body.productId,
    productName: product.name,
    sku: body.sku || `SKU-${String(product.id).padStart(4, '0')}`,
    quantity: body.quantity,
    warehouse: body.warehouse,
    threshold: body.threshold
  }
  inventoryList.push(newInventory)
  recalcProductStock(product.id)   // 同步更新商品总库存
  return { code: 200, data: newInventory }
})

Mock.mock(/\/api\/inventory\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/inventory\/(\d+)/)[1])
  const body = JSON.parse(options.body)
  const inv = inventoryList.find(i => i.id === id)
  if (!inv) return { code: 404, message: '库存记录不存在' }
  // 更新字段
  Object.assign(inv, body)
  recalcProductStock(inv.productId)
  return { code: 200, data: inv }
})

Mock.mock(/\/api\/inventory\/\d+/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/api\/inventory\/(\d+)/)[1])
  const index = inventoryList.findIndex(i => i.id === id)
  if (index === -1) return { code: 404, message: '库存记录不存在' }
  const productId = inventoryList[index].productId
  inventoryList.splice(index, 1)
  recalcProductStock(productId)
  return { code: 200, message: '删除成功' }
})

// 用户列表
const userCount = Mock.Random.integer(20, 60)
let userList = []
for (let i = 1; i <= userCount; i++) {
  userList.push({
    id: i,
    username: Mock.Random.name(),
    realName: Mock.Random.cname(),
    role: Mock.Random.pick(['admin', 'user']),
    email: Mock.Random.email(),
    phone: Mock.Random.string('number', 11),
    password: '123456'   // 普通用户默认密码
  })
}
if (!userList.some(u => u.username === 'master')) {
  userList.unshift({
    id: 0,
    username: 'master',
    realName: '超级管理员',
    role: 'super_admin',      // 特殊角色标识
    isSuperAdmin: true,       // 用于前端判断和过滤
    email: 'master@erp.com',
    phone: '18888888888',
    password: '123123'
  })
}

// 确保存在admin用户
if (!userList.some(u => u.username === 'admin')) {
  userList.unshift({
    id: -1,
    username: 'admin',
    realName: '管理员',
    role: 'admin',
    email: 'admin@example.com',
    phone: '13800138000',
    password: '123456'
  })
}

Mock.mock(/\/api\/users(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1)
  const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const keyword = url.searchParams.get('keyword') || ''
  let filtered = userList.filter(item => !item.isSuperAdmin)   // 关键：过滤掉超级管理员
  if (keyword) {
    filtered = filtered.filter(item => 
      item.username.includes(keyword) || item.realName.includes(keyword)
    )
  }
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageData = filtered.slice(start, end)
  return {
    code: 200,
    data: { list: pageData, total: filtered.length }
  }
})

Mock.mock('/api/users', 'post', (options) => {
  const body = JSON.parse(options.body)
  const newUser = {
    id: userList.length + 1,
    ...body
  }
  userList.push(newUser)
  return { code: 200, data: newUser }
})

Mock.mock(/\/api\/users\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/users\/(\d+)/)[1])
  const body = JSON.parse(options.body)
  const index = userList.findIndex(u => u.id === id)
  if (index !== -1) {
    userList[index] = { ...userList[index], ...body }
    return { code: 200, data: userList[index] }
  }
  return { code: 404, message: '用户不存在' }
})

Mock.mock(/\/api\/users\/\d+/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/api\/users\/(\d+)/)[1])
  const index = userList.findIndex(u => u.id === id)
  if (index !== -1) {
    userList.splice(index, 1)
    return { code: 200, message: '删除成功' }
  }
  return { code: 404, message: '用户不存在' }
})
// 修改用户密码
Mock.mock(/\/api\/users\/(\d+)\/password/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/users\/(\d+)\/password/)[1])
  const { oldPassword, newPassword } = JSON.parse(options.body)
  const user = userList.find(u => u.id === id)
  if (!user) {
    return { code: 404, message: '用户不存在' }
  }
  // 校验旧密码（超级管理员或普通用户都需校验）
  if (user.password !== oldPassword) {
    return { code: 400, message: '原密码错误' }
  }
  // 更新密码
  user.password = newPassword
  return { code: 200, message: '密码修改成功' }
})
// 获取当前登录用户信息
// 获取当前用户信息（用于刷新权限）
Mock.mock('/api/user/info', 'get', () => {
  // 实际应解析 token，这里简化：从 localStorage 读取 token 中的 userId
  const token = localStorage.getItem('token')
  let userId = 1
  if (token && token.startsWith('mock-token-')) {
    userId = parseInt(token.split('-')[2])
  }
  const user = userList.find(u => u.id === userId) || userList[0]
  let perms = []
  if (user.isSuperAdmin) {
    const allPerms = []
    permissionGroups.forEach(group => {
      allPerms.push(...group.perms)
    })
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

// ================= 客户数据 Mock =================
// 生成随机客户列表（与 customer.js 生成规则一致）
const customerCount = Mock.Random.integer(20, 60)
let globalCustomerList = []
for (let i = 1; i <= customerCount; i++) {
  globalCustomerList.push({
    id: i,
    name: generateCompanyName(),   // 复用前面的公司名生成函数
    contact: Mock.Random.cname(),
    phone: Mock.Random.string('number', 11),
    email: Mock.Random.email(),
    address: Mock.Random.county(true) + ' ',
    createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
    status: Mock.Random.pick(['active', 'inactive'])
  })
}

// 客户列表 API
Mock.mock(/\/api\/customers(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1)
  const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const keyword = url.searchParams.get('keyword') || ''
  let filtered = globalCustomerList
  if (keyword) {
    filtered = globalCustomerList.filter(c => c.name.includes(keyword) || c.contact.includes(keyword))
  }
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageData = filtered.slice(start, end)
  return { code: 200, data: { list: pageData, total: filtered.length } }
})

Mock.mock('/api/customers', 'post', (options) => {
  const body = JSON.parse(options.body)
  const newId = globalCustomerList.length + 1
  const newCustomer = { id: newId, ...body, createTime: new Date().toLocaleString('zh-CN') }
  globalCustomerList.push(newCustomer)
  return { code: 200, data: newCustomer }
})

Mock.mock(/\/api\/customers\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/customers\/(\d+)/)[1])
  const body = JSON.parse(options.body)
  const index = globalCustomerList.findIndex(c => c.id === id)
  if (index !== -1) {
    globalCustomerList[index] = { ...globalCustomerList[index], ...body }
    return { code: 200, data: globalCustomerList[index] }
  }
  return { code: 404, message: '客户不存在' }
})

Mock.mock(/\/api\/customers\/\d+/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/api\/customers\/(\d+)/)[1])
  const index = globalCustomerList.findIndex(c => c.id === id)
  if (index !== -1) {
    globalCustomerList.splice(index, 1)
    return { code: 200, message: '删除成功' }
  }
  return { code: 404, message: '客户不存在' }
})

function generateCompanyName() {
  const city = Mock.Random.pick(cities)
  const industry = Mock.Random.pick(industries)
  if (Mock.Random.boolean(30)) {
    return industry + Mock.Random.pick(suffixes)
  }
  return city + industry + Mock.Random.pick(suffixes)
}

let orderList = []        // 订单主表
let orderItemList = []    // 订单明细
let nextOrderId = 1
let nextOrderItemId = 1

// 辅助函数：根据订单明细计算总金额
function calcOrderTotal(items) {
  return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
}

// 辅助函数：获取订单的所有明细
function getOrderItems(orderId) {
  return orderItemList.filter(item => item.orderId === orderId)
}

// 辅助函数：更新订单总金额
function updateOrderTotal(orderId) {
  const order = orderList.find(o => o.id === orderId)
  if (order) {
    const items = getOrderItems(orderId)
    order.totalAmount = calcOrderTotal(items)
  }
}

// 辅助函数：根据订单明细扣减或恢复库存（direction: 'deduct' 或 'restore'）
function adjustInventoryByOrder(orderId, direction) {
  const items = getOrderItems(orderId)
  items.forEach(item => {
    // 查找该商品的库存记录（选择第一个仓库，实际业务需指定，这里简化）
    let inventoryRec = inventoryList.find(inv => inv.productId === item.productId)
    if (!inventoryRec) return
    if (direction === 'deduct') {
      const newQty = Math.max(0, inventoryRec.quantity - item.quantity)
      inventoryRec.quantity = newQty
    } else if (direction === 'restore') {
      inventoryRec.quantity += item.quantity
    }
    // 同步更新商品总库存
    recalcProductStock(item.productId)
  })
}

// 辅助函数：随机生成订单明细（基于当前商品列表，随机选取1~3个不同商品）
function generateOrderItems(orderId) {
  const itemCount = Mock.Random.integer(1, 3)
  // 随机打乱商品列表
  const shuffled = [...productList]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const selectedProducts = shuffled.slice(0, Math.min(itemCount, shuffled.length))
  const items = []
  selectedProducts.forEach(product => {
    const quantity = Mock.Random.integer(100, 10000)
    const unitPrice = product.price
    items.push({
      id: nextOrderItemId++,
      orderId: orderId,
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      unitPrice: unitPrice,
      subtotal: quantity * unitPrice
    })
  })
  return items
}

// 初始化订单数据（生成 30 个随机订单，每个订单包含明细，根据状态扣减相应库存）
function initOrders() {
  orderList = []
  orderItemList = []
  nextOrderId = 1
  nextOrderItemId = 1
  
  const statusFlow = ['pending', 'paid', 'shipped', 'completed', 'cancelled']
  const orderCount = Mock.Random.integer(20, 60)
  for (let i = 1; i <= orderCount; i++) {
    const randomCustomer = Mock.Random.pick(globalCustomerList)
    // const customerName = generateCompanyName()
    const status = Mock.Random.pick(statusFlow)
    const daysAgo = Mock.Random.integer(0, 30)
const createTime = new Date()
createTime.setDate(createTime.getDate() - daysAgo)
const createTimeStr = createTime.toISOString().slice(0, 19).replace('T', ' ')
    const order = {
      id: nextOrderId++,
      orderNo: `ORD${Mock.Random.date('yyyyMMdd')}${Mock.Random.string('number', 4)}`,
      customerName: randomCustomer.name,
      status: status,
      totalAmount: 0,
      createTime: createTimeStr,
      customerId: randomCustomer.id,
    }
    orderList.push(order)
    // 生成明细
    const items = generateOrderItems(order.id)
    orderItemList.push(...items)
    updateOrderTotal(order.id)
    // 如果订单状态是 paid / shipped / completed，扣减库存（模拟已付款历史订单）
    if (status === 'paid' || status === 'shipped' || status === 'completed') {
      adjustInventoryByOrder(order.id, 'deduct')
    }
  }
}

// 调用初始化（确保 productList 已存在）
initOrders()

// ---------- 订单接口 Mock ----------
Mock.mock(/\/api\/orders(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1)
  const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const orderNo = url.searchParams.get('orderNo') || ''
  const customerName = url.searchParams.get('customerName') || ''
  const status = url.searchParams.get('status') || ''

  let filtered = orderList.filter(order => {
    if (orderNo && !order.orderNo.includes(orderNo)) return false
    if (customerName && !order.customerName.includes(customerName)) return false
    if (status && order.status !== status) return false
    return true
  })
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageData = filtered.slice(start, end).map(order => ({
    ...order,
    items: getOrderItems(order.id)
  }))
  return { code: 200, data: { list: pageData, total: filtered.length } }
})

Mock.mock('/api/orders', 'post', (options) => {
  const body = JSON.parse(options.body)
  const { customerName, items } = body
  const newOrder = {
    id: nextOrderId++,
    orderNo: `ORD${Mock.Random.date('yyyyMMdd')}${Mock.Random.string('number', 4)}`,
    customerName: customerName,
    status: 'pending',
    totalAmount: 0,
    createTime: new Date().toLocaleString('zh-CN')
  }
  orderList.push(newOrder)
  const orderItems = items.map(item => ({
    id: nextOrderItemId++,
    orderId: newOrder.id,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.quantity * item.unitPrice
  }))
  orderItemList.push(...orderItems)
  updateOrderTotal(newOrder.id)
  return { code: 200, data: { ...newOrder, items: orderItems } }
})

Mock.mock(/\/api\/orders\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/orders\/(\d+)/)[1])
  const body = JSON.parse(options.body)
  const order = orderList.find(o => o.id === id)
  if (!order) return { code: 404, message: '订单不存在' }
  if (body.customerName) order.customerName = body.customerName
  // 如需修改明细，此处可扩展，但一般业务不允许直接修改已生成订单的明细
  return { code: 200, data: order }
})

Mock.mock(/\/api\/orders\/\d+\/status/, 'patch', (options) => {
  const id = parseInt(options.url.match(/\/api\/orders\/(\d+)/)[1])
  const { status } = JSON.parse(options.body)
  const order = orderList.find(o => o.id === id)
  if (!order) return { code: 404, message: '订单不存在' }
  const oldStatus = order.status
  if (oldStatus === status) return { code: 200, data: order }
  // 状态迁移规则
  if (oldStatus === 'pending' && status === 'paid') {
    adjustInventoryByOrder(id, 'deduct')
  } else if (oldStatus === 'paid' && status === 'cancelled') {
    adjustInventoryByOrder(id, 'restore')
  }
  order.status = status
  return { code: 200, data: order }
})

Mock.mock(/\/api\/orders\/\d+/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/api\/orders\/(\d+)/)[1])
  const orderIndex = orderList.findIndex(o => o.id === id)
  if (orderIndex === -1) return { code: 404, message: '订单不存在' }
  const order = orderList[orderIndex]
  if (['paid', 'shipped', 'completed'].includes(order.status)) {
    adjustInventoryByOrder(id, 'restore')
  }
  orderItemList = orderItemList.filter(item => item.orderId !== id)
  orderList.splice(orderIndex, 1)
  return { code: 200, message: '删除成功' }
})

// ================= 财务数据 =================
// 动态计算总收入和利润（基于订单）
function calculateFinanceMetrics() {
  const paidOrders = orderList.filter(o => ['paid', 'shipped', 'completed'].includes(o.status))
  const totalIncome = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  // 支出模拟：简单假设为商品入库成本（商品价格的60%）* 入库数量
  let totalExpense = 0
  inventoryList.forEach(inv => {
    const product = productList.find(p => p.id === inv.productId)
    if (product) {
      totalExpense += inv.quantity * product.price * 0.6
    }
  })
  const profit = totalIncome - totalExpense
  // 待收款：状态为 pending 的订单总额
  const pendingIncome = orderList.filter(o => o.status === 'pending').reduce((s, o) => s + o.totalAmount, 0)
  return { totalIncome, totalExpense, profit, pendingIncome }
}

// 近7天收支趋势（基于订单和模拟支出）
function getTrendData() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0,10)
    days.push(dateStr)
  }
  const incomeTrend = days.map(date => {
    return orderList
      .filter(o => o.createTime.startsWith(date) && ['paid','shipped','completed'].includes(o.status))
      .reduce((s, o) => s + o.totalAmount, 0)
  })
  // 支出趋势简化：按日期随机波动
  const expenseTrend = days.map(() => Mock.Random.integer(5000, 15000))
  return { dates: days, income: incomeTrend, expense: expenseTrend }
}

// 收支明细列表（独立存储，支持增删改查）
let financeRecordList = []
let nextRecordId = 1

// 初始化一些示例收支记录（可关联订单/入库单）
function initFinanceRecords() {
  financeRecordList = []
  nextRecordId = 1
  // 从已有订单中生成收入记录
  orderList.forEach(order => {
    if (['paid','shipped','completed'].includes(order.status)) {
      financeRecordList.push({
        id: nextRecordId++,
        date: order.createTime.slice(0,10),
        type: 'income',
        category: '销售收入',
        amount: order.totalAmount,
        description: `订单 ${order.orderNo}`,
        refId: order.id,
        refType: 'order'
      })
    }
  })
  // 补充一些随机支出记录（采购、运营费用等）
  const expenseCategories = ['采购成本', '人力成本', '运营费用', '税费', '办公费']
  // const descriptionrandom=['采购','人本','运营','税费','办公']
  for (let i = 0; i < 30; i++) {
    const daysAgo = Mock.Random.integer(1, 60)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    financeRecordList.push({
      id: nextRecordId++,
      date: date.toISOString().slice(0,10),
      type: 'expense',
      category: Mock.Random.pick(expenseCategories),
      amount: Mock.Random.float(500, 5000, 0, 2),
      description: [`支出 WORKNEED${i+1}`],
      refId: null,
      refType: null
    })
  }
}

// 财务指标接口
Mock.mock('/api/finance/metrics', 'get', () => {
  const metrics = calculateFinanceMetrics()
  return { code: 200, data: metrics }
})

// 收支趋势接口
Mock.mock('/api/finance/trend', 'get', () => {
  const trend = getTrendData()
  return { code: 200, data: trend }
})

// 收支记录列表（支持分页、筛选）
Mock.mock(/\/api\/finance\/records(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1)
  const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const type = url.searchParams.get('type') || ''
  const category = url.searchParams.get('category') || ''
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')

  let filtered = financeRecordList.filter(r => {
    if (type && r.type !== type) return false
    if (category && !r.category.includes(category)) return false
    if (startDate && r.date < startDate) return false
    if (endDate && r.date > endDate) return false
    return true
  })
  filtered.sort((a,b) => b.date.localeCompare(a.date))
  const start = (page-1)*pageSize
  const end = start+pageSize
  const pageData = filtered.slice(start, end)
  return { code: 200, data: { list: pageData, total: filtered.length } }
})

// 新增收支记录
Mock.mock('/api/finance/records', 'post', (options) => {
  const body = JSON.parse(options.body)
  const newRecord = {
    id: nextRecordId++,
    date: body.date,
    type: body.type,
    category: body.category,
    amount: body.amount,
    description: body.description || '',
    refId: null,
    refType: null
  }
  financeRecordList.push(newRecord)
  return { code: 200, data: newRecord }
})

// 编辑收支记录
Mock.mock(/\/api\/finance\/records\/(\d+)/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/finance\/records\/(\d+)/)[1])
  const body = JSON.parse(options.body)
  const index = financeRecordList.findIndex(r => r.id === id)
  if (index === -1) return { code: 404, message: '记录不存在' }
  financeRecordList[index] = { ...financeRecordList[index], ...body }
  return { code: 200, data: financeRecordList[index] }
})

// 删除收支记录
Mock.mock(/\/api\/finance\/records\/(\d+)/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/api\/finance\/records\/(\d+)/)[1])
  const index = financeRecordList.findIndex(r => r.id === id)
  if (index === -1) return { code: 404, message: '记录不存在' }
  financeRecordList.splice(index, 1)
  return { code: 200, message: '删除成功' }
})

// ================= 员工管理 =================
let employeeList = []
let nextEmployeeId = 1
const departments = ['技术部', '销售部', '财务部', '人事部', '运营部', '市场部', '产品部']
const positions = ['专员', '主管', '经理', '总监', '工程师', '分析师', '助理']

function initEmployees() {
  employeeList = []
  nextEmployeeId = 1
  // 基于现有 userList 生成员工（但增加部门、职位、入职日期）
  for (let i = 1; i <= userList.length; i++) {
    const user = userList[i-1]
    employeeList.push({
      id: nextEmployeeId++,
      name: user.realName,
      department: Mock.Random.pick(departments),
      position: Mock.Random.pick(positions),
      phone: user.phone,
      email: user.email,
      hireDate: new Date(Date.now() - Mock.Random.integer(30, 800) * 24 * 3600 * 1000).toISOString().slice(0,10),
      userId: user.id   // 关联系统用户
    })
  }
  // 如果员工数量不足20，额外补充
  while (employeeList.length < 20) {
    employeeList.push({
      id: nextEmployeeId++,
      name: Mock.Random.cname(),
      department: Mock.Random.pick(departments),
      position: Mock.Random.pick(positions),
      phone: Mock.Random.string('number', 11),
      email: Mock.Random.email(),
      hireDate: new Date(Date.now() - Mock.Random.integer(30, 800) * 24 * 3600 * 1000).toISOString().slice(0,10),
      userId: null
    })
  }
}
initEmployees()

// 员工接口
Mock.mock(/\/api\/employees(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1)
  const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const name = url.searchParams.get('name') || ''
  const department = url.searchParams.get('department') || ''
  const position = url.searchParams.get('position') || ''

  let filtered = employeeList.filter(e => {
    if (name && !e.name.includes(name)) return false
    if (department && !e.department.includes(department)) return false
    if (position && !e.position.includes(position)) return false
    return true
  })
  const start = (page-1)*pageSize
  const end = start+pageSize
  const pageData = filtered.slice(start, end)
  return { code: 200, data: { list: pageData, total: filtered.length } }
})

Mock.mock('/api/employees', 'post', (options) => {
  const body = JSON.parse(options.body)
  const newEmployee = { id: nextEmployeeId++, ...body }
  employeeList.push(newEmployee)
  return { code: 200, data: newEmployee }
})

Mock.mock(/\/api\/employees\/(\d+)/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/employees\/(\d+)/)[1])
  const body = JSON.parse(options.body)
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

// 调用初始化函数
initFinanceRecords()

// ================= 供应商管理 =================
let supplierList = []
let nextSupplierId = 1

function initSuppliers() {
  supplierList = []
  nextSupplierId = 1
  const supplierNames = [
    '宏达塑胶制品有限公司', '鑫源电子科技', '顺丰包装材料', '宏达实业', '宏达科技有限公司', '华威精密制造',
    '南方物流集团', '嘉盛商贸', '恒通贸易', '诚信供应链', '金源纺织', '东方电机', '长城轴承'
  ]
  for (let i = 1; i <= 20; i++) {
    const name = supplierNames[i % supplierNames.length] + (i > supplierNames.length ? `（${i}）` : '')
    supplierList.push({
      id: nextSupplierId++,
      name: name,
      contact: Mock.Random.cname(),
      phone: Mock.Random.string('number', 11),
      email: Mock.Random.email(),
      address: Mock.Random.county(true),
      status: Mock.Random.pick(['active', 'inactive'])
    })
  }
}
initSuppliers()

// 供应商接口
Mock.mock(/\/api\/suppliers(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1)
  const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const name = url.searchParams.get('name') || ''
  const contact = url.searchParams.get('contact') || ''
  const status = url.searchParams.get('status') || ''

  let filtered = supplierList.filter(s => {
    if (name && !s.name.includes(name)) return false
    if (contact && !s.contact.includes(contact)) return false
    if (status && s.status !== status) return false
    return true
  })
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageData = filtered.slice(start, end)
  return { code: 200, data: { list: pageData, total: filtered.length } }
})

Mock.mock('/api/suppliers', 'post', (options) => {
  const body = JSON.parse(options.body)
  const newSupplier = {
    id: nextSupplierId++,
    ...body,
    createTime: new Date().toLocaleString('zh-CN')
  }
  supplierList.push(newSupplier)
  return { code: 200, data: newSupplier }
})

Mock.mock(/\/api\/suppliers\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/suppliers\/(\d+)/)[1])
  const body = JSON.parse(options.body)
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

// ================= 采购订单 =================
let purchaseOrderList = []
let purchaseOrderItemList = []
let nextPurchaseOrderId = 1
let nextPurchaseOrderItemId = 1

function initPurchaseOrders() {
  purchaseOrderList = []
  purchaseOrderItemList = []
  nextPurchaseOrderId = 1
  nextPurchaseOrderItemId = 1
  const statusFlow = ['pending', 'approved', 'completed', 'cancelled']
  for (let i = 1; i <= 30; i++) {
    const supplier = Mock.Random.pick(supplierList)
    const status = Mock.Random.pick(statusFlow)
    const daysAgo = Mock.Random.integer(0, 60)
    const orderDate = new Date()
    orderDate.setDate(orderDate.getDate() - daysAgo)
    const orderDateStr = orderDate.toISOString().slice(0,10)
    const totalAmount = Mock.Random.float(1000, 50000, 0, 2)
    const order = {
      id: nextPurchaseOrderId++,
      orderNo: `PO${Mock.Random.date('yyyyMMdd')}${Mock.Random.string('number', 4)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      totalAmount: totalAmount,
      orderDate: orderDateStr,
      status: status,
      createTime: orderDateStr + ' ' + Mock.Random.time('HH:mm:ss')
    }
    purchaseOrderList.push(order)
    // 生成明细（1~3个商品）
    const itemCount = Mock.Random.integer(1, 3)
    const shuffledProducts = [...productList].sort(() => 0.5 - Math.random())
    const selected = shuffledProducts.slice(0, itemCount)
    selected.forEach(product => {
      const quantity = Mock.Random.integer(10, 500)
      const unitPrice = product.price
      purchaseOrderItemList.push({
        id: nextPurchaseOrderItemId++,
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        unitPrice: unitPrice,
        subtotal: quantity * unitPrice
      })
    })
  }
}
initPurchaseOrders()

// 辅助获取采购订单明细
function getPurchaseOrderItems(orderId) {
  return purchaseOrderItemList.filter(item => item.orderId === orderId)
}

// 采购订单接口
Mock.mock(/\/api\/purchase\/orders(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1)
  const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const orderNo = url.searchParams.get('orderNo') || ''
  const supplierName = url.searchParams.get('supplierName') || ''
  const status = url.searchParams.get('status') || ''

  let filtered = purchaseOrderList.filter(o => {
    if (orderNo && !o.orderNo.includes(orderNo)) return false
    if (supplierName && !o.supplierName.includes(supplierName)) return false
    if (status && o.status !== status) return false
    return true
  })
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageData = filtered.slice(start, end).map(order => ({
    ...order,
    items: getPurchaseOrderItems(order.id)
  }))
  return { code: 200, data: { list: pageData, total: filtered.length } }
})

Mock.mock('/api/purchase/orders', 'post', (options) => {
  const body = JSON.parse(options.body)
  const newOrder = {
    id: nextPurchaseOrderId++,
    orderNo: `PO${Mock.Random.date('yyyyMMdd')}${Mock.Random.string('number', 4)}`,
    supplierId: body.supplierId,
    supplierName: body.supplierName,
    totalAmount: body.totalAmount,
    orderDate: body.orderDate,
    status: 'pending',
    createTime: new Date().toLocaleString('zh-CN')
  }
  purchaseOrderList.push(newOrder)
  // 保存明细
  const items = body.items.map(item => ({
    id: nextPurchaseOrderItemId++,
    orderId: newOrder.id,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.quantity * item.unitPrice
  }))
  purchaseOrderItemList.push(...items)
  return { code: 200, data: { ...newOrder, items } }
})

Mock.mock(/\/api\/purchase\/orders\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/api\/purchase\/orders\/(\d+)/)[1])
  const body = JSON.parse(options.body)
  const orderIndex = purchaseOrderList.findIndex(o => o.id === id)
  if (orderIndex === -1) return { code: 404, message: '订单不存在' }
  // 更新订单头信息
  purchaseOrderList[orderIndex] = { ...purchaseOrderList[orderIndex], ...body }
  // 更新明细：先删除旧的，再添加新的
  purchaseOrderItemList = purchaseOrderItemList.filter(item => item.orderId !== id)
  const newItems = body.items.map(item => ({
    id: nextPurchaseOrderItemId++,
    orderId: id,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.quantity * item.unitPrice
  }))
  purchaseOrderItemList.push(...newItems)
  return { code: 200, data: { ...purchaseOrderList[orderIndex], items: newItems } }
})

Mock.mock(/\/api\/purchase\/orders\/\d+\/status/, 'patch', (options) => {
  const id = parseInt(options.url.match(/\/api\/purchase\/orders\/(\d+)/)[1])
  const { status } = JSON.parse(options.body)
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

// ================= 报表接口（销售、库存、财务） =================
// 销售报表摘要
Mock.mock('/api/reports/sales/summary', 'get', () => {
  const totalSales = orderList.reduce((sum, o) => sum + o.totalAmount, 0)
  const paidSales = orderList.filter(o => ['paid','shipped','completed'].includes(o.status)).reduce((s,o) => s + o.totalAmount, 0)
  const orderCount = orderList.length
  const monthGrowth = 12.5
  return { code: 200, data: { totalSales, paidSales, orderCount, monthGrowth } }
})
// 销售趋势（近30天）
Mock.mock('/api/reports/sales/trend', 'get', () => {
  const days = Array.from({length:30},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate() - (29-i)); return d.toISOString().slice(0,10)
  })
  const trend = days.map(() => Mock.Random.integer(8000, 25000))
  return { code: 200, data: { days, trend } }
})
// 热销商品TOP10
Mock.mock('/api/reports/sales/top-products', 'get', () => {
  // 聚合订单明细中的销量
  const productSales = new Map()
  orderItemList.forEach(item => {
    const existing = productSales.get(item.productId) || { name: item.productName, soldCount: 0, amount: 0 }
    existing.soldCount += item.quantity
    existing.amount += item.quantity * item.unitPrice
    productSales.set(item.productId, existing)
  })
  const top10 = Array.from(productSales.values()).sort((a,b) => b.soldCount - a.soldCount).slice(0,10)
  return { code: 200, data: top10 }
})

// 库存报表
Mock.mock('/api/reports/inventory/summary', 'get', () => {
  const totalStock = productList.reduce((s,p) => s + p.stock, 0)
  const lowStockCount = productList.filter(p => p.stock < 50).length
  const turnoverRate = 3.2
  return { code: 200, data: { totalStock, lowStockCount, turnoverRate } }
})
Mock.mock('/api/reports/inventory/warehouse-distribution', 'get', () => {
  const warehouseMap = new Map()
  inventoryList.forEach(inv => {
    const wh = inv.warehouse
    warehouseMap.set(wh, (warehouseMap.get(wh) || 0) + inv.quantity)
  })
  const data = Array.from(warehouseMap.entries()).map(([name, value]) => ({ name, value }))
  return { code: 200, data }
})
Mock.mock('/api/reports/inventory/low-stock', 'get', () => {
  const low = productList.filter(p => p.stock < 50).slice(0,10).map(p => ({ name: p.name, stock: p.stock, threshold: 50 }))
  return { code: 200, data: low }
})

// 财务报表（复用财务指标和趋势）
Mock.mock('/api/reports/finance/profit', 'get', () => {
  const metrics = calculateFinanceMetrics()
  return { code: 200, data: { profit: metrics.profit, totalIncome: metrics.totalIncome, totalExpense: metrics.totalExpense } }
})

Mock.mock('/api/reports/finance/trend', 'get', () => {
  const trend = getTrendData()
  return { code: 200, data: trend }
})

// 注意：这里使用正则表达式匹配路径，避免查询参数导致不匹配
Mock.mock(/\/api\/reports\/finance\/records/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1)
  const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  // 确保 financeRecordList 存在且排序
  let list = [...financeRecordList].sort((a, b) => b.date.localeCompare(a.date))
  const total = list.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageData = list.slice(start, end)
  return { code: 200, data: { list: pageData, total } }
})
// ================= 登录认证 =================
// 为用户添加默认密码（实际生产应加密，Mock 中简化）
userList.forEach(u => {
  u.password = '123456'  // 所有用户密码统一为 123456
})

Mock.mock('/api/auth/login', 'post', (options) => {
  const { username, password } = JSON.parse(options.body)
  const user = userList.find(u => u.username === username && u.password === password)
  if (user) {
    let perms = []
    if (user.isSuperAdmin) {
      // 超级管理员拥有所有权限（从 permissionGroups 中提取所有权限标识）
      const allPerms = []
      permissionGroups.forEach(group => {
        allPerms.push(...group.perms)
      })
      perms = [...new Set(allPerms)]  // 去重
    } else {
      const rolePerm = rolePermissionsStore.find(r => r.role === user.role)
      perms = rolePerm ? rolePerm.perms : []
    }
    
    const token = 'mock-token-' + user.id
    const userInfo = { ...user, perms }
    delete userInfo.password
    return { code: 200, data: { token, userInfo } }
  } else {
    return { code: 401, message: '用户名或密码错误' }
  }
})

// ================= 操作日志 =================
let operationLogs = []
let nextLogId = 1

// 生成模拟操作日志
function initOperationLogs() {
  operationLogs = []
  nextLogId = 1
  const actions = ['登录', '登出', '新增商品', '编辑商品', '删除商品', '新增客户', '编辑客户', '新增订单', '修改订单状态', '新增用户', '编辑用户']
  const users = [...userList]
  for (let i = 0; i < 200; i++) {
    const user = Mock.Random.pick(users)
    const action = Mock.Random.pick(actions)
    const daysAgo = Mock.Random.integer(0, 30)
    const logTime = new Date()
    logTime.setDate(logTime.getDate() - daysAgo)
    operationLogs.push({
      id: nextLogId++,
      time: logTime.toISOString().slice(0, 19).replace('T', ' '),
      user: user.realName,
      username: user.username,
      action: action,
      detail: `执行了${action}操作`,
      ip: Mock.Random.ip(),
      userAgent: 'Chrome/120.0.0.0'
    })
  }
  // 按时间倒序
  operationLogs.sort((a, b) => b.time.localeCompare(a.time))
}
initOperationLogs()

// 操作日志列表接口（分页、筛选）
Mock.mock(/\/api\/logs(\?.*)?/, 'get', (options) => {
  const url = new URL(options.url, 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || 1)
  const pageSize = parseInt(url.searchParams.get('pageSize') || 10)
  const username = url.searchParams.get('username') || ''
  const action = url.searchParams.get('action') || ''
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')

  let filtered = operationLogs.filter(log => {
    if (username && !log.username.includes(username)) return false
    if (action && !log.action.includes(action)) return false
    if (startDate && log.time < startDate) return false
    if (endDate && log.time > endDate) return false
    return true
  })
  const total = filtered.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageData = filtered.slice(start, end)
  return { code: 200, data: { list: pageData, total } }
})

// 新增日志（供前端调用）
Mock.mock('/api/logs', 'post', (options) => {
  const body = JSON.parse(options.body)
  const newLog = {
    id: nextLogId++,
    time: new Date().toISOString().slice(0, 19).replace('T', ' '),
    ...body
  }
  operationLogs.unshift(newLog) // 插入最前面
  return { code: 200, data: newLog }
})

// ================= 数据字典 =================
// 订单状态字典
const orderStatusDict = [
  { code: 'pending', name: '待付款' },
  { code: 'paid', name: '已付款' },
  { code: 'shipped', name: '已发货' },
  { code: 'completed', name: '已完成' },
  { code: 'cancelled', name: '已取消' }
]

// 商品分类字典
const categoryDict = [
  { code: 'cup', name: '杯类' },
  { code: 'bottle', name: '壶类' },
  { code: 'jar', name: '罐类' },
  { code: 'box', name: '盒类' }
]

// 订单状态字典接口
Mock.mock('/api/dict/order-status', 'get', () => {
  return { code: 200, data: orderStatusDict }
})

// 商品分类字典接口
Mock.mock('/api/dict/categories', 'get', () => {
  return { code: 200, data: categoryDict }
})
// ================= 权限管理（支持保存） =================
let rolePermissionsStore = [
  { role: 'admin', roleName: '管理员', perms: ['用户管理', '订单管理', '商品管理', '客户管理', '库存管理', '财务管理', '报表查看', '系统设置','权限管理','财务看板','收支记录','个人中心'] },
  { role: 'user', roleName: '普通用户', perms: ['订单查看', '商品管理', '客户管理','订单管理', '个人中心'] }
]

// 获取角色权限列表
Mock.mock('/api/permissions/roles', 'get', () => {
  return { code: 200, data: rolePermissionsStore }
})

// 更新角色权限
Mock.mock('/api/permissions/roles', 'put', (options) => {
  const { role, perms } = JSON.parse(options.body)
  const index = rolePermissionsStore.findIndex(r => r.role === role)
  if (index !== -1) {
    rolePermissionsStore[index].perms = perms
    return {
      code: 200,
      data: rolePermissionsStore[index],
      message: '保存成功'
    }
  }
  return {
    code: 404,
    message: '角色不存在'
  }
})