<template>
  <div class="metric-page">
    <el-card style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
        <div>
          <h2 style="margin: 0; color: #303133;">{{ pageTitle }}</h2>
          <div style="color: #909399; font-size: 14px; margin-top: 4px;">
            Период: {{ dateState.dateFrom }} - {{ dateState.dateTo }}
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <el-button @click="$router.back()">
            ← Назад
          </el-button>
          <el-button type="primary" @click="exportData">
            Экспорт
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Фильтры -->
    <el-card style="margin-bottom: 20px;">
      <div style="display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
        <div>
          <span style="margin-right: 8px;">Дата с:</span>
          <el-date-picker
            v-model="dateState.dateFrom"
            type="date"
            placeholder="Выберите дату"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div>
          <span style="margin-right: 8px;">по:</span>
          <el-date-picker
            v-model="dateState.dateTo"
            type="date"
            placeholder="Выберите дату"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </div>
        
        <el-select v-model="pageFilters.article" placeholder="Артикул" clearable style="width: 150px;">
          <el-option
            v-for="article in uniqueArticles"
            :key="article"
            :label="article"
            :value="article"
          />
        </el-select>
        
        <el-select v-model="pageFilters.region" placeholder="Регион" clearable style="width: 180px;">
          <el-option
            v-for="region in uniqueRegions"
            :key="region"
            :label="region"
            :value="region"
          />
        </el-select>
        
        <el-select v-model="pageFilters.category" placeholder="Категория" clearable style="width: 180px;">
          <el-option
            v-for="category in uniqueCategories"
            :key="category"
            :label="category"
            :value="category"
          />
        </el-select>
        
        <el-select v-model="pageFilters.brand" placeholder="Бренд" clearable style="width: 150px;">
          <el-option
            v-for="brand in uniqueBrands"
            :key="brand"
            :label="brand"
            :value="brand"
          />
        </el-select>
        
        <el-button type="primary" @click="applyPageFilters">
          Применить
        </el-button>
        <el-button @click="resetPageFilters">
          Сбросить
        </el-button>
      </div>
    </el-card>

    <!-- График -->
    <el-card style="margin-bottom: 20px;">
      <template #header>
        <span style="font-weight: 600;">Динамика {{ metricTitle }}</span>
      </template>
      <LineChart 
        :labels="chartLabels" 
        :values="chartValues" 
        :label="metricTitle"
        :height="300"
      />
    </el-card>

    <!-- Таблица -->
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600;">Детальная информация по товарам</span>
          <span style="color: #909399; font-size: 14px;">
            Всего записей: {{ filteredData.length }}
          </span>
        </div>
      </template>
      
      <el-table 
        :data="paginatedData" 
        v-loading="loading"
        style="width: 100%"
        @row-click="goToArticleDetail"
      >
        <el-table-column prop="nm_id" label="Артикул" width="120" fixed>
          <template #default="{ row }">
            <span class="article-link">{{ row.nm_id }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="brand" label="Бренд" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.brand || '—' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="category" label="Категория" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.category || '—' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="oblast" label="Регион" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.oblast || '—' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="total_price" label="Сумма" align="right" width="120">
          <template #default="{ row }">
            {{ parseFloat(row.total_price || '0').toLocaleString('ru-RU') }} ₽
          </template>
        </el-table-column>
        
        <el-table-column prop="discount_percent" label="Скидка" align="right" width="100">
          <template #default="{ row }">
            {{ row.discount_percent || 0 }}%
          </template>
        </el-table-column>
        
        <el-table-column prop="date" label="Дата" width="140">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="is_cancel" label="Статус" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_cancel ? 'danger' : 'success'" size="small">
              {{ row.is_cancel ? 'Отмена' : 'Успешно' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- Пагинация -->
      <div style="display: flex; justify-content: center; margin-top: 20px;">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredData.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import client from '@/api/client'
import type { GenericRecord } from '@/types/api'
import LineChart from '@/components/LineChart.vue'
import { useFilters } from '@/composables/useFilters'

interface Order extends GenericRecord {
  nm_id: number
  total_price: string
  discount_percent: number
  is_cancel: boolean
  date: string
  cancel_dt: string | null
  brand: string
  category: string
  oblast: string
  warehouse_name: string
}

const route = useRoute()
const router = useRouter()

// Используем композабл для фильтров с переименованными методами
const { 
  filters: pageFilters, 
  applyFilters: applyFiltersComposable, 
  resetFilters: resetFiltersComposable 
} = useFilters({
  status: 'all'
})

// Reactive data
const loading = ref(false)
const orders = ref<Order[]>([])
const currentPage = ref(1)
const pageSize = ref(20)

// Используем reactive для дат чтобы избежать проблем с ref
const dateState = {
  dateFrom: pageFilters.value.dateFrom,
  dateTo: pageFilters.value.dateTo
}

// Computed
const metricType = computed(() => route.params.metricType as string)

const pageTitle = computed(() => {
  const titles: { [key: string]: string } = {
    sales: 'Количество продаж',
    revenue: 'Общая выручка',
    cancellations: 'Количество отмен',
    discounts: 'Средние скидки'
  }
  return titles[metricType.value] || 'Метрика'
})

const metricTitle = computed(() => {
  return pageTitle.value.toLowerCase()
})

const uniqueArticles = computed(() => {
  return [...new Set(orders.value.map(item => item.nm_id.toString()))].sort()
})

const uniqueRegions = computed(() => {
  return [...new Set(orders.value.map(item => item.oblast || '').filter(Boolean))].sort()
})

const uniqueCategories = computed(() => {
  return [...new Set(orders.value.map(item => item.category || '').filter(Boolean))].sort()
})

const uniqueBrands = computed(() => {
  return [...new Set(orders.value.map(item => item.brand || '').filter(Boolean))].sort()
})

const filteredData = computed(() => {
  return orders.value.filter(order => {
    if (pageFilters.value.article && order.nm_id.toString() !== pageFilters.value.article) return false
    if (pageFilters.value.region && order.oblast !== pageFilters.value.region) return false
    if (pageFilters.value.category && order.category !== pageFilters.value.category) return false
    if (pageFilters.value.brand && order.brand !== pageFilters.value.brand) return false
    return true
  })
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const chartLabels = computed(() => {
  const dates = [...new Set(filteredData.value.map(item => item.date.split(' ')[0]))].sort()
  return dates.map(date => {
    const d = new Date(date)
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`
  })
})

const chartValues = computed(() => {
  const dates = [...new Set(filteredData.value.map(item => item.date.split(' ')[0]))].sort()
  
  return dates.map(date => {
    const dayOrders = filteredData.value.filter(item => item.date.split(' ')[0] === date)
    
    switch (metricType.value) {
      case 'sales':
        return dayOrders.filter(order => !order.is_cancel).length
      case 'revenue':
        return dayOrders.filter(order => !order.is_cancel)
          .reduce((sum, order) => sum + parseFloat(order.total_price || '0'), 0)
      case 'cancellations':
        return dayOrders.filter(order => order.is_cancel).length
      case 'discounts':
        const validOrders = dayOrders.filter(order => order.discount_percent > 0)
        return validOrders.length > 0 
          ? validOrders.reduce((sum, order) => sum + order.discount_percent, 0) / validOrders.length
          : 0
      default:
        return 0
    }
  })
})

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU')
}

// Переименовываем методы чтобы избежать конфликта имен
const applyPageFilters = () => {
  currentPage.value = 1
  loadData()
}

const resetPageFilters = () => {
  // Сбрасываем только фильтры кроме дат
  const currentDateFrom = pageFilters.value.dateFrom
  const currentDateTo = pageFilters.value.dateTo
  
  resetFiltersComposable({
    dateFrom: currentDateFrom,
    dateTo: currentDateTo,
    article: '',
    region: '',
    category: '',
    brand: '',
    status: 'all'
  })
  
  currentPage.value = 1
  loadData()
}

const goToArticleDetail = (order: Order) => {
  router.push({
    path: `/article/${order.nm_id}`,
    query: {
      dateFrom: dateState.dateFrom,
      dateTo: dateState.dateTo,
      region: pageFilters.value.region,
      category: pageFilters.value.category,
      brand: pageFilters.value.brand
    }
  })
}

const exportData = () => {
  ElMessage.info('Функция экспорта в разработке')
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      dateFrom: dateState.dateFrom,
      dateTo: dateState.dateTo,
      key: "E6kUTYrYwZq2tN4QEtyzsbEBk3ie",
      limit: 500
    }

    const resp = await client.get('/api/orders', { params })
    orders.value = resp.data.data || []
    
    ElMessage.success(`Загружено ${orders.value.length} записей`)
  } catch (error: any) {
    console.error('Error loading metric data:', error)
    ElMessage.error('Ошибка при загрузке данных')
  } finally {
    loading.value = false
  }
}

// Следим за изменениями дат в фильтрах
watch(() => pageFilters.value.dateFrom, (newVal: string) => {
  dateState.dateFrom = newVal
})

watch(() => pageFilters.value.dateTo, (newVal: string) => {
  dateState.dateTo = newVal
})

// Lifecycle
onMounted(() => {
  // Устанавливаем даты из фильтров или по умолчанию
  if (!dateState.dateFrom || !dateState.dateTo) {
    const defaultDates = getDefaultDates()
    dateState.dateFrom = defaultDates.currentFrom
    dateState.dateTo = defaultDates.currentTo
    pageFilters.value.dateFrom = defaultDates.currentFrom
    pageFilters.value.dateTo = defaultDates.currentTo
  }
  
  loadData()
})

// Загружаем данные при изменении дат
watch([() => dateState.dateFrom, () => dateState.dateTo], () => {
  currentPage.value = 1
  loadData()
})

function getDefaultDates() {
  const today = new Date()
  const currentTo = today.toISOString().split('T')[0]
  
  const currentFrom = new Date(today)
  currentFrom.setDate(today.getDate() - 7)
  const currentFromStr = currentFrom.toISOString().split('T')[0]
  
  return {
    currentFrom: currentFromStr,
    currentTo: currentTo
  }
}
</script>

<style scoped>
.metric-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.article-link {
  color: #409EFF;
  cursor: pointer;
  text-decoration: underline;
}

.article-link:hover {
  color: #67a8ff;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>