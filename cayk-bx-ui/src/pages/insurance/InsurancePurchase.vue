<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">投保信息管理</div>
      <div class="page-actions">
        <t-button theme="primary" @click="handleAdd">
          <template #icon><t-icon name="add" /></template>
          新增投保
        </t-button>
      </div>
    </div>

    <t-card class="search-card">
      <t-form layout="inline">
        <t-form-item label="企业名称">
          <t-input v-model="searchParams.enterpriseName" placeholder="请输入企业名称" clearable />
        </t-form-item>
        <t-form-item label="买方名称">
          <t-input v-model="searchParams.buyerName" placeholder="请输入买方名称" clearable />
        </t-form-item>
        <t-form-item label="状态">
          <t-select v-model="searchParams.status" placeholder="请选择状态" clearable>
            <t-option v-for="item in statusOptions" :key="item.value" :value="item.value" :label="item.label" />
          </t-select>
        </t-form-item>
        <t-form-item label="申请日期">
          <t-date-range-picker v-model="searchParams.dateRange" />
        </t-form-item>
        <t-form-item>
          <t-space>
            <t-button theme="primary" @click="handleSearch">查询</t-button>
            <t-button variant="outline" @click="handleReset">重置</t-button>
          </t-space>
        </t-form-item>
      </t-form>
      <div class="search-actions">
        <t-button variant="outline" @click="handleExport">
          <template #icon><t-icon name="download" /></template>
          导出
        </t-button>
      </div>
    </t-card>

    <div class="stats-grid mb-16">
      <stat-card title="待提交" :value="insuranceStats.pending_submit" icon="send" color="warning" />
      <stat-card title="资信调查中" :value="insuranceStats.credit_investigating" icon="search" color="primary" />
      <stat-card title="已完成" :value="insuranceStats.completed" icon="check-circle" color="success" />
      <stat-card title="草稿" :value="insuranceStats.draft" icon="edit" color="danger" />
    </div>

    <t-card>
      <div class="table-header">
        <span class="table-title">投保信息列表</span>
        <span class="table-count">共 {{ pagination.total }} 条记录</span>
      </div>
      <t-table
        :data="tableData"
        :columns="columns"
        :loading="loading"
        :pagination="paginationConfig"
        row-key="id"
        hover
        stripe
        @page-change="handlePageChange"
      >
        <template #status="{ row }">
          <status-tag :status="row.status" :status-map="statusMap" />
        </template>
        <template #coverageAmount="{ row }">
          ¥{{ row.coverageAmount.toLocaleString() }}
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-link @click="handleView(row)">查看</t-link>
            <t-link @click="handleEdit(row)">编辑</t-link>
            <t-link v-if="row.status === 'pending_submit' || row.status === 'draft'" theme="warning" @click="handleSubmit(row)">提交</t-link>
            <t-link v-if="row.status === 'credit_investigating'" theme="success" @click="handleApprove(row)">模拟通过</t-link>
            <t-link v-if="row.status === 'draft'" theme="danger" @click="handleDelete(row)">删除</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import { useBusinessStore } from '@/stores/business'

const router = useRouter()
const store = useBusinessStore()
const loading = computed(() => false)

const searchParams = reactive({
  enterpriseName: '',
  buyerName: '',
  status: '',
  dateRange: []
})

const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'pending_material', label: '待补充资料' },
  { value: 'pending_submit', label: '待提交' },
  { value: 'credit_investigating', label: '资信调查中' },
  { value: 'limit_approving', label: '限额审批中' },
  { value: 'underwriting', label: '核保中' },
  { value: 'pending_payment', label: '待支付' },
  { value: 'completed', label: '已完成' },
  { value: 'rejected', label: '已拒绝' }
]

const statusMap = {
  draft: '草稿',
  pending_material: '待补充资料',
  pending_submit: '待提交',
  credit_investigating: '资信调查中',
  limit_approving: '限额审批中',
  underwriting: '核保中',
  pending_payment: '待支付',
  completed: '已完成',
  rejected: '已拒绝'
}

const columns = [
  { colKey: 'id', title: '投保编号', width: 130 },
  { colKey: 'enterpriseName', title: '企业名称', ellipsis: true },
  { colKey: 'buyerName', title: '买方名称', ellipsis: true },
  { colKey: 'insuranceScheme', title: '投保方案' },
  { colKey: 'coverageAmount', title: '投保金额', align: 'right', width: 130 },
  { colKey: 'status', title: '状态', width: 110, slot: 'status' },
  { colKey: 'createTime', title: '申请日期', width: 120 },
  { colKey: 'operation', title: '操作', width: 220, fixed: 'right', slot: 'operation' }
]

const insuranceStats = computed(() => store.insuranceStats)

const filteredData = computed(() => {
  const list = store.insuranceApplications || []
  return list.filter((it) => {
    if (searchParams.enterpriseName && !String(it.enterpriseName || '').includes(searchParams.enterpriseName)) return false
    if (searchParams.buyerName && !String(it.buyerName || '').includes(searchParams.buyerName)) return false
    if (searchParams.status && it.status !== searchParams.status) return false
    return true
  })
})

const pagination = reactive({
  total: 0,
  current: 1,
  pageSize: 20
})

const tableData = computed(() => {
  pagination.total = filteredData.value.length
  const start = (pagination.current - 1) * pagination.pageSize
  return filteredData.value.slice(start, start + pagination.pageSize)
})

const paginationConfig = computed(() => ({
  theme: 'simple',
  ...pagination
}))

const handleSearch = () => { pagination.current = 1 }
const handleReset = () => { searchParams.enterpriseName = ''; searchParams.buyerName = ''; searchParams.status = ''; searchParams.dateRange = []; pagination.current = 1 }
const handlePageChange = (pageInfo) => { pagination.current = pageInfo.current; pagination.pageSize = pageInfo.pageSize }
const handleExport = () => { console.log('export') }

const handleAdd = () => { router.push('/insurance/purchase/new') }
const handleView = (row) => { router.push(`/insurance/purchase/${row.id}`) }
const handleEdit = (row) => { router.push(`/insurance/purchase/${row.id}/edit`) }
const handleSubmit = (row) => {
  const res = store.submitInsuranceApplication(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '提交失败')
    return
  }
  MessagePlugin.success('提交成功，已进入资信调查')
}
const handleApprove = (row) => {
  const res = store.approveInsuranceApplication(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '操作失败')
    return
  }
  MessagePlugin.success('已模拟通过，已生成保单与信用限额')
  router.push('/policy/list')
}
const handleDelete = (row) => { store.insuranceApplications = store.insuranceApplications.filter(it => it.id !== row.id) }

onMounted(() => { store.ensureSeeded() })
</script>

<style lang="scss" scoped>
.page-container { }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.search-card { margin-bottom: 16px; :deep(.t-card__body) { display: flex; justify-content: space-between; align-items: flex-end; } }
.search-actions { display: flex; gap: 8px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.table-title { font-size: 16px; font-weight: 600; color: #333; }
.table-count { font-size: 14px; color: #999; }
.mb-16 { margin-bottom: 16px; }
.detail-container { padding: 0 16px; }
</style>
