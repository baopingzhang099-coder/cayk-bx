<template>
  <t-dialog :visible="visible" @update:visible="emit('update:visible', $event)" header="保单变更申请" width="700px" :destroy-on-close="true">
    <t-form ref="formRef" :data="formData" :rules="formRules" label-width="140px" @submit="handleSubmit">
      <t-divider>变更基本信息</t-divider>
      <t-form-item label="关联保单号" name="relatedPolicyNo">
        <t-input :value="policy?.policyNo || ''" disabled />
      </t-form-item>
      <t-form-item label="变更申请日期" name="applicationDate">
        <t-date-picker v-model="formData.applicationDate" disabled />
      </t-form-item>
      <t-form-item label="变更类型" name="changeType">
        <t-select v-model="formData.changeType" placeholder="请选择变更类型" clearable @change="handleChangeType">
          <t-option value="add_buyer" label="增加买方" />
          <t-option value="remove_buyer" label="减少买方" />
          <t-option value="extend" label="延期" />
          <t-option value="adjust_limit" label="变更限额" />
          <t-option value="change_insured" label="变更被保险人信息" />
          <t-option value="change_contact" label="变更联系人" />
          <t-option value="change_address" label="变更地址" />
          <t-option value="other" label="其他" />
        </t-select>
      </t-form-item>
      <t-form-item label="变更原因" name="changeReason">
        <t-textarea v-model="formData.changeReason" placeholder="请输入变更原因说明" :autosize="{ minRows: 2, maxRows: 4 }" />
      </t-form-item>
      <t-form-item label="变更前内容" name="beforeContent">
        <t-textarea v-model="formData.beforeContent" placeholder="变更前的内容描述" :autosize="{ minRows: 2, maxRows: 4 }" />
      </t-form-item>
      <t-form-item label="变更后内容" name="afterContent">
        <t-textarea v-model="formData.afterContent" placeholder="变更后的内容描述" :autosize="{ minRows: 2, maxRows: 4 }" />
      </t-form-item>
      <t-form-item label="变更生效日期" name="effectiveDate">
        <t-date-picker v-model="formData.effectiveDate" placeholder="保险公司回填" clearable />
      </t-form-item>
      <t-form-item label="批单/批注编号" name="endorsementNo">
        <t-input v-model="formData.endorsementNo" placeholder="保险公司生成后填写" />
      </t-form-item>

      <t-divider>附件上传</t-divider>
      <t-form-item label="变更申请书（必传）" name="changeApplication">
        <t-upload v-model="formData.changeApplication" action="https://demo.com/upload" accept=".pdf" />
      </t-form-item>
      <t-form-item label="证明文件" name="supportingDocs">
        <t-upload v-model="formData.supportingDocs" action="https://demo.com/upload" accept=".pdf,.jpg,.png" multiple />
        <template #help>按变更类型上传相应证明文件</template>
      </t-form-item>

    </t-form>
    <template #footer>
      <t-space>
        <t-button variant="outline" @click="emit('update:visible', false)">取消</t-button>
        <t-button theme="primary" @click="formRef?.submit()">提交变更申请</t-button>
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

const formData = reactive({
  applicationDate: new Date().toISOString().split('T')[0],
  changeType: '',
  changeReason: '',
  beforeContent: '',
  afterContent: '',
  effectiveDate: '',
  endorsementNo: '',
  changeApplication: [],
  supportingDocs: []
})

const formRules = {
  changeType: [{ required: true, message: '请选择变更类型', type: 'error' }],
  changeReason: [{ required: true, message: '请输入变更原因', type: 'error' }],
  changeApplication: [{ required: true, message: '请上传变更申请书', type: 'error' }]
}

const handleChangeType = (value) => {
  const tips = {
    add_buyer: '新增买方：提供买方准确全称、地址、国别等基本信息',
    remove_buyer: '减少买方：确认该买方无未了结的保险责任',
    extend: '延期：说明延期原因和新的保险期限',
    adjust_limit: '变更限额：调整保额或费率',
    change_insured: '变更被保险人信息：公司名称、地址、联系方式等变更',
    change_contact: '变更联系人：更新联系人姓名、联系方式',
    change_address: '变更地址：更新企业注册地址或经营地址',
    other: '其他：根据跟单员要求提供相应证明'
  }
  if (tips[value]) {
    MessagePlugin.info(tips[value])
  }
}

const handleSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return
  MessagePlugin.success('保单变更申请已提交（原型模拟）')
  emit('saved', { ...formData })
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
</style>
