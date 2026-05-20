<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item>首页</t-breadcrumb-item>
        <t-breadcrumb-item>投保管理</t-breadcrumb-item>
        <t-breadcrumb-item>投保流程管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>

    <div class="page-header">
      <div class="page-title-wp">
        <div class="page-title">投保流程管理</div>
        <t-tag theme="primary" variant="light" size="small">进行中</t-tag>
      </div>
      <div class="policy-info">
        保单号：<span class="policy-no">PI2026001234</span>
      </div>
    </div>

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
          <div class="node-content">
            <div v-if="index === 0" class="content-inner">
              <div class="content-section">
                <div class="content-section-title">投保方案确认</div>
                <div class="plan-grid">
                  <div class="plan-item">
                    <span class="plan-item-label">投保方案</span>
                    <span class="plan-item-value">{{ planLabels[formData.step1.insurancePlan] }}</span>
                  </div>
                  <div class="plan-item">
                    <span class="plan-item-label">保险公司</span>
                    <span class="plan-item-value">{{ companyLabels[formData.step1.insuranceCompany] }}</span>
                  </div>
                  <div class="plan-item plan-item-full">
                    <span class="plan-item-label">匹配规则说明</span>
                    <span class="plan-item-value">{{ formData.step1.matchRule }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="index === 1" class="content-inner">
              <div class="content-section">
                <div class="content-section-title">申请投保资料</div>
                <div class="doc-checklist">
                  <div class="doc-check-item">
                    <t-checkbox v-model="step2Docs.applicationForm">投保申请书</t-checkbox>
                  </div>
                  <div class="doc-check-item">
                    <t-checkbox v-model="step2Docs.buyerInfoForm">买方信息采集表</t-checkbox>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="index === 2" class="content-inner">
              <div class="content-section">
                <div class="content-section-title">提交投保申请</div>
                <div class="doc-attach-list">
                  <div class="attach-item">
                    <t-icon name="file-text" class="attach-icon" />
                    <span>投保申请书</span>
                    <t-tag v-if="step2Docs.applicationForm" theme="success" variant="light" size="small">已附</t-tag>
                    <t-tag v-else theme="default" variant="light" size="small">未附</t-tag>
                  </div>
                  <div class="attach-item">
                    <t-icon name="file-text" class="attach-icon" />
                    <span>买方信息采集表</span>
                    <t-tag v-if="step2Docs.buyerInfoForm" theme="success" variant="light" size="small">已附</t-tag>
                    <t-tag v-else theme="default" variant="light" size="small">未附</t-tag>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="index === 3" class="content-inner">
              <div class="content-section">
                <div class="content-section-title">审核流转</div>
                <div class="checklist-group">
                  <div class="checklist-row">
                    <t-checkbox v-model="formData.step4.checkedItems" value="basicInfo">基本信息校验</t-checkbox>
                    <t-tag theme="success" variant="light" size="small">已完成</t-tag>
                  </div>
                  <div class="checklist-row">
                    <t-checkbox v-model="formData.step4.checkedItems" value="documentCheck">资料完整性检查</t-checkbox>
                    <t-tag theme="success" variant="light" size="small">已完成</t-tag>
                  </div>
                  <div class="checklist-row">
                    <t-checkbox v-model="formData.step4.checkedItems" value="riskAssessment">风险评估</t-checkbox>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="index === 4" class="content-inner">
              <div class="content-section">
                <div class="content-section-title">核保信息确认</div>
                <t-form :data="formData.step5" label-width="120">
                  <t-form-item label="核保信息确认">
                    <t-checkbox-group v-model="formData.step5.checkedItems">
                      <t-checkbox value="policyInfo">保单信息无误</t-checkbox>
                      <t-checkbox value="premiumInfo">保费信息无误</t-checkbox>
                      <t-checkbox value="coverageInfo">保障范围无误</t-checkbox>
                    </t-checkbox-group>
                  </t-form-item>
                  <t-form-item label="核保结论">
                    <t-radio-group v-model="formData.step5.underwritingResult">
                      <t-radio value="approved">承保</t-radio>
                      <t-radio value="conditional">有条件承保</t-radio>
                      <t-radio value="rejected">拒保</t-radio>
                    </t-radio-group>
                  </t-form-item>
                  <t-form-item label="核保意见">
                    <t-textarea v-model="formData.step5.underwritingOpinion" placeholder="请输入核保意见" :autosize="{ minRows: 2, maxRows: 4 }" />
                  </t-form-item>
                </t-form>
              </div>
            </div>

            <div v-else-if="index === 5" class="content-inner">
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

          <t-divider />

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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBusinessStore } from '@/stores/business'
import { MessagePlugin } from 'tdesign-vue-next'

const currentStep = ref(3)

const router = useRouter()
const businessStore = useBusinessStore()

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
    stepsCompleted: 7
  })
  MessagePlugin.success('投保流程已完成，保单已生效！')
  router.push('/insurance/task-list')
}

onMounted(() => {
  setStepStartTime(currentStep.value)
})
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

.plan-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.plan-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.plan-item-full {
    grid-column: 1 / -1;
  }
}

.plan-item-label {
  font-size: 12px;
  color: $gray-500;
}

.plan-item-value {
  font-size: 14px;
  color: $gray-800;
  font-weight: 500;
}

.doc-checklist {
  display: flex;
  gap: 32px;
  padding: 8px 0;
}

.doc-check-item {
  font-size: 14px;
}

.doc-attach-list {
  display: flex;
  gap: 24px;
  padding: 8px 0 16px;
}

.attach-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: $gray-700;
}

.attach-icon {
  color: $primary;
  font-size: 16px;
}

.checklist-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
}

.checklist-row {
  display: flex;
  align-items: center;
  gap: 12px;
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
</style>
