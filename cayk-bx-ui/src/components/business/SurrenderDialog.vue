<template>
  <t-dialog :visible="visible" @update:visible="emit('update:visible', $event)" header="退保申请" width="720px" :destroy-on-close="true">
    <!-- 保单信息 -->
    <div class="policy-info-section" v-if="policy">
      <div class="modal-section-title">保单信息</div>
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
import { useBusinessStore } from '@/stores/business'

const store = useBusinessStore()

const props = defineProps({
  visible: Boolean,
  policy: { type: Object, default: null }
})
const emit = defineEmits(['update:visible', 'saved'])

const formRef = ref(null)

const formData = reactive({
  applicationDate: new Date().toISOString().split('T')[0],
  surrenderReason: '',
  surrenderApplication: [],
  originalPolicy: [],
  legalPersonId: [],
  paymentReceipt: [],
  otherDocuments: []
})

const formRules = {
  surrenderReason: [{ required: true, message: '请输入退保原因', type: 'error' }]
}

const handleSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return
  if (!props.policy) { MessagePlugin.error('保单信息缺失'); return }
  const res = store.createSurrenderApp(props.policy.policyNo, { ...formData })
  if (!res?.ok) { MessagePlugin.error(res?.message || '提交失败'); return }
  // submit to platform immediately after creation
  const submitRes = store.submitSurrenderToPlatform(res.data.id)
  if (!submitRes?.ok) { MessagePlugin.error(submitRes?.message || '提交审核失败'); return }
  MessagePlugin.success('退保申请已提交至平台审核')
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
