<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">理赔信息管理</div>
      <div class="page-actions">
        <t-button theme="primary" @click="handleAdd">新建理赔</t-button>
      </div>
    </div>

    <search-filter
      :status-options="statusOptions"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="stats-grid mb-24">
      <stat-card title="本月理赔" :value="12" icon="first-aid-kit" color="primary" />
      <stat-card title="理赔金额" value="$456,000" icon="money" color="warning" />
      <stat-card title="完结率" value="75%" icon="check-circle" color="success" />
      <stat-card title="待处理" :value="7" icon="time" color="danger" />
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
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'investigating', label: '调查中' },
  { value: 'decided', label: '已决定' },
  { value: 'completed', label: '已结案' }
]

const statusMap = {
  pending: '待处理',
  processing: '处理中',
  investigating: '调查中',
  decided: '已决定',
  completed: '已结案',
  rejected: '已拒赔'
}

const columns = [
  { colKey: 'claimNo', title: '理赔单号', width: 140 },
  { colKey: 'relatedPolicyNo', title: '保单号' },
  { colKey: 'buyerName', title: '买方' },
  { colKey: 'claimType', title: '报案类型' },
  { colKey: 'estimatedLossAmount', title: '预估金额', align: 'right' },
  { colKey: 'claimAmount', title: '实际赔付', align: 'right' },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'createTime', title: '报案时间', width: 160 },
  { colKey: 'operation', title: '操作', width: 120, fixed: 'right', slot: 'operation' }
]

const tableData = ref([])
const pagination = reactive({ total: 0, current: 1, pageSize: 20 })

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = [
      { id: 1, claimNo: 'CL20260508001', relatedPolicyNo: 'PI2026001234', buyerName: 'ABC Corporation', claimType: '货物损失', estimatedLossAmount: 50000, claimAmount: null, status: 'processing', createTime: '2026-05-08 10:00:00' },
      { id: 2, claimNo: 'CL20260506002', relatedPolicyNo: 'PI2026001235', buyerName: 'DEF GmbH', claimType: '买方违约', estimatedLossAmount: 30000, claimAmount: 30000, status: 'completed', createTime: '2026-05-06 14:30:00' },
      { id: 3, claimNo: 'CL20260505003', relatedPolicyNo: 'PI2025000987', buyerName: 'GHI Ltd', claimType: '货物损失', estimatedLossAmount: 80000, claimAmount: null, status: 'investigating', createTime: '2026-05-05 09:15:00' },
      { id: 4, claimNo: 'CL20260503004', relatedPolicyNo: 'PI2025000765', buyerName: 'JKL Co', claimType: '其他', estimatedLossAmount: 20000, claimAmount: null, status: 'pending', createTime: '2026-05-03 16:45:00' }
    ]
    pagination.total = 4
    loading.value = false
  }, 500)
}

const handleSearch = () => fetchData()
const handleReset = () => fetchData()
const handlePageChange = () => fetchData()
const handleAdd = () => console.log('add')
const handleView = (row) => console.log('view:', row)
const handleEdit = (row) => console.log('edit:', row)

onMounted(() => fetchData())
</script>

<style lang="scss" scoped>
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
</style>
