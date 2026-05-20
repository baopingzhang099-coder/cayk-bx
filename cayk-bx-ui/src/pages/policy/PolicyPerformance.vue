<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/policy/list">保单管理</t-breadcrumb-item>
        <t-breadcrumb-item>保单履约报表</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">保单履约报表</div>
      <div class="page-actions">
        <t-button theme="primary">
          <template #icon><t-icon name="download" /></template>
          导出
        </t-button>
      </div>
    </div>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="6">
        <stat-card title="正常履约" :value="45" icon="check-circle" color="success" />
      </t-col>
      <t-col :span="6">
        <stat-card title="逾期未决" :value="8" icon="alarm" color="danger" />
      </t-col>
      <t-col :span="6">
        <stat-card title="已结案" :value="35" icon="file-checked" color="primary" />
      </t-col>
      <t-col :span="6">
        <stat-card title="履约率" value="96.5%" icon="chart" color="success" />
      </t-col>
    </t-row>

    <t-card>
      <t-table :data="tableData" :columns="columns" row-key="id" hover stripe>
        <template #status="{ row }">
          <status-tag :status="row.status" :status-map="statusMap" />
        </template>
        <template #operation="{ row }">
          <t-link @click="handleView(row)">查看详情</t-link>
        </template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'

const statusMap = {
  normal: '正常履约',
  overdue: '逾期未决',
  closed: '已结案'
}

const columns = [
  { colKey: 'policyNo', title: '保单号', width: 140 },
  { colKey: 'enterpriseName', title: '企业名称', ellipsis: true },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'premiumAmount', title: '保费金额', align: 'right' },
  { colKey: 'paidAmount', title: '已付金额', align: 'right' },
  { colKey: 'overdueAmount', title: '逾期金额', align: 'right' },
  { colKey: 'paymentDate', title: '应付日期', width: 120 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 100, slot: 'operation' }
]

const tableData = ref([
  { id: 1, policyNo: 'PI2026001234', enterpriseName: '深圳XX国际贸易有限公司', buyerName: 'ABC Corporation', premiumAmount: 12500, paidAmount: 12500, overdueAmount: 0, paymentDate: '2026-01-15', status: 'normal' },
  { id: 2, policyNo: 'PI2026001235', enterpriseName: '上海YY进出口公司', buyerName: 'DEF GmbH', premiumAmount: 8000, paidAmount: 8000, overdueAmount: 0, paymentDate: '2026-02-15', status: 'normal' },
  { id: 3, policyNo: 'PI2025000987', enterpriseName: '北京ZZ贸易集团', buyerName: 'GHI Ltd', premiumAmount: 20000, paidAmount: 15000, overdueAmount: 5000, paymentDate: '2025-12-15', status: 'overdue' },
  { id: 4, policyNo: 'PI2025000765', enterpriseName: '广州AA实业公司', buyerName: 'JKL Co', premiumAmount: 15000, paidAmount: 15000, overdueAmount: 0, paymentDate: '2025-11-15', status: 'closed' }
])

const handleView = (row) => console.log('view:', row)

onMounted(() => {})
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.mb-16 { margin-bottom: 16px; }
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>
