<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">保单信息管理</div>
      <div class="page-actions">
        <t-button variant="outline" @click="handleDigitize">新增投保</t-button>
      </div>
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
      <stat-card title="有效保单" :value="activePolicyCount" icon="file" color="success" />
      <stat-card title="本月新增" :value="store.policies.length" icon="add" color="primary" />
      <stat-card title="即将到期" :value="expiringPolicyCount" icon="time" color="warning" />
      <stat-card title="已用额度" :value="`$${usedQuotaSum.toLocaleString()}`" icon="credit-card" color="danger" />
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
          <t-link @click="handleChange(row)">变更</t-link>
        </t-space>
      </template>
    </data-table>

    <t-dialog v-model:visible="detailVisible" header="保单详情" width="600px" :footer="false">
      <detail-panel title="基础信息" :columns="detailColumns" :data="currentRow || {}" />
    </t-dialog>

    <t-dialog v-model:visible="editVisible" :header="editMode === 'create' ? '新增保单' : '编辑保单'" width="600px">
      <t-form ref="editFormRef" :data="editForm" :rules="editRules" label-width="120px" @submit="handleEditSubmit">
        <t-form-item label="保单号" name="policyNo">
          <t-input v-model="editForm.policyNo" placeholder="请输入保单号" :disabled="editMode !== 'create'" />
        </t-form-item>
        <t-form-item label="保险公司" name="insuranceCompany">
          <t-select v-model="editForm.insuranceCompany" placeholder="请选择保险公司" clearable>
            <t-option value="人保财险" label="人保财险" />
            <t-option value="平安产险" label="平安产险" />
            <t-option value="太保产险" label="太保产险" />
            <t-option value="中国信保" label="中国信保" />
          </t-select>
        </t-form-item>
        <t-form-item label="被保险人" name="policyholder">
          <t-input v-model="editForm.policyholder" placeholder="请输入被保险人名称" />
        </t-form-item>
        <t-form-item label="投保买方" name="insured">
          <t-input v-model="editForm.insured" placeholder="请输入买方名称" />
        </t-form-item>
        <t-form-item label="保险金额" name="coverageAmount">
          <t-input-number v-model="editForm.coverageAmount" :min="0" placeholder="请输入保险金额" />
        </t-form-item>
        <t-form-item label="生效日期" name="effectiveDate">
          <t-date-picker v-model="editForm.effectiveDate" placeholder="请选择生效日期" clearable />
        </t-form-item>
        <t-form-item label="到期日期" name="expiryDate">
          <t-date-picker v-model="editForm.expiryDate" placeholder="请选择到期日期" clearable />
        </t-form-item>
        <t-form-item label="状态" name="status">
          <t-select v-model="editForm.status" placeholder="请选择状态" clearable>
            <t-option v-for="opt in statusOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </t-select>
        </t-form-item>
        <t-form-item label="已用额度" name="usedQuota">
          <t-input-number v-model="editForm.usedQuota" :min="0" placeholder="请输入已用额度" />
        </t-form-item>
        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit">保存</t-button>
            <t-button variant="outline" @click="editVisible = false">取消</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-dialog>

    <t-dialog v-model:visible="changeVisible" header="发起保单变更" width="700px">
      <t-form ref="changeFormRef" :data="changeForm" :rules="changeRules" label-width="140px" @submit="handleChangeSubmit">
        <t-form-item label="关联保单号">
          <t-input :value="currentRow?.policyNo" disabled />
        </t-form-item>
        <t-form-item label="变更申请日期">
          <t-input :value="new Date().toISOString().split('T')[0]" disabled />
        </t-form-item>
        <t-form-item label="变更类型" name="changeType">
          <t-select v-model="changeForm.changeType" placeholder="请选择变更类型" clearable>
            <t-option value="add_buyer" label="增加买方" />
            <t-option value="remove_buyer" label="减少买方" />
            <t-option value="extend_period" label="延期" />
            <t-option value="adjust_limit" label="变更限额" />
            <t-option value="insured_info" label="变更被保险人信息" />
            <t-option value="contact_info" label="变更联系人" />
            <t-option value="address_info" label="变更地址" />
            <t-option value="other" label="其他变更" />
          </t-select>
        </t-form-item>
        <t-form-item label="变更原因" name="changeReason">
          <t-textarea v-model="changeForm.changeReason" placeholder="请输入变更原因" :autosize="{ minRows: 3, maxRows: 5 }" />
        </t-form-item>
        <t-form-item label="变更前内容" name="changeBefore">
          <t-textarea v-model="changeForm.changeBefore" placeholder="请描述变更前的内容" :autosize="{ minRows: 2, maxRows: 4 }" />
        </t-form-item>
        <t-form-item label="变更后内容" name="changeAfter">
          <t-textarea v-model="changeForm.changeAfter" placeholder="请描述变更后的内容" :autosize="{ minRows: 2, maxRows: 4 }" />
        </t-form-item>
        <t-form-item label="变更申请书（必传）" name="changeApplicationForm">
          <t-upload v-model="changeForm.changeApplicationForm" action="https://demo.com/upload" tips="必传：保险合同变更申请书（PDF）" />
        </t-form-item>
        <t-form-item label="证明文件" name="proofFiles">
          <t-upload v-model="changeForm.proofFiles" action="https://demo.com/upload" tips="按变更类型上传相应证明文件（可多文件，PDF/JPG/PNG）" multiple />
        </t-form-item>
        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit">提交变更申请</t-button>
            <t-button variant="outline" @click="changeVisible = false">取消</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-dialog>

    <t-dialog v-model:visible="digitizeVisible" header="保单数字化（模拟OCR校对）" width="800px">
      <div style="max-height: 600px; overflow-y: auto;">
        <t-form ref="digitizeFormRef" :data="digitizeForm" label-width="150px" @submit="handleDigitizeSubmit">
          <t-divider>上传保单文件</t-divider>
          <t-form-item label="保单文件" name="policyFile">
            <t-upload v-model="digitizeForm.policyFile" action="https://demo.com/upload" tips="上传后将模拟OCR自动填充字段" @success="handlePolicyFileUploaded" />
          </t-form-item>
          <t-form-item label="批单文件（可选）" name="endorsementFile">
            <t-upload v-model="digitizeForm.endorsementFile" action="https://demo.com/upload" />
          </t-form-item>

          <t-divider>基础信息</t-divider>
          <t-form-item label="保险单号" name="policyNo">
            <t-input v-model="digitizeForm.policyNo" placeholder="OCR识别/手工录入" />
          </t-form-item>
          <t-form-item label="保险公司名称" name="insuranceCompany">
            <t-input v-model="digitizeForm.insuranceCompany" placeholder="OCR识别/手工录入" />
          </t-form-item>
          <t-form-item label="保险人名称" name="insurerName">
            <t-input v-model="digitizeForm.insurerName" placeholder="OCR识别/手工录入" />
          </t-form-item>
          <t-form-item label="被保险人名称" name="policyholder">
            <t-input v-model="digitizeForm.policyholder" placeholder="OCR识别/手工校对" />
          </t-form-item>
          <t-form-item label="受益人名称" name="beneficiary">
            <t-input v-model="digitizeForm.beneficiary" placeholder="可选" />
          </t-form-item>
          <t-form-item label="保险起期" name="startDate">
            <t-date-picker v-model="digitizeForm.startDate" placeholder="请选择" clearable />
          </t-form-item>
          <t-form-item label="保险止期" name="endDate">
            <t-date-picker v-model="digitizeForm.endDate" placeholder="请选择" clearable />
          </t-form-item>
          <t-form-item label="保险期间" name="duration">
            <t-input v-model="digitizeForm.duration" placeholder="如 12个月" />
          </t-form-item>
          <t-form-item label="续保标识" name="renewalFlag">
            <t-radio-group v-model="digitizeForm.renewalFlag">
              <t-radio value="yes">是</t-radio>
              <t-radio value="no">否</t-radio>
            </t-radio-group>
          </t-form-item>
          <t-form-item label="投保金额" name="insuredAmount">
            <t-input-number v-model="digitizeForm.insuredAmount" :min="0" placeholder="请输入投保金额" />
          </t-form-item>
          <t-form-item label="业务类型" name="businessType">
            <t-select v-model="digitizeForm.businessType" placeholder="请选择业务类型" clearable>
              <t-option value="货物贸易" label="货物贸易" />
              <t-option value="服务贸易" label="服务贸易" />
            </t-select>
          </t-form-item>

          <t-divider>责任限额与条款</t-divider>
          <t-form-item label="最高赔偿限额" name="maxIndemnity">
            <t-input-number v-model="digitizeForm.maxIndemnity" :min="0" placeholder="请输入最高赔偿限额" />
          </t-form-item>
          <t-form-item label="免赔额" name="deductible">
            <t-input-number v-model="digitizeForm.deductible" :min="0" placeholder="请输入免赔额" />
          </t-form-item>
          <t-form-item label="国家风险类别版本" name="riskCategoryVersion">
            <t-input v-model="digitizeForm.riskCategoryVersion" placeholder="可选" />
          </t-form-item>
          <t-form-item label="条款版本" name="clauseVersion">
            <t-input v-model="digitizeForm.clauseVersion" placeholder="可选" />
          </t-form-item>
          <t-form-item label="约定保险范围" name="insuranceScope">
            <t-textarea v-model="digitizeForm.insuranceScope" placeholder="可选" :autosize="{ minRows: 2, maxRows: 4 }" />
          </t-form-item>

          <t-divider>申报规则与费用管理</t-divider>
          <t-form-item label="申报方式" name="reportMethod">
            <t-select v-model="digitizeForm.reportMethod" placeholder="请选择" clearable>
              <t-option value="逐笔" label="逐笔" />
              <t-option value="月度" label="月度" />
              <t-option value="季度" label="季度" />
            </t-select>
          </t-form-item>
          <t-form-item label="申报周期" name="reportCycle">
            <t-select v-model="digitizeForm.reportCycle" placeholder="请选择" clearable>
              <t-option value="月度" label="月度" />
              <t-option value="季度" label="季度" />
            </t-select>
          </t-form-item>
          <t-form-item label="申报截至日期" name="reportDeadline">
            <t-input v-model="digitizeForm.reportDeadline" placeholder="如 次月15日" />
          </t-form-item>
          <t-form-item label="申报币种" name="reportCurrency">
            <t-select v-model="digitizeForm.reportCurrency" placeholder="请选择" clearable>
              <t-option value="人民币" label="人民币" />
              <t-option value="美元" label="美元" />
            </t-select>
          </t-form-item>
          <t-form-item label="保险费率" name="rate">
            <t-input v-model="digitizeForm.rate" placeholder="如 0.8% 或区间" />
          </t-form-item>
          <t-form-item label="缴费期限" name="paymentDeadline">
            <t-input v-model="digitizeForm.paymentDeadline" placeholder="如 起期前30日/单笔申报后3日内" />
          </t-form-item>
          <t-form-item label="缴费方式" name="paymentMethod">
            <t-select v-model="digitizeForm.paymentMethod" placeholder="请选择" clearable>
              <t-option value="一次性" label="一次性" />
              <t-option value="分期" label="分期" />
            </t-select>
          </t-form-item>
          <t-form-item label="保费" name="premiumAmount">
            <t-input-number v-model="digitizeForm.premiumAmount" :min="0" placeholder="请输入保费金额" />
          </t-form-item>

        </t-form>
      </div>
    </t-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import SearchFilter from '@/components/common/SearchFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import DetailPanel from '@/components/common/DetailPanel.vue'
import { useBusinessStore } from '@/stores/business'

const router = useRouter()
const store = useBusinessStore()
const loading = computed(() => false)
const searchParams = ref({ enterpriseName: '', buyerName: '', status: '', dateRange: [] })

const statusOptions = [
  { value: 'active', label: '有效' },
  { value: 'pending_effect', label: '待生效' },
  { value: 'expiring', label: '即将到期' },
  { value: 'expired', label: '已到期' },
  { value: 'suspended', label: '中止' },
  { value: 'cancelled', label: '退保' },
  { value: 'terminated', label: '终止' },
  { value: 'applying', label: '申请中' },
  { value: 'pending_review', label: '待审核' },
  { value: 'approved', label: '审核通过' }
]

const statusMap = {
  pending_effect: '待生效',
  active: '有效',
  expiring: '即将到期',
  expired: '已到期',
  suspended: '中止',
  cancelled: '退保',
  terminated: '终止',
  applying: '申请中',
  pending_review: '待审核',
  approved: '审核通过'
}

const columns = [
  { colKey: 'policyNo', title: '保单号', width: 140 },
  { colKey: 'insuranceCompany', title: '保险公司' },
  { colKey: 'policyholder', title: '被保险人', ellipsis: true },
  { colKey: 'insured', title: '投保买方' },
  { colKey: 'coverageAmount', title: '保险金额', align: 'right' },
  { colKey: 'effectiveDate', title: '生效日期', width: 120 },
  { colKey: 'expiryDate', title: '到期日期', width: 120 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 140, fixed: 'right', slot: 'operation' }
]

const pagination = reactive({
  total: 0,
  current: 1,
  pageSize: 20
})

const filteredData = computed(() => {
  const list = store.policies || []
  const p = searchParams.value
  return list.filter((it) => {
    if (p.enterpriseName && !String(it.policyholder || '').includes(p.enterpriseName)) return false
    if (p.buyerName && !String(it.insured || '').includes(p.buyerName)) return false
    if (p.status && it.status !== p.status) return false
    return true
  })
})

const tableData = computed(() => {
  pagination.total = filteredData.value.length
  const start = (pagination.current - 1) * pagination.pageSize
  return filteredData.value.slice(start, start + pagination.pageSize)
})

const activePolicyCount = computed(() => (store.policies || []).filter(p => p.status === 'active').length)
const expiringPolicyCount = computed(() => (store.policies || []).filter(p => p.status === 'expiring').length)
const usedQuotaSum = computed(() => (store.policies || []).reduce((sum, p) => sum + (Number(p.usedQuota) || 0), 0))

const detailVisible = ref(false)
const editVisible = ref(false)
const changeVisible = ref(false)
const digitizeVisible = ref(false)

const editMode = ref('create')
const currentRow = ref(null)
const editFormRef = ref(null)
const changeFormRef = ref(null)
const digitizeFormRef = ref(null)

const detailColumns = [
  { label: '保单号', key: 'policyNo' },
  { label: '保险公司', key: 'insuranceCompany' },
  { label: '被保险人', key: 'policyholder' },
  { label: '投保买方', key: 'insured' },
  { label: '保险金额', key: 'coverageAmount', formatter: (v) => `$${Number(v).toLocaleString()}` },
  { label: '保费金额', key: 'premium', formatter: (v) => `$${Number(v).toLocaleString()}` },
  { label: '生效日期', key: 'effectiveDate' },
  { label: '到期日期', key: 'expiryDate' },
  { label: '已用额度', key: 'usedQuota', formatter: (v) => `$${Number(v).toLocaleString()}` },
  { label: '剩余额度', key: 'remainingQuota', formatter: (v) => `$${Number(v).toLocaleString()}` },
  { label: '状态', key: 'statusName' }
]

const editForm = reactive({
  policyNo: '',
  insuranceCompany: '',
  policyholder: '',
  insured: '',
  coverageAmount: 0,
  effectiveDate: '',
  expiryDate: '',
  status: 'active',
  usedQuota: 0
})

const editRules = {
  policyNo: [{ required: true, message: '请输入保单号', type: 'error' }],
  insuranceCompany: [{ required: true, message: '请选择保险公司', type: 'error' }],
  policyholder: [{ required: true, message: '请输入被保险人名称', type: 'error' }],
  effectiveDate: [{ required: true, message: '请选择生效日期', type: 'error' }],
  expiryDate: [{ required: true, message: '请选择到期日期', type: 'error' }]
}

const changeForm = reactive({
  changeType: '',
  changeReason: '',
  changeApplicationForm: null,
  proofFiles: null
})

const changeRules = {
  changeType: [{ required: true, message: '请选择变更类型', type: 'error' }],
  changeReason: [{ required: true, message: '请输入变更原因', type: 'error' }],
  changeApplicationForm: [{ required: true, message: '请上传变更申请书', type: 'error' }]
}

const digitizeForm = reactive({
  policyFile: null,
  endorsementFile: null,
  policyNo: '',
  insuranceCompany: '',
  insurerName: '',
  policyholder: '',
  beneficiary: '',
  startDate: '',
  endDate: '',
  duration: '',
  renewalFlag: 'no',
  insuredAmount: 0,
  businessType: '',
  maxIndemnity: 0,
  deductible: 0,
  riskCategoryVersion: '',
  clauseVersion: '',
  insuranceScope: '',
  reportMethod: '',
  reportCycle: '',
  reportDeadline: '',
  reportCurrency: '',
  rate: '',
  paymentDeadline: '',
  paymentMethod: '',
  premiumAmount: 0
})

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
  router.push('/insurance/purchase/new')
}

const handleView = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

const handleEdit = (row) => {
  editMode.value = 'edit'
  currentRow.value = row
  Object.assign(editForm, {
    policyNo: row.policyNo,
    insuranceCompany: row.insuranceCompany,
    policyholder: row.policyholder,
    insured: row.insured,
    coverageAmount: Number(row.coverageAmount) || 0,
    effectiveDate: row.effectiveDate,
    expiryDate: row.expiryDate,
    status: row.status,
    usedQuota: Number(row.usedQuota) || 0
  })
  editVisible.value = true
}

const handleChange = (row) => {
  currentRow.value = row
  Object.assign(changeForm, { changeType: '', changeReason: '', changeApplicationForm: null, proofFiles: null })
  changeVisible.value = true
}

const handleExport = () => {
  MessagePlugin.info('导出功能开发中（原型阶段）')
}

const handleEditSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return
  if (editMode.value === 'create') {
    store.policies.unshift({
      policyNo: editForm.policyNo,
      insuranceCompany: editForm.insuranceCompany,
      policyholder: editForm.policyholder,
      insured: editForm.insured,
      coverageAmount: editForm.coverageAmount,
      effectiveDate: editForm.effectiveDate,
      expiryDate: editForm.expiryDate,
      status: editForm.status,
      usedQuota: editForm.usedQuota
    })
    MessagePlugin.success('新增保单成功（原型数据）')
  } else if (currentRow.value) {
    Object.assign(currentRow.value, {
      insuranceCompany: editForm.insuranceCompany,
      policyholder: editForm.policyholder,
      insured: editForm.insured,
      coverageAmount: editForm.coverageAmount,
      effectiveDate: editForm.effectiveDate,
      expiryDate: editForm.expiryDate,
      status: editForm.status,
      usedQuota: editForm.usedQuota
    })
    MessagePlugin.success('编辑保单成功（原型数据）')
  }
  editVisible.value = false
}

const handleChangeSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return
  MessagePlugin.success('变更申请已提交（原型模拟）')
  changeVisible.value = false
}

const handleDigitize = () => {
  Object.assign(digitizeForm, {
    policyFile: null,
    endorsementFile: null,
    policyNo: '',
    insuranceCompany: '',
    insurerName: '',
    policyholder: '',
    beneficiary: '',
    startDate: '',
    endDate: '',
    duration: '',
    renewalFlag: 'no',
    insuredAmount: 0,
    businessType: '',
    maxIndemnity: 0,
    deductible: 0,
    riskCategoryVersion: '',
    clauseVersion: '',
    insuranceScope: '',
    reportMethod: '',
    reportCycle: '',
    reportDeadline: '',
    reportCurrency: '',
    rate: '',
    paymentDeadline: '',
    paymentMethod: '',
    premiumAmount: 0
  })
  digitizeVisible.value = true
}

const handlePolicyFileUploaded = () => {
  Object.assign(digitizeForm, {
    policyNo: `PI${new Date().getFullYear()}${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
    insuranceCompany: '人保财险',
    insurerName: 'XXXX保险公司',
    policyholder: '深圳XX国际贸易有限公司',
    startDate: '2026-01-01',
    endDate: '2027-01-01',
    duration: '12个月',
    renewalFlag: 'yes',
    insuredAmount: 500000,
    businessType: '货物贸易',
    maxIndemnity: 450000,
    deductible: 0,
    reportMethod: '月度',
    reportCycle: '月度',
    reportDeadline: '次月15日前',
    reportCurrency: '美元',
    rate: '0.80%',
    paymentDeadline: '保单生效后30天内',
    paymentMethod: '一次性',
    premiumAmount: 3200
  })
  MessagePlugin.success('已完成字段自动填充（模拟OCR），请人工校对后保存')
}

const handleDigitizeSubmit = async () => {
  if (!digitizeForm.policyNo) {
    MessagePlugin.error('请先上传保单文件或录入保险单号')
    return
  }
  MessagePlugin.success('已保存结构化结果（原型模拟）')
  digitizeVisible.value = false
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
