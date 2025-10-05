<template>
  <div class="article-page">

    <el-card style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px;">
        <div>
          <h1 style="margin: 0 0 8px 0; color: #303133;">
            Артикул: <span class="article-id">{{ articleId }}</span>
          </h1>
          <div style="color: #909399; font-size: 14px;">
            Детальная статистика по товару
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

    <div class="metrics-grid" style="margin-bottom: 20px;">
      <el-card class="metric-item">
        <div class="metric-value">{{ totalSales }}</div>
        <div class="metric-label">Всего продаж</div>
      </el-card>
      
      <el-card class="metric-item">
        <div class="metric-value">{{ totalRevenue.toLocaleString('ru-RU') }} ₽</div>
        <div class="metric-label">Общая выручка</div>
      </el-card>
      
      <el-card class="metric-item">
        <div class="metric-value">{{ totalCancellations }}</div>
        <div class="metric-label">Отмены</div>
      </el-card>
      
      <el-card class="metric-item">
        <div class="metric-value">{{ avgDiscount }}%</div>
        <div class="metric-label">Средняя скидка</div>
      </el-card>
    </div>

    <el-card style="margin-bottom: 20px;">
      <div style="display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
        <div>
          <span style="margin-right: 8px;">Дата с:</span>
          <el-date-picker
            v-model="dateFrom"
            type="date"
            placeholder="Выберите дату"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div>
          <span style="margin-right: 8px;">по:</span>
          <el-date-picker
            v-model="dateTo"
            type="date"
            placeholder="Выберите дату"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </div>
        
        <el-select v-model="filters.region" placeholder="Регион" clearable style="width: 180px;">
          <el-option
            v-for="region in uniqueRegions"
            :key="region"
            :label="region"
            :value="region"
          />
        </el-select>
        
        <el-select v-model="filters.category" placeholder="Категория" clearable style="width: 180px;">
          <el-option
            v-for="category in uniqueCategories"
            :key="category"
            :label="category"
            :value="category"
          />
        </el-select>
        
        <el-select v-model="filters.brand" placeholder="Бренд" clearable style="width: 150px;">
          <el-option
            v-for="brand in uniqueBrands"
            :key="brand"
            :label="brand"
            :value="brand"
          />
        </el-select>

        <el-select v-model="filters.status" placeholder="Статус" clearable style="width: 130px;">
          <el-option label="Успешные" value="success" />
          <el-option label="Отмены" value="cancelled" />
          <el-option label="Все" value="all" />
        </el-select>
        
        <el-button type="primary" @click="applyPageFilters">
          Применить
        </el-button>
        <el-button @click="resetPageFilters">
          Сбросить
        </el-button>
      </div>
    </el-card>

    <div class="charts-grid" style="margin-bottom: 20px;">
      <el-card>
        <template #header>
          <span style="font-weight: 600;">Динамика продаж</span>
        </template>
        <LineChart 
          :labels="salesChartLabels" 
          :values="salesChartValues" 
          label="Количество продаж"
          :height="200"
        />
      </el-card>
      
      <el-card>
        <template #header>
          <span style="font-weight: 600;">Динамика выручки</span>
        </template>
        <LineChart 
          :labels="revenueChartLabels" 
          :values="revenueChartValues" 
          label="Выручка, ₽"
          :height="200"
        />
      </el-card>
    </div>

    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600;">Детальная информация по заказам</span>
          <span style="color: #909399; font-size: 14px;">
            Всего записей: {{ filteredData.length }}
          </span>
        </div>
      </template>
      
      <el-table 
        :data="paginatedData" 
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="date" label="Дата" width="140" sortable>
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="total_price" label="Сумма" align="right" width="120" sortable>
          <template #default="{ row }">
            {{ parseFloat(row.total_price || '0').toLocaleString('ru-RU') }} ₽
          </template>
        </el-table-column>
        
        <el-table-column prop="discount_percent" label="Скидка" align="right" width="100" sortable>
          <template #default="{ row }">
            {{ row.discount_percent || 0 }}%
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
        
        <el-table-column prop="warehouse_name" label="Склад" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.warehouse_name || '—' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="is_cancel" label="Статус" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_cancel ? 'danger' : 'success'" size="small">
              {{ row.is_cancel ? 'Отмена' : 'Успешно' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="supplier_article" label="Артикул поставщика" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.supplier_article || '—' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="tech_size" label="Размер" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.tech_size || '—' }}
          </template>
        </el-table-column>
      </el-table>

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

    <el-card style="margin-top: 20px;">
      <template #header>
        <span style="font-weight: 600;">Статистика по регионам</span>
      </template>
      <el-table :data="regionStats" style="width: 100%">
        <el-table-column prop="region" label="Регион" />
        <el-table-column prop="sales" label="Продажи" align="right" />
        <el-table-column prop="revenue" label="Выручка" align="right">
          <template #default="{ row }">
            {{ row.revenue.toLocaleString('ru-RU') }} ₽
          </template>
        </el-table-column>
        <el-table-column prop="cancellations" label="Отмены" align="right" />
      </el-table>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
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
  supplier_article: string
  tech_size: string
  barcode: string
  g_number: string
}

interface RegionStat {
  region: string
  sales: number
  revenue: number
  cancellations: number
}

const route = useRoute()

// Используем композабл для фильтров с переименованными методами
const { filters, applyFilters: applyFiltersComposable, resetFilters: resetFiltersComposable } = useFilters({
  status: 'all'
})

const loading = ref<boolean>(false)
const orders = ref<Order[]>([])
const currentPage = ref<number>(1)
const pageSize = ref<number>(20)

const dateFrom = ref<string>(filters.value.dateFrom as string)
const dateTo = ref<string>(filters.value.dateTo as string)

// Computed
const articleId = computed(() => route.params.id as string)

const filteredData = computed(() => {
  return orders.value.filter(order => {
    if (filters.value.region && order.oblast !== filters.value.region) return false
    if (filters.value.category && order.category !== filters.value.category) return false
    if (filters.value.brand && order.brand !== filters.value.brand) return false
    if (filters.value.status === 'success' && order.is_cancel) return false
    if (filters.value.status === 'cancelled' && !order.is_cancel) return false
    return true
  })
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const totalSales = computed(() => {
  return filteredData.value.filter(order => !order.is_cancel).length
})

const totalRevenue = computed(() => {
  return filteredData.value
    .filter(order => !order.is_cancel)
    .reduce((sum, order) => sum + parseFloat(order.total_price || '0'), 0)
})

const totalCancellations = computed(() => {
  return filteredData.value.filter(order => order.is_cancel).length
})

const avgDiscount = computed(() => {
  const ordersWithDiscount = filteredData.value
    .filter(order => !order.is_cancel && order.discount_percent > 0)
  return ordersWithDiscount.length > 0
    ? Math.round(ordersWithDiscount.reduce((sum, order) => sum + order.discount_percent, 0) / ordersWithDiscount.length * 10) / 10
    : 0
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

const salesChartLabels = computed(() => {
  const dates = [...new Set(filteredData.value.map(item => item.date.split(' ')[0]))].sort()
  return dates.map(date => {
    const d = new Date(date)
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`
  })
})

const salesChartValues = computed(() => {
  const dates = [...new Set(filteredData.value.map(item => item.date.split(' ')[0]))].sort()
  return dates.map(date => {
    return filteredData.value
      .filter(item => item.date.split(' ')[0] === date && !item.is_cancel)
      .length
  })
})

const revenueChartLabels = computed(() => salesChartLabels.value)

const revenueChartValues = computed(() => {
  const dates = [...new Set(filteredData.value.map(item => item.date.split(' ')[0]))].sort()
  return dates.map(date => {
    return filteredData.value
      .filter(item => item.date.split(' ')[0] === date && !item.is_cancel)
      .reduce((sum, item) => sum + parseFloat(item.total_price || '0'), 0)
  })
})

const regionStats = computed(() => {
  const regions = [...new Set(filteredData.value.map(item => item.oblast || '').filter(Boolean))]
  
  return regions.map(region => {
    const regionOrders = filteredData.value.filter(order => order.oblast === region)
    const successfulOrders = regionOrders.filter(order => !order.is_cancel)
    
    return {
      region,
      sales: successfulOrders.length,
      revenue: successfulOrders.reduce((sum, order) => sum + parseFloat(order.total_price || '0'), 0),
      cancellations: regionOrders.filter(order => order.is_cancel).length
    }
  }).sort((a, b) => b.revenue - a.revenue)
})

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU')
}

const applyPageFilters = () => {
  currentPage.value = 1
}

const resetPageFilters = () => {
  const currentDateFrom = filters.value.dateFrom
  const currentDateTo = filters.value.dateTo
  
  resetFiltersComposable({
    dateFrom: currentDateFrom,
    dateTo: currentDateTo,
    region: '',
    category: '',
    brand: '',
    status: 'all'
  })
  
  currentPage.value = 1
}

const exportData = () => {
  ElMessage.info('Функция экспорта в разработке')
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      dateFrom: dateFrom.value,
      dateTo: dateTo.value,
      key: "E6kUTYrYwZq2tN4QEtyzsbEBk3ie",
      limit: 500
    }

    const resp = await client.get('/api/orders', { params })
    orders.value = (resp.data.data || []).filter((order: Order) => 
      order.nm_id.toString() === articleId.value
    )
    
    ElMessage.success(`Загружено ${orders.value.length} записей по артикулу ${articleId.value}`)
  } catch (error: any) {
    console.error('Error loading article data:', error)
    ElMessage.error('Ошибка при загрузке данных')
  } finally {
    loading.value = false
  }
}

watch(() => filters.value.dateFrom, (newVal: string) => {
  dateFrom.value = newVal
})

watch(() => filters.value.dateTo, (newVal: string) => {
  dateTo.value = newVal
})

// Lifecycle
onMounted(() => {
  if (!dateFrom.value || !dateTo.value) {
    const defaultDates = getDefaultDates()
    dateFrom.value = defaultDates.currentFrom
    dateTo.value = defaultDates.currentTo
    filters.value.dateFrom = defaultDates.currentFrom
    filters.value.dateTo = defaultDates.currentTo
  }
  
  loadData()
})

watch([dateFrom, dateTo], () => {
  currentPage.value = 1
  loadData()
})

function getToday() {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

function getWeekAgo() {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return weekAgo.toISOString().split('T')[0]
}

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
.article-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.article-id {
  font-family: 'Courier New', monospace;
  color: #409EFF;
  background-color: #f0f9ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.metric-item {
  text-align: center;
  padding: 20px;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>