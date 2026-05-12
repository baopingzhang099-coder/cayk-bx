<template>
  <div class="page-container">
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
          <div class="chart-placeholder">
            <t-icon name="chart" size="48px" />
            <span>理赔案件数量趋势（折线图）</span>
          </div>
        </t-card>
      </t-col>
      <t-col :span="12">
        <t-card title="理赔金额趋势图" class="mb-16">
          <div class="chart-placeholder">
            <t-icon name="chart" size="48px" />
            <span>理赔金额趋势（柱状图）</span>
          </div>
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
import { ref } from 'vue'
import StatCard from '@/components/common/StatCard.vue'

const dateRange = ref([])
const tableData = ref([
  { id: 1, month: '2026-01', caseCount: 8, claimAmount: 320000, closedCount: 6, closedRate: '75%' },
  { id: 2, month: '2026-02', caseCount: 10, claimAmount: 450000, closedCount: 8, closedRate: '80%' },
  { id: 3, month: '2026-03', caseCount: 15, claimAmount: 580000, closedCount: 12, closedRate: '80%' },
  { id: 4, month: '2026-04', caseCount: 12, claimAmount: 420000, closedCount: 10, closedRate: '83%' },
  { id: 5, month: '2026-05', caseCount: 12, claimAmount: 456000, closedCount: 9, closedRate: '75%' }
])

const columns = [
  { colKey: 'month', title: '月份', width: 100 },
  { colKey: 'caseCount', title: '理赔案件', align: 'center' },
  { colKey: 'claimAmount', title: '理赔金额', align: 'right' },
  { colKey: 'closedCount', title: '已结案', align: 'center' },
  { colKey: 'closedRate', title: '结案率', align: 'center' }
]
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.page-actions { display: flex; gap: 12px; }
.mb-16 { margin-bottom: 16px; }
.chart-placeholder { height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #999; }
</style>
