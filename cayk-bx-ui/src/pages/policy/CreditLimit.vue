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
      <stat-card title="有效限额" :value="activeCount" icon="protect" color="success" />
      <stat-card title="审批中" :value="pendingCount" icon="loading" color="warning" />
      <stat-card title="额度总额" :value="`$${appliedSum.toLocaleString()}`" icon="wallet" color="primary" />
      <stat-card title="已用额度" :value="`$${usedSum.toLocaleString()}`" icon="credit-card" color="danger" />
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
import { computed, onMounted, reactive, ref } from 'vue'
import SearchFilter from '@/components/common/SearchFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import { useBusinessStore } from '@/stores/business'

const store = useBusinessStore()
const loading = computed(() => false)
const searchParams = ref({ enterpriseName: '', buyerName: '', status: '', dateRange: [] })

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

const pagination = reactive({
  total: 0,
  current: 1,
  pageSize: 20
})

const filteredData = computed(() => {
  const list = store.creditLimits || []
  const p = searchParams.value
  return list.filter((it) => {
    if (p.buyerName && !String(it.buyerName || '').includes(p.buyerName)) return false
    if (p.status && it.status !== p.status) return false
    return true
  })
})

const tableData = computed(() => {
  pagination.total = filteredData.value.length
  const start = (pagination.current - 1) * pagination.pageSize
  return filteredData.value.slice(start, start + pagination.pageSize)
})

const activeCount = computed(() => (store.creditLimits || []).filter(it => it.status === 'active').length)
const pendingCount = computed(() => (store.creditLimits || []).filter(it => it.status === 'pending').length)
const appliedSum = computed(() => (store.creditLimits || []).reduce((sum, it) => sum + (Number(it.appliedLimit) || 0), 0))
const usedSum = computed(() => (store.creditLimits || []).reduce((sum, it) => sum + (Number(it.usedLimit) || 0), 0))

const handleSearch = (params) => {
  searchParams.value = params
  pagination.current = 1
}

const handleReset = () => {
  searchParams.value = { enterpriseName: '', buyerName: '', status: '', dateRange: [] }
  pagination.current = 1
}

const handlePageChange = (pageInfo) => {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
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
  store.ensureSeeded()
})
</script>

<style lang="scss" scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
</style>
