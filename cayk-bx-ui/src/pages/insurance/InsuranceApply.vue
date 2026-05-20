<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">投保流程管理</div>
      <div class="policy-info">
        保单号：<span class="policy-no">PI2026001234</span>
      </div>
    </div>

    <t-card class="mb-16">
      <t-steps
        v-model="currentStep"
        layout="horizontal"
        :options="stepOptions"
        sequence="positive"
      />
    </t-card>

    <t-card>
      <template #title>
        <div class="step-title">当前步骤：{{ stepOptions[currentStep - 1].label }}</div>
      </template>

      <t-timeline layout="vertical" :reverse="false">
        <t-timeline-item
          v-for="(step, index) in stepOptions"
          :key="step.value"
          :dot-color="getStepDotColor(index + 1)"
          :label-align="getStepLabelAlign(index + 1)"
        >
          <div class="timeline-item-content">
            <div class="step-header">
              <span class="step-number">{{ index + 1 }}.</span>
              <span class="step-name">{{ step.label }}</span>
              <t-tag :theme="getStepTagTheme(index + 1)" variant="light" size="small">
                {{ getStepStatusText(index + 1) }}
              </t-tag>
            </div>

            <div v-if="index + 1 === currentStep" class="step-detail">
              <template v-if="currentStep === 1">
                <t-form :data="formData.step1" label-width="120">
                  <t-form-item label="企业名称" name="enterpriseName">
                    <t-input v-model="formData.step1.enterpriseName" placeholder="请输入企业名称" />
                  </t-form-item>
                  <t-form-item label="统一社会信用代码" name="unifiedSocialCreditCode">
                    <t-input v-model="formData.step1.unifiedSocialCreditCode" placeholder="请输入统一社会信用代码" />
                  </t-form-item>
                  <t-form-item label="营业执照" name="businessLicense">
                    <t-upload v-model="formData.step1.businessLicense" :files="[]" placeholder="点击上传" />
                  </t-form-item>
                  <t-form-item label="买方名称" name="buyerName">
                    <t-input v-model="formData.step1.buyerName" placeholder="请输入买方名称" />
                  </t-form-item>
                  <t-form-item label="投保金额" name="coverageAmount">
                    <t-input v-model="formData.step1.coverageAmount" placeholder="请输入投保金额" />
                  </t-form-item>
                </t-form>
              </template>

              <template v-else-if="currentStep === 2">
                <div class="checklist">
                  <div class="checklist-title">资料审核清单</div>
                  <t-checkbox-group v-model="formData.step2.checkedItems">
                    <t-checkbox value="businessLicense">
                      <div class="check-item">
                        <span class="check-label">企业法人营业执照</span>
                        <t-tag theme="success" variant="light" size="small">已上传</t-tag>
                      </div>
                    </t-checkbox>
                    <t-checkbox value="importExportQualification">
                      <div class="check-item">
                        <span class="check-label">对外贸易经营者备案登记表</span>
                        <t-tag theme="success" variant="light" size="small">已上传</t-tag>
                      </div>
                    </t-checkbox>
                    <t-checkbox value="tradeContract">
                      <div class="check-item">
                        <span class="check-label">贸易合同</span>
                        <t-tag theme="success" variant="light" size="small">已上传</t-tag>
                      </div>
                    </t-checkbox>
                    <t-checkbox value="insuranceApplication">
                      <div class="check-item">
                        <span class="check-label">投保单</span>
                        <t-tag theme="success" variant="light" size="small">已生成</t-tag>
                      </div>
                    </t-checkbox>
                  </t-checkbox-group>
                  <t-form-item label="审核意见" class="mt-16">
                    <t-textarea v-model="formData.step2.auditOpinion" placeholder="请输入审核意见" :autosize="{ minRows: 3, maxRows: 5 }" />
                  </t-form-item>
                </div>
              </template>

              <template v-else-if="currentStep === 3">
                <div class="checklist">
                  <div class="checklist-title">资信调查清单</div>
                  <t-checkbox-group v-model="formData.step3.checkedItems">
                    <t-checkbox value="buyerQualification">
                      <span class="check-label">买方企业资质核实</span>
                    </t-checkbox>
                    <t-checkbox value="buyerCreditRecord">
                      <span class="check-label">买方信用记录查询</span>
                    </t-checkbox>
                    <t-checkbox value="tradeBackground">
                      <span class="check-label">贸易背景真实性核查</span>
                    </t-checkbox>
                  </t-checkbox-group>
                  <t-form-item label="调查报告" class="mt-16">
                    <t-upload v-model="formData.step3.investigationReport" :files="[]" placeholder="上传调查报告" />
                  </t-form-item>
                  <t-form-item label="调查意见">
                    <t-textarea v-model="formData.step3.investigationOpinion" placeholder="请输入调查意见" :autosize="{ minRows: 3, maxRows: 5 }" />
                  </t-form-item>
                </div>
              </template>

              <template v-else-if="currentStep === 4">
                <div class="checklist">
                  <div class="checklist-title">信用限额审批</div>
                  <t-form :data="formData.step4" label-width="120">
                    <t-form-item label="申请信用额度" name="appliedCreditLimit">
                      <t-input v-model="formData.step4.appliedCreditLimit" placeholder="请输入申请信用额度" />
                    </t-form-item>
                    <t-form-item label="审批信用额度" name="approvedCreditLimit">
                      <t-input v-model="formData.step4.approvedCreditLimit" placeholder="请输入审批信用额度" />
                    </t-form-item>
                    <t-form-item label="审批意见" name="approvalOpinion">
                      <t-textarea v-model="formData.step4.approvalOpinion" placeholder="请输入审批意见" :autosize="{ minRows: 3, maxRows: 5 }" />
                    </t-form-item>
                  </t-form>
                </div>
              </template>

              <template v-else-if="currentStep === 5">
                <div class="checklist">
                  <div class="checklist-title">核保出单</div>
                  <t-form :data="formData.step5" label-width="120">
                    <t-form-item label="核保信息确认" name="underwritingConfirm">
                      <t-checkbox-group v-model="formData.step5.checkedItems">
                        <t-checkbox value="policyInfo">保单信息无误</t-checkbox>
                        <t-checkbox value="premiumInfo">保费信息无误</t-checkbox>
                        <t-checkbox value="coverageInfo">保障范围无误</t-checkbox>
                      </t-checkbox-group>
                    </t-form-item>
                    <t-form-item label="核保意见" name="underwritingOpinion">
                      <t-textarea v-model="formData.step5.underwritingOpinion" placeholder="请输入核保意见" :autosize="{ minRows: 3, maxRows: 5 }" />
                    </t-form-item>
                  </t-form>
                </div>
              </template>

              <template v-else-if="currentStep === 6">
                <div class="checklist">
                  <div class="checklist-title">缴费生效</div>
                  <t-form :data="formData.step6" label-width="120">
                    <t-form-item label="保费金额" name="premiumAmount">
                      <t-input v-model="formData.step6.premiumAmount" readonly placeholder="¥12,500.00" />
                    </t-form-item>
                    <t-form-item label="支付凭证" name="paymentReceipt">
                      <t-upload v-model="formData.step6.paymentReceipt" :files="[]" placeholder="上传支付凭证" />
                    </t-form-item>
                    <t-form-item label="生效日期" name="effectiveDate">
                      <t-date-picker v-model="formData.step6.effectiveDate" />
                    </t-form-item>
                  </t-form>
                </div>
              </template>
            </div>
          </div>
        </t-timeline-item>
      </t-timeline>

      <div class="step-actions">
        <t-button
          :disabled="currentStep === 1"
          @click="prevStep"
        >
          上一步
        </t-button>
        <t-button
          v-if="currentStep < 6"
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
    </t-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'

const currentStep = ref(3)

const stepOptions = [
  { label: '提交投保申请', value: 1 },
  { label: '资料审核', value: 2 },
  { label: '资信调查', value: 3 },
  { label: '信用限额审批', value: 4 },
  { label: '核保出单', value: 5 },
  { label: '缴费生效', value: 6 }
]

const formData = reactive({
  step1: {
    enterpriseName: '深圳XX国际贸易有限公司',
    unifiedSocialCreditCode: '91440300MA5D8X1234',
    businessLicense: [],
    buyerName: 'ABC Corporation',
    coverageAmount: '5000000'
  },
  step2: {
    checkedItems: ['businessLicense', 'importExportQualification', 'tradeContract', 'insuranceApplication'],
    auditOpinion: '资料齐全，同意提交'
  },
  step3: {
    checkedItems: [],
    investigationReport: [],
    investigationOpinion: ''
  },
  step4: {
    appliedCreditLimit: '5000000',
    approvedCreditLimit: '',
    approvalOpinion: ''
  },
  step5: {
    checkedItems: [],
    underwritingOpinion: ''
  },
  step6: {
    premiumAmount: '¥12,500.00',
    paymentReceipt: [],
    effectiveDate: ''
  }
})

const getStepDotColor = (stepNum) => {
  if (stepNum < currentStep.value) return 'success'
  if (stepNum === currentStep.value) return 'primary'
  return 'default'
}

const getStepLabelAlign = () => 'left'

const getStepTagTheme = (stepNum) => {
  if (stepNum < currentStep.value) return 'success'
  if (stepNum === currentStep.value) return 'primary'
  return 'default'
}

const getStepStatusText = (stepNum) => {
  if (stepNum < currentStep.value) return '已完成'
  if (stepNum === currentStep.value) return '进行中'
  return '待处理'
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const nextStep = () => {
  if (currentStep.value < 6) {
    MessagePlugin.success('操作成功')
    currentStep.value++
  }
}

const completeProcess = () => {
  MessagePlugin.success('投保流程已完成，保单已生效！')
}
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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
.mb-16 {
  margin-bottom: 16px;
}
.step-title {
  font-size: 16px;
  font-weight: 600;
}

.timeline-item-content {
  width: 100%;
  .step-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .step-number {
    font-weight: 600;
    color: #333;
  }
  .step-name {
    font-weight: 500;
    color: #333;
  }
  .step-detail {
    background: #f5f7fa;
    padding: 20px;
    border-radius: 4px;
    margin-left: 24px;
  }
}

.checklist {
  .checklist-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
  }
  .check-item {
    display: flex;
    align-items: center;
    gap: 12px;
    .check-label {
      flex: 1;
    }
  }
}

.mt-16 {
  margin-top: 16px;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e7e7e7;
}
</style>
