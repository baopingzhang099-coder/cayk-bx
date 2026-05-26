<template>
  <t-dialog :visible="visible" @update:visible="emit('update:visible', $event)" header="续保申请" width="720px" :destroy-on-close="true">
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

    <t-alert theme="info" class="mb-16">
      <template #message>
        原保单 {{ policy?.policyNo }} 将于 {{ policy?.expiryDate }} 到期
        <span v-if="gapDays > 0" class="text-danger">，空窗期 {{ gapDays }} 天，空窗期内暂停出运申报</span>
      </template>
    </t-alert>

    <t-form ref="formRef" :data="formData" :rules="formRules" label-width="150px" @submit="handleSubmit">
      <t-divider>续保基本信息</t-divider>
      <t-form-item label="续保申请日期" name="applicationDate">
        <t-date-picker v-model="formData.applicationDate" placeholder="系统自动生成" disabled />
      </t-form-item>
      <t-form-item label="原保单到期日" name="originalExpiryDate">
        <t-date-picker v-model="formData.originalExpiryDate" disabled />
      </t-form-item>
      <t-form-item label="续保后保险期间起" name="newStartDate">
        <t-date-picker v-model="formData.newStartDate" placeholder="手动输入/自动衔接" clearable />
      </t-form-item>
      <t-form-item label="续保后保险期间止" name="newEndDate">
        <t-date-picker v-model="formData.newEndDate" placeholder="手动输入/自动衔接" clearable />
      </t-form-item>

      <t-divider>业务数据</t-divider>
      <t-form-item label="续保后预计可保营业额" name="expectedTurnover">
        <t-input-number v-model="formData.expectedTurnover" :min="0" placeholder="请输入预计可保营业额" />
      </t-form-item>
      <t-form-item label="续保后投保比例" name="insuranceRatio">
        <t-input-number v-model="formData.insuranceRatio" :min="0" :max="90" :suffix="'%'" placeholder="≤90%" />
        <template #help>投保比例不超过90%</template>
      </t-form-item>

      <t-divider>历史数据（系统自动汇总）</t-divider>
      <t-form-item label="上年度实际申报总额" name="lastYearDeclaredTotal">
        <t-input :value="`$${Number(formData.lastYearDeclaredTotal).toLocaleString()}`" disabled />
      </t-form-item>
      <t-form-item label="上年度赔付总额" name="lastYearClaimTotal">
        <t-input :value="`$${Number(formData.lastYearClaimTotal).toLocaleString()}`" disabled />
      </t-form-item>
      <t-form-item label="赔付率" name="lossRatio">
        <t-input :value="`${formData.lossRatio}%`" disabled />
      </t-form-item>
      <t-form-item label="限额利用率" name="limitUtilization">
        <t-input :value="`${formData.limitUtilization}%`" disabled />
      </t-form-item>

      <t-divider>费率与清单</t-divider>
      <t-form-item label="续保费率" name="renewalRate">
        <t-input-number v-model="formData.renewalRate" :min="0" :step="0.0001" placeholder="保险公司核定" />
      </t-form-item>
      <t-form-item label="续保后买方清单" name="buyerList">
        <t-textarea v-model="formData.buyerList" placeholder="手动更新续保后的买方清单" :autosize="{ minRows: 2, maxRows: 4 }" />
      </t-form-item>
      <t-form-item label="续保状态" name="renewalStatus">
        <t-select v-model="formData.renewalStatus" disabled>
          <t-option value="pending" label="待提交" />
          <t-option value="reviewing" label="审核中" />
          <t-option value="approved" label="已批复" />
          <t-option value="rejected" label="已拒绝" />
        </t-select>
      </t-form-item>

      <t-divider>附件上传</t-divider>
      <t-form-item label="续保申请书" name="renewalApplication">
        <t-upload v-model="formData.renewalApplication" action="https://demo.com/upload" accept=".pdf" />
      </t-form-item>
      <t-form-item label="上年度出运申报汇总" name="lastYearShipmentSummary">
        <t-upload v-model="formData.lastYearShipmentSummary" action="https://demo.com/upload" accept=".xlsx,.xls,.pdf" />
      </t-form-item>
      <t-form-item label="上年度收汇/逾期情况" name="lastYearReceiptSummary">
        <t-upload v-model="formData.lastYearReceiptSummary" action="https://demo.com/upload" accept=".xlsx,.xls,.pdf" />
      </t-form-item>

    </t-form>
    <template #footer>
      <t-space>
        <t-button variant="outline" @click="emit('update:visible', false)">取消</t-button>
        <t-button theme="primary" @click="formRef?.submit()">提交续保申请</t-button>
      </t-space>
    </template>
  </t-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { useBusinessStore } from '@/stores/business'

const store = useBusinessStore()

const props = defineProps({
  visible: Boolean,
  policy: { type: Object, default: null }
})
const emit = defineEmits(['update:visible', 'saved'])

const formRef = ref(null)

const gapDays = computed(() => {
  if (!props.policy?.expiryDate) return 0
  const today = new Date()
  const expiry = new Date(props.policy.expiryDate)
  const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
  return diff < 0 ? Math.abs(diff) : 0
})

const formData = reactive({
  applicationDate: new Date().toISOString().split('T')[0],
  originalExpiryDate: props.policy?.expiryDate || '',
  newStartDate: '',
  newEndDate: '',
  expectedTurnover: 0,
  insuranceRatio: 80,
  lastYearDeclaredTotal: 1250000,
  lastYearClaimTotal: 25000,
  lossRatio: 2.0,
  limitUtilization: 64,
  renewalRate: 0,
  buyerList: '',
  renewalStatus: 'pending',
  renewalApplication: [],
  lastYearShipmentSummary: [],
  lastYearReceiptSummary: []
})

const formRules = {
  newStartDate: [{ required: true, message: '请选择续保起期', type: 'error' }],
  newEndDate: [{ required: true, message: '请选择续保止期', type: 'error' }],
  expectedTurnover: [{ required: true, message: '请输入预计可保营业额', type: 'error' }],
  insuranceRatio: [{ required: true, message: '请输入投保比例', type: 'error' }]
}

const handleSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return
  if (formData.insuranceRatio > 90) {
    MessagePlugin.error('投保比例不能超过90%')
    return
  }
  const payload = {
    ...formData,
    policyNo: props.policy?.policyNo,
    insuranceCompany: props.policy?.insuranceCompany,
    policyholder: props.policy?.policyholder,
    insured: props.policy?.insured,
    coverageAmount: props.policy?.coverageAmount,
    premium: props.policy?.premium,
    originalEffectiveDate: props.policy?.effectiveDate,
    originalExpiryDate: props.policy?.expiryDate
  }
  const res = store.submitRenewalApplication(payload)
  if (!res?.ok) { MessagePlugin.error(res?.message || '提交失败'); return }
  MessagePlugin.success('续保申请已提交')
  emit('saved', { ...formData })
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
.mb-16 { margin-bottom: 16px; }
.text-danger { color: #e34d57; font-weight: 600; }
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
.policy-info-section { margin-bottom: 8px; }
</style>
