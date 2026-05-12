<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">出运申报管理</div>
      <div class="page-actions">
        <t-button theme="primary" @click="handleAdd">新建申报</t-button>
      </div>
    </div>

    <search-filter
      :status-options="statusOptions"
      @search="handleSearch"
      @reset="handleReset"
    />

    <t-alert theme="warning" class="mb-16">
      <template #message>
        <span>超时预警：{{ overdueCount }} 笔</span>
        <span style="margin-left: 24px;">即将到期（3天内）：{{ dueSoonCount }} 笔</span>
        <span style="margin-left: 24px;">正常：{{ normalCount }} 笔</span>
      </template>
    </t-alert>

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
import { useBusinessStore } from '@/stores/business'

const store = useBusinessStore()
const loading = computed(() => false)
const searchParams = ref({ enterpriseName: '', buyerName: '', status: '', dateRange: [] })

const statusOptions = [
  { value: 'pending_declare', label: '待申报' },
  { value: 'declaring', label: '申报中' },
  { value: 'declared', label: '已申报' },
  { value: 'timeout_warning', label: '超时预警' },
  { value: 'pending_premium', label: '待支付保费' },
  { value: 'completed', label: '已完成' }
]

const statusMap = {
  pending_declare: '待申报',
  declaring: '申报中',
  declared: '已申报',
  timeout_warning: '超时预警',
  premium_calculating: '保费计算中',
  pending_premium: '待支付保费',
  completed: '已完成'
}

const columns = [
  { colKey: 'declarationNo', title: '申报单号', width: 140 },
  { colKey: 'buyerName', title: '买方' },
  { colKey: 'shipmentDate', title: '出运日期', width: 120 },
  { colKey: 'shipmentAmount', title: '出运金额', align: 'right' },
  { colKey: 'destinationPort', title: '目的港' },
  { colKey: 'declarationTypeName', title: '申报类型' },
  { colKey: 'deadline', title: '申报期限', width: 120 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 120, fixed: 'right', slot: 'operation' }
]

const pagination = reactive({
  total: 0,
  current: 1,
  pageSize: 20
})

const filteredData = computed(() => {
  const list = store.shipments || []
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

const overdueCount = computed(() => {
  const today = new Date()
  return (store.shipments || []).filter((it) => {
    if (!it.deadline) return false
    return new Date(it.deadline) < today && it.status !== 'declared'
  }).length
})

const dueSoonCount = computed(() => {
  const today = new Date()
  const in3d = new Date()
  in3d.setDate(in3d.getDate() + 3)
  return (store.shipments || []).filter((it) => {
    if (!it.deadline) return false
    const d = new Date(it.deadline)
    return d >= today && d <= in3d && it.status !== 'declared'
  }).length
})

const normalCount = computed(() => (store.shipments || []).length - overdueCount.value - dueSoonCount.value)

const handleSearch = (params) => { searchParams.value = params; pagination.current = 1 }
const handleReset = () => { searchParams.value = { enterpriseName: '', buyerName: '', status: '', dateRange: [] }; pagination.current = 1 }
const handlePageChange = (pageInfo) => { pagination.current = pageInfo.current; pagination.pageSize = pageInfo.pageSize }
const handleAdd = () => { console.log('add') }
const handleView = (row) => { console.log('view:', row) }
const handleEdit = (row) => { console.log('edit:', row) }

onMounted(() => { store.ensureSeeded() })
</script>

<style lang="scss" scoped>
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
</style>
