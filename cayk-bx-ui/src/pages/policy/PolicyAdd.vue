<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/policy/list">保单管理</t-breadcrumb-item>
        <t-breadcrumb-item>新增保单</t-breadcrumb-item>
      </t-breadcrumb>
    </div>

    <div class="form-card">
      <div class="form-header">
        <h2>新增投保申请</h2>
        <p class="subtitle">请填写以下信息完成投保申请</p>
      </div>

      <div class="form-content">
        <div class="form-section">
          <div class="section-header">
            <span class="section-icon">📋</span>
            <span class="section-title">基本信息</span>
          </div>
          <div class="section-body">
            <div class="form-row">
              <div class="form-item">
                <label>客户类型 <span class="required">*</span></label>
                <div class="radio-group">
                  <label class="radio-option" :class="{ selected: formData.customerType === 'new' }">
                    <input type="radio" v-model="formData.customerType" value="new" />
                    <span class="radio-circle"></span>
                    <span>新客户</span>
                  </label>
                  <label class="radio-option" :class="{ selected: formData.customerType === 'existing' }">
                    <input type="radio" v-model="formData.customerType" value="existing" />
                    <span class="radio-circle"></span>
                    <span>老客户</span>
                  </label>
                </div>
              </div>
              <div class="form-item">
                <label>服务类型 <span class="required">*</span></label>
                <div class="checkbox-group">
                  <label class="checkbox-option" :class="{ selected: formData.serviceType.includes('buy') }">
                    <input type="checkbox" v-model="formData.serviceType" value="buy" />
                    <span class="checkbox-square"></span>
                    <span>买保险</span>
                  </label>
                  <label class="checkbox-option" :class="{ selected: formData.serviceType.includes('manage') }">
                    <input type="checkbox" v-model="formData.serviceType" value="manage" />
                    <span class="checkbox-square"></span>
                    <span>管保单</span>
                  </label>
                  <label class="checkbox-option" :class="{ selected: formData.serviceType.includes('claim') }">
                    <input type="checkbox" v-model="formData.serviceType" value="claim" />
                    <span class="checkbox-square"></span>
                    <span>办理赔</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <span class="section-icon">🏢</span>
            <span class="section-title">企业信息</span>
          </div>
          <div class="section-body">
            <div class="form-row">
              <div class="form-item">
                <label>企业名称 <span class="required">*</span></label>
                <input v-model="formData.companyName" type="text" class="form-input" placeholder="请输入企业名称" />
              </div>
              <div class="form-item">
                <label>联系人</label>
                <input v-model="formData.contactPerson" type="text" class="form-input" placeholder="请输入联系人" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-item">
                <label>联系电话</label>
                <input v-model="formData.contactPhone" type="text" class="form-input" placeholder="请输入联系电话" />
              </div>
              <div class="form-item">
                <label>年度出口总额</label>
                <select v-model="formData.annualExport" class="form-select">
                  <option value="">请选择</option>
                  <option value="<50">50万以下</option>
                  <option value="50-200">50-200万</option>
                  <option value="200-500">200-500万</option>
                  <option value="500-1000">500-1000万</option>
                  <option value="1000-2000">1000-2000万</option>
                  <option value="2000-5000">2000-5000万</option>
                  <option value="5000-10000">5000万-1亿</option>
                  <option value=">10000">1亿以上</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <span class="section-icon">📦</span>
            <span class="section-title">投保需求</span>
          </div>
          <div class="section-body">
            <div class="form-item full-width">
              <label>产品类型 <span class="required">*</span></label>
              <div class="search-input-wrapper">
                <span class="search-icon">🔍</span>
                <input v-model="formData.productType" type="text" class="search-input" placeholder="输入产品关键词搜索..." @input="handleProductSearch" />
                <div v-if="searchResults.length > 0" class="search-results">
                  <div v-for="item in searchResults" :key="item" class="search-result-item" @click="selectProduct(item)">
                    {{ item }}
                  </div>
                </div>
              </div>
              <div v-if="formData.productType" class="selected-tag">
                <span class="tag-text">{{ formData.productType }}</span>
                <span class="tag-remove" @click="formData.productType = ''">×</span>
              </div>
            </div>

            <div class="form-item full-width">
              <label>结算方式及账期占比 <span class="required">*</span></label>
              <span class="field-hint">（总计100%）</span>
              <div class="payment-methods">
                <div v-for="(method, index) in formData.paymentMethods" :key="index" class="payment-row">
                  <label class="checkbox-option" :class="{ selected: method.selected }">
                    <input type="checkbox" v-model="method.selected" />
                    <span class="checkbox-square"></span>
                    <span class="option-text">{{ method.name }}</span>
                  </label>
                  <div v-if="method.selected && method.hasTerm" class="payment-term">
                    <select v-model="method.term" class="term-select">
                      <option value="">选择账期</option>
                      <option value="immediate">即期</option>
                      <option value="≤30">≤30天</option>
                      <option value="31-60">31-60天</option>
                      <option value="61-90">61-90天</option>
                      <option value="91-120">91-120天</option>
                      <option value="121-180">121-180天</option>
                      <option value=">180">>180天</option>
                    </select>
                  </div>
                  <div v-if="method.selected" class="payment-ratio">
                    <select v-model="method.ratio" class="ratio-select">
                      <option value="">选择占比</option>
                      <option value="≤10">10%及以下</option>
                      <option value="11-30">11%-30%</option>
                      <option value="31-50">31%-50%</option>
                      <option value="51-70">51%-70%</option>
                      <option value="71-90">71%-90%</option>
                      <option value=">91">91%及以上</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="ratio-summary" :class="{ error: ratioError }">
                <span>已分配占比：{{ totalRatio }}%</span>
                <span v-if="ratioError" class="error-text">⚠️ 占比总和必须等于100%</span>
              </div>
            </div>

            <div class="form-item full-width">
              <label>买方国家/地区分布 <span class="required">*</span></label>
              <span class="field-hint">（总计100%）</span>
              <div class="country-add">
                <div class="search-input-wrapper">
                  <span class="search-icon">🌍</span>
                  <input v-model="countrySearch" type="text" class="search-input" placeholder="搜索国家/地区..." @input="handleCountrySearch" />
                  <div v-if="countryResults.length > 0" class="search-results">
                    <div v-for="country in countryResults" :key="country" class="search-result-item" @click="addCountry(country)">
                      {{ country }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="country-list">
                <div v-for="(item, index) in formData.countries" :key="index" class="country-row">
                  <span class="country-name">{{ item.country }}</span>
                  <select v-model="item.ratio" class="ratio-select">
                    <option value="">选择占比</option>
                    <option value="≤10">10%及以下</option>
                    <option value="11-30">11%-30%</option>
                    <option value="31-50">31%-50%</option>
                    <option value="51-70">51%-70%</option>
                    <option value="71-90">71%-90%</option>
                    <option value=">91">91%及以上</option>
                  </select>
                  <span class="country-remove" @click="removeCountry(index)">×</span>
                </div>
              </div>
              <div class="ratio-summary" :class="{ error: countryRatioError }">
                <span>已分配占比：{{ countryTotalRatio }}%</span>
                <span v-if="countryRatioError" class="error-text">⚠️ 占比总和必须等于100%</span>
              </div>
            </div>

            <div class="form-item full-width">
              <label>买家集中度</label>
              <div class="radio-options">
                <label v-for="option in concentrationOptions" :key="option.value" class="radio-option" :class="{ selected: formData.buyerConcentration === option.value }">
                  <input type="radio" v-model="formData.buyerConcentration" :value="option.value" />
                  <span class="radio-circle"></span>
                  <span>{{ option.label }}</span>
                </label>
              </div>
            </div>

            <div class="form-item full-width">
              <label>保险机构偏好</label>
              <div class="radio-options">
                <label v-for="option in institutionOptions" :key="option.value" class="radio-option" :class="{ selected: formData.institutionPreference === option.value }">
                  <input type="radio" v-model="formData.institutionPreference" :value="option.value" />
                  <span class="radio-circle"></span>
                  <span>{{ option.label }}</span>
                </label>
              </div>
            </div>

            <div class="form-item full-width">
              <label>投保目的</label>
              <div class="radio-options">
                <label v-for="option in purposeOptions" :key="option.value" class="radio-option" :class="{ selected: formData.purchasePurpose === option.value }">
                  <input type="radio" v-model="formData.purchasePurpose" :value="option.value" />
                  <span class="radio-circle"></span>
                  <span>{{ option.label }}</span>
                </label>
              </div>
            </div>

            <div class="form-item full-width">
              <label>历史投保情况</label>
              <div class="radio-options">
                <label v-for="option in insuranceHistoryOptions" :key="option.value" class="radio-option" :class="{ selected: formData.insuranceHistory === option.value }">
                  <input type="radio" v-model="formData.insuranceHistory" :value="option.value" />
                  <span class="radio-circle"></span>
                  <span>{{ option.label }}</span>
                </label>
              </div>
              <div v-if="formData.insuranceHistory === 'claimed'" class="claim-amount-input">
                <label>赔付金额：</label>
                <input v-model="formData.claimAmount" type="number" placeholder="请输入赔付金额" />
                <span>万元</span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <span class="section-icon">📝</span>
            <span class="section-title">需求补充说明</span>
          </div>
          <div class="section-body">
            <div class="form-item full-width">
              <label>需求描述</label>
              <textarea v-model="formData.requirements" class="form-textarea" placeholder="请描述您的需求，如：保费优惠、额度提升、服务质量等" rows="4"></textarea>
            </div>
            <div v-if="aiKeywords.length > 0" class="ai-analysis">
              <div class="ai-title">
                <span class="ai-icon">🤖</span>
                <span>AI需求分析识别</span>
              </div>
              <div class="keyword-tags">
                <span v-for="keyword in aiKeywords" :key="keyword" class="keyword-tag">{{ keyword }}</span>
              </div>
              <div class="ai-suggestion">
                根据您的需求，我们推荐：
                <span class="suggestion-text">{{ aiSuggestion }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-footer">
        <button class="btn-cancel" @click="handleCancel">取消</button>
        <button class="btn-draft" @click="handleSaveDraft">保存草稿</button>
        <button class="btn-submit" @click="handleSubmit">提交申请</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const formData = ref({
  customerType: '',
  serviceType: [],
  companyName: '',
  contactPerson: '',
  contactPhone: '',
  annualExport: '',
  productType: '',
  paymentMethods: [
    { name: 'OA赊销', value: 'oa', selected: false, hasTerm: true, term: '', ratio: '' },
    { name: 'DA承兑交单', value: 'da', selected: false, hasTerm: true, term: '', ratio: '' },
    { name: 'DP付款交单', value: 'dp', selected: false, hasTerm: true, term: '', ratio: '' },
    { name: 'LC信用证', value: 'lc', selected: false, hasTerm: false, term: '', ratio: '' },
    { name: 'TT预付', value: 'tt', selected: false, hasTerm: false, term: '', ratio: '' },
    { name: '其他', value: 'other', selected: false, hasTerm: false, term: '', ratio: '' }
  ],
  countries: [],
  buyerConcentration: '',
  institutionPreference: '',
  purchasePurpose: '',
  insuranceHistory: '',
  claimAmount: '',
  requirements: ''
})

const countrySearch = ref('')
const searchResults = ref([])
const countryResults = ref([])

const productKeywords = ['电子产品', '机械设备', '纺织品', '服装', '化工产品', '食品', '农产品', '医药产品', '汽车配件', '家具', '玩具', '建材', '钢材', '塑料制品', '化妆品']

const countries = ['美国', '德国', '英国', '日本', '韩国', '新加坡', '澳大利亚', '加拿大', '法国', '意大利', '荷兰', '西班牙', '巴西', '印度', '墨西哥', '俄罗斯', '越南', '泰国', '马来西亚', '印度尼西亚']

const concentrationOptions = [
  { value: '≤30', label: '≤30%' },
  { value: '31-50', label: '31%-50%' },
  { value: '51-70', label: '51%-70%' },
  { value: '71-85', label: '71%-85%' },
  { value: '>85', label: '>85%' }
]

const institutionOptions = [
  { value: 'policy', label: '政策性保险机构（如中信保）' },
  { value: 'domestic', label: '国内大型保险公司（如人保）' },
  { value: 'international', label: '国际信用险专业机构（如安联/科法斯）' },
  { value: 'none', label: '无偏好' }
]

const purposeOptions = [
  { value: 'financing', label: '融资（保单融资/退税融资）' },
  { value: 'protection', label: '风险保障' },
  { value: 'both', label: '两者都有' }
]

const insuranceHistoryOptions = [
  { value: 'none', label: '未购买过' },
  { value: 'purchased', label: '购买过且未赔付' },
  { value: 'claimed', label: '购买过曾赔付' }
]

const ratioMap = { '≤10': 5, '11-30': 20, '31-50': 40, '51-70': 60, '71-90': 80, '>91': 95 }

const totalRatio = computed(() => {
  return formData.value.paymentMethods.reduce((sum, item) => {
    if (item.selected && item.ratio) {
      return sum + (ratioMap[item.ratio] || 0)
    }
    return sum
  }, 0)
})

const ratioError = computed(() => {
  const selected = formData.value.paymentMethods.filter(item => item.selected && item.ratio)
  return selected.length > 0 && totalRatio.value !== 100
})

const countryTotalRatio = computed(() => {
  return formData.value.countries.reduce((sum, item) => {
    if (item.ratio) {
      return sum + (ratioMap[item.ratio] || 0)
    }
    return sum
  }, 0)
})

const countryRatioError = computed(() => {
  return formData.value.countries.length > 0 && countryTotalRatio.value !== 100
})

const aiKeywords = computed(() => {
  const text = formData.value.requirements
  const keywords = []
  const keywordPatterns = {
    '保费': ['保费', '价格', '费用', '优惠', '便宜'],
    '额度': ['额度', '限额', '配额', '保额', '金额'],
    '服务': ['服务', '质量', '响应', '理赔', '售后'],
    '融资': ['融资', '贷款', '资金', '周转'],
    '期限': ['期限', '账期', '周期', '时间']
  }
  for (const [keyword, patterns] of Object.entries(keywordPatterns)) {
    if (patterns.some(p => text.includes(p))) {
      keywords.push(keyword)
    }
  }
  return keywords
})

const aiSuggestion = computed(() => {
  const keywords = aiKeywords.value
  if (keywords.includes('保费') && keywords.includes('额度')) {
    return '建议选择性价比高的综合型保险方案'
  }
  if (keywords.includes('服务')) {
    return '建议选择服务质量优的保险机构'
  }
  if (keywords.includes('融资')) {
    return '建议选择支持保单融资的保险方案'
  }
  return '根据您的需求推荐标准保险方案'
})

const canSubmit = computed(() => {
  if (!formData.value.customerType) return false
  if (formData.value.serviceType.length === 0) return false
  if (!formData.value.companyName) return false
  if (!formData.value.productType) return false
  if (ratioError.value) return false
  if (countryRatioError.value) return false
  return true
})

const handleProductSearch = () => {
  const query = formData.value.productType.toLowerCase()
  if (query.length > 0) {
    searchResults.value = productKeywords.filter(p => p.toLowerCase().includes(query))
  } else {
    searchResults.value = []
  }
}

const selectProduct = (product) => {
  formData.value.productType = product
  searchResults.value = []
}

const handleCountrySearch = () => {
  const query = countrySearch.value.toLowerCase()
  if (query.length > 0) {
    countryResults.value = countries.filter(c => c.toLowerCase().includes(query) && !formData.value.countries.some(item => item.country === c))
  } else {
    countryResults.value = []
  }
}

const addCountry = (country) => {
  formData.value.countries.push({ country, ratio: '' })
  countrySearch.value = ''
  countryResults.value = []
}

const removeCountry = (index) => {
  formData.value.countries.splice(index, 1)
}

const handleCancel = () => {
  router.back()
}

const handleSaveDraft = () => {
  alert('草稿保存成功')
}

const handleSubmit = () => {
  if (!canSubmit.value) {
    if (!formData.value.customerType) { alert('请选择客户类型'); return }
    if (formData.value.serviceType.length === 0) { alert('请选择服务类型'); return }
    if (!formData.value.companyName) { alert('请输入企业名称'); return }
    if (!formData.value.productType) { alert('请输入产品类型'); return }
    if (ratioError.value) { alert('结算方式占比总和必须等于100%'); return }
    if (countryRatioError.value) { alert('买方国家占比总和必须等于100%'); return }
    return
  }
  alert('提交成功')
  router.push('/insurance/purchase')
}
</script>

<style scoped>
.page-container { padding: 0 20px 20px; }
.page-breadcrumb { padding: 16px 0; color: #666; }
.page-breadcrumb .separator { margin: 0 8px; }
.page-breadcrumb .current { color: #333; }
.form-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(15,23,42,0.08); overflow: hidden; }
.form-header { padding: 24px; border-bottom: 1px solid #f1f5f9; }
.form-header h2 { font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
.subtitle { font-size: 14px; color: #64748b; }
.form-content { padding: 24px; }
.form-section { margin-bottom: 24px; background: #f8fafc; border-radius: 10px; overflow: hidden; }
.form-section:last-child { margin-bottom: 0; }
.section-header { display: flex; align-items: center; gap: 10px; padding: 16px 20px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-bottom: 1px solid #e2e8f0; }
.section-icon { font-size: 18px; }
.section-title { font-size: 15px; font-weight: 600; color: #1e293b; }
.section-body { padding: 20px; }
.form-row { display: flex; gap: 24px; margin-bottom: 16px; }
.form-row:last-child { margin-bottom: 0; }
.form-item { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.form-item.full-width { grid-column: span 2; }
.form-item label { font-size: 14px; color: #475569; font-weight: 500; }
.required { color: #ef4444; }
.field-hint { font-size: 12px; color: #94a3b8; margin-left: 4px; }
.form-input, .form-select, .form-textarea { padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.3s; }
.form-input:focus, .form-select:focus, .form-textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.form-textarea { resize: vertical; }
.radio-group, .checkbox-group { display: flex; gap: 16px; flex-wrap: wrap; }
.radio-options { display: flex; flex-wrap: wrap; gap: 12px; }
.radio-option, .checkbox-option { display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.2s; }
.radio-option:hover, .checkbox-option:hover { border-color: #3b82f6; }
.radio-option.selected, .checkbox-option.selected { border-color: #3b82f6; background: #eff6ff; }
.radio-option input, .checkbox-option input { display: none; }
.radio-circle { width: 16px; height: 16px; border: 2px solid #cbd5e1; border-radius: 50%; position: relative; }
.radio-option.selected .radio-circle { border-color: #3b82f6; }
.radio-option.selected .radio-circle::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; }
.checkbox-square { width: 16px; height: 16px; border: 2px solid #cbd5e1; border-radius: 4px; position: relative; }
.checkbox-option.selected .checkbox-square { border-color: #3b82f6; background: #3b82f6; }
.checkbox-option.selected .checkbox-square::after { content: '✓'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; font-size: 11px; }
.search-input-wrapper { position: relative; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 14px; color: #94a3b8; }
.search-input { width: 100%; padding: 10px 12px 10px 36px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; }
.search-input:focus { border-color: #3b82f6; }
.search-results { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 4px; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.search-result-item { padding: 10px 14px; cursor: pointer; font-size: 14px; color: #334155; }
.search-result-item:hover { background: #f1f5f9; }
.selected-tag { display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; background: #eff6ff; border-radius: 6px; margin-top: 8px; }
.tag-text { font-size: 13px; color: #3b82f6; }
.tag-remove { cursor: pointer; color: #94a3b8; font-size: 16px; }
.tag-remove:hover { color: #ef4444; }
.payment-methods { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
.payment-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #fff; border-radius: 8px; flex-wrap: wrap; }
.payment-term, .payment-ratio { min-width: 130px; }
.term-select, .ratio-select { padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; outline: none; cursor: pointer; }
.ratio-summary { margin-top: 12px; font-size: 13px; color: #059669; display: flex; gap: 16px; }
.ratio-summary.error { color: #dc2626; }
.country-add { margin-top: 12px; margin-bottom: 12px; }
.country-list { display: flex; flex-direction: column; gap: 8px; }
.country-row { display: flex; align-items: center; gap: 12px; padding: 8px 14px; background: #fff; border-radius: 8px; }
.country-name { min-width: 100px; font-size: 14px; color: #334155; }
.country-remove { cursor: pointer; color: #94a3b8; font-size: 18px; padding: 0 6px; }
.country-remove:hover { color: #ef4444; }
.claim-amount-input { margin-top: 12px; display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #fff; border-radius: 8px; }
.claim-amount-input input { padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 6px; width: 180px; }
.ai-analysis { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-top: 16px; }
.ai-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 12px; }
.ai-icon { font-size: 18px; }
.keyword-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.keyword-tag { padding: 4px 12px; background: #eff6ff; color: #3b82f6; border-radius: 16px; font-size: 13px; }
.ai-suggestion { font-size: 14px; color: #475569; }
.suggestion-text { color: #059669; font-weight: 500; margin-left: 4px; }
.form-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 20px 24px; border-top: 1px solid #f1f5f9; background: #fafafa; }
.btn-cancel, .btn-draft, .btn-submit { padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; border: none; transition: all 0.3s; }
.btn-cancel { background: #fff; border: 1px solid #e2e8f0; color: #64748b; }
.btn-cancel:hover { border-color: #cbd5e1; background: #f8fafc; }
.btn-draft { background: #fff; border: 1px solid #3b82f6; color: #3b82f6; }
.btn-draft:hover { background: #eff6ff; }
.btn-submit { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; }
.btn-submit:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59,130,246,0.4); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>