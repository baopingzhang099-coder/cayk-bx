<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/insurance/purchase">投保管理</t-breadcrumb-item>
        <t-breadcrumb-item>投保流程管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>

    <div class="page-header">
      <div class="page-title-wp">
        <div class="page-title">投保流程管理</div>
        <t-tag v-if="activeTab === 'process'" theme="primary" variant="light" size="small">进行中</t-tag>
      </div>
      <div class="policy-info">
        保单号：<span class="policy-no">PI2026001234</span>
      </div>
    </div>

    <t-tabs v-model="activeTab" size="large">
      <t-tab-panel value="process" label="投保流程管理">
        <div class="flow-progress">
          <div class="flow-steps">
            <template v-for="(step, index) in stepOptions" :key="step.value">
              <div class="flow-step-col">
                <div
                  class="flow-step-dot"
                  :class="{ completed: index + 1 < currentStep, active: index + 1 === currentStep }"
                  @click="setStep(index + 1)"
                >
                  <span v-if="index + 1 < currentStep" class="flow-step-check">✓</span>
                  <span v-else class="flow-step-num">{{ index + 1 }}</span>
                </div>
                <div class="flow-step-label" :class="{ active: index + 1 === currentStep, completed: index + 1 < currentStep }">
                  {{ step.label }}
                </div>
                <div class="flow-step-status">
                  <t-tag
                    v-if="index + 1 < currentStep"
                    theme="success"
                    variant="light"
                    size="small"
                  >
                    已完成
                  </t-tag>
                  <t-tag
                    v-else-if="index + 1 === currentStep"
                    theme="primary"
                    variant="light"
                    size="small"
                  >
                    进行中
                  </t-tag>
                  <t-tag
                    v-else
                    theme="default"
                    variant="light"
                    size="small"
                  >
                    待处理
                  </t-tag>
                </div>
              </div>
              <div v-if="index < stepOptions.length - 1" class="flow-arrow" :class="{ completed: index + 1 < currentStep }">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </template>
          </div>
        </div>

        <div class="flow-timeline">
          <div class="timeline-title-bar">
            <span class="timeline-title">流程详情</span>
            <span class="timeline-hint">点击步骤标题可展开/收起详情</span>
          </div>

          <div
            v-for="(step, index) in stepOptions"
            :key="step.value"
            class="timeline-node"
            :class="{
              'node-completed': index + 1 < currentStep,
              'node-active': index + 1 === currentStep,
              'node-pending': index + 1 > currentStep
            }"
          >
            <div class="node-header" @click="toggleCollapse(index)">
              <div class="node-marker">
                <span v-if="index + 1 < currentStep" class="node-check">✓</span>
                <span v-else-if="index + 1 === currentStep" class="node-dot"></span>
                <span v-else class="node-pending-dot"></span>
              </div>
              <div class="node-info">
                <div class="node-title">
                  <span class="node-step-num">Step {{ index + 1 }}</span>
                  <span class="node-step-name">{{ step.label }}</span>
                  <span v-if="stepInfo[index].handler" class="node-handler">处理人：{{ stepInfo[index].handler }}</span>
                </div>
                <div class="node-meta">
                  <span class="meta-status" :class="'status-' + getStepStatusText(index + 1)">
                    {{ getStepStatusText(index + 1) }}
                  </span>
                  <span v-if="stepInfo[index].startTime" class="meta-time">开始：{{ stepInfo[index].startTime }}</span>
                  <span v-if="stepInfo[index].endTime" class="meta-time">完成：{{ stepInfo[index].endTime }}</span>
                </div>
              </div>
              <div class="node-toggle">
                <t-icon
                  :name="expandedSteps[index] ? 'chevron-up' : 'chevron-down'"
                  class="toggle-icon"
                />
              </div>
            </div>

            <div v-show="expandedSteps[index]" class="node-body">
              <div v-if="index >= 5" class="node-content">
                <div v-if="index === 5" class="content-inner">
                  <div class="content-section">
                    <div class="content-section-title">保单签发</div>
                    <t-form :data="formData.step6" label-width="100">
                      <t-form-item label="保单编号">
                        <t-input v-model="formData.step6.policyNo" readonly placeholder="系统自动生成" />
                      </t-form-item>
                      <t-form-item label="保单状态">
                        <t-tag theme="success" variant="light">已签发</t-tag>
                      </t-form-item>
                      <t-form-item label="签发日期">
                        <t-date-picker v-model="formData.step6.issueDate" />
                      </t-form-item>
                      <t-form-item label="保单文件">
                        <t-upload v-model="formData.step6.policyFile" :files="[]" placeholder="上传保单文件" />
                      </t-form-item>
                    </t-form>
                  </div>
                </div>

                <div v-else-if="index === 6" class="content-inner">
                  <div class="content-section">
                    <div class="content-section-title">支付管理</div>
                    <t-form :data="formData.step7" label-width="100">
                      <t-form-item label="保费金额">
                        <t-input v-model="formData.step7.premiumAmount" readonly placeholder="¥12,500.00" />
                      </t-form-item>
                      <t-form-item label="支付状态">
                        <t-select v-model="formData.step7.paymentStatus" placeholder="请选择支付状态">
                          <t-option value="unpaid" label="未支付" />
                          <t-option value="partial" label="部分支付" />
                          <t-option value="paid" label="已支付" />
                        </t-select>
                      </t-form-item>
                      <t-form-item label="支付凭证">
                        <t-upload v-model="formData.step7.paymentReceipt" :files="[]" placeholder="上传支付凭证" />
                      </t-form-item>
                      <t-form-item label="保单明细表">
                        <t-upload v-model="formData.step7.policyDetailFile" :files="[]" placeholder="上传保单明细表" />
                      </t-form-item>
                      <t-form-item label="费率表">
                        <t-upload v-model="formData.step7.rateFile" :files="[]" placeholder="上传费率表" />
                      </t-form-item>
                    </t-form>
                  </div>
                </div>
              </div>

              <t-divider v-if="index >= 5" />

              <div class="node-approval">
                <div class="approval-row">
                  <div class="approval-field">
                    <span class="approval-label">审批结论</span>
                    <t-radio-group
                      :value="formData['step' + (index + 1)].approvalResult"
                      @change="(v) => { formData['step' + (index + 1)].approvalResult = v }"
                      class="approval-radio-group"
                    >
                      <t-radio value="approved">通过</t-radio>
                      <t-radio value="rejected">退回修改</t-radio>
                    </t-radio-group>
                  </div>
                </div>
                <div class="approval-row">
                  <div class="approval-field approval-field-full">
                    <span class="approval-label">审批意见</span>
                    <t-textarea
                      :value="formData['step' + (index + 1)].auditOpinion"
                      @update:model-value="(v) => { formData['step' + (index + 1)].auditOpinion = v }"
                      placeholder="请输入审批意见"
                      :autosize="{ minRows: 2, maxRows: 4 }"
                      class="approval-textarea"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flow-actions">
          <t-button
            variant="outline"
            :disabled="currentStep === 1"
            @click="prevStep"
          >
            上一步
          </t-button>
          <t-button
            v-if="currentStep < 7"
            theme="primary"
            @click="nextStep"
          >
            下一步
          </t-button>
          <t-button
            v-else
            theme="primary"
            @click="completeProcess"
          >
            完成
          </t-button>
        </div>
      </t-tab-panel>

      <t-tab-panel value="task-list" label="流程任务列表">
        <t-card>
          <t-table
            :data="processTasks"
            :columns="taskColumns"
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
      </t-tab-panel>
    </t-tabs>

    <t-dialog v-model:visible="detailVisible" header="流程任务详情" width="800px" :footer="false">
      <div v-if="currentTask" class="detail-body">
        <div class="detail-summary">
          <div class="summary-item">
            <span class="summary-label">任务编号</span>
            <span class="summary-value">{{ currentTask.id }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">保单号</span>
            <span class="summary-value">{{ currentTask.policyNo }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">客户名称</span>
            <span class="summary-value">{{ currentTask.companyName }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">完成时间</span>
            <span class="summary-value">{{ currentTask.endTime }}</span>
          </div>
        </div>
        <t-divider />
        <div
          v-for="(step, idx) in currentTask.stepOptions"
          :key="idx"
          class="detail-step"
        >
          <div class="detail-step-header">
            <span class="detail-step-num">Step {{ idx + 1 }}</span>
            <span class="detail-step-name">{{ step.label }}</span>
            <span v-if="currentTask.stepInfo[idx]?.handler" class="detail-step-handler">处理人：{{ currentTask.stepInfo[idx].handler }}</span>
            <span class="detail-step-time" v-if="currentTask.stepInfo[idx]?.startTime">开始：{{ currentTask.stepInfo[idx].startTime }}</span>
            <span class="detail-step-time" v-if="currentTask.stepInfo[idx]?.endTime">完成：{{ currentTask.stepInfo[idx].endTime }}</span>
          </div>
          <div class="detail-step-content">
            <!-- Step 1: 投保方案确认 -->
            <template v-if="idx === 0">
              <div class="detail-field-row">
                <span class="detail-field-label">投保方案</span>
                <span class="detail-field-value">{{ currentTask.planLabels[currentTask.formData.step1?.insurancePlan] || currentTask.formData.step1?.insurancePlan }}</span>
              </div>
              <div class="detail-field-row">
                <span class="detail-field-label">保险公司</span>
                <span class="detail-field-value">{{ currentTask.companyLabels[currentTask.formData.step1?.insuranceCompany] || currentTask.formData.step1?.insuranceCompany }}</span>
              </div>
              <div class="detail-field-row detail-field-row-full">
                <span class="detail-field-label">匹配规则说明</span>
                <span class="detail-field-value">{{ currentTask.formData.step1?.matchRule }}</span>
              </div>
            </template>
            <!-- Step 2: 申请投保 -->
            <template v-if="idx === 1">
              <div class="detail-field-row">
                <span class="detail-field-label">投保申请书</span>
                <span class="detail-field-value">{{ currentTask.step2Docs?.applicationForm ? '已勾选' : '未勾选' }}</span>
              </div>
              <div class="detail-field-row">
                <span class="detail-field-label">买方信息采集表</span>
                <span class="detail-field-value">{{ currentTask.step2Docs?.buyerInfoForm ? '已勾选' : '未勾选' }}</span>
              </div>
            </template>
            <!-- Step 3: 提交投保申请 -->
            <template v-if="idx === 2">
              <div class="detail-field-row">
                <span class="detail-field-label">投保申请书</span>
                <span class="detail-field-value">{{ currentTask.step2Docs?.applicationForm ? '已附' : '未附' }}</span>
              </div>
              <div class="detail-field-row">
                <span class="detail-field-label">买方信息采集表</span>
                <span class="detail-field-value">{{ currentTask.step2Docs?.buyerInfoForm ? '已附' : '未附' }}</span>
              </div>
            </template>
            <!-- Step 4: 审核流转 -->
            <template v-if="idx === 3">
              <div class="detail-field-row">
                <span class="detail-field-label">基本信息校验</span>
                <span class="detail-field-value">{{ currentTask.formData.step4?.checkedItems?.includes('basicInfo') ? '已完成' : '未完成' }}</span>
              </div>
              <div class="detail-field-row">
                <span class="detail-field-label">资料完整性检查</span>
                <span class="detail-field-value">{{ currentTask.formData.step4?.checkedItems?.includes('documentCheck') ? '已完成' : '未完成' }}</span>
              </div>
              <div class="detail-field-row">
                <span class="detail-field-label">风险评估</span>
                <span class="detail-field-value">{{ currentTask.formData.step4?.checkedItems?.includes('riskAssessment') ? '已完成' : '未完成' }}</span>
              </div>
            </template>
            <!-- Step 5: 核保 -->
            <template v-if="idx === 4">
              <div class="detail-field-row">
                <span class="detail-field-label">核保信息确认</span>
                <span class="detail-field-value">{{ (currentTask.formData.step5?.checkedItems || []).join('、') || '无' }}</span>
              </div>
              <div class="detail-field-row">
                <span class="detail-field-label">核保结论</span>
                <span class="detail-field-value">{{ { approved: '承保', conditional: '有条件承保', rejected: '拒保' }[currentTask.formData.step5?.underwritingResult] || currentTask.formData.step5?.underwritingResult || '无' }}</span>
              </div>
              <div class="detail-field-row detail-field-row-full">
                <span class="detail-field-label">核保意见</span>
                <span class="detail-field-value">{{ currentTask.formData.step5?.underwritingOpinion || '无' }}</span>
              </div>
            </template>
            <!-- Step 6: 保单签发 -->
            <template v-if="idx === 5">
              <div class="detail-field-row">
                <span class="detail-field-label">保单编号</span>
                <span class="detail-field-value">{{ currentTask.formData.step6?.policyNo || '无' }}</span>
              </div>
              <div class="detail-field-row">
                <span class="detail-field-label">保单状态</span>
                <span class="detail-field-value">已签发</span>
              </div>
              <div class="detail-field-row">
                <span class="detail-field-label">签发日期</span>
                <span class="detail-field-value">{{ currentTask.formData.step6?.issueDate || '无' }}</span>
              </div>
            </template>
            <!-- Step 7: 支付管理 -->
            <template v-if="idx === 6">
              <div class="detail-field-row">
                <span class="detail-field-label">保费金额</span>
                <span class="detail-field-value">{{ currentTask.formData.step7?.premiumAmount || '无' }}</span>
              </div>
              <div class="detail-field-row">
                <span class="detail-field-label">支付状态</span>
                <span class="detail-field-value">{{ { unpaid: '未支付', partial: '部分支付', paid: '已支付' }[currentTask.formData.step7?.paymentStatus] || currentTask.formData.step7?.paymentStatus || '无' }}</span>
              </div>
            </template>
            <!-- Approval fields for every step -->
            <t-divider />
            <div class="detail-field-row">
              <span class="detail-field-label">审批结论</span>
              <span class="detail-field-value">{{ { approved: '通过', rejected: '退回修改' }[currentTask.formData['step' + (idx + 1)]?.approvalResult] || '无' }}</span>
            </div>
            <div class="detail-field-row detail-field-row-full">
              <span class="detail-field-label">审批意见</span>
              <span class="detail-field-value">{{ currentTask.formData['step' + (idx + 1)]?.auditOpinion || '无' }}</span>
            </div>
          </div>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useBusinessStore } from '@/stores/business'
import { MessagePlugin } from 'tdesign-vue-next'

const businessStore = useBusinessStore()

const activeTab = ref('process')
const currentStep = ref(3)

const stepOptions = [
  { label: '投保方案确认', value: 1 },
  { label: '申请投保', value: 2 },
  { label: '提交投保申请', value: 3 },
  { label: '审核流转', value: 4 },
  { label: '核保', value: 5 },
  { label: '保单签发', value: 6 },
  { label: '支付管理', value: 7 }
]

const getCurrentTime = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

const stepInfo = reactive([
  { handler: '张三', startTime: '2026-06-01 10:30:00', endTime: '2026-06-01 11:00:00' },
  { handler: '李四', startTime: '2026-06-01 11:00:00', endTime: '2026-06-01 14:00:00' },
  { handler: '王五', startTime: '', endTime: '' },
  { handler: '', startTime: '', endTime: '' },
  { handler: '', startTime: '', endTime: '' },
  { handler: '', startTime: '', endTime: '' },
  { handler: '', startTime: '', endTime: '' }
])

const setStepStartTime = (stepNum) => {
  const idx = stepNum - 1
  if (idx >= 0 && idx < stepInfo.length && !stepInfo[idx].startTime) {
    stepInfo[idx].startTime = getCurrentTime()
  }
}

const setStepEndTime = (stepNum) => {
  const idx = stepNum - 1
  if (idx >= 0 && idx < stepInfo.length) {
    stepInfo[idx].endTime = getCurrentTime()
  }
}

const formData = reactive({
  step1: {
    insurancePlan: 'planA',
    matchRule: '根据各保险公司行业风险清单、国家（地区）分类表设定匹配规则，结合买方资质、贸易背景等因素综合评估后推荐此方案。',
    insuranceCompany: 'company1',
    approvalResult: '',
    auditOpinion: ''
  },
  step2: {
    approvalResult: '',
    auditOpinion: ''
  },
  step3: {
    approvalResult: '',
    auditOpinion: ''
  },
  step4: {
    checkedItems: ['basicInfo', 'documentCheck'],
    approvalResult: '',
    auditOpinion: ''
  },
  step5: {
    checkedItems: [],
    underwritingResult: '',
    underwritingOpinion: '',
    approvalResult: '',
    auditOpinion: ''
  },
  step6: {
    policyNo: 'POL20260602001',
    issueDate: '',
    policyFile: [],
    approvalResult: '',
    auditOpinion: ''
  },
  step7: {
    premiumAmount: '¥12,500.00',
    paymentStatus: 'unpaid',
    paymentReceipt: [],
    policyDetailFile: [],
    rateFile: [],
    approvalResult: '',
    auditOpinion: ''
  }
})

const step2Docs = reactive({
  applicationForm: false,
  buyerInfoForm: false
})

const planLabels = {
  planA: '方案A - 短期出口信用保险',
  planB: '方案B - 中长期出口信用保险',
  planC: '方案C - 国内贸易信用保险'
}

const companyLabels = {
  company1: '中国出口信用保险公司',
  company2: '平安财产保险',
  company3: '太平洋财产保险'
}

const expandedSteps = reactive(stepOptions.map((_, i) => i + 1 <= currentStep.value))

const getStepStatusText = (stepNum) => {
  if (stepNum < currentStep.value) return '已完成'
  if (stepNum === currentStep.value) return '进行中'
  return '待处理'
}

const toggleCollapse = (index) => {
  expandedSteps[index] = !expandedSteps[index]
}

const setStep = (step) => {
  if (step <= currentStep.value) {
    currentStep.value = step
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const nextStep = () => {
  if (currentStep.value < 7) {
    setStepEndTime(currentStep.value)
    currentStep.value++
    setStepStartTime(currentStep.value)
    MessagePlugin.success('操作成功')
  }
}

const completeProcess = () => {
  setStepEndTime(currentStep.value)
  businessStore.addCompletedProcessTask({
    policyNo: 'PI2026001234',
    companyName: '深圳XX国际贸易有限公司',
    startTime: stepInfo[0].startTime,
    endTime: stepInfo[6].endTime,
    stepsCompleted: 7,
    stepOptions: [...stepOptions],
    stepInfo: stepInfo.map(s => ({ ...s })),
    formData: Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, { ...v }])
    ),
    step2Docs: { ...step2Docs },
    planLabels: { ...planLabels },
    companyLabels: { ...companyLabels }
  })
  MessagePlugin.success('投保流程已完成，保单已生效！')
  activeTab.value = 'task-list'
}

onMounted(() => {
  businessStore.ensureSeeded()
  setStepStartTime(currentStep.value)
})

// Task list
const detailVisible = ref(false)
const currentTask = ref(null)

const taskColumns = [
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

const pagination = ref({
  defaultPageSize: 10,
  total: 0,
  defaultCurrent: 1
})

const processTasks = computed(() => businessStore.processTasks)

const onPageChange = (pageInfo) => {
  pagination.value.defaultCurrent = pageInfo.current
  pagination.value.defaultPageSize = pageInfo.pageSize
}

const handleView = (row) => {
  currentTask.value = row
  detailVisible.value = true
}
</script>

<style lang="scss" scoped>
$primary: #0052D9;
$success: #10b981;
$warning: #f59e0b;
$danger: #ef4444;
$gray-100: #f3f4f6;
$gray-200: #e5e7eb;
$gray-300: #d1d5db;
$gray-400: #9ca3af;
$gray-500: #6b7280;
$gray-600: #4b5563;
$gray-700: #374151;
$gray-800: #1f2937;

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

.page-title-wp {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.policy-info {
  font-size: 14px;
  color: $gray-500;
}

.policy-no {
  font-weight: 600;
  color: $primary;
}

.flow-progress {
  background: #fff;
  border: 1px solid $gray-200;
  border-radius: 12px;
  padding: 24px 32px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.flow-steps {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.flow-step-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 80px;
}

.flow-step-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: $gray-200;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;

  .flow-step-num,
  .flow-step-check {
    font-size: 15px;
    font-weight: 700;
    color: $gray-500;
  }

  &.completed {
    background: $success;
    box-shadow: 0 0 0 4px rgba($success, 0.15);

    .flow-step-check {
      color: #fff;
    }
  }

  &.active {
    background: $primary;
    box-shadow: 0 0 0 4px rgba($primary, 0.18);

    .flow-step-num {
      color: #fff;
    }
  }
}

.flow-step-label {
  font-size: 12px;
  color: $gray-500;
  text-align: center;
  font-weight: 500;
  line-height: 1.3;

  &.completed {
    color: $success;
  }

  &.active {
    color: $primary;
    font-weight: 600;
  }
}

.flow-step-status {
  :deep(.t-tag) {
    min-width: 52px;
    justify-content: center;
  }
}

.flow-arrow {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  color: $gray-300;
  transition: color 0.3s ease;

  &.completed {
    color: $success;
  }
}

.flow-timeline {
  background: #fff;
  border: 1px solid $gray-200;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.timeline-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid $gray-200;
  background: #fafbfc;
}

.timeline-title {
  font-size: 15px;
  font-weight: 600;
  color: $gray-800;
}

.timeline-hint {
  font-size: 12px;
  color: $gray-400;
}

.timeline-node {
  border-left: 3px solid $gray-200;
  margin-left: 31px;
  padding: 0 0 0 24px;
  position: relative;

  &:last-child {
    border-left-color: transparent;
  }

  &.node-completed {
    border-left-color: $success;
    .node-check {
      background: $success;
      color: #fff;
    }
  }

  &.node-active {
    border-left-color: $primary;
    .node-dot {
      background: $primary;
      box-shadow: 0 0 0 4px rgba($primary, 0.18);
    }
  }

  &.node-pending {
    .node-pending-dot {
      background: $gray-300;
    }
  }
}

.node-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 16px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
  position: relative;

  &:hover {
    background: $gray-100;
  }
}

.node-marker {
  position: absolute;
  left: -40px;
  top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-check,
.node-dot,
.node-pending-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.node-check {
  background: transparent;
  color: $success;
  font-size: 16px;
}

.node-dot {
  background: $primary;
  box-shadow: 0 0 0 4px rgba($primary, 0.18);
}

.node-pending-dot {
  background: $gray-300;
}

.node-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-step-num {
  font-size: 11px;
  font-weight: 600;
  color: $primary;
  background: rgba($primary, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.node-step-name {
  font-size: 15px;
  font-weight: 600;
  color: $gray-800;
}

.node-handler {
  font-size: 13px;
  color: $gray-500;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.meta-status {
  font-size: 12px;
  font-weight: 500;

  &.status-已完成 {
    color: $success;
  }
  &.status-进行中 {
    color: $primary;
  }
  &.status-待处理 {
    color: $gray-400;
  }
}

.meta-time {
  font-size: 12px;
  color: $gray-400;
}

.node-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: $gray-400;
}

.toggle-icon {
  font-size: 18px;
  transition: transform 0.2s;
}

.node-body {
  padding: 0 16px 16px;
}

.node-content {
  background: #f9fafb;
  border: 1px solid $gray-200;
  border-radius: 8px;
  padding: 20px;
}

.content-inner {
  .content-section {
    .content-section-title {
      font-size: 14px;
      font-weight: 600;
      color: $gray-700;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid $gray-200;
    }
  }
}

.node-approval {
  padding: 8px 0 0;
}

.approval-row {
  margin-bottom: 12px;
}

.approval-field {
  display: flex;
  align-items: center;
  gap: 16px;
}

.approval-field-full {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.approval-label {
  font-size: 14px;
  font-weight: 500;
  color: $gray-700;
  min-width: 80px;
  flex-shrink: 0;
}

.approval-radio-group {
  :deep(.t-radio) {
    margin-right: 24px;
  }
}

.approval-textarea {
  flex: 1;
  max-width: 500px;
}

.flow-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid $gray-200;
}

:deep(.t-divider) {
  margin: 16px 0;
}

.detail-body {
  max-height: 70vh;
  overflow-y: auto;
  padding: 4px 0;
}

.detail-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 8px 0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-label {
  font-size: 12px;
  color: $gray-500;
}

.summary-value {
  font-size: 14px;
  color: $gray-800;
  font-weight: 500;
}

.detail-step {
  border: 1px solid $gray-200;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}

.detail-step-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid $gray-200;
  flex-wrap: wrap;
}

.detail-step-num {
  font-size: 11px;
  font-weight: 600;
  color: $primary;
  background: rgba($primary, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.detail-step-name {
  font-size: 14px;
  font-weight: 600;
  color: $gray-800;
}

.detail-step-handler {
  font-size: 12px;
  color: $gray-500;
  margin-left: auto;
}

.detail-step-time {
  font-size: 12px;
  color: $gray-400;
}

.detail-step-content {
  padding: 12px 16px;
}

.detail-field-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.detail-field-row-full {
  align-items: flex-start;
}

.detail-field-label {
  font-size: 13px;
  color: $gray-500;
  min-width: 100px;
  flex-shrink: 0;
}

.detail-field-value {
  font-size: 13px;
  color: $gray-800;
}
</style>
