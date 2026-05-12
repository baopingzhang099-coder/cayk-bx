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
        <span>超时预警：3 笔</span>
        <span style="margin-left: 24px;">即将到期（3天内）：5 笔</span>
        <span style="margin-left: 24px;">正常：45 笔</span>
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
import { ref, reactive, onMounted } from 'vue'
import SearchFilter from '@/components/common/SearchFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'

const loading = ref(false)

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
  { colKey: 'declarationType', title: '申报类型' },
  { colKey: 'deadline', title: '申报期限', width: 120 },
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
      { id: 1, declarationNo: 'SD20260510001', buyerName: 'ABC Corporation', shipmentDate: '2026-05-10', shipmentAmount: 50000, destinationPort: 'New York, USA', declarationType: '逐笔申报', deadline: '2026-05-25', status: 'declared' },
      { id: 2, declarationNo: 'SD20260508002', buyerName: 'DEF GmbH', shipmentDate: '2026-05-08', shipmentAmount: 30000, destinationPort: 'Hamburg, Germany', declarationType: '逐笔申报', deadline: '2026-05-23', status: 'timeout_warning' },
      { id: 3, declarationNo: 'SD20260505003', buyerName: 'GHI Ltd', shipmentDate: '2026-05-05', shipmentAmount: 80000, destinationPort: 'London, UK', declarationType: '月度汇总', deadline: '2026-05-15', status: 'pending_declare' },
      { id: 4, declarationNo: 'SD20260501004', buyerName: 'JKL Co', shipmentDate: '2026-05-01', shipmentAmount: 45000, destinationPort: 'Tokyo, Japan', declarationType: '逐笔申报', deadline: '2026-05-16', status: 'completed' }
    ]
    pagination.total = 4
    loading.value = false
  }, 500)
}

const handleSearch = (params) => { fetchData() }
const handleReset = () => { fetchData() }
const handlePageChange = (pageInfo) => { fetchData() }
const handleAdd = () => { console.log('add') }
const handleView = (row) => { console.log('view:', row) }
const handleEdit = (row) => { console.log('edit:', row) }

onMounted(() => { fetchData() })
</script>

<style lang="scss" scoped>
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
</style>
