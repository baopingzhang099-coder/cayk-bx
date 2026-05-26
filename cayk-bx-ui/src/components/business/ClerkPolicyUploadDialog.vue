<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="代客上传电子保单"
    width="580px"
    :footer="false"
    :destroy-on-close="true"
    @close="handleClose"
  >
    <div class="upload-body">

      <!-- Step indicator -->
      <div class="step-indicator">
        <div class="step-item" :class="{ active: currentStep >= 0, completed: currentStep > 0 }">
          <div class="step-circle">{{ currentStep > 0 ? '✓' : '1' }}</div>
          <div class="step-label">客户授权</div>
        </div>
        <div class="step-line" :class="{ active: currentStep >= 1 }"></div>
        <div class="step-item" :class="{ active: currentStep >= 1 }">
          <div class="step-circle">2</div>
          <div class="step-label">上传文件</div>
        </div>
      </div>

      <t-divider />

      <!-- Step 0: Customer Authorization -->
      <div v-if="currentStep === 0" class="step-content">
        <h3 class="step-title">请求客户授权</h3>
        <t-alert theme="info" class="mb-16">
          <template #message>
            跟单员代客上传电子保单前，需要先获得客户授权同意。选择客户企业并发起授权请求。
          </template>
        </t-alert>

        <div class="form-row">
          <span class="form-label">客户企业名称 <span class="required">*</span></span>
          <t-select
            v-model="customerCompanyName"
            placeholder="请选择客户企业"
            :disabled="authRequested"
            filterable
          >
            <t-option value="深圳XX国际贸易有限公司" label="深圳XX国际贸易有限公司" />
          </t-select>
        </div>

        <div v-if="authRequested && !authorized" class="auth-waiting">
          <t-icon name="loading" size="20px" class="auth-spinner" />
          <div class="auth-waiting-content">
            <span class="auth-waiting-text">已发送授权请求，等待客户确认</span>
            <span class="auth-waiting-hint">请提醒客户登录系统，在"电子保单列表"中确认授权</span>
          </div>
        </div>

        <div v-if="authorized" class="auth-success">
          <t-icon name="check-circle-filled" size="24px" style="color: #00a870;" />
          <span class="auth-success-text">客户已授权同意，可以进行下一步</span>
        </div>

        <div class="step-actions">
          <t-button variant="outline" @click="dialogVisible = false">取消</t-button>
          <t-button
            v-if="!authRequested"
            theme="primary"
            :disabled="!customerCompanyName.trim()"
            :loading="authLoading"
            @click="handleRequestAuth"
          >
            请求授权
          </t-button>
          <t-button
            v-if="authRequested && !authorized"
            theme="default"
            @click="handleRefreshAuth"
          >
            刷新状态
          </t-button>
          <t-button v-if="authorized" theme="primary" @click="currentStep = 1">
            下一步
          </t-button>
        </div>
      </div>

      <!-- Step 1: Upload File -->
      <div v-if="currentStep === 1" class="step-content">
        <h3 class="step-title">上传保单文件</h3>
        <t-alert
          message="请上传客户提供的电子保单文件，上传后可在列表中推送平台进行OCR识别"
          theme="info"
          class="mb-16"
        />

        <div class="upload-area">
          <t-upload
            v-model="uploadFile"
            theme="file"
            placeholder="选择文件"
            accept="application/pdf,image/jpeg,image/png"
            :max="1"
            :max-size="20971520"
            :auto-upload="false"
            tips="支持扩展名：.pdf、.jpg、.jpeg、.png"
          >
            <t-button variant="outline">
              <template #icon><t-icon name="upload" /></template>
              选择文件
            </t-button>
          </t-upload>
        </div>

        <div v-if="uploadFile.length > 0" class="file-info">
          <div class="info-row">
            <span class="info-label">客户企业</span>
            <span class="info-value">{{ customerCompanyName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">上传人</span>
            <span class="info-value">{{ userStore.userName || userStore.companyName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">文件名</span>
            <span class="info-value">{{ uploadFile[0]?.name || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">文件大小</span>
            <span class="info-value">{{ uploadFile[0]?.size ? (uploadFile[0].size / 1024 / 1024).toFixed(2) + ' MB' : '-' }}</span>
          </div>
        </div>

        <div class="step-actions">
          <t-button variant="outline" @click="currentStep = 0">上一步</t-button>
          <t-button
            theme="primary"
            :disabled="uploadFile.length === 0"
            :loading="uploadLoading"
            @click="handleUploadFile"
          >
            {{ uploadLoading ? '上传中...' : '确认上传' }}
          </t-button>
        </div>
      </div>

    </div>
  </t-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { useBusinessStore } from '@/stores/business'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  visible: Boolean
})
const emit = defineEmits(['update:visible', 'upload-success'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v)
})

const store = useBusinessStore()
const userStore = useUserStore()

// Step state
const currentStep = ref(0)
const customerCompanyName = ref('')
const authRequested = ref(false)
const authLoading = ref(false)
const authorized = ref(false)
const policyRecordId = ref('')
const uploadFile = ref([])
const uploadLoading = ref(false)

const handleRequestAuth = () => {
  if (!customerCompanyName.value.trim()) {
    MessagePlugin.warning('请选择客户企业')
    return
  }
  authLoading.value = true
  setTimeout(() => {
    const res = store.createClerkPolicyDraft({
      companyName: userStore.companyName || '',
      customerCompany: customerCompanyName.value.trim(),
      uploadUser: userStore.userName || userStore.companyName || '跟单员'
    })
    authLoading.value = false
    if (!res?.ok) {
      MessagePlugin.error('创建记录失败')
      return
    }
    policyRecordId.value = res.data.id
    authRequested.value = true
    MessagePlugin.success('已发送授权请求，请等待客户确认')
  }, 600)
}

const handleRefreshAuth = () => {
  if (!policyRecordId.value) return
  const record = store.externalPolicies.find(p => p.id === policyRecordId.value)
  if (!record) {
    MessagePlugin.warning('记录不存在')
    return
  }
  if (record.status === 'clerk_auth_authorized') {
    authorized.value = true
    MessagePlugin.success('客户已授权同意')
  } else if (record.status === 'clerk_pending_auth') {
    MessagePlugin.info('客户尚未确认授权')
  }
}

const handleUploadFile = () => {
  if (uploadFile.value.length === 0) {
    MessagePlugin.warning('请选择要上传的文件')
    return
  }
  uploadLoading.value = true
  setTimeout(() => {
    const file = uploadFile.value[0]
    const res = store.clerkUploadPolicyFile(policyRecordId.value, { file })
    uploadLoading.value = false
    if (!res?.ok) {
      MessagePlugin.error(res?.message || '上传失败')
      return
    }
    MessagePlugin.success('文件上传成功，请在电子保单列表中推送平台审核')
    emit('upload-success', res.data)
    dialogVisible.value = false
  }, 800)
}

const handleClose = () => {
  currentStep.value = 0
  customerCompanyName.value = ''
  authRequested.value = false
  authLoading.value = false
  authorized.value = false
  policyRecordId.value = ''
  uploadFile.value = []
  uploadLoading.value = false
}
</script>

<style scoped>
.upload-body {
  padding: 8px 0;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0 16px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  background: #f0f0f0;
  color: #999;
  transition: all 0.3s;
}

.step-item.active .step-circle {
  background: #0052d9;
  color: #fff;
}

.step-item.completed .step-circle {
  background: #00a870;
  color: #fff;
}

.step-label {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.step-item.active .step-label {
  color: #0052d9;
  font-weight: 600;
}

.step-line {
  width: 48px;
  height: 2px;
  background: #e0e0e0;
  margin: 0 6px;
  margin-bottom: 22px;
}

.step-line.active {
  background: #0052d9;
}

.step-content {
  min-height: 200px;
}

.step-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
}

.mb-16 {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.form-label {
  font-size: 13px;
  color: #333;
  font-weight: 600;
  flex-shrink: 0;
  min-width: 110px;
}

.required {
  color: #e34d57;
}

.form-row :deep(.t-input),
.form-row :deep(.t-select) {
  flex: 1;
}

.auth-success {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #e8f8f2;
  border: 1px solid #b7ebd6;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.auth-success-text {
  font-size: 14px;
  color: #166534;
  font-weight: 600;
}

.auth-waiting {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fff8e6;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.auth-spinner {
  animation: spin 1s linear infinite;
  flex-shrink: 0;
  margin-top: 2px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.auth-waiting-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.auth-waiting-text {
  font-size: 14px;
  color: #92400e;
  font-weight: 600;
}

.auth-waiting-hint {
  font-size: 12px;
  color: #b45309;
}

.upload-area {
  padding: 12px 0;
}

.file-info {
  margin-top: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 4px 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
  border-bottom: 1px solid #eee;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: #666;
}

.info-value {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}
</style>
