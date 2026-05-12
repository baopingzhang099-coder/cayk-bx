<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">保单信息管理</div>
      <div class="page-actions">
        <t-button theme="primary" @click="handleAdd">新增保单</t-button>
      </div>
    </div>

    <search-filter
      :status-options="statusOptions"
      @search="handleSearch"
      @reset="handleReset"
    >
      <template #actions>
        <t-button theme="primary" @click="handleExport">导出</t-button>
      </template>
    </search-filter>

    <div class="stats-grid mb-24">
      <stat-card title="有效保单" :value="activePolicyCount" icon="file" color="success" />
      <stat-card title="本月新增" :value="store.policies.length" icon="add" color="primary" />
      <stat-card title="即将到期" :value="expiringPolicyCount" icon="time" color="warning" />
      <stat-card title="已用额度" :value="`$${usedQuotaSum.toLocaleString()}`" icon="credit-card" color="danger" />
    </div>

    <data-table
      :data="tableData"
      :columns="columns"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      @page-change="handlePageChange"
    >
      <template #status="{ row }">
        <status-tag :status="row.status" :status-map="statusMap" />
      </template>
      <template #operation="{ row }">
        <t-space>
          <t-link @click="handleView(row)">查看</t-link>
          <t-link @click="handleEdit(row)">编辑</t-link>
          <t-link @click="handleChange(row)">变更</t-link>
        </t-space>
      </template>
    </data-table>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
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
  { value: 'pending_effect', label: '待生效' },
  { value: 'expiring', label: '即将到期' },
  { value: 'expired', label: '已到期' },
  { value: 'suspended', label: '中止' },
  { value: 'cancelled', label: '退保' },
  { value: 'terminated', label: '终止' }
]

const statusMap = {
  pending_effect: '待生效',
  active: '有效',
  expiring: '即将到期',
  expired: '已到期',
  suspended: '中止',
  cancelled: '退保',
  terminated: '终止'
}

const columns = [
  { colKey: 'policyNo', title: '保单号', width: 140 },
  { colKey: 'insuranceCompany', title: '保险公司' },
  { colKey: 'policyholder', title: '被保险人', ellipsis: true },
  { colKey: 'insured', title: '投保买方' },
  { colKey: 'coverageAmount', title: '保险金额', align: 'right' },
  { colKey: 'effectiveDate', title: '生效日期', width: 120 },
  { colKey: 'expiryDate', title: '到期日期', width: 120 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 140, fixed: 'right', slot: 'operation' }
]

const pagination = reactive({
  total: 0,
  current: 1,
  pageSize: 20
})

const filteredData = computed(() => {
  const list = store.policies || []
  const p = searchParams.value
  return list.filter((it) => {
    if (p.enterpriseName && !String(it.policyholder || '').includes(p.enterpriseName)) return false
    if (p.buyerName && !String(it.insured || '').includes(p.buyerName)) return false
    if (p.status && it.status !== p.status) return false
    return true
  })
})

const tableData = computed(() => {
  pagination.total = filteredData.value.length
  const start = (pagination.current - 1) * pagination.pageSize
  return filteredData.value.slice(start, start + pagination.pageSize)
})

const activePolicyCount = computed(() => (store.policies || []).filter(p => p.status === 'active').length)
const expiringPolicyCount = computed(() => (store.policies || []).filter(p => p.status === 'expiring').length)
const usedQuotaSum = computed(() => (store.policies || []).reduce((sum, p) => sum + (Number(p.usedQuota) || 0), 0))

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

const handleChange = (row) => {
  console.log('change:', row)
}

const handleExport = () => {
  console.log('export')
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
