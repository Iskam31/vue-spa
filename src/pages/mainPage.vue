<template>
  <div class="main-page">
    <el-card style="margin-bottom: 20px;" >
      <div style="display: flex; flex-direction: column; gap: 15px; align-items: start; flex-wrap: wrap;">
        <div>
          <span style="margin-right: 8px;">Период<br><br>с:</span>
          <el-date-picker
            v-model="currentDateFrom"
            type="date"
            placeholder="Выберите дату"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div>
          <span style="margin-right: 8px;">по:</span>
          <el-date-picker
            v-model="currentDateTo"
            type="date"
            placeholder="Выберите дату"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div class="line-date"></div>
        <div>
          <span style="margin-right: 8px;">с:</span>
          <el-date-picker
            v-model="previousDateFrom"
            type="date"
            placeholder="Выберите дату"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div>
          <span style="margin-right: 8px;">по:</span>
          <el-date-picker
            v-model="previousDateTo"
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
        
        <!-- прогресс -->
        <el-progress 
          v-if="loading" 
          :percentage="loadProgress" 
          :show-text="false" 
          style="width: 200px;"
        />
      </div>
      
      <!-- загрузка -->
      <div v-if="loading" style="margin-top: 10px; font-size: 12px; color: #909399;">
        {{ loadStatus }}
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
      />
      
      <MetricCard
        title="Общая выручка"
        :value="metrics.revenue.current"
        :trend="metrics.revenue.trend"
        period-label="текущий период"
        :chart-labels="chartLabels"
        :chart-values="dailyRevenue"
      />
      
      <MetricCard
        title="Количество отмен"
        :value="metrics.cancellations.current"
        :trend="metrics.cancellations.trend"
        period-label="текущий период"
        :chart-labels="chartLabels"
        :chart-values="dailyCancellations"
      />
      
      <MetricCard
        title="Средняя скидка"
        :value="metrics.avgDiscount.current"
        :trend="metrics.avgDiscount.trend"
        period-label="текущий период"
        :chart-labels="chartLabels"
        :chart-values="dailyDiscounts"
      />
    </div>

    <div class="tables-grid">
      <TopArticlesTable
        title="Топ артикулов по продажам"
        :data="topSalesChanges"
        empty-text="Нет данных о продажах"
      />
      
      <TopArticlesTable
        title="Топ артикулов по выручке"
        :data="topRevenueChanges"
        empty-text="Нет данных о выручке"
      />
      
      <TopArticlesTable
        title="Топ артикулов по отменам"
        :data="topCancellationChanges"
        empty-text="Нет данных об отменах"
      />
      
      <TopArticlesTable
        title="Топ артикулов по скидкам"
        :data="topDiscountChanges"
        empty-text="Нет данных о скидках"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchAllPages, fetchSinglePage } from '@/api/client'
import type { GenericRecord } from '@/types/api'
import MetricCard from '@/components/MetricCard.vue'
import TopArticlesTable from '@/components/TopArticlesTable.vue'

interface Order extends GenericRecord {
  nm_id: number
  total_price: string
  discount_percent: number
  is_cancel: boolean
  date: string
  cancel_dt: string | null
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

const loading = ref(false)
const currentDateFrom = ref('')
const currentDateTo = ref('')
const previousDateFrom = ref('')
const previousDateTo = ref('')
const loadProgress = ref(0)
const loadStatus = ref('')

const currentPeriodData = ref<PeriodData>(createEmptyPeriodData())
const previousPeriodData = ref<PeriodData>(createEmptyPeriodData())

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
  currentDateFrom.value = dates.currentFrom
  currentDateTo.value = dates.currentTo
  previousDateFrom.value = dates.previousFrom
  previousDateTo.value = dates.previousTo
  loadData()
}

async function fetchOrdersForPeriod(dateFrom: string, dateTo: string, periodName: string): Promise<Order[]> {
  try {
    loadStatus.value = `Загрузка ${periodName} периода...`

    const allOrders = await fetchAllPages<Order>('/api/orders', {
      dateFrom,
      dateTo
    }, 5, 500)
    
    loadProgress.value += 25
    loadStatus.value = `${periodName} период загружен: ${allOrders.length} записей`
    
    return allOrders
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    
    if (error.response?.status === 429) {
      ElMessage.warning('Слишком много запросов. Пожалуйста, подождите...')
      await new Promise(resolve => setTimeout(resolve, 5000))
      loadStatus.value = `Повторная попытка загрузки ${periodName} периода...`
      
      try {
        const singlePageOrders = await fetchSinglePage<Order>('/api/orders', {
          dateFrom,
          dateTo
        })
        loadProgress.value += 25
        loadStatus.value = `${periodName} период загружен (ограничено): ${singlePageOrders.length} записей`
        return singlePageOrders
      } catch (retryError) {
        ElMessage.error(`Ошибка при загрузке данных за ${periodName} период`)
        return []
      }
    } else {
      ElMessage.error(`Ошибка при загрузке данных за ${periodName} период`)
      return []
    }
  }
}

function processOrders(orders: Order[]): PeriodData {
  const data = createEmptyPeriodData()
  
  orders.forEach(order => {
    const date = order.date.split(' ')[0]
    const nmId = order.nm_id
    const totalPrice = parseFloat(order.total_price) || 0
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
  if (!currentDateFrom.value || !currentDateTo.value || !previousDateFrom.value || !previousDateTo.value) {
    ElMessage.warning('Выберите оба периода')
    return
  }
  
  if (currentDateFrom.value > currentDateTo.value) {
    ElMessage.warning('Дата "с" не может быть больше даты "по" в текущем периоде')
    return
  }
  
  if (previousDateFrom.value > previousDateTo.value) {
    ElMessage.warning('Дата "с" не может быть больше даты "по" в предыдущем периоде')
    return
  }
  
  loading.value = true
  loadProgress.value = 0
  loadStatus.value = 'Начало загрузки данных...'
  
  try {
    loadStatus.value = 'Загрузка текущего периода...'
    const currentOrders = await fetchOrdersForPeriod(
      currentDateFrom.value, 
      currentDateTo.value, 
      'текущий'
    )
    
    loadStatus.value = 'Загрузка предыдущего периода...'
    const previousOrders = await fetchOrdersForPeriod(
      previousDateFrom.value, 
      previousDateTo.value, 
      'предыдущий'
    )
    
    loadStatus.value = 'Обработка данных...'
    currentPeriodData.value = processOrders(currentOrders)
    previousPeriodData.value = processOrders(previousOrders)
    
    loadProgress.value = 100
    loadStatus.value = 'Готово'
    
    ElMessage.success(`Данные загружены: ${currentOrders.length} записей (текущий), ${previousOrders.length} записей (предыдущий)`)
    
    setTimeout(() => {
      if (loadStatus.value === 'Готово') {
        loadStatus.value = ''
      }
    }, 3000)
    
  } catch (error: any) {
    console.error('Error loading data:', error)
    ElMessage.error('Ошибка при загрузке данных')
    loadStatus.value = 'Ошибка загрузки'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  resetToDefaultPeriod()
})
</script>

<style scoped>
.main-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.line-date {
    width: 100%;
    height: 2px;
   background: rgb(210, 210, 210);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
  margin-bottom: 20px;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(1, 1fr);
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