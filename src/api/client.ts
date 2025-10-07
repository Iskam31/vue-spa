import axios from 'axios'

const API_HOST = import.meta.env.VITE_API_HOST || 'http://109.73.206.144:6969'

const client = axios.create({
  baseURL: API_HOST,
  timeout: 10000
})

client.interceptors.request.use((config) => {
  console.log(`Making request to: ${config.url}`)
  return config
})

client.interceptors.response.use((response) => {
  console.log('Response received:', response.status)
  return response
}, (error) => {
  console.error('API Error:', error.response?.data || error.message)
  if (error.response?.status === 429) {
    console.warn('Rate limit exceeded, please slow down requests')
  }
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

export async function fetchAllPages<T>(
  endpoint: string,
  baseParams: Record<string, any> = {},
  maxPages: number = 5,
  delayMs: number = 1000
): Promise<T[]> {
  let allData: T[] = []
  let currentPage = 1
  let lastPage = 1

  try {
    do {
      const params = {
        ...baseParams,
        page: currentPage,
        limit: 500,
        key: "E6kUTYrYwZq2tN4QEtyzsbEBk3ie"
      }

      console.log(`Fetching page ${currentPage} of ${endpoint}`)
      
      const response = await client.get<ApiResponse<T>>(endpoint, { params })
      
      if (response.data.data) {
        allData = allData.concat(response.data.data)
        console.log(`Page ${currentPage} loaded, total records: ${allData.length}`)
      }

      lastPage = response.data.meta?.last_page || 1
      currentPage++

      if (currentPage <= lastPage && currentPage <= maxPages) {
        console.log(`Waiting ${delayMs}ms before next request...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }

    } while (currentPage <= lastPage && currentPage <= maxPages)

    console.log(`Finished loading ${allData.length} records from ${endpoint}`)
    return allData

  } catch (error: any) {
    console.error(`Error in fetchAllPages for ${endpoint}:`, error)
    return allData
  }
}

export async function fetchSinglePage<T>(
  endpoint: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const requestParams = {
    ...params,
    key: "E6kUTYrYwZq2tN4QEtyzsbEBk3ie",
    limit: 500
  }

  try {
    const response = await client.get<ApiResponse<T>>(endpoint, { params: requestParams })
    return response.data.data || []
  } catch (error: any) {
    console.error(`Error in fetchSinglePage for ${endpoint}:`, error)
    return []
  }
}

export default client