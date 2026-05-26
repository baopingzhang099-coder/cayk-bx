<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="上传电子保单"
    width="560px"
    :footer="false"
    :destroy-on-close="true"
    @close="handleClose"
  >
    <div class="upload-body">
      <t-alert
        message="请上传电子保单文件（PDF或图片），上传后平台将进行OCR识别处理"
        theme="info"
        class="step-alert"
      />

      <div class="upload-area">
        <t-upload
          v-model="uploadFile"
          theme="file"
          placeholder="支持PDF/JPEG/PNG格式，单个文件不超过20MB"
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

      <div class="upload-info" v-if="uploadFile.length > 0">
        <t-divider />
        <div class="info-row">
          <span class="info-label">上传企业</span>
          <span class="info-value">{{ uploadCompanyName || userStore.companyName || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">上传人</span>
          <span class="info-value">{{ uploadUserName || userStore.userName || userStore.companyName || '-' }}</span>
        </div>
        <div class="info-row" v-if="policyNo">
          <span class="info-label">关联保单</span>
          <span class="info-value">{{ policyNo }}</span>
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

      <div class="upload-actions">
        <t-button variant="outline" @click="dialogVisible = false">取消</t-button>
        <t-button theme="primary" :disabled="uploadFile.length === 0" :loading="uploading" @click="handleUpload">
          {{ uploading ? '上传中...' : '确认上传' }}
        </t-button>
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
  visible: Boolean,
  policyNo: { type: String, default: '' },
  uploadCompanyName: { type: String, default: '' },
  uploadUserName: { type: String, default: '' },
  uploaderRole: { type: String, default: 'customer' }
})
const emit = defineEmits(['update:visible', 'upload-success'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v)
})

const store = useBusinessStore()
const userStore = useUserStore()

const uploadFile = ref([])
const uploading = ref(false)

const handleUpload = () => {
  if (uploadFile.value.length === 0) {
    MessagePlugin.warning('请选择要上传的文件')
    return
  }
  uploading.value = true
  setTimeout(() => {
    const file = uploadFile.value[0]
    const res = store.uploadCustomerPolicy({
      file,
      companyName: props.uploadCompanyName || userStore.companyName,
      uploadUser: props.uploadUserName || userStore.userName || userStore.companyName,
      policyNo: props.policyNo,
      uploaderRole: props.uploaderRole
    })
    uploading.value = false
    if (res?.ok) {
      MessagePlugin.success('上传成功，等待平台OCR识别处理')
      emit('upload-success', res.data)
      dialogVisible.value = false
    } else {
      MessagePlugin.error(res?.message || '上传失败')
    }
  }, 800)
}

const handleClose = () => {
  uploadFile.value = []
}
</script>

<style scoped>
.upload-body { padding: 8px 0; }
.step-alert { margin-bottom: 20px; }
.upload-area { padding: 20px 0; }
.upload-info { margin-top: 8px; }
.upload-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 4px; border-bottom: 1px solid #f5f5f5; }
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 13px; color: #666; }
.info-value { font-size: 13px; color: #333; font-weight: 500; }
</style>
