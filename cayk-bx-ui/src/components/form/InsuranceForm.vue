<template>
  <t-form
    ref="formRef"
    :data="formData"
    :rules="rules"
    label-align="top"
    class="insurance-form"
  >
    <t-tabs v-model="activeTab" class="form-tabs">
      <t-tab-panel value="customer" label="客户基本信息">
        <div class="form-grid">
          <t-form-item label="企业名称" name="enterpriseName">
            <t-input v-model="formData.enterpriseName" placeholder="请输入企业名称" />
          </t-form-item>
          <t-form-item label="统一社会信用代码" name="unifiedSocialCreditCode">
            <t-input v-model="formData.unifiedSocialCreditCode" placeholder="请输入18位统一社会信用代码" />
          </t-form-item>
          <t-form-item label="企业地址" name="enterpriseAddress" class="form-item-full">
            <t-input v-model="formData.enterpriseAddress" placeholder="请输入企业实际经营地址" />
          </t-form-item>
          <t-form-item label="联系人姓名" name="contactName">
            <t-input v-model="formData.contactName" placeholder="请输入联系人姓名" />
          </t-form-item>
          <t-form-item label="联系电话" name="contactPhone">
            <t-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
          </t-form-item>
          <t-form-item label="电子邮箱" name="contactEmail">
            <t-input v-model="formData.contactEmail" placeholder="请输入电子邮箱" />
          </t-form-item>
          <t-form-item label="营业执照" name="businessLicense" class="form-item-full">
            <t-upload
              v-model="formData.businessLicense"
              action="https://demo.com/upload"
            />
          </t-form-item>
          <t-form-item label="进出口资质" name="importExportQualification" class="form-item-full">
            <t-upload
              v-model="formData.importExportQualification"
              action="https://demo.com/upload"
            />
          </t-form-item>
        </div>
      </t-tab-panel>

      <t-tab-panel value="buyer" label="买方信息">
        <div class="form-grid">
          <t-form-item label="买方名称" name="buyerName">
            <t-input v-model="formData.buyerName" placeholder="请输入买方准确全称" />
          </t-form-item>
          <t-form-item label="买方国别" name="buyerCountry">
            <t-select v-model="formData.buyerCountry" placeholder="请选择买方所在国家/地区">
              <t-option value="美国" label="美国" />
              <t-option value="德国" label="德国" />
              <t-option value="日本" label="日本" />
              <t-option value="英国" label="英国" />
            </t-select>
          </t-form-item>
          <t-form-item label="买方地址" name="buyerAddress" class="form-item-full">
            <t-input v-model="formData.buyerAddress" placeholder="请输入买方实际地址" />
          </t-form-item>
          <t-form-item label="买方联系人" name="buyerContact">
            <t-input v-model="formData.buyerContact" placeholder="请输入买方联系人" />
          </t-form-item>
          <t-form-item label="买方联系电话" name="buyerPhone">
            <t-input v-model="formData.buyerPhone" placeholder="请输入买方联系电话" />
          </t-form-item>
          <t-form-item label="历史交易金额" name="historicalTransactionAmount">
            <t-input v-model="formData.historicalTransactionAmount" placeholder="请输入历史交易总额" />
          </t-form-item>
          <t-form-item label="授权文件" name="authorizationDocument" class="form-item-full">
            <t-upload
              v-model="formData.authorizationDocument"
              action="https://demo.com/upload"
            />
          </t-form-item>
        </div>
      </t-tab-panel>

      <t-tab-panel value="insurance" label="投保需求">
        <div class="form-grid">
          <t-form-item label="投保方案" name="insuranceScheme">
            <t-select v-model="formData.insuranceScheme" placeholder="请选择投保方案">
              <t-option value="方案A" label="方案A-全程保障" />
              <t-option value="方案B" label="方案B-基本保障" />
              <t-option value="方案C" label="方案C-标准保障" />
            </t-select>
          </t-form-item>
          <t-form-item label="投保金额" name="coverageAmount">
            <t-input-number v-model="formData.coverageAmount" placeholder="请输入投保金额" :min="0" />
          </t-form-item>
          <t-form-item label="期望保险公司" name="expectedInsuranceCompany">
            <t-select v-model="formData.expectedInsuranceCompany" placeholder="请选择期望保险公司">
              <t-option value="人保财险" label="人保财险" />
              <t-option value="平安保险" label="平安保险" />
              <t-option value="太平洋保险" label="太平洋保险" />
            </t-select>
          </t-form-item>
          <t-form-item label="保单期限" name="policyDuration">
            <t-select v-model="formData.policyDuration" placeholder="请选择保单期限">
              <t-option value="1年" label="1年" />
              <t-option value="2年" label="2年" />
            </t-select>
          </t-form-item>
          <t-form-item label="特殊需求说明" name="specialRequirements" class="form-item-full">
            <t-textarea v-model="formData.specialRequirements" placeholder="如有特殊需求请在此说明" :autosize="{ minRows: 3, maxRows: 5 }" />
          </t-form-item>
        </div>
      </t-tab-panel>
    </t-tabs>

    <div class="form-actions">
      <t-space>
        <t-button @click="handleCancel">取消</t-button>
        <t-button theme="primary" @click="handleSubmit">提交</t-button>
      </t-space>
    </div>
  </t-form>
</template>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  data: { type: Object, default: null }
})

const emit = defineEmits(['submit', 'cancel'])

const formRef = ref(null)
const activeTab = ref('customer')

const formData = reactive({
  enterpriseName: '',
  unifiedSocialCreditCode: '',
  enterpriseAddress: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  businessLicense: null,
  importExportQualification: null,
  buyerName: '',
  buyerCountry: '',
  buyerAddress: '',
  buyerContact: '',
  buyerPhone: '',
  historicalTransactionAmount: '',
  authorizationDocument: null,
  insuranceScheme: '',
  coverageAmount: null,
  expectedInsuranceCompany: '',
  policyDuration: '',
  specialRequirements: ''
})

const rules = {
  enterpriseName: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  unifiedSocialCreditCode: [{ required: true, message: '请输入统一社会信用代码', trigger: 'blur' }],
  contactName: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  contactPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  buyerName: [{ required: true, message: '请输入买方名称', trigger: 'blur' }],
  buyerCountry: [{ required: true, message: '请选择买方国别', trigger: 'change' }],
  insuranceScheme: [{ required: true, message: '请选择投保方案', trigger: 'change' }],
  coverageAmount: [{ required: true, message: '请输入投保金额', trigger: 'blur' }]
}

if (props.data) {
  Object.assign(formData, props.data)
}

const handleSubmit = async () => {
  const result = await formRef.value.validate()
  if (result === true) {
    emit('submit', { ...formData })
  }
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style lang="scss" scoped>
.insurance-form {
  padding: 16px 0;
}

.form-tabs {
  margin-bottom: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.form-item-full {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  justify-content: center;
  padding-top: 24px;
  border-top: 1px solid #e7e7e7;
}
</style>
