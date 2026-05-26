<template>
  <t-dialog :visible="visible" @update:visible="emit('update:visible', $event)" header="退保申请" width="720px" :destroy-on-close="true">
    <!-- 保单信息 -->
    <div class="policy-info-section" v-if="policy">
      <div class="modal-section-title">📋 保单信息</div>
      <div class="info-grid mb-16">
        <div class="info-row">
          <span class="info-label">保单号</span>
          <span class="info-value">{{ policy.policyNo }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">保险公司</span>
          <span class="info-value">{{ policy.insuranceCompany }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">被保险人</span>
          <span class="info-value">{{ policy.policyholder }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">投保买方</span>
          <span class="info-value">{{ policy.insured }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">保险金额</span>
          <span class="info-value">${{ Number(policy.coverageAmount || 0).toLocaleString() }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">保费金额</span>
          <span class="info-value">${{ Number(policy.premium || 0).toLocaleString() }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">生效日期</span>
          <span class="info-value">{{ policy.effectiveDate }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">到期日期</span>
          <span class="info-value">{{ policy.expiryDate }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">已用额度</span>
          <span class="info-value">${{ Number(policy.usedQuota || 0).toLocaleString() }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">剩余额度</span>
          <span class="info-value">${{ Number(policy.remainingQuota || 0).toLocaleString() }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">币种</span>
          <span class="info-value">{{ policy.currency || 'USD' }}</span>
        </div>
      </div>
    </div>
    <t-form ref="formRef" :data="formData" :rules="formRules" label-width="140px" @submit="handleSubmit">
      <t-divider>退保信息</t-divider>
      <t-form-item label="退保申请日期" name="applicationDate">
        <t-date-picker v-model="formData.applicationDate" disabled />
      </t-form-item>
      <t-form-item label="关联保单" name="policyNo">
        <t-input :value="policy?.policyNo || ''" disabled />
      </t-form-item>
      <t-form-item label="退保原因" name="surrenderReason">
        <t-textarea v-model="formData.surrenderReason" placeholder="请输入退保原因" :autosize="{ minRows: 3, maxRows: 5 }" />
      </t-form-item>
      <t-form-item label="退保生效日期" name="effectiveDate">
        <t-date-picker v-model="formData.effectiveDate" placeholder="保险公司核定" clearable />
      </t-form-item>

      <t-divider>费用结算</t-divider>
      <t-form-item label="已生效月数" name="activeMonths">
        <t-input-number v-model="formData.activeMonths" :min="0" disabled />
        <template #help>系统自动计算</template>
      </t-form-item>
      <t-form-item label="短期费率" name="shortTermRate">
        <t-input-number v-model="formData.shortTermRate" :min="0" :max="100" :suffix="'%'" placeholder="保险公司核定" />
      </t-form-item>
      <t-form-item label="应退保费金额" name="refundAmount">
        <t-input-number v-model="formData.refundAmount" :min="0" placeholder="保险公司核定" />
        <template #help>按未到期天数比例计算退费</template>
      </t-form-item>

      <t-divider>附件上传</t-divider>
      <t-form-item label="退保申请书（必传）" name="surrenderApplication">
        <t-upload v-model="formData.surrenderApplication" action="https://demo.com/upload" accept=".pdf" />
      </t-form-item>
      <t-form-item label="原保险单正本" name="originalPolicy">
        <t-upload v-model="formData.originalPolicy" action="https://demo.com/upload" accept=".pdf,.jpg" />
        <template #help>如已领取需退回</template>
      </t-form-item>
      <t-form-item label="法人身份证明/授权委托书" name="legalPersonId">
        <t-upload v-model="formData.legalPersonId" action="https://demo.com/upload" accept=".pdf,.jpg" />
      </t-form-item>
      <t-form-item label="缴费凭证复印件" name="paymentReceipt">
        <t-upload v-model="formData.paymentReceipt" action="https://demo.com/upload" accept=".pdf,.jpg" />
      </t-form-item>
      <t-form-item label="其他文件" name="otherDocuments">
        <t-upload v-model="formData.otherDocuments" action="https://demo.com/upload" accept=".pdf,.jpg" multiple />
      </t-form-item>

    </t-form>
    <template #footer>
      <t-space>
        <t-button variant="outline" @click="emit('update:visible', false)">取消</t-button>
        <t-button theme="primary" @click="formRef?.submit()">提交退保申请</t-button>
      </t-space>
    </template>
  </t-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'

const props = defineProps({
  visible: Boolean,
  policy: { type: Object, default: null }
})
const emit = defineEmits(['update:visible', 'saved'])

const formRef = ref(null)

const calculateActiveMonths = () => {
  if (!props.policy?.effectiveDate || !props.policy?.expiryDate) return 0
  const start = new Date(props.policy.effectiveDate)
  const end = new Date(props.policy.expiryDate)
  return Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth())
}

const formData = reactive({
  applicationDate: new Date().toISOString().split('T')[0],
  surrenderReason: '',
  effectiveDate: '',
  activeMonths: calculateActiveMonths(),
  shortTermRate: 0,
  refundAmount: 0,
  surrenderApplication: [],
  originalPolicy: [],
  legalPersonId: [],
  paymentReceipt: [],
  otherDocuments: []
})

const formRules = {
  surrenderReason: [{ required: true, message: '请输入退保原因', type: 'error' }],
  surrenderApplication: []
}

const handleSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return
  MessagePlugin.success('退保申请已提交（原型模拟）')
  emit('saved', { ...formData })
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
.modal-section-title {
  font-size: 15px; font-weight: 600; color: #333; margin-bottom: 12px; padding: 0 4px;
}
.info-grid {
  display: flex; flex-direction: column; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; margin-bottom: 16px;
}
.info-row {
  display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #f0f0f0;
}
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 13px; color: #666; flex-shrink: 0; }
.info-value { font-size: 13px; color: #333; font-weight: 600; text-align: right; }
.mb-16 { margin-bottom: 16px; }
.policy-info-section { margin-bottom: 8px; }
</style>
