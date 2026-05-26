import { defineStore } from 'pinia'

const pad = (n) => String(n).padStart(2, '0')

const formatDateTime = (d) => {
  const dt = d instanceof Date ? d : new Date(d)
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`
}

const formatDate = (d) => {
  const dt = d instanceof Date ? d : new Date(d)
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

const addDays = (dateStr, days) => {
  const dt = new Date(dateStr)
  dt.setDate(dt.getDate() + days)
  return formatDate(dt)
}

const hasFile = (v) => {
  if (Array.isArray(v)) return v.length > 0
  return !!v
}

const isHongKongShipment = (destinationPort) => {
  const s = String(destinationPort || '')
  return s.includes('香港') || s.toLowerCase().includes('hong kong')
}

const computeShipmentDeadline = ({ shipmentDate, destinationPort, declarationType }) => {
  const shipDate = shipmentDate || formatDate(new Date())
  if (isHongKongShipment(destinationPort)) return addDays(shipDate, 3)
  if (declarationType === 'monthly') {
    const dt = new Date(shipDate)
    dt.setMonth(dt.getMonth() + 1)
    dt.setDate(10)
    return formatDate(dt)
  }
  return addDays(shipDate, 15)
}

const isOverdueByDeadline = (deadline, status) => {
  if (!deadline) return false
  if (status === 'declared' || status === 'completed') return false
  return new Date(deadline) < new Date()
}

const isDueSoonByDeadline = (deadline, status) => {
  if (!deadline) return false
  if (status === 'declared' || status === 'completed') return false
  const today = new Date()
  const in3d = new Date()
  in3d.setDate(in3d.getDate() + 3)
  const d = new Date(deadline)
  return d >= today && d <= in3d
}

const normalizeShipment = (it) => {
  const deadline = it.deadline || computeShipmentDeadline(it)
  const isOverdue = !!it.isOverdue || isOverdueByDeadline(deadline, it.status)
  const isDueSoon = isDueSoonByDeadline(deadline, it.status)
  const next = { ...it, deadline, isOverdue, isDueSoon }
  if (isOverdue && next.status !== 'declared' && next.status !== 'completed') {
    next.status = 'timeout_warning'
    next.statusName = '超时预警'
  }
  return next
}

const createId = (prefix) => {
  const now = new Date()
  return `${prefix}${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

const STORAGE_KEY = 'cayk_business_state'

const saveStateToStorage = (state) => {
  try {
    const data = {
      insuranceApplications: state.insuranceApplications,
      policies: state.policies,
      creditLimits: state.creditLimits,
      shipments: state.shipments,
      claims: state.claims,
      processTasks: state.processTasks,
      contracts: state.contracts,
      payments: state.payments,
      externalPolicies: state.externalPolicies,
      clerkList: state.clerkList,
      tradeInfos: state.tradeInfos,
      notifications: state.notifications,
      _savedAt: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('保存状态失败:', e)
  }
}

const loadStateFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.warn('恢复状态失败:', e)
    return null
  }
}

export const useBusinessStore = defineStore('business', {
  state: () => ({
    insuranceApplications: [],
    policies: [],
    creditLimits: [],
    shipments: [],
    claims: [],
    processTasks: [],
    contracts: [],
    payments: [],
    externalPolicies: [],
    clerkList: [],
    tradeInfos: [],
    claimUpdateVersion: 0,
    insuranceUpdateVersion: 0
  }),
  getters: {
    insuranceStats(state) {
      const counts = {
        draft: 0,
        pending_material: 0,
        pending_submit: 0,
        credit_investigating: 0,
        limit_approving: 0,
        underwriting: 0,
        pending_payment: 0,
        completed: 0,
        rejected: 0
      }
      for (const it of state.insuranceApplications) {
        if (counts[it.status] !== undefined) counts[it.status] += 1
      }
      return counts
    },
    businessKpis(state) {
      const insuranceCount = state.insuranceApplications.length
      const limitCount = state.creditLimits.length
      const shipmentCount = state.shipments.length
      const claimCount = state.claims.length
      const coverageAmount = state.insuranceApplications.reduce((sum, it) => sum + (Number(it.insuranceAmount) || Number(it.coverageAmount) || 0), 0)
      const shipmentAmount = state.shipments.reduce((sum, it) => sum + (Number(it.shipmentAmount) || 0), 0)
      const claimAmount = state.claims.reduce((sum, it) => sum + (Number(it.claimAmount) || 0), 0)
      return { insuranceCount, limitCount, shipmentCount, claimCount, coverageAmount, shipmentAmount, claimAmount }
    }
  },
  actions: {
    touchClaims() {
      this.claimUpdateVersion++
      saveStateToStorage(this.$state)
    },
    touchInsuranceApplications() {
      this.insuranceUpdateVersion++
      saveStateToStorage(this.$state)
    },
    ensureSeeded() {
      if (this.insuranceApplications.length > 0) return
      // 尝试从localStorage恢复
      const saved = loadStateFromStorage()
      if (saved) {
        this.insuranceApplications = saved.insuranceApplications || []
        this.policies = saved.policies || []
        this.creditLimits = saved.creditLimits || []
        this.shipments = saved.shipments || []
        this.claims = saved.claims || []
        this.processTasks = saved.processTasks || []
        this.contracts = saved.contracts || []
        this.payments = saved.payments || []
        this.externalPolicies = saved.externalPolicies || []
        this.clerkList = saved.clerkList || []
        this.tradeInfos = saved.tradeInfos || []
        this.notifications = saved.notifications || []
        return
      }
      this.insuranceApplications = []
      this.policies = []
      this.creditLimits = []
      this.shipments = []
      this.claims = []
      this.processTasks = []
      this.contracts = []
      this.payments = []
      this.clerkList = []
      this.tradeInfos = []
      this.notifications = []
      saveStateToStorage(this.$state)
    },
    // ===== External policy upload & OCR flow =====
    uploadCustomerPolicy({ file, companyName, uploadUser, policyNo, uploaderRole }) {
      const now = new Date()
      const id = `EP${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
      const record = {
        id,
        customerCompany: companyName || '',
        originalFileName: file?.name || 'unknown.pdf',
        originalFile: file ? [file] : [],
        ocrStatus: 'pending',
        status: 'draft',
        rejectReason: '',
        policyNo: policyNo || '',
        linkedPolicyNo: policyNo || '',
        uploaderRole: uploaderRole || 'customer',
        insuranceCompany: '',
        insurerName: '',
        policyholder: companyName || '',
        insured: '',
        beneficiary: '',
        effectiveDate: '',
        expiryDate: '',
        insurancePeriod: '12个月',
        renewalFlag: '否',
        coverageAmount: 0,
        currency: 'USD',
        premiumRate: 0,
        premium: 0,
        maxCompensationLimit: 0,
        buyerCreditLimit: 0,
        deductible: 0,
        coveredRisks: '',
        clauseVersion: '',
        countryRiskVersion: '',
        declarationMethod: '',
        declarationCycle: '',
        declarationDeadline: '',
        tradeBusinessType: '',
        selfControlledLimit: '',
        idlePeriod: 60,
        surrenderFee: '',
        recoveryPayee: '',
        premiumPaymentMethod: '',
        premiumPaymentDeadline: '',
        fileSize: file?.size ? `${(file.size / 1048576).toFixed(1)} MB` : '',
        uploadUser: uploadUser || companyName || '',
        createTime: formatDateTime(now),
        updateTime: formatDateTime(now)
      }
      this.externalPolicies.unshift(record)
      return { ok: true, data: record }
    },
    completeExternalOcrAndCreateTask(id, ocrFields) {
      const epIdx = this.externalPolicies.findIndex(p => p.id === id)
      if (epIdx < 0) return { ok: false, message: '上传记录不存在' }
      const ep = this.externalPolicies[epIdx]
      if (ep.status !== 'pending_ocr') return { ok: false, message: '当前状态不允许OCR识别' }
      const now = new Date()
      // Update external policy status
      this.externalPolicies[epIdx] = {
        ...ep,
        ...ocrFields,
        ocrStatus: 'completed',
        status: 'ocr_completed',
        updateTime: formatDateTime(now)
      }
      // Create insurance application task in 投保确认列表
      const appId = `TB_EXT_${id}`
      if (!this.insuranceApplications.some(a => a.id === appId)) {
        this.insuranceApplications.unshift({
          id: appId,
          companyName: ep.customerCompany,
          buyerName: ocrFields.insured || '',
          insuranceType: '短期出口信用保险',
          preferredInsuranceOrgType: '无偏好',
          insuranceCurrency: ocrFields.currency || 'USD',
          insuranceAmount: Number(ocrFields.coverageAmount) || 0,
          expectedInsurancePeriod: [ocrFields.effectiveDate || '', ocrFields.expiryDate || ''],
          status: 'ocr_pending',
          createTime: formatDateTime(now),
          updateTime: formatDateTime(now),
          ocrSource: true,
          externalPolicyId: id,
          ocrPolicyNo: ocrFields.policyNo || '',
          ocrInsuranceCompany: ocrFields.insuranceCompany || '',
          ocrPolicyholder: ocrFields.policyholder || ep.customerCompany,
          ocrInsurerName: ocrFields.insurerName || '',
          ocrBeneficiary: ocrFields.beneficiary || '',
          ocrCoverageAmount: Number(ocrFields.coverageAmount) || 0,
          ocrPremium: Number(ocrFields.premium) || 0,
          ocrPremiumRate: Number(ocrFields.premiumRate) || 0,
          ocrMaxCompensation: Number(ocrFields.maxCompensationLimit) || 0,
          ocrBuyerCreditLimit: Number(ocrFields.buyerCreditLimit) || 0,
          ocrBusinessType: ocrFields.tradeBusinessType || ''
        })
      }
      return { ok: true, data: this.externalPolicies[epIdx] }
    },
    submitForPlatformReview(id) {
      const cur = this.externalPolicies.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'draft') return { ok: false, message: '当前状态不允许提交平台审核' }
      cur.status = 'platform_review'
      cur.rejectReason = ''
      cur.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },
    processExternalPolicyOcr(id, ocrFields) {
      const epIdx = this.externalPolicies.findIndex(p => p.id === id)
      if (epIdx < 0) return { ok: false, message: '上传记录不存在' }
      const ep = this.externalPolicies[epIdx]
      if (ep.status !== 'platform_review' && ep.status !== 'returned') return { ok: false, message: '当前状态不允许OCR识别' }
      const now = new Date()
      this.externalPolicies[epIdx] = {
        ...ep,
        ...ocrFields,
        ocrStatus: 'completed',
        updateTime: formatDateTime(now)
      }
      saveStateToStorage(this.$state)
      return { ok: true, data: this.externalPolicies[epIdx] }
    },
    platformApproveExternalPolicy(id) {
      const cur = this.externalPolicies.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'platform_review') return { ok: false, message: '当前状态不允许审核通过' }
      cur.status = 'clerk_review'
      cur.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },
    resubmitExternalPolicy(id) {
      const cur = this.externalPolicies.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'returned') return { ok: false, message: '当前状态不允许重新提交' }
      cur.status = cur.clerkInitiated ? 'clerk_confirm' : 'clerk_review'
      cur.rejectReason = ''
      cur.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },
    createOrUpdateInsuranceApplication(payload) {
      const now = new Date()
      if (payload?.id) {
        const idx = this.insuranceApplications.findIndex(it => it.id === payload.id)
        if (idx >= 0) {
          this.insuranceApplications[idx] = { ...this.insuranceApplications[idx], ...payload, updateTime: formatDateTime(now) }
          return this.insuranceApplications[idx]
        }
      }
      const id = payload?.id || createId('TB')
      const item = {
        ...payload,
        id,
        status: 'draft',
        createTime: formatDate(now),
        updateTime: formatDateTime(now),
      }
      this.insuranceApplications.unshift(item)
      return item
    },
    submitOcrToPlatform(id) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const cur = this.insuranceApplications[idx]
      if (cur.status !== 'ocr_pending') {
        return { ok: false, message: '当前状态不允许提交' }
      }
      this.insuranceApplications[idx] = {
        ...cur,
        status: 'pending_review',
        updateTime: formatDateTime(new Date())
      }
      return { ok: true, data: this.insuranceApplications[idx] }
    },
    submitInsuranceApplication(id) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const now = new Date()
      const cur = this.insuranceApplications[idx]
      if (!['draft', 'rejected'].includes(cur.status)) {
        return { ok: false, message: '当前状态不允许提交' }
      }
      // 客户提交后进入平台处理流程
      this.insuranceApplications[idx] = { ...cur, status: 'pending_review', updateTime: formatDateTime(now) }
      return { ok: true, data: this.insuranceApplications[idx] }
    },
    submitToClerkReview(id) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const now = new Date()
      const cur = this.insuranceApplications[idx]
      if (cur.status === 'pending_review') {
        this.insuranceApplications[idx] = { ...cur, status: 'clerk_review', updateTime: formatDateTime(now) }
        return { ok: true, data: this.insuranceApplications[idx] }
      }
      if (cur.status === 'ocr_pending') {
        this.insuranceApplications[idx] = { ...cur, status: 'ocr_clerk_review', updateTime: formatDateTime(now) }
        return { ok: true, data: this.insuranceApplications[idx] }
      }
      return { ok: false, message: '当前状态不允许申请跟单员确认' }
    },
    approveInsuranceApplication(id) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const now = new Date()
      const cur = this.insuranceApplications[idx]
      if (!['pending_review', 'clerk_review', 'ocr_pending', 'ocr_clerk_review'].includes(cur.status)) {
        return { ok: false, message: '当前状态不允许确认完成' }
      }
      if (cur.status === 'ocr_pending' || cur.status === 'ocr_clerk_review' || (cur.ocrSource && cur.status === 'clerk_review')) {
        this.insuranceApplications[idx] = { ...cur, status: 'ocr_approved', updateTime: formatDateTime(now) }
        if (!this.policies.some(p => p.policyholder === cur.companyName && p.insured === cur.buyerName)) {
          this.policies.unshift({
            id: createId('P'),
            policyNo: cur.ocrPolicyNo || `PI${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            insuranceCompany: cur.ocrInsuranceCompany || '人保财险',
            policyholder: cur.companyName,
            insured: cur.buyerName,
            coverageAmount: Number(cur.ocrCoverageAmount || cur.insuranceAmount) || 0,
            premium: Number(cur.ocrPremium) || 0,
            effectiveDate: cur.expectedInsurancePeriod?.[0] || formatDate(now),
            expiryDate: cur.expectedInsurancePeriod?.[1] || addDays(formatDate(now), 365),
            status: 'active',
            usedQuota: 0,
            remainingQuota: Number(cur.ocrCoverageAmount || cur.insuranceAmount) || 0,
            currency: cur.insuranceCurrency || 'USD',
            businessType: cur.ocrBusinessType || 'goods',
            renewalFlag: 'no',
            externalPolicyId: cur.externalPolicyId || ''
          })
        }
        return { ok: true, data: this.insuranceApplications[idx] }
      }
      const policyNo = `PI${String(now.getFullYear())}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
      const next = { ...cur, status: 'approved', updateTime: formatDateTime(now),
        policyNo,
        insuranceCompanyName: cur.preferredInsuranceOrgType === '政策性保险机构' ? '中国信保' : '人保财险',
        insurerName: cur.preferredInsuranceOrgType === '政策性保险机构' ? '中国信保' : '人保财险',
        insuredName: cur.companyName,
        policyStartDate: formatDate(now),
        policyEndDate: addDays(formatDate(now), 365),
        policyPeriod: '12个月',
        tradeBusinessType: '货物贸易',
        maxCompensationLimit: Number(cur.insuranceAmount) || 0,
        declarationMethod: '月度申报',
        declarationCycle: '月度',
        declarationDeadline: '次月15日'
      }
      this.insuranceApplications[idx] = next
      if (!this.policies.some(p => p.policyholder === next.companyName && p.insured === next.buyerName)) {
        this.policies.unshift({
          id: createId('P'),
          policyNo,
          insuranceCompany: next.insuranceCompanyName || '人保财险',
          policyholder: next.companyName,
          insured: next.buyerName,
          coverageAmount: Number(next.insuranceAmount) || 0,
          premium: Number(next.premium) || 0,
          effectiveDate: formatDate(now),
          expiryDate: addDays(formatDate(now), 365),
          status: 'active',
          statusName: '有效',
          usedQuota: 0,
          remainingQuota: Number(next.insuranceAmount) || 0
        })
      }
      if (!this.creditLimits.some(c => c.buyerName === next.buyerName)) {
        const applied = Number(next.insuranceAmount) || 0
        this.creditLimits.unshift({
          id: createId('CL'),
          buyerName: next.buyerName,
          appliedLimit: applied,
          usedLimit: 0,
          remainingLimit: applied,
          usageRate: 0,
          status: 'active',
          effectiveDate: formatDate(now),
          expiryDate: addDays(formatDate(now), 365)
        })
      }
      return { ok: true, data: next }
    },
    submitToUnderwriting(id) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const cur = this.insuranceApplications[idx]
      if (cur.status !== 'approved') return { ok: false, message: '当前状态不允许提交核保' }
      this.insuranceApplications[idx] = {
        ...cur,
        status: 'underwriting',
        updateTime: formatDateTime(new Date())
      }
      return { ok: true, data: this.insuranceApplications[idx] }
    },
    // 跟单员核保通过 - 录入核保决定和保单信息
    completeUnderwriting(id, decisionData) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const cur = this.insuranceApplications[idx]
      if (cur.status !== 'underwriting') return { ok: false, message: '当前状态不允许核保通过' }
      const now = new Date()
      this.insuranceApplications[idx] = {
        ...cur,
        status: 'uw_completed',
        uwDecision: decisionData.decision || 'approved',
        uwPolicyNo: decisionData.policyNo || '',
        uwInsuranceCompany: decisionData.insuranceCompany || '',
        uwCoverageAmount: Number(decisionData.coverageAmount) || 0,
        uwPremium: Number(decisionData.premium) || 0,
        uwOpinion: decisionData.opinion || '',
        uwPolicyDetailFile: decisionData.policyDetailFile || [],
        uwRateFile: decisionData.rateFile || [],
        uwCountryCategoryFile: decisionData.countryCategoryFile || [],
        uwCompleteTime: formatDateTime(now),
        updateTime: formatDateTime(now)
      }
      return { ok: true, data: this.insuranceApplications[idx] }
    },
    // 跟单员同步保单至平台
    syncUnderwritingToPlatform(id) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const cur = this.insuranceApplications[idx]
      if (cur.status !== 'uw_completed') return { ok: false, message: '当前状态不允许同步' }
      const now = new Date()
      const policyNo = cur.uwPolicyNo || `PI${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
      this.insuranceApplications[idx] = {
        ...cur,
        status: 'platform_synced',
        policyNo,
        insuranceCompanyName: cur.uwInsuranceCompany || cur.preferredInsuranceOrgType || '人保财险',
        policyStartDate: formatDate(now),
        policyEndDate: addDays(formatDate(now), 365),
        premium: cur.uwPremium || Math.round(Number(cur.insuranceAmount || 0) * 0.0011),
        coverageAmount: cur.uwCoverageAmount || Number(cur.insuranceAmount || 0),
        syncTime: formatDateTime(now),
        updateTime: formatDateTime(now)
      }
      // 同步生成保单记录
      if (!this.policies.some(p => p.policyholder === cur.companyName && p.insured === cur.buyerName && p.policyNo === policyNo)) {
        this.policies.unshift({
          id: createId('P'),
          policyNo,
          insuranceCompany: cur.uwInsuranceCompany || '人保财险',
          policyholder: cur.companyName || '',
          insured: cur.buyerName || '',
          coverageAmount: cur.uwCoverageAmount || Number(cur.insuranceAmount || 0),
          premium: cur.uwPremium || Math.round(Number(cur.insuranceAmount || 0) * 0.0011),
          effectiveDate: formatDate(now),
          expiryDate: addDays(formatDate(now), 365),
          status: 'pending_effect',
          usedQuota: 0,
          remainingQuota: Number(cur.insuranceAmount || 0),
          currency: cur.insuranceCurrency || 'USD',
          businessType: 'goods',
          renewalFlag: 'no'
        })
      }
      return { ok: true, data: this.insuranceApplications[idx] }
    },
    // 长安银科发起保费确认申请
    initiatePremiumConfirmation(id) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const cur = this.insuranceApplications[idx]
      if (cur.status !== 'platform_synced') return { ok: false, message: '当前状态不允许发起保费确认' }
      const now = formatDateTime(new Date())
      this.insuranceApplications[idx] = {
        ...cur,
        premiumRequested: true,
        premiumRequestTime: now,
        updateTime: now
      }
      this.notifications = this.notifications || []
      this.notifications.unshift({
        id: createId('NOTIF'),
        applicationId: id,
        companyName: cur.companyName || '',
        message: `长安银科已发起保费确认申请（投保编号：${id}），请尽快确认保费`,
        type: 'premium_request',
        createTime: now,
        read: false,
        toRole: 'customer'
      })
      return { ok: true, data: this.insuranceApplications[idx] }
    },
    // 客户确认保费
    confirmPremium(id) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const cur = this.insuranceApplications[idx]
      if (cur.status !== 'platform_synced') return { ok: false, message: '当前状态不允许确认保费' }
      this.insuranceApplications[idx] = {
        ...cur,
        status: 'premium_confirmed',
        premiumConfirmTime: formatDateTime(new Date()),
        updateTime: formatDateTime(new Date())
      }
      return { ok: true, data: this.insuranceApplications[idx] }
    },
    // 客户上传支付凭证
    uploadPaymentProof(id, proofData) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const cur = this.insuranceApplications[idx]
      if (cur.status !== 'premium_confirmed') return { ok: false, message: '当前状态不允许上传凭证' }
      const now = formatDateTime(new Date())
      this.insuranceApplications[idx] = {
        ...cur,
        status: 'payment_uploaded',
        paymentProof: proofData.proofNo || '',
        paymentPayer: proofData.payerName || '',
        paymentDate: proofData.paymentDate || '',
        paymentRemark: proofData.remark || '',
        paymentUploadTime: now,
        paymentNotified: true,
        voucherFileName: proofData.voucherFileName || '',
        voucherFileType: proofData.voucherFileType || '',
        updateTime: now
      }
      // 同步更新保单缴费状态为"保单生效中"
      const policyIdx = this.policies.findIndex(p => p.policyholder === cur.companyName && p.policyNo === cur.policyNo)
      if (policyIdx >= 0) {
        this.policies[policyIdx] = {
          ...this.policies[policyIdx],
          status: 'activating',
          premiumPaid: true,
          premiumPaidTime: now
        }
      }
      // 自动通知跟单员保费已缴纳
      this.notifications = this.notifications || []
      this.notifications.unshift({
        id: createId('NOTIF'),
        applicationId: id,
        companyName: cur.companyName || '',
        message: `客户 ${cur.companyName || ''} 已完成保费缴纳（投保编号：${id}），请及时处理`,
        type: 'payment_notification',
        createTime: now,
        read: false,
        toRole: 'clerk'
      })
      return { ok: true, data: this.insuranceApplications[idx] }
    },
    // 平台确认保单生效
    activatePolicyByPlatform(id) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const cur = this.insuranceApplications[idx]
      if (cur.status !== 'payment_uploaded') return { ok: false, message: '当前状态不允许确认生效' }
      const now = new Date()
      this.insuranceApplications[idx] = {
        ...cur,
        status: 'active',
        policyStatus: 'active',
        activateTime: formatDateTime(now),
        updateTime: formatDateTime(now)
      }
      // 同步更新保单状态为生效
      const policyIdx = this.policies.findIndex(p => p.policyholder === cur.companyName && p.policyNo === cur.policyNo)
      if (policyIdx >= 0) {
        this.policies[policyIdx].status = 'active'
      }
      return { ok: true, data: this.insuranceApplications[idx] }
    },
    sendPaymentNotification(applicationId) {
      const app = this.insuranceApplications.find(a => a.id === applicationId)
      if (!app) return { ok: false, message: '投保记录不存在' }
      const now = new Date()
      this.notifications = this.notifications || []
      this.notifications.unshift({
        id: createId('NOTIF'),
        applicationId,
        companyName: app.companyName || '',
        message: `客户 ${app.companyName || ''} 已完成保费支付（投保编号：${applicationId}），请及时处理`,
        type: 'payment_notification',
        createTime: formatDateTime(now),
        read: false,
        toRole: 'clerk'
      })
      const idx = this.insuranceApplications.findIndex(a => a.id === applicationId)
      if (idx >= 0) {
        this.insuranceApplications[idx] = {
          ...this.insuranceApplications[idx],
          paymentNotified: true,
          paymentNotifyTime: formatDateTime(now)
        }
      }
      return { ok: true, message: '已通知跟单员' }
    },
    rejectInsuranceApplication(id, rejectReason) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const now = new Date()
      const cur = this.insuranceApplications[idx]
      if (!['pending_review', 'clerk_review', 'ocr_pending', 'ocr_clerk_review'].includes(cur.status)) {
        return { ok: false, message: '当前状态不允许驳回' }
      }
      if (!rejectReason || rejectReason.trim() === '') {
        return { ok: false, message: '驳回原因不能为空' }
      }
      if (cur.status === 'clerk_review') {
        // 跟单员驳回 → 退回客户重新提交
        this.insuranceApplications[idx] = {
          ...cur,
          status: 'rejected',
          updateTime: formatDateTime(now),
          rejectReason
        }
      } else {
        this.insuranceApplications[idx] = {
          ...cur,
          status: 'pending_review',
          updateTime: formatDateTime(now),
          rejectReason
        }
      }
      return { ok: true, data: this.insuranceApplications[idx] }
    },
    createCreditLimit(payload) {
      const now = new Date()
      const applied = Number(payload.appliedLimit) || 0
      const used = Number(payload.usedLimit) || 0
      const remaining = Math.max(applied - used, 0)
      const isPending = (payload.status || 'pending') === 'pending'
      const item = {
        id: payload.id || createId('CL'),
        buyerName: payload.buyerName,
        buyerCountry: payload.buyerCountry || '',
        buyerAddress: payload.buyerAddress || '',
        buyerIndustry: payload.buyerIndustry || '',
        appliedLimit: applied,
        usedLimit: used,
        remainingLimit: remaining,
        usageRate: applied > 0 ? Math.round((used / applied) * 100) : 0,
        currency: payload.currency || 'USD',
        paymentTerms: payload.paymentTerms || '',
        paymentMethod: payload.paymentMethod || '',
        paymentTermsDays: Number(payload.paymentTermsDays) || 0,
        cooperationYears: payload.cooperationYears || '',
        past12MonthSales: Number(payload.past12MonthSales) || Number(payload.historicalTransactionAmount) || 0,
        estimatedAnnualShipment: Number(payload.estimatedAnnualShipment) || 0,
        hasGuarantee: payload.hasGuarantee || 'no',
        guarantorName: payload.guarantorName || '',
        allowContactBuyer: payload.allowContactBuyer || 'yes',
        concentrationRate: Number(payload.concentrationRate) || 0,
        status: isPending ? 'pending' : (payload.status || 'pending'),
        statusName: isPending ? '待审批' : (payload.statusName || '待审批'),
        effectiveDate: isPending ? '' : (payload.effectiveDate || formatDate(now)),
        expiryDate: isPending ? '' : (payload.expiryDate || addDays(formatDate(now), 365)),
        lastShipmentDate: null,
        idleDays: 0
      }
      this.creditLimits.unshift(item)
      return { ok: true, data: item }
    },
    createShipment(payload) {
      const shipDate = payload.shipmentDate || formatDate(new Date())
      const deadline = payload.deadline || computeShipmentDeadline({
        shipmentDate: shipDate,
        destinationPort: payload.destinationPort,
        declarationType: payload.declarationType || 'single'
      })
      const item = {
        id: payload.id || createId('SD'),
        declarationNo: payload.declarationNo || createId('SD'),
        buyerName: payload.buyerName,
        relatedPolicyNo: payload.relatedPolicyNo,
        shipmentDate: shipDate,
        destinationPort: payload.destinationPort,
        shipmentAmount: Number(payload.shipmentAmount) || 0,
        currency: payload.currency || 'USD',
        declarationType: payload.declarationType || 'single',
        declarationTypeName: payload.declarationTypeName || '逐笔申报',
        paymentTerms: payload.paymentTerms || '',
        transportType: payload.transportType || '',
        billOfLadingNo: payload.billOfLadingNo || '',
        goodsDescription: payload.goodsDescription || '',
        invoiceNo: payload.invoiceNo || '',
        invoiceAmount: Number(payload.invoiceAmount) || 0,
        invoiceDate: payload.invoiceDate || '',
        paymentDueDate: payload.paymentDueDate || '',
        commercialInvoice: payload.commercialInvoice || [],
        billOfLading: payload.billOfLading || [],
        customsDeclaration: payload.customsDeclaration || [],
        receiptProof: payload.receiptProof || [],
        deadline,
        status: payload.status || 'declared',
        statusName: payload.statusName || '已申报',
        isOverdue: isOverdueByDeadline(deadline, payload.status || 'declared'),
        isDueSoon: isDueSoonByDeadline(deadline, payload.status || 'declared')
      }
      const normalized = normalizeShipment(item)
      this.shipments.unshift(normalized)
      // Update credit limit's usedLimit
      if (normalized.relatedPolicyNo) {
        const cl = this.creditLimits.find(c =>
          c.buyerName === normalized.buyerName ||
          this.policies.find(p => p.policyNo === normalized.relatedPolicyNo && p.insured === c.buyerName)
        )
        if (cl) {
          const shipAmount = Number(normalized.shipmentAmount) || 0
          cl.usedLimit = (cl.usedLimit || 0) + shipAmount
          cl.remainingLimit = Math.max((cl.appliedLimit || 0) - cl.usedLimit, 0)
          cl.usageRate = cl.appliedLimit > 0 ? Math.round((cl.usedLimit / cl.appliedLimit) * 100) : 0
          cl.lastShipmentDate = shipDate
          cl.idleDays = 0
        }
      }
      return normalized
    },
    // ===== Trade Information Management =====
    createTradeInfo(payload) {
      const now = new Date()
      const item = {
        id: payload.id || createId('TR'),
        contractNo: payload.contractNo || createId('CT'),
        enterpriseName: payload.enterpriseName || '',
        buyerName: payload.buyerName || '',
        buyerCountry: payload.buyerCountry || '',
        productInfo: payload.productInfo || '',
        transactionAmount: Number(payload.transactionAmount) || 0,
        currency: payload.currency || 'USD',
        paymentTerms: payload.paymentTerms || '',
        signDate: payload.signDate || formatDate(now),
        expireDate: payload.expireDate || addDays(formatDate(now), 365),
        status: payload.status || '进行中',
        relatedPolicyNo: payload.relatedPolicyNo || '',
        createTime: formatDateTime(now),
        updateTime: formatDateTime(now)
      }
      this.tradeInfos.unshift(item)
      return { ok: true, data: item }
    },
    updateTradeInfo(id, payload) {
      const idx = this.tradeInfos.findIndex(t => t.id === id)
      if (idx < 0) return { ok: false, message: '贸易信息不存在' }
      this.tradeInfos[idx] = { ...this.tradeInfos[idx], ...payload, updateTime: formatDateTime(new Date()) }
      saveStateToStorage(this.$state)
      return { ok: true, data: this.tradeInfos[idx] }
    },
    deleteTradeInfo(id) {
      const idx = this.tradeInfos.findIndex(t => t.id === id)
      if (idx < 0) return { ok: false, message: '贸易信息不存在' }
      this.tradeInfos.splice(idx, 1)
      saveStateToStorage(this.$state)
      return { ok: true }
    },
    addCompletedProcessTask(task) {
      this.processTasks.unshift({
        id: task.id || createId('PT'),
        policyNo: task.policyNo || '',
        companyName: task.companyName || '',
        taskType: '投保流程',
        startTime: task.startTime || '',
        endTime: task.endTime || '',
        stepsCompleted: task.stepsCompleted || 6,
        currentStep: 6,
        status: 'completed',
        statusName: '已完成',
        stepOptions: task.stepOptions || [],
        stepInfo: task.stepInfo || [],
        formData: task.formData || {},
        step2Docs: task.step2Docs || {},
        planLabels: task.planLabels || {},
        companyLabels: task.companyLabels || {}
      })
    },
    approveInsuranceTaskStep(taskId, { handler, approvalResult, auditOpinion }) {
      const task = this.processTasks.find(t => t.id === taskId)
      if (!task) return { ok: false, message: '任务不存在' }
      const stepNum = task.currentStep || 1
      const idx = stepNum - 1
      // Record current step completion
      if (task.stepInfo[idx]) {
        task.stepInfo[idx].endTime = formatDateTime(new Date())
        if (handler) task.stepInfo[idx].handler = handler
      }
      if (task.formData['step' + stepNum]) {
        task.formData['step' + stepNum].approvalResult = approvalResult || 'approved'
        task.formData['step' + stepNum].auditOpinion = auditOpinion || ''
      }
      if (stepNum >= 6) {
        task.status = 'completed'
        task.statusName = '已完成'
        task.currentStep = 6
        task.stepsCompleted = 6
        task.endTime = formatDateTime(new Date())
      } else {
        const nextStep = stepNum + 1
        task.status = 'processing'
        task.statusName = '处理中'
        task.currentStep = nextStep
        task.stepsCompleted = stepNum
        if (task.stepInfo[nextStep - 1]) {
          task.stepInfo[nextStep - 1].startTime = formatDateTime(new Date())
        }
      }
      this.touchInsuranceApplications()
      return { ok: true, data: task, advancedTo: task.currentStep }
    },
    rejectInsuranceTaskStep(taskId, { handler, auditOpinion }) {
      const task = this.processTasks.find(t => t.id === taskId)
      if (!task) return { ok: false, message: '任务不存在' }
      const stepNum = task.currentStep || 1
      const idx = stepNum - 1
      if (task.formData['step' + stepNum]) {
        task.formData['step' + stepNum].approvalResult = 'rejected'
        task.formData['step' + stepNum].auditOpinion = auditOpinion || '退回修改'
      }
      if (task.stepInfo[idx]) {
        if (handler) task.stepInfo[idx].handler = handler
      }
      task.status = 'pending'
      task.statusName = '待处理'
      this.touchInsuranceApplications()
      return { ok: true, data: task }
    },
    // ===== Contract Signing & Payment =====
    getContractsForCustomer(companyName) {
      return this.contracts.filter(c => c.companyName === companyName)
    },
    initContractFromPolicy(policy) {
      const exists = this.contracts.some(c => c.policyNo === policy.policyNo)
      if (exists) return
      const now = new Date()
      const contract = {
        id: `CT${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(Math.floor(Math.random() * 1000))}`,
        policyNo: policy.policyNo,
        companyName: policy.policyholder,
        insuredName: policy.insured,
        insuranceCompany: policy.insuranceCompany,
        coverageAmount: policy.coverageAmount,
        premium: policy.premium,
        policyStartDate: policy.effectiveDate,
        policyEndDate: policy.expiryDate,
        status: 'pending_inkasso_sign',
        paymentStatus: 'unpaid',
        paymentMethod: '',
        paymentDate: '',
        createdAt: formatDateTime(now)
      }
      this.contracts.unshift(contract)
      return contract
    },
    inkassoSignContract(policyNo, signatory) {
      const idx = this.contracts.findIndex(c => c.policyNo === policyNo)
      if (idx < 0) return { ok: false, message: '合同不存在' }
      const cur = this.contracts[idx]
      if (cur.status !== 'pending_inkasso_sign') return { ok: false, message: '当前状态不允许签署' }
      const now = new Date()
      this.contracts[idx] = {
        ...cur,
        status: 'inkasso_signed',
        signDate: formatDateTime(now),
        signatory: signatory || '长安银科',
        updatedAt: formatDateTime(now)
      }
      return { ok: true, data: this.contracts[idx] }
    },
    processPayment(policyNo, paymentMethod) {
      const idx = this.contracts.findIndex(c => c.policyNo === policyNo)
      if (idx < 0) return { ok: false, message: '合同不存在' }
      const cur = this.contracts[idx]
      if (!['inkasso_signed', 'underwriting_submitted'].includes(cur.status)) return { ok: false, message: '请等待平台签署完成后支付' }
      if (cur.paymentStatus === 'paid') return { ok: false, message: '已支付，无需重复支付' }
      const now = new Date()
      // Simulate payment processing
      this.contracts[idx] = {
        ...cur,
        status: 'paid',
        paymentStatus: 'paid',
        paymentMethod,
        paymentDate: formatDateTime(now),
        updatedAt: formatDateTime(now)
      }
      // Update the corresponding policy to active
      const pIdx = this.policies.findIndex(p => p.policyNo === policyNo)
      if (pIdx >= 0) {
        this.policies[pIdx] = {
          ...this.policies[pIdx],
          status: 'active',
          statusName: '有效'
        }
      }
      // Add payment record
      this.payments.unshift({
        id: `PAY${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
        policyNo,
        companyName: cur.companyName,
        amount: cur.premium,
        method: paymentMethod,
        status: 'success',
        paidAt: formatDateTime(now)
      })
      return { ok: true, data: this.contracts[idx] }
    },
    // ===== Contract Template (simulated API) =====
    getContractTemplate(policyType) {
      // Simulates API call to fetch configurable contract template
      const templates = {
        default: {
          title: '短期出口信用保险合同',
          version: 'v2025.1',
          clauses: [
            { id: 1, title: '一、保险责任范围', content: '本保单承保被保险人在保险期间内按贸易合同约定出口货物后，因买方商业风险（包括买方破产、拖欠货款、拒绝接收货物）或政治风险（包括汇兑限制、战争、征收）导致的直接损失。保险责任自货物出运之日起计算。' },
            { id: 2, title: '二、赔偿比例', content: '本保单下单一买方最高赔偿比例为90%，单笔最高赔偿限额为保险金额的10%。对于已获批信用限额的买方，在信用限额范围内的出口损失，保险人按约定比例承担赔偿责任。' },
            { id: 3, title: '三、免赔额', content: '每笔损失免赔额为2,000美元或损失金额的10%，以高者为准。同一买方项下连续多笔损失视为同一事件，合并计算免赔额。' },
            { id: 4, title: '四、申报义务', content: '被保险人应按月度向保险人申报出口贸易情况，于次月15日前完成申报。未按时申报的出口业务，保险人有权不予赔付。申报内容应包括买方名称、发票金额、出运日期、支付条件等基本信息。' },
            { id: 5, title: '五、保费支付', content: '被保险人应在保单生效前一次性支付全部保费。保费金额根据保险金额及费率表计算确定。逾期未支付的，保单自动终止，保险人不承担保险责任。' },
            { id: 6, title: '六、信用限额', content: '被保险人应就每一买方申请信用限额。保险人在核准的信用限额内承担赔偿责任。未经保险人核准信用限额而先行出运的，保险人不承担赔偿责任。' },
            { id: 7, title: '七、损失通知与索赔', content: '被保险人获悉可能发生损失后，应在10个工作日内向保险人提交损失通知书。索赔时应提供贸易合同、发票、提单、报关单、往来函电等证明文件。索赔时效为自损失发生之日起两年。' },
            { id: 8, title: '八、合同变更与终止', content: '本合同的任何变更应以书面形式作出，并经双方签字盖章后生效。任何一方提前终止合同，应提前30日书面通知对方。合同终止前已出运的业务仍适用本合同条款。' },
            { id: 9, title: '九、争议解决', content: '本协议适用中华人民共和国法律。因本合同引起的或与本合同有关的任何争议，双方应首先友好协商解决；协商不成的，提交保险人所在地有管辖权的人民法院诉讼解决。' },
            { id: 10, title: '十、保密条款', content: '双方对本合同的内容及履行过程中知悉的对方商业秘密负有保密义务。未经对方书面同意，不得向第三方披露，法律法规另有规定的除外。' }
          ]
        },
        short_term: {
          title: '短期出口信用保险标准合同',
          version: 'v2025.2',
          clauses: [
            { id: 1, title: '一、保险责任范围', content: '本保单承保被保险人在保险期间内按贸易合同约定出口货物后，因买方商业风险或政治风险导致的直接损失。' },
            { id: 2, title: '二、赔偿比例', content: '本保单下单一买方最高赔偿比例为80%，单笔最高赔偿限额为保险金额的15%。' },
            { id: 3, title: '三、免赔额', content: '每笔损失免赔额为3,000美元或损失金额的15%，以高者为准。' },
            { id: 4, title: '四、申报义务', content: '被保险人应按月向保险人申报出口贸易情况，于次月15日前完成申报。' },
            { id: 5, title: '五、保费支付', content: '被保险人应在保单生效前一次性支付全部保费。逾期未付则保单自动终止。' },
            { id: 6, title: '六、争议解决', content: '本协议适用中华人民共和国法律，提交保险人所在地人民法院诉讼解决。' }
          ]
        }
      }
      return templates[policyType] || templates.default
    },
    getApprovedPoliciesForContract(companyName) {
      // Find approved policies without existing contracts
      return this.policies.filter(p =>
        p.policyholder === companyName &&
        ['active', 'approved'].includes(p.status) &&
        !this.contracts.some(c => c.policyNo === p.policyNo)
      )
    },
    submitUnderwriting(policyNo, clerkName) {
      const idx = this.contracts.findIndex(c => c.policyNo === policyNo)
      if (idx < 0) return { ok: false, message: '合同不存在' }
      const cur = this.contracts[idx]
      if (!['inkasso_signed', 'paid'].includes(cur.status)) return { ok: false, message: '当前状态不允许提交核保' }
      const now = new Date()
      this.contracts[idx] = {
        ...cur,
        status: 'underwriting_submitted',
        underwritingDate: formatDateTime(now),
        underwritingSubmittedBy: clerkName || '跟单员',
        updatedAt: formatDateTime(now)
      }
      return { ok: true, data: this.contracts[idx] }
    },
    // ===== Post-Underwriting: Policy Issuance & Activation =====
    confirmPolicyIssued(policyNo) {
      const idx = this.contracts.findIndex(c => c.policyNo === policyNo)
      if (idx < 0) return { ok: false, message: '合同不存在' }
      const cur = this.contracts[idx]
      if (cur.status !== 'underwriting_submitted') return { ok: false, message: '当前状态不允许确认保单出具' }
      const now = new Date()
      this.contracts[idx] = {
        ...cur,
        status: 'policy_issued',
        policyIssuedDate: formatDateTime(now),
        updatedAt: formatDateTime(now)
      }
      return { ok: true, data: this.contracts[idx] }
    },
    uploadPolicyInfo(policyNo, policyData) {
      const idx = this.contracts.findIndex(c => c.policyNo === policyNo)
      if (idx < 0) return { ok: false, message: '合同不存在' }
      const cur = this.contracts[idx]
      if (cur.status !== 'policy_issued') return { ok: false, message: '请先确认保单已出具' }
      const now = new Date()
      this.contracts[idx] = {
        ...cur,
        status: 'policy_info_uploaded',
        policyInfo: { ...(policyData || {}) },
        policyInfoUploadDate: formatDateTime(now),
        updatedAt: formatDateTime(now)
      }
      return { ok: true, data: this.contracts[idx] }
    },
    uploadPaymentReceipt(policyNo, receiptData) {
      const idx = this.contracts.findIndex(c => c.policyNo === policyNo)
      if (idx < 0) return { ok: false, message: '合同不存在' }
      const cur = this.contracts[idx]
      if (cur.status !== 'policy_info_uploaded') return { ok: false, message: '请等待保单信息上传完成' }
      const now = new Date()
      this.contracts[idx] = {
        ...cur,
        status: 'offline_paid',
        offlinePaymentReceipt: receiptData?.files || [],
        offlinePaymentDate: formatDateTime(now),
        offlinePaymentMethod: receiptData?.paymentMethod || 'bank_transfer',
        offlinePaymentAmount: receiptData?.amount || cur.premium,
        updatedAt: formatDateTime(now)
      }
      return { ok: true, data: this.contracts[idx] }
    },
    activateInsurance(policyNo) {
      const idx = this.contracts.findIndex(c => c.policyNo === policyNo)
      if (idx < 0) return { ok: false, message: '合同不存在' }
      const cur = this.contracts[idx]
      if (cur.status !== 'offline_paid') return { ok: false, message: '请先确认客户已完成线下支付' }
      const now = new Date()
      this.contracts[idx] = {
        ...cur,
        status: 'insurance_active',
        insuranceActiveDate: formatDateTime(now),
        updatedAt: formatDateTime(now)
      }
      return { ok: true, data: this.contracts[idx] }
    },
    createClaim(payload) {
      const now = new Date()
      let policyNo = payload.relatedPolicyNo
      let policy = this.policies.find(p => p.policyNo === policyNo)
      if (!policyNo || !policy || policy.status !== 'active') {
        policy = this.policies.find(p => p.status === 'active')
        policyNo = policy?.policyNo || ''
      }
      const item = {
        id: payload.id || createId('CL'),
        claimNo: payload.claimNo || createId('CL'),
        relatedPolicyNo: policyNo,
        insuranceCompany: payload.insuranceCompany || policy.insuranceCompany || '',
        buyerName: payload.buyerName || policy.insured,
        claimType: payload.claimType,
        claimTypeName: payload.claimTypeName,
        lossDescription: payload.lossDescription,
        estimatedLossAmount: Number(payload.estimatedLossAmount) || 0,
        lossDate: payload.lossDate,
        lossLocation: payload.lossLocation || '',
        currentStep: payload.currentStep || 1,
        currentStepName: payload.currentStepName || '报案提交',
        warningLevel: payload.warningLevel || 'safe',
        clerkId: payload.clerkId || null,
        clerkName: payload.clerkName || null,
        delegationAgreement: payload.delegationAgreement || [],
        serviceFeePaid: payload.serviceFeePaid || false,
        serviceFeeVoucher: payload.serviceFeeVoucher || [],
        deductible: payload.deductible ?? null,
        claimDecision: payload.claimDecision || null,
        calculatedLoss: payload.calculatedLoss ?? null,
        payoutVoucher: payload.payoutVoucher || [],
        rwaSyncStatus: payload.rwaSyncStatus || 'pending',
        evidenceMaterials: payload.evidenceMaterials,
        relevantDocuments: payload.relevantDocuments,
        status: payload.status || 'pending',
        statusName: payload.statusName || '待接收报案',
        claimAmount: payload.claimAmount ?? null,
        docStatus: payload.docStatus || 'pending',
        docReviewComment: payload.docReviewComment || '',
        supplementCount: payload.supplementCount || 0,
        preparedDocs: payload.preparedDocs || [],
        supplementedDocs: payload.supplementedDocs || [],
        clerkConfirmed: payload.clerkConfirmed || false,
        lossNotified: payload.lossNotified || false,
        lossNotifiedTime: payload.lossNotifiedTime || null,
        insurerNotified: payload.insurerNotified || false,
        insurerNotifiedTime: payload.insurerNotifiedTime || null,
        createTime: payload.createTime || formatDateTime(now)
      }
      this.claims.unshift(item)
      this.touchClaims()
      return { ok: true, data: item }
    },

    advanceClaimStep(id, payload = {}) {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      const STEP_NAMES = { 1: '报案提交', 2: '跟单接单', 3: '审核补件', 4: '调查定损', 5: '理赔收回' }
      const STATUS_MAP = { 1: 'pending', 2: 'pending', 3: 'supplement', 4: 'processing', 5: 'decided' }
      const newStep = Math.min(cur.currentStep + 1, 5)
      Object.assign(cur, {
        currentStep: newStep,
        currentStepName: STEP_NAMES[newStep],
        status: STATUS_MAP[newStep] || cur.status,
        ...payload,
        updateTime: formatDateTime(new Date())
      })
      if (newStep === 5) cur.rwaSyncStatus = 'pending'
      this.touchClaims()
      return { ok: true, data: cur }
    },

    completeClaim(id, payload = {}) {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      Object.assign(cur, {
        status: 'completed',
        statusName: '已赔付',
        currentStep: 5,
        ...payload,
        updateTime: formatDateTime(new Date())
      })
      this.touchClaims()
      return { ok: true, data: cur }
    },

    inkassoReceiveClaim(id, clerkId, clerkName) {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      if (cur.status !== 'pending') return { ok: false, message: '当前状态不允许接收报案' }
      cur.clerkId = clerkId
      cur.clerkName = clerkName
      cur.status = 'assigned'
      cur.statusName = '待接单'
      cur.clerkConfirmed = false
      cur.lossNotified = false
      cur.lossNotifiedTime = null
      cur.insurerNotified = false
      cur.insurerNotifiedTime = null
      cur.docStatus = 'pending'
      cur.docReviewComment = ''
      cur.supplementCount = 0
      cur.updateTime = formatDateTime(new Date())
      this.touchClaims()
      return { ok: true, data: cur }
    },

    clerkAcceptClaim(id) {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      if (cur.status !== 'assigned') return { ok: false, message: '当前状态不允许接单' }
      cur.status = 'processing'
      cur.statusName = '处理中'
      cur.currentStep = 2
      cur.currentStepName = '跟单接单'
      cur.clerkConfirmed = true
      cur.updateTime = formatDateTime(new Date())
      this.touchClaims()
      return { ok: true, data: cur }
    },

    clerkConfirmReceive(id) {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      if (cur.status !== 'pending_receive' || cur.docStatus !== 'reviewing') {
        return { ok: false, message: '当前状态不允许确认接单' }
      }
      if (cur.clerkConfirmed) return { ok: false, message: '已确认接单，请勿重复操作' }
      cur.clerkConfirmed = true
      cur.status = 'processing'
      cur.statusName = '处理中'
      cur.currentStep = 2
      cur.currentStepName = '跟单接单'
      cur.updateTime = formatDateTime(new Date())
      this.touchClaims()
      return { ok: true, data: cur }
    },

    notifyInsurerLoss(id) {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      if (!cur.clerkConfirmed) return { ok: false, message: '请先确认接单' }
      if (cur.lossNotified) return { ok: false, message: '已发送可损申报通知' }
      cur.lossNotified = true
      cur.lossNotifiedTime = formatDateTime(new Date())
      cur.updateTime = formatDateTime(new Date())
      this.touchClaims()
      return { ok: true, data: cur }
    },

    inkassoNotifyInsurer(id) {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      if (cur.status !== 'assigned') return { ok: false, message: '当前状态不允许通知' }
      if (cur.insurerNotified) return { ok: false, message: '已发送通知' }
      cur.insurerNotified = true
      cur.insurerNotifiedTime = formatDateTime(new Date())
      cur.updateTime = formatDateTime(new Date())
      this.touchClaims()
      return { ok: true, data: cur }
    },

    pushDelegationContract(id) {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      if (cur.status !== 'pending_contract_sign') return { ok: false, message: '当前状态不允许推送合同' }
      cur.delegationAgreement = [
        { name: '委托追偿合同_cayk_legal_2026.pdf', signed: false },
        { name: '授权委托书_authorization_2026.pdf', signed: false }
      ]
      cur.updateTime = formatDateTime(new Date())
      this.touchClaims()
      return { ok: true, data: cur }
    },

    customerSignContract(id) {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      if (cur.status !== 'pending_contract_sign') return { ok: false, message: '当前状态不允许签署' }
      cur.delegationAgreement = (cur.delegationAgreement || []).map(d => ({ ...d, signed: true }))
      cur.status = 'pending_payment'
      cur.statusName = '待支付服务费'
      cur.updateTime = formatDateTime(new Date())
      this.touchClaims()
      return { ok: true, data: cur }
    },

    processServiceFee(id) {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      if (cur.status !== 'pending_payment') return { ok: false, message: '当前状态不允许支付' }
      cur.serviceFeePaid = true
      cur.status = 'payment_received'
      cur.statusName = '赔付到账'
      cur.currentStep = 5
      cur.currentStepName = '理赔收回'
      cur.updateTime = formatDateTime(new Date())
      this.touchClaims()
      return { ok: true, data: cur }
    },

    confirmPaymentReceived(id) {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      if (cur.status !== 'payment_received') return { ok: false, message: '当前状态不允许确认到账' }
      cur.status = 'completed'
      cur.statusName = '已完成'
      cur.updateTime = formatDateTime(new Date())
      this.touchClaims()
      return { ok: true, data: cur, action: 'confirmed' }
    },

    // ===== 理赔资料管理 =====
    prepareClaimDocs(id, docs) {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      if (cur.status !== 'assigned' || (cur.docStatus !== 'pending' && cur.docStatus !== 'prepared')) {
        return { ok: false, message: '当前状态不允许准备资料' }
      }
      cur.preparedDocs = docs
      cur.docStatus = 'prepared'
      cur.statusName = '资料已准备'
      cur.updateTime = formatDateTime(new Date())
      this.touchClaims()
      return { ok: true, data: cur }
    },

    submitDocsToClerk(id) {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      if (cur.docStatus !== 'prepared') return { ok: false, message: '请先准备理赔资料' }
      cur.docStatus = 'reviewing'
      cur.status = 'pending_receive'
      cur.statusName = '待接收'
      cur.updateTime = formatDateTime(new Date())
      this.touchClaims()
      return { ok: true, data: cur }
    },

    clerkReviewDocs(id, isComplete, comment = '') {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      if (cur.docStatus !== 'reviewing') return { ok: false, message: '当前状态不允许审核' }
      cur.docReviewComment = comment
      if (isComplete) {
        cur.docStatus = 'passed'
        cur.status = 'pending_contract_sign'
        cur.statusName = '待签署委托合同'
        cur.updateTime = formatDateTime(new Date())
        this.touchClaims()
        return { ok: true, data: cur, action: 'accepted' }
      } else {
        cur.docStatus = 'incomplete'
        cur.statusName = '资料不完整'
        cur.updateTime = formatDateTime(new Date())
        this.touchClaims()
        return { ok: true, data: cur, action: 'returned' }
      }
    },

    customerSupplementDocs(id, docs) {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      if (cur.docStatus !== 'incomplete') return { ok: false, message: '当前状态不允许补充资料' }
      cur.supplementedDocs = docs
      cur.supplementCount = (cur.supplementCount || 0) + 1
      cur.docStatus = 'supplemented'
      cur.statusName = '已补充'
      cur.updateTime = formatDateTime(new Date())
      this.touchClaims()
      return { ok: true, data: cur }
    },

    inkassoIntegrateDocs(id) {
      const cur = this.claims.find(c => c.id === id)
      if (!cur) return { ok: false, message: '理赔记录不存在' }
      if (cur.docStatus !== 'supplemented') return { ok: false, message: '当前状态不允许整合' }
      cur.preparedDocs = [...(cur.preparedDocs || []), ...(cur.supplementedDocs || [])]
      cur.supplementedDocs = []
      cur.docStatus = 'reviewing'
      cur.status = 'pending_receive'
      cur.statusName = '待接收'
      cur.updateTime = formatDateTime(new Date())
      this.touchClaims()
      return { ok: true, data: cur }
    },

    submitExternalPolicyForReview(id) {
      const cur = this.externalPolicies.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (!['pending_customer_review', 'rejected'].includes(cur.status)) return { ok: false, message: '当前状态不允许提交审核' }
      cur.status = 'pending_clerk_review'
      cur.rejectReason = ''
      cur.updateTime = formatDateTime(new Date())
      return { ok: true, data: cur }
    },

    approveExternalPolicy(id) {
      const cur = this.externalPolicies.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'clerk_review') return { ok: false, message: '当前状态不允许通过' }
      cur.status = 'active'
      cur.updateTime = formatDateTime(new Date())
      // Create corresponding policy entry
      const now = new Date()
      if (!this.policies.find(p => p.policyNo === cur.policyNo)) {
        this.policies.unshift({
          id: 'P_EXT_' + cur.id,
          policyNo: cur.policyNo,
          insuranceCompany: cur.insuranceCompany,
          policyholder: cur.policyholder,
          insured: cur.insured,
          coverageAmount: cur.coverageAmount,
          premium: cur.premium,
          effectiveDate: cur.effectiveDate,
          expiryDate: cur.expiryDate,
          status: 'active',
          statusName: '有效',
          usedQuota: 0,
          remainingQuota: cur.coverageAmount,
          currency: cur.currency,
          externalPolicyId: cur.id
        })
      }
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    rejectExternalPolicy(id, rejectReason) {
      const cur = this.externalPolicies.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'clerk_review' && cur.status !== 'clerk_confirm') return { ok: false, message: '当前状态不允许驳回' }
      if (!rejectReason?.trim()) return { ok: false, message: '请填写驳回原因' }
      cur.status = 'returned'
      cur.rejectReason = rejectReason
      cur.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    deleteExternalPolicy(id) {
      const idx = this.externalPolicies.findIndex(p => p.id === id)
      if (idx < 0) return { ok: false, message: '记录不存在' }
      this.externalPolicies.splice(idx, 1)
      return { ok: true }
    },

    // ===== Clerk-initiated electronic policy upload flow =====
    createClerkPolicyDraft({ companyName, customerCompany, uploadUser }) {
      const now = new Date()
      const id = `EP_CLERK_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
      const record = {
        id,
        customerCompany: customerCompany || '',
        clerkInitiated: true,
        originalFileName: '',
        originalFile: [],
        ocrStatus: 'pending',
        status: 'clerk_pending_auth',
        rejectReason: '',
        policyNo: '',
        linkedPolicyNo: '',
        uploaderRole: 'clerk',
        insuranceCompany: '',
        insurerName: '',
        policyholder: customerCompany || '',
        insured: '',
        beneficiary: '',
        effectiveDate: '',
        expiryDate: '',
        insurancePeriod: '12个月',
        renewalFlag: '否',
        coverageAmount: 0,
        currency: 'USD',
        premiumRate: 0,
        premium: 0,
        maxCompensationLimit: 0,
        buyerCreditLimit: 0,
        deductible: 0,
        coveredRisks: '',
        clauseVersion: '',
        countryRiskVersion: '',
        declarationMethod: '',
        declarationCycle: '',
        declarationDeadline: '',
        tradeBusinessType: '',
        selfControlledLimit: '',
        idlePeriod: 60,
        surrenderFee: '',
        recoveryPayee: '',
        premiumPaymentMethod: '',
        premiumPaymentDeadline: '',
        fileSize: '',
        uploadUser: uploadUser || '',
        createTime: formatDateTime(now),
        updateTime: formatDateTime(now)
      }
      this.externalPolicies.unshift(record)
      // Send notification to customer
      this.notifications = this.notifications || []
      this.notifications.unshift({
        id: createId('NOTIF'),
        type: 'auth_request',
        externalPolicyId: id,
        companyName: customerCompany || '',
        message: `跟单员 ${uploadUser || ''} 请求代客上传电子保单，请确认授权`,
        createTime: formatDateTime(now),
        read: false,
        toRole: 'customer'
      })
      saveStateToStorage(this.$state)
      return { ok: true, data: record }
    },

    clerkAuthorizePolicy(id) {
      const cur = this.externalPolicies.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'clerk_pending_auth') return { ok: false, message: '当前状态不允许授权' }
      cur.status = 'clerk_auth_authorized'
      cur.updateTime = formatDateTime(new Date())
      // Clear the notification or mark it as handled
      if (this.notifications) {
        const nIdx = this.notifications.findIndex(n => n.externalPolicyId === id && n.type === 'auth_request')
        if (nIdx >= 0) this.notifications.splice(nIdx, 1)
      }
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    clerkUploadPolicyFile(id, { file }) {
      const cur = this.externalPolicies.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'clerk_auth_authorized') return { ok: false, message: '当前状态不允许上传文件' }
      cur.originalFileName = file?.name || 'unknown.pdf'
      cur.originalFile = file ? [file] : []
      cur.fileSize = file?.size ? `${(file.size / 1048576).toFixed(1)} MB` : ''
      cur.ocrStatus = 'pending'
      cur.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    clerkCompleteOcr(id, { success, ocrFields }) {
      const epIdx = this.externalPolicies.findIndex(p => p.id === id)
      if (epIdx < 0) return { ok: false, message: '记录不存在' }
      const cur = this.externalPolicies[epIdx]
      if (cur.status !== 'clerk_ocr_processing') return { ok: false, message: '当前状态不允许OCR识别' }
      const now = new Date()
      if (success && ocrFields) {
        this.externalPolicies[epIdx] = {
          ...cur,
          ...ocrFields,
          ocrStatus: 'completed',
          status: 'clerk_active',
          updateTime: formatDateTime(now)
        }
        // Create corresponding policy entry
        if (!this.policies.find(p => p.policyNo === ocrFields.policyNo)) {
          this.policies.unshift({
            id: 'P_EXT_CLERK_' + cur.id,
            policyNo: ocrFields.policyNo,
            insuranceCompany: ocrFields.insuranceCompany,
            policyholder: ocrFields.policyholder || cur.customerCompany,
            insured: ocrFields.insured || '',
            coverageAmount: Number(ocrFields.coverageAmount) || 0,
            premium: Number(ocrFields.premium) || 0,
            effectiveDate: ocrFields.effectiveDate || '',
            expiryDate: ocrFields.expiryDate || '',
            status: 'active',
            statusName: '有效',
            usedQuota: 0,
            remainingQuota: Number(ocrFields.coverageAmount) || 0,
            currency: ocrFields.currency || 'USD',
            externalPolicyId: cur.id
          })
        }
        saveStateToStorage(this.$state)
        return { ok: true, data: this.externalPolicies[epIdx] }
      } else {
        this.externalPolicies[epIdx] = {
          ...cur,
          ocrStatus: 'failed',
          status: 'clerk_ocr_failed',
          updateTime: formatDateTime(now)
        }
        saveStateToStorage(this.$state)
        return { ok: true, data: this.externalPolicies[epIdx] }
      }
    },

    clerkApproveFailedOcr(id) {
      const cur = this.externalPolicies.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'clerk_ocr_failed' && cur.status !== 'clerk_confirm') return { ok: false, message: '当前状态不允许确认生效' }
      const now = new Date()
      cur.status = 'clerk_active'
      cur.ocrStatus = 'completed'
      cur.updateTime = formatDateTime(now)
      // Create corresponding policy entry
      if (!this.policies.find(p => p.externalPolicyId === cur.id || p.id === 'P_EXT_CLERK_' + cur.id)) {
        this.policies.unshift({
          id: 'P_EXT_CLERK_' + cur.id,
          policyNo: cur.policyNo || `PI${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          insuranceCompany: cur.insuranceCompany || '',
          policyholder: cur.policyholder || cur.customerCompany,
          insured: cur.insured || '',
          coverageAmount: Number(cur.coverageAmount) || 0,
          premium: Number(cur.premium) || 0,
          effectiveDate: cur.effectiveDate || formatDateTime(now),
          expiryDate: cur.expiryDate || '',
          status: 'active',
          statusName: '有效',
          usedQuota: 0,
          remainingQuota: Number(cur.coverageAmount) || 0,
          currency: cur.currency || 'USD',
          externalPolicyId: cur.id
        })
      }
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    pushPolicyToPlatformOcr(id) {
      const cur = this.externalPolicies.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'clerk_auth_authorized') return { ok: false, message: '当前状态不允许推送平台审核' }
      cur.status = 'clerk_platform_review'
      cur.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    completePlatformOcr(id, ocrFields) {
      const epIdx = this.externalPolicies.findIndex(p => p.id === id)
      if (epIdx < 0) return { ok: false, message: '记录不存在' }
      const cur = this.externalPolicies[epIdx]
      if (cur.status !== 'clerk_platform_review') return { ok: false, message: '当前状态不允许OCR完成' }
      const now = new Date()
      this.externalPolicies[epIdx] = {
        ...cur,
        ...ocrFields,
        ocrStatus: 'completed',
        status: 'clerk_confirm',
        updateTime: formatDateTime(now)
      }
      saveStateToStorage(this.$state)
      return { ok: true, data: this.externalPolicies[epIdx] }
    },

    // ===== Policy Maintenance Lifecycle (Renewal / Change / Surrender) =====
    processPolicyRenewal(policyNo, data) {
      const pOld = this.policies.find(p => p.policyNo === policyNo)
      if (!pOld) return { ok: false, message: '保单不存在' }

      const now = new Date()
      const pad2 = (n) => String(n).padStart(2, '0')
      const y = now.getFullYear()
      const m = pad2(now.getMonth() + 1)
      const d = pad2(now.getDate())

      const newPolicyNo = `PI${y}${m}${pad2(Math.floor(Math.random() * 100))}`
      const turnover = Number(data.renewalTurnover) || pOld.coverageAmount
      const ratio = (Number(data.renewalRatio) || 2.5) / 100
      const newPremium = Math.round(turnover * ratio)
      const renewalStart = data.renewalStart || addDays(pOld.expiryDate, 1)
      const renewalEnd = data.renewalEnd || addDays(renewalStart, 365)

      // Mark old policy as renewed
      this.policies = this.policies.map(p =>
        p.policyNo === policyNo
          ? { ...p, status: 'renewed', statusName: '已续保', renewalTargetNo: newPolicyNo }
          : p
      )

      // Create new policy with updated terms
      const newPolicy = {
        id: `P${y}${m}${pad2(Math.floor(Math.random() * 100))}`,
        policyNo: newPolicyNo,
        insuranceCompany: pOld.insuranceCompany,
        policyholder: pOld.policyholder,
        insured: pOld.insured,
        coverageAmount: turnover,
        premium: newPremium,
        effectiveDate: renewalStart,
        expiryDate: renewalEnd,
        status: 'active',
        statusName: '有效',
        usedQuota: 0,
        remainingQuota: turnover,
        currency: pOld.currency || 'USD',
        renewedFrom: policyNo
      }
      this.policies.unshift(newPolicy)

      // Create new contract for the renewed policy
      this.contracts.unshift({
        id: `CT${y}${m}${d}${pad2(Math.floor(Math.random() * 100))}`,
        policyNo: newPolicyNo,
        companyName: pOld.policyholder,
        insuredName: pOld.insured,
        insuranceCompany: pOld.insuranceCompany,
        coverageAmount: turnover,
        premium: newPremium,
        policyStartDate: renewalStart,
        policyEndDate: renewalEnd,
        status: 'pending_inkasso_sign',
        paymentStatus: 'unpaid',
        paymentMethod: '',
        createdAt: formatDateTime(now),
        updatedAt: formatDateTime(now)
      })

      return {
        ok: true,
        newPolicyNo,
        newPolicy,
        message: `续保成功！新保单号：${newPolicyNo}，保险期间 ${renewalStart} 至 ${renewalEnd}`
      }
    },

    processPolicyChange(policyNo, data) {
      const pIdx = this.policies.findIndex(p => p.policyNo === policyNo)
      if (pIdx < 0) return { ok: false, message: '保单不存在' }

      const now = new Date()
      const pad2 = (n) => String(n).padStart(2, '0')
      const y = now.getFullYear()
      const m = pad2(now.getMonth() + 1)
      const d = pad2(now.getDate())

      const changeType = data.changeType || 'other'
      const changeTypeLabels = { insured: '被保险人变更', limit: '额度调整', rate: '费率调整', other: '其他变更' }
      const changeTypeName = changeTypeLabels[changeType] || '其他变更'

      const changeRecord = {
        id: `CH${y}${m}${d}${pad2(Math.floor(Math.random() * 100))}`,
        policyNo,
        changeType,
        changeTypeName,
        description: data.description || '',
        changeDate: formatDateTime(now),
        status: 'completed'
      }

      this.policies[pIdx] = {
        ...this.policies[pIdx],
        changeType,
        changeTypeName,
        changeDescription: data.description,
        changeDate: formatDateTime(now),
        changeRecord
      }

      return {
        ok: true,
        changeRecord,
        data: this.policies[pIdx],
        message: `保单变更（${changeTypeName}）已生效${
          changeType === 'limit' ? '，请重新申请信用限额' :
          changeType === 'rate' ? '，新费率将在下一期保费中调整' : ''
        }`
      }
    },

    cancelPolicy(policyNo, data) {
      const pIdx = this.policies.findIndex(p => p.policyNo === policyNo)
      if (pIdx < 0) return { ok: false, message: '保单不存在' }

      // Check active claims
      const activeClaims = this.claims.filter(c => c.relatedPolicyNo === policyNo && c.status !== 'completed')
      if (activeClaims.length > 0) {
        return { ok: false, message: `该保单存在 ${activeClaims.length} 笔未结案理赔记录（${activeClaims.map(c => c.claimNo).join('、')}），请先处理完成后再申请退保` }
      }

      const surrenderReason = data.surrenderReason || 'other'
      const reasonLabels = { no_business: '无业务需求', switch_company: '更换保险公司', dissatisfied: '对服务不满意', other: '其他原因' }
      const reasonName = reasonLabels[surrenderReason] || '其他原因'

      this.policies[pIdx] = {
        ...this.policies[pIdx],
        status: 'cancelled',
        statusName: '已退保',
        cancelReason: reasonName,
        cancelDate: data.surrenderDate || formatDate(new Date()),
        cancelDescription: data.description || ''
      }

      // Update related contract
      const cIdx = this.contracts.findIndex(c => c.policyNo === policyNo)
      if (cIdx >= 0) {
        this.contracts[cIdx] = {
          ...this.contracts[cIdx],
          status: 'cancelled',
          updatedAt: formatDateTime(new Date())
        }
      }

      return {
        ok: true,
        data: this.policies[pIdx],
        message: `保单已退保（${reasonName}），退保生效日期：${data.surrenderDate || formatDate(new Date())}`
      }
    },
    generateDocuments(id) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const cur = this.insuranceApplications[idx]
      const generateableStatuses = ['pending_review', 'clerk_review', 'pending_material', 'ocr_pending', 'ocr_clerk_review', 'approved']
      if (!generateableStatuses.includes(cur.status)) {
        return { ok: false, message: '当前状态不允许生成投保资料' }
      }
      const now = new Date()
      this.insuranceApplications[idx] = {
        ...cur,
        status: 'contract_signing',
        updateTime: formatDateTime(now)
      }
      return { ok: true, data: this.insuranceApplications[idx] }
    },
    pushToClerk(id) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const cur = this.insuranceApplications[idx]
      if (cur.status !== 'service_fee_paid') {
        return { ok: false, message: '当前状态不允许推送给跟单员，请完成合同签署和服务费支付' }
      }
      const now = new Date()
      this.insuranceApplications[idx] = {
        ...cur,
        status: 'clerk_review',
        updateTime: formatDateTime(now)
      }
      return { ok: true, data: this.insuranceApplications[idx] }
    },
    signInsuranceContract(id, role) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const cur = this.insuranceApplications[idx]
      const now = new Date()
      if (role === 'inkasso') {
        if (cur.status !== 'contract_signing') return { ok: false, message: '当前状态不允许平台签署' }
        if (cur.inkassoContractSigned) return { ok: false, message: '平台已签署，无需重复签署' }
        this.insuranceApplications[idx] = {
          ...cur,
          inkassoContractSigned: true,
          inkassoSignTime: formatDateTime(now),
          status: 'inkasso_signed',
          updateTime: formatDateTime(now)
        }
        return { ok: true, data: this.insuranceApplications[idx] }
      }
      if (role === 'customer') {
        if (cur.status !== 'inkasso_signed') return { ok: false, message: '请等待平台签署后再签署' }
        if (cur.customerContractSigned) return { ok: false, message: '已签署，无需重复签署' }
        this.insuranceApplications[idx] = {
          ...cur,
          customerContractSigned: true,
          customerSignTime: formatDateTime(now),
          status: 'contract_signed',
          updateTime: formatDateTime(now)
        }
        return { ok: true, data: this.insuranceApplications[idx] }
      }
      return { ok: false, message: '无效的签署角色' }
    },
    payServiceFee(id, paymentInfo) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const cur = this.insuranceApplications[idx]
      if (cur.status !== 'contract_signed') return { ok: false, message: '当前状态不允许支付' }
      if (cur.serviceFeePaid) return { ok: false, message: '服务费已支付，无需重复支付' }
      const now = new Date()
      this.insuranceApplications[idx] = {
        ...cur,
        serviceFeePaid: true,
        serviceFeeAmount: paymentInfo.amount || 0,
        payerType: paymentInfo.payerType || 'enterprise',
        payerName: paymentInfo.payerName || cur.companyName,
        paymentSubject: paymentInfo.paymentSubject || cur.companyName,
        paymentMethod: paymentInfo.paymentMethod || 'online',
        serviceFeePayTime: formatDateTime(now),
        status: 'service_fee_paid',
        updateTime: formatDateTime(now)
      }
      return { ok: true, data: this.insuranceApplications[idx] }
    }
  }
})
