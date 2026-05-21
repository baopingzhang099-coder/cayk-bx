<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/claim/list">理赔管理</t-breadcrumb-item>
        <t-breadcrumb-item>理赔报表管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">理赔报表管理</div>
      <div class="page-actions">
        <t-date-range-picker v-model="dateRange" />
        <t-button theme="primary">
          <template #icon><t-icon name="download" /></template>
          导出
        </t-button>
      </div>
    </div>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="6">
        <stat-card title="本月理赔案件" :value="12" icon="first-aid-kit" color="primary" />
      </t-col>
      <t-col :span="6">
        <stat-card title="本月理赔金额" value="$456,000" icon="money" color="warning" />
      </t-col>
      <t-col :span="6">
        <stat-card title="完结率" value="75%" icon="check-circle" color="success" />
      </t-col>
      <t-col :span="6">
        <stat-card title="赔付率" value="3.2%" icon="percentage" color="danger" />
      </t-col>
    </t-row>

    <t-row :gutter="16">
      <t-col :span="12">
        <t-card title="理赔案件趋势图" class="mb-16">
          <div ref="caseTrendRef" class="chart-container"></div>
        </t-card>
      </t-col>
      <t-col :span="12">
        <t-card title="理赔金额趋势图" class="mb-16">
          <div ref="amountTrendRef" class="chart-container"></div>
        </t-card>
      </t-col>
    </t-row>

    <t-card title="理赔案件处理报告">
      <t-table :data="tableData" :columns="columns" row-key="id" hover>
        <template #claimAmount="{ row }">¥{{ row.claimAmount.toLocaleString() }}</template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import StatCard from '@/components/common/StatCard.vue'

const dateRange = ref([])

const caseTrendRef = ref(null)
const amountTrendRef = ref(null)
let caseChart = null
let amountChart = null

const months = ['2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05']
const caseData = [5, 7, 6, 8, 10, 9, 11, 8, 10, 15, 12, 12]
const amountData = [180000, 250000, 220000, 320000, 380000, 350000, 420000, 320000, 450000, 580000, 420000, 456000]

const tableData = ref(
  months.map((month, i) => ({
    id: i + 1,
    month,
    caseCount: caseData[i],
    claimAmount: amountData[i],
    closedCount: Math.round(caseData[i] * 0.75),
    closedRate: `${Math.round(70 + Math.random() * 15)}%`
  }))
)

const columns = [
  { colKey: 'month', title: '月份', width: 100 },
  { colKey: 'caseCount', title: '理赔案件', align: 'center' },
  { colKey: 'claimAmount', title: '理赔金额', align: 'right' },
  { colKey: 'closedCount', title: '已结案', align: 'center' },
  { colKey: 'closedRate', title: '结案率', align: 'center' }
]

const initCaseTrendChart = () => {
  if (!caseTrendRef.value) return
  caseChart = echarts.init(caseTrendRef.value)
  caseChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: months },
    yAxis: { type: 'value', name: '件数' },
    series: [{
      name: '理赔案件',
      type: 'line',
      smooth: true,
      data: caseData,
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: '#E34D59' },
      lineStyle: { color: '#E34D59' }
    }]
  })
}

const initAmountTrendChart = () => {
  if (!amountTrendRef.value) return
  amountChart = echarts.init(amountTrendRef.value)
  amountChart.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}<br/>理赔金额: ¥{c}' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: months, axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: '金额(元)', axisLabel: { formatter: (v) => v >= 10000 ? v / 10000 + '万' : v } },
    series: [{
      name: '理赔金额',
      type: 'bar',
      data: amountData,
      itemStyle: { color: '#E34D59', borderRadius: [4, 4, 0, 0] }
    }]
  })
}

const initCharts = () => {
  initCaseTrendChart()
  initAmountTrendChart()
}

const handleResize = () => {
  caseChart && caseChart.resize()
  amountChart && amountChart.resize()
}

onMounted(() => {
  setTimeout(initCharts, 100)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  caseChart && caseChart.dispose()
  amountChart && amountChart.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.page-actions { display: flex; gap: 12px; }
.mb-16 { margin-bottom: 16px; }
.chart-container { height: 250px; width: 100%; }
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>
