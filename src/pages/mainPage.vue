<template>
  <div class="main-page">
    <el-card style="margin-bottom: 20px;">
      <!-- Периоды -->
      <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap; margin-bottom: 15px;">
        <div>
          <span style="margin-right: 8px;">Текущий период с:</span>
          <el-date-picker
            v-model="dateState.currentDateFrom"
            type="date"
            placeholder="Выберите дату"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div>
          <span style="margin-right: 8px;">по:</span>
          <el-date-picker
            v-model="dateState.currentDateTo"
            type="date"
            placeholder="Выберите дату"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div>
          <span style="margin-right: 8px;">Предыдущий период с:</span>
          <el-date-picker
            v-model="dateState.previousDateFrom"
            type="date"
            placeholder="Выберите дату"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div>
          <span style="margin-right: 8px;">по:</span>
          <el-date-picker
            v-model="dateState.previousDateTo"
            type="date"
            placeholder="Выберите дату"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </div>
        <el-button type="primary" @click="loadData" :loading="loading" :disabled="loading">
          {{ loading ? 'Загрузка...' : 'Применить периоды' }}
        </el-button>
        <el-button @click="resetToDefaultPeriod" :disabled="loading">
          Сбросить к неделе
        </el-button>
      </div>

      <!-- Фильтры -->
      <div style="display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap; padding-top: 15px; border-top: 1px solid #f0f0f0;">
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

        <el-select v-model="pageFilters.status" placeholder="Статус" clearable style="width: 130px;">
          <el-option label="Все" value="all" />
          <el-option label="Успешно" value="success" />
          <el-option label="Отмена" value="cancel" />
        </el-select>
        
        <el-button type="primary" @click="applyPageFilters">
          Применить фильтры
        </el-button>
        <el-button @click="resetPageFilters">
          Сбросить фильтры
        </el-button>
      </div>
      
      <div v-if="activeFiltersCount > 0" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f0f0f0;">
        <div style="font-size: 12px; color: #909399; margin-bottom: 8px;">
          Активные фильтры: {{ activeFiltersCount }}
        </div>
        <div>
          <el-tag
            v-for="filter in activeFilters"
            :key="filter.key"
            size="small"
            closable
            @close="clearFilter(filter.key)"
            style="margin-right: 8px; margin-bottom: 4px;"
          >
            {{ filter.label }}: {{ filter.value }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <div class="metrics-grid">
      <MetricCard
        title="Количество продаж"
        :value="metrics.salesCount.current"
        :trend="metrics.salesCount.trend"
        period-label="текущий период"
        :chart-labels="chartLabels"
        :chart-values="dailySales"
        metric-type="sales"
        @click="goToMetricPage('sales')"
      />
      
      <MetricCard
        title="Общая выручка"
        :value="metrics.revenue.current"
        :trend="metrics.revenue.trend"
        period-label="текущий период"
        :chart-labels="chartLabels"
        :chart-values="dailyRevenue"
        metric-type="revenue"
        @click="goToMetricPage('revenue')"
      />
      
      <MetricCard
        title="Количество отмен"
        :value="metrics.cancellations.current"
        :trend="metrics.cancellations.trend"
        period-label="текущий период"
        :chart-labels="chartLabels"
        :chart-values="dailyCancellations"
        metric-type="cancellations"
        @click="goToMetricPage('cancellations')"
      />
      
      <MetricCard
        title="Средняя скидка"
        :value="metrics.avgDiscount.current"
        :trend="metrics.avgDiscount.trend"
        period-label="текущий период"
        :chart-labels="chartLabels"
        :chart-values="dailyDiscounts"
        metric-type="discounts"
        @click="goToMetricPage('discounts')"
      />
    </div>

    <div class="tables-grid">
      <TopArticlesTable
        title="Топ артикулов по продажам"
        :data="topSalesChanges"
        empty-text="Нет данных о продажах"
        @row-click="goToArticleDetail"
      />
      
      <TopArticlesTable
        title="Топ артикулов по выручке"
        :data="topRevenueChanges"
        empty-text="Нет данных о выручке"
        @row-click="goToArticleDetail"
      />
      
      <TopArticlesTable
        title="Топ артикулов по отменам"
        :data="topCancellationChanges"
        empty-text="Нет данных об отменах"
        @row-click="goToArticleDetail"
      />
      
      <TopArticlesTable
        title="Топ артикулов по скидкам"
        :data="topDiscountChanges"
        empty-text="Нет данных о скидках"
        @row-click="goToArticleDetail"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchAllPages } from '@/api/client'
import type { GenericRecord } from '@/types/api'
import MetricCard from '@/components/MetricCard.vue'
import TopArticlesTable from '@/components/TopArticlesTable.vue'
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
}

interface PeriodData {
  salesCount: number
  revenue: number
  cancellations: number
  totalDiscount: number
  discountCount: number
  articles: {
    [nm_id: number]: {
      salesCount: number
      revenue: number
      cancellations: number
      totalDiscount: number
      discountCount: number
    }
  }
  daily: {
    [date: string]: {
      salesCount: number
      revenue: number
      cancellations: number
      totalDiscount: number
      discountCount: number
    }
  }
}

interface ArticleChange {
  nm_id: number
  current: number
  previous: number
  change: number
}

const router = useRouter()
const loading = ref(false)

const { 
  filters: pageFilters, 
  resetFilters: resetFiltersComposable 
} = useFilters({
  status: 'all'
})

const dateState = reactive({
  currentDateFrom: pageFilters.value.dateFrom || '',
  currentDateTo: pageFilters.value.dateTo || '',
  previousDateFrom: '',
  previousDateTo: ''
})

const currentPeriodData = ref<PeriodData>(createEmptyPeriodData())
const previousPeriodData = ref<PeriodData>(createEmptyPeriodData())
const allOrders = ref<Order[]>([])

// Computed
const uniqueArticles = computed(() => {
  return [...new Set(allOrders.value.map(item => item.nm_id.toString()))].sort()
})

const uniqueRegions = computed(() => {
  return [...new Set(allOrders.value.map(item => item.oblast || '').filter(Boolean))].sort()
})

const uniqueCategories = computed(() => {
  return [...new Set(allOrders.value.map(item => item.category || '').filter(Boolean))].sort()
})

const uniqueBrands = computed(() => {
  return [...new Set(allOrders.value.map(item => item.brand || '').filter(Boolean))].sort()
})

const metrics = computed(() => {
  const current = currentPeriodData.value
  const previous = previousPeriodData.value
  
  const calcTrend = (currentVal: number, previousVal: number): number => {
    if (previousVal === 0) return currentVal === 0 ? 0 : 100
    return ((currentVal - previousVal) / previousVal) * 100
  }

  const currentAvgDiscount = current.discountCount > 0 ? current.totalDiscount / current.discountCount : 0
  const previousAvgDiscount = previous.discountCount > 0 ? previous.totalDiscount / previous.discountCount : 0

  return {
    salesCount: {
      current: current.salesCount,
      trend: calcTrend(current.salesCount, previous.salesCount)
    },
    revenue: {
      current: Math.round(current.revenue),
      trend: calcTrend(current.revenue, previous.revenue)
    },
    cancellations: {
      current: current.cancellations,
      trend: calcTrend(current.cancellations, previous.cancellations)
    },
    avgDiscount: {
      current: Math.round(currentAvgDiscount * 10) / 10,
      trend: calcTrend(currentAvgDiscount, previousAvgDiscount)
    }
  }
})

const chartLabels = computed(() => {
  const dates = Object.keys(currentPeriodData.value.daily).sort()
  return dates.map(date => {
    const d = new Date(date)
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`
  })
})

const dailySales = computed(() => {
  const dates = Object.keys(currentPeriodData.value.daily).sort()
  return dates.map(date => currentPeriodData.value.daily[date].salesCount)
})

const dailyRevenue = computed(() => {
  const dates = Object.keys(currentPeriodData.value.daily).sort()
  return dates.map(date => currentPeriodData.value.daily[date].revenue)
})

const dailyCancellations = computed(() => {
  const dates = Object.keys(currentPeriodData.value.daily).sort()
  return dates.map(date => currentPeriodData.value.daily[date].cancellations)
})

const dailyDiscounts = computed(() => {
  const dates = Object.keys(currentPeriodData.value.daily).sort()
  return dates.map(date => {
    const day = currentPeriodData.value.daily[date]
    return day.discountCount > 0 ? day.totalDiscount / day.discountCount : 0
  })
})

const topSalesChanges = computed(() => calculateTopChanges('salesCount'))
const topRevenueChanges = computed(() => calculateTopChanges('revenue'))
const topCancellationChanges = computed(() => calculateTopChanges('cancellations'))
const topDiscountChanges = computed(() => calculateTopChanges('avgDiscount'))

const activeFilters = computed(() => {
  const active: Array<{ key: string; label: string; value: string }> = []
  
  const filterLabels: { [key: string]: string } = {
    region: 'Регион',
    category: 'Категория', 
    brand: 'Бренд',
    article: 'Артикул',
    status: 'Статус'
  }
  
  Object.keys(filterLabels).forEach(key => {
    if (pageFilters.value[key] && pageFilters.value[key] !== 'all') {
      active.push({
        key,
        label: filterLabels[key],
        value: pageFilters.value[key]
      })
    }
  })
  
  return active
})

const activeFiltersCount = computed(() => activeFilters.value.length)

// Methods
function calculatePreviousPeriod(currentFrom: string, currentTo: string) {
  const currentFromDate = new Date(currentFrom)
  const currentToDate = new Date(currentTo)
  
  const periodDuration = Math.floor((currentToDate.getTime() - currentFromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  const previousToDate = new Date(currentFromDate)
  previousToDate.setDate(previousToDate.getDate() - 1)
  
  const previousFromDate = new Date(previousToDate)
  previousFromDate.setDate(previousFromDate.getDate() - periodDuration + 1)
  
  return {
    previousFrom: previousFromDate.toISOString().split('T')[0],
    previousTo: previousToDate.toISOString().split('T')[0]
  }
}

function createEmptyPeriodData(): PeriodData {
  return {
    salesCount: 0,
    revenue: 0,
    cancellations: 0,
    totalDiscount: 0,
    discountCount: 0,
    articles: {},
    daily: {}
  }
}

function getDefaultDates() {
  const today = new Date()
  const currentTo = today.toISOString().split('T')[0]
  
  const currentFrom = new Date(today)
  currentFrom.setDate(today.getDate() - 7)
  const currentFromStr = currentFrom.toISOString().split('T')[0]
  
  const previousTo = new Date(currentFrom)
  previousTo.setDate(previousTo.getDate() - 1)
  const previousToStr = previousTo.toISOString().split('T')[0]
  
  const previousFrom = new Date(previousTo)
  previousFrom.setDate(previousFrom.getDate() - 7)
  const previousFromStr = previousFrom.toISOString().split('T')[0]
  
  return {
    currentFrom: currentFromStr,
    currentTo: currentTo,
    previousFrom: previousFromStr,
    previousTo: previousToStr
  }
}

function resetToDefaultPeriod() {
  const dates = getDefaultDates()
  dateState.currentDateFrom = dates.currentFrom
  dateState.currentDateTo = dates.currentTo
  dateState.previousDateFrom = dates.previousFrom
  dateState.previousDateTo = dates.previousTo
  
  resetFiltersComposable({
    dateFrom: dates.currentFrom,
    dateTo: dates.currentTo,
    previousFrom: dates.previousFrom,
    previousTo: dates.previousTo,
  })
  
  loadData()
}

async function fetchOrdersForPeriod(dateFrom: string, dateTo: string, periodName: string): Promise<Order[]> {
  try {
    const allOrders = await fetchAllPages<Order>('/api/orders', {
      dateFrom,
      dateTo
    }, 2, 1500)
    
    return allOrders
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    ElMessage.error(`Ошибка при загрузке данных за период ${dateFrom} - ${dateTo}`)
    return []
  }
}

function processOrders(orders: Order[]): PeriodData {
  const data = createEmptyPeriodData()
  
  // Применяем фильтры к заказам
  const filteredOrders = orders.filter(order => {
    if (pageFilters.value.article && order.nm_id.toString() !== pageFilters.value.article) return false
    if (pageFilters.value.region && order.oblast !== pageFilters.value.region) return false
    if (pageFilters.value.category && order.category !== pageFilters.value.category) return false
    if (pageFilters.value.brand && order.brand !== pageFilters.value.brand) return false
    if (pageFilters.value.status === 'success' && order.is_cancel) return false
    if (pageFilters.value.status === 'cancel' && !order.is_cancel) return false
    return true
  })
  
  filteredOrders.forEach(order => {
    const date = order.date.split(' ')[0]
    const nmId = order.nm_id
    const totalPrice = parseFloat(order.total_price || '0')
    const isCancel = order.is_cancel || order.cancel_dt !== null
    
    if (!data.daily[date]) {
      data.daily[date] = {
        salesCount: 0,
        revenue: 0,
        cancellations: 0,
        totalDiscount: 0,
        discountCount: 0
      }
    }
    
    if (!data.articles[nmId]) {
      data.articles[nmId] = {
        salesCount: 0,
        revenue: 0,
        cancellations: 0,
        totalDiscount: 0,
        discountCount: 0
      }
    }
    
    if (!isCancel) {
      data.salesCount++
      data.revenue += totalPrice
      data.articles[nmId].salesCount++
      data.articles[nmId].revenue += totalPrice
      data.daily[date].salesCount++
      data.daily[date].revenue += totalPrice
      
      if (order.discount_percent > 0) {
        data.totalDiscount += order.discount_percent
        data.discountCount++
        data.articles[nmId].totalDiscount += order.discount_percent
        data.articles[nmId].discountCount++
        data.daily[date].totalDiscount += order.discount_percent
        data.daily[date].discountCount++
      }
    } else {
      data.cancellations++
      data.articles[nmId].cancellations++
      data.daily[date].cancellations++
    }
  })
  
  return data
}

function calculateTopChanges(metric: 'salesCount' | 'revenue' | 'cancellations' | 'avgDiscount'): ArticleChange[] {
  const changes: ArticleChange[] = []
  const currentArticles = currentPeriodData.value.articles
  const previousArticles = previousPeriodData.value.articles
  
  const allNmIds = new Set([
    ...Object.keys(currentArticles).map(Number),
    ...Object.keys(previousArticles).map(Number)
  ])
  
  allNmIds.forEach(nmId => {
    const current = currentArticles[nmId] || {
      salesCount: 0, revenue: 0, cancellations: 0, totalDiscount: 0, discountCount: 0
    }
    const previous = previousArticles[nmId] || {
      salesCount: 0, revenue: 0, cancellations: 0, totalDiscount: 0, discountCount: 0
    }
    
    let currentValue: number
    let previousValue: number
    
    if (metric === 'avgDiscount') {
      currentValue = current.discountCount > 0 ? current.totalDiscount / current.discountCount : 0
      previousValue = previous.discountCount > 0 ? previous.totalDiscount / previous.discountCount : 0
    } else {
      currentValue = current[metric]
      previousValue = previous[metric]
    }
    
    let change = 0
    if (previousValue === 0) {
      change = currentValue === 0 ? 0 : 100
    } else {
      change = ((currentValue - previousValue) / previousValue) * 100
    }
    
    changes.push({
      nm_id: nmId,
      current: currentValue,
      previous: previousValue,
      change: Math.round(change * 10) / 10
    })
  })
  
  return changes
    .filter(item => Math.abs(item.change) > 0.1)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 10)
}

async function loadData() {
  if (!dateState.currentDateFrom || !dateState.currentDateTo || !dateState.previousDateFrom || !dateState.previousDateTo) {
    ElMessage.warning('Выберите оба периода')
    return
  }
  
  if (dateState.currentDateFrom > dateState.currentDateTo) {
    ElMessage.warning('Дата "с" не может быть больше даты "по" в текущем периоде')
    return
  }
  
  if (dateState.previousDateFrom > dateState.previousDateTo) {
    ElMessage.warning('Дата "с" не может быть больше даты "по" в предыдущем периоде')
    return
  }
  
  loading.value = true
  
  try {
    const [currentOrders, previousOrders] = await Promise.all([
      fetchOrdersForPeriod(dateState.currentDateFrom, dateState.currentDateTo, 'текущий'),
      fetchOrdersForPeriod(dateState.previousDateFrom, dateState.previousDateTo, 'предыдущий')
    ])
    
    // Сохраняем все заказы для фильтров
    allOrders.value = [...currentOrders, ...previousOrders]
    
    currentPeriodData.value = processOrders(currentOrders)
    previousPeriodData.value = processOrders(previousOrders)
    
    ElMessage.success(`Данные загружены: ${currentOrders.length} записей (текущий), ${previousOrders.length} записей (предыдущий)`)
  } catch (error: any) {
    console.error('Error loading data:', error)
    ElMessage.error('Ошибка при загрузке данных')
  } finally {
    loading.value = false
  }
}

const applyPageFilters = () => {
  loadData()
}

const resetPageFilters = () => {
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
  
  loadData()
}

const clearFilter = (filterKey: string) => {
  pageFilters.value[filterKey] = filterKey === 'status' ? 'all' : ''
  loadData()
}

const clearAllPageFilters = () => {
  resetPageFilters()
}

const goToMetricPage = (metricType: string) => {
  router.push({
    path: `/metric/${metricType}`,
    query: {
      dateFrom: dateState.currentDateFrom,
      dateTo: dateState.currentDateTo,
      region: pageFilters.value.region,
      category: pageFilters.value.category,
      brand: pageFilters.value.brand,
      status: pageFilters.value.status
    }
  })
}

const goToArticleDetail = (article: ArticleChange) => {
  router.push({
    path: `/article/${article.nm_id}`,
    query: {
      dateFrom: dateState.currentDateFrom,
      dateTo: dateState.currentDateTo,
      region: pageFilters.value.region,
      category: pageFilters.value.category,
      brand: pageFilters.value.brand,
      status: pageFilters.value.status
    }
  })
}

watch(() => [dateState.currentDateFrom, dateState.currentDateTo], () => {
  pageFilters.value.dateFrom = dateState.currentDateFrom
  pageFilters.value.dateTo = dateState.currentDateTo
})

// Lifecycle
onMounted(() => {
  if (!dateState.currentDateFrom || !dateState.currentDateTo) {
    resetToDefaultPeriod()
  } else {
    if (!dateState.previousDateFrom || !dateState.previousDateTo) {
      const previousPeriod = calculatePreviousPeriod(dateState.currentDateFrom, dateState.currentDateTo)
      dateState.previousDateFrom = previousPeriod.previousFrom
      dateState.previousDateTo = previousPeriod.previousTo
    }
    loadData()
  }
})
</script>

<style scoped>
.main-page {
  padding: 20px 0px;
  max-width: 1400px;
  margin: 0 auto;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .tables-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>