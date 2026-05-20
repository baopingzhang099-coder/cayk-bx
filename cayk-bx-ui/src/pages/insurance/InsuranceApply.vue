<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-button text @click="goBack">
        <template #icon>
          <t-icon name="chevron-left" />
        </template>
        返回
      </t-button>
      <span class="breadcrumb-separator">/</span>
      <t-breadcrumb>
        <t-breadcrumb-item>首页</t-breadcrumb-item>
        <t-breadcrumb-item>投保管理</t-breadcrumb-item>
        <t-breadcrumb-item>投保流程管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    
    <div class="page-header">
      <div class="page-title">投保流程管理</div>
      <div class="policy-info">
        保单号：<span class="policy-no">PI2026001234</span>
      </div>
    </div>

    <div class="steps-progress">
      <div 
        v-for="(step, index) in stepOptions" 
        :key="step.value"
        class="step-item"
        :class="{ active: index + 1 === currentStep, completed: index + 1 < currentStep }"
        @click="setStep(index + 1)"
      >
        <div class="step-dot">
          <span class="step-number">{{ index + 1 }}</span>
        </div>
        <div class="step-label">{{ step.label }}</div>
        <div v-if="index < stepOptions.length - 1" class="step-line"></div>
      </div>
    </div>

    <div class="timeline-container">
      <div 
        v-for="(step, index) in stepOptions" 
        :key="step.value"
        class="timeline-item"
      >
        <div class="step-header">
          <span class="step-number">{{ index + 1 }}、</span>
          <span class="step-name">{{ step.label }}</span>
          <span v-if="stepInfo[index].handler" class="step-handler">处理人：{{ stepInfo[index].handler }}</span>
          <span class="step-status">状态：{{ getStepStatusText(index + 1) }}</span>
          <span v-if="stepInfo[index].startTime" class="step-time">开始时间：{{ stepInfo[index].startTime }}</span>
          <span v-if="stepInfo[index].endTime" class="step-time">完成时间：{{ stepInfo[index].endTime }}</span>
        </div>

        <div v-if="index + 1 === currentStep" class="step-detail">
          <div v-if="currentStep === 1" class="detail-section">
            <div class="section-title">投保方案确认</div>
            <div class="section-subtitle">数据来源：推荐方案（匹配结果）</div>
            <t-form :data="formData.step1" label-width="120">
              <t-form-item label="投保方案" name="insurancePlan">
                <t-select v-model="formData.step1.insurancePlan" placeholder="请选择投保方案">
                  <t-option value="planA" label="方案A - 短期出口信用保险" />
                  <t-option value="planB" label="方案B - 中长期出口信用保险" />
                  <t-option value="planC" label="方案C - 国内贸易信用保险" />
                </t-select>
              </t-form-item>
              <t-form-item label="匹配规则说明" name="matchRule">
                <t-textarea readonly :value="formData.step1.matchRule" :autosize="{ minRows: 3, maxRows: 5 }" />
              </t-form-item>
              <t-form-item label="保险公司" name="insuranceCompany">
                <t-select v-model="formData.step1.insuranceCompany" placeholder="请选择保险公司">
                  <t-option value="company1" label="中国出口信用保险公司" />
                  <t-option value="company2" label="平安财产保险" />
                  <t-option value="company3" label="太平洋财产保险" />
                </t-select>
              </t-form-item>
            </t-form>
          </div>

          <div v-else-if="currentStep === 2" class="detail-section">
            <div class="section-title">申请投保</div>
            <div class="section-subtitle">数据来源：平台提取 | 应用文件：投保申请书、买方信息采集表</div>
            <t-form :data="formData.step2" label-width="120">
              <t-form-item label="企业名称" name="enterpriseName">
                <t-input v-model="formData.step2.enterpriseName" placeholder="请输入企业名称" />
              </t-form-item>
              <t-form-item label="统一社会信用代码" name="unifiedSocialCreditCode">
                <t-input v-model="formData.step2.unifiedSocialCreditCode" placeholder="请输入统一社会信用代码" />
              </t-form-item>
              <t-form-item label="买方名称" name="buyerName">
                <t-input v-model="formData.step2.buyerName" placeholder="请输入买方名称" />
              </t-form-item>
              <t-form-item label="投保申请书" name="applicationForm">
                <t-upload v-model="formData.step2.applicationForm" :files="[]" placeholder="点击上传" />
              </t-form-item>
              <t-form-item label="买方信息采集表" name="buyerInfoForm">
                <t-upload v-model="formData.step2.buyerInfoForm" :files="[]" placeholder="点击上传" />
              </t-form-item>
            </t-form>
          </div>

          <div v-else-if="currentStep === 3" class="detail-section">
            <div class="section-title">提交投保申请</div>
            <t-form :data="formData.step3" label-width="120">
              <t-form-item label="投保金额" name="insuranceAmount">
                <t-input v-model="formData.step3.insuranceAmount" placeholder="请输入投保金额" />
              </t-form-item>
              <t-form-item label="投保期限" name="insurancePeriod">
                <t-input v-model="formData.step3.insurancePeriod" placeholder="请输入投保期限（月）" />
              </t-form-item>
              <t-form-item label="支付方式" name="paymentMethod">
                <t-select v-model="formData.step3.paymentMethod" placeholder="请选择支付方式">
                  <t-option value="lumpSum" label="一次性支付" />
                  <t-option value="installment" label="分期支付" />
                </t-select>
              </t-form-item>
              <t-form-item label="备注说明" name="remarks">
                <t-textarea v-model="formData.step3.remarks" placeholder="请输入备注说明" :autosize="{ minRows: 3, maxRows: 5 }" />
              </t-form-item>
            </t-form>
          </div>

          <div v-else-if="currentStep === 4" class="detail-section">
            <div class="section-title">审核流转</div>
            <div class="section-subtitle">数据来源：流程校验和任务管理</div>
            <div class="checklist">
              <div class="checklist-item">
                <t-checkbox v-model="formData.step4.checkedItems" value="basicInfo">基本信息校验</t-checkbox>
                <t-tag theme="success" variant="light" size="small">已完成</t-tag>
              </div>
              <div class="checklist-item">
                <t-checkbox v-model="formData.step4.checkedItems" value="documentCheck">资料完整性检查</t-checkbox>
                <t-tag theme="success" variant="light" size="small">已完成</t-tag>
              </div>
              <div class="checklist-item">
                <t-checkbox v-model="formData.step4.checkedItems" value="riskAssessment">风险评估</t-checkbox>
              </div>
            </div>
            <div class="section-title mt-16">审核结论</div>
            <div class="approval-section">
              <t-radio-group v-model="formData.step4.approvalResult">
                <t-radio value="approved">通过</t-radio>
                <t-radio value="rejected">退回修改</t-radio>
              </t-radio-group>
              <t-form-item label="审核意见" class="mt-12">
                <t-textarea v-model="formData.step4.auditOpinion" placeholder="请输入审核意见" :autosize="{ minRows: 3, maxRows: 5 }" />
              </t-form-item>
            </div>
          </div>

          <div v-else-if="currentStep === 5" class="detail-section">
            <div class="section-title">核保</div>
            <t-form :data="formData.step5" label-width="120">
              <t-form-item label="核保信息确认" name="underwritingConfirm">
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
              <t-form-item label="核保意见" name="underwritingOpinion">
                <t-textarea v-model="formData.step5.underwritingOpinion" placeholder="请输入核保意见" :autosize="{ minRows: 3, maxRows: 5 }" />
              </t-form-item>
            </t-form>
          </div>

          <div v-else-if="currentStep === 6" class="detail-section">
            <div class="section-title">保单签发</div>
            <div class="section-subtitle">数据来源：流程校验和任务管理 | 保单获取</div>
            <t-form :data="formData.step6" label-width="120">
              <t-form-item label="保单编号" name="policyNo">
                <t-input v-model="formData.step6.policyNo" readonly placeholder="系统自动生成" />
              </t-form-item>
              <t-form-item label="保单状态" name="policyStatus">
                <t-tag theme="success" variant="light">已签发</t-tag>
              </t-form-item>
              <t-form-item label="签发日期" name="issueDate">
                <t-date-picker v-model="formData.step6.issueDate" />
              </t-form-item>
              <t-form-item label="保单文件" name="policyFile">
                <t-upload v-model="formData.step6.policyFile" :files="[]" placeholder="上传保单文件" />
              </t-form-item>
            </t-form>
          </div>

          <div v-else-if="currentStep === 7" class="detail-section">
            <div class="section-title">支付管理</div>
            <div class="section-subtitle">数据来源：平台提取 | 应用文件：保单明细表、费率表</div>
            <t-form :data="formData.step7" label-width="120">
              <t-form-item label="保费金额" name="premiumAmount">
                <t-input v-model="formData.step7.premiumAmount" readonly placeholder="¥12,500.00" />
              </t-form-item>
              <t-form-item label="支付状态" name="paymentStatus">
                <t-select v-model="formData.step7.paymentStatus" placeholder="请选择支付状态">
                  <t-option value="unpaid" label="未支付" />
                  <t-option value="partial" label="部分支付" />
                  <t-option value="paid" label="已支付" />
                </t-select>
              </t-form-item>
              <t-form-item label="支付凭证" name="paymentReceipt">
                <t-upload v-model="formData.step7.paymentReceipt" :files="[]" placeholder="上传支付凭证" />
              </t-form-item>
              <t-form-item label="保单明细表" name="policyDetailFile">
                <t-upload v-model="formData.step7.policyDetailFile" :files="[]" placeholder="上传保单明细表" />
              </t-form-item>
              <t-form-item label="费率表" name="rateFile">
                <t-upload v-model="formData.step7.rateFile" :files="[]" placeholder="上传费率表" />
              </t-form-item>
            </t-form>
          </div>
        </div>

        <div v-if="index < stepOptions.length - 1" class="timeline-divider"></div>
      </div>
    </div>

    <div class="step-actions">
      <t-button
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
import { ref, reactive } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'

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

const stepInfo = reactive([
  { handler: '张三', startTime: '2026-06-01 10:30:00', endTime: '2026-06-01 11:00:00' },
  { handler: '李四', startTime: '2026-06-01 11:00:00', endTime: '2026-06-01 14:00:00' },
  { handler: '王五', startTime: '2026-06-02 09:00:00', endTime: '' },
  { handler: '', startTime: '', endTime: '' },
  { handler: '', startTime: '', endTime: '' },
  { handler: '', startTime: '', endTime: '' },
  { handler: '', startTime: '', endTime: '' }
])

const formData = reactive({
  step1: {
    insurancePlan: 'planA',
    matchRule: '根据各保险公司行业风险清单、国家（地区）分类表设定匹配规则，结合买方资质、贸易背景等因素综合评估后推荐此方案。',
    insuranceCompany: 'company1'
  },
  step2: {
    enterpriseName: '深圳XX国际贸易有限公司',
    unifiedSocialCreditCode: '91440300MA5D8X1234',
    buyerName: 'ABC Corporation',
    applicationForm: [],
    buyerInfoForm: []
  },
  step3: {
    insuranceAmount: '5000000',
    insurancePeriod: '12',
    paymentMethod: 'lumpSum',
    remarks: ''
  },
  step4: {
    checkedItems: ['basicInfo', 'documentCheck'],
    approvalResult: '',
    auditOpinion: ''
  },
  step5: {
    checkedItems: [],
    underwritingResult: '',
    underwritingOpinion: ''
  },
  step6: {
    policyNo: 'POL20260602001',
    issueDate: '',
    policyFile: []
  },
  step7: {
    premiumAmount: '¥12,500.00',
    paymentStatus: 'unpaid',
    paymentReceipt: [],
    policyDetailFile: [],
    rateFile: []
  }
})

const getStepStatusText = (stepNum) => {
  if (stepNum < currentStep.value) return '已完成'
  if (stepNum === currentStep.value) return '进行中'
  return '待处理'
}

const setStep = (step) => {
  if (step <= currentStep.value) {
    currentStep.value = step
  }
}

const goBack = () => {
  window.history.back()
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const nextStep = () => {
  if (currentStep.value < 7) {
    MessagePlugin.success('操作成功')
    currentStep.value++
  }
}

const completeProcess = () => {
  MessagePlugin.success('投保流程已完成，保单已生效！')
}
</script>

<style lang="scss" scoped>
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
  
  .breadcrumb-separator {
    margin: 0 8px;
    color: #999;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.policy-info {
  font-size: 14px;
  color: #666;
}

.policy-no {
  font-weight: 600;
  color: #0052d9;
}

.steps-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  margin-bottom: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  
  .step-dot {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    transition: all 0.3s ease;
    
    .step-number {
      font-size: 14px;
      font-weight: 600;
      color: #999;
    }
  }
  
  .step-label {
    font-size: 13px;
    color: #666;
    text-align: center;
  }
  
  .step-line {
    position: absolute;
    top: 18px;
    left: 50%;
    width: calc(100% - 18px);
    height: 2px;
    background: #e0e0e0;
    transform: translateX(50%);
    z-index: -1;
  }
  
  &.completed {
    .step-dot {
      background: #10b981;
      .step-number {
        color: #fff;
      }
    }
    .step-line {
      background: #10b981;
    }
    .step-label {
      color: #333;
    }
  }
  
  &.active {
    .step-dot {
      background: #0052d9;
      box-shadow: 0 0 0 4px rgba(0, 82, 217, 0.2);
      .step-number {
        color: #fff;
      }
    }
    .step-label {
      color: #0052d9;
      font-weight: 500;
    }
  }
}

.timeline-container {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.timeline-item {
  position: relative;
}

.step-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.step-number {
  font-weight: 600;
  color: #0052d9;
}

.step-name {
  font-weight: 500;
  color: #333;
}

.step-handler {
  font-size: 13px;
  color: #666;
}

.step-status {
  font-size: 13px;
  color: #666;
}

.step-time {
  font-size: 13px;
  color: #999;
}

.step-detail {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 12px 0;
}

.detail-section {
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .section-subtitle {
    font-size: 12px;
    color: #999;
    margin-bottom: 16px;
  }
}

.checklist {
  .checklist-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
}

.approval-section {
  display: flex;
  gap: 48px;
}

.timeline-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 16px 0;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e7e7e7;
}

.mt-12 {
  margin-top: 12px;
}

.mt-16 {
  margin-top: 16px;
}
</style>
