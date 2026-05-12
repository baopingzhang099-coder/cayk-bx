<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">信用限额管理</div>
      <div class="page-actions">
        <t-button theme="primary" @click="handleAdd">申请限额</t-button>
      </div>
    </div>

    <search-filter
      :status-options="statusOptions"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="stats-grid mb-24">
      <stat-card title="有效限额" :value="15" icon="protect" color="success" />
      <stat-card title="审批中" :value="3" icon="loading" color="warning" />
      <stat-card title="额度总额" value="$5,000,000" icon="wallet" color="primary" />
      <stat-card title="已用额度" value="$3,450,000" icon="credit-card" color="danger" />
    </div>

    <data-table
      :data="tableData"
      :columns="columns"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      @page-change="handlePageChange"
    >
      <template #usageRate="{ row }">
        <t-progress :percentage="row.usageRate" :color="row.usageRate > 80 ? '#E34D57' : '#0052D9'" />
      </template>
      <template #status="{ row }">
        <status-tag :status="row.status" :status-map="statusMap" />
      </template>
      <template #operation="{ row }">
        <t-space>
          <t-link @click="handleView(row)">查看</t-link>
          <t-link @click="handleEdit(row)">编辑</t-link>
        </t-space>
      </template>
    </data-table>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import SearchFilter from '@/components/common/SearchFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'

const loading = ref(false)

const statusOptions = [
  { value: 'active', label: '有效' },
  { value: 'pending', label: '审批中' },
  { value: 'expired', label: '已到期' },
  { value: 'exhausted', label: '额度用尽' }
]

const statusMap = {
  active: '有效',
  pending: '审批中',
  expired: '已到期',
  exhausted: '额度用尽'
}

const columns = [
  { colKey: 'buyerName', title: '买方名称', ellipsis: true },
  { colKey: 'appliedLimit', title: '申请额度', align: 'right' },
  { colKey: 'usedLimit', title: '已用额度', align: 'right' },
  { colKey: 'remainingLimit', title: '剩余额度', align: 'right' },
  { colKey: 'usageRate', title: '使用率', width: 150, slot: 'usageRate' },
  { colKey: 'effectiveDate', title: '生效日期', width: 120 },
  { colKey: 'expiryDate', title: '到期日期', width: 120 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 120, fixed: 'right', slot: 'operation' }
]

const tableData = ref([])
const pagination = reactive({
  total: 0,
  current: 1,
  pageSize: 20
})

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = [
      { id: 1, buyerName: 'ABC Corporation', appliedLimit: 500000, usedLimit: 320000, remainingLimit: 180000, usageRate: 64, effectiveDate: '2026-02-01', expiryDate: '2027-01-31', status: 'active' },
      { id: 2, buyerName: 'DEF GmbH', appliedLimit: 300000, usedLimit: 150000, remainingLimit: 150000, usageRate: 50, effectiveDate: '2026-03-01', expiryDate: '2027-02-28', status: 'active' },
      { id: 3, buyerName: 'GHI Ltd', appliedLimit: 200000, usedLimit: 200000, remainingLimit: 0, usageRate: 100, effectiveDate: '2026-01-01', expiryDate: '2026-12-31', status: 'exhausted' },
      { id: 4, buyerName: 'JKL Co', appliedLimit: 400000, usedLimit: 280000, remainingLimit: 120000, usageRate: 70, effectiveDate: '2026-04-01', expiryDate: '2027-03-31', status: 'active' }
    ]
    pagination.total = 4
    loading.value = false
  }, 500)
}

const handleSearch = (params) => {
  console.log('search:', params)
  fetchData()
}

const handleReset = () => {
  fetchData()
}

const handlePageChange = (pageInfo) => {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  fetchData()
}

const handleAdd = () => {
  console.log('add')
}

const handleView = (row) => {
  console.log('view:', row)
}

const handleEdit = (row) => {
  console.log('edit:', row)
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
</style>
