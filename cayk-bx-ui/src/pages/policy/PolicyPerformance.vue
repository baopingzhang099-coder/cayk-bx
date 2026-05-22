<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/policy/list">保单管理</t-breadcrumb-item>
        <t-breadcrumb-item>保单履约报表</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">保单履约报表</div>
    </div>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="6">
        <stat-card title="正常履约" :value="45" icon="check-circle" color="success" />
      </t-col>
      <t-col :span="6">
        <stat-card title="逾期未决" :value="8" icon="alarm" color="danger" />
      </t-col>
      <t-col :span="6">
        <stat-card title="已结案" :value="35" icon="file-checked" color="primary" />
      </t-col>
      <t-col :span="6">
        <stat-card title="履约率" value="96.5%" icon="chart" color="success" />
      </t-col>
    </t-row>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="12">
        <t-card title="履约率趋势">
          <div ref="performanceTrendRef" class="chart-container"></div>
        </t-card>
      </t-col>
    </t-row>

    <t-card>
      <t-table :data="tableData" :columns="columns" row-key="id" hover stripe>
        <template #status="{ row }">
          <status-tag :status="row.status" :status-map="statusMap" />
        </template>
        <template #operation="{ row }">
          <t-link @click="handleView(row)">查看详情</t-link>
        </template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'

const statusMap = {
  normal: '正常履约',
  overdue: '逾期未决',
  closed: '已结案'
}

const performanceTrendRef = ref(null)
let perfChart = null

const months = ['2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05']
const normalRates = [94, 94.5, 95, 95.2, 95.8, 96, 96.2, 96.5, 96.3, 96.8, 97, 96.5]
const overdueRates = [6, 5.5, 5, 4.8, 4.2, 4, 3.8, 3.5, 3.7, 3.2, 3, 3.5]

const initPerfChart = () => {
  if (!performanceTrendRef.value) return
  perfChart = echarts.init(performanceTrendRef.value)
  perfChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['正常履约率', '逾期率'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '22%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: months },
    yAxis: { type: 'value', name: '%', axisLabel: { formatter: '{value}%' } },
    series: [
      {
        name: '正常履约率',
        type: 'line',
        smooth: true,
        data: normalRates,
        areaStyle: { opacity: 0.3 },
        lineStyle: { color: '#00A870', width: 3 },
        itemStyle: { color: '#00A870' }
      },
      {
        name: '逾期率',
        type: 'line',
        smooth: true,
        data: overdueRates,
        lineStyle: { color: '#E34D59', width: 2, type: 'dashed' },
        itemStyle: { color: '#E34D59' }
      }
    ]
  })
}

const columns = [
  { colKey: 'policyNo', title: '保单号', width: 140 },
  { colKey: 'enterpriseName', title: '企业名称', ellipsis: true },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'premiumAmount', title: '保费金额', align: 'right' },
  { colKey: 'paidAmount', title: '已付金额', align: 'right' },
  { colKey: 'overdueAmount', title: '逾期金额', align: 'right' },
  { colKey: 'paymentDate', title: '应付日期', width: 120 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 100, slot: 'operation' }
]

const tableData = ref([
  { id: 1, policyNo: 'PI2026001234', enterpriseName: '深圳XX国际贸易有限公司', buyerName: 'ABC Corporation', premiumAmount: 12500, paidAmount: 12500, overdueAmount: 0, paymentDate: '2026-01-15', status: 'normal' },
  { id: 2, policyNo: 'PI2026001235', enterpriseName: '上海YY进出口公司', buyerName: 'DEF GmbH', premiumAmount: 8000, paidAmount: 8000, overdueAmount: 0, paymentDate: '2026-02-15', status: 'normal' },
  { id: 3, policyNo: 'PI2025000987', enterpriseName: '北京ZZ贸易集团', buyerName: 'GHI Ltd', premiumAmount: 20000, paidAmount: 15000, overdueAmount: 5000, paymentDate: '2025-12-15', status: 'overdue' },
  { id: 4, policyNo: 'PI2025000765', enterpriseName: '广州AA实业公司', buyerName: 'JKL Co', premiumAmount: 15000, paidAmount: 15000, overdueAmount: 0, paymentDate: '2025-11-15', status: 'closed' }
])

const handleView = (row) => console.log('view:', row)

const handleResize = () => { perfChart && perfChart.resize() }

onMounted(() => {
  setTimeout(initPerfChart, 100)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  perfChart && perfChart.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.mb-16 { margin-bottom: 16px; }
.chart-container { height: 280px; width: 100%; }
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>
