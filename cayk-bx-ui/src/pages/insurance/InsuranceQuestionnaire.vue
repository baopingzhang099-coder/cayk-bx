<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/insurance/purchase">投保管理</t-breadcrumb-item>
        <t-breadcrumb-item>客户投保需求问卷</t-breadcrumb-item>
      </t-breadcrumb>
    </div>

    <div class="questionnaire-card">
      <div class="questionnaire-header">
        <h2>客户投保需求问卷调查</h2>
        <p class="subtitle">请根据您的实际情况填写以下信息，我们将为您提供最合适的保险方案</p>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        <span class="progress-text">已完成 {{ currentStep }}/{{ totalSteps }} 题</span>
      </div>

      <div class="question-list">
        <div v-show="currentStep >= 1" class="question-item" :class="{ active: currentStep === 1 }">
          <div class="question-label">
            <span class="question-num">Q1</span>
            <span class="question-title">您是否是长安银科跨境通平台的新客户？</span>
          </div>
          <div class="question-options">
            <label class="radio-option" :class="{ selected: formData.q1 === 'yes' }">
              <input type="radio" v-model="formData.q1" value="yes" />
              <span class="radio-circle"></span>
              <span class="option-text">是，首次使用</span>
            </label>
            <label class="radio-option" :class="{ selected: formData.q1 === 'no' }">
              <input type="radio" v-model="formData.q1" value="no" />
              <span class="radio-circle"></span>
              <span class="option-text">否，已有贸易数据</span>
            </label>
          </div>
          <div v-if="formData.q1" class="hint-text">
            <span v-if="formData.q1 === 'yes'">✓ 将进入手动填写模式</span>
            <span v-else>✓ 将自动调取历史数据预填</span>
          </div>
        </div>

        <div v-show="currentStep >= 2" class="question-item" :class="{ active: currentStep === 2 }">
          <div class="question-label">
            <span class="question-num">Q2</span>
            <span class="question-title">今天想使用平台的哪项服务？</span>
            <span class="multi-hint">（可多选）</span>
          </div>
          <div class="question-options checkbox-group">
            <label class="checkbox-option" :class="{ selected: formData.q2.includes('buy') }">
              <input type="checkbox" v-model="formData.q2" value="buy" />
              <span class="checkbox-square"></span>
              <span class="option-text">买保险</span>
            </label>
            <label class="checkbox-option" :class="{ selected: formData.q2.includes('manage') }">
              <input type="checkbox" v-model="formData.q2" value="manage" />
              <span class="checkbox-square"></span>
              <span class="option-text">管保单</span>
            </label>
            <label class="checkbox-option" :class="{ selected: formData.q2.includes('claim') }">
              <input type="checkbox" v-model="formData.q2" value="claim" />
              <span class="checkbox-square"></span>
              <span class="option-text">办理赔</span>
            </label>
            <label class="checkbox-option" :class="{ selected: formData.q2.includes('other') }">
              <input type="checkbox" v-model="formData.q2" value="other" />
              <span class="checkbox-square"></span>
              <span class="option-text">其他</span>
              <input v-if="formData.q2.includes('other')" v-model="formData.q2Other" type="text" class="other-input" placeholder="请输入其他需求" />
            </label>
          </div>
        </div>

        <div v-show="currentStep >= 3" class="question-item" :class="{ active: currentStep === 3 }">
            <div class="question-label">
              <span class="question-num">Q3</span>
              <span class="question-title">您主要出口什么类型的产品？</span>
            </div>
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input v-model="formData.q3" type="text" class="search-input" placeholder="输入产品关键词搜索..." @input="handleProductSearch" />
              <div v-if="searchResults.length > 0" class="search-results">
                <div v-for="item in searchResults" :key="item" class="search-result-item" @click="selectProduct(item)">
                  {{ item }}
                </div>
              </div>
            </div>
            <div v-if="formData.q3" class="selected-tag">
              <span class="tag-text">{{ formData.q3 }}</span>
              <span class="tag-remove" @click="formData.q3 = ''">×</span>
            </div>
          </div>

          <div v-show="currentStep >= 4" class="question-item" :class="{ active: currentStep === 4 }">
            <div class="question-label">
              <span class="question-num">Q4</span>
              <span class="question-title">您与买方的结算方式及账期占比？</span>
              <span class="multi-hint">（总计100%）</span>
            </div>
            <div class="payment-methods">
              <div v-for="(method, index) in formData.q4" :key="index" class="payment-row">
                <div class="payment-method">
                  <label class="checkbox-option" :class="{ selected: method.selected }">
                    <input type="checkbox" v-model="method.selected" />
                    <span class="checkbox-square"></span>
                    <span class="option-text">{{ method.name }}</span>
                  </label>
                </div>
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
                <span v-if="method.selected && method.ratio" class="ratio-display">{{ method.ratio }}</span>
              </div>
            </div>
            <div class="ratio-summary" :class="{ error: ratioError }">
              <span>已分配占比：{{ totalRatio }}%</span>
              <span v-if="ratioError" class="error-text">占比总和必须等于100%</span>
            </div>
          </div>

          <div v-show="currentStep >= 5" class="question-item" :class="{ active: currentStep === 5 }">
            <div class="question-label">
              <span class="question-num">Q5</span>
              <span class="question-title">买方国家/地区分布及占比？</span>
              <span class="multi-hint">（总计100%）</span>
            </div>
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
              <div v-for="(item, index) in formData.q5" :key="index" class="country-row">
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
              <span v-if="countryRatioError" class="error-text">占比总和必须等于100%</span>
            </div>
          </div>

          <div v-show="currentStep >= 6" class="question-item" :class="{ active: currentStep === 6 }">
            <div class="question-label">
              <span class="question-num">Q6</span>
              <span class="question-title">上一年度海关出口总额？</span>
            </div>
            <div class="question-options">
              <label v-for="option in exportOptions" :key="option.value" class="radio-option" :class="{ selected: formData.q6 === option.value }">
                <input type="radio" v-model="formData.q6" :value="option.value" />
                <span class="radio-circle"></span>
                <span class="option-text">{{ option.label }}</span>
              </label>
            </div>
          </div>

          <div v-show="currentStep >= 7" class="question-item" :class="{ active: currentStep === 7 }">
            <div class="question-label">
              <span class="question-num">Q7</span>
              <span class="question-title">最大几个买家合计占总出口额比例？</span>
            </div>
            <div class="question-options">
              <label v-for="option in concentrationOptions" :key="option.value" class="radio-option" :class="{ selected: formData.q7 === option.value }">
                <input type="radio" v-model="formData.q7" :value="option.value" />
                <span class="radio-circle"></span>
                <span class="option-text">{{ option.label }}</span>
              </label>
            </div>
          </div>

          <div v-show="currentStep >= 8" class="question-item" :class="{ active: currentStep === 8 }">
            <div class="question-label">
              <span class="question-num">Q8</span>
              <span class="question-title">过去三年是否投保过出口信用保险？</span>
            </div>
            <div class="question-options">
              <label v-for="option in insuranceHistoryOptions" :key="option.value" class="radio-option" :class="{ selected: formData.q8 === option.value }">
                <input type="radio" v-model="formData.q8" :value="option.value" />
                <span class="radio-circle"></span>
                <span class="option-text">{{ option.label }}</span>
              </label>
            </div>
            <div v-if="formData.q8 === 'claimed'" class="claim-amount-input">
              <label>赔付金额：</label>
              <input v-model="formData.q8Amount" type="number" placeholder="请输入赔付金额（万元）" />
              <span>万元</span>
            </div>
          </div>

          <div v-show="currentStep >= 9" class="question-item" :class="{ active: currentStep === 9 }">
            <div class="question-label">
              <span class="question-num">Q9</span>
              <span class="question-title">对保险机构类型偏好？</span>
            </div>
            <div class="question-options">
              <label v-for="option in institutionOptions" :key="option.value" class="radio-option" :class="{ selected: formData.q9 === option.value }">
                <input type="radio" v-model="formData.q9" :value="option.value" />
                <span class="radio-circle"></span>
                <span class="option-text">{{ option.label }}</span>
              </label>
            </div>
          </div>

          <div v-show="currentStep >= 10" class="question-item" :class="{ active: currentStep === 10 }">
            <div class="question-label">
              <span class="question-num">Q10</span>
              <span class="question-title">购买保险的主要目的？</span>
            </div>
            <div class="question-options">
              <label v-for="option in purposeOptions" :key="option.value" class="radio-option" :class="{ selected: formData.q10 === option.value }">
                <input type="radio" v-model="formData.q10" :value="option.value" />
                <span class="radio-circle"></span>
                <span class="option-text">{{ option.label }}</span>
              </label>
            </div>
          </div>

          <div v-show="currentStep >= 11" class="question-item" :class="{ active: currentStep === 11 }">
            <div class="question-label">
              <span class="question-num">Q11</span>
              <span class="question-title">您对所购买或已购买的保单有何需求？</span>
            </div>
            <div class="textarea-wrapper">
              <textarea v-model="formData.q11" class="requirement-textarea" placeholder="请描述您的需求，如：保费优惠、额度提升、服务质量等" rows="4"></textarea>
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

        <div class="questionnaire-footer">
        <div class="footer-left">
          <button v-if="currentStep > 1" class="btn-prev" @click="prevStep">
            <span>← 上一步</span>
          </button>
        </div>
        <div class="footer-right">
          <button v-if="currentStep < totalSteps" class="btn-next" @click="nextStep" :disabled="!canNext">
            <span>下一步 →</span>
          </button>
          <button v-if="currentStep === totalSteps" class="btn-submit" @click="handleSubmit" :disabled="!canSubmit">
            <span>提交问卷</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showResult" class="result-modal">
      <div class="result-content">
        <div class="result-icon">🎉</div>
        <h2>问卷提交成功</h2>
        <p>感谢您的配合，我们将根据您的需求为您定制保险方案</p>
        <div class="result-summary">
          <h3>问卷摘要</h3>
          <div class="summary-item">
            <span class="summary-label">客户类型：</span>
            <span class="summary-value">{{ formData.q1 === 'yes' ? '新客户' : '老客户' }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">服务需求：</span>
            <span class="summary-value">{{ getServiceText() }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">产品类型：</span>
            <span class="summary-value">{{ formData.q3 || '-' }}</span>
          </div>
        </div>
        <button class="btn-close" @click="handleClose">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const currentStep = ref(1)
const totalSteps = 11
const showResult = ref(false)

const formData = ref({
  q1: '',
  q2: [],
  q2Other: '',
  q3: '',
  q4: [
    { name: 'OA赊销', value: 'oa', selected: false, hasTerm: true, term: '', ratio: '' },
    { name: 'DA承兑交单', value: 'da', selected: false, hasTerm: true, term: '', ratio: '' },
    { name: 'DP付款交单', value: 'dp', selected: false, hasTerm: true, term: '', ratio: '' },
    { name: 'LC信用证', value: 'lc', selected: false, hasTerm: false, term: '', ratio: '' },
    { name: 'TT预付', value: 'tt', selected: false, hasTerm: false, term: '', ratio: '' },
    { name: '其他', value: 'other', selected: false, hasTerm: false, term: '', ratio: '' }
  ],
  q5: [],
  q6: '',
  q7: '',
  q8: '',
  q8Amount: '',
  q9: '',
  q10: '',
  q11: ''
})

const countrySearch = ref('')
const searchResults = ref([])
const countryResults = ref([])

const productKeywords = ['电子产品', '机械设备', '纺织品', '服装', '化工产品', '食品', '农产品', '医药产品', '汽车配件', '家具', '玩具', '建材', '钢材', '塑料制品', '化妆品']

const countries = ['美国', '德国', '英国', '日本', '韩国', '新加坡', '澳大利亚', '加拿大', '法国', '意大利', '荷兰', '西班牙', '巴西', '印度', '墨西哥', '俄罗斯', '越南', '泰国', '马来西亚', '印度尼西亚']

const exportOptions = [
  { value: '<50', label: '50万以下' },
  { value: '50-200', label: '50-200万' },
  { value: '200-500', label: '200-500万' },
  { value: '500-1000', label: '500-1000万' },
  { value: '1000-2000', label: '1000-2000万' },
  { value: '2000-5000', label: '2000-5000万' },
  { value: '5000-10000', label: '5000万-1亿' },
  { value: '>10000', label: '1亿以上' }
]

const concentrationOptions = [
  { value: '≤30', label: '≤30%' },
  { value: '31-50', label: '31%-50%' },
  { value: '51-70', label: '51%-70%' },
  { value: '71-85', label: '71%-85%' },
  { value: '>85', label: '85%以上' }
]

const insuranceHistoryOptions = [
  { value: 'none', label: '未购买过' },
  { value: 'purchased', label: '购买过且未赔付' },
  { value: 'claimed', label: '购买过曾赔付' }
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

const progressPercent = computed(() => {
  return Math.round((currentStep.value / totalSteps) * 100)
})

const ratioMap = { '≤10': 5, '11-30': 20, '31-50': 40, '51-70': 60, '71-90': 80, '>91': 95 }

const totalRatio = computed(() => {
  return formData.value.q4.reduce((sum, item) => {
    if (item.selected && item.ratio) {
      return sum + (ratioMap[item.ratio] || 0)
    }
    return sum
  }, 0)
})

const ratioError = computed(() => {
  const selected = formData.value.q4.filter(item => item.selected && item.ratio)
  return selected.length > 0 && totalRatio.value !== 100
})

const countryTotalRatio = computed(() => {
  return formData.value.q5.reduce((sum, item) => {
    if (item.ratio) {
      return sum + (ratioMap[item.ratio] || 0)
    }
    return sum
  }, 0)
})

const countryRatioError = computed(() => {
  return formData.value.q5.length > 0 && countryTotalRatio.value !== 100
})

const canNext = computed(() => {
  switch (currentStep.value) {
    case 1: return !!formData.value.q1
    case 2: return formData.value.q2.length > 0
    case 3: return !!formData.value.q3
    case 4: return !ratioError.value
    case 5: return !countryRatioError.value
    case 6: return !!formData.value.q6
    case 7: return !!formData.value.q7
    case 8: return !!formData.value.q8
    case 9: return !!formData.value.q9
    case 10: return !!formData.value.q10
    default: return true
  }
})

const canSubmit = computed(() => {
  return formData.value.q11.length > 0
})

const aiKeywords = computed(() => {
  const text = formData.value.q11
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

const handleProductSearch = () => {
  const query = formData.value.q3.toLowerCase()
  if (query.length > 0) {
    searchResults.value = productKeywords.filter(p => p.toLowerCase().includes(query))
  } else {
    searchResults.value = []
  }
}

const selectProduct = (product) => {
  formData.value.q3 = product
  searchResults.value = []
}

const handleCountrySearch = () => {
  const query = countrySearch.value.toLowerCase()
  if (query.length > 0) {
    countryResults.value = countries.filter(c => c.toLowerCase().includes(query) && !formData.value.q5.some(item => item.country === c))
  } else {
    countryResults.value = []
  }
}

const addCountry = (country) => {
  formData.value.q5.push({ country, ratio: '' })
  countrySearch.value = ''
  countryResults.value = []
}

const removeCountry = (index) => {
  formData.value.q5.splice(index, 1)
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const getServiceText = () => {
  const map = { buy: '买保险', manage: '管保单', claim: '办理赔', other: '其他' }
  return formData.value.q2.map(s => formData.value.q2.includes(s) ? (map[s] + (s === 'other' && formData.value.q2Other ? `(${formData.value.q2Other})` : '')) : null).filter(Boolean).join('、')
}

const handleSubmit = () => {
  showResult.value = true
}

const handleClose = () => {
  showResult.value = false
}
</script>

<style scoped>
.page-container { padding: 0 20px 20px; }
.page-breadcrumb { padding: 16px 0; color: #666; }
.page-breadcrumb .separator { margin: 0 8px; }
.questionnaire-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(15,23,42,0.08); }
.questionnaire-header { text-align: center; margin-bottom: 24px; }
.questionnaire-header h2 { font-size: 22px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
.subtitle { font-size: 14px; color: #64748b; }
.progress-bar { background: #f1f5f9; border-radius: 10px; height: 24px; position: relative; margin-bottom: 24px; overflow: hidden; }
.progress-fill { background: linear-gradient(90deg, #3b82f6, #60a5fa); height: 100%; border-radius: 10px; transition: width 0.3s ease; }
.progress-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 12px; color: #475569; font-weight: 500; }
.question-list { min-height: 400px; }
.question-item { margin-bottom: 24px; padding: 20px; background: #f8fafc; border-radius: 10px; border: 2px solid transparent; transition: all 0.3s ease; }
.question-item.active { border-color: #3b82f6; background: #fff; }
.question-label { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.question-num { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; padding: 4px 12px; border-radius: 6px; font-size: 14px; font-weight: 600; }
.question-title { font-size: 16px; font-weight: 600; color: #1e293b; }
.multi-hint { color: #94a3b8; font-size: 13px; }
.question-options { display: flex; flex-direction: column; gap: 12px; }
.radio-option, .checkbox-option { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; }
.radio-option:hover, .checkbox-option:hover { border-color: #3b82f6; }
.radio-option.selected, .checkbox-option.selected { border-color: #3b82f6; background: #eff6ff; }
.radio-option input, .checkbox-option input { display: none; }
.radio-circle { width: 18px; height: 18px; border: 2px solid #cbd5e1; border-radius: 50%; position: relative; }
.radio-option.selected .radio-circle { border-color: #3b82f6; }
.radio-option.selected .radio-circle::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; }
.checkbox-square { width: 18px; height: 18px; border: 2px solid #cbd5e1; border-radius: 4px; position: relative; }
.checkbox-option.selected .checkbox-square { border-color: #3b82f6; background: #3b82f6; }
.checkbox-option.selected .checkbox-square::after { content: '✓'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; font-size: 12px; }
.option-text { font-size: 14px; color: #334155; }
.hint-text { margin-top: 12px; font-size: 13px; color: #059669; }
.search-input-wrapper { position: relative; margin-bottom: 12px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 16px; }
.search-input { width: 100%; padding: 12px 12px 12px 40px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; }
.search-input:focus { border-color: #3b82f6; }
.search-results { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 4px; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.search-result-item { padding: 10px 16px; cursor: pointer; font-size: 14px; color: #334155; }
.search-result-item:hover { background: #f1f5f9; }
.selected-tag { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; background: #eff6ff; border-radius: 6px; margin-top: 8px; }
.tag-text { font-size: 14px; color: #3b82f6; }
.tag-remove { cursor: pointer; color: #94a3b8; font-size: 18px; }
.tag-remove:hover { color: #ef4444; }
.payment-methods { display: flex; flex-direction: column; gap: 12px; }
.payment-row { display: flex; align-items: center; gap: 16px; padding: 12px 16px; background: #fff; border-radius: 8px; flex-wrap: wrap; }
.payment-method { flex: 1; min-width: 150px; }
.payment-term, .payment-ratio { min-width: 140px; }
.term-select, .ratio-select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; outline: none; cursor: pointer; }
.ratio-display { font-size: 14px; color: #3b82f6; font-weight: 500; min-width: 50px; }
.ratio-summary { margin-top: 12px; font-size: 14px; color: #059669; display: flex; gap: 16px; }
.ratio-summary.error { color: #dc2626; }
.error-text { color: #dc2626; }
.country-add { margin-bottom: 16px; }
.country-list { display: flex; flex-direction: column; gap: 12px; }
.country-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fff; border-radius: 8px; }
.country-name { min-width: 120px; font-size: 14px; color: #334155; }
.country-remove { cursor: pointer; color: #94a3b8; font-size: 20px; padding: 0 8px; }
.country-remove:hover { color: #ef4444; }
.claim-amount-input { margin-top: 12px; display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #fff; border-radius: 8px; }
.claim-amount-input input { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; width: 200px; }
.textarea-wrapper { margin-bottom: 16px; }
.requirement-textarea { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; resize: vertical; outline: none; }
.requirement-textarea:focus { border-color: #3b82f6; }
.ai-analysis { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-top: 16px; }
.ai-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 12px; }
.ai-icon { font-size: 18px; }
.keyword-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.keyword-tag { padding: 4px 12px; background: #eff6ff; color: #3b82f6; border-radius: 16px; font-size: 13px; }
.ai-suggestion { font-size: 14px; color: #475569; }
.suggestion-text { color: #059669; font-weight: 500; margin-left: 4px; }
.questionnaire-footer { display: flex; justify-content: space-between; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
.footer-right { display: flex; gap: 12px; }
.btn-prev, .btn-next, .btn-submit { padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; border: none; transition: all 0.3s ease; }
.btn-prev { background: #fff; border: 1px solid #e2e8f0; color: #64748b; }
.btn-prev:hover { border-color: #3b82f6; color: #3b82f6; }
.btn-next, .btn-submit { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; }
.btn-next:hover, .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
.btn-next:disabled, .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.result-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.result-content { background: #fff; border-radius: 16px; padding: 32px; max-width: 480px; width: 90%; text-align: center; }
.result-icon { font-size: 60px; margin-bottom: 16px; }
.result-content h2 { font-size: 22px; color: #1e293b; margin-bottom: 8px; }
.result-content p { font-size: 14px; color: #64748b; margin-bottom: 24px; }
.result-summary { background: #f8fafc; border-radius: 10px; padding: 16px; text-align: left; margin-bottom: 24px; }
.result-summary h3 { font-size: 14px; color: #475569; margin-bottom: 12px; }
.summary-item { display: flex; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
.summary-item:last-child { border-bottom: none; }
.summary-label { width: 100px; color: #64748b; font-size: 14px; }
.summary-value { flex: 1; color: #1e293b; font-size: 14px; }
.btn-close { padding: 12px 32px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
.btn-close:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
.other-input { padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 13px; margin-left: 8px; width: 150px; }
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>