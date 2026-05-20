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
          <t-link v-if="isInkasso && row.status === 'pending_review'" theme="primary" @click="handleApprove(row)">审核</t-link>
          <t-link v-if="isInkasso && row.status === 'pending_review'" theme="danger" @click="handleReject(row)">驳回</t-link>
          <t-link v-if="!isInkasso && row.status === 'rejected'" theme="primary" @click="handleSubmit(row)">重新提交</t-link>
        </t-space>
      </template>
    </data-table>

    <t-dialog v-model:visible="detailVisible" header="投保详情" width="800px" :footer="false">
      <detail-panel title="基础信息" :columns="detailColumns" :data="currentRow || {}" />
      <detail-panel title="业务信息" :columns="businessColumns" :data="currentRow || {}" />
      <detail-panel title="投保需求" :columns="insuranceColumns" :data="currentRow || {}" />
    </t-dialog>

    <t-dialog v-model:visible="exportVisible" header="导出预览" width="800px" :footer="false">
      <div class="export-modal">
        <div class="export-filters">
          <h4 class="filter-title">筛选条件</h4>
          <div class="filter-grid">
            <div class="filter-item" v-if="searchParams.enterpriseName">
              <span class="filter-label">企业名称：</span>
              <span class="filter-value">{{ searchParams.enterpriseName }}</span>
            </div>
            <div class="filter-item" v-if="searchParams.buyerName">
              <span class="filter-label">买方名称：</span>
              <span class="filter-value">{{ searchParams.buyerName }}</span>
            </div>
            <div class="filter-item" v-if="searchParams.status">
              <span class="filter-label">状态：</span>
              <span class="filter-value">{{ statusMap[searchParams.status] || searchParams.status }}</span>
            </div>
            <div class="filter-item" v-if="!Object.values(searchParams).some(v => v && (Array.isArray(v) ? v.length : true))">
              <span class="filter-label">筛选条件：</span>
              <span class="filter-value">全部数据</span>
            </div>
          </div>
        </div>
        
        <div class="export-preview">
          <h4 class="preview-title">数据预览（共 {{ exportData.length }} 条）</h4>
          <div class="preview-table-wrapper">
            <table class="preview-table">
              <thead>
                <tr>
                  <th>投保编号</th>
                  <th>企业名称</th>
                  <th>买方名称</th>
                  <th>买方国别</th>
                  <th>投保类型</th>
                  <th>投保金额</th>
                  <th>状态</th>
                  <th>申请日期</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in exportData.slice(0, 10)" :key="row.id">
                  <td>{{ row.id }}</td>
                  <td>{{ row.companyName }}</td>
                  <td>{{ row.buyerName }}</td>
                  <td>{{ row.buyerCountry }}</td>
                  <td>{{ row.insuranceType }}</td>
                  <td>${{ Number(row.insuranceAmount || 0).toLocaleString() }}</td>
                  <td>{{ statusMap[row.status] || row.status }}</td>
                  <td>{{ row.createTime }}</td>
                </tr>
                <tr v-if="exportData.length > 10">
                  <td colspan="8" class="more-data">... 还有 {{ exportData.length - 10 }} 条数据</td>
                </tr>
                <tr v-if="exportData.length === 0">
                  <td colspan="8" class="no-data">暂无数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="modal-footer">
          <t-button variant="outline" @click="exportVisible = false">取消</t-button>
          <t-button theme="primary" @click="generateExcel">导出Excel</t-button>
        </div>
      </div>
    </t-dialog>

    <t-dialog v-model:visible="confirmVisible" :header="confirmTitle" width="800px">
      <div class="confirm-content">
        <detail-panel v-if="confirmRow" title="基础信息" :columns="detailColumns" :data="confirmRow || {}" />
        <detail-panel v-if="confirmRow" title="业务信息" :columns="businessColumns" :data="confirmRow || {}" />
        <detail-panel v-if="confirmRow" title="投保需求" :columns="insuranceColumns" :data="confirmRow || {}" />
        
        <t-form v-if="confirmAction === 'reject'" label-width="100px">
          <t-form-item label="驳回原因">
            <t-textarea v-model="rejectReason" placeholder="请输入驳回原因" :autosize="{ minRows: 3, maxRows: 6 }" />
          </t-form-item>
        </t-form>
        
        <div class="confirm-tip" v-if="confirmAction === 'submit'">
          <t-icon name="warning-circle" size="16px" class="tip-icon" />
          <span class="tip-text">提交后状态将变为待审核，请确认信息无误</span>
        </div>
        <div class="confirm-tip" v-else-if="confirmAction === 'approve'">
          <t-icon name="check-circle" size="16px" class="tip-icon success" />
          <span class="tip-text">确认审核通过此投保申请？</span>
        </div>
        <div class="confirm-tip" v-else-if="confirmAction === 'reject'">
          <t-icon name="close-circle" size="16px" class="tip-icon danger" />
          <span class="tip-text">请确认是否驳回此申请，驳回后客户可重新编辑提交。</span>
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="confirmVisible = false">取消</t-button>
          <t-button v-if="confirmAction === 'approve'" theme="primary" @click="handleConfirm">通过</t-button>
          <t-button v-else-if="confirmAction === 'reject'" theme="danger" @click="handleConfirm">驳回</t-button>
          <t-button v-else-if="confirmAction === 'submit'" theme="primary" @click="handleConfirm">确认</t-button>
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
import { useUserStore } from '@/stores/user'

const store = useBusinessStore()
const userStore = useUserStore()
const loading = computed(() => false)
const searchParams = ref({ enterpriseName: '', buyerName: '', status: '', dateRange: [] })

const isInkasso = computed(() => userStore.role === 'inkasso')

const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'pending_review', label: '待审核' },
  { value: 'approved', label: '审核通过' },
  { value: 'rejected', label: '已驳回' }
]

const statusMap = {
  draft: '待审核',
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
const rejectReason = ref('')

const detailColumns = [
  { label: '投保编号', key: 'id' },
  { label: '企业名称', key: 'companyName' },
  { label: '统一社会信用代码', key: 'unifiedSocialCreditCode' },
  { label: '法定代表人', key: 'legalRepresentative' },
  { label: '联系人', key: 'contactName' },
  { label: '联系电话', key: 'contactPhone' },
  { label: '保单编号', key: 'policyNo', formatter: (v) => v || '-' },
  { label: '保险公司', key: 'insuranceCompanyName', formatter: (v) => v || '-' }
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
  confirmRow.value = row
  confirmAction.value = 'approve'
  rejectReason.value = ''
  confirmVisible.value = true
}

const handleReject = (row) => {
  confirmTitle.value = '确认驳回'
  confirmRow.value = row
  confirmAction.value = 'reject'
  rejectReason.value = ''
  confirmVisible.value = true
}

const handleSubmit = (row) => {
  confirmTitle.value = '重新提交申请'
  confirmContent.value = ''
  confirmButtonText.value = ''
  confirmRow.value = row
  confirmAction.value = 'submit'
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
    if (!rejectReason.value.trim()) {
      MessagePlugin.warning('请输入驳回原因')
      return
    }
    const res = store.rejectInsuranceApplication(confirmRow.value.id, rejectReason.value)
    if (res?.ok) {
      MessagePlugin.success('驳回成功')
    } else {
      MessagePlugin.error(res?.message || '驳回失败')
    }
  } else if (confirmAction.value === 'submit' && confirmRow.value) {
    const res = store.submitInsuranceApplication(confirmRow.value.id)
    if (res?.ok) {
      MessagePlugin.success('提交申请成功')
    } else {
      MessagePlugin.error(res?.message || '提交失败')
    }
  }
  confirmVisible.value = false
}

const exportVisible = ref(false)
const exportData = ref([])

const handleExport = () => {
  exportData.value = filteredData.value
  exportVisible.value = true
}

const generateExcel = () => {
  const headers = [
    { key: 'id', label: '投保编号' },
    { key: 'companyName', label: '企业名称' },
    { key: 'buyerName', label: '买方名称' },
    { key: 'buyerCountry', label: '买方国别' },
    { key: 'insuranceType', label: '投保类型' },
    { key: 'insuranceAmount', label: '投保金额' },
    { key: 'status', label: '状态' },
    { key: 'createTime', label: '申请日期' }
  ]
  
  let excelContent = headers.map(h => h.label).join('\t') + '\n'
  
  exportData.value.forEach(row => {
    const rowData = headers.map(h => {
      let value = row[h.key]
      if (h.key === 'status') {
        value = statusMap[row[h.key]] || row[h.key]
      }
      if (h.key === 'insuranceAmount') {
        value = '$' + (Number(value) || 0).toLocaleString()
      }
      return value || '-'
    })
    excelContent += rowData.join('\t') + '\n'
  })
  
  const blob = new Blob(['\uFEFF' + excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `投保信息_${new Date().toISOString().split('T')[0]}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  exportVisible.value = false
  MessagePlugin.success('导出成功')
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

.export-modal {
  padding: 16px;
}

.export-filters {
  margin-bottom: 20px;
}

.filter-title,
.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.filter-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-item {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
}

.filter-label {
  color: #999;
  font-size: 13px;
}

.filter-value {
  color: #333;
  font-size: 13px;
  font-weight: 500;
}

.export-preview {
  margin-bottom: 20px;
}

.preview-table-wrapper {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.preview-table th,
.preview-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.preview-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #666;
  position: sticky;
  top: 0;
  z-index: 1;
}

.preview-table tbody tr:hover {
  background: #f8f9fa;
}

.more-data,
.no-data {
  text-align: center;
  color: #999;
  padding: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.confirm-content {
  padding: 8px 0;
}

.confirm-info {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  
  &:not(:last-child) {
    border-bottom: 1px dashed #e0e0e0;
  }
}

.info-label {
  width: 100px;
  flex-shrink: 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.info-value {
  flex: 1;
  font-size: 14px;
  color: #333;
  word-break: break-all;
}

.status-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  
  &.rejected {
    background: #fee2e2;
    color: #dc2626;
  }
  
  &.pending_review {
    background: #fef3c7;
    color: #d97706;
  }
  
  &.approved {
    background: #dcfce7;
    color: #16a34a;
  }
}

.confirm-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 6px;
  padding: 10px 14px;
  margin-top: 16px;
}

.tip-icon {
  color: #f59e0b;
  
  &.success {
    color: #16a34a;
  }
  
  &.danger {
    color: #dc2626;
  }
}

.tip-text {
  font-size: 13px;
  color: #92400e;
}

.confirm-tip {
  &:has(.tip-icon.success) .tip-text {
    color: #166534;
  }
  
  &:has(.tip-icon.danger) .tip-text {
    color: #991b1b;
  }
}
</style>