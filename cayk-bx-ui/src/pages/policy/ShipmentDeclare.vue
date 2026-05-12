<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">出运申报管理</div>
      <div class="page-actions">
        <t-button theme="primary" @click="handleAdd">
          <template #icon><t-icon name="add" /></template>
          新建申报
        </t-button>
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
      <template #isOverdue="{ row }">
        <t-tag v-if="row.isOverdue" theme="danger">超时</t-tag>
        <t-tag v-else-if="row.isDueSoon" theme="warning">即将到期</t-tag>
        <t-tag v-else theme="success">正常</t-tag>
      </template>
      <template #operation="{ row }">
        <t-space>
          <t-link @click="handleView(row)">查看</t-link>
          <t-link @click="handleEdit(row)">编辑</t-link>
        </t-space>
      </template>
    </data-table>

    <t-drawer v-model:visible="formVisible" :header="formMode === 'create' ? '新建出运申报' : formMode === 'edit' ? '编辑出运申报' : '出运申报详情'" size="860px">
      <t-form v-if="formMode !== 'detail'" ref="formRef" :data="formData" :rules="formRules" label-width="140px" @submit="handleSubmit">
        <t-divider>关联保单信息</t-divider>
        <t-form-item label="关联保单" name="relatedPolicyNo">
          <t-select v-model="formData.relatedPolicyNo" placeholder="请选择关联保单" clearable @change="handlePolicyChange">
            <t-option v-for="p in activePolicies" :key="p.policyNo" :value="p.policyNo" :label="`${p.policyNo} - ${p.insured}`" />
          </t-select>
        </t-form-item>

        <t-divider>出运信息</t-divider>
        <t-form-item label="买方名称" name="buyerName">
          <t-select v-model="formData.buyerName" placeholder="请选择买方" clearable>
            <t-option v-for="b in buyerOptions" :key="b" :value="b" :label="b" />
          </t-select>
        </t-form-item>
        <t-form-item label="出运日期" name="shipmentDate">
          <t-date-picker v-model="formData.shipmentDate" placeholder="请选择出运日期" clearable />
        </t-form-item>
        <t-form-item label="运输方式" name="transportType">
          <t-select v-model="formData.transportType" placeholder="请选择运输方式" clearable>
            <t-option value="sea" label="海运" />
            <t-option value="air" label="空运" />
            <t-option value="land" label="陆运" />
            <t-option value="other" label="其他" />
          </t-select>
        </t-form-item>
        <t-form-item label="提单号/运单号" name="billOfLadingNo">
          <t-input v-model="formData.billOfLadingNo" placeholder="请输入提单号或运单号" />
        </t-form-item>
        <t-form-item label="目的港" name="destinationPort">
          <t-input v-model="formData.destinationPort" placeholder="请输入目的港" />
        </t-form-item>
        <t-form-item label="货物描述" name="goodsDescription">
          <t-input v-model="formData.goodsDescription" placeholder="请输入货物描述" />
        </t-form-item>

        <t-divider>发票信息</t-divider>
        <t-form-item label="发票号" name="invoiceNo">
          <t-input v-model="formData.invoiceNo" placeholder="请输入发票号" />
        </t-form-item>
        <t-form-item label="发票金额" name="invoiceAmount">
          <t-input-number v-model="formData.invoiceAmount" :min="0" placeholder="请输入发票金额" />
        </t-form-item>
        <t-form-item label="发票日期" name="invoiceDate">
          <t-date-picker v-model="formData.invoiceDate" placeholder="请选择发票日期" clearable />
        </t-form-item>

        <t-divider>申报信息</t-divider>
        <t-form-item label="申报类型" name="declarationType">
          <t-select v-model="formData.declarationType" placeholder="请选择申报类型" clearable>
            <t-option value="single" label="逐笔申报" />
            <t-option value="monthly" label="月度汇总申报" />
          </t-select>
        </t-form-item>
        <t-form-item label="本次申报金额" name="shipmentAmount">
          <t-input-number v-model="formData.shipmentAmount" :min="0" placeholder="请输入申报金额" />
        </t-form-item>
        <t-form-item label="结算币种" name="currency">
          <t-select v-model="formData.currency" placeholder="请选择币种" clearable>
            <t-option value="USD" label="USD - 美元" />
            <t-option value="CNY" label="CNY - 人民币" />
            <t-option value="EUR" label="EUR - 欧元" />
            <t-option value="HKD" label="HKD - 港币" />
          </t-select>
        </t-form-item>
        <t-form-item label="付款条件" name="paymentTerms">
          <t-select v-model="formData.paymentTerms" placeholder="请选择付款条件" clearable>
            <t-option value="TT30" label="TT 30天" />
            <t-option value="TT60" label="TT 60天" />
            <t-option value="LC" label="信用证 LC" />
            <t-option value="DP" label="DP" />
            <t-option value="DA" label="DA" />
            <t-option value="OA" label="OA 赊账" />
          </t-select>
        </t-form-item>
        <t-form-item label="应付款日" name="paymentDueDate">
          <t-date-picker v-model="formData.paymentDueDate" placeholder="系统自动计算，可修改" clearable />
        </t-form-item>
        <t-form-item label="申报期限" name="computedDeadline">
          <t-input :value="computedDeadline" disabled tips="根据出运日期和目的地自动计算" />
        </t-form-item>

        <t-divider>附件上传</t-divider>
        <t-form-item label="商业发票（必传）" name="commercialInvoice">
          <t-upload v-model="formData.commercialInvoice" action="https://demo.com/upload" tips="必传：商业发票（PDF/JPG/PNG）" />
        </t-form-item>
        <t-form-item label="提单/运单（必传）" name="billOfLading">
          <t-upload v-model="formData.billOfLading" action="https://demo.com/upload" tips="必传：提单或运单（PDF/JPG/PNG）" />
        </t-form-item>
        <t-form-item label="报关单" name="customsDeclaration">
          <t-upload v-model="formData.customsDeclaration" action="https://demo.com/upload" tips="可选：报关单（PDF）" />
        </t-form-item>
        <t-form-item label="买方收货凭证" name="receiptProof">
          <t-upload v-model="formData.receiptProof" action="https://demo.com/upload" tips="可选：买方收货凭证（PDF）" />
        </t-form-item>

        <t-divider v-if="quotaWarning">{{ quotaWarning }}</t-divider>

        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit">提交申报</t-button>
            <t-button variant="outline" @click="formVisible = false">取消</t-button>
          </t-space>
        </t-form-item>
      </t-form>

      <div v-else>
        <detail-panel title="出运申报详情" :columns="detailColumns" :data="currentRow || {}" />
      </div>
    </t-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import SearchFilter from '@/components/common/SearchFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import DetailPanel from '@/components/common/DetailPanel.vue'
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
  { colKey: 'relatedPolicyNo', title: '关联保单' },
  { colKey: 'shipmentDate', title: '出运日期', width: 110 },
  { colKey: 'shipmentAmount', title: '出运金额', align: 'right' },
  { colKey: 'currency', title: '币种', width: 80 },
  { colKey: 'destinationPort', title: '目的港' },
  { colKey: 'declarationTypeName', title: '申报类型', width: 100 },
  { colKey: 'deadline', title: '申报期限', width: 110 },
  { colKey: 'isOverdue', title: '超期状态', width: 100, slot: 'isOverdue' },
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

const overdueCount = computed(() => (store.shipments || []).filter(it => it.isOverdue).length)
const dueSoonCount = computed(() => (store.shipments || []).filter(it => it.isDueSoon && !it.isOverdue).length)
const normalCount = computed(() => (store.shipments || []).length - overdueCount.value - dueSoonCount.value)

const activePolicies = computed(() => (store.policies || []).filter(p => p.status === 'active'))

const buyerOptions = computed(() => {
  const buyers = new Set()
  ;(store.policies || []).forEach(p => { if (p.insured) buyers.add(p.insured) })
  return Array.from(buyers)
})

const formVisible = ref(false)
const formMode = ref('create')
const currentRow = ref(null)
const formRef = ref(null)

const formData = reactive({
  relatedPolicyNo: '',
  buyerName: '',
  shipmentDate: '',
  destinationPort: '',
  shipmentAmount: 0,
  currency: 'USD',
  paymentTerms: '',
  declarationType: 'single',
  billOfLading: [],
  customsDeclaration: []
})

const formRules = {
  relatedPolicyNo: [{ required: true, message: '请选择关联保单', type: 'error' }],
  buyerName: [{ required: true, message: '请选择买方', type: 'error' }],
  shipmentDate: [{ required: true, message: '请选择出运日期', type: 'error' }],
  destinationPort: [{ required: true, message: '请输入目的港', type: 'error' }],
  shipmentAmount: [{ required: true, message: '请输入出运货值', type: 'error' }],
  currency: [{ required: true, message: '请选择币种', type: 'error' }],
  paymentTerms: [{ required: true, message: '请选择付款条件', type: 'error' }],
  declarationType: [{ required: true, message: '请选择申报类型', type: 'error' }]
}

const detailColumns = [
  { label: '申报单号', key: 'declarationNo' },
  { label: '关联保单', key: 'relatedPolicyNo' },
  { label: '买方名称', key: 'buyerName' },
  { label: '出运日期', key: 'shipmentDate' },
  { label: '目的港', key: 'destinationPort' },
  { label: '出运金额', key: 'shipmentAmount' },
  { label: '币种', key: 'currency' },
  { label: '付款条件', key: 'paymentTerms' },
  { label: '申报类型', key: 'declarationTypeName' },
  { label: '申报期限', key: 'deadline' },
  { label: '状态', key: 'statusName' }
]

const isHongKong = computed(() => {
  const port = formData.destinationPort || ''
  return port.includes('香港') || port.toLowerCase().includes('hong kong')
})

const computedDeadline = computed(() => {
  if (!formData.shipmentDate) return '请先选择出运日期'
  const date = new Date(formData.shipmentDate)
  if (isHongKong.value) {
    date.setDate(date.getDate() + 3)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} (出口至香港 3天内)`
  }
  if (formData.declarationType === 'monthly') {
    date.setMonth(date.getMonth() + 1)
    date.setDate(10)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} (月度汇总，次月10日前)`
  }
  date.setDate(date.getDate() + 15)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} (出运后15日内)`
})

const quotaWarning = computed(() => {
  if (!formData.buyerName || !formData.shipmentAmount) return ''
  const limit = store.creditLimits.find(c => c.buyerName === formData.buyerName)
  if (!limit) return ''
  if (formData.shipmentAmount > limit.remainingLimit) {
    return `⚠️ 超限额警告：本次申报金额 ${formData.shipmentAmount} 超过买方剩余可用限额 ${limit.remainingLimit}`
  }
  return ''
})

const handlePolicyChange = (value) => {
  const policy = store.policies.find(p => p.policyNo === value)
  if (policy) {
    formData.buyerName = policy.insured || ''
  }
}

const handleSearch = (params) => { searchParams.value = params; pagination.current = 1 }
const handleReset = () => { searchParams.value = { enterpriseName: '', buyerName: '', status: '', dateRange: [] }; pagination.current = 1 }
const handlePageChange = (pageInfo) => { pagination.current = pageInfo.current; pagination.pageSize = pageInfo.pageSize }

const handleAdd = () => {
  formMode.value = 'create'
  currentRow.value = null
  Object.assign(formData, {
    relatedPolicyNo: '',
    buyerName: '',
    shipmentDate: '',
    destinationPort: '',
    shipmentAmount: 0,
    currency: 'USD',
    paymentTerms: '',
    declarationType: 'single',
    billOfLading: [],
    customsDeclaration: []
  })
  formVisible.value = true
}

const handleView = (row) => {
  formMode.value = 'detail'
  currentRow.value = row
  formVisible.value = true
}

const handleEdit = (row) => {
  formMode.value = 'edit'
  currentRow.value = row
  Object.assign(formData, {
    relatedPolicyNo: row.relatedPolicyNo || '',
    buyerName: row.buyerName || '',
    shipmentDate: row.shipmentDate || '',
    destinationPort: row.destinationPort || '',
    shipmentAmount: Number(row.shipmentAmount) || 0,
    currency: row.currency || 'USD',
    paymentTerms: row.paymentTerms || '',
    declarationType: row.declarationType || 'single',
    billOfLading: row.billOfLading || [],
    customsDeclaration: row.customsDeclaration || []
  })
  formVisible.value = true
}

const handleSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return
  if (quotaWarning.value) {
    const confirm = await MessagePlugin.confirm('本次申报金额超过买方剩余可用限额，是否确认提交？', '超限额警告')
    if (confirm !== 'confirm') return
  }
  if (!formData.billOfLading || formData.billOfLading.length === 0) {
    MessagePlugin.error('请上传提单/货运单据')
    return
  }
  const limit = store.creditLimits.find(c => c.buyerName === formData.buyerName)
  if (limit && formData.shipmentAmount > limit.remainingLimit) {
    MessagePlugin.error('申报金额超过买方剩余可用限额，申报失败')
    return
  }
  if (formMode.value === 'create') {
    store.createShipment({
      relatedPolicyNo: formData.relatedPolicyNo,
      buyerName: formData.buyerName,
      shipmentDate: formData.shipmentDate,
      destinationPort: formData.destinationPort,
      shipmentAmount: formData.shipmentAmount,
      currency: formData.currency,
      paymentTerms: formData.paymentTerms,
      declarationType: formData.declarationType,
      declarationTypeName: formData.declarationType === 'single' ? '逐笔申报' : '月度汇总',
      status: 'declared',
      statusName: '已申报'
    })
    MessagePlugin.success('出运申报已提交')
  } else if (currentRow.value) {
    Object.assign(currentRow.value, {
      relatedPolicyNo: formData.relatedPolicyNo,
      buyerName: formData.buyerName,
      shipmentDate: formData.shipmentDate,
      destinationPort: formData.destinationPort,
      shipmentAmount: formData.shipmentAmount,
      currency: formData.currency,
      paymentTerms: formData.paymentTerms,
      declarationType: formData.declarationType,
      declarationTypeName: formData.declarationType === 'single' ? '逐笔申报' : '月度汇总'
    })
    MessagePlugin.success('出运申报已更新')
  }
  formVisible.value = false
}

onMounted(() => { store.ensureSeeded() })
</script>

<style lang="scss" scoped>
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.mb-16 { margin-bottom: 16px; }
</style>
