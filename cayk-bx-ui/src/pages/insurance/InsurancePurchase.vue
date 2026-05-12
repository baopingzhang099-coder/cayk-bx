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
        <t-form-item label="买方国别">
          <t-select v-model="searchParams.buyerCountry" placeholder="请选择买方国别" clearable filterable>
            <t-option v-for="item in countryOptions" :key="item.value" :value="item.value" :label="item.label" />
          </t-select>
        </t-form-item>
        <t-form-item label="状态">
          <t-select v-model="searchParams.status" placeholder="请选择状态" clearable>
            <t-option v-for="item in statusOptions" :key="item.value" :value="item.value" :label="item.label" />
          </t-select>
        </t-form-item>
        <t-form-item label="投保机构类型">
          <t-select v-model="searchParams.preferredInsuranceOrgType" placeholder="请选择" clearable>
            <t-option value="政策性保险机构" label="政策性保险机构" />
            <t-option value="商业性保险机构" label="商业性保险机构" />
            <t-option value="无偏好" label="无偏好" />
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
          {{ row.insuranceCurrency || 'USD' }}{{ Number(row.insuranceAmount || 0).toLocaleString() }}
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
  buyerCountry: '',
  status: '',
  preferredInsuranceOrgType: '',
  dateRange: []
})

const countryOptions = [
  { value: '美国', label: '美国' },
  { value: '德国', label: '德国' },
  { value: '日本', label: '日本' },
  { value: '英国', label: '英国' },
  { value: '法国', label: '法国' },
  { value: '加拿大', label: '加拿大' },
  { value: '澳大利亚', label: '澳大利亚' },
  { value: '韩国', label: '韩国' },
  { value: '新加坡', label: '新加坡' },
  { value: '荷兰', label: '荷兰' },
  { value: '意大利', label: '意大利' },
  { value: '西班牙', label: '西班牙' },
  { value: '巴西', label: '巴西' },
  { value: '印度', label: '印度' },
  { value: '越南', label: '越南' },
  { value: '印度尼西亚', label: '印度尼西亚' },
  { value: '泰国', label: '泰国' },
  { value: '马来西亚', label: '马来西亚' },
  { value: '俄罗斯', label: '俄罗斯' },
  { value: '墨西哥', label: '墨西哥' }
]

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
  { colKey: 'buyerCountry', title: '买方国别', width: 100 },
  { colKey: 'insuranceType', title: '投保类型', width: 120 },
  { colKey: 'preferredInsuranceOrgType', title: '机构类型', width: 120 },
  { colKey: 'insuranceAmount', title: '投保金额', align: 'right', width: 130 },
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
    if (searchParams.buyerCountry && it.buyerCountry !== searchParams.buyerCountry) return false
    if (searchParams.status && it.status !== searchParams.status) return false
    if (searchParams.preferredInsuranceOrgType && it.preferredInsuranceOrgType !== searchParams.preferredInsuranceOrgType) return false
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
const handleReset = () => { searchParams.enterpriseName = ''; searchParams.buyerName = ''; searchParams.buyerCountry = ''; searchParams.status = ''; searchParams.preferredInsuranceOrgType = ''; searchParams.dateRange = []; pagination.current = 1 }
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
