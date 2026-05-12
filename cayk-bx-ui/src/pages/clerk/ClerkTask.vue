<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">业务管理</div>
    </div>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="6">
        <stat-card title="待分配任务" :value="pendingCount" icon="task" color="warning" />
      </t-col>
      <t-col :span="6">
        <stat-card title="处理中任务" :value="processingCount" icon="loading" color="primary" />
      </t-col>
      <t-col :span="6">
        <stat-card title="今日完成" :value="completedCount" icon="check-circle" color="success" />
      </t-col>
      <t-col :span="6">
        <stat-card title="超时预警" :value="overdueCount" icon="alarm" color="danger" />
      </t-col>
    </t-row>

    <t-card class="mb-16">
      <div class="table-header">
        <span class="table-title">任务列表</span>
        <t-space>
          <t-button theme="primary" @click="handleAssign">
            <template #icon><t-icon name="add" /></template>
            分配任务
          </t-button>
          <t-button variant="outline" @click="handleGrab">
            <template #icon><t-icon name="lock-on" /></template>
            抢单
          </t-button>
        </t-space>
      </div>
      <t-table :data="tableData" :columns="columns" row-key="id" hover stripe>
        <template #priority="{ row }">
          <t-tag :theme="row.priority === 'high' ? 'danger' : row.priority === 'medium' ? 'warning' : 'default'">
            {{ row.priority === 'high' ? '紧急' : row.priority === 'medium' ? '重要' : '普通' }}
          </t-tag>
        </template>
        <template #status="{ row }">
          <status-tag :status="row.status" :status-map="statusMap" />
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-link @click="handleView(row)">查看</t-link>
            <t-link v-if="row.status === 'pending'" @click="handleGrabOne(row)">抢单</t-link>
            <t-link v-if="row.status !== 'completed'" @click="handleReassign(row)">改派</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <t-card title="任务分配记录">
      <t-table :data="assignData" :columns="assignColumns" row-key="id" hover>
        <template #status="{ row }">
          <status-tag :status="row.status" :status-map="statusMap" />
        </template>
      </t-table>
    </t-card>

    <t-drawer v-model:visible="assignVisible" header="任务分配" size="700px">
      <t-form ref="assignFormRef" :data="assignForm" :rules="assignRules" label-width="100px" @submit="handleAssignSubmit">
        <t-form-item label="任务编号">
          <t-input :value="currentRow?.taskNo" disabled />
        </t-form-item>
        <t-form-item label="任务类型" name="taskType">
          <t-select v-model="assignForm.taskType" placeholder="请选择任务类型" clearable>
            <t-option value="投保跟进" label="投保跟进" />
            <t-option value="限额申请" label="限额申请" />
            <t-option value="出运申报" label="出运申报" />
            <t-option value="理赔跟进" label="理赔跟进" />
            <t-option value="保单变更" label="保单变更" />
            <t-option value="续保跟进" label="续保跟进" />
          </t-select>
        </t-form-item>
        <t-form-item label="客户名称" name="customerName">
          <t-input v-model="assignForm.customerName" placeholder="请输入客户名称" />
        </t-form-item>
        <t-form-item label="买方名称" name="buyerName">
          <t-input v-model="assignForm.buyerName" placeholder="请输入买方名称" />
        </t-form-item>
        <t-form-item label="任务描述" name="description">
          <t-textarea v-model="assignForm.description" placeholder="请输入任务描述" :autosize="{ minRows: 3, maxRows: 5 }" />
        </t-form-item>
        <t-form-item label="优先级" name="priority">
          <t-select v-model="assignForm.priority" placeholder="请选择优先级" clearable>
            <t-option value="high" label="紧急" />
            <t-option value="medium" label="重要" />
            <t-option value="normal" label="普通" />
          </t-select>
        </t-form-item>
        <t-form-item label="截止时间" name="deadline">
          <t-date-picker v-model="assignForm.deadline" placeholder="请选择截止时间" clearable />
        </t-form-item>
        <t-form-item label="接收人" name="assignee">
          <t-select v-model="assignForm.assignee" placeholder="请选择接收人" clearable>
            <t-option v-for="clerk in clerkList" :key="clerk.id" :value="clerk.name" :label="`${clerk.name} (${clerk.department})`" />
          </t-select>
        </t-form-item>
        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit">确认分配</t-button>
            <t-button variant="outline" @click="assignVisible = false">取消</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-drawer>

    <t-drawer v-model:visible="viewVisible" header="任务详情" size="700px" :footer="false">
      <detail-panel v-if="currentRow" title="任务详情" :columns="taskDetailColumns" :data="currentRow" />
    </t-drawer>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import DetailPanel from '@/components/common/DetailPanel.vue'

const statusMap = {
  pending: '待接单',
  processing: '处理中',
  completed: '已完成',
  overdue: '已超时'
}

const columns = [
  { colKey: 'taskNo', title: '任务编号', width: 130 },
  { colKey: 'taskType', title: '任务类型', width: 100 },
  { colKey: 'customerName', title: '客户名称' },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'description', title: '任务描述', ellipsis: true },
  { colKey: 'priority', title: '优先级', width: 80, slot: 'priority' },
  { colKey: 'deadline', title: '截止时间', width: 110 },
  { colKey: 'assignee', title: '处理人', width: 80 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 150, slot: 'operation' }
]

const assignColumns = [
  { colKey: 'taskNo', title: '任务编号', width: 130 },
  { colKey: 'customerName', title: '客户名称' },
  { colKey: 'taskType', title: '任务类型', width: 100 },
  { colKey: 'assignor', title: '分配人', width: 80 },
  { colKey: 'assignee', title: '接收人', width: 80 },
  { colKey: 'assignTime', title: '分配时间', width: 160 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' }
]

const taskDetailColumns = [
  { label: '任务编号', key: 'taskNo' },
  { label: '任务类型', key: 'taskType' },
  { label: '客户名称', key: 'customerName' },
  { label: '买方名称', key: 'buyerName' },
  { label: '任务描述', key: 'description' },
  { label: '优先级', key: 'priority' },
  { label: '截止时间', key: 'deadline' },
  { label: '处理人', key: 'assignee' },
  { label: '状态', key: 'status' }
]

const clerkList = ref([
  { id: 1, name: '李明', department: '业务部' },
  { id: 2, name: '王芳', department: '业务部' },
  { id: 3, name: '张伟', department: '客服部' },
  { id: 4, name: '陈静', department: '业务部' }
])

const tableData = ref([
  { id: 1, taskNo: 'T2026051201', taskType: '投保跟进', customerName: '深圳XX国际贸易有限公司', buyerName: 'ABC Corporation', description: '买方资信调查结果跟进', priority: 'high', deadline: '2026-05-13', assignee: '李明', status: 'processing', assignor: '系统' },
  { id: 2, taskNo: 'T2026051202', taskType: '限额申请', customerName: '上海YY进出口公司', buyerName: 'DEF GmbH', description: '新增买方信用限额申请', priority: 'medium', deadline: '2026-05-14', assignee: '王芳', status: 'processing', assignor: '张经理' },
  { id: 3, taskNo: 'T2026051203', taskType: '出运申报', customerName: '北京ZZ贸易集团', buyerName: 'GHI Ltd', description: '5月出运申报资料整理', priority: 'normal', deadline: '2026-05-15', assignee: null, status: 'pending', assignor: null },
  { id: 4, taskNo: 'T2026051104', taskType: '理赔跟进', customerName: '广州AA实业公司', buyerName: 'JKL Co', description: '货物损失案件调查跟进', priority: 'high', deadline: '2026-05-11', assignee: '张伟', status: 'overdue', assignor: '系统' }
])

const assignData = ref([
  { id: 1, taskNo: 'T2026051201', customerName: '深圳XX国际贸易有限公司', taskType: '投保跟进', assignor: '系统', assignee: '李明', assignTime: '2026-05-12 09:00:00', status: 'processing' },
  { id: 2, taskNo: 'T2026051202', customerName: '上海YY进出口公司', taskType: '限额申请', assignor: '张经理', assignee: '王芳', assignTime: '2026-05-12 10:30:00', status: 'processing' },
  { id: 3, taskNo: 'T2026051103', customerName: '北京ZZ贸易集团', taskType: '出运申报', assignor: '系统', assignee: '张伟', assignTime: '2026-05-11 14:00:00', status: 'completed' }
])

const pendingCount = computed(() => tableData.value.filter(t => t.status === 'pending').length)
const processingCount = computed(() => tableData.value.filter(t => t.status === 'processing').length)
const completedCount = computed(() => tableData.value.filter(t => t.status === 'completed').length)
const overdueCount = computed(() => tableData.value.filter(t => t.status === 'overdue').length)

const assignVisible = ref(false)
const viewVisible = ref(false)
const currentRow = ref(null)
const assignFormRef = ref(null)
const assignForm = reactive({
  taskType: '',
  customerName: '',
  buyerName: '',
  description: '',
  priority: 'normal',
  deadline: '',
  assignee: ''
})

const assignRules = {
  taskType: [{ required: true, message: '请选择任务类型', type: 'error' }],
  customerName: [{ required: true, message: '请输入客户名称', type: 'error' }],
  assignee: [{ required: true, message: '请选择接收人', type: 'error' }]
}

const handleAssign = () => {
  currentRow.value = null
  Object.assign(assignForm, {
    taskType: '',
    customerName: '',
    buyerName: '',
    description: '',
    priority: 'normal',
    deadline: '',
    assignee: ''
  })
  assignVisible.value = true
}

const handleView = (row) => {
  currentRow.value = row
  viewVisible.value = true
}

const handleGrab = () => {
  const pendingTasks = tableData.value.filter(t => t.status === 'pending')
  if (pendingTasks.length === 0) {
    MessagePlugin.warning('暂无可抢任务')
    return
  }
  const task = pendingTasks[0]
  task.assignee = '当前用户'
  task.status = 'processing'
  assignData.value.unshift({
    id: Date.now(),
    taskNo: task.taskNo,
    customerName: task.customerName,
    taskType: task.taskType,
    assignor: '当前用户',
    assignee: '当前用户',
    assignTime: new Date().toLocaleString(),
    status: 'processing'
  })
  MessagePlugin.success(`成功抢单：${task.taskNo}`)
}

const handleGrabOne = (row) => {
  row.assignee = '当前用户'
  row.status = 'processing'
  assignData.value.unshift({
    id: Date.now(),
    taskNo: row.taskNo,
    customerName: row.customerName,
    taskType: row.taskType,
    assignor: '当前用户',
    assignee: '当前用户',
    assignTime: new Date().toLocaleString(),
    status: 'processing'
  })
  MessagePlugin.success(`成功抢单：${row.taskNo}`)
}

const handleReassign = (row) => {
  currentRow.value = row
  Object.assign(assignForm, {
    taskType: row.taskType,
    customerName: row.customerName,
    buyerName: row.buyerName,
    description: row.description,
    priority: row.priority,
    deadline: row.deadline,
    assignee: ''
  })
  assignVisible.value = true
}

const handleAssignSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return
  const priorityLabels = { high: '紧急', medium: '重要', normal: '普通' }
  if (currentRow.value) {
    const oldAssignee = currentRow.value.assignee
    Object.assign(currentRow.value, {
      taskType: assignForm.taskType,
      customerName: assignForm.customerName,
      buyerName: assignForm.buyerName,
      description: assignForm.description,
      priority: assignForm.priority,
      deadline: assignForm.deadline,
      assignee: assignForm.assignee
    })
    assignData.value.unshift({
      id: Date.now(),
      taskNo: currentRow.value.taskNo,
      customerName: currentRow.value.customerName,
      taskType: currentRow.value.taskType,
      assignor: '当前用户',
      assignee: assignForm.assignee,
      assignTime: new Date().toLocaleString(),
      status: currentRow.value.status
    })
    MessagePlugin.success(`任务已改派给 ${assignForm.assignee}`)
  } else {
    const newTask = {
      id: Date.now(),
      taskNo: `T${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
      taskType: assignForm.taskType,
      customerName: assignForm.customerName,
      buyerName: assignForm.buyerName,
      description: assignForm.description,
      priority: assignForm.priority,
      deadline: assignForm.deadline,
      assignee: assignForm.assignee,
      status: 'processing',
      assignor: '当前用户'
    }
    tableData.value.unshift(newTask)
    assignData.value.unshift({
      id: Date.now(),
      taskNo: newTask.taskNo,
      customerName: newTask.customerName,
      taskType: newTask.taskType,
      assignor: '当前用户',
      assignee: assignForm.assignee,
      assignTime: new Date().toLocaleString(),
      status: 'processing'
    })
    MessagePlugin.success('任务分配成功')
  }
  assignVisible.value = false
}
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.mb-16 { margin-bottom: 16px; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.table-title { font-size: 16px; font-weight: 600; color: #333; }
</style>
