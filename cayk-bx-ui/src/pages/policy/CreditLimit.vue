<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">信用限额管理</div>
      <div class="page-actions">
        <t-button theme="primary" @click="handleAdd">申请限额</t-button>
      </div>
    </div>

    <search-filter
      :status-options="statusOptions"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="stats-grid mb-24">
      <stat-card title="有效限额" :value="activeCount" icon="protect" color="success" />
      <stat-card title="审批中" :value="pendingCount" icon="loading" color="warning" />
      <stat-card title="额度总额" :value="`$${appliedSum.toLocaleString()}`" icon="wallet" color="primary" />
      <stat-card title="已用额度" :value="`$${usedSum.toLocaleString()}`" icon="credit-card" color="danger" />
    </div>

    <data-table
      :data="tableData"
      :columns="columns"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      @page-change="handlePageChange"
    >
      <template #usageRate="{ row }">
        <t-progress :percentage="row.usageRate" :color="row.usageRate > 80 ? '#E34D57' : '#0052D9'" />
      </template>
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

    <t-drawer v-model:visible="detailVisible" header="限额详情" size="760px" :footer="false">
      <detail-panel title="买方与额度" :columns="detailColumns" :data="currentRow || {}" />
    </t-drawer>

    <t-drawer v-model:visible="formVisible" :header="formMode === 'create' ? '申请信用限额' : '编辑信用限额'" size="860px">
      <t-form ref="formRef" :data="formData" :rules="formRules" label-width="140px" @submit="handleSubmit">
        <t-divider>买方信息</t-divider>
        <t-form-item label="买方名称" name="buyerName">
          <t-input v-model="formData.buyerName" placeholder="请输入买方名称" />
        </t-form-item>
        <t-form-item label="买方国别" name="buyerCountry">
          <t-input v-model="formData.buyerCountry" placeholder="请输入买方国别" />
        </t-form-item>
        <t-form-item label="买方注册地址" name="buyerAddress">
          <t-input v-model="formData.buyerAddress" placeholder="请输入买方注册地址" />
        </t-form-item>
        <t-form-item label="买方所属行业" name="buyerIndustry">
          <t-input v-model="formData.buyerIndustry" placeholder="请输入买方所属行业" />
        </t-form-item>
        <t-form-item label="付款条件（账期天数）" name="paymentTermsDays">
          <t-input-number v-model="formData.paymentTermsDays" :min="0" placeholder="请输入账期天数" />
        </t-form-item>
        <t-form-item label="支付方式" name="paymentMethod">
          <t-select v-model="formData.paymentMethod" placeholder="请选择支付方式" clearable>
            <t-option value="OA" label="OA" />
            <t-option value="DA" label="DA" />
            <t-option value="DP" label="DP" />
            <t-option value="LC" label="LC" />
            <t-option value="预付款" label="预付款" />
            <t-option value="其他" label="其他" />
          </t-select>
        </t-form-item>

        <t-divider>额度申请</t-divider>
        <t-form-item label="申请信用限额金额" name="appliedLimit">
          <t-input-number v-model="formData.appliedLimit" :min="0" placeholder="请输入申请额度" />
        </t-form-item>
        <t-form-item label="申请限额币种" name="currency">
          <t-select v-model="formData.currency" placeholder="请选择币种" clearable>
            <t-option value="USD" label="USD" />
            <t-option value="CNY" label="CNY" />
            <t-option value="EUR" label="EUR" />
            <t-option value="其他" label="其他" />
          </t-select>
        </t-form-item>
        <t-form-item label="过去12个月赊销交易额" name="historicalTransactionAmount">
          <t-input-number v-model="formData.historicalTransactionAmount" :min="0" placeholder="请输入交易额" />
        </t-form-item>
        <t-form-item label="预计未来12个月赊销销售总额" name="estimatedAnnualShipment">
          <t-input-number v-model="formData.estimatedAnnualShipment" :min="0" placeholder="请输入预计总额" />
        </t-form-item>
        <t-form-item label="是否有担保" name="hasGuarantee">
          <t-radio-group v-model="formData.hasGuarantee">
            <t-radio value="no">否</t-radio>
            <t-radio value="yes">是</t-radio>
          </t-radio-group>
        </t-form-item>
        <t-form-item v-if="formData.hasGuarantee === 'yes'" label="担保方公司全称" name="guarantorName">
          <t-input v-model="formData.guarantorName" placeholder="请输入担保方公司全称" />
        </t-form-item>

        <t-divider>附件与授权</t-divider>
        <t-form-item label="历史交易记录（附件）" name="historyFiles">
          <t-upload v-model="formData.historyFiles" action="https://demo.com/upload" tips="可选：PDF/Excel" multiple />
        </t-form-item>
        <t-form-item label="买方资质证明（附件）" name="buyerQualificationFiles">
          <t-upload v-model="formData.buyerQualificationFiles" action="https://demo.com/upload" tips="可选：PDF/JPG/PNG" multiple />
        </t-form-item>
        <t-form-item label="是否同意联系买方" name="allowContactBuyer">
          <t-radio-group v-model="formData.allowContactBuyer">
            <t-radio value="yes">是</t-radio>
            <t-radio value="no">否</t-radio>
          </t-radio-group>
        </t-form-item>

        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit">{{ formMode === 'create' ? '提交申请' : '保存' }}</t-button>
            <t-button variant="outline" @click="formVisible = false">取消</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
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
  { value: 'active', label: '有效' },
  { value: 'pending', label: '审批中' },
  { value: 'expired', label: '已到期' },
  { value: 'exhausted', label: '额度用尽' }
]

const statusMap = {
  active: '有效',
  pending: '审批中',
  expired: '已到期',
  exhausted: '额度用尽'
}

const columns = [
  { colKey: 'buyerName', title: '买方名称', ellipsis: true },
  { colKey: 'appliedLimit', title: '申请额度', align: 'right' },
  { colKey: 'usedLimit', title: '已用额度', align: 'right' },
  { colKey: 'remainingLimit', title: '剩余额度', align: 'right' },
  { colKey: 'usageRate', title: '使用率', width: 150, slot: 'usageRate' },
  { colKey: 'effectiveDate', title: '生效日期', width: 120 },
  { colKey: 'expiryDate', title: '到期日期', width: 120 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 120, fixed: 'right', slot: 'operation' }
]

const pagination = reactive({
  total: 0,
  current: 1,
  pageSize: 20
})

const filteredData = computed(() => {
  const list = store.creditLimits || []
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

const activeCount = computed(() => (store.creditLimits || []).filter(it => it.status === 'active').length)
const pendingCount = computed(() => (store.creditLimits || []).filter(it => it.status === 'pending').length)
const appliedSum = computed(() => (store.creditLimits || []).reduce((sum, it) => sum + (Number(it.appliedLimit) || 0), 0))
const usedSum = computed(() => (store.creditLimits || []).reduce((sum, it) => sum + (Number(it.usedLimit) || 0), 0))

const detailVisible = ref(false)
const formVisible = ref(false)
const formMode = ref('create')
const currentRow = ref(null)
const formRef = ref(null)

const detailColumns = [
  { label: '买方名称', key: 'buyerName' },
  { label: '状态', key: 'status' },
  { label: '申请额度', key: 'appliedLimit' },
  { label: '已用额度', key: 'usedLimit' },
  { label: '剩余额度', key: 'remainingLimit' },
  { label: '生效日期', key: 'effectiveDate' },
  { label: '到期日期', key: 'expiryDate' }
]

const formData = reactive({
  buyerName: '',
  buyerCountry: '',
  buyerAddress: '',
  buyerIndustry: '',
  appliedLimit: 0,
  currency: 'USD',
  paymentTermsDays: 0,
  paymentMethod: '',
  historicalTransactionAmount: 0,
  estimatedAnnualShipment: 0,
  hasGuarantee: 'no',
  guarantorName: '',
  historyFiles: null,
  buyerQualificationFiles: null,
  allowContactBuyer: 'yes'
})

const formRules = {
  buyerName: [{ required: true, message: '请输入买方名称', type: 'error' }],
  appliedLimit: [{ required: true, message: '请输入申请额度', type: 'error' }],
  currency: [{ required: true, message: '请选择币种', type: 'error' }],
  paymentTermsDays: [{ required: true, message: '请输入账期天数', type: 'error' }],
  paymentMethod: [{ required: true, message: '请选择支付方式', type: 'error' }]
}

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
  formMode.value = 'create'
  currentRow.value = null
  Object.assign(formData, {
    buyerName: '',
    buyerCountry: '',
    buyerAddress: '',
    buyerIndustry: '',
    appliedLimit: 0,
    currency: 'USD',
    paymentTermsDays: 0,
    paymentMethod: '',
    historicalTransactionAmount: 0,
    estimatedAnnualShipment: 0,
    hasGuarantee: 'no',
    guarantorName: '',
    historyFiles: null,
    buyerQualificationFiles: null,
    allowContactBuyer: 'yes'
  })
  formVisible.value = true
}

const handleView = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

const handleEdit = (row) => {
  formMode.value = 'edit'
  currentRow.value = row
  Object.assign(formData, {
    buyerName: row.buyerName || '',
    buyerCountry: row.buyerCountry || '',
    buyerAddress: row.buyerAddress || '',
    buyerIndustry: row.buyerIndustry || '',
    appliedLimit: Number(row.appliedLimit) || 0,
    currency: row.currency || 'USD',
    paymentTermsDays: Number(row.paymentTermsDays) || 0,
    paymentMethod: row.paymentMethod || '',
    historicalTransactionAmount: Number(row.historicalTransactionAmount) || 0,
    estimatedAnnualShipment: Number(row.estimatedAnnualShipment) || 0,
    hasGuarantee: row.hasGuarantee || 'no',
    guarantorName: row.guarantorName || '',
    historyFiles: row.historyFiles || null,
    buyerQualificationFiles: row.buyerQualificationFiles || null,
    allowContactBuyer: row.allowContactBuyer || 'yes'
  })
  formVisible.value = true
}

const handleSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return
  if (formData.hasGuarantee === 'yes' && !formData.guarantorName) {
    MessagePlugin.error('有担保时请填写担保方公司全称')
    return
  }
  if (formMode.value === 'create') {
    const id = `CL${new Date().getFullYear()}${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`
    store.creditLimits.unshift({
      id,
      buyerName: formData.buyerName,
      buyerCountry: formData.buyerCountry,
      buyerAddress: formData.buyerAddress,
      buyerIndustry: formData.buyerIndustry,
      appliedLimit: formData.appliedLimit,
      usedLimit: 0,
      remainingLimit: formData.appliedLimit,
      usageRate: 0,
      status: 'pending',
      effectiveDate: '',
      expiryDate: '',
      currency: formData.currency,
      paymentTermsDays: formData.paymentTermsDays,
      paymentMethod: formData.paymentMethod,
      historicalTransactionAmount: formData.historicalTransactionAmount,
      estimatedAnnualShipment: formData.estimatedAnnualShipment,
      hasGuarantee: formData.hasGuarantee,
      guarantorName: formData.guarantorName,
      historyFiles: formData.historyFiles,
      buyerQualificationFiles: formData.buyerQualificationFiles,
      allowContactBuyer: formData.allowContactBuyer
    })
    MessagePlugin.success('已提交限额申请（原型模拟）')
  } else if (currentRow.value) {
    Object.assign(currentRow.value, {
      buyerName: formData.buyerName,
      buyerCountry: formData.buyerCountry,
      buyerAddress: formData.buyerAddress,
      buyerIndustry: formData.buyerIndustry,
      appliedLimit: formData.appliedLimit,
      remainingLimit: Math.max(0, formData.appliedLimit - (Number(currentRow.value.usedLimit) || 0)),
      currency: formData.currency,
      paymentTermsDays: formData.paymentTermsDays,
      paymentMethod: formData.paymentMethod,
      historicalTransactionAmount: formData.historicalTransactionAmount,
      estimatedAnnualShipment: formData.estimatedAnnualShipment,
      hasGuarantee: formData.hasGuarantee,
      guarantorName: formData.guarantorName,
      historyFiles: formData.historyFiles,
      buyerQualificationFiles: formData.buyerQualificationFiles,
      allowContactBuyer: formData.allowContactBuyer
    })
    MessagePlugin.success('已保存限额信息（原型模拟）')
  }
  formVisible.value = false
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
