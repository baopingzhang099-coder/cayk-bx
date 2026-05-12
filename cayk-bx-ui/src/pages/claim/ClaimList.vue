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
      <stat-card title="理赔案件" :value="store.claims.length" icon="first-aid-kit" color="primary" />
      <stat-card title="预估理赔金额" :value="`$${claimTotal.toLocaleString()}`" icon="money" color="warning" />
      <stat-card title="已结案" :value="store.claims.filter(c => c.status === 'completed').length" icon="check-circle" color="success" />
      <stat-card title="待处理" :value="store.claims.filter(c => c.status === 'pending').length" icon="time" color="danger" />
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

    <t-dialog v-model:visible="createVisible" header="新建理赔" width="900px" :footer="false">
      <t-form ref="createFormRef" :data="createForm" :rules="createRules" label-align="top">
        <div class="form-grid">
          <t-form-item label="关联保单号" name="relatedPolicyNo">
            <t-select v-model="createForm.relatedPolicyNo" placeholder="请选择有效保单" clearable>
              <t-option v-for="p in activePolicies" :key="p.policyNo" :value="p.policyNo" :label="p.policyNo" />
            </t-select>
          </t-form-item>
          <t-form-item label="报案类型" name="claimType">
            <t-select v-model="createForm.claimType" placeholder="请选择理赔类型" clearable>
              <t-option value="goods_damage" label="货物损失" />
              <t-option value="buyer_default" label="买方违约" />
              <t-option value="other" label="其他" />
            </t-select>
          </t-form-item>
          <t-form-item label="损失发生日期" name="lossDate">
            <t-date-picker v-model="createForm.lossDate" placeholder="请选择日期" />
          </t-form-item>
          <t-form-item label="预估损失金额" name="estimatedLossAmount">
            <t-input-number v-model="createForm.estimatedLossAmount" :min="0" placeholder="请输入预估损失金额" />
          </t-form-item>
          <t-form-item label="损失发生地点" name="lossLocation" class="form-item-full">
            <t-input v-model="createForm.lossLocation" placeholder="请输入损失发生地点（可选）" />
          </t-form-item>
          <t-form-item label="损失情况描述" name="lossDescription" class="form-item-full">
            <t-textarea v-model="createForm.lossDescription" placeholder="请输入损失情况描述" :autosize="{ minRows: 3, maxRows: 5 }" />
          </t-form-item>
          <t-form-item label="证据材料（照片/单据等）" name="evidenceMaterials" class="form-item-full">
            <t-upload v-model="createForm.evidenceMaterials" action="https://demo.com/upload" tips="必传：照片/单据等" />
          </t-form-item>
          <t-form-item label="相关文件（提单/发票/合同等）" name="relevantDocuments" class="form-item-full">
            <t-upload v-model="createForm.relevantDocuments" action="https://demo.com/upload" tips="必传：提单/发票/合同等" />
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
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import SearchFilter from '@/components/common/SearchFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import { useBusinessStore } from '@/stores/business'

const store = useBusinessStore()
const loading = computed(() => false)
const searchParams = ref({ enterpriseName: '', buyerName: '', status: '', dateRange: [] })

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
  { colKey: 'claimTypeName', title: '报案类型' },
  { colKey: 'estimatedLossAmount', title: '预估金额', align: 'right' },
  { colKey: 'claimAmount', title: '实际赔付', align: 'right' },
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

const createVisible = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  relatedPolicyNo: '',
  claimType: '',
  lossDescription: '',
  estimatedLossAmount: null,
  lossDate: '',
  lossLocation: '',
  evidenceMaterials: [],
  relevantDocuments: []
})

const activePolicies = computed(() => (store.policies || []).filter(p => p.status === 'active'))

const createRules = {
  relatedPolicyNo: [{ required: true, message: '请选择关联保单号（必须为有效保单）', trigger: 'change' }],
  claimType: [{ required: true, message: '请选择报案类型', trigger: 'change' }],
  lossDescription: [{ required: true, message: '请输入损失情况描述', trigger: 'blur' }],
  estimatedLossAmount: [{ required: true, message: '请输入预估损失金额', trigger: 'blur' }],
  lossDate: [{ required: true, message: '请选择损失发生日期', trigger: 'change' }],
  evidenceMaterials: [{ required: true, message: '请上传证据材料', trigger: 'change' }],
  relevantDocuments: [{ required: true, message: '请上传相关文件', trigger: 'change' }]
}

const handleSearch = (params) => { searchParams.value = params; pagination.current = 1 }
const handleReset = () => { searchParams.value = { enterpriseName: '', buyerName: '', status: '', dateRange: [] }; pagination.current = 1 }
const handlePageChange = (pageInfo) => { pagination.current = pageInfo.current; pagination.pageSize = pageInfo.pageSize }
const handleAdd = () => { createVisible.value = true }
const handleView = (row) => console.log('view:', row)
const handleEdit = (row) => console.log('edit:', row)

const handleCreateSubmit = async () => {
  const result = await createFormRef.value?.validate?.()
  if (result !== true) return
  const typeNameMap = {
    goods_damage: '货物损失',
    buyer_default: '买方违约',
    other: '其他'
  }
  const res = store.createClaim({
    relatedPolicyNo: createForm.relatedPolicyNo,
    claimType: createForm.claimType,
    claimTypeName: typeNameMap[createForm.claimType] || '其他',
    lossDescription: createForm.lossDescription,
    estimatedLossAmount: createForm.estimatedLossAmount,
    lossDate: createForm.lossDate,
    lossLocation: createForm.lossLocation,
    evidenceMaterials: createForm.evidenceMaterials,
    relevantDocuments: createForm.relevantDocuments
  })
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '提交失败')
    return
  }
  MessagePlugin.success('理赔已提交')
  createVisible.value = false
  Object.assign(createForm, {
    relatedPolicyNo: '',
    claimType: '',
    lossDescription: '',
    estimatedLossAmount: null,
    lossDate: '',
    lossLocation: '',
    evidenceMaterials: [],
    relevantDocuments: []
  })
}

onMounted(() => store.ensureSeeded())
</script>

<style lang="scss" scoped>
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.form-item-full { grid-column: 1 / -1; }
.dialog-actions { display: flex; justify-content: center; margin-top: 16px; }
</style>
