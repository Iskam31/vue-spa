<template>
    <el-card class="metric-card" :body-style="{ padding: '20px' }">
        <div class="metric-header">
            <h3 class="metric-title">{{ title }}</h3>
            <el-tag :type="trendType" effect="plain">
                <span v-if="trend !== null">
                    {{ trend > 0 ? '↑' : trend < 0 ? '↓' : '→' }} {{ Math.abs(trend).toFixed(3) }}% </span>
                        <span v-else>—</span>
            </el-tag>
        </div>

        <div class="metric-value">{{ formattedValue }}</div>
        <div class="metric-period">за {{ periodLabel }}</div>

        <div class="metric-chart">
            <LineChart :labels="chartLabels" :values="chartValues" :label="title" :height="120" />
        </div>
    </el-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import LineChart from './LineChart.vue'

interface Props {
    title: string
    value: number
    trend?: number | null
    periodLabel?: string
    chartLabels?: string[]
    chartValues?: number[]
}

const props = withDefaults(defineProps<Props>(), {
    trend: null,
    periodLabel: 'текущий период',
    chartLabels: () => [],
    chartValues: () => []
})

const formattedValue = computed(() => {
    if (props.value >= 1000000) {
        return (props.value / 1000000).toFixed(1) + 'M'
    } else if (props.value >= 1000) {
        return (props.value / 1000).toFixed(1) + 'K'
    }
    return props.value.toString()
})

const trendType = computed(() => {
    if (props.trend === null) return 'info'
    return props.trend > 0 ? 'success' : props.trend < 0 ? 'danger' : 'warning'
})
</script>

<style scoped>
.metric-card {
    height: 100%;
    transition: all 0.3s ease;
}

.metric-card:hover {
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

.metric-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.metric-title {
    margin: 0;
    font-size: 12px;
    color: #606266;
    font-weight: 500;
}

.metric-value {
    font-size: 18px;
    font-weight: 700;
    color: #303133;
}

.metric-period {
    font-size: 12px;
    color: #909399;
    margin-bottom: 16px;
}

.metric-chart {
    height: 80px;
}
</style>