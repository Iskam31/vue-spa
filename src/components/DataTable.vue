<template>
  <div>
    <el-table :data="rows" v-loading="loading" style="width: 100%">
      <el-table-column v-for="col in displayColumns" :key="col" :prop="col" :label="col" />
    </el-table>

    <div style="display:flex;justify-content:flex-end;margin-top:12px;">
      <el-pagination
        :current-page="page"
        :page-size="perPage"
        :total="total"
        layout="prev, pager, next, sizes, jumper"
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
const props = defineProps<{
  rows: any[],
  loading: boolean,
  page: number,
  perPage: number,
  total: number
}>()
const emit = defineEmits(['update:page', 'update:perPage'])

const displayColumns = computed(() => {
  if (!props.rows || props.rows.length === 0) return []
  const allKeys = new Set<string>()
  props.rows.forEach(item => {
    Object.keys(item).forEach(key => {
      allKeys.add(key)
    })
  })
  return Array.from(allKeys)
})

function onPageChange(p: number) {
  emit('update:page', p)
}

function onSizeChange(s: number) {
  emit('update:perPage', s)
}
</script>