<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">理赔流程管理</div>
    </div>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="6">
        <stat-card title="报案中" :value="pendingCount" icon="edit-1" color="warning" />
      </t-col>
      <t-col :span="6">
        <stat-card title="调查中" :value="investigatingCount" icon="search" color="primary" />
      </t-col>
      <t-col :span="6">
        <stat-card title="核赔中" :value="processingCount" icon="loading" color="warning" />
      </t-col>
      <t-col :span="6">
        <stat-card title="已完成" :value="completedCount" icon="check-circle" color="success" />
      </t-col>
    </t-row>

    <t-card class="mb-16">
      <div class="section-header">
        <span class="section-title">保险公司理赔规则参考</span>
      </div>
      <t-table :data="companyRules" :columns="ruleColumns" row-key="company" hover stripe>
        <template #reportDeadline="{ row }">
          <t-tag :theme="getDeadlineTheme(row.reportDeadline)">{{ row.reportDeadline }}</t-tag>
        </template>
        <template #investigatePeriod="{ row }">
          <span>{{ row.investigatePeriod }}</span>
        </template>
        <template #compensatePeriod="{ row }">
          <span>{{ row.compensatePeriod }}</span>
        </template>
      </t-table>
    </t-card>

    <t-card>
      <div class="table-header">
        <span class="table-title">理赔案件列表</span>
        <span class="table-count">共 {{ pagination.total }} 条记录</span>
      </div>
      <t-table :data="tableData" :columns="columns" :loading="loading" row-key="id" hover stripe @page-change="handlePageChange">
        <template #status="{ row }">
          <status-tag :status="row.status" :status-map="statusMap" />
        </template>
        <template #currentStep="{ row }">
          <t-tag :theme="getStepTheme(row.currentStep)">{{ getStepName(row.currentStep) }}</t-tag>
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-link @click="handleView(row)">查看</t-link>
            <t-link @click="handleProcess(row)">处理</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <t-drawer v-model:visible="detailVisible" header="理赔案件详情" size="800px" :footer="false">
      <div v-if="currentRow">
        <detail-panel title="基本信息" :columns="detailColumns" :data="currentRow" />
        <t-divider />
        <div class="company-rules">
          <div class="rules-title">适用保险公司规则</div>
          <t-table :data="getCompanyRules(currentRow.insuranceCompany)" :columns="ruleColumns" row-key="company" size="small">
            <template #reportDeadline="{ row }">
              <t-tag :theme="getDeadlineTheme(row.reportDeadline)">{{ row.reportDeadline }}</t-tag>
            </template>
          </t-table>
        </div>
        <t-divider />
        <div class="process-timeline">
          <div class="timeline-title">理赔流程进度</div>
          <t-steps :current="currentRow.currentStep || 1" layout="vertical" status="process">
            <t-step-item title="报案提交" :content="`报案时间：${currentRow.createTime}`" />
            <t-step-item title="资料审核" content="跟单员审核资料的完整性和规范性" />
            <t-step-item title="保险公司调查" :content="`根据${currentRow.insuranceCompany}规则进行调查`" />
            <t-step-item title="定损核赔" content="保险公司核定损失和赔偿比例" />
            <t-step-item title="赔付支付" content="保险公司支付赔款" />
            <t-step-item title="追偿（如有）" content="被保险人配合保险公司进行追偿" />
          </t-steps>
        </div>
      </div>
    </t-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useBusinessStore } from '@/stores/business'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import DetailPanel from '@/components/common/DetailPanel.vue'

const store = useBusinessStore()
const loading = ref(false)

const statusMap = {
  pending: '待处理',
  processing: '处理中',
  investigating: '调查中',
  supplement: '补充材料',
  decided: '已决定',
  completed: '已完成',
  rejected: '已拒赔'
}

const statusList = computed(() => store.claims || [])
const pendingCount = computed(() => statusList.value.filter(c => c.status === 'pending').length)
const investigatingCount = computed(() => statusList.value.filter(c => c.status === 'investigating').length)
const processingCount = computed(() => statusList.value.filter(c => ['processing', 'decided'].includes(c.status)).length)
const completedCount = computed(() => statusList.value.filter(c => ['completed', 'rejected'].includes(c.status)).length)

const companyRules = [
  { company: '中国信保', reportDeadline: '风险发生后30日内（拖欠）/10工作日（破产/拒收/政治风险）', reportMethod: '中国国际贸易单一窗口/客服热线95387', investigatePeriod: '简单15日/复杂4个月', compensatePeriod: '核赔后10日支付', recourse: '赔付后6个月内启动，通常1-3年完成' },
  { company: '人保财险', reportDeadline: '风险发生后10日内', reportMethod: 'APP/95518/线下网点', investigatePeriod: '简单10工作日/复杂30日', compensatePeriod: '达成协议后10日/最长60日', recourse: '3个月内启动，通常6个月-2年完成' },
  { company: '太平洋保险', reportDeadline: '拖欠30日/其他10工作日', reportMethod: '官网/APP/95500', investigatePeriod: '30工作日出具结论', compensatePeriod: '核赔后10日支付', recourse: '6个月内启动，通常1-2年完成' },
  { company: '大地保险', reportDeadline: '风险发生后30日内', reportMethod: '95590/线下网点', investigatePeriod: '小额24小时/大额45工作日', compensatePeriod: '小额24小时/大额10日', recourse: '3个月内启动，通常6个月-1年完成' }
]

const ruleColumns = [
  { colKey: 'company', title: '保险公司', width: 120 },
  { colKey: 'reportDeadline', title: '报案时限', width: 200, slot: 'reportDeadline' },
  { colKey: 'reportMethod', title: '报案方式', width: 180 },
  { colKey: 'investigatePeriod', title: '调查审核时限', width: 150 },
  { colKey: 'compensatePeriod', title: '赔付时限', width: 150 }
]

const columns = [
  { colKey: 'claimNo', title: '理赔单号', width: 140 },
  { colKey: 'insuranceCompany', title: '保险公司', width: 100 },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'claimTypeName', title: '报案类型', width: 100 },
  { colKey: 'estimatedLossAmount', title: '预估损失', align: 'right', width: 120 },
  { colKey: 'currentStep', title: '当前阶段', width: 100, slot: 'currentStep' },
  { colKey: 'status', title: '案件状态', width: 100, slot: 'status' },
  { colKey: 'createTime', title: '报案时间', width: 160 },
  { colKey: 'operation', title: '操作', width: 120, fixed: 'right', slot: 'operation' }
]

const detailColumns = [
  { label: '理赔单号', key: 'claimNo' },
  { label: '保险公司', key: 'insuranceCompany' },
  { label: '买方名称', key: 'buyerName' },
  { label: '报案类型', key: 'claimTypeName' },
  { label: '预估损失金额', key: 'estimatedLossAmount' },
  { label: '实际赔付金额', key: 'claimAmount' },
  { label: '报案时间', key: 'createTime' },
  { label: '案件状态', key: 'statusName' }
]

const pagination = reactive({ total: 0, current: 1, pageSize: 20 })

const tableData = computed(() => {
  pagination.total = store.claims.length
  const start = (pagination.current - 1) * pagination.pageSize
  return store.claims.slice(start, start + pagination.pageSize)
})

const getStepTheme = (step) => {
  if (step <= 2) return 'primary'
  if (step <= 4) return 'warning'
  return 'success'
}

const getStepName = (step) => {
  const steps = ['报案提交', '资料审核', '保险公司调查', '定损核赔', '赔付支付', '追偿']
  return steps[step - 1] || '未知'
}

const getDeadlineTheme = (deadline) => {
  if (deadline.includes('30')) return 'warning'
  if (deadline.includes('10')) return 'danger'
  return 'primary'
}

const getCompanyRules = (company) => {
  return companyRules.filter(r => r.company === company)
}

const detailVisible = ref(false)
const currentRow = ref(null)

const handlePageChange = (pageInfo) => {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
}

const handleView = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

const handleProcess = (row) => {
  console.log('process:', row)
}

onMounted(() => {
  store.ensureSeeded()
})
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.mb-16 { margin-bottom: 16px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title { font-size: 16px; font-weight: 600; color: #333; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.table-title { font-size: 16px; font-weight: 600; color: #333; }
.table-count { font-size: 14px; color: #999; }
.company-rules { margin: 16px 0; }
.rules-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 12px; }
.process-timeline { margin: 16px 0; }
.timeline-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 12px; }
</style>
