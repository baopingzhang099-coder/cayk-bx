<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">投保数据报表</div>
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
          <div class="chart-placeholder">
            <t-icon name="chart" size="48px" />
            <span>投保数量趋势（折线图）</span>
          </div>
        </t-card>
      </t-col>
      <t-col :span="12">
        <t-card title="投保金额趋势图" class="mb-16">
          <div class="chart-placeholder">
            <t-icon name="chart" size="48px" />
            <span>投保金额趋势（柱状图）</span>
          </div>
        </t-card>
      </t-col>
    </t-row>

    <t-row :gutter="16">
      <t-col :span="12">
        <t-card title="投保方案分布" class="mb-16">
          <div class="chart-placeholder">
            <t-icon name="chart" size="48px" />
            <span>方案A/B/C占比（饼图）</span>
          </div>
        </t-card>
      </t-col>
      <t-col :span="12">
        <t-card title="买方地区分布" class="mb-16">
          <div class="chart-placeholder">
            <t-icon name="chart" size="48px" />
            <span>买方国家/地区分布（饼图）</span>
          </div>
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
import { ref, onMounted } from 'vue'
import StatCard from '@/components/common/StatCard.vue'

const dateRange = ref([])
const tableData = ref([])

const columns = [
  { colKey: 'month', title: '月份', width: 100 },
  { colKey: 'count', title: '投保数量', align: 'center' },
  { colKey: 'coverageAmount', title: '投保金额', align: 'right' },
  { colKey: 'approvedCount', title: '审批通过数', align: 'center' },
  { colKey: 'approvalRate', title: '通过率', align: 'center' },
  { colKey: 'avgDays', title: '平均处理天数', align: 'center' }
]

onMounted(() => {
  tableData.value = [
    { id: 1, month: '2026-01', count: 38, coverageAmount: 1850000, approvedCount: 35, approvalRate: '92.1%', avgDays: 14.2 },
    { id: 2, month: '2026-02', count: 35, coverageAmount: 1680000, approvedCount: 33, approvalRate: '94.3%', avgDays: 12.8 },
    { id: 3, month: '2026-03', count: 42, coverageAmount: 2100000, approvedCount: 39, approvalRate: '92.9%', avgDays: 13.5 },
    { id: 4, month: '2026-04', count: 48, coverageAmount: 2350000, approvedCount: 45, approvalRate: '93.8%', avgDays: 11.9 },
    { id: 5, month: '2026-05', count: 45, coverageAmount: 2350000, approvedCount: 42, approvalRate: '93.3%', avgDays: 12.5 }
  ]
})
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.page-actions { display: flex; gap: 12px; }
.mb-16 { margin-bottom: 16px; }
.chart-placeholder { height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #999; }
</style>
