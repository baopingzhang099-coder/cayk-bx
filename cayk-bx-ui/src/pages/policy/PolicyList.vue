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
      <stat-card title="有效保单" :value="28" icon="file" color="success" />
      <stat-card title="本月新增" :value="5" icon="add" color="primary" />
      <stat-card title="即将到期" :value="3" icon="time" color="warning" />
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
import { ref, reactive, onMounted } from 'vue'
import SearchFilter from '@/components/common/SearchFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'

const loading = ref(false)

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
      { id: 1, policyNo: 'PI2026001234', insuranceCompany: '人保财险', policyholder: '深圳XX国际贸易有限公司', insured: 'ABC Corporation', coverageAmount: 500000, effectiveDate: '2026-01-01', expiryDate: '2027-01-01', status: 'active' },
      { id: 2, policyNo: 'PI2026001235', insuranceCompany: '平安保险', policyholder: '上海YY进出口公司', insured: 'DEF GmbH', coverageAmount: 300000, effectiveDate: '2026-02-01', expiryDate: '2027-02-01', status: 'active' },
      { id: 3, policyNo: 'PI2025000987', insuranceCompany: '太平洋保险', policyholder: '北京ZZ贸易集团', insured: 'GHI Ltd', coverageAmount: 800000, effectiveDate: '2025-11-01', expiryDate: '2026-11-01', status: 'suspended' },
      { id: 4, policyNo: 'PI2025000765', insuranceCompany: '人保财险', policyholder: '广州AA实业公司', insured: 'JKL Co', coverageAmount: 600000, effectiveDate: '2025-10-01', expiryDate: '2026-10-01', status: 'expired' }
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

const handleChange = (row) => {
  console.log('change:', row)
}

const handleExport = () => {
  console.log('export')
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
