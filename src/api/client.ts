import axios from 'axios'

const API_HOST = import.meta.env.VITE_API_HOST || 'http://109.73.206.144:6969'

const client = axios.create({
  baseURL: API_HOST,
  timeout: 15000
})

client.interceptors.response.use((response) => {
  console.log('Response received:', response.status)
  return response
}, (error) => {
  console.error('API Error:', error.response?.data || error.message)
  return Promise.reject(error)
})

export type ApiResponse<T> = {
  data: T[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number
    last_page: number
    links: Array<{ url: string | null; label: string; active: boolean }>
    path: string
    per_page: number | string
    to: number
    total: number
  }
}

export default client