<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">{{ pageTitle }}</div>
      <div class="page-actions" v-if="mode !== 'detail'">
        <t-space>
          <t-button variant="outline" @click="handleSave">保存</t-button>
          <t-button theme="primary" @click="handleSubmit">提交</t-button>
        </t-space>
      </div>
    </div>

    <t-card v-if="mode === 'detail'">
      <t-tabs default-value="customer">
        <t-tab-panel value="customer" label="客户基本信息">
          <detail-panel :data="detailData" :columns="customerColumns" title="客户基本信息" />
        </t-tab-panel>
        <t-tab-panel value="buyer" label="买方信息">
          <detail-panel :data="detailData" :columns="buyerColumns" title="买方信息" />
        </t-tab-panel>
        <t-tab-panel value="insurance" label="投保需求">
          <detail-panel :data="detailData" :columns="insuranceColumns" title="投保需求" />
        </t-tab-panel>
        <t-tab-panel value="process" label="流程记录">
          <t-timeline mode="alternate">
            <t-timeline-item v-for="item in processTimeline" :key="item.time" :content="item.content" :time="item.time" :color="item.color" />
          </t-timeline>
        </t-tab-panel>
      </t-tabs>
    </t-card>

    <div v-else class="form-layout">
      <t-card class="step-card">
        <t-steps layout="vertical" :current="activeStep">
          <t-step title="客户基本信息" />
          <t-step title="买方信息" />
          <t-step title="投保需求" />
          <t-step title="上传附件" />
        </t-steps>
        <div class="step-actions">
          <t-space>
            <t-button variant="outline" :disabled="activeStep === 0" @click="activeStep -= 1">上一步</t-button>
            <t-button theme="primary" :disabled="activeStep === 3" @click="activeStep += 1">下一步</t-button>
          </t-space>
        </div>
      </t-card>

      <t-card class="form-card">
        <t-form ref="formRef" :data="formData" :rules="rules" label-align="top">
          <template v-if="activeStep === 0">
            <div class="section-title">客户基本信息</div>
            <div class="form-grid">
              <t-form-item label="企业名称" name="enterpriseName">
                <t-input v-model="formData.enterpriseName" placeholder="请输入企业名称（与证照一致）" />
              </t-form-item>
              <t-form-item label="统一社会信用代码" name="unifiedSocialCreditCode">
                <t-input v-model="formData.unifiedSocialCreditCode" placeholder="请输入18位统一社会信用代码" />
              </t-form-item>
              <t-form-item label="企业实际经营地址" name="enterpriseAddress" class="form-item-full">
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
            </div>
          </template>

          <template v-else-if="activeStep === 1">
            <div class="section-title">买方信息</div>
            <div class="form-grid">
              <t-form-item label="买方准确全称" name="buyerName">
                <t-input v-model="formData.buyerName" placeholder="请输入买方准确全称（与合同一致）" />
              </t-form-item>
              <t-form-item label="买方所在国家/地区" name="buyerCountry">
                <t-select v-model="formData.buyerCountry" placeholder="请选择买方所在国家/地区" clearable>
                  <t-option value="美国" label="美国" />
                  <t-option value="德国" label="德国" />
                  <t-option value="日本" label="日本" />
                  <t-option value="英国" label="英国" />
                </t-select>
              </t-form-item>
              <t-form-item label="买方实际地址" name="buyerAddress" class="form-item-full">
                <t-input v-model="formData.buyerAddress" placeholder="请输入买方实际地址" />
              </t-form-item>
              <t-form-item label="买方联系人" name="buyerContact">
                <t-input v-model="formData.buyerContact" placeholder="请输入买方联系人信息" />
              </t-form-item>
              <t-form-item label="买方联系电话" name="buyerPhone">
                <t-input v-model="formData.buyerPhone" placeholder="请输入买方联系电话" />
              </t-form-item>
              <t-form-item label="历史交易总额" name="historicalTransactionAmount">
                <t-input v-model="formData.historicalTransactionAmount" placeholder="请输入历史交易总额" />
              </t-form-item>
            </div>
          </template>

          <template v-else-if="activeStep === 2">
            <div class="section-title">投保需求</div>
            <div class="form-grid">
              <t-form-item label="投保方案选择" name="insuranceScheme">
                <t-select v-model="formData.insuranceScheme" placeholder="请选择投保方案" clearable>
                  <t-option value="方案A-全程保障" label="方案A-全程保障" />
                  <t-option value="方案B-基本保障" label="方案B-基本保障" />
                  <t-option value="方案C-标准保障" label="方案C-标准保障" />
                </t-select>
              </t-form-item>
              <t-form-item label="投保金额/保额" name="coverageAmount">
                <t-input-number v-model="formData.coverageAmount" placeholder="请输入投保金额" :min="0" />
              </t-form-item>
              <t-form-item label="期望保险公司" name="expectedInsuranceCompany">
                <t-select v-model="formData.expectedInsuranceCompany" placeholder="请选择期望保险公司" clearable>
                  <t-option value="人保财险" label="人保财险" />
                  <t-option value="平安保险" label="平安保险" />
                  <t-option value="太平洋保险" label="太平洋保险" />
                </t-select>
              </t-form-item>
              <t-form-item label="保单期限" name="policyDuration">
                <t-select v-model="formData.policyDuration" placeholder="请选择保单期限" clearable>
                  <t-option value="1年" label="1年" />
                  <t-option value="2年" label="2年" />
                </t-select>
              </t-form-item>
              <t-form-item label="特殊需求说明" name="specialRequirements" class="form-item-full">
                <t-textarea v-model="formData.specialRequirements" placeholder="如有特殊需求请在此说明" :autosize="{ minRows: 3, maxRows: 5 }" />
              </t-form-item>
            </div>
          </template>

          <template v-else>
            <div class="section-title">上传附件</div>
            <div class="form-grid">
              <t-form-item label="企业法人营业执照扫描件" name="businessLicense" class="form-item-full">
                <t-upload v-model="formData.businessLicense" action="https://demo.com/upload" tips="请上传营业执照扫描件" />
              </t-form-item>
              <t-form-item label="对外贸易经营者备案登记表" name="importExportQualification" class="form-item-full">
                <t-upload v-model="formData.importExportQualification" action="https://demo.com/upload" tips="请上传进出口资质文件" />
              </t-form-item>
              <t-form-item label="授权保险公司联系买方的签字文件" name="authorizationDocument" class="form-item-full">
                <t-upload v-model="formData.authorizationDocument" action="https://demo.com/upload" tips="请上传授权文件" />
              </t-form-item>
            </div>
          </template>
        </t-form>
      </t-card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import DetailPanel from '@/components/common/DetailPanel.vue'
import { useBusinessStore } from '@/stores/business'

const route = useRoute()
const router = useRouter()
const store = useBusinessStore()

const formRef = ref(null)
const activeStep = ref(0)

const mode = computed(() => {
  if (route.name === 'InsurancePurchaseDetail') return 'detail'
  if (route.name === 'InsurancePurchaseEdit') return 'edit'
  return 'create'
})

const pageTitle = computed(() => {
  if (mode.value === 'detail') return '投保详情'
  if (mode.value === 'edit') return '编辑投保'
  return '新增投保'
})

const formData = reactive({
  id: '',
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
  buyerAddress: [{ required: true, message: '请输入买方地址', trigger: 'blur' }],
  insuranceScheme: [{ required: true, message: '请选择投保方案', trigger: 'change' }],
  coverageAmount: [{ required: true, message: '请输入投保金额', trigger: 'blur' }],
  businessLicense: [{ required: true, message: '请上传企业法人营业执照扫描件', trigger: 'change' }],
  importExportQualification: [{ required: true, message: '请上传对外贸易经营者备案登记表', trigger: 'change' }],
  authorizationDocument: [{ required: true, message: '请上传授权保险公司联系买方的签字文件', trigger: 'change' }]
}

const detailData = computed(() => {
  const id = route.params?.id
  if (!id) return null
  return store.insuranceApplications.find(it => it.id === id) || null
})

const customerColumns = [
  { label: '企业名称', value: 'enterpriseName' },
  { label: '统一社会信用代码', value: 'unifiedSocialCreditCode' },
  { label: '企业地址', value: 'enterpriseAddress' },
  { label: '联系人', value: 'contactName' },
  { label: '联系电话', value: 'contactPhone' },
  { label: '电子邮箱', value: 'contactEmail' }
]

const buyerColumns = [
  { label: '买方名称', value: 'buyerName' },
  { label: '买方国别', value: 'buyerCountry' },
  { label: '买方地址', value: 'buyerAddress' },
  { label: '买方联系人', value: 'buyerContact' },
  { label: '联系电话', value: 'buyerPhone' },
  { label: '历史交易金额', value: 'historicalTransactionAmount' }
]

const insuranceColumns = [
  { label: '投保方案', value: 'insuranceScheme' },
  { label: '投保金额', value: (v) => `¥${Number(v.coverageAmount || 0).toLocaleString()}` },
  { label: '期望保险公司', value: 'expectedInsuranceCompany' },
  { label: '保单期限', value: 'policyDuration' },
  { label: '特殊需求', value: 'specialRequirements' }
]

const processTimeline = computed(() => {
  const base = detailData.value
  if (!base) return []
  const timeline = [
    { time: base.createTime || '-', content: '创建投保记录', color: 'success' }
  ]
  if (base.status === 'credit_investigating') timeline.push({ time: base.updateTime || '-', content: '提交投保申请（资信调查中）', color: 'primary' })
  if (base.status === 'completed') timeline.push({ time: base.updateTime || '-', content: '投保完成（生成保单/额度）', color: 'success' })
  return timeline
})

const initForm = () => {
  if (mode.value === 'create') return
  const row = detailData.value
  if (!row) return
  Object.assign(formData, {
    id: row.id,
    enterpriseName: row.enterpriseName || '',
    unifiedSocialCreditCode: row.unifiedSocialCreditCode || '',
    enterpriseAddress: row.enterpriseAddress || '',
    contactName: row.contactName || '',
    contactPhone: row.contactPhone || '',
    contactEmail: row.contactEmail || '',
    businessLicense: row.businessLicense ?? null,
    importExportQualification: row.importExportQualification ?? null,
    buyerName: row.buyerName || '',
    buyerCountry: row.buyerCountry || '',
    buyerAddress: row.buyerAddress || '',
    buyerContact: row.buyerContact || '',
    buyerPhone: row.buyerPhone || '',
    historicalTransactionAmount: row.historicalTransactionAmount || '',
    authorizationDocument: row.authorizationDocument ?? null,
    insuranceScheme: row.insuranceScheme || '',
    coverageAmount: row.coverageAmount ?? null,
    expectedInsuranceCompany: row.expectedInsuranceCompany || '',
    policyDuration: row.policyDuration || '',
    specialRequirements: row.specialRequirements || ''
  })
}

const handleSave = () => {
  const saved = store.createOrUpdateInsuranceApplication({ ...formData, id: formData.id || undefined })
  router.replace(`/insurance/purchase/${saved.id}/edit`)
  MessagePlugin.success('已保存')
}

const handleSubmit = async () => {
  const result = await formRef.value?.validate?.()
  if (result !== true) return
  const saved = store.createOrUpdateInsuranceApplication({ ...formData, id: formData.id || undefined })
  const res = store.submitInsuranceApplication(saved.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '提交失败')
    return
  }
  MessagePlugin.success('提交成功，已进入资信调查')
  router.push('/insurance/purchase')
}

onMounted(() => {
  store.ensureSeeded()
  initForm()
})
</script>

<style lang="scss" scoped>
.form-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 16px;
  align-items: start;
}

.step-card {
  position: sticky;
  top: 16px;
}

.step-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.form-item-full {
  grid-column: 1 / -1;
}
</style>
