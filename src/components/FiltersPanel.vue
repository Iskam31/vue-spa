<template>
  <el-form :inline="true" class="filters" @submit.native.prevent>
    <el-form-item label="По строке">
      <el-input v-model="filters.q" placeholder="Search..." clearable />
    </el-form-item>
    <el-form-item label="Поле">
      <el-select v-model="filters.field" placeholder="Поле" clearable>
        <el-option v-for="f in fields" :key="f" :label="f" :value="f" />
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="$emit('apply', filters)">Применить</el-button>
      <el-button @click="reset">Сброс</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive, toRefs } from 'vue'
const emit = defineEmits(['apply'])
const props = defineProps<{ fields: string[] }>()
const filters = reactive({ q: '', field: '' as string | null })

function reset() {
  filters.q = ''
  filters.field = ''
  emit('apply', { ...filters })
}
</script>

<style scoped>
.filters { margin-bottom: 12px; }
</style>