<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">理赔流程管理</div>
    </div>

    <t-card class="search-card">
      <t-form layout="inline">
        <t-form-item label="理赔单号">
          <t-input v-model="searchParams.claimNo" placeholder="请输入理赔单号" clearable />
        </t-form-item>
        <t-form-item label="当前节点">
          <t-select v-model="searchParams.currentNode" placeholder="请选择节点" clearable>
            <t-option v-for="item in nodeOptions" :key="item.value" :value="item.value" :label="item.label" />
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

    <div class="stats-grid mb-16">
      <stat-card title="待提交资料" :value="3" icon="edit-1" color="warning" />
      <stat-card title="调查中" :value="5" icon="search" color="primary" />
      <stat-card title="核损定损中" :value="2" icon="calculator" color="primary" />
      <stat-card title="待支付赔款" :value="1" icon="money" color="danger" />
    </div>

    <t-card>
      <div class="table-header">
        <span class="table-title">理赔流程列表</span>
        <span class="table-count">共 {{ pagination.total }} 条记录</span>
      </div>
      <t-table :data="tableData" :columns="columns" :loading="loading" row-key="id" hover stripe>
        <template #status="{ row }">
          <status-tag :status="row.status" :status-map="statusMap" />
        </template>
        <template #currentNode="{ row }">
          <t-tag :theme="getNodeTheme(row.nodeIndex)">{{ row.currentNode }}</t-tag>
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-link @click="handleView(row)">查看</t-link>
            <t-link @click="handleProcess(row)">处理</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <t-dialog v-model:visible="detailVisible" header="理赔流程详情" width="800px" :footer="false">
      <t-steps :current="currentProcess?.nodeIndex || 0" layout="vertical" status="process">
        <t-step-item v-for="(step, index) in processSteps" :key="index" :title="step.title" :content="step.content" />
      </t-steps>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'

const loading = ref(false)
const detailVisible = ref(false)
const currentProcess = ref(null)

const searchParams = reactive({ claimNo: '', currentNode: '' })

const nodeOptions = [
  { value: 'report', label: '理赔报案' },
  { value: 'material', label: '资料移交' },
  { value: 'investigate', label: '审核调查' },
  { value: 'assess', label: '核损定损' },
  { value: 'decide', label: '理赔决定' },
  { value: 'pay', label: '赔款支付' }
]

const statusMap = {
  processing: '处理中',
  completed: '已完成',
  pending: '待处理'
}

const processSteps = [
  { title: '理赔报案', content: '客户提交可能损失通知书' },
  { title: '理赔申请', content: '提交理赔资料清单' },
  { title: '资料移交', content: '移交审核资料至保险公司' },
  { title: '审核调查', content: '保险公司进行理赔审核调查' },
  { title: '核损定损', content: '核定损失金额' },
  { title: '理赔决定', content: '保险公司出具理赔决定书' },
  { title: '赔款支付', content: '支付赔款至被保险人' }
]

const columns = [
  { colKey: 'claimNo', title: '理赔单号', width: 140 },
  { colKey: 'policyNo', title: '保单号' },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'claimType', title: '报案类型' },
  { colKey: 'currentNode', title: '当前节点', width: 120, slot: 'currentNode' },
  { colKey: 'claimAmount', title: '理赔金额', align: 'right' },
  { colKey: 'updateTime', title: '更新时间', width: 160 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 120, slot: 'operation' }
]

const tableData = ref([])
const pagination = reactive({ total: 0, current: 1, pageSize: 20 })

const getNodeTheme = (nodeIndex) => {
  if (nodeIndex < 3) return 'primary'
  if (nodeIndex < 5) return 'warning'
  return 'success'
}

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = [
      { id: 1, claimNo: 'CL2026050801', policyNo: 'PI2026001234', buyerName: 'ABC Corporation', claimType: '货物损失', currentNode: '审核调查', nodeIndex: 3, claimAmount: 50000, updateTime: '2026-05-10 14:30', status: 'processing' },
      { id: 2, claimNo: 'CL2026050602', policyNo: 'PI2026001235', buyerName: 'DEF GmbH', claimType: '买方违约', currentNode: '核损定损', nodeIndex: 4, claimAmount: 30000, updateTime: '2026-05-09 10:20', status: 'processing' },
      { id: 3, claimNo: 'CL2026050503', policyNo: 'PI2025000987', buyerName: 'GHI Ltd', claimType: '货物损失', currentNode: '理赔决定', nodeIndex: 5, claimAmount: 80000, updateTime: '2026-05-08 16:45', status: 'processing' },
      { id: 4, claimNo: 'CL2026050304', policyNo: 'PI2025000765', buyerName: 'JKL Co', claimType: '其他', currentNode: '资料移交', nodeIndex: 2, claimAmount: 20000, updateTime: '2026-05-07 09:30', status: 'processing' }
    ]
    pagination.total = 4
    loading.value = false
  }, 300)
}

const handleSearch = () => fetchData()
const handleReset = () => fetchData()
const handleView = (row) => { currentProcess.value = row; detailVisible.value = true }
const handleProcess = (row) => console.log('process:', row)

onMounted(() => fetchData())
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.search-card { margin-bottom: 16px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.table-title { font-size: 16px; font-weight: 600; color: #333; }
.table-count { font-size: 14px; color: #999; }
.mb-16 { margin-bottom: 16px; }
</style>
