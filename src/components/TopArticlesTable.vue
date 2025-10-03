<template>
  <el-card class="table-card">
    <template #header>
      <div class="table-header">
        <span class="table-title">{{ title }}</span>
        <el-tag type="info">Топ {{ data.length }}</el-tag>
      </div>
    </template>
    
    <el-table 
      :data="data" 
      :empty-text="emptyText"
      style="width: 100%"
      size="small"
    >
      <el-table-column prop="nm_id" label="Артикул" width="120">
        <template #default="{ row }">
          <span class="article-id">{{ row.nm_id }}</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="current" label="Текущий" align="right" width="110">
        <template #default="{ row }">
          {{ formatNumber(row.current) }}
        </template>
      </el-table-column>
      
      <el-table-column prop="previous" label="Предыдущий" align="right" width="110">
        <template #default="{ row }">
          {{ formatNumber(row.previous) }}
        </template>
      </el-table-column>
      
      <el-table-column prop="change" label="Изменение" align="right" width="120">
        <template #default="{ row }">
          <div class="change-cell" :class="getChangeClass(row.change)">
            <span class="change-icon">
              {{ row.change > 0 ? '↑' : row.change < 0 ? '↓' : '→' }}
            </span>
            {{ Math.abs(row.change) }}%
          </div>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script lang="ts" setup>
interface ArticleChange {
  nm_id: number
  current: number
  previous: number
  change: number
}

interface Props {
  title: string
  data: ArticleChange[]
  emptyText?: string
}

withDefaults(defineProps<Props>(), {
  data: () => [],
  emptyText: 'Нет данных'
})

const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  }
  return value % 1 === 0 ? value.toString() : value.toFixed(1)
}

const getChangeClass = (change: number): string => {
  if (change > 0) return 'change-positive'
  if (change < 0) return 'change-negative'
  return 'change-neutral'
}
</script>

<style scoped>

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  font-weight: 600;
  color: #303133;
}

.article-id {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #409EFF;
}

.change-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-weight: 600;
}

.change-icon {
  margin-right: 4px;
}

.change-positive {
  color: #67C23A;
}

.change-negative {
  color: #F56C6C;
}

.change-neutral {
  color: #909399;
}
</style>