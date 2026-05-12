<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">跟单员信息</div>
      <div class="page-actions">
        <t-button theme="primary" @click="handleAdd">新增跟单员</t-button>
      </div>
    </div>

    <search-filter
      :status-options="statusOptions"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="stats-grid mb-24">
      <stat-card title="总人数" :value="15" icon="person" color="primary" />
      <stat-card title="在职" :value="12" icon="check-circle" color="success" />
      <stat-card title="待考核" :value="3" icon="time" color="warning" />
      <stat-card title="本月业绩冠军" value="李明 42单" icon="trophy" color="danger" />
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
          <t-link @click="handlePermission(row)">权限</t-link>
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
  { value: 'active', label: '在职' },
  { value: 'inactive', label: '离职' },
  { value: 'probation', label: '待考核' }
]

const statusMap = {
  active: '在职',
  inactive: '离职',
  probation: '待考核'
}

const columns = [
  { colKey: 'workNo', title: '工号', width: 100 },
  { colKey: 'name', title: '姓名' },
  { colKey: 'department', title: '部门' },
  { colKey: 'phone', title: '联系电话', width: 130 },
  { colKey: 'email', title: '邮箱' },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'customerCount', title: '负责客户', width: 100, align: 'center' },
  { colKey: 'operation', title: '操作', width: 160, fixed: 'right', slot: 'operation' }
]

const tableData = ref([])
const pagination = reactive({ total: 0, current: 1, pageSize: 20 })

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = [
      { id: 1, workNo: 'C001', name: '李明', department: '业务部', phone: '138****1234', email: 'liming@cayk.com', status: 'active', customerCount: 8 },
      { id: 2, workNo: 'C002', name: '王芳', department: '业务部', phone: '139****5678', email: 'wangfang@cayk.com', status: 'active', customerCount: 6 },
      { id: 3, workNo: 'C003', name: '张伟', department: '客服部', phone: '137****9012', email: 'zhangwei@cayk.com', status: 'probation', customerCount: 5 },
      { id: 4, workNo: 'C004', name: '陈静', department: '业务部', phone: '136****3456', email: 'chenjing@cayk.com', status: 'active', customerCount: 7 }
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
const handlePermission = (row) => console.log('permission:', row)

onMounted(() => fetchData())
</script>

<style lang="scss" scoped>
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
</style>
