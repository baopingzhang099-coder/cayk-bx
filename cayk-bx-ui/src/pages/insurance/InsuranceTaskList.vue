<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item>首页</t-breadcrumb-item>
        <t-breadcrumb-item>投保管理</t-breadcrumb-item>
        <t-breadcrumb-item>流程任务列表</t-breadcrumb-item>
      </t-breadcrumb>
    </div>

    <div class="page-header">
      <div class="page-title">流程任务列表</div>
    </div>

    <t-card>
      <t-table
        :data="processTasks"
        :columns="columns"
        row-key="id"
        hover
        stripe
        :pagination="pagination"
        @page-change="onPageChange"
      >
        <template #status="{ row }">
          <t-tag theme="success" variant="light">{{ row.statusName }}</t-tag>
        </template>
        <template #operation="{ row }">
          <t-link theme="primary" @click="handleView(row)">查看详情</t-link>
        </template>
      </t-table>
    </t-card>

    <t-dialog v-model:visible="detailVisible" header="流程任务详情" width="700px" :footer="false">
      <detail-panel v-if="currentTask" title="任务详情" :columns="detailColumns" :data="currentTask" />
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBusinessStore } from '@/stores/business'
import DetailPanel from '@/components/common/DetailPanel.vue'

const router = useRouter()
const store = useBusinessStore()

const detailVisible = ref(false)
const currentTask = ref(null)

const columns = [
  { colKey: 'id', title: '任务编号', width: 160 },
  { colKey: 'policyNo', title: '保单号', width: 150 },
  { colKey: 'companyName', title: '客户名称', minWidth: 200 },
  { colKey: 'taskType', title: '任务类型', width: 100 },
  { colKey: 'startTime', title: '开始时间', width: 170 },
  { colKey: 'endTime', title: '完成时间', width: 170 },
  { colKey: 'stepsCompleted', title: '完成步骤', width: 100 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 120, slot: 'operation' }
]

const detailColumns = [
  { label: '任务编号', key: 'id' },
  { label: '保单号', key: 'policyNo' },
  { label: '客户名称', key: 'companyName' },
  { label: '任务类型', key: 'taskType' },
  { label: '开始时间', key: 'startTime' },
  { label: '完成时间', key: 'endTime' },
  { label: '完成步骤数', key: 'stepsCompleted' },
  { label: '状态', key: 'statusName' }
]

const pagination = ref({
  defaultPageSize: 10,
  total: 0,
  defaultCurrent: 1
})

const processTasks = computed(() => store.processTasks)

const onPageChange = (pageInfo) => {
  pagination.value.defaultCurrent = pageInfo.current
  pagination.value.defaultPageSize = pageInfo.pageSize
}

const handleView = (row) => {
  currentTask.value = {
    ...row,
    stepsCompleted: `${row.stepsCompleted}/7`
  }
  detailVisible.value = true
}
</script>

<style lang="scss" scoped>
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}
</style>
