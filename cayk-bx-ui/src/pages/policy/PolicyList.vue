<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">投保信息管理</div>
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
      <stat-card title="审核通过" :value="activePolicyCount" icon="check-circle" color="success" />
      <stat-card title="待审核" :value="pendingReviewCount" icon="clock" color="warning" />
      <stat-card title="总申请数" :value="store.insuranceApplications.length" icon="file" color="primary" />
      <stat-card title="总投保金额" :value="`$${totalInsuranceAmount.toLocaleString()}`" icon="credit-card" color="danger" />
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
      <template #insuranceAmount="{ row }">
        <span>${{ Number(row.insuranceAmount || 0).toLocaleString() }}</span>
      </template>
      <template #expectedInsurancePeriod="{ row }">
        <span>{{ Array.isArray(row.expectedInsurancePeriod) ? row.expectedInsurancePeriod.join(' ~ ') : row.expectedInsurancePeriod }}</span>
      </template>
      <template #operation="{ row }">
        <t-space>
          <t-link @click="handleView(row)">查看</t-link>
          <t-link v-if="row.status === 'pending_review'" theme="success" @click="handleApprove(row)">审核</t-link>
          <t-link v-if="row.status === 'pending_review'" theme="danger" @click="handleReject(row)">驳回</t-link>
        </t-space>
      </template>
    </data-table>

    <t-dialog v-model:visible="detailVisible" header="投保详情" width="800px" :footer="false">
      <detail-panel title="基础信息" :columns="detailColumns" :data="currentRow || {}" />
      <detail-panel title="业务信息" :columns="businessColumns" :data="currentRow || {}" />
      <detail-panel title="投保需求" :columns="insuranceColumns" :data="currentRow || {}" />
    </t-dialog>

    <t-dialog v-model:visible="confirmVisible" :header="confirmTitle" width="480px">
      <div class="confirm-content">
        <p>{{ confirmContent }}</p>
        <div v-if="confirmRow" class="confirm-info">
          <div class="info-item">
            <span class="info-label">投保编号：</span>
            <span class="info-value">{{ confirmRow.id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">企业名称：</span>
            <span class="info-value">{{ confirmRow.companyName }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="confirmVisible = false">取消</t-button>
          <t-button theme="primary" @click="handleConfirm">确认{{ confirmButtonText }}</t-button>
        </t-space>
      </template>
    </t-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import SearchFilter from '@/components/common/SearchFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import DetailPanel from '@/components/common/DetailPanel.vue'
import { useBusinessStore } from '@/stores/business'

const store = useBusinessStore()
const loading = computed(() => false)
const searchParams = ref({ enterpriseName: '', buyerName: '', status: '', dateRange: [] })

const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'pending_review', label: '待审核' },
  { value: 'approved', label: '审核通过' },
  { value: 'rejected', label: '已驳回' }
]

const statusMap = {
  draft: '草稿',
  pending_review: '待审核',
  approved: '审核通过',
  rejected: '已驳回'
}

const columns = [
  { colKey: 'id', title: '投保编号', width: 120 },
  { colKey: 'companyName', title: '企业名称', ellipsis: true },
  { colKey: 'buyerName', title: '买方名称', ellipsis: true },
  { colKey: 'buyerCountry', title: '买方国别', width: 100 },
  { colKey: 'insuranceType', title: '投保类型', width: 140 },
  { colKey: 'insuranceAmount', title: '投保金额', align: 'right', width: 120, slot: 'insuranceAmount' },
  { colKey: 'expectedInsurancePeriod', title: '投保期限', width: 160, slot: 'expectedInsurancePeriod' },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 140, fixed: 'right', slot: 'operation' }
]

const pagination = reactive({
  total: 0,
  current: 1,
  pageSize: 20
})

const filteredData = computed(() => {
  const list = store.insuranceApplications || []
  const p = searchParams.value
  return list.filter((it) => {
    if (p.enterpriseName && !String(it.companyName || '').includes(p.enterpriseName)) return false
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

const activePolicyCount = computed(() => (store.insuranceApplications || []).filter(p => p.status === 'approved').length)
const pendingReviewCount = computed(() => (store.insuranceApplications || []).filter(p => p.status === 'pending_review').length)
const totalInsuranceAmount = computed(() => (store.insuranceApplications || []).reduce((sum, p) => sum + (Number(p.insuranceAmount) || 0), 0))

const detailVisible = ref(false)
const currentRow = ref(null)

const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmContent = ref('')
const confirmButtonText = ref('')
const confirmRow = ref(null)
const confirmAction = ref('')

const detailColumns = [
  { label: '投保编号', key: 'id' },
  { label: '企业名称', key: 'companyName' },
  { label: '统一社会信用代码', key: 'unifiedSocialCreditCode' },
  { label: '法定代表人', key: 'legalRepresentative' },
  { label: '联系人', key: 'contactName' },
  { label: '联系电话', key: 'contactPhone' }
]

const businessColumns = [
  { label: '买方名称', key: 'buyerName' },
  { label: '买方国别', key: 'buyerCountry' },
  { label: '合作年限', key: 'cooperationYearsWithBuyer' },
  { label: '主要出口行业', key: 'mainExportIndustry' },
  { label: '主要出口国家', key: 'exportMainCountries', formatter: (v) => Array.isArray(v) ? v.join('、') : v },
  { label: '支付方式', key: 'mainPaymentMethods' }
]

const insuranceColumns = [
  { label: '投保类型', key: 'insuranceType' },
  { label: '投保金额', key: 'insuranceAmount', formatter: (v) => `$${Number(v).toLocaleString()}` },
  { label: '投保期限', key: 'expectedInsurancePeriod', formatter: (v) => Array.isArray(v) ? v.join(' ~ ') : v },
  { label: '申请日期', key: 'createTime' },
  { label: '状态', key: 'status', formatter: (v) => statusMap[v] || v },
  { label: '驳回原因', key: 'rejectReason' }
]

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

const handleView = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

const handleApprove = (row) => {
  confirmTitle.value = '审核通过'
  confirmContent.value = '确认审核通过此投保申请？'
  confirmButtonText.value = '通过'
  confirmRow.value = row
  confirmAction.value = 'approve'
  confirmVisible.value = true
}

const handleReject = (row) => {
  confirmTitle.value = '确认驳回'
  confirmContent.value = '请确认是否驳回此申请，驳回后客户可重新编辑提交。'
  confirmButtonText.value = '驳回'
  confirmRow.value = row
  confirmAction.value = 'reject'
  confirmVisible.value = true
}

const handleConfirm = () => {
  if (confirmAction.value === 'approve' && confirmRow.value) {
    const res = store.approveInsuranceApplication(confirmRow.value.id)
    if (res?.ok) {
      MessagePlugin.success('审核通过成功')
    } else {
      MessagePlugin.error(res?.message || '审核失败')
    }
  } else if (confirmAction.value === 'reject' && confirmRow.value) {
    const rejectReason = '投保资料不符合要求，请客户核实后重新提交。'
    const res = store.rejectInsuranceApplication(confirmRow.value.id, rejectReason)
    if (res?.ok) {
      MessagePlugin.success('驳回成功')
    } else {
      MessagePlugin.error(res?.message || '驳回失败')
    }
  }
  confirmVisible.value = false
}

const handleExport = () => {
  MessagePlugin.info('导出功能开发中（原型阶段）')
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

.confirm-content {
  padding: 16px 0;
  
  p {
    margin-bottom: 20px;
    color: #333;
    font-size: 14px;
    line-height: 1.6;
  }
}

.confirm-info {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 12px 16px;
}

.info-item {
  display: flex;
  padding: 8px 0;
  
  &:not(:last-child) {
    border-bottom: 1px dashed #e0e0e0;
  }
}

.info-label {
  width: 100px;
  flex-shrink: 0;
  color: #999;
  font-size: 14px;
}

.info-value {
  flex: 1;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}
</style>