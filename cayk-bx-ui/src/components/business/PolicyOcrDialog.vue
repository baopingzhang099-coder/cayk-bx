<template>
  <t-dialog :visible="visible" @update:visible="emit('update:visible', $event)" header="电子保单数字化" width="800px" :destroy-on-close="true">
    <t-tabs v-model="activeTab">
      <t-tab-panel value="upload" label="1. 上传文件">
        <div class="ocr-upload">
          <div v-if="externalPolicy" class="ext-policy-info">
            <t-alert theme="info" class="mb-16">
              <template #message>
                来自 <strong>{{ externalPolicy.customerCompany }}</strong> 上传的保单文件，请确认后开始OCR识别
              </template>
            </t-alert>
            <div class="file-detail">
              <div class="file-icon">
                <t-icon name="file-pdf" style="color: #dc2626; font-size: 32px;" />
              </div>
              <div class="file-meta">
                <div class="file-name">{{ externalPolicy.originalFileName }}</div>
                <div class="file-info-text">上传时间：{{ externalPolicy.createTime }} | 文件大小：{{ externalPolicy.fileSize || '-' }}</div>
              </div>
            </div>
          </div>
          <template v-else>
            <t-upload
              v-model="uploadFiles"
              accept="image/jpeg,image/png,application/pdf"
              :max="5"
              :max-size="10 * 1024 * 1024"
              placeholder="选择文件"
              tips="上传保单/批单文件，系统将自动识别提取关键字段"
              theme="file-flow"
              :request-method="mockUpload"
              @success="handleUploadSuccess"
            />
          </template>
          <t-button theme="primary" class="mt-16" @click="startOcr">
            <t-icon name="scan" /> 开始识别
          </t-button>
        </div>
      </t-tab-panel>
      <t-tab-panel value="review" label="2. 校对确认">
        <div class="ocr-review">
          <t-alert theme="info" class="mb-16">
            <template #message>
              请逐项校对 OCR 识别结果，<span class="text-danger">红色标记字段</span>需与贸易环节信息一致
            </template>
          </t-alert>

          <t-divider>基础信息</t-divider>
          <t-form :data="ocrData" label-width="140px">
            <t-row :gutter="16">
              <t-col :span="12">
                <t-form-item label="保险单号" name="policyNo">
                  <t-input v-model="ocrData.policyNo" placeholder="OCR识别或手动输入" />
                </t-form-item>
              </t-col>
              <t-col :span="12">
                <t-form-item label="保险公司名称" name="insuranceCompany">
                  <t-select v-model="ocrData.insuranceCompany" placeholder="OCR识别或选择" clearable>
                    <t-option value="中国信保" label="中国信保" />
                    <t-option value="人保财险" label="人保财险" />
                    <t-option value="太保产险" label="太保产险" />
                    <t-option value="平安产险" label="平安产险" />
                    <t-option value="裕利安宜" label="裕利安宜" />
                    <t-option value="安裕" label="安裕" />
                    <t-option value="科法斯" label="科法斯" />
                    <t-option value="香港信保局" label="香港信保局" />
                  </t-select>
                </t-form-item>
              </t-col>
              <t-col :span="12">
                <t-form-item label="保险人名称" name="insurerName">
                  <t-input v-model="ocrData.insurerName" placeholder="OCR识别或手动输入" />
                </t-form-item>
              </t-col>
              <t-col :span="12">
                <t-form-item label="被保险人名称" name="policyholder" class="field-strong-validate">
                  <t-input v-model="ocrData.policyholder" placeholder="OCR识别或手动输入" />
                  <template #help>强校验：需与贸易项下卖方信息一致</template>
                </t-form-item>
              </t-col>
              <t-col :span="12">
                <t-form-item label="受益人名称" name="beneficiary">
                  <t-input v-model="ocrData.beneficiary" placeholder="OCR识别或手动输入" />
                </t-form-item>
              </t-col>
              <t-col :span="8">
                <t-form-item label="保险起期" name="effectiveDate">
                  <t-date-picker v-model="ocrData.effectiveDate" placeholder="选择起期" clearable />
                </t-form-item>
              </t-col>
              <t-col :span="8">
                <t-form-item label="保险止期" name="expiryDate">
                  <t-date-picker v-model="ocrData.expiryDate" placeholder="选择止期" clearable />
                </t-form-item>
              </t-col>
              <t-col :span="8">
                <t-form-item label="保险期间" name="insurancePeriod">
                  <t-input v-model="ocrData.insurancePeriod" placeholder="如：12个月" />
                </t-form-item>
              </t-col>
              <t-col :span="8">
                <t-form-item label="续保标识" name="renewalFlag">
                  <t-radio-group v-model="ocrData.renewalFlag">
                    <t-radio value="yes">是</t-radio>
                    <t-radio value="no">否</t-radio>
                  </t-radio-group>
                </t-form-item>
              </t-col>
              <t-col :span="8">
                <t-form-item label="投保金额" name="coverageAmount">
                  <t-input-number v-model="ocrData.coverageAmount" :min="0" placeholder="输入金额" />
                </t-form-item>
              </t-col>
              <t-col :span="8">
                <t-form-item label="投保币种" name="currency">
                  <t-select v-model="ocrData.currency" placeholder="选择币种" clearable>
                    <t-option value="USD" label="USD - 美元" />
                    <t-option value="CNY" label="CNY - 人民币" />
                    <t-option value="HKD" label="HKD - 港币" />
                    <t-option value="EUR" label="EUR - 欧元" />
                  </t-select>
                </t-form-item>
              </t-col>
              <t-col :span="12">
                <t-form-item label="国家风险类别版本" name="countryRiskVersion">
                  <t-input v-model="ocrData.countryRiskVersion" placeholder="录入/校对" />
                </t-form-item>
              </t-col>
              <t-col :span="12">
                <t-form-item label="条款版本/约定保险范围" name="clauseVersion">
                  <t-input v-model="ocrData.clauseVersion" placeholder="录入/校对" />
                </t-form-item>
              </t-col>
              <t-col :span="12">
                <t-form-item label="业务类型" name="businessType">
                  <t-select v-model="ocrData.businessType" placeholder="选择业务类型" clearable>
                    <t-option value="goods" label="货物贸易" />
                    <t-option value="service" label="服务贸易" />
                  </t-select>
                </t-form-item>
              </t-col>
            </t-row>
          </t-form>

          <t-divider>责任限额</t-divider>
          <t-form :data="ocrData" label-width="140px">
            <t-row :gutter="16">
              <t-col :span="12">
                <t-form-item label="最高赔偿限额" name="maxCompensation">
                  <t-input-number v-model="ocrData.maxCompensation" :min="0" placeholder="录入/校对" />
                </t-form-item>
              </t-col>
              <t-col :span="12">
                <t-form-item label="买方信息（多买方）" name="buyerNames">
                  <t-input v-model="ocrData.buyerNames" placeholder="多个买方用逗号分隔" />
                  <template #help>强校验：需与贸易环节买方一致</template>
                </t-form-item>
              </t-col>
              <t-col :span="12">
                <t-form-item label="买方信用限额" name="buyerCreditLimit">
                  <t-input-number v-model="ocrData.buyerCreditLimit" :min="0" placeholder="录入/校对" />
                </t-form-item>
              </t-col>
              <t-col :span="12">
                <t-form-item label="承保风险及赔偿比例" name="riskCoverage">
                  <t-input v-model="ocrData.riskCoverage" placeholder="OCR识别后匹配/可修改" />
                </t-form-item>
              </t-col>
              <t-col :span="8">
                <t-form-item label="限额闲置期" name="idlePeriod">
                  <t-input-number v-model="ocrData.idlePeriod" :min="0" placeholder="天数" />
                  <template #help>届满前30日提醒</template>
                </t-form-item>
              </t-col>
              <t-col :span="8">
                <t-form-item label="自行掌握限额" name="selfControlledLimit">
                  <t-input-number v-model="ocrData.selfControlledLimit" :min="0" placeholder="录入金额" />
                </t-form-item>
              </t-col>
              <t-col :span="8">
                <t-form-item label="免赔额" name="deductible">
                  <t-input-number v-model="ocrData.deductible" :min="0" placeholder="录入" />
                </t-form-item>
              </t-col>
            </t-row>
          </t-form>

          <t-divider>申报规则</t-divider>
          <t-form :data="ocrData" label-width="140px">
            <t-row :gutter="16">
              <t-col :span="8">
                <t-form-item label="申报方式" name="declarationMethod">
                  <t-select v-model="ocrData.declarationMethod" placeholder="选择" clearable>
                    <t-option value="逐笔" label="逐笔" />
                    <t-option value="月度" label="月度" />
                    <t-option value="季度" label="季度" />
                  </t-select>
                </t-form-item>
              </t-col>
              <t-col :span="8">
                <t-form-item label="申报周期" name="declarationCycle">
                  <t-select v-model="ocrData.declarationCycle" placeholder="选择" clearable>
                    <t-option value="月度" label="月度" />
                    <t-option value="季度" label="季度" />
                  </t-select>
                </t-form-item>
              </t-col>
              <t-col :span="8">
                <t-form-item label="申报截止日期" name="declarationDeadline">
                  <t-input v-model="ocrData.declarationDeadline" placeholder="如：次月15日" />
                </t-form-item>
              </t-col>
              <t-col :span="12">
                <t-form-item label="申报币种" name="declarationCurrency">
                  <t-select v-model="ocrData.declarationCurrency" placeholder="选择" clearable>
                    <t-option value="USD" label="USD" />
                    <t-option value="CNY" label="CNY" />
                  </t-select>
                </t-form-item>
              </t-col>
            </t-row>
          </t-form>

          <t-divider>费用管理</t-divider>
          <t-form :data="ocrData" label-width="140px">
            <t-row :gutter="16">
              <t-col :span="8">
                <t-form-item label="保险费率" name="premiumRate">
                  <t-input-number v-model="ocrData.premiumRate" :min="0" :step="0.0001" placeholder="费率或区间" />
                </t-form-item>
              </t-col>
              <t-col :span="8">
                <t-form-item label="缴费期限" name="paymentDeadline">
                  <t-date-picker v-model="ocrData.paymentDeadline" placeholder="选择日期" clearable />
                </t-form-item>
              </t-col>
              <t-col :span="8">
                <t-form-item label="缴费方式" name="paymentMethod">
                  <t-select v-model="ocrData.paymentMethod" placeholder="选择" clearable>
                    <t-option value="一次缴清" label="一次缴清" />
                    <t-option value="分期" label="分期" />
                  </t-select>
                </t-form-item>
              </t-col>
              <t-col :span="12">
                <t-form-item label="保费" name="premium">
                  <t-input-number v-model="ocrData.premium" :min="0" placeholder="自动计算应缴保费" />
                  <template #help>逾期未缴触发保单效力中止/申报冻结</template>
                </t-form-item>
              </t-col>
              <t-col :span="12">
                <t-form-item label="退保费用（如有）" name="surrenderFee">
                  <t-input-number v-model="ocrData.surrenderFee" :min="0" placeholder="录入/校对" />
                  <template #help>退保时按未到期天数比例计算退费</template>
                </t-form-item>
              </t-col>
              <t-col :span="12">
                <t-form-item label="赔款追回款项支付对象" name="recoveryPayee">
                  <t-input v-model="ocrData.recoveryPayee" placeholder="录入/校对" />
                </t-form-item>
              </t-col>
            </t-row>
          </t-form>

        </div>
      </t-tab-panel>
    </t-tabs>
    <template #footer>
      <t-space v-if="activeTab === 'review'">
        <t-button variant="outline" @click="emit('update:visible', false)">取消</t-button>
        <t-button theme="primary" @click="handleSaveOcr">确认</t-button>
      </t-space>
    </template>
  </t-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { useBusinessStore } from '@/stores/business'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  visible: Boolean,
  externalPolicyId: { type: String, default: '' }
})
const emit = defineEmits(['update:visible'])

const store = useBusinessStore()
const userStore = useUserStore()

const activeTab = ref('upload')
const uploadFiles = ref([])

const ocrData = reactive({
  policyNo: `PI${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
  insuranceCompany: '人保财险',
  insurerName: '',
  policyholder: '',
  beneficiary: '',
  effectiveDate: '2026-01-01',
  expiryDate: '2027-01-01',
  insurancePeriod: '',
  renewalFlag: 'no',
  coverageAmount: 500000,
  currency: 'USD',
  countryRiskVersion: '',
  clauseVersion: '',
  businessType: '',
  maxCompensation: 500000,
  buyerNames: '',
  buyerCreditLimit: 0,
  riskCoverage: '',
  idlePeriod: 0,
  selfControlledLimit: 0,
  deductible: 0,
  declarationMethod: '',
  declarationCycle: '',
  declarationDeadline: '',
  declarationCurrency: 'USD',
  premiumRate: 0.025,
  paymentDeadline: '',
  paymentMethod: '',
  premium: 12500,
  surrenderFee: 0,
  recoveryPayee: ''
})

const sourceLabel = ref('')
const externalPolicy = computed(() => {
  if (!props.externalPolicyId) return null
  return store.externalPolicies.find(p => p.id === props.externalPolicyId) || null
})

const mockUpload = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ status: 'success', data: {} }), 200)
  })
}

const handleUploadSuccess = () => {
  MessagePlugin.success('文件上传成功')
}

const startOcr = () => {
  MessagePlugin.loading('正在识别文档...')
  setTimeout(() => {
    const ext = externalPolicy.value
    const year = new Date().getFullYear()
    const random4 = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    ocrData.policyNo = `PI${year}${random4}`
    ocrData.insuranceCompany = ext?.insuranceCompany || '人保财险'
    ocrData.insurerName = ext?.insurerName || ''
    ocrData.policyholder = ext?.policyholder || userStore.companyName || ''
    ocrData.beneficiary = ext?.beneficiary || ''
    ocrData.effectiveDate = ext?.effectiveDate || `${year}-01-01`
    ocrData.expiryDate = ext?.expiryDate || `${year + 1}-01-01`
    ocrData.coverageAmount = ext?.coverageAmount || 500000
    ocrData.maxCompensation = ext?.maxCompensationLimit || 500000
    ocrData.premium = ext?.premium || 12500
    ocrData.premiumRate = ext?.premiumRate || 0.025
    ocrData.buyerCreditLimit = ext?.buyerCreditLimit || 0
    ocrData.deductible = ext?.deductible || 0
    ocrData.insurancePeriod = ext?.insurancePeriod || '12个月'
    ocrData.businessType = ext?.tradeBusinessType === '货物贸易' ? 'goods' : ext?.tradeBusinessType === '服务贸易' ? 'service' : ''
    MessagePlugin.closeAll()
    MessagePlugin.success('OCR识别完成，请逐项校对')
    activeTab.value = 'review'
  }, 1500)
}

const formatDateTime = (d) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const handleSaveOcr = () => {
  const now = new Date()

  // Coming from external policy upload flow
  if (props.externalPolicyId) {
    const res = store.completeExternalOcrAndCreateTask(props.externalPolicyId, {
      policyNo: ocrData.policyNo,
      insuranceCompany: ocrData.insuranceCompany,
      insurerName: ocrData.insurerName,
      policyholder: ocrData.policyholder,
      insured: ocrData.buyerNames || '',
      beneficiary: ocrData.beneficiary,
      effectiveDate: ocrData.effectiveDate,
      expiryDate: ocrData.expiryDate,
      insurancePeriod: ocrData.insurancePeriod,
      coverageAmount: ocrData.coverageAmount,
      currency: ocrData.currency,
      premiumRate: ocrData.premiumRate,
      premium: ocrData.premium,
      maxCompensationLimit: ocrData.maxCompensation,
      buyerCreditLimit: ocrData.buyerCreditLimit,
      tradeBusinessType: ocrData.businessType === 'goods' ? '货物贸易' : ocrData.businessType === 'service' ? '服务贸易' : '',
      deductible: ocrData.deductible,
      declarationMethod: ocrData.declarationMethod,
      declarationCycle: ocrData.declarationCycle,
      declarationDeadline: ocrData.declarationDeadline
    })
    if (!res?.ok) {
      MessagePlugin.error(res?.message || '保存失败')
      return
    }
    MessagePlugin.success('OCR识别结果已确认，任务已提交至投保确认列表')
    emit('update:visible', false)
    return
  }

  // Direct OCR (standalone, not from upload)
  const appId = `TB${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
  const application = {
    id: appId,
    companyName: userStore.companyName || ocrData.policyholder,
    buyerName: ocrData.buyerNames || '',
    insuranceType: '短期出口信用保险',
    preferredInsuranceOrgType: '无偏好',
    insuranceCurrency: ocrData.currency,
    insuranceAmount: ocrData.coverageAmount,
    expectedInsurancePeriod: [ocrData.effectiveDate, ocrData.expiryDate],
    status: 'ocr_pending',
    createTime: formatDateTime(now),
    updateTime: formatDateTime(now),
    ocrSource: true,
    ocrPolicyNo: ocrData.policyNo,
    ocrInsuranceCompany: ocrData.insuranceCompany,
    ocrPolicyholder: ocrData.policyholder,
    ocrInsurerName: ocrData.insurerName,
    ocrBeneficiary: ocrData.beneficiary,
    ocrCoverageAmount: ocrData.coverageAmount,
    ocrPremium: ocrData.premium,
    ocrPremiumRate: ocrData.premiumRate,
    ocrMaxCompensation: ocrData.maxCompensation,
    ocrBuyerCreditLimit: ocrData.buyerCreditLimit,
    ocrBusinessType: ocrData.businessType
  }
  store.insuranceApplications.unshift(application)
  MessagePlugin.success('保单识别结果已确认，已提交至保险平台')
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
.ocr-upload {
  padding: 24px;
  text-align: center;
}

.ocr-review {
  padding: 8px;
}

.mt-16 {
  margin-top: 16px;
}

:deep(.field-strong-validate) {
  .t-form__label label {
    color: #e34d57;
  }
}

.text-danger {
  color: #e34d57;
  font-weight: 600;
}

.ext-policy-info {
  text-align: left;
  padding: 8px 0;

  .file-detail {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-top: 12px;

    .file-icon {
      flex-shrink: 0;
    }

    .file-meta {
      .file-name {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }

      .file-info-text {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.mb-16 {
  margin-bottom: 16px;
}
</style>
