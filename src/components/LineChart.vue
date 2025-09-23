<template>
  <div style="height: 320px;">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const props = defineProps<{
  labels: string[],
  values: number[],
  label?: string
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

onMounted(() => {
  if (!canvas.value) return
  chart = new Chart(canvas.value.getContext('2d')!, {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: [{
        label: props.label || 'Value',
        data: props.values,
        fill: false,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })
})

watch(() => [props.labels, props.values], () => {
  if (!chart) return
  chart.data.labels = props.labels as any
  chart.data.datasets[0].data = props.values as any
  chart.update()
})
</script>