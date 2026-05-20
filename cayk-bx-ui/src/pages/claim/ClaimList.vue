<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/claim/list">理赔管理</t-breadcrumb-item>
        <t-breadcrumb-item>理赔信息管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
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
      <stat-card title="理赔案件" :value="store.claims.length" icon="first-aid-kit" color="primary" />
      <stat-card title="预估理赔金额" :value="`$${claimTotal.toLocaleString()}`" icon="money" color="warning" />
      <stat-card title="已结案" :value="completedCount" icon="check-circle" color="success" />
      <stat-card title="待处理" :value="pendingCount" icon="time" color="danger" />
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
      <template #claimType="{ row }">
        <t-tag :theme="getClaimTypeTheme(row.claimType)">{{ row.claimTypeName }}</t-tag>
      </template>
      <template #isOverdue="{ row }">
        <t-tag v-if="row.overdueDays > 0" theme="danger">逾期{{ row.overdueDays }}天</t-tag>
        <t-tag v-else-if="row.overdueDays < 0" theme="warning">距报案{{ Math.abs(row.overdueDays) }}天</t-tag>
        <t-tag v-else theme="success">正常</t-tag>
      </template>
      <template #operation="{ row }">
        <t-space>
          <t-link @click="handleView(row)">查看</t-link>
          <t-link @click="handleEdit(row)">编辑</t-link>
        </t-space>
      </template>
    </data-table>

    <t-dialog v-model:visible="createVisible" header="新建理赔" width="900px" :footer="false">
      <t-form ref="createFormRef" :data="createForm" :rules="createRules" label-align="top">
        <t-divider>基本信息</t-divider>
        <div class="form-grid">
          <t-form-item label="关联保单号" name="relatedPolicyNo">
            <t-select v-model="createForm.relatedPolicyNo" placeholder="请选择有效保单" clearable>
              <t-option v-for="p in activePolicies" :key="p.policyNo" :value="p.policyNo" :label="`${p.policyNo} - ${p.policyholder}`" />
            </t-select>
          </t-form-item>
          <t-form-item label="买方名称" name="buyerName">
            <t-select v-model="createForm.buyerName" placeholder="请选择买方" clearable>
              <t-option v-for="b in buyerOptions" :key="b" :value="b" :label="b" />
            </t-select>
          </t-form-item>
          <t-form-item label="报案类型" name="claimType">
            <t-select v-model="createForm.claimType" placeholder="请选择理赔类型" clearable>
              <t-option value="bankruptcy" label="破产" />
              <t-option value="arrears" label="拖欠" />
              <t-option value="rejection" label="拒收" />
              <t-option value="political_risk" label="政治风险" />
              <t-option value="goods_damage" label="货物损失" />
              <t-option value="other" label="其他" />
            </t-select>
          </t-form-item>
          <t-form-item label="出险日期" name="lossDate">
            <t-date-picker v-model="createForm.lossDate" placeholder="请选择出险日期" />
          </t-form-item>
          <t-form-item label="预估损失金额" name="estimatedLossAmount">
            <t-input-number v-model="createForm.estimatedLossAmount" :min="0" placeholder="请输入金额" />
          </t-form-item>
          <t-form-item label="损失币种" name="lossCurrency">
            <t-select v-model="createForm.lossCurrency" placeholder="请选择币种" clearable>
              <t-option value="USD" label="USD - 美元" />
              <t-option value="CNY" label="CNY - 人民币" />
              <t-option value="EUR" label="EUR - 欧元" />
            </t-select>
          </t-form-item>
        </div>

        <t-divider>损失情况</t-divider>
        <div class="form-grid">
          <t-form-item label="损失发生地点" name="lossLocation" class="form-item-full">
            <t-input v-model="createForm.lossLocation" placeholder="请输入损失发生地点" />
          </t-form-item>
          <t-form-item label="损失情况描述" name="lossDescription" class="form-item-full">
            <t-textarea v-model="createForm.lossDescription" placeholder="请输入损失情况描述" :autosize="{ minRows: 3, maxRows: 5 }" />
          </t-form-item>
        </div>

        <t-divider>理赔联系人信息</t-divider>
        <div class="form-grid">
          <t-form-item label="理赔联系人" name="claimContact">
            <t-input v-model="createForm.claimContact" placeholder="请输入联系人姓名" />
          </t-form-item>
          <t-form-item label="理赔联系电话" name="claimPhone">
            <t-input v-model="createForm.claimPhone" placeholder="请输入联系电话" />
          </t-form-item>
          <t-form-item label="理赔联系邮箱" name="claimEmail" class="form-item-full">
            <t-input v-model="createForm.claimEmail" placeholder="请输入邮箱" />
          </t-form-item>
          <t-form-item label="收款银行账户信息" name="bankAccount" class="form-item-full">
            <t-input v-model="createForm.bankAccount" placeholder="请输入银行账户信息（用于收取赔款）" />
          </t-form-item>
        </div>

        <t-divider>附件材料（必传）</t-divider>
        <div class="form-grid">
          <t-form-item label="出险通知书/报案表" name="lossNotice" class="form-item-full">
            <t-upload v-model="createForm.lossNotice" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="贸易合同" name="tradeContract" class="form-item-full">
            <t-upload v-model="createForm.tradeContract" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="商业发票" name="commercialInvoice" class="form-item-full">
            <t-upload v-model="createForm.commercialInvoice" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="提单/运单" name="billOfLading" class="form-item-full">
            <t-upload v-model="createForm.billOfLading" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="报关单" name="customsDeclaration" class="form-item-full">
            <t-upload v-model="createForm.customsDeclaration" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="买方收货凭证" name="receiptProof" class="form-item-full">
            <t-upload v-model="createForm.receiptProof" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="损失证明" name="lossProof" class="form-item-full">
            <t-upload v-model="createForm.lossProof" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="追偿授权书" name="recourseAuth" class="form-item-full">
            <t-upload v-model="createForm.recourseAuth" action="https://demo.com/upload" />
          </t-form-item>
        </div>

        <div class="dialog-actions">
          <t-space>
            <t-button variant="outline" @click="createVisible = false">取消</t-button>
            <t-button theme="primary" @click="handleCreateSubmit">提交理赔</t-button>
          </t-space>
        </div>
      </t-form>
    </t-dialog>

    <t-dialog v-model:visible="detailVisible" header="理赔详情" width="650px" :footer="false">
      <detail-panel v-if="currentRow" title="理赔详情" :columns="detailColumns" :data="currentRow" />
    </t-dialog>

    <t-dialog v-model:visible="editVisible" header="编辑理赔" width="650px">
      <t-form ref="editFormRef" :data="editForm" :rules="editRules" label-align="top">
        <div class="form-grid">
          <t-form-item label="理赔单号">
            <t-input :value="currentRow?.claimNo" disabled />
          </t-form-item>
          <t-form-item label="关联保单号" name="relatedPolicyNo">
            <t-select v-model="editForm.relatedPolicyNo" placeholder="请选择保单" clearable>
              <t-option v-for="p in activePolicies" :key="p.policyNo" :value="p.policyNo" :label="p.policyNo" />
            </t-select>
          </t-form-item>
          <t-form-item label="报案类型" name="claimType">
            <t-select v-model="editForm.claimType" placeholder="请选择类型" clearable>
              <t-option value="bankruptcy" label="破产" />
              <t-option value="arrears" label="拖欠" />
              <t-option value="rejection" label="拒收" />
              <t-option value="political_risk" label="政治风险" />
              <t-option value="goods_damage" label="货物损失" />
              <t-option value="other" label="其他" />
            </t-select>
          </t-form-item>
          <t-form-item label="状态" name="status">
            <t-select v-model="editForm.status" placeholder="请选择状态" clearable>
              <t-option value="pending" label="待处理" />
              <t-option value="processing" label="处理中" />
              <t-option value="investigating" label="调查中" />
              <t-option value="supplement" label="补充材料" />
              <t-option value="decided" label="已决定" />
              <t-option value="completed" label="已赔付" />
              <t-option value="rejected" label="已拒赔" />
            </t-select>
          </t-form-item>
          <t-form-item label="预估损失金额" name="estimatedLossAmount">
            <t-input-number v-model="editForm.estimatedLossAmount" :min="0" />
          </t-form-item>
          <t-form-item label="核定赔付金额" name="claimAmount">
            <t-input-number v-model="editForm.claimAmount" :min="0" />
          </t-form-item>
          <t-form-item label="损失描述" name="lossDescription" class="form-item-full">
            <t-textarea v-model="editForm.lossDescription" :autosize="{ minRows: 2, maxRows: 4 }" />
          </t-form-item>
        </div>
        <div class="dialog-actions" style="margin-top: 16px;">
          <t-space>
            <t-button variant="outline" @click="editVisible = false">取消</t-button>
            <t-button theme="primary" @click="handleEditSubmit">保存</t-button>
          </t-space>
        </div>
      </t-form>
    </t-dialog>
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
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'investigating', label: '调查中' },
  { value: 'supplement', label: '补充材料' },
  { value: 'decided', label: '已决定' },
  { value: 'completed', label: '已赔付' },
  { value: 'rejected', label: '已拒赔' },
  { value: 'recourse', label: '追偿中' },
  { value: 'closed', label: '已结案' }
]

const statusMap = {
  pending: '待处理',
  processing: '处理中',
  investigating: '调查中',
  supplement: '补充材料',
  decided: '已决定',
  completed: '已赔付',
  rejected: '已拒赔',
  recourse: '追偿中',
  closed: '已结案'
}

const columns = [
  { colKey: 'claimNo', title: '理赔单号', width: 140 },
  { colKey: 'relatedPolicyNo', title: '保单号', width: 140 },
  { colKey: 'insuranceCompany', title: '保险公司', width: 100 },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'claimType', title: '报案类型', width: 100, slot: 'claimType' },
  { colKey: 'estimatedLossAmount', title: '预估金额', align: 'right' },
  { colKey: 'claimAmount', title: '实际赔付', align: 'right' },
  { colKey: 'lossCurrency', title: '币种', width: 80 },
  { colKey: 'overdueDays', title: '逾期状态', width: 100, slot: 'isOverdue' },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'createTime', title: '报案时间', width: 160 },
  { colKey: 'operation', title: '操作', width: 120, fixed: 'right', slot: 'operation' }
]

const pagination = reactive({ total: 0, current: 1, pageSize: 20 })

const filteredData = computed(() => {
  const list = store.claims || []
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

const claimTotal = computed(() => (store.claims || []).reduce((sum, it) => sum + (Number(it.estimatedLossAmount) || 0), 0))
const completedCount = computed(() => (store.claims || []).filter(c => ['completed', 'rejected', 'closed'].includes(c.status)).length)
const pendingCount = computed(() => (store.claims || []).filter(c => c.status === 'pending').length)

const activePolicies = computed(() => (store.policies || []).filter(p => p.status === 'active'))
const buyerOptions = computed(() => {
  const buyers = new Set()
  ;(store.policies || []).forEach(p => { if (p.insured) buyers.add(p.insured) })
  return Array.from(buyers)
})

const createVisible = ref(false)
const detailVisible = ref(false)
const editVisible = ref(false)
const createFormRef = ref(null)
const editFormRef = ref(null)
const currentRow = ref(null)

const createForm = reactive({
  relatedPolicyNo: '',
  buyerName: '',
  claimType: '',
  lossDate: '',
  estimatedLossAmount: null,
  lossCurrency: 'USD',
  lossLocation: '',
  lossDescription: '',
  claimContact: '',
  claimPhone: '',
  claimEmail: '',
  bankAccount: '',
  lossNotice: [],
  tradeContract: [],
  commercialInvoice: [],
  billOfLading: [],
  customsDeclaration: [],
  receiptProof: [],
  lossProof: [],
  recourseAuth: []
})

const editForm = reactive({
  relatedPolicyNo: '',
  claimType: '',
  status: '',
  estimatedLossAmount: null,
  claimAmount: null,
  lossDescription: ''
})

const createRules = {
  relatedPolicyNo: [{ required: true, message: '请选择关联保单号（必须为有效保单）', type: 'error' }],
  claimType: [{ required: true, message: '请选择报案类型', type: 'error' }],
  lossDescription: [{ required: true, message: '请输入损失情况描述', type: 'error' }],
  estimatedLossAmount: [{ required: true, message: '请输入预估损失金额', type: 'error' }],
  lossDate: [{ required: true, message: '请选择出险日期', type: 'error' }],
  lossNotice: [{ required: true, message: '请上传出险通知书/报案表', type: 'error' }],
  tradeContract: [{ required: true, message: '请上传贸易合同', type: 'error' }],
  commercialInvoice: [{ required: true, message: '请上传商业发票', type: 'error' }],
  billOfLading: [{ required: true, message: '请上传提单/运单', type: 'error' }]
}

const editRules = {
  relatedPolicyNo: [{ required: true, message: '请选择保单', type: 'error' }],
  status: [{ required: true, message: '请选择状态', type: 'error' }]
}

const detailColumns = [
  { label: '理赔单号', key: 'claimNo' },
  { label: '关联保单', key: 'relatedPolicyNo' },
  { label: '保险公司', key: 'insuranceCompany' },
  { label: '买方名称', key: 'buyerName' },
  { label: '报案类型', key: 'claimTypeName' },
  { label: '出险日期', key: 'lossDate' },
  { label: '报案时间', key: 'createTime' },
  { label: '预估损失金额', key: 'estimatedLossAmount', formatter: (v) => `$${Number(v).toLocaleString()}` },
  { label: '实际赔付金额', key: 'claimAmount', formatter: (v) => v ? `$${Number(v).toLocaleString()}` : '-' },
  { label: '损失币种', key: 'lossCurrency' },
  { label: '损失描述', key: 'lossDescription' },
  { label: '案件状态', key: 'statusName' },
  { label: '报案时限', key: 'reportDeadline', formatter: (v) => v || '按保单条款' },
  { label: '调查时限', key: 'investigationDeadline', formatter: (v) => v || '按保单条款' },
  { label: '赔付时限', key: 'paymentDeadline', formatter: (v) => v || '按保单条款' },
  { label: '理赔联系人', key: 'claimContact' },
  { label: '联系电话', key: 'claimPhone' }
]

const getClaimTypeTheme = (type) => {
  const themes = {
    bankruptcy: 'danger',
    arrears: 'warning',
    rejection: 'danger',
    political_risk: 'danger',
    goods_damage: 'warning',
    other: 'default'
  }
  return themes[type] || 'default'
}

const handleSearch = (params) => { searchParams.value = params; pagination.current = 1 }
const handleReset = () => { searchParams.value = { enterpriseName: '', buyerName: '', status: '', dateRange: [] }; pagination.current = 1 }
const handlePageChange = (pageInfo) => { pagination.current = pageInfo.current; pagination.pageSize = pageInfo.pageSize }
const handleAdd = () => {
  Object.assign(createForm, {
    relatedPolicyNo: '',
    buyerName: '',
    claimType: '',
    lossDate: '',
    estimatedLossAmount: null,
    lossCurrency: 'USD',
    lossLocation: '',
    lossDescription: '',
    claimContact: '',
    claimPhone: '',
    claimEmail: '',
    bankAccount: '',
    lossNotice: [],
    tradeContract: [],
    commercialInvoice: [],
    billOfLading: [],
    customsDeclaration: [],
    receiptProof: [],
    lossProof: [],
    recourseAuth: []
  })
  createVisible.value = true
}
const handleView = (row) => {
  currentRow.value = row
  detailVisible.value = true
}
const handleEdit = (row) => {
  currentRow.value = row
  Object.assign(editForm, {
    relatedPolicyNo: row.relatedPolicyNo,
    claimType: row.claimType,
    status: row.status,
    estimatedLossAmount: row.estimatedLossAmount,
    claimAmount: row.claimAmount,
    lossDescription: row.lossDescription
  })
  editVisible.value = true
}

const handleCreateSubmit = async () => {
  const result = await createFormRef.value?.validate?.()
  if (result !== true) return
  const typeNameMap = {
    bankruptcy: '破产',
    arrears: '拖欠',
    rejection: '拒收',
    political_risk: '政治风险',
    goods_damage: '货物损失',
    other: '其他'
  }
  const res = store.createClaim({
    relatedPolicyNo: createForm.relatedPolicyNo,
    claimType: createForm.claimType,
    claimTypeName: typeNameMap[createForm.claimType] || '其他',
    lossDescription: createForm.lossDescription,
    estimatedLossAmount: createForm.estimatedLossAmount,
    lossDate: createForm.lossDate,
    lossCurrency: createForm.lossCurrency,
    lossLocation: createForm.lossLocation,
    claimContact: createForm.claimContact,
    claimPhone: createForm.claimPhone,
    claimEmail: createForm.claimEmail,
    bankAccount: createForm.bankAccount
  })
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '提交失败')
    return
  }
  MessagePlugin.success('理赔已提交')
  createVisible.value = false
}

const handleEditSubmit = async () => {
  const result = await editFormRef.value?.validate?.()
  if (result !== true) return
  if (currentRow.value) {
    Object.assign(currentRow.value, {
      relatedPolicyNo: editForm.relatedPolicyNo,
      claimType: editForm.claimType,
      status: editForm.status,
      estimatedLossAmount: editForm.estimatedLossAmount,
      claimAmount: editForm.claimAmount,
      lossDescription: editForm.lossDescription
    })
    MessagePlugin.success('理赔信息已更新')
  }
  editVisible.value = false
}

onMounted(() => store.ensureSeeded())
</script>

<style lang="scss" scoped>
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.form-item-full { grid-column: 1 / -1; }
.dialog-actions { display: flex; justify-content: center; margin-top: 24px; }
.mb-24 { margin-bottom: 24px; }
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>
