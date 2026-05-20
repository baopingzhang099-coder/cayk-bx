<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/clerk/list">跟单管理</t-breadcrumb-item>
        <t-breadcrumb-item>考核管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">考核管理</div>
      <div class="page-actions">
        <t-button theme="primary">
          <template #icon><t-icon name="download" /></template>
          导出考核报告
        </t-button>
      </div>
    </div>

    <t-row :gutter="16" class="mb-16">
      <t-col :span="6">
        <stat-card title="本月考核人数" :value="12" icon="person" color="primary" />
      </t-col>
      <t-col :span="6">
        <stat-card title="优秀" :value="3" icon="star" color="success" />
      </t-col>
      <t-col :span="6">
        <stat-card title="合格" :value="8" icon="check-circle" color="primary" />
      </t-col>
      <t-col :span="6">
        <stat-card title="待改进" :value="1" icon="edit" color="warning" />
      </t-col>
    </t-row>

    <t-card class="mb-16">
      <t-tabs v-model="activeTab">
        <t-tab-panel value="performance" label="绩效排名">
          <t-table :data="performanceData" :columns="performanceColumns" row-key="id" hover stripe>
            <template #rank="{ row }">
              <t-badge :count="row.rank" :max-count="99" :offset="[10, 0]" :theme="row.rank <= 3 ? 'primary' : 'default'" />
            </template>
            <template #rating="{ row }">
              <t-rate :value="row.rating" allow-half readonly />
            </template>
          </t-table>
        </t-tab-panel>
        <t-tab-panel value="evaluation" label="评价记录">
          <t-table :data="evaluationData" :columns="evaluationColumns" row-key="id" hover>
            <template #evaluationType="{ row }">
              <t-tag :theme="row.evaluationType === '好评' ? 'success' : row.evaluationType === '差评' ? 'danger' : 'default'">
                {{ row.evaluationType }}
              </t-tag>
            </template>
          </t-table>
        </t-tab-panel>
        <t-tab-panel value="violation" label="违规记录">
          <t-table :data="violationData" :columns="violationColumns" row-key="id" hover>
            <template #severity="{ row }">
              <t-tag :theme="row.severity === '严重' ? 'danger' : row.severity === '一般' ? 'warning' : 'default'">
                {{ row.severity }}
              </t-tag>
            </template>
          </t-table>
        </t-tab-panel>
      </t-tabs>
    </t-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import StatCard from '@/components/common/StatCard.vue'

const activeTab = ref('performance')

const performanceColumns = [
  { colKey: 'rank', title: '排名', width: 80, slot: 'rank' },
  { colKey: 'name', title: '跟单员姓名', width: 120 },
  { colKey: 'department', title: '部门' },
  { colKey: 'orderCount', title: '本月订单', align: 'center' },
  { colKey: 'taskCompleted', title: '任务完成', align: 'center' },
  { colKey: 'customerRating', title: '客户评分', width: 150, slot: 'rating' },
  { colKey: 'violationCount', title: '违规次数', align: 'center' },
  { colKey: 'finalRating', title: '综合评级', align: 'center' }
]

const evaluationColumns = [
  { colKey: 'customerName', title: '客户名称' },
  { colKey: 'clerkName', title: '跟单员' },
  { colKey: 'evaluationType', title: '评价类型', width: 100, slot: 'evaluationType' },
  { colKey: 'content', title: '评价内容' },
  { colKey: 'evaluationTime', title: '评价时间', width: 160 }
]

const violationColumns = [
  { colKey: 'clerkName', title: '跟单员', width: 120 },
  { colKey: 'violationType', title: '违规类型' },
  { colKey: 'description', title: '违规描述' },
  { colKey: 'severity', title: '严重程度', width: 100, slot: 'severity' },
  { colKey: 'deductScore', title: '扣分', align: 'center' },
  { colKey: 'violationTime', title: '违规时间', width: 160 }
]

const performanceData = ref([
  { id: 1, rank: 1, name: '李明', department: '业务部', orderCount: 42, taskCompleted: 38, rating: 4.8, violationCount: 0, finalRating: 'S' },
  { id: 2, rank: 2, name: '王芳', department: '业务部', orderCount: 38, taskCompleted: 35, rating: 4.6, violationCount: 0, finalRating: 'A' },
  { id: 3, rank: 3, name: '张伟', department: '客服部', orderCount: 35, taskCompleted: 32, rating: 4.5, violationCount: 1, finalRating: 'A' },
  { id: 4, rank: 4, name: '陈静', department: '业务部', orderCount: 32, taskCompleted: 30, rating: 4.3, violationCount: 0, finalRating: 'B' }
])

const evaluationData = ref([
  { id: 1, customerName: '深圳XX国际贸易有限公司', clerkName: '李明', evaluationType: '好评', content: '响应及时，专业度高', evaluationTime: '2026-05-10 14:30' },
  { id: 2, customerName: '上海YY进出口公司', clerkName: '王芳', evaluationType: '好评', content: '服务态度好，问题处理迅速', evaluationTime: '2026-05-08 10:20' },
  { id: 3, customerName: '北京ZZ贸易集团', clerkName: '张伟', evaluationType: '中评', content: '基本满意', evaluationTime: '2026-05-05 16:45' }
])

const violationData = ref([
  { id: 1, clerkName: '张伟', violationType: '超时处理', description: '客户任务超时3天未处理', severity: '一般', deductScore: 5, violationTime: '2026-05-01 09:00' }
])
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
