import request from '@/utils/request'

export function getOrderList(params) {
  return request({
    url: '/orders',
    method: 'get',
    params
  })
}

export function addOrder(data) {
  return request({
    url: '/orders',
    method: 'post',
    data
  })
}

export function updateOrder(id, data) {
  return request({
    url: `/orders/${id}`,
    method: 'put',
    data
  })
}

export function deleteOrder(id) {
  return request({
    url: `/orders/${id}`,
    method: 'delete'
  })
}

export function updateOrderStatus(id, status) {
  return request({ url: `/orders/${id}/status`, method: 'patch', data: { status } })
}
