import request from '@/utils/request'

export function getInventoryList(params) {
  return request({
    url: '/api/inventory',
    method: 'get',
    params
  })
}

export function addInventory(data) {
  return request({
    url: '/api/inventory',
    method: 'post',
    data
  })
}

export function updateInventory(id, data) {
  return request({
    url: `/api/inventory/${id}`,
    method: 'put',
    data
  })
}

export function deleteInventory(id) {
  return request({
    url: `/api/inventory/${id}`,
    method: 'delete'
  })
}