<template>
  <t-dialog :visible="visible" @update:visible="emit('update:visible', $event)" header="退保申请" width="600px" :destroy-on-close="true">
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
  surrenderApplication: [{ required: true, message: '请上传退保申请书', type: 'error' }]
}

const handleSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return
  MessagePlugin.success('退保申请已提交（原型模拟）')
  emit('saved', { ...formData })
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
</style>
