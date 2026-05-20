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
import { computed, onMounted, ref } from 'vue'
import StatCard from '@/components/common/StatCard.vue'
import { useBusinessStore } from '@/stores/business'

const dateRange = ref([])
const store = useBusinessStore()
const kpis = computed(() => store.businessKpis)

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

onMounted(() => store.ensureSeeded())
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.page-actions { display: flex; gap: 12px; }
.mb-16 { margin-bottom: 16px; }
.chart-placeholder { height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #999; }
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>
