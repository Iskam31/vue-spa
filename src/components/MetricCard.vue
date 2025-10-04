<template>
    <el-card 
        class="metric-card"
        :body-style="{ padding: '20px' }"
        :class="{ 'clickable': clickable }"
        @click="handleClick"
        >
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
        <div v-if="clickable" class="metric-footer">
            <span class="click-hint">Нажмите для деталей →</span>
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
    metricType?: string
    clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    trend: null,
    periodLabel: 'текущий период',
    chartLabels: () => [],
    chartValues: () => [],
    metricType: '',
    clickable: true
})

const emit = defineEmits<{
  click: [metricType: string]
}>()

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

const handleClick = () => {
  if (props.clickable && props.metricType) {
    emit('click', props.metricType)
  }
}
</script>

<style scoped>
.metric-card {
    height: 100%;
    transition: all 0.3s ease;
    cursor: default;
}

.metric-card.clickable {
    cursor: pointer;
}

.metric-card.clickable:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: #409EFF;
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

.metric-footer {
    margin-top: 12px;
    text-align: right;
}

.click-hint {
    font-size: 12px;
    color: #409EFF;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.metric-card.clickable:hover .click-hint {
    opacity: 1;
}
</style>