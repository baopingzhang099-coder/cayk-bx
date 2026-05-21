<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/stats/business">数据统计</t-breadcrumb-item>
        <t-breadcrumb-item>业务数据统计</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">业务数据统计</div>
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
        <stat-card title="投保统计" :value="kpis.insuranceCount" icon="document" color="primary" suffix="份" />
      </t-col>
      <t-col :span="6">
        <stat-card title="限额统计" :value="kpis.limitCount" icon="protect" color="success" suffix="笔" />
      </t-col>
      <t-col :span="6">
        <stat-card title="出运统计" :value="kpis.shipmentCount" icon="airplane" color="primary" suffix="笔" />
      </t-col>
      <t-col :span="6">
        <stat-card title="理赔统计" :value="kpis.claimCount" icon="first-aid-kit" color="warning" suffix="件" />
      </t-col>
    </t-row>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="6">
        <stat-card title="投保金额" :value="`$${kpis.coverageAmount.toLocaleString()}`" icon="money" color="success" />
      </t-col>
      <t-col :span="6">
        <stat-card title="审批通过" :value="store.creditLimits.filter(it => it.status === 'active').length" icon="check-circle" color="success" suffix="笔" />
      </t-col>
      <t-col :span="6">
        <stat-card title="申报及时率" value="95.5%" icon="chart" color="primary" />
      </t-col>
      <t-col :span="6">
        <stat-card title="赔付金额" :value="`$${kpis.claimAmount.toLocaleString()}`" icon="alert" color="danger" />
      </t-col>
    </t-row>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="12">
        <t-card title="投保趋势图">
          <div ref="insuranceTrendRef" class="chart-container"></div>
        </t-card>
      </t-col>
      <t-col :span="12">
        <t-card title="出运走势图">
          <div ref="shipmentTrendRef" class="chart-container"></div>
        </t-card>
      </t-col>
    </t-row>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="12">
        <t-card title="买方地区分布">
          <div ref="buyerRegionRef" class="chart-container"></div>
        </t-card>
      </t-col>
      <t-col :span="12">
        <t-card title="保险方案占比">
          <div ref="planRatioRef" class="chart-container"></div>
        </t-card>
      </t-col>
    </t-row>

    <t-card title="业务数据明细">
      <t-table :data="tableData" :columns="columns" row-key="id" hover stripe>
        <template #coverageAmount="{ row }">¥{{ row.coverageAmount.toLocaleString() }}</template>
        <template #shipmentAmount="{ row }">¥{{ row.shipmentAmount.toLocaleString() }}</template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import * as echarts from 'echarts'
import StatCard from '@/components/common/StatCard.vue'
import { useBusinessStore } from '@/stores/business'

const dateRange = ref([])
const store = useBusinessStore()
const kpis = computed(() => store.businessKpis)

const insuranceTrendRef = ref(null)
const shipmentTrendRef = ref(null)
const buyerRegionRef = ref(null)
const planRatioRef = ref(null)
let insuranceTrendChart = null
let shipmentTrendChart = null
let buyerRegionChart = null
let planRatioChart = null

const months = ['2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05']
const insuranceCountData = [20, 25, 22, 28, 32, 30, 35, 38, 35, 42, 48, 45]
const shipmentAmountData = [800000, 950000, 880000, 1200000, 1500000, 1350000, 1600000, 1850000, 1680000, 2100000, 2350000, 2200000]

const columns = [
  { colKey: 'month', title: '月份', width: 100 },
  { colKey: 'insuranceCount', title: '投保数量', align: 'center' },
  { colKey: 'coverageAmount', title: '投保金额', align: 'right' },
  { colKey: 'limitCount', title: '申请限额', align: 'center' },
  { colKey: 'shipmentCount', title: '出运申报', align: 'center' },
  { colKey: 'shipmentAmount', title: '出运金额', align: 'right' },
  { colKey: 'claimCount', title: '理赔案件', align: 'center' },
  { colKey: 'claimAmount', title: '理赔金额', align: 'right' }
]

const tableData = computed(() => {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return [
    { id: 1, month, insuranceCount: kpis.value.insuranceCount, coverageAmount: kpis.value.coverageAmount, limitCount: kpis.value.limitCount, shipmentCount: kpis.value.shipmentCount, shipmentAmount: kpis.value.shipmentAmount, claimCount: kpis.value.claimCount, claimAmount: kpis.value.claimAmount }
  ]
})

const initInsuranceTrendChart = () => {
  if (!insuranceTrendRef.value) return
  insuranceTrendChart = echarts.init(insuranceTrendRef.value)
  insuranceTrendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: months },
    yAxis: { type: 'value', name: '份数' },
    series: [{
      name: '投保数量',
      type: 'line',
      smooth: true,
      data: insuranceCountData,
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: '#0052D9' },
      lineStyle: { color: '#0052D9' }
    }]
  })
}

const initShipmentTrendChart = () => {
  if (!shipmentTrendRef.value) return
  shipmentTrendChart = echarts.init(shipmentTrendRef.value)
  shipmentTrendChart.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}<br/>出运金额: ¥{c}' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: months, axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: '金额(元)', axisLabel: { formatter: (v) => v >= 10000 ? v / 10000 + '万' : v } },
    series: [{
      name: '出运金额',
      type: 'bar',
      data: shipmentAmountData,
      itemStyle: { color: '#00A870', borderRadius: [4, 4, 0, 0] }
    }]
  })
}

const initBuyerRegionChart = () => {
  if (!buyerRegionRef.value) return
  buyerRegionChart = echarts.init(buyerRegionRef.value)
  buyerRegionChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: [
        { value: 30, name: '北美', itemStyle: { color: '#0052D9' } },
        { value: 25, name: '欧洲', itemStyle: { color: '#00A870' } },
        { value: 20, name: '东南亚', itemStyle: { color: '#E34D59' } },
        { value: 15, name: '日韩', itemStyle: { color: '#E7A500' } },
        { value: 10, name: '其他', itemStyle: { color: '#666666' } }
      ]
    }]
  })
}

const initPlanRatioChart = () => {
  if (!planRatioRef.value) return
  planRatioChart = echarts.init(planRatioRef.value)
  planRatioChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: [
        { value: 35, name: '方案A', itemStyle: { color: '#0052D9' } },
        { value: 40, name: '方案B', itemStyle: { color: '#00A870' } },
        { value: 25, name: '方案C', itemStyle: { color: '#E34D59' } }
      ]
    }]
  })
}

const initCharts = () => {
  initInsuranceTrendChart()
  initShipmentTrendChart()
  initBuyerRegionChart()
  initPlanRatioChart()
}

const handleResize = () => {
  insuranceTrendChart && insuranceTrendChart.resize()
  shipmentTrendChart && shipmentTrendChart.resize()
  buyerRegionChart && buyerRegionChart.resize()
  planRatioChart && planRatioChart.resize()
}

onMounted(() => {
  store.ensureSeeded()
  setTimeout(initCharts, 100)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  insuranceTrendChart && insuranceTrendChart.dispose()
  shipmentTrendChart && shipmentTrendChart.dispose()
  buyerRegionChart && buyerRegionChart.dispose()
  planRatioChart && planRatioChart.dispose()
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
