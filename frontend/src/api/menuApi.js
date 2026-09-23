import http from './http'

export const buscarMenu = () => http.get('/admin/menu').then((res) => res.data)
