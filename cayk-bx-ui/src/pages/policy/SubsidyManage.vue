<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">保费补贴管理</div>
    </div>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="6">
        <stat-card title="申请中" :value="pendingCount" icon="edit-1" color="warning" />
      </t-col>
      <t-col :span="6">
        <stat-card title="已审批" :value="approvedCount" icon="check-circle" color="success" />
      </t-col>
      <t-col :span="6">
        <stat-card title="待发放" :value="waitingCount" icon="wallet" color="primary" />
      </t-col>
      <t-col :span="6">
        <stat-card title="累计补贴金额" :value="`$${totalSubsidy.toLocaleString()}`" icon="money" color="success" />
      </t-col>
    </t-row>

    <t-card class="search-card">
      <t-form layout="inline">
        <t-form-item label="企业名称">
          <t-input v-model="searchParams.enterpriseName" placeholder="请输入企业名称" clearable />
        </t-form-item>
        <t-form-item label="状态">
          <t-select v-model="searchParams.status" placeholder="请选择状态" clearable>
            <t-option value="pending" label="申请中" />
            <t-option value="approved" label="已审批" />
            <t-option value="waiting" label="待发放" />
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
        <span class="table-count">共 {{ pagination.total }} 条记录</span>
      </div>
      <t-table :data="tableData" :columns="columns" :loading="loading" row-key="id" hover stripe>
        <template #status="{ row }">
          <status-tag :status="row.status" :status-map="statusMap" />
        </template>
        <template #subsidyAmount="{ row }">¥{{ (row.subsidyAmount || 0).toLocaleString() }}</template>
        <template #operation="{ row }">
          <t-space>
            <t-link @click="handleView(row)">查看</t-link>
            <t-link v-if="row.status === 'pending'" @click="handleProcess(row)">处理</t-link>
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
          <t-input :value="currentRow?.applicationNo" disabled />
        </t-form-item>
        <t-form-item label="企业名称">
          <t-input :value="currentRow?.enterpriseName" disabled />
        </t-form-item>
        <t-form-item label="关联保单">
          <t-input :value="currentRow?.policyNo" disabled />
        </t-form-item>
        <t-form-item label="保费金额">
          <t-input :value="`¥${(currentRow?.premiumAmount || 0).toLocaleString()}`" disabled />
        </t-form-item>
        <t-form-item label="申请补贴金额">
          <t-input :value="`¥${(currentRow?.subsidyAmount || 0).toLocaleString()}`" disabled />
        </t-form-item>
        <t-form-item label="补贴比例">
          <t-input :value="currentRow?.subsidyRate" disabled />
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
        <t-form-item label="实际发放金额" name="actualAmount">
          <t-input-number v-model="processForm.actualAmount" :min="0" placeholder="请输入实际发放金额" />
        </t-form-item>
        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit">确认提交</t-button>
            <t-button variant="outline" @click="processVisible = false">取消</t-button>
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

const loading = ref(false)
const searchParams = reactive({ enterpriseName: '', status: '' })
const pagination = reactive({ total: 0, current: 1, pageSize: 20 })

const statusMap = {
  pending: '申请中',
  approved: '已审批',
  waiting: '待发放',
  completed: '已到账'
}

const columns = [
  { colKey: 'applicationNo', title: '申请编号', width: 140 },
  { colKey: 'enterpriseName', title: '企业名称', ellipsis: true },
  { colKey: 'policyNo', title: '关联保单', width: 140 },
  { colKey: 'premiumAmount', title: '保费金额', align: 'right' },
  { colKey: 'subsidyAmount', title: '补贴金额', align: 'right' },
  { colKey: 'subsidyRate', title: '补贴比例', align: 'center' },
  { colKey: 'region', title: '所属区域' },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 120, slot: 'operation' }
]

const tableData = ref([])

const pendingCount = computed(() => tableData.value.filter(t => t.status === 'pending').length)
const approvedCount = computed(() => tableData.value.filter(t => t.status === 'approved').length)
const waitingCount = computed(() => tableData.value.filter(t => t.status === 'waiting').length)
const totalSubsidy = computed(() => tableData.value.reduce((sum, t) => sum + (t.subsidyAmount || 0), 0))

const viewVisible = ref(false)
const processVisible = ref(false)
const currentRow = ref(null)
const processFormRef = ref(null)
const processForm = reactive({
  result: 'approved',
  remark: '',
  actualAmount: 0
})

const processRules = {
  result: [{ required: true, message: '请选择审批结果', type: 'error' }],
  actualAmount: [{ required: true, message: '请输入实际发放金额', type: 'error' }]
}

const detailColumns = [
  { label: '申请编号', key: 'applicationNo' },
  { label: '企业名称', key: 'enterpriseName' },
  { label: '关联保单', key: 'policyNo' },
  { label: '保费金额', key: 'premiumAmount' },
  { label: '补贴金额', key: 'subsidyAmount' },
  { label: '补贴比例', key: 'subsidyRate' },
  { label: '所属区域', key: 'region' },
  { label: '状态', key: 'status' }
]

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = [
      { id: 1, applicationNo: 'SUB2026001', enterpriseName: '深圳XX国际贸易有限公司', policyNo: 'PI2026001234', premiumAmount: 12500, subsidyAmount: 3750, subsidyRate: '30%', region: '深圳市南山区', status: 'completed' },
      { id: 2, applicationNo: 'SUB2026002', enterpriseName: '上海YY进出口公司', policyNo: 'PI2026001235', premiumAmount: 8000, subsidyAmount: 2400, subsidyRate: '30%', region: '上海市浦东新区', status: 'waiting' },
      { id: 3, applicationNo: 'SUB2026003', enterpriseName: '北京ZZ贸易集团', policyNo: 'PI2025000987', premiumAmount: 20000, subsidyAmount: 6000, subsidyRate: '30%', region: '北京市朝阳区', status: 'approved' },
      { id: 4, applicationNo: 'SUB2026004', enterpriseName: '广州AA实业公司', policyNo: 'PI2025000765', premiumAmount: 15000, subsidyAmount: 4500, subsidyRate: '30%', region: '广州市天河区', status: 'pending' }
    ]
    pagination.total = 4
    loading.value = false
  }, 300)
}

const handleSearch = () => fetchData()
const handleReset = () => {
  searchParams.enterpriseName = ''
  searchParams.status = ''
  fetchData()
}
const handleView = (row) => {
  currentRow.value = row
  viewVisible.value = true
}
const handleProcess = (row) => {
  currentRow.value = row
  processForm.actualAmount = row.subsidyAmount
  processForm.result = 'approved'
  processForm.remark = ''
  processVisible.value = true
}

const handleProcessSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return
  const idx = tableData.value.findIndex(t => t.id === currentRow.value.id)
  if (idx >= 0) {
    if (processForm.result === 'approved') {
      tableData.value[idx].status = 'waiting'
      tableData.value[idx].actualAmount = processForm.actualAmount
      MessagePlugin.success('补贴申请已批准，进入待发放状态')
    } else {
      tableData.value[idx].status = 'rejected'
      MessagePlugin.warning('补贴申请已驳回')
    }
  }
  processVisible.value = false
}

onMounted(() => fetchData())
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.search-card { margin-bottom: 16px; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.table-title { font-size: 16px; font-weight: 600; color: #333; }
.table-count { font-size: 14px; color: #999; }
.mb-16 { margin-bottom: 16px; }
</style>
