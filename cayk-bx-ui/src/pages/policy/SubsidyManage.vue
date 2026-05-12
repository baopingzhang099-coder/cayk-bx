<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">保费补贴管理</div>
    </div>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="6">
        <stat-card title="申请中" :value="8" icon="edit-1" color="warning" />
      </t-col>
      <t-col :span="6">
        <stat-card title="已审批" :value="25" icon="check-circle" color="success" />
      </t-col>
      <t-col :span="6">
        <stat-card title="待发放" :value="3" icon="wallet" color="primary" />
      </t-col>
      <t-col :span="6">
        <stat-card title="累计补贴金额" value="$125,000" icon="money" color="success" />
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
        <template #subsidyAmount="{ row }">¥{{ row.subsidyAmount.toLocaleString() }}</template>
        <template #operation="{ row }">
          <t-space>
            <t-link @click="handleView(row)">查看</t-link>
            <t-link v-if="row.status === 'pending'" @click="handleProcess(row)">处理</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'

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

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = [
      { id: 1, applicationNo: 'SUB2026001', enterpriseName: '深圳XX国际贸易有限公司', policyNo: 'PI2026001234', premiumAmount: 12500, subsidyAmount: 3750, subsidyRate: '30%', region: '深圳市南山区', status: 'completed' },
      { id: 2, applicationNo: 'SUB2026002', enterpriseName: '上海YY进出口公司', policyNo: 'PI2026001235', premiumAmount: 8000, subsidyAmount: 2400, subsidyRate: '30%', region: '上海市浦东新区', status: 'waiting' },
      { id: 3, applicationNo: 'SUB2026003', enterpriseName: '北京ZZ贸易集团', policyNo: 'PI2025000987', premiumAmount: 20000, subsidyAmount: 6000, subsidyRate: '30%', region: '北京市朝阳区', status: 'approved' },
      { id: 4, applicationNo: 'SUB2026004', enterpriseName: '广州AA实业公司', policyNo: 'PI2025000765', premiumAmount: 15000, subsidyAmount: null, subsidyRate: '30%', region: '广州市天河区', status: 'pending' }
    ]
    pagination.total = 4
    loading.value = false
  }, 300)
}

const handleSearch = () => fetchData()
const handleReset = () => fetchData()
const handleView = (row) => console.log('view:', row)
const handleProcess = (row) => console.log('process:', row)

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
