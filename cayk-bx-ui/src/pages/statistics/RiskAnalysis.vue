<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/stats/business">数据统计</t-breadcrumb-item>
        <t-breadcrumb-item>风险数据分析</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">风险数据分析</div>
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
        <stat-card title="赔付率" value="3.2%" icon="percentage" color="warning" />
      </t-col>
      <t-col :span="6">
        <stat-card title="逾期率" value="2.1%" icon="alarm" color="danger" />
      </t-col>
      <t-col :span="6">
        <stat-card title="风险买方" :value="8" icon="warning" color="danger" suffix="家" />
      </t-col>
      <t-col :span="6">
        <stat-card title="预警数量" :value="15" icon="alert" color="warning" suffix="条" />
      </t-col>
    </t-row>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="12">
        <t-card title="赔付率分析">
          <div ref="payoutRateRef" class="chart-container"></div>
        </t-card>
      </t-col>
      <t-col :span="12">
        <t-card title="逾期率分析">
          <div ref="overdueRateRef" class="chart-container"></div>
        </t-card>
      </t-col>
    </t-row>

    <t-card title="买方风险排名" class="mb-16">
      <t-table :data="tableData" :columns="columns" row-key="id" hover stripe>
        <template #riskLevel="{ row }">
          <t-tag :theme="row.riskLevel === 'high' ? 'danger' : row.riskLevel === 'medium' ? 'warning' : 'success'">
            {{ row.riskLevel === 'high' ? '高风险' : row.riskLevel === 'medium' ? '中风险' : '低风险' }}
          </t-tag>
        </template>
        <template #claimAmount="{ row }">¥{{ row.claimAmount.toLocaleString() }}</template>
      </t-table>
    </t-card>

    <t-card title="风险预警">
      <t-table :data="alertData" :columns="alertColumns" row-key="id" hover>
        <template #alertLevel="{ row }">
          <t-tag :theme="row.alertLevel === 'high' ? 'danger' : row.alertLevel === 'medium' ? 'warning' : 'default'">
            {{ row.alertLevel === 'high' ? '高' : row.alertLevel === 'medium' ? '中' : '低' }}
          </t-tag>
        </template>
        <template #status="{ row }">
          <t-tag :theme="row.status === 'pending' ? 'warning' : 'success'">
            {{ row.status === 'pending' ? '待处理' : '已处理' }}
          </t-tag>
        </template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import StatCard from '@/components/common/StatCard.vue'

const dateRange = ref([])
const payoutRateRef = ref(null)
const overdueRateRef = ref(null)
let payoutChart = null
let overdueChart = null

const months = ['2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05']
const payoutRateData = [2.1, 2.5, 2.3, 2.8, 3.0, 2.9, 3.1, 2.8, 3.2, 3.5, 3.1, 3.2]
const overdueRateData = [1.5, 1.8, 1.6, 2.0, 2.2, 2.1, 2.4, 2.0, 2.1, 2.5, 2.3, 2.1]

const initPayoutChart = () => {
  if (!payoutRateRef.value) return
  payoutChart = echarts.init(payoutRateRef.value)
  payoutChart.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}<br/>赔付率: {c}%' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: months },
    yAxis: { type: 'value', name: '%', min: 0, max: 5, axisLabel: { formatter: '{value}%' } },
    series: [{
      name: '赔付率',
      type: 'line',
      smooth: true,
      data: payoutRateData,
      areaStyle: { opacity: 0.3 },
      lineStyle: { color: '#E34D59', width: 3 },
      itemStyle: { color: '#E34D59' },
      markLine: {
        silent: true,
        data: [{ yAxis: 3, label: { formatter: '预警线 3%', color: '#999' } }],
        lineStyle: { color: '#E34D59', type: 'dashed' }
      }
    }]
  })
}

const initOverdueChart = () => {
  if (!overdueRateRef.value) return
  overdueChart = echarts.init(overdueRateRef.value)
  overdueChart.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}<br/>逾期率: {c}%' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: months },
    yAxis: { type: 'value', name: '%', min: 0, max: 4, axisLabel: { formatter: '{value}%' } },
    series: [{
      name: '逾期率',
      type: 'line',
      smooth: true,
      data: overdueRateData,
      areaStyle: { opacity: 0.3 },
      lineStyle: { color: '#E7A500', width: 3 },
      itemStyle: { color: '#E7A500' },
      markLine: {
        silent: true,
        data: [{ yAxis: 2, label: { formatter: '预警线 2%', color: '#999' } }],
        lineStyle: { color: '#E7A500', type: 'dashed' }
      }
    }]
  })
}

const initCharts = () => {
  initPayoutChart()
  initOverdueChart()
}

const handleResize = () => {
  payoutChart && payoutChart.resize()
  overdueChart && overdueChart.resize()
}

onMounted(() => {
  setTimeout(initCharts, 100)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  payoutChart && payoutChart.dispose()
  overdueChart && overdueChart.dispose()
  window.removeEventListener('resize', handleResize)
})

const columns = [
  { colKey: 'rank', title: '排名', width: 80, align: 'center' },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'enterpriseName', title: '关联企业' },
  { colKey: 'claimCount', title: '理赔次数', align: 'center' },
  { colKey: 'claimAmount', title: '理赔金额', align: 'right' },
  { colKey: 'overdueRate', title: '逾期率', align: 'right' },
  { colKey: 'riskLevel', title: '风险等级', width: 100, slot: 'riskLevel' }
]

const alertColumns = [
  { colKey: 'alertTime', title: '预警时间', width: 160 },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'alertType', title: '预警类型' },
  { colKey: 'alertContent', title: '预警内容' },
  { colKey: 'alertLevel', title: '等级', width: 80, slot: 'alertLevel' },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' }
]

const tableData = ref([
  { id: 1, rank: 1, buyerName: 'ABC Corporation', enterpriseName: '深圳XX国际贸易有限公司', claimCount: 3, claimAmount: 150000, overdueRate: '8.5%', riskLevel: 'high' },
  { id: 2, rank: 2, buyerName: 'DEF GmbH', enterpriseName: '上海YY进出口公司', claimCount: 2, claimAmount: 80000, overdueRate: '5.2%', riskLevel: 'medium' },
  { id: 3, rank: 3, buyerName: 'GHI Ltd', enterpriseName: '北京ZZ贸易集团', claimCount: 1, claimAmount: 30000, overdueRate: '2.1%', riskLevel: 'low' },
  { id: 4, rank: 4, buyerName: 'JKL Co', enterpriseName: '广州AA实业公司', claimCount: 1, claimAmount: 25000, overdueRate: '1.8%', riskLevel: 'low' }
])

const alertData = ref([
  { id: 1, alertTime: '2026-05-12 10:30', buyerName: 'ABC Corporation', alertType: '赔付预警', alertContent: '买方赔付率超过8%，请关注', alertLevel: 'high', status: 'pending' },
  { id: 2, alertTime: '2026-05-11 14:20', buyerName: 'DEF GmbH', alertType: '逾期预警', alertContent: '买方逾期率超过5%', alertLevel: 'medium', status: 'pending' },
  { id: 3, alertTime: '2026-05-10 09:15', buyerName: 'GHI Ltd', alertType: '额度预警', alertContent: '买方信用额度即将用尽', alertLevel: 'medium', status: 'completed' }
])
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.page-actions { display: flex; gap: 12px; }
.mb-16 { margin-bottom: 16px; }
.chart-container { height: 280px; width: 100%; }
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>
