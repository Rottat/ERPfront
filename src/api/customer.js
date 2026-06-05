import request from '@/utils/request'

export function getCustomerList(params) {
  return request({ url: '/api/customers', method: 'get', params })
}
export function addCustomer(data) {
  return request({ url: '/api/customers', method: 'post', data })
}
export function updateCustomer(id, data) {
  return request({ url: `/api/customers/${id}`, method: 'put', data })
}
export function deleteCustomer(id) {
  return request({ url: `/api/customers/${id}`, method: 'delete' })
}