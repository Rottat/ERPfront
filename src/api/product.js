import request from '@/utils/request'

export function getProductList(params) {
  return request({
    url: '/api/products',   // 原为 '/products'
    method: 'get',
    params
  })
}

export function addProduct(data) {
  return request({
    url: '/api/products',
    method: 'post',
    data
  })
}

export function updateProduct(id, data) {
  return request({
    url: `/api/products/${id}`,
    method: 'put',
    data
  })
}

export function deleteProduct(id) {
  return request({
    url: `/api/products/${id}`,
    method: 'delete'
  })
}