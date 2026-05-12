<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">流程管理</div>
    </div>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="6">
        <stat-card title="生效通知" :value="28" icon="check-circle" color="success" />
      </t-col>
      <t-col :span="6">
        <stat-card title="中止通知" :value="1" icon="pause-circle" color="danger" />
      </t-col>
      <t-col :span="6">
        <stat-card title="退保管理" :value="3" icon="close-circle" color="warning" />
      </t-col>
      <t-col :span="6">
        <stat-card title="到期提醒" :value="5" icon="time" color="warning" />
      </t-col>
    </t-row>

    <t-card>
      <t-tabs v-model="activeTab">
        <t-tab-panel value="effective" label="生效通知">
          <t-table :data="effectiveData" :columns="effectiveColumns" row-key="id" hover>
            <template #status="{ row }">
              <status-tag :status="row.status" />
            </template>
            <template #operation="{ row }">
              <t-link @click="handleView(row)">查看</t-link>
            </template>
          </t-table>
        </t-tab-panel>
        <t-tab-panel value="suspended" label="中止通知">
          <t-table :data="suspendedData" :columns="effectiveColumns" row-key="id" hover>
            <template #status="{ row }">
              <status-tag :status="row.status" />
            </template>
            <template #operation="{ row }">
              <t-link @click="handleView(row)">查看</t-link>
            </template>
          </t-table>
        </t-tab-panel>
        <t-tab-panel value="surrender" label="退保管理">
          <t-table :data="surrenderData" :columns="effectiveColumns" row-key="id" hover>
            <template #status="{ row }">
              <status-tag :status="row.status" />
            </template>
            <template #operation="{ row }">
              <t-link @click="handleView(row)">查看</t-link>
            </template>
          </t-table>
        </t-tab-panel>
        <t-tab-panel value="expiry" label="到期提醒">
          <t-table :data="expiryData" :columns="effectiveColumns" row-key="id" hover>
            <template #status="{ row }">
              <status-tag :status="row.status" />
            </template>
            <template #operation="{ row }">
              <t-link @click="handleRenew(row)">续保</t-link>
            </template>
          </t-table>
        </t-tab-panel>
      </t-tabs>
    </t-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'

const activeTab = ref('effective')

const effectiveColumns = [
  { colKey: 'policyNo', title: '保单号', width: 140 },
  { colKey: 'enterpriseName', title: '企业名称', ellipsis: true },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'effectiveDate', title: '生效日期', width: 120 },
  { colKey: 'expiryDate', title: '到期日期', width: 120 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 100, slot: 'operation' }
]

const effectiveData = ref([
  { id: 1, policyNo: 'PI2026001234', enterpriseName: '深圳XX国际贸易有限公司', buyerName: 'ABC Corporation', effectiveDate: '2026-01-01', expiryDate: '2027-01-01', status: 'active' },
  { id: 2, policyNo: 'PI2026001235', enterpriseName: '上海YY进出口公司', buyerName: 'DEF GmbH', effectiveDate: '2026-02-01', expiryDate: '2027-02-01', status: 'active' }
])

const suspendedData = ref([
  { id: 1, policyNo: 'PI2025000987', enterpriseName: '北京ZZ贸易集团', buyerName: 'GHI Ltd', effectiveDate: '2025-11-01', expiryDate: '2026-11-01', status: 'suspended' }
])

const surrenderData = ref([
  { id: 1, policyNo: 'PI2025000765', enterpriseName: '广州AA实业公司', buyerName: 'JKL Co', effectiveDate: '2025-10-01', expiryDate: '2026-10-01', status: 'cancelled' },
  { id: 2, policyNo: 'PI2025000654', enterpriseName: '深圳BB贸易公司', buyerName: 'MNO Inc', effectiveDate: '2025-09-01', expiryDate: '2026-09-01', status: 'cancelled' }
])

const expiryData = ref([
  { id: 1, policyNo: 'PI2025000555', enterpriseName: '杭州CC公司', buyerName: 'PQR Ltd', effectiveDate: '2025-06-01', expiryDate: '2026-06-15', status: 'expiring' },
  { id: 2, policyNo: 'PI2025000444', enterpriseName: '成都DD公司', buyerName: 'STU Co', effectiveDate: '2025-07-01', expiryDate: '2026-07-01', status: 'expiring' }
])

const handleView = (row) => console.log('view:', row)
const handleRenew = (row) => console.log('renew:', row)
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.mb-16 { margin-bottom: 16px; }
</style>
