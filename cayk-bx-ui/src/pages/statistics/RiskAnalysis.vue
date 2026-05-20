<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/stats/business">数据统计</t-breadcrumb-item>
        <t-breadcrumb-item>风险数据分析</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">风险数据分析</div>
      <div class="page-actions">
        <t-date-range-picker v-model="dateRange" />
        <t-button theme="primary">
          <template #icon><t-icon name="download" /></template>
          导出
        </t-button>
      </div>
    </div>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="6">
        <stat-card title="赔付率" value="3.2%" icon="percentage" color="warning" />
      </t-col>
      <t-col :span="6">
        <stat-card title="逾期率" value="2.1%" icon="alarm" color="danger" />
      </t-col>
      <t-col :span="6">
        <stat-card title="风险买方" :value="8" icon="warning" color="danger" suffix="家" />
      </t-col>
      <t-col :span="6">
        <stat-card title="预警数量" :value="15" icon="alert" color="warning" suffix="条" />
      </t-col>
    </t-row>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="12">
        <t-card title="赔付率分析">
          <div class="chart-placeholder">
            <t-icon name="chart" size="48px" />
            <span>赔付率趋势分析（折线图）</span>
          </div>
        </t-card>
      </t-col>
      <t-col :span="12">
        <t-card title="逾期率分析">
          <div class="chart-placeholder">
            <t-icon name="chart" size="48px" />
            <span>逾期率趋势分析（折线图）</span>
          </div>
        </t-card>
      </t-col>
    </t-row>

    <t-card title="买方风险排名" class="mb-16">
      <t-table :data="tableData" :columns="columns" row-key="id" hover stripe>
        <template #riskLevel="{ row }">
          <t-tag :theme="row.riskLevel === 'high' ? 'danger' : row.riskLevel === 'medium' ? 'warning' : 'success'">
            {{ row.riskLevel === 'high' ? '高风险' : row.riskLevel === 'medium' ? '中风险' : '低风险' }}
          </t-tag>
        </template>
        <template #claimAmount="{ row }">¥{{ row.claimAmount.toLocaleString() }}</template>
      </t-table>
    </t-card>

    <t-card title="风险预警">
      <t-table :data="alertData" :columns="alertColumns" row-key="id" hover>
        <template #alertLevel="{ row }">
          <t-tag :theme="row.alertLevel === 'high' ? 'danger' : row.alertLevel === 'medium' ? 'warning' : 'default'">
            {{ row.alertLevel === 'high' ? '高' : row.alertLevel === 'medium' ? '中' : '低' }}
          </t-tag>
        </template>
        <template #status="{ row }">
          <t-tag :theme="row.status === 'pending' ? 'warning' : 'success'">
            {{ row.status === 'pending' ? '待处理' : '已处理' }}
          </t-tag>
        </template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import StatCard from '@/components/common/StatCard.vue'

const dateRange = ref([])

const columns = [
  { colKey: 'rank', title: '排名', width: 80, align: 'center' },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'enterpriseName', title: '关联企业' },
  { colKey: 'claimCount', title: '理赔次数', align: 'center' },
  { colKey: 'claimAmount', title: '理赔金额', align: 'right' },
  { colKey: 'overdueRate', title: '逾期率', align: 'right' },
  { colKey: 'riskLevel', title: '风险等级', width: 100, slot: 'riskLevel' }
]

const alertColumns = [
  { colKey: 'alertTime', title: '预警时间', width: 160 },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'alertType', title: '预警类型' },
  { colKey: 'alertContent', title: '预警内容' },
  { colKey: 'alertLevel', title: '等级', width: 80, slot: 'alertLevel' },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' }
]

const tableData = ref([
  { id: 1, rank: 1, buyerName: 'ABC Corporation', enterpriseName: '深圳XX国际贸易有限公司', claimCount: 3, claimAmount: 150000, overdueRate: '8.5%', riskLevel: 'high' },
  { id: 2, rank: 2, buyerName: 'DEF GmbH', enterpriseName: '上海YY进出口公司', claimCount: 2, claimAmount: 80000, overdueRate: '5.2%', riskLevel: 'medium' },
  { id: 3, rank: 3, buyerName: 'GHI Ltd', enterpriseName: '北京ZZ贸易集团', claimCount: 1, claimAmount: 30000, overdueRate: '2.1%', riskLevel: 'low' },
  { id: 4, rank: 4, buyerName: 'JKL Co', enterpriseName: '广州AA实业公司', claimCount: 1, claimAmount: 25000, overdueRate: '1.8%', riskLevel: 'low' }
])

const alertData = ref([
  { id: 1, alertTime: '2026-05-12 10:30', buyerName: 'ABC Corporation', alertType: '赔付预警', alertContent: '买方赔付率超过8%，请关注', alertLevel: 'high', status: 'pending' },
  { id: 2, alertTime: '2026-05-11 14:20', buyerName: 'DEF GmbH', alertType: '逾期预警', alertContent: '买方逾期率超过5%', alertLevel: 'medium', status: 'pending' },
  { id: 3, alertTime: '2026-05-10 09:15', buyerName: 'GHI Ltd', alertType: '额度预警', alertContent: '买方信用额度即将用尽', alertLevel: 'medium', status: 'completed' }
])
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.page-actions { display: flex; gap: 12px; }
.mb-16 { margin-bottom: 16px; }
.chart-placeholder { height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #999; }
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>
