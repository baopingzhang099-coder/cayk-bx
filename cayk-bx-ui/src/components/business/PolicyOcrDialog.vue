<template>
  <t-dialog :visible="visible" @update:visible="emit('update:visible', $event)" header="保单数字化 - 新增投保" width="800px" :footer="false" :destroy-on-close="true">
    <t-tabs v-model="activeTab" :disabled="ocrTabDisabled">
      <t-tab-panel value="upload" label="1. 上传文件">
        <div class="ocr-upload">
          <t-upload
            v-model="uploadFiles"
            action="https://demo.com/upload"
            accept="image/jpeg,image/png,application/pdf"
            :max="5"
            :max-size="10 * 1024 * 1024"
            placeholder="支持 PDF/JPG/PNG，单文件 ≤ 10MB"
            tips="上传保单/批单文件，系统将自动识别提取关键字段"
            theme="file-flow"
            @success="handleUploadSuccess"
          />
          <t-button theme="primary" class="mt-16" :disabled="uploadFiles.length === 0" @click="startOcr">
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

          <t-divider>保单文件</t-divider>
          <t-form label-width="140px">
            <t-form-item label="保单">
              <t-upload action="https://demo.com/upload" accept=".pdf,.jpg,.png" :max="3" />
            </t-form-item>
            <t-form-item label="批单">
              <t-upload action="https://demo.com/upload" accept=".pdf,.jpg,.png" :max="3" />
            </t-form-item>
          </t-form>

          <div class="ocr-actions">
            <t-button theme="primary" size="large" @click="handleSaveOcr">保存结构化结果</t-button>
            <t-button variant="outline" size="large" @click="emit('update:visible', false)">取消</t-button>
          </div>
        </div>
      </t-tab-panel>
    </t-tabs>
  </t-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { useBusinessStore } from '@/stores/business'

const props = defineProps({
  visible: Boolean
})
const emit = defineEmits(['update:visible'])

const store = useBusinessStore()
const activeTab = ref('upload')
const uploadFiles = ref([])

const ocrTabDisabled = computed(() => activeTab.value === 'review')

const ocrData = reactive({
  policyNo: '',
  insuranceCompany: '',
  insurerName: '',
  policyholder: '',
  beneficiary: '',
  effectiveDate: '',
  expiryDate: '',
  insurancePeriod: '',
  renewalFlag: 'no',
  coverageAmount: 0,
  currency: 'USD',
  countryRiskVersion: '',
  clauseVersion: '',
  businessType: '',
  maxCompensation: 0,
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
  premiumRate: 0,
  paymentDeadline: '',
  paymentMethod: '',
  premium: 0,
  surrenderFee: 0,
  recoveryPayee: ''
})

const handleUploadSuccess = () => {
  MessagePlugin.success('文件上传成功')
}

const startOcr = () => {
  MessagePlugin.loading('正在识别文档...')
  setTimeout(() => {
    ocrData.policyNo = `PI${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
    ocrData.insuranceCompany = '人保财险'
    ocrData.policyholder = '深圳XX国际贸易有限公司'
    ocrData.effectiveDate = '2026-01-01'
    ocrData.expiryDate = '2027-01-01'
    ocrData.coverageAmount = 500000
    ocrData.maxCompensation = 500000
    ocrData.premium = 12500
    ocrData.premiumRate = 0.025
    MessagePlugin.closeAll()
    MessagePlugin.success('OCR识别完成，请逐项校对')
    activeTab.value = 'review'
  }, 1500)
}

const handleSaveOcr = () => {
  const newPolicy = {
    id: `P${new Date().getFullYear()}${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
    policyNo: ocrData.policyNo,
    insuranceCompany: ocrData.insuranceCompany,
    policyholder: ocrData.policyholder,
    insured: ocrData.buyerNames || '-',
    coverageAmount: ocrData.coverageAmount,
    premium: ocrData.premium,
    effectiveDate: ocrData.effectiveDate,
    expiryDate: ocrData.expiryDate,
    status: 'pending_effect',
    usedQuota: 0,
    remainingQuota: ocrData.coverageAmount,
    currency: ocrData.currency,
    businessType: ocrData.businessType,
    renewalFlag: ocrData.renewalFlag
  }
  store.policies.unshift(newPolicy)
  MessagePlugin.success('保单结构化结果已保存')
  emit('update:visible', false)
  activeTab.value = 'upload'
  uploadFiles.value = []
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

.ocr-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
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
</style>
