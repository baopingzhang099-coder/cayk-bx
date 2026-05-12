<template>
  <div class="page-container">
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
        <stat-card title="本月投保" :value="45" icon="document" color="primary" :trend="12" suffix="份" />
      </t-col>
      <t-col :span="6">
        <stat-card title="申请限额" :value="32" icon="protect" color="success" :trend="8" suffix="笔" />
      </t-col>
      <t-col :span="6">
        <stat-card title="申报出运" :value="78" icon="airplane" color="primary" :trend="5" suffix="笔" />
      </t-col>
      <t-col :span="6">
        <stat-card title="理赔案件" :value="12" icon="first-aid-kit" color="warning" :trend="-3" suffix="件" />
      </t-col>
    </t-row>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="6">
        <stat-card title="投保金额" value="$2,350,000" icon="money" color="success" />
      </t-col>
      <t-col :span="6">
        <stat-card title="审批通过" :value="28" icon="check-circle" color="success" suffix="笔" />
      </t-col>
      <t-col :span="6">
        <stat-card title="申报及时率" value="95.5%" icon="chart" color="primary" />
      </t-col>
      <t-col :span="6">
        <stat-card title="赔付金额" value="$456,000" icon="alert" color="danger" />
      </t-col>
    </t-row>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="12">
        <t-card title="投保趋势图">
          <div class="chart-placeholder">
            <t-icon name="chart" size="48px" />
            <span>投保数量趋势（折线图）</span>
          </div>
        </t-card>
      </t-col>
      <t-col :span="12">
        <t-card title="出运走势图">
          <div class="chart-placeholder">
            <t-icon name="chart" size="48px" />
            <span>出运金额趋势（柱状图）</span>
          </div>
        </t-card>
      </t-col>
    </t-row>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="12">
        <t-card title="买方地区分布">
          <div class="chart-placeholder">
            <t-icon name="chart" size="48px" />
            <span>买方国家/地区分布（饼图）</span>
          </div>
        </t-card>
      </t-col>
      <t-col :span="12">
        <t-card title="保险方案占比">
          <div class="chart-placeholder">
            <t-icon name="chart" size="48px" />
            <span>方案A/B/C占比（饼图）</span>
          </div>
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
import { ref } from 'vue'
import StatCard from '@/components/common/StatCard.vue'

const dateRange = ref([])

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

const tableData = ref([
  { id: 1, month: '2026-01', insuranceCount: 38, coverageAmount: 1850000, limitCount: 28, shipmentCount: 65, shipmentAmount: 1650000, claimCount: 8, claimAmount: 320000 },
  { id: 2, month: '2026-02', insuranceCount: 35, coverageAmount: 1680000, limitCount: 25, shipmentCount: 58, shipmentAmount: 1480000, claimCount: 10, claimAmount: 450000 },
  { id: 3, month: '2026-03', insuranceCount: 42, coverageAmount: 2100000, limitCount: 30, shipmentCount: 72, shipmentAmount: 1780000, claimCount: 15, claimAmount: 580000 },
  { id: 4, month: '2026-04', insuranceCount: 48, coverageAmount: 2350000, limitCount: 35, shipmentCount: 85, shipmentAmount: 2100000, claimCount: 12, claimAmount: 420000 },
  { id: 5, month: '2026-05', insuranceCount: 45, coverageAmount: 2350000, limitCount: 32, shipmentCount: 78, shipmentAmount: 1890000, claimCount: 12, claimAmount: 456000 }
])
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.page-actions { display: flex; gap: 12px; }
.mb-16 { margin-bottom: 16px; }
.chart-placeholder { height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #999; }
</style>
