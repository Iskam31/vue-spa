import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export interface FilterState {
  dateFrom: string
  dateTo: string
  article: string
  region: string
  category: string
  brand: string
  status: string
  [key: string]: string
}

export function useFilters(defaultFilters: Partial<FilterState> = {}) {
  const route = useRoute()
  const router = useRouter()
  
  // Инициализируем фильтры из query параметров или localStorage
  const filters = ref<FilterState>({
    dateFrom: '',
    dateTo: '',
    article: '',
    region: '',
    category: '',
    brand: '',
    status: 'all',
    ...defaultFilters
  })

  // Загружаем фильтры из query параметров при инициализации
  const loadFiltersFromQuery = () => {
    Object.keys(filters.value).forEach(key => {
      if (route.query[key]) {
        filters.value[key] = String(route.query[key])
      }
    })
  }

  // Загружаем фильтры из localStorage
  const loadFiltersFromStorage = () => {
    const savedFilters = localStorage.getItem('app-filters')
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters)
        Object.keys(filters.value).forEach(key => {
          if (parsed[key] !== undefined) {
            filters.value[key] = parsed[key]
          }
        })
      } catch (e) {
        console.warn('Failed to parse saved filters', e)
      }
    }
  }

  // Сохраняем фильтры в query параметры
  const saveFiltersToQuery = () => {
    const query: Record<string, string> = {}
    
    Object.keys(filters.value).forEach(key => {
      if (filters.value[key] && filters.value[key] !== 'all') {
        query[key] = filters.value[key]
      }
    })

    // Сохраняем текущий путь чтобы не сбрасывать страницу
    const currentPath = route.path
    
    router.replace({
      path: currentPath,
      query: { ...route.query, ...query }
    })
  }

  // Сохраняем фильтры в localStorage
  const saveFiltersToStorage = () => {
    try {
      localStorage.setItem('app-filters', JSON.stringify(filters.value))
    } catch (e) {
      console.warn('Failed to save filters to localStorage', e)
    }
  }

  // Инициализация
  const initializeFilters = () => {
    loadFiltersFromStorage()
    loadFiltersFromQuery()
  }

  // Применяем фильтры (сохраняем в query и localStorage)
  const applyFilters = () => {
    saveFiltersToQuery()
    saveFiltersToStorage()
  }

  // Сбрасываем фильтры к значениям по умолчанию
  const resetFilters = (newDefaults: Partial<FilterState> = {}) => {
    Object.keys(filters.value).forEach(key => {
      if (newDefaults[key] !== undefined) {
        filters.value[key] = newDefaults[key]
      } else if (defaultFilters[key] !== undefined) {
        filters.value[key] = defaultFilters[key]!
      } else {
        filters.value[key] = key === 'status' ? 'all' : ''
      }
    })
    applyFilters()
  }

  // Автоматически сохраняем фильтры при изменении
  watch(filters, () => {
    applyFilters()
  }, { deep: true, immediate: false })

  // Инициализируем при создании
  initializeFilters()

  return {
    filters,
    applyFilters,
    resetFilters,
    loadFiltersFromQuery,
    saveFiltersToStorage
  }
}