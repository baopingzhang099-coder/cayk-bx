<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/policy/list">保单管理</t-breadcrumb-item>
        <t-breadcrumb-item to="/policy/change">保单变更管理</t-breadcrumb-item>
        <t-breadcrumb-item>保单变更申请</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">保单变更申请</div>
      <div class="page-actions">
        <t-space>
          <t-button variant="outline" @click="handleBack">返回</t-button>
          <t-button theme="primary" @click="handleSaveDraft" :disabled="submitted">保存草稿</t-button>
          <t-button theme="primary" @click="handleSubmit" :disabled="submitted" :loading="submitting">提交平台审核</t-button>
        </t-space>
      </div>
    </div>

    <!-- Policy Info (read-only) -->
    <div class="form-card">
      <div class="form-card-title">保单信息</div>
      <div class="form-grid">
        <div class="form-item">
          <label class="form-label">保单号</label>
          <t-input :value="policy?.policyNo || policyNo" readonly />
        </div>
        <div class="form-item">
          <label class="form-label">保险公司</label>
          <t-input :value="policy?.insuranceCompany || '-'" readonly />
        </div>
        <div class="form-item">
          <label class="form-label">被保险人</label>
          <t-input :value="policy?.policyholder || '-'" readonly />
        </div>
        <div class="form-item">
          <label class="form-label">投保买方</label>
          <t-input :value="policy?.insured || '-'" readonly />
        </div>
        <div class="form-item">
          <label class="form-label">保险金额</label>
          <t-input :value="policy ? '$' + Number(policy.coverageAmount || 0).toLocaleString() : '-'" readonly />
        </div>
        <div class="form-item">
          <label class="form-label">保单状态</label>
          <t-input :value="policy ? (policyStatusMap[policy.status] || policy.status) : '-'" readonly />
        </div>
      </div>
    </div>

    <!-- Change Info -->
    <div class="form-card">
      <div class="form-card-title">变更信息</div>
      <div class="form-grid">
        <div class="form-item">
          <label class="form-label">变更类型 <span style="color:#dc2626;">*</span></label>
          <t-select v-model="form.changeType" placeholder="请选择变更类型" :options="changeTypeOptions" @change="handleTypeChange" />
        </div>
        <div class="form-item">
          <label class="form-label">生效日期 <span style="color:#dc2626;">*</span></label>
          <t-date-picker v-model="form.effectiveDate" placeholder="请选择生效日期" :enable-time-picker="false" />
        </div>
        <div class="form-item full-width">
          <label class="form-label">变更原因 <span style="color:#dc2626;">*</span></label>
          <t-textarea v-model="form.changeReason" placeholder="请输入变更原因" :rows="3" maxlength="500" show-limit-number />
        </div>
        <div class="form-item full-width">
          <label class="form-label">变更前内容</label>
          <t-textarea v-model="form.beforeContent" placeholder="请填写变更前内容" :rows="3" />
        </div>
        <div class="form-item full-width">
          <label class="form-label">变更后内容 <span style="color:#dc2626;">*</span></label>
          <t-textarea v-model="form.afterContent" placeholder="请填写变更后内容" :rows="3" />
        </div>
      </div>
    </div>

    <!-- File Upload -->
    <div class="form-card">
      <div class="form-card-title">文件上传</div>
      <div class="form-grid">
        <div class="form-item full-width">
          <label class="form-label">变更申请书 <span style="color:#dc2626;">*</span></label>
          <p class="form-tip">请上传填写的变更申请书（PDF格式）</p>
          <t-upload v-model="form.changeApplication" theme="file" :auto-upload="false" accept="application/pdf" placeholder="上传变更申请书" />
        </div>
        <div class="form-item full-width">
          <label class="form-label">证明材料</label>
          <p class="form-tip">相关证明材料（图片或PDF格式）</p>
          <t-upload v-model="form.supportingDocs" theme="file" :auto-upload="false" accept="application/pdf,image/jpeg,image/png" placeholder="上传证明材料" multiple />
        </div>
      </div>
    </div>

    <!-- Service Fee -->
    <div class="form-card">
      <div class="form-card-title">服务费</div>
      <div class="form-grid">
        <div class="form-item">
          <label class="form-label">服务费金额</label>
          <t-input-number v-model="form.serviceFee" :min="0" :step="100" placeholder="请输入服务费金额" />
        </div>
        <div class="form-item">
          <label class="form-label">支付方式</label>
          <t-select v-model="form.paymentMethod" placeholder="请选择支付方式" :options="[
            { value: 'bank_transfer', label: '银行转账' },
            { value: 'wechat', label: '微信支付' },
            { value: 'alipay', label: '支付宝' }
          ]" />
        </div>
      </div>
    </div>

    <!-- Submit confirmation dialog -->
    <t-dialog v-model:visible="submitVisible" header="确认提交平台审核" width="500px">
      <div class="confirm-tip" style="margin-top:0;">
        <t-icon name="info-circle-filled" size="16px" class="tip-icon" />
        <span class="tip-text">请确认信息填写完整后提交。提交后将进入平台审核流程，无法直接修改。</span>
      </div>
      <div class="submit-summary" style="margin-top:16px;">
        <div class="summary-row"><span class="summary-label">变更类型</span><span class="summary-value">{{ selectedTypeLabel }}</span></div>
        <div class="summary-row"><span class="summary-label">变更原因</span><span class="summary-value">{{ form.changeReason }}</span></div>
        <div class="summary-row"><span class="summary-label">生效日期</span><span class="summary-value">{{ form.effectiveDate || '-' }}</span></div>
        <div class="summary-row"><span class="summary-label">服务费</span><span class="summary-value">{{ form.serviceFee ? '$' + form.serviceFee : '-' }}</span></div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="submitVisible = false">取消</t-button>
          <t-button theme="primary" @click="confirmSubmit" :loading="submitting">确认提交</t-button>
        </t-space>
      </template>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { useBusinessStore } from '@/stores/business'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const store = useBusinessStore()
const userStore = useUserStore()

const policyNo = computed(() => route.query.policyNo || '')
const policy = computed(() => {
  if (!policyNo.value) return null
  return store.policies.find(p => p.policyNo === policyNo.value) || null
})

const policyStatusMap = {
  active: '有效',
  expiring: '即将到期',
  expired: '已到期',
  cancelled: '已退保',
  terminated: '已终止'
}

const changeTypeOptions = [
  { value: 'add_buyer', label: '增加买方' },
  { value: 'remove_buyer', label: '减少买方' },
  { value: 'extend', label: '展期' },
  { value: 'adjust_limit', label: '额度调整' },
  { value: 'change_insured', label: '被保险人变更' },
  { value: 'change_contact', label: '联系人变更' },
  { value: 'change_address', label: '地址变更' },
  { value: 'other', label: '其他变更' }
]

const form = ref({
  changeType: '',
  changeReason: '',
  beforeContent: '',
  afterContent: '',
  effectiveDate: '',
  changeApplication: [],
  supportingDocs: [],
  serviceFee: 0,
  paymentMethod: ''
})

const submitted = ref(false)
const submitting = ref(false)
const submitVisible = ref(false)

const selectedTypeLabel = computed(() => {
  const opt = changeTypeOptions.find(o => o.value === form.value.changeType)
  return opt ? opt.label : ''
})

onMounted(() => {
  if (!policyNo.value) {
    MessagePlugin.warning('缺少保单号')
    router.push('/policy/change')
  }
  if (!policy.value) {
    MessagePlugin.warning('未找到保单信息')
  }
})

const handleBack = () => {
  if (submitted.value) {
    router.push('/policy/change')
  } else {
    router.back()
  }
}

const handleTypeChange = (val) => {
  form.value.changeType = val
}

const validateForm = () => {
  if (!form.value.changeType) { MessagePlugin.warning('请选择变更类型'); return false }
  if (!form.value.changeReason.trim()) { MessagePlugin.warning('请输入变更原因'); return false }
  if (!form.value.afterContent.trim()) { MessagePlugin.warning('请输入变更后内容'); return false }
  if (!form.value.effectiveDate) { MessagePlugin.warning('请选择生效日期'); return false }
  if (!form.value.changeApplication.length) { MessagePlugin.warning('请上传变更申请书'); return false }
  return true
}

const handleSaveDraft = () => {
  const res = store.createPolicyChangeApp(policyNo.value, form.value)
  if (!res?.ok) { MessagePlugin.error(res?.message || '保存失败'); return }
  MessagePlugin.success('草稿已保存')
  submitted.value = true
}

const handleSubmit = () => {
  if (!validateForm()) return
  submitVisible.value = true
}

const confirmSubmit = async () => {
  submitting.value = true
  try {
    const res = store.createPolicyChangeApp(policyNo.value, form.value)
    if (!res?.ok) { MessagePlugin.error(res?.message || '提交失败'); return }

    const appId = res.data.id

    // Pay service fee if amount set
    if (form.value.serviceFee > 0) {
      store.payPolicyChangeServiceFee(appId, {
        amount: form.value.serviceFee,
        method: form.value.paymentMethod || 'bank_transfer',
        payTime: new Date().toISOString()
      })
    }

    // Submit to platform
    const submitRes = store.submitChangeToPlatform(appId)
    if (!submitRes?.ok) { MessagePlugin.error(submitRes?.message || '提交失败'); return }

    MessagePlugin.success('变更申请已提交平台审核')
    submitted.value = true
    submitVisible.value = false
    router.push('/policy/change')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 700; color: #1e293b; }
.breadcrumbs { margin-bottom: 16px; }

.form-card { background: #fff; border-radius: 8px; padding: 24px; margin-bottom: 16px; border: 1px solid #eef2f6; }
.form-card-title { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 16px; padding-left: 10px; border-left: 3px solid #0052d9; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-item.full-width { grid-column: 1 / -1; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 6px; }
.form-tip { font-size: 12px; color: #94a3b8; margin-bottom: 8px; }
.confirm-tip { display: flex; align-items: center; gap: 8px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 10px 14px; }
.tip-icon { color: #f59e0b; }
.tip-text { font-size: 13px; color: #92400e; }

.submit-summary { background: #f8fafc; border: 1px solid #eef2f6; border-radius: 8px; overflow: hidden; }
.summary-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid #f5f7fa; }
.summary-row:last-child { border-bottom: none; }
.summary-label { font-size: 13px; color: #64748b; }
.summary-value { font-size: 13px; color: #1e293b; font-weight: 600; }
</style>
