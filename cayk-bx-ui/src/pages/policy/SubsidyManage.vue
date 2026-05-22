<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/policy/list">保单管理</t-breadcrumb-item>
        <t-breadcrumb-item>保费补贴管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">保费补贴管理</div>
      <div class="page-actions">
        <t-button theme="primary" @click="handleAdd">
          <template #icon><t-icon name="add" /></template>
          新增补贴
        </t-button>
      </div>
    </div>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="6">
        <stat-card title="待提交" :value="waitingCount" icon="edit-1" color="default" />
      </t-col>
      <t-col :span="6">
        <stat-card title="审批中" :value="pendingCount" icon="time" color="warning" />
      </t-col>
      <t-col :span="6">
        <stat-card title="已批复" :value="approvedCount" icon="check-circle" color="success" />
      </t-col>
      <t-col :span="6">
        <stat-card title="累计补贴金额" :value="`¥${totalSubsidy.toLocaleString()}`" icon="money" color="success" />
      </t-col>
    </t-row>

    <t-card class="search-card">
      <t-form layout="inline">
        <t-form-item label="企业名称">
          <t-input v-model="searchParams.enterpriseName" placeholder="请输入企业名称" clearable />
        </t-form-item>
        <t-form-item label="状态">
          <t-select v-model="searchParams.status" placeholder="请选择状态" clearable>
            <t-option value="waiting" label="待提交" />
            <t-option value="pending" label="待审批" />
            <t-option value="approved" label="已批复" />
            <t-option value="completed" label="已到账" />
          </t-select>
        </t-form-item>
        <t-form-item>
          <t-space>
            <t-button theme="primary" @click="handleSearch">查询</t-button>
            <t-button variant="outline" @click="handleReset">重置</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-card>

    <t-card>
      <div class="table-header">
        <span class="table-title">补贴申请列表</span>
        <span class="table-count">共 {{ tableData.length }} 条记录</span>
      </div>
      <t-table :data="tableData" :columns="columns" row-key="id" hover stripe>
        <template #status="{ row }">
          <status-tag :status="row.status" :status-map="statusMap" />
        </template>
        <template #subsidyAmount="{ row }">¥{{ (row.subsidyAmount || 0).toLocaleString() }}</template>
        <template #operation="{ row }">
          <t-space>
            <t-link @click="handleView(row)">查看</t-link>
            <t-link v-if="row.status === 'waiting'" @click="handleSubmit(row)">提交</t-link>
            <t-link v-if="row.status === 'pending'" @click="handleProcess(row)">审批</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <t-dialog v-model:visible="viewVisible" header="补贴详情" width="550px" :footer="false">
      <detail-panel v-if="currentRow" title="补贴详情" :columns="detailColumns" :data="currentRow" />
    </t-dialog>

    <t-dialog v-model:visible="processVisible" header="补贴审批" width="550px">
      <t-form ref="processFormRef" :data="processForm" :rules="processRules" label-width="120px" @submit="handleProcessSubmit">
        <t-form-item label="申请编号">
          <t-input :value="currentRow?.id" disabled />
        </t-form-item>
        <t-form-item label="企业名称">
          <t-input :value="currentRow?.enterpriseName" disabled />
        </t-form-item>
        <t-form-item label="关联保单">
          <t-input :value="currentRow?.policyNo" disabled />
        </t-form-item>
        <t-form-item label="补贴类型">
          <t-input :value="currentRow?.subsidyType" disabled />
        </t-form-item>
        <t-form-item label="申请补贴金额">
          <t-input :value="`¥${(currentRow?.subsidyAmount || 0).toLocaleString()}`" disabled />
        </t-form-item>
        <t-divider>审批结果</t-divider>
        <t-form-item label="审批结果" name="result">
          <t-radio-group v-model="processForm.result">
            <t-radio value="approved">批准</t-radio>
            <t-radio value="rejected">驳回</t-radio>
          </t-radio-group>
        </t-form-item>
        <t-form-item label="审批备注" name="remark">
          <t-textarea v-model="processForm.remark" placeholder="请输入审批备注" :autosize="{ minRows: 3, maxRows: 5 }" />
        </t-form-item>
        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit">确认提交</t-button>
            <t-button variant="outline" @click="processVisible = false">取消</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-dialog>

    <t-dialog v-model:visible="addVisible" header="新增补贴申请" width="550px">
      <t-form ref="addFormRef" :data="addForm" :rules="addRules" label-width="120px" @submit="handleAddSubmit">
        <t-form-item label="企业名称" name="enterpriseName">
          <t-input v-model="addForm.enterpriseName" placeholder="请输入企业名称" />
        </t-form-item>
        <t-form-item label="关联保单" name="policyNo">
          <t-input v-model="addForm.policyNo" placeholder="请输入保单号" />
        </t-form-item>
        <t-form-item label="补贴类型" name="subsidyType">
          <t-select v-model="addForm.subsidyType" placeholder="请选择补贴类型">
            <t-option value="保费补贴" label="保费补贴" />
            <t-option value="费率优惠" label="费率优惠" />
          </t-select>
        </t-form-item>
        <t-form-item label="补贴金额" name="subsidyAmount">
          <t-input-number v-model="addForm.subsidyAmount" :min="0" placeholder="请输入补贴金额" />
        </t-form-item>
        <t-form-item label="备注说明">
          <t-textarea v-model="addForm.remark" placeholder="请输入备注" :autosize="{ minRows: 2, maxRows: 4 }" />
        </t-form-item>
        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit">提交</t-button>
            <t-button variant="outline" @click="addVisible = false">取消</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import DetailPanel from '@/components/common/DetailPanel.vue'
import { useBusinessStore } from '@/stores/business'

const store = useBusinessStore()
const searchParams = reactive({ enterpriseName: '', status: '' })

const statusMap = {
  waiting: '待提交',
  pending: '待审批',
  approved: '已批复',
  completed: '已到账'
}

const columns = [
  { colKey: 'id', title: '申请编号', width: 140 },
  { colKey: 'enterpriseName', title: '企业名称', ellipsis: true },
  { colKey: 'policyNo', title: '关联保单', width: 140 },
  { colKey: 'subsidyType', title: '补贴类型', width: 100 },
  { colKey: 'subsidyAmount', title: '补贴金额', align: 'right', slot: 'subsidyAmount' },
  { colKey: 'applicationDate', title: '申请日期', width: 110 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 120, slot: 'operation' }
]

const tableData = computed(() => {
  let data = store.subsidies
  if (searchParams.enterpriseName) {
    data = data.filter(s => s.enterpriseName.includes(searchParams.enterpriseName))
  }
  if (searchParams.status) {
    data = data.filter(s => s.status === searchParams.status)
  }
  return data
})

const totalSubsidy = computed(() => tableData.value.reduce((sum, t) => sum + (t.subsidyAmount || 0), 0))
const waitingCount = computed(() => store.subsidies.filter(s => s.status === 'waiting').length)
const pendingCount = computed(() => store.subsidies.filter(s => s.status === 'pending').length)
const approvedCount = computed(() => store.subsidies.filter(s => s.status === 'approved').length)

const viewVisible = ref(false)
const processVisible = ref(false)
const addVisible = ref(false)
const currentRow = ref(null)
const processFormRef = ref(null)
const addFormRef = ref(null)

const processForm = reactive({
  result: 'approved',
  remark: ''
})

const processRules = {
  result: [{ required: true, message: '请选择审批结果', type: 'error' }]
}

const addForm = reactive({
  enterpriseName: '',
  policyNo: '',
  subsidyType: '保费补贴',
  subsidyAmount: 0,
  remark: ''
})

const addRules = {
  enterpriseName: [{ required: true, message: '请输入企业名称', type: 'error' }],
  policyNo: [{ required: true, message: '请输入保单号', type: 'error' }],
  subsidyAmount: [{ required: true, message: '请输入补贴金额', type: 'error' }]
}

const detailColumns = [
  { label: '申请编号', key: 'id' },
  { label: '企业名称', key: 'enterpriseName' },
  { label: '关联保单', key: 'policyNo' },
  { label: '补贴类型', key: 'subsidyType' },
  { label: '补贴金额', key: 'subsidyAmount' },
  { label: '申请日期', key: 'applicationDate' },
  { label: '审批日期', key: 'approveDate' },
  { label: '备注', key: 'remark' },
  { label: '状态', key: 'status' }
]

const handleSearch = () => { /* computed handles filtering */ }
const handleReset = () => {
  searchParams.enterpriseName = ''
  searchParams.status = ''
}

const handleView = (row) => {
  currentRow.value = row
  viewVisible.value = true
}

const handleSubmit = (row) => {
  const res = store.submitSubsidy(row.id)
  if (res.ok) MessagePlugin.success('补贴申请已提交')
}

const handleProcess = (row) => {
  currentRow.value = row
  processForm.result = 'approved'
  processForm.remark = ''
  processVisible.value = true
}

const handleProcessSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return
  if (processForm.result === 'approved') {
    const r1 = store.approveSubsidy(currentRow.value.id)
    if (r1.ok) MessagePlugin.success('补贴申请已批复')
  } else {
    const r2 = store.rejectSubsidy(currentRow.value.id)
    if (r2.ok) MessagePlugin.warning('补贴申请已驳回')
  }
  processVisible.value = false
}

const handleAdd = () => {
  addForm.enterpriseName = ''
  addForm.policyNo = ''
  addForm.subsidyType = '保费补贴'
  addForm.subsidyAmount = 0
  addForm.remark = ''
  addVisible.value = true
}

const handleAddSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return
  store.createSubsidy({ ...addForm })
  MessagePlugin.success('新增补贴申请成功')
  addVisible.value = false
}

onMounted(() => { store.ensureSeeded() })
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.page-actions { display: flex; gap: 12px; }
.search-card { margin-bottom: 16px; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.table-title { font-size: 16px; font-weight: 600; color: #333; }
.table-count { font-size: 14px; color: #999; }
.mb-16 { margin-bottom: 16px; }
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>
