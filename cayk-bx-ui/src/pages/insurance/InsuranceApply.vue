<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">投保流程管理</div>
    </div>

    <t-card class="search-card">
      <t-form layout="inline">
        <t-form-item label="投保编号">
          <t-input v-model="searchParams.id" placeholder="请输入投保编号" clearable />
        </t-form-item>
        <t-form-item label="当前节点">
          <t-select v-model="searchParams.currentNode" placeholder="请选择节点" clearable>
            <t-option v-for="item in nodeOptions" :key="item.value" :value="item.value" :label="item.label" />
          </t-select>
        </t-form-item>
        <t-form-item label="处理人">
          <t-input v-model="searchParams.handler" placeholder="请输入处理人" clearable />
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
      <stat-card title="待提交" :value="5" icon="send" color="warning" />
      <stat-card title="资信调查中" :value="8" icon="search" color="primary" />
      <stat-card title="限额审批中" :value="3" icon="approval" color="primary" />
      <stat-card title="核保中" :value="2" icon="lock-on" color="primary" />
    </div>

    <t-card>
      <div class="table-header">
        <span class="table-title">投保流程列表</span>
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

    <t-dialog v-model:visible="detailVisible" header="流程详情" width="800px" :footer="false">
      <t-steps :current="currentProcess?.nodeIndex || 0" layout="vertical" status="process">
        <t-step-item v-for="(step, index) in processSteps" :key="index" :title="step.title" :content="step.content" :status="index < (currentProcess?.nodeIndex || 0) ? 'finish' : index === currentProcess?.nodeIndex ? 'process' : 'wait'" />
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

const searchParams = reactive({ id: '', currentNode: '', handler: '' })

const nodeOptions = [
  { value: 'submit', label: '提交投保' },
  { value: 'credit', label: '资信调查' },
  { value: 'limit', label: '限额审批' },
  { value: 'underwrite', label: '核保' },
  { value: 'payment', label: '支付保费' }
]

const statusMap = {
  processing: '进行中',
  completed: '已完成',
  pending: '待处理'
}

const processSteps = [
  { title: '提交投保申请', content: '客户提交投保申请书、买方信息采集表' },
  { title: '资料审核', content: '跟单员审核客户提交资料的完整性和规范性' },
  { title: '资信调查', content: '保险公司对买方进行资信调查（1个月）' },
  { title: '信用限额审批', content: '保险公司核准买方信用限额（2周）' },
  { title: '信保核保', content: '保险公司进行信保核保' },
  { title: '保单签发', content: '保险公司出具保单' },
  { title: '保费支付', content: '客户支付保费，保单生效' }
]

const columns = [
  { colKey: 'id', title: '投保编号', width: 130 },
  { colKey: 'enterpriseName', title: '企业名称', ellipsis: true },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'currentNode', title: '当前节点', width: 140, slot: 'currentNode' },
  { colKey: 'handler', title: '处理人' },
  { colKey: 'updateTime', title: '更新时间', width: 160 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 120, slot: 'operation' }
]

const tableData = ref([])

const getNodeTheme = (nodeIndex) => {
  if (nodeIndex < 3) return 'primary'
  if (nodeIndex < 5) return 'warning'
  return 'success'
}

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = [
      { id: 'TB2026001', enterpriseName: '深圳XX国际贸易有限公司', buyerName: 'ABC Corporation', currentNode: '资信调查', nodeIndex: 2, handler: '李明', updateTime: '2026-05-08 14:30', status: 'processing' },
      { id: 'TB2026002', enterpriseName: '上海YY进出口公司', buyerName: 'DEF GmbH', currentNode: '限额审批', nodeIndex: 3, handler: '王芳', updateTime: '2026-05-07 10:20', status: 'processing' },
      { id: 'TB2026003', enterpriseName: '北京ZZ贸易集团', buyerName: 'GHI Ltd', currentNode: '核保', nodeIndex: 4, handler: '张伟', updateTime: '2026-05-06 16:45', status: 'processing' },
      { id: 'TB2026004', enterpriseName: '广州AA实业公司', buyerName: 'JKL Co', currentNode: '资料审核', nodeIndex: 1, handler: '李明', updateTime: '2026-05-05 09:30', status: 'processing' },
      { id: 'TB2026005', enterpriseName: '深圳BB贸易公司', buyerName: 'MNO Inc', currentNode: '保费支付', nodeIndex: 6, handler: '陈静', updateTime: '2026-05-04 11:00', status: 'pending' }
    ]
    pagination.total = 5
    loading.value = false
  }, 300)
}

const pagination = reactive({ total: 5, current: 1, pageSize: 20 })

const handleSearch = () => fetchData()
const handleReset = () => fetchData()
const handleView = (row) => { currentProcess.value = row; detailVisible.value = true }
const handleProcess = (row) => { console.log('process:', row) }

onMounted(() => { fetchData() })
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
