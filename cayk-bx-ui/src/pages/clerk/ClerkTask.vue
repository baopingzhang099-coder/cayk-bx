<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">业务管理</div>
    </div>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="6">
        <stat-card title="待分配任务" :value="15" icon="task" color="warning" />
      </t-col>
      <t-col :span="6">
        <stat-card title="处理中任务" :value="28" icon="loading" color="primary" />
      </t-col>
      <t-col :span="6">
        <stat-card title="今日完成" :value="12" icon="check-circle" color="success" />
      </t-col>
      <t-col :span="6">
        <stat-card title="超时预警" :value="3" icon="alarm" color="danger" />
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
            <template #icon><t-icon name="抢" /></template>
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'

const statusMap = {
  pending: '待接单',
  processing: '处理中',
  completed: '已完成',
  overdue: '已超时'
}

const columns = [
  { colKey: 'taskNo', title: '任务编号', width: 130 },
  { colKey: 'taskType', title: '任务类型', width: 120 },
  { colKey: 'customerName', title: '客户名称' },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'description', title: '任务描述', ellipsis: true },
  { colKey: 'priority', title: '优先级', width: 80, slot: 'priority' },
  { colKey: 'deadline', title: '截止时间', width: 120 },
  { colKey: 'assignee', title: '处理人' },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 120, slot: 'operation' }
]

const assignColumns = [
  { colKey: 'taskNo', title: '任务编号', width: 130 },
  { colKey: 'customerName', title: '客户名称' },
  { colKey: 'taskType', title: '任务类型', width: 120 },
  { colKey: 'assignor', title: '分配人' },
  { colKey: 'assignee', title: '接收人' },
  { colKey: 'assignTime', title: '分配时间', width: 160 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' }
]

const tableData = ref([
  { id: 1, taskNo: 'T2026051201', taskType: '投保跟进', customerName: '深圳XX国际贸易有限公司', buyerName: 'ABC Corporation', description: '买方资信调查结果跟进', priority: 'high', deadline: '2026-05-13', assignee: '李明', status: 'processing' },
  { id: 2, taskNo: 'T2026051202', taskType: '限额申请', customerName: '上海YY进出口公司', buyerName: 'DEF GmbH', description: '新增买方信用限额申请', priority: 'medium', deadline: '2026-05-14', assignee: '王芳', status: 'processing' },
  { id: 3, taskNo: 'T2026051203', taskType: '出运申报', customerName: '北京ZZ贸易集团', buyerName: 'GHI Ltd', description: '5月出运申报资料整理', priority: 'normal', deadline: '2026-05-15', assignee: null, status: 'pending' },
  { id: 4, taskNo: 'T2026051104', taskType: '理赔跟进', customerName: '广州AA实业公司', buyerName: 'JKL Co', description: '货物损失案件调查跟进', priority: 'high', deadline: '2026-05-11', assignee: '张伟', status: 'overdue' }
])

const assignData = ref([
  { id: 1, taskNo: 'T2026051201', customerName: '深圳XX国际贸易有限公司', taskType: '投保跟进', assignor: '系统', assignee: '李明', assignTime: '2026-05-12 09:00:00', status: 'processing' },
  { id: 2, taskNo: 'T2026051202', customerName: '上海YY进出口公司', taskType: '限额申请', assignor: '张经理', assignee: '王芳', assignTime: '2026-05-12 10:30:00', status: 'processing' },
  { id: 3, taskNo: 'T2026051103', customerName: '北京ZZ贸易集团', taskType: '出运申报', assignor: '系统', assignee: '张伟', assignTime: '2026-05-11 14:00:00', status: 'completed' }
])

const handleAssign = () => console.log('assign')
const handleGrab = () => console.log('grab')
const handleView = (row) => console.log('view:', row)
const handleGrabOne = (row) => console.log('grab one:', row)
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.mb-16 { margin-bottom: 16px; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.table-title { font-size: 16px; font-weight: 600; color: #333; }
</style>
