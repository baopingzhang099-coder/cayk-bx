<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/insurance/purchase">投保管理</t-breadcrumb-item>
        <t-breadcrumb-item>投保数据报表</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">投保数据报表</div>
      <div class="page-actions">
        <t-date-range-picker v-model="dateRange" />
        <t-button theme="primary" @click="showExportDialog = true">
          <template #icon><t-icon name="download" /></template>
          导出
        </t-button>
      </div>
    </div>

    <t-dialog
      v-model:visible="showExportDialog"
      header="导出数据"
      width="500px"
      :confirm-btn="null"
      :cancel-btn="null"
    >
      <div class="export-dialog">
        <div class="export-info">
          <div class="info-item">
            <span class="label">导出范围：</span>
            <span class="value">{{ dateRange.length ? `${dateRange[0]} 至 ${dateRange[1]}` : '全部数据' }}</span>
          </div>
          <div class="info-item">
            <span class="label">数据条数：</span>
            <span class="value">{{ tableData.length }} 条</span>
          </div>
          <div class="info-item">
            <span class="label">导出格式：</span>
            <span class="value">Excel (.xlsx)</span>
          </div>
        </div>
        <div class="export-preview">
          <div class="preview-title">导出预览</div>
          <t-table :data="previewData" :columns="previewColumns" size="small" :pagination="false" />
        </div>
        <div class="export-actions">
          <t-button @click="showExportDialog = false">取消</t-button>
          <t-button theme="primary" @click="handleExport" :loading="exporting">
            <template #icon><t-icon name="download" /></template>
            确认导出
          </t-button>
        </div>
      </div>
    </t-dialog>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="6">
        <stat-card title="本月投保数量" :value="45" icon="document" color="primary" :trend="12" suffix="份" />
      </t-col>
      <t-col :span="6">
        <stat-card title="本月投保金额" value="$2,350,000" icon="money" color="success" :trend="8" />
      </t-col>
      <t-col :span="6">
        <stat-card title="审批通过率" value="92.5%" icon="check-circle" color="success" />
      </t-col>
      <t-col :span="6">
        <stat-card title="平均处理时长" value="12.5天" icon="time" color="warning" />
      </t-col>
    </t-row>

    <t-row :gutter="16">
      <t-col :span="12">
        <t-card title="投保趋势图" class="mb-16">
          <div ref="trendChartRef" class="chart-container"></div>
        </t-card>
      </t-col>
      <t-col :span="12">
        <t-card title="投保金额趋势图" class="mb-16">
          <div ref="amountChartRef" class="chart-container"></div>
        </t-card>
      </t-col>
    </t-row>

    <t-row :gutter="16">
      <t-col :span="12">
        <t-card title="投保方案分布" class="mb-16">
          <div ref="planChartRef" class="chart-container"></div>
        </t-card>
      </t-col>
      <t-col :span="12">
        <t-card title="买方地区分布" class="mb-16">
          <div ref="regionChartRef" class="chart-container"></div>
        </t-card>
      </t-col>
    </t-row>

    <t-card title="投保明细数据">
      <t-table :data="tableData" :columns="columns" row-key="id" hover>
        <template #coverageAmount="{ row }">¥{{ row.coverageAmount.toLocaleString() }}</template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import * as XLSX from 'xlsx'
import * as echarts from 'echarts'
import StatCard from '@/components/common/StatCard.vue'

const dateRange = ref([])
const tableData = ref([])
const showExportDialog = ref(false)
const exporting = ref(false)

const trendChartRef = ref(null)
const amountChartRef = ref(null)
const planChartRef = ref(null)
const regionChartRef = ref(null)

let trendChart = null
let amountChart = null
let planChart = null
let regionChart = null

const columns = [
  { colKey: 'month', title: '月份', width: 100 },
  { colKey: 'count', title: '投保数量', align: 'center' },
  { colKey: 'coverageAmount', title: '投保金额', align: 'right' },
  { colKey: 'approvedCount', title: '审批通过数', align: 'center' },
  { colKey: 'approvalRate', title: '通过率', align: 'center' },
  { colKey: 'avgDays', title: '平均处理天数', align: 'center' }
]

const previewColumns = [
  { colKey: 'month', title: '月份' },
  { colKey: 'count', title: '投保数量' },
  { colKey: 'coverageAmount', title: '投保金额' },
  { colKey: 'approvedCount', title: '审批通过数' },
  { colKey: 'approvalRate', title: '通过率' },
  { colKey: 'avgDays', title: '平均处理天数' }
]

const previewData = computed(() => {
  return tableData.value.map(item => ({
    month: item.month,
    count: item.count,
    coverageAmount: `¥${item.coverageAmount.toLocaleString()}`,
    approvedCount: item.approvedCount,
    approvalRate: item.approvalRate,
    avgDays: item.avgDays
  }))
})

const handleExport = async () => {
  exporting.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    const exportData = tableData.value.map(item => ({
      '月份': item.month,
      '投保数量': item.count,
      '投保金额': `¥${item.coverageAmount.toLocaleString()}`,
      '审批通过数': item.approvedCount,
      '通过率': item.approvalRate,
      '平均处理天数': item.avgDays
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '投保数据报表')
    XLSX.writeFile(wb, `投保数据报表_${new Date().toLocaleDateString()}.xlsx`)
    MessagePlugin.success('导出成功！')
    showExportDialog.value = false
  } catch (error) {
    MessagePlugin.error('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

const initTrendChart = () => {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: tableData.value.map(item => item.month)
    },
    yAxis: { type: 'value', name: '份数' },
    series: [{
      name: '投保数量',
      type: 'line',
      smooth: true,
      data: tableData.value.map(item => item.count),
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: '#0052D9' }
    }]
  }
  trendChart.setOption(option)
}

const initAmountChart = () => {
  if (!amountChartRef.value) return
  amountChart = echarts.init(amountChartRef.value)
  const option = {
    tooltip: { trigger: 'axis', formatter: '{b}<br/>投保金额: ¥{c}' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: tableData.value.map(item => item.month),
      axisLabel: { rotate: 0 }
    },
    yAxis: { type: 'value', name: '万元', axisLabel: { formatter: '{value}' } },
    series: [{
      name: '投保金额',
      type: 'bar',
      data: tableData.value.map(item => item.coverageAmount / 10000),
      itemStyle: { color: '#00A870', borderRadius: [4, 4, 0, 0] }
    }]
  }
  amountChart.setOption(option)
}

const initPlanChart = () => {
  if (!planChartRef.value) return
  planChart = echarts.init(planChartRef.value)
  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      name: '投保方案',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: {
        label: { show: true, fontSize: 20, fontWeight: 'bold' }
      },
      labelLine: { show: false },
      data: [
        { value: 35, name: '方案A', itemStyle: { color: '#0052D9' } },
        { value: 40, name: '方案B', itemStyle: { color: '#00A870' } },
        { value: 25, name: '方案C', itemStyle: { color: '#E34D59' } }
      ]
    }]
  }
  planChart.setOption(option)
}

const initRegionChart = () => {
  if (!regionChartRef.value) return
  regionChart = echarts.init(regionChartRef.value)
  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      name: '买方地区',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: {
        label: { show: true, fontSize: 20, fontWeight: 'bold' }
      },
      labelLine: { show: false },
      data: [
        { value: 30, name: '北美', itemStyle: { color: '#0052D9' } },
        { value: 25, name: '欧洲', itemStyle: { color: '#00A870' } },
        { value: 20, name: '东南亚', itemStyle: { color: '#E34D59' } },
        { value: 15, name: '日韩', itemStyle: { color: '#E7A500' } },
        { value: 10, name: '其他', itemStyle: { color: '#666666' } }
      ]
    }]
  }
  regionChart.setOption(option)
}

const initCharts = () => {
  initTrendChart()
  initAmountChart()
  initPlanChart()
  initRegionChart()
}

const handleResize = () => {
  trendChart && trendChart.resize()
  amountChart && amountChart.resize()
  planChart && planChart.resize()
  regionChart && regionChart.resize()
}

onMounted(() => {
  tableData.value = [
    { id: 1, month: '2026-01', count: 38, coverageAmount: 1850000, approvedCount: 35, approvalRate: '92.1%', avgDays: 14.2 },
    { id: 2, month: '2026-02', count: 35, coverageAmount: 1680000, approvedCount: 33, approvalRate: '94.3%', avgDays: 12.8 },
    { id: 3, month: '2026-03', count: 42, coverageAmount: 2100000, approvedCount: 39, approvalRate: '92.9%', avgDays: 13.5 },
    { id: 4, month: '2026-04', count: 48, coverageAmount: 2350000, approvedCount: 45, approvalRate: '93.8%', avgDays: 11.9 },
    { id: 5, month: '2026-05', count: 45, coverageAmount: 2350000, approvedCount: 42, approvalRate: '93.3%', avgDays: 12.5 }
  ]
  setTimeout(initCharts, 100)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  trendChart && trendChart.dispose()
  amountChart && amountChart.dispose()
  planChart && planChart.dispose()
  regionChart && regionChart.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.page-actions { display: flex; gap: 12px; }
.mb-16 { margin-bottom: 16px; }
.chart-placeholder { height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #999; }
.chart-container { height: 250px; width: 100%; }

.export-dialog {
  .export-info {
    background: #f5f7fa;
    padding: 16px;
    border-radius: 4px;
    margin-bottom: 16px;

    .info-item {
      display: flex;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        width: 90px;
        color: #666;
      }

      .value {
        color: #333;
        font-weight: 500;
      }
    }
  }

  .export-preview {
    margin-bottom: 16px;

    .preview-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }
  }

  .export-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>
