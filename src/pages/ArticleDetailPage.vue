<template>
  <div class="article-page">
    <el-card style="margin-bottom: 20px;">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/main' }">Главная</el-breadcrumb-item>
        <el-breadcrumb-item>Артикул {{ articleId }}</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <div class="article-layout">
      <div class="article-sidebar">
        <el-card class="product-card">
          <div class="product-image">
            <div class="image-placeholder">
              <el-icon size="64" color="#909399"><Picture /></el-icon>
              <span class="placeholder-text">Изображение товара</span>
            </div>
          </div>

          <div class="product-info">
            <h2 class="product-title">Артикул {{ articleId }}</h2>
            
            <div class="info-section">
              <h3>Основная информация</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Бренд:</span>
                  <span class="info-value">{{ productInfo.brand || 'Не указан' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Категория:</span>
                  <span class="info-value">{{ productInfo.category || 'Не указана' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Артикул поставщика:</span>
                  <span class="info-value">{{ productInfo.supplierArticle || 'Не указан' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Размер:</span>
                  <span class="info-value">{{ productInfo.techSize || 'Не указан' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Штрихкод:</span>
                  <span class="info-value">{{ productInfo.barcode || 'Не указан' }}</span>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h3>Общая статистика</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ totalSales }}</div>
                  <div class="stat-label">Продажи</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ totalRevenue.toLocaleString('ru-RU') }} ₽</div>
                  <div class="stat-label">Выручка</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ totalCancellations }}</div>
                  <div class="stat-label">Отмены</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ avgDiscount }}%</div>
                  <div class="stat-label">Скидка</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="article-content">
        <el-card style="margin-bottom: 20px;">
          <div style="display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
            <div>
              <span style="margin-right: 8px;">Период с:</span>
              <el-date-picker
                v-model="dateState.dateFrom"
                type="date"
                placeholder="Выберите дату"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                @change="loadData"
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
                @change="loadData"
              />
            </div>
            
            <el-button type="primary" @click="loadData">
              Обновить
            </el-button>
          </div>
        </el-card>

        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600;">Показатели по дням</span>
              <span style="color: #909399; font-size: 14px;">
                Период: {{ dateState.dateFrom }} - {{ dateState.dateTo }}
              </span>
            </div>
          </template>
          
          <el-table 
            :data="metricsTableData" 
            v-loading="loading"
            style="width: 100%"
            :default-sort="{ prop: 'metric', order: 'ascending' }"
          >
            <el-table-column 
              prop="metric" 
              label="Показатель" 
              width="200"
              fixed
            >
              <template #default="{ row }">
                <span class="metric-name">{{ row.metric }}</span>
              </template>
            </el-table-column>
            
            <el-table-column 
              v-for="date in tableDates" 
              :key="date"
              :label="formatTableDate(date)"
              align="right"
              width="120"
            >
              <template #default="{ row }">
                <div class="metric-value">
                  {{ formatMetricValue(row.metric, row[date]) }}
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import client from '@/api/client'
import type { GenericRecord } from '@/types/api'

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
}

interface ProductInfo {
  brand: string
  category: string
  supplierArticle: string
  techSize: string
  barcode: string
}

interface DailyMetrics {
  [date: string]: {
    sales: number
    revenue: number
    cancellations: number
    avgDiscount: number
  }
}

interface MetricTableRow {
  metric: string
  [date: string]: string | number
}

const route = useRoute()

const loading = ref(false)
const orders = ref<Order[]>([])

const dateState = reactive({
  dateFrom: getWeekAgo(),
  dateTo: getToday()
})

// Computed
const articleId = computed(() => route.params.id as string)

const productInfo = computed<ProductInfo>(() => {
  if (orders.value.length === 0) {
    return {
      brand: '',
      category: '',
      supplierArticle: '',
      techSize: '',
      barcode: ''
    }
  }
  
  const firstOrder = orders.value[0]
  return {
    brand: firstOrder.brand || '',
    category: firstOrder.category || '',
    supplierArticle: firstOrder.supplier_article || '',
    techSize: firstOrder.tech_size || '',
    barcode: firstOrder.barcode || ''
  }
})

const totalSales = computed(() => {
  return orders.value.filter(order => !order.is_cancel).length
})

const totalRevenue = computed(() => {
  return orders.value
    .filter(order => !order.is_cancel)
    .reduce((sum, order) => sum + parseFloat(order.total_price || '0'), 0)
})

const totalCancellations = computed(() => {
  return orders.value.filter(order => order.is_cancel).length
})

const avgDiscount = computed(() => {
  const ordersWithDiscount = orders.value
    .filter(order => !order.is_cancel && order.discount_percent > 0)
  return ordersWithDiscount.length > 0
    ? Math.round(ordersWithDiscount.reduce((sum, order) => sum + order.discount_percent, 0) / ordersWithDiscount.length * 10) / 10
    : 0
})

const dailyMetrics = computed<DailyMetrics>(() => {
  const metrics: DailyMetrics = {}
  const dates = getDatesInRange(dateState.dateFrom, dateState.dateTo)
  
  dates.forEach(date => {
    metrics[date] = {
      sales: 0,
      revenue: 0,
      cancellations: 0,
      avgDiscount: 0
    }
  })
  
  orders.value.forEach(order => {
    const date = order.date.split(' ')[0]
    if (metrics[date]) {
      if (!order.is_cancel) {
        metrics[date].sales++
        metrics[date].revenue += parseFloat(order.total_price || '0')
        
        if (order.discount_percent > 0) {
          const current = metrics[date]
          current.avgDiscount = current.avgDiscount === 0 ? 
            order.discount_percent : 
            (current.avgDiscount + order.discount_percent) / 2
        }
      } else {
        metrics[date].cancellations++
      }
    }
  })
  
  return metrics
})

const tableDates = computed(() => {
  return getDatesInRange(dateState.dateFrom, dateState.dateTo)
})

const metricsTableData = computed<MetricTableRow[]>(() => {
  const metrics = dailyMetrics.value
  const dates = tableDates.value
  
  return [
    {
      metric: 'Количество продаж',
      ...Object.fromEntries(dates.map(date => [date, metrics[date]?.sales || 0]))
    },
    {
      metric: 'Выручка',
      ...Object.fromEntries(dates.map(date => [date, metrics[date]?.revenue || 0]))
    },
    {
      metric: 'Количество отмен',
      ...Object.fromEntries(dates.map(date => [date, metrics[date]?.cancellations || 0]))
    },
    {
      metric: 'Средняя скидка',
      ...Object.fromEntries(dates.map(date => [date, metrics[date]?.avgDiscount || 0]))
    }
  ]
})

// Methods
const formatTableDate = (dateString: string) => {
  const date = new Date(dateString)
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`
}

const formatMetricValue = (metric: string, value: number) => {
  if (metric === 'Выручка') {
    return `${Math.round(value).toLocaleString('ru-RU')} ₽`
  } else if (metric === 'Средняя скидка') {
    return value > 0 ? `${value.toFixed(1)}%` : '0%'
  } else {
    return value.toString()
  }
}

function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const currentDate = new Date(startDate)
  const end = new Date(endDate)
  
  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split('T')[0])
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}

function getToday() {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

function getWeekAgo() {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return weekAgo.toISOString().split('T')[0]
}

async function loadData() {
  if (!dateState.dateFrom || !dateState.dateTo) {
    ElMessage.warning('Выберите период')
    return
  }
  
  if (dateState.dateFrom > dateState.dateTo) {
    ElMessage.warning('Дата "с" не может быть больше даты "по"')
    return
  }
  
  loading.value = true
  try {
    const params: any = {
      dateFrom: dateState.dateFrom,
      dateTo: dateState.dateTo,
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

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.article-page {
  padding: 20px 0px;
  max-width: 1400px;
  margin: 0 auto;
}

.article-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  align-items: start;
}

.article-sidebar {
  position: sticky;
  top: 20px;
}

.article-content {
  display: grid;
}

.product-card {
  height: fit-content;
}

.product-image {
  width: 100%;
  height: 250px;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  gap: 12px;
}

.placeholder-text {
  font-size: 14px;
}

.product-title {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
}

.info-section {
  margin-bottom: 24px;
}

.info-section h3 {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 8px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.info-label {
  color: #909399;
  font-size: 14px;
  font-weight: 500;
  min-width: 120px;
}

.info-value {
  color: #303133;
  font-size: 14px;
  text-align: right;
  word-break: break-word;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.metric-name {
  font-weight: 600;
  color: #303133;
}

.metric-value {
  font-weight: 500;
  color: #409EFF;
}

@media (max-width: 1200px) {
  .article-layout {
    grid-template-columns: 1fr;
  }
  
  .article-sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
    gap: 4px;
  }
  
  .info-label,
  .info-value {
    text-align: left;
  }
}
</style>