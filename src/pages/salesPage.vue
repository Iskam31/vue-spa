<template>
    <div>
        <el-card style="margin-bottom: 20px;">
            <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
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
                    <span style="margin-right: 8px;">Дата по:</span>
                    <el-date-picker
                        v-model="dateTo"
                        type="date"
                        placeholder="Выберите дату"
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD"
                    />
                </div>
                <el-button type="primary" @click="applyDates">Применить даты</el-button>
                <el-button @click="resetDates">Сбросить к сегодняшнему дню</el-button>
            </div>
        </el-card>

        <div style="display:flex;flex-direction:column;gap:12px;align-items:flex-start;">
            <div style="flex:1;">
                <line-chart :labels="chartLabels" :values="chartValues" :label="chartFieldLabel" />
            </div>
            <div style="width:320px;">
                <el-card>
                    <div style="margin-bottom:8px;">
                        <el-select v-model="chartField" placeholder="Выбрать поле для графика" style="width:100%;">
                            <el-option v-for="f in fields" :key="f" :label="f" :value="f" />
                        </el-select>
                    </div>
                    <div>Период: <strong>{{ dateFrom }} - {{ dateTo }}</strong></div>
                    <div>Всего записей: <strong>{{ total }}</strong></div>
                    <div>Текущая страница: <strong>{{ page }} из {{ lastPage }}</strong></div>
                </el-card>
            </div>
        </div>

        <data-table :rows="rows" :loading="loading" :page="page" :perPage="perPage" :total="total"
            @update:page="p => page = p" @update:perPage="s => perPage = s" />
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import client, { ApiResponse } from '@/api/client'
import DataTable from '@/components/DataTable.vue'
import LineChart from '@/components/LineChart.vue'
import type { GenericRecord } from '@/types/api'
import { ElMessage } from 'element-plus'

const getToday = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
}

const getWeekAgo = () => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return weekAgo.toISOString().split('T')[0]
}

const rows = ref<GenericRecord[]>([])
const loading = ref(false)
const total = ref<number>(0)
const lastPage = ref<number>(1)
const page = ref<number>(1)
const perPage = ref<number>(10)
const filters = ref({ q: '', field: '' as string | null })
const fields = ref<string[]>([])
const chartField = ref<string | null>(null)

const dateFrom = ref<string>(getWeekAgo())
const dateTo = ref<string>(getToday())

onMounted(() => {
    fetchData()
})

watch([page, perPage], () => {
    fetchData()
})

function applyDates() {
    if (!dateFrom.value || !dateTo.value) {
        ElMessage.warning('Пожалуйста, выберите обе даты')
        return
    }
    
    if (dateFrom.value > dateTo.value) {
        ElMessage.warning('Дата "с" не может быть больше даты "по"')
        return
    }
    
    page.value = 1
    fetchData()
}

function resetDates() {
    dateFrom.value = getToday()
    dateTo.value = getToday()
    page.value = 1
    fetchData()
}

function onApply(newFilters: any) {
    filters.value = newFilters
    page.value = 1
    fetchData()
}

async function fetchData() {
    loading.value = true
    try {
        const params: any = { 
            dateFrom: dateFrom.value,
            dateTo: dateTo.value,
            page: page.value, 
            limit: perPage.value,
            key: "E6kUTYrYwZq2tN4QEtyzsbEBk3ie"
        }
        
        if (filters.value.q) params.q = filters.value.q
        if (filters.value.field) params.field = filters.value.field

        console.log('Fetching data with params:', params)
        
        const resp = await client.get<ApiResponse<GenericRecord>>('/api/sales', { params })
        
        console.log('Sales API Response:', resp.data)

        if (resp.data) {
            rows.value = resp.data.data || []
            total.value = resp.data.meta?.total || 0
            lastPage.value = resp.data.meta?.last_page || 1
            
            if (rows.value.length > 0) {
                fields.value = Object.keys(rows.value[0])
                console.log('Available fields:', fields.value)
            }
            if (!chartField.value && fields.value.length > 0) {
                chartField.value = fields.value.find(f => {
                    const val = rows.value[0][f]
                    return typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)))
                }) || fields.value[0]
            }
        }
    } catch (e: any) {
        console.error('Error fetching sales:', e)
        console.error('Error details:', e.response?.data || e.message)
        ElMessage.error('Ошибка при загрузке данных')
        rows.value = []
        total.value = 0
        lastPage.value = 1
    } finally {
        loading.value = false
    }
}

const chartLabels = computed(() => {
    return rows.value.map((_, index) => `Запись ${index + 1}`)
})

const chartValues = computed(() => {
    if (!chartField.value || rows.value.length === 0) return []
    return rows.value.map(row => {
        const value = row[chartField.value!]
        if (typeof value === 'string' && !isNaN(parseFloat(value))) {
            return parseFloat(value)
        }
        return typeof value === 'number' ? value : 0
    })
})

const chartFieldLabel = computed(() => {
    return chartField.value || 'Значения'
})
</script>