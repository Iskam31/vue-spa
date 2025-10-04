<template>
  <div class="metric-page">
    <el-card style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
        <div>
          <h2 style="margin: 0; color: #303133;">{{ pageTitle }}</h2>
          <div style="color: #909399; font-size: 14px; margin-top: 4px;">
            Период: {{ dateFrom }} - {{ dateTo }}
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <el-button @click="$router.back()">
            ← Назад
          </el-button>
        </div>
      </div>
    </el-card>

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
        
        <el-select v-model="filters.article" placeholder="Артикул" clearable style="width: 150px;">
          <el-option
            v-for="article in uniqueArticles"
            :key="article"
            :label="article"
            :value="article"
          />
        </el-select>
        
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
        
        <el-button type="primary" @click="applyFilters">
          Применить
        </el-button>
        <el-button @click="resetFilters">
          Сбросить
        </el-button>
      </div>
    </el-card>

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
            {{ parseFloat(row.total_price || 0).toLocaleString('ru-RU') }} ₽
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

const loading = ref(false)
const orders = ref<Order[]>([])
const dateFrom = ref('')
const dateTo = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const filters = ref({
  article: '',
  region: '',
  category: '',
  brand: ''
})

// computed
const metricType = computed(() => route.params.metricType as string)
const metricId = computed(() => route.params.id as string)

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
  return [...new Set(orders.value.map(item => item.oblast).filter(Boolean))].sort()
})

const uniqueCategories = computed(() => {
  return [...new Set(orders.value.map(item => item.category).filter(Boolean))].sort()
})

const uniqueBrands = computed(() => {
  return [...new Set(orders.value.map(item => item.brand).filter(Boolean))].sort()
})

const filteredData = computed(() => {
  return orders.value.filter(order => {
    if (filters.value.article && order.nm_id.toString() !== filters.value.article) return false
    if (filters.value.region && order.oblast !== filters.value.region) return false
    if (filters.value.category && order.category !== filters.value.category) return false
    if (filters.value.brand && order.brand !== filters.value.brand) return false
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

const applyFilters = () => {
  currentPage.value = 1
  loadData()
}

const resetFilters = () => {
  filters.value = {
    article: '',
    region: '',
    category: '',
    brand: ''
  }
  currentPage.value = 1
  loadData()
}

const goToArticleDetail = (order: Order) => {
  router.push({
    path: `/article/${order.nm_id}`,
    query: {
      dateFrom: dateFrom.value,
      dateTo: dateTo.value
    }
  })
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
    orders.value = resp.data.data || []
    
    console.log(resp);
    

    ElMessage.success(`Загружено ${orders.value.length} записей`)
  } catch (error: any) {
    console.error('Error loading metric data:', error)
    ElMessage.error('Ошибка при загрузке данных')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  dateFrom.value = (route.query.dateFrom as string) || getWeekAgo()
  dateTo.value = (route.query.dateTo as string) || getToday()
  
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