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

const addWorkingDays = (date, days) => {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return formatDate(result)
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
  return addWorkingDays(shipDate, 10)
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
  const preDeclareStates = ['pending_declare', 'declaring']
  if (isOverdue && preDeclareStates.includes(next.status)) {
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
      policyChangeApplications: state.policyChangeApplications,
      renewalApplications: state.renewalApplications,
      surrenderApplications: state.surrenderApplications,
      clApplications: state.clApplications,
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
    insuranceUpdateVersion: 0,
    policyChangeApplications: [],
    renewalApplications: [],
    surrenderApplications: [],
    surrenderUpdateVersion: 0,
    clApplications: [],
    clUpdateVersion: 0
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
    touchSurrenderApplications() {
      this.surrenderUpdateVersion++
      saveStateToStorage(this.$state)
    },
    touchClApplications() {
      this.clUpdateVersion++
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
        this.policyChangeApplications = saved.policyChangeApplications || []
        this.renewalApplications = saved.renewalApplications || []
        this.surrenderApplications = saved.surrenderApplications || []
        this.clApplications = saved.clApplications || []
        return
      }
      this.policyChangeApplications = []
      this.renewalApplications = []
      this.surrenderApplications = []
      this.clApplications = []
      // Seed a renewal application at renew_active state for testing payment flow
      const now = new Date()
      this.renewalApplications.push({
        id: 'RN_SEED_ACTIVE',
        policyNo: 'POL20260426000000',
        insuranceCompany: '人保财险',
        policyholder: '深圳电子科技有限公司',
        insured: 'TechBuyer Co., Ltd',
        coverageAmount: 5000000,
        premium: 5500,
        originalEffectiveDate: '2025-04-26',
        originalExpiryDate: '2026-04-25',
        newStartDate: '2026-04-26',
        newEndDate: '2027-04-25',
        expectedTurnover: 6000000,
        insuranceRatio: 80,
        lastYearDeclaredTotal: 4800000,
        lastYearClaimTotal: 35000,
        lossRatio: 0.73,
        limitUtilization: 64,
        renewalRate: 0.0011,
        buyerList: 'TechBuyer Co., Ltd\nGlobal Parts Inc.\nEuroDistributor GmbH',
        status: 'renew_active',
        newPolicyNo: 'POL20260426000001',
        newPolicyStartDate: '2026-04-26',
        newPolicyEndDate: '2027-04-25',
        newPremium: 5500,
        newCoverageAmount: 5000000,
        serviceFee: 1500,
        totalAmount: 7000,
        insurerDecision: 'approved',
        insurerOpinion: '核保通过',
        insurerReviewTime: '2026-04-27 10:30:00',
        clerkSyncTime: '2026-04-27 14:00:00',
        inkassoSyncTime: '2026-04-27 14:00:00',
        activeTime: '2026-04-27 14:00:00',
        createTime: '2026-04-26 09:00:00',
        submitTime: '2026-04-26 09:00:00',
        updateTime: '2026-04-27 14:00:00',
        generatedApplicationForm: [
          { name: '续保申请书_POL20260426000000.pdf', size: '0.3 MB', generatedAt: '2026-04-26 10:00:00' }
        ],
        generatedMaterials: [
          { name: '上年度出运汇总.xlsx', size: '0.5 MB', generatedAt: '2026-04-26 10:00:00' }
        ]
      })
      // Seed policies for demo/testing
      this.policies = [
        {
          id: 'P_SEED_ACTIVE_1',
          policyNo: 'POL20260426000000',
          insuranceCompany: '人保财险',
          policyholder: '深圳电子科技有限公司',
          insured: 'TechBuyer Co., Ltd',
          coverageAmount: 5000000,
          premium: 5500,
          effectiveDate: '2025-04-26',
          expiryDate: '2026-04-25',
          usedQuota: 1200000,
          remainingQuota: 3800000,
          currency: 'USD',
          status: 'active',
          statusName: '有效',
          businessType: 'goods',
          renewalFlag: 'yes'
        },
        {
          id: 'P_SEED_ACTIVE_2',
          policyNo: 'POL20260315000001',
          insuranceCompany: '太平洋保险',
          policyholder: '上海进出口贸易有限公司',
          insured: 'EuroDistributor GmbH',
          coverageAmount: 3000000,
          premium: 3500,
          effectiveDate: '2025-03-15',
          expiryDate: '2026-03-14',
          usedQuota: 800000,
          remainingQuota: 2200000,
          currency: 'USD',
          status: 'active',
          statusName: '有效',
          businessType: 'goods',
          renewalFlag: 'no'
        }
      ]
      // Seed surrender applications for demo
      this.surrenderApplications = [
        {
          id: 'SR_SEED_PLATFORM',
          policyNo: 'POL20260426000000',
          companyName: '深圳电子科技有限公司',
          insured: 'TechBuyer Co., Ltd',
          insuranceCompany: '人保财险',
          coverageAmount: 5000000,
          premium: 5500,
          effectiveDate: '2025-04-26',
          expiryDate: '2026-04-25',
          currency: 'USD',
          surrenderReason: '业务调整，不再需要出口信用保险覆盖',
          applicationDate: '2026-05-25',
          effectiveDate: '',
          surrenderApplication: [{ name: '退保申请书_POL20260426000000.pdf', size: '0.3 MB' }],
          originalPolicy: [],
          legalPersonId: [],
          paymentReceipt: [],
          otherDocuments: [],
          generatedSurrenderForm: [],
          generatedSurrenderChecklist: [],
          activeMonths: 13,
          shortTermRate: 0,
          refundAmount: 0,
          netRefundAmount: 0,
          insurerPaymentTime: '',
          insurerPaymentRef: '',
          clerkSyncRecord: '',
          clerkSyncTime: '',
          rejectReason: '',
          supplementHistory: [],
          trackingStatus: '',
          trackingStartTime: '',
          status: 'sr_platform_review',
          createTime: '2026-05-25 09:00:00',
          updateTime: '2026-05-25 09:00:00',
          submitTime: '2026-05-25 09:00:00',
          platformReviewTime: '',
          clerkReviewTime: '',
          insurerReviewTime: '',
          completedTime: '',
          terminatedTime: ''
        },
        {
          id: 'SR_SEED_TERMINATED',
          policyNo: 'POL20260315000001',
          companyName: '上海进出口贸易有限公司',
          insured: 'EuroDistributor GmbH',
          insuranceCompany: '太平洋保险',
          coverageAmount: 3000000,
          premium: 3500,
          effectiveDate: '2025-03-15',
          expiryDate: '2026-03-14',
          currency: 'USD',
          surrenderReason: '保单到期不再续保',
          applicationDate: '2026-02-20',
          effectiveDate: '2026-03-14',
          surrenderApplication: [{ name: '退保申请书_POL20260315000001.pdf', size: '0.3 MB' }],
          originalPolicy: [],
          legalPersonId: [],
          paymentReceipt: [],
          otherDocuments: [],
          generatedSurrenderForm: [{ name: '退保申请表_POL20260315000001.pdf', size: '0.4 MB' }],
          generatedSurrenderChecklist: [{ name: '退保材料清单_POL20260315000001.pdf', size: '0.2 MB' }],
          activeMonths: 12,
          shortTermRate: 45,
          refundAmount: 1575,
          netRefundAmount: 1425,
          insurerPaymentTime: '2026-03-01 14:00:00',
          insurerPaymentRef: 'INS-PAY-20260301-001',
          clerkSyncRecord: '退保金额已核对，已同步至平台',
          clerkSyncTime: '2026-03-02 10:00:00',
          rejectReason: '',
          supplementHistory: [],
          trackingStatus: 'monthly',
          trackingStartTime: '2026-03-15 09:00:00',
          status: 'sr_terminated',
          createTime: '2026-02-20 08:30:00',
          updateTime: '2026-03-15 09:00:00',
          submitTime: '2026-02-20 08:30:00',
          platformReviewTime: '2026-02-21 09:00:00',
          clerkReviewTime: '2026-02-22 10:00:00',
          insurerReviewTime: '2026-02-25 11:00:00',
          completedTime: '2026-03-02 10:00:00',
          terminatedTime: '2026-03-15 09:00:00'
        }
      ]
      // Seed a credit limit application at cl_platform_review for testing
      this.clApplications.push({
        id: 'CLA_SEED_PLATFORM',
        policyNo: 'POL20260426000000',
        policyId: 'seed_policy_001',
        buyerName: 'TechBuyer Co., Ltd',
        policyTotalLimit: 5000000,
        existingCreditTotal: 2000000,
        appliedLimit: 1500000,
        currency: 'USD',
        applicationDate: '2026-05-20',
        applicationReason: '业务增长，需要增加买方信用额度',
        creditQueryResult: {
          buyerCreditRating: 'AA',
          buyerCreditLimit: 2000000,
          historicalDefaultRate: 1.2,
          queryTime: '2026-05-20 09:30:00'
        },
        overLimitWarning: false,
        overLimitMessage: '',
        generatedApplicationForm: [{ name: '限额申请表_POL20260426000000.pdf', size: '0.3 MB' }],
        generatedCreditReport: [{ name: '买方资信报告_TechBuyer.pdf', size: '1.2 MB' }],
        generatedChecklist: [{ name: '材料清单_CLA_SEED_PLATFORM.pdf', size: '0.2 MB' }],
        insurerDecision: '', insurerOpinion: '', rejectType: '', rejectReason: '',
        approvedLimit: 0, approvedRate: 0,
        effectiveDate: '', expiryDate: '',
        specialConditions: '', insurerReviewTime: '',
        recordedQuota: 0, recordedTime: '',
        syncRecord: '', syncTime: '', platformUpdateTime: '',
        rejectNotifiedClerk: false, rejectNotifiedPlatform: false, rejectNotifiedCustomer: false,
        status: 'cl_platform_review',
        createTime: '2026-05-20 09:00:00',
        updateTime: '2026-05-20 09:30:00',
        submitTime: '2026-05-20 09:05:00',
        platformReviewTime: '2026-05-20 09:30:00',
        clerkReviewTime: '', insurerReviewTime: '', completedTime: ''
      })
      // Seed a credit limit application at cl_draft for customer testing
      this.clApplications.push({
        id: 'CLA_SEED_DRAFT',
        policyNo: 'POL20260426000000',
        policyId: 'seed_policy_001',
        buyerName: '新买方测试有限公司',
        policyTotalLimit: 5000000,
        existingCreditTotal: 2000000,
        appliedLimit: 800000,
        currency: 'USD',
        applicationDate: '2026-05-26',
        applicationReason: '开拓新买方市场',
        creditQueryResult: {
          buyerCreditRating: 'A',
          buyerCreditLimit: 1200000,
          historicalDefaultRate: 2.5,
          queryTime: '2026-05-26 08:30:00'
        },
        overLimitWarning: false,
        overLimitMessage: '',
        generatedApplicationForm: [],
        generatedCreditReport: [],
        generatedChecklist: [],
        insurerDecision: '', insurerOpinion: '', rejectType: '', rejectReason: '',
        approvedLimit: 0, approvedRate: 0,
        effectiveDate: '', expiryDate: '',
        specialConditions: '', insurerReviewTime: '',
        recordedQuota: 0, recordedTime: '',
        syncRecord: '', syncTime: '', platformUpdateTime: '',
        rejectNotifiedClerk: false, rejectNotifiedPlatform: false, rejectNotifiedCustomer: false,
        status: 'cl_draft',
        createTime: '2026-05-26 08:00:00',
        updateTime: '2026-05-26 08:30:00',
        submitTime: '', platformReviewTime: '',
        clerkReviewTime: '', insurerReviewTime: '', completedTime: ''
      })
      // Seed a completed credit limit application
      this.clApplications.push({
        id: 'CLA_SEED_COMPLETED',
        policyNo: 'POL20260426000000',
        policyId: 'seed_policy_001',
        buyerName: 'Global Trade Inc.',
        policyTotalLimit: 5000000,
        existingCreditTotal: 2000000,
        appliedLimit: 1000000,
        currency: 'USD',
        applicationDate: '2026-05-10',
        applicationReason: '年度额度续期',
        creditQueryResult: {
          buyerCreditRating: 'AAA',
          buyerCreditLimit: 2000000,
          historicalDefaultRate: 0.5,
          queryTime: '2026-05-10 09:00:00'
        },
        overLimitWarning: false,
        overLimitMessage: '',
        generatedApplicationForm: [{ name: '限额申请表_POL20260426000000.pdf', size: '0.3 MB' }],
        generatedCreditReport: [{ name: '买方资信报告_Global Trade.pdf', size: '1.2 MB' }],
        generatedChecklist: [{ name: '材料清单_CLA_SEED_COMPLETED.pdf', size: '0.2 MB' }],
        insurerDecision: 'approved',
        insurerOpinion: '买方信用良好，建议批准',
        rejectType: '', rejectReason: '',
        approvedLimit: 1000000, approvedRate: 100,
        effectiveDate: '2026-05-15', expiryDate: '2027-05-14',
        specialConditions: '需每季度重新评估买方信用',
        insurerReviewTime: '2026-05-12 14:00:00',
        recordedQuota: 1000000, recordedTime: '2026-05-13 09:00:00',
        syncRecord: '配额已核对，同步至平台', syncTime: '2026-05-13 10:00:00',
        platformUpdateTime: '2026-05-13 11:00:00',
        rejectNotifiedClerk: false, rejectNotifiedPlatform: false, rejectNotifiedCustomer: false,
        status: 'cl_completed',
        createTime: '2026-05-10 08:30:00',
        updateTime: '2026-05-13 11:00:00',
        submitTime: '2026-05-10 09:00:00',
        platformReviewTime: '2026-05-10 10:00:00',
        clerkReviewTime: '2026-05-11 09:00:00',
        insurerReviewTime: '2026-05-12 14:00:00',
        completedTime: '2026-05-13 11:00:00'
      })
      this.insuranceApplications = []
      this.creditLimits = []
      this.shipments = [
        {
          id: 'SD_SEED_1',
          declarationNo: 'SD202605260001',
          buyerName: 'TechBuyer Co., Ltd',
          relatedPolicyNo: 'POL20260426000000',
          shipmentDate: '2026-05-20',
          destinationPort: 'Los Angeles',
          shipmentAmount: 150000,
          currency: 'USD',
          declarationType: 'single',
          declarationTypeName: '逐笔申报',
          paymentTerms: 'OA',
          transportType: 'sea',
          billOfLadingNo: 'BL20260520001',
          goodsDescription: '电子元器件',
          invoiceNo: 'INV202605001',
          invoiceAmount: 150000,
          invoiceDate: '2026-05-18',
          paymentDueDate: '2026-07-20',
          commercialInvoice: [{ name: '商业发票_INV202605001.pdf', size: '0.2 MB' }],
          billOfLading: [{ name: '提单_BL20260520001.pdf', size: '0.3 MB' }],
          customsDeclaration: [],
          receiptProof: [],
          deadline: '2026-06-05',
          status: 'sd_clerk_pending',
          statusName: '待跟单员处理',
          isOverdue: false,
          isDueSoon: false,
          financingStatus: 'not_financed',
          financeMarked: false,
          generatedDocs: [
            { name: '出运申报单_SD202605260001.pdf', size: '0.3 MB', type: 'declaration_form', generatedAt: '2026-05-26 10:00:00' },
            { name: '商业发票清单_SD202605260001.pdf', size: '0.5 MB', type: 'invoice_list', generatedAt: '2026-05-26 10:00:00' },
            { name: '限额使用报告_SD202605260001.pdf', size: '0.2 MB', type: 'limit_report', generatedAt: '2026-05-26 10:00:00' },
            { name: '出运申报汇总表_SD202605260001.xlsx', size: '0.4 MB', type: 'summary_sheet', generatedAt: '2026-05-26 10:00:00' }
          ],
          pushTime: '2026-05-26 10:05:00',
          createTime: '2026-05-26 09:00:00',
          updateTime: '2026-05-26 10:05:00'
        },
        {
          id: 'SD_SEED_2',
          declarationNo: 'SD202605260002',
          buyerName: 'EuroDistributor GmbH',
          relatedPolicyNo: 'POL20260315000001',
          shipmentDate: '2026-05-22',
          destinationPort: 'Hamburg',
          shipmentAmount: 280000,
          currency: 'USD',
          declarationType: 'single',
          declarationTypeName: '逐笔申报',
          paymentTerms: 'TT60',
          transportType: 'sea',
          billOfLadingNo: 'BL20260522002',
          goodsDescription: '机械设备',
          invoiceNo: 'INV202605002',
          invoiceAmount: 280000,
          invoiceDate: '2026-05-20',
          paymentDueDate: '2026-07-22',
          commercialInvoice: [{ name: '商业发票_INV202605002.pdf', size: '0.3 MB' }],
          billOfLading: [{ name: '提单_BL20260522002.pdf', size: '0.4 MB' }],
          customsDeclaration: [],
          receiptProof: [],
          deadline: '2026-06-05',
          status: 'pending_premium',
          statusName: '待支付保费',
          limitImpactChecked: true,
          limitOkAfterSync: true,
          isOverdue: false,
          isDueSoon: false,
          financingStatus: 'financed',
          financeMarked: true,
          financeContractNo: 'RWA202605001',
          generatedDocs: [
            { name: '出运申报单_SD202605260002.pdf', size: '0.3 MB', type: 'declaration_form', generatedAt: '2026-05-26 10:00:00' },
            { name: '商业发票清单_SD202605260002.pdf', size: '0.5 MB', type: 'invoice_list', generatedAt: '2026-05-26 10:00:00' },
            { name: '限额使用报告_SD202605260002.pdf', size: '0.2 MB', type: 'limit_report', generatedAt: '2026-05-26 10:00:00' },
            { name: '出运申报汇总表_SD202605260002.xlsx', size: '0.4 MB', type: 'summary_sheet', generatedAt: '2026-05-26 10:00:00' },
            { name: '融资状态确认函_SD202605260002.pdf', size: '0.2 MB', type: 'finance_cert', generatedAt: '2026-05-26 10:00:00' }
          ],
          pushTime: '2026-05-26 10:05:00',
          clerkSubmitTime: '2026-05-26 14:00:00',
          insurerOpinion: '审批通过',
          insurerRefNo: 'INS20260526001',
          insurerDecision: 'approved',
          insurerReviewTime: '2026-05-26 16:30:00',
          createTime: '2026-05-26 09:00:00',
          updateTime: '2026-05-26 16:30:00'
        },
        {
          id: 'SD_SEED_3',
          declarationNo: 'SD202605250003',
          buyerName: 'TechBuyer Co., Ltd',
          relatedPolicyNo: 'POL20260426000000',
          shipmentDate: '2026-05-18',
          destinationPort: 'New York',
          shipmentAmount: 95000,
          currency: 'USD',
          declarationType: 'single',
          declarationTypeName: '逐笔申报',
          paymentTerms: 'OA',
          transportType: 'sea',
          billOfLadingNo: 'BL20260518003',
          goodsDescription: '消费电子产品',
          invoiceNo: 'INV202605003',
          invoiceAmount: 95000,
          invoiceDate: '2026-05-16',
          paymentDueDate: '2026-07-18',
          commercialInvoice: [],
          billOfLading: [{ name: '提单_BL20260518003.pdf', size: '0.3 MB' }],
          customsDeclaration: [],
          receiptProof: [],
          deadline: '2026-06-01',
          status: 'declared',
          statusName: '已申报',
          isOverdue: false,
          isDueSoon: true,
          financingStatus: 'unchecked',
          financeMarked: false,
          generatedDocs: [],
          docsDownloaded: false,
          createTime: '2026-05-25 09:00:00',
          updateTime: '2026-05-25 09:00:00'
        }
      ]
      this.clerkList = [
        { id: 'C001', name: '李明', department: '跟单部', role: 'clerk', permissions: ['claim:process', 'doc:review', 'shipment:process'], status: 'active', email: 'liming@cayk.com', phone: '13800138001' },
        { id: 'C002', name: '王芳', department: '跟单部', role: 'clerk', permissions: ['claim:process', 'doc:review', 'shipment:process'], status: 'active', email: 'wangfang@cayk.com', phone: '13800138002' },
        { id: 'C003', name: '张强', department: '风控部', role: 'clerk', permissions: ['claim:audit', 'limit:review'], status: 'active', email: 'zhangqiang@cayk.com', phone: '13800138003' }
      ]
      this.claims = [
        {
          id: 'CL_SEED_1',
          claimNo: 'CL202605260001',
          relatedPolicyNo: 'POL20260315000001',
          insuranceCompany: '中国信保',
          buyerName: 'TechImport GmbH',
          claimType: 'arrears',
          claimTypeName: '拖欠',
          lossDescription: '买方因资金周转问题拖欠货款，逾期60天未支付',
          estimatedLossAmount: 150000,
          lossDate: '2026-05-01',
          lossCurrency: 'USD',
          lossLocation: '德国·汉堡',
          currentStep: 1,
          currentStepName: '报案提交',
          warningLevel: 'warning',
          clerkId: null,
          clerkName: null,
          delegationAgreement: [],
          serviceFeePaid: false,
          serviceFeeVoucher: [],
          deductible: null,
          claimDecision: null,
          calculatedLoss: null,
          claimAmount: null,
          payoutVoucher: [],
          rwaSyncStatus: 'pending',
          evidenceMaterials: [{ name: '贸易合同.pdf', size: '0.5 MB' }],
          relevantDocuments: [{ name: '报案材料.pdf', size: '0.3 MB' }],
          status: 'pending',
          statusName: '待接收报案',
          docStatus: 'pending',
          docReviewComment: '',
          supplementCount: 0,
          preparedDocs: [],
          supplementedDocs: [],
          clerkConfirmed: false,
          lossNotified: false,
          lossNotifiedTime: null,
          insurerNotified: false,
          insurerNotifiedTime: null,
          createTime: '2026-05-26 09:30:00',
          updateTime: '2026-05-26 09:30:00'
        },
        {
          id: 'CL_SEED_2',
          claimNo: 'CL202605250001',
          relatedPolicyNo: 'POL20260315000001',
          insuranceCompany: '中国信保',
          buyerName: 'EuroDistributor GmbH',
          claimType: 'bankruptcy',
          claimTypeName: '破产',
          lossDescription: '买方申请破产保护，应收货款无法回收',
          estimatedLossAmount: 280000,
          lossDate: '2026-05-10',
          lossCurrency: 'USD',
          lossLocation: '德国·法兰克福',
          currentStep: 2,
          currentStepName: '资料准备',
          warningLevel: 'safe',
          clerkId: 'C001',
          clerkName: '李明',
          delegationAgreement: [],
          serviceFeePaid: false,
          serviceFeeVoucher: [],
          deductible: null,
          claimDecision: null,
          calculatedLoss: null,
          claimAmount: null,
          payoutVoucher: [],
          rwaSyncStatus: 'pending',
          evidenceMaterials: [{ name: '贸易合同.pdf' }, { name: '商业发票_INV202604001.pdf' }],
          relevantDocuments: [{ name: '破产公告.pdf' }, { name: '债权申报材料.pdf' }],
          status: 'assigned',
          statusName: '待接单',
          docStatus: 'prepared',
          docReviewComment: '',
          supplementCount: 0,
          preparedDocs: [
            { name: '出险通知书.pdf', category: 'appNotice' },
            { name: '索赔申请书.pdf', category: 'claimForm' },
            { name: '授权委托书.pdf', category: 'authorization' },
            { name: '贸易合同.pdf', category: 'tradeContract' },
            { name: '商业发票.pdf', category: 'invoice' }
          ],
          supplementedDocs: [],
          clerkConfirmed: false,
          lossNotified: false,
          lossNotifiedTime: null,
          insurerNotified: false,
          insurerNotifiedTime: null,
          createTime: '2026-05-25 14:00:00',
          updateTime: '2026-05-26 10:00:00'
        },
        {
          id: 'CL_SEED_3',
          claimNo: 'CL202605200001',
          relatedPolicyNo: 'POL20260426000000',
          insuranceCompany: '太平洋保险',
          buyerName: 'FranceAchat SAS',
          claimType: 'rejection',
          claimTypeName: '拒收',
          lossDescription: '买方以质量异议为由拒收货物，货物滞留目的港',
          estimatedLossAmount: 95000,
          lossDate: '2026-05-15',
          lossCurrency: 'USD',
          lossLocation: '法国·马赛',
          currentStep: 3,
          currentStepName: '调查定损',
          warningLevel: 'danger',
          clerkId: 'C002',
          clerkName: '王芳',
          delegationAgreement: [
            { name: '理赔委托合同_CL202605200001.pdf', signed: true, signedAt: '2026-05-22' }
          ],
          serviceFeePaid: true,
          serviceFeeVoucher: [
            { name: '服务费支付凭证_CL202605200001.pdf', paidAt: '2026-05-23', amount: 475 }
          ],
          deductible: 3000,
          claimDecision: null,
          calculatedLoss: null,
          claimAmount: null,
          payoutVoucher: [],
          rwaSyncStatus: 'pending',
          evidenceMaterials: [{ name: '贸易合同.pdf' }, { name: '拒收通知函.pdf' }, { name: '质检报告.pdf' }],
          relevantDocuments: [{ name: '报案材料.pdf' }, { name: '往来函件记录.pdf' }],
          status: 'investigating',
          statusName: '调查中',
          docStatus: 'passed',
          docReviewComment: '资料齐全，审核通过',
          supplementCount: 1,
          preparedDocs: [
            { name: '出险通知书.pdf', category: 'appNotice' },
            { name: '索赔申请书.pdf', category: 'claimForm' },
            { name: '授权委托书.pdf', category: 'authorization' },
            { name: '贸易合同.pdf', category: 'tradeContract' },
            { name: '商业发票.pdf', category: 'invoice' },
            { name: '提单.pdf', category: 'billOfLading' },
            { name: '损失证明.pdf', category: 'lossProof' }
          ],
          supplementedDocs: [
            { name: '补充质量检测报告.pdf', uploadedAt: '2026-05-24' }
          ],
          clerkConfirmed: true,
          lossNotified: true,
          lossNotifiedTime: '2026-05-22 11:00:00',
          insurerNotified: true,
          insurerNotifiedTime: '2026-05-22 14:00:00',
          createTime: '2026-05-20 09:00:00',
          updateTime: '2026-05-24 16:00:00'
        }
      ]
      this.processTasks = []
      this.contracts = []
      this.payments = []
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
      cur.status = 'clerk_review'
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
        isDueSoon: isDueSoonByDeadline(deadline, payload.status || 'declared'),
        financingStatus: 'unchecked',
        financeMarked: false,
        generatedDocs: []
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
    // ===== Shipment Declaration Business Flow =====
    checkShipmentFinancing(shipmentId) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      // Find related trade order to check financing status
      const trade = this.tradeInfos.find(t =>
        t.buyerName === shipment.buyerName &&
        t.relatedPolicyNo === shipment.relatedPolicyNo
      )
      const isFinanced = trade && (trade.financingStatus === 'financed' || trade.financingStatus === 'financing')
      const financeContractNo = trade?.financeContractNo || ''
      if (isFinanced) {
        shipment.financeMarked = true
        shipment.financeContractNo = financeContractNo
        shipment.financingStatus = 'financed'
      } else {
        shipment.financeMarked = false
        shipment.financingStatus = 'not_financed'
      }
      shipment.status = 'sd_finance_checked'
      shipment.statusName = '融资校验完成'
      shipment.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: { isFinanced, financeContractNo } }
    },
    generateShipmentDocuments(shipmentId) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      const now = new Date()
      const docs = [
        { name: `出运申报单_${shipment.declarationNo}.pdf`, size: '0.3 MB', type: 'declaration_form', generatedAt: formatDateTime(now) },
        { name: `商业发票清单_${shipment.declarationNo}.pdf`, size: '0.5 MB', type: 'invoice_list', generatedAt: formatDateTime(now) },
        { name: `限额使用报告_${shipment.declarationNo}.pdf`, size: '0.2 MB', type: 'limit_report', generatedAt: formatDateTime(now) },
        { name: `出运申报汇总表_${shipment.declarationNo}.xlsx`, size: '0.4 MB', type: 'summary_sheet', generatedAt: formatDateTime(now) }
      ]
      if (shipment.financeMarked) {
        docs.push({ name: `融资状态确认函_${shipment.declarationNo}.pdf`, size: '0.2 MB', type: 'finance_cert', generatedAt: formatDateTime(now) })
      }
      shipment.generatedDocs = docs
      shipment.status = 'sd_docs_generated'
      shipment.statusName = '资料已生成'
      shipment.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: docs }
    },
    pushShipmentToClerk(shipmentId) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      shipment.status = 'sd_clerk_pending'
      shipment.statusName = '待跟单员处理'
      shipment.pushTime = formatDateTime(new Date())
      // Add notification for clerk
      this.notifications.unshift({
        id: 'NT_' + Date.now(),
        type: 'shipment_push',
        title: '新出运申报待处理',
        content: `申报单 ${shipment.declarationNo} 已推送至您的工作台，请下载资料并提交保险公司`,
        targetId: shipment.id,
        role: 'clerk',
        read: false,
        createTime: formatDateTime(new Date())
      })
      shipment.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true }
    },
    clerkOfflineSubmit(shipmentId) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      shipment.status = 'sd_insurer_review'
      shipment.statusName = '保险公司审批中'
      shipment.clerkSubmitTime = formatDateTime(new Date())
      shipment.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true }
    },
    // @deprecated — use processInsurerResult instead; kept for external callers
    receiveInsurerResult(shipmentId, { approved, insurerOpinion, insurerRefNo }) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      shipment.insurerOpinion = insurerOpinion || ''
      shipment.insurerRefNo = insurerRefNo || ''
      shipment.insurerReviewTime = formatDateTime(new Date())
      if (approved) {
        shipment.status = 'sd_insurer_approved'
        shipment.statusName = '保险公司已通过'
        shipment.insurerDecision = 'approved'
      } else {
        shipment.status = 'sd_insurer_rejected'
        shipment.statusName = '保险公司已驳回'
        shipment.insurerDecision = 'rejected'
      }
      shipment.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: { approved, insurerOpinion } }
    },
    // @deprecated — use processInsurerResult instead; kept for external callers
    updateShipmentLimits(shipmentId) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      // Update policy data
      const policy = this.policies.find(p => p.policyNo === shipment.relatedPolicyNo)
      if (policy) {
        policy.usedQuota = (policy.usedQuota || 0) + (Number(shipment.shipmentAmount) || 0)
        policy.remainingQuota = Math.max((policy.coverageAmount || 0) - policy.usedQuota, 0)
      }
      // Update credit limits
      const cl = this.creditLimits.find(c => c.buyerName === shipment.buyerName)
      if (cl) {
        const shipAmount = Number(shipment.shipmentAmount) || 0
        cl.usedLimit = (cl.usedLimit || 0) + shipAmount
        cl.remainingLimit = Math.max((cl.appliedLimit || 0) - cl.usedLimit, 0)
        cl.usageRate = cl.appliedLimit > 0 ? Math.round((cl.usedLimit / cl.appliedLimit) * 100) : 0
        cl.lastShipmentDate = shipment.shipmentDate
      }
      // Check if limit affects this shipment
      const limitOk = cl ? Number(shipment.shipmentAmount) <= cl.remainingLimit : true
      shipment.limitImpactChecked = true
      shipment.limitOkAfterSync = limitOk
      if (!limitOk) {
        // PRD: 限额影响校验失败 → 返回客户重新申报
        shipment.status = 'sd_insurer_approved'
        shipment.statusName = '保险公司已通过'
        shipment.limitWarning = true
        shipment.limitWarningMessage = `限额刷新后不足（可用限额: $${(cl?.remainingLimit || 0).toLocaleString()}，申报金额: $${Number(shipment.shipmentAmount).toLocaleString()}），请调整申报金额或申请增额`
        shipment.updateTime = formatDateTime(new Date())
        saveStateToStorage(this.$state)
        this.notifications.unshift({
          id: 'NT_' + Date.now(),
          type: 'limit_warning',
          title: '限额不足，需重新申报',
          content: `申报单 ${shipment.declarationNo} 限额数据刷新后不足以覆盖本次出运金额，请重新调整申报金额或申请信用限额增额`,
          targetId: shipment.id,
          role: 'customer',
          read: false,
          createTime: formatDateTime(new Date())
        })
        return { ok: true, data: { limitOk: false, remainingLimit: cl?.remainingLimit || 0, message: shipment.limitWarningMessage } }
      }
      shipment.status = 'pending_premium'
      shipment.statusName = '待支付保费'
      shipment.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      this.notifications.unshift({
        id: 'NT_' + Date.now(),
        type: 'limit_updated',
        title: '限额更新完成，待客户缴费',
        content: `申报单 ${shipment.declarationNo} 限额数据已刷新，不影响本次出运。请引导客户线下缴纳保费`,
        targetId: shipment.id,
        role: 'customer',
        read: false,
        createTime: formatDateTime(new Date())
      })
      return { ok: true, data: { limitOk: true, remainingLimit: cl?.remainingLimit || 0 } }
    },
    markAsPaid(shipmentId) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      if (shipment.status !== 'pending_premium') return { ok: false, message: '当前状态不允许标记已缴费' }
      shipment.status = 'premium_paid'
      shipment.statusName = '已缴费'
      shipment.paidTime = formatDateTime(new Date())
      shipment.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true }
    },
    uploadPremiumVoucher(shipmentId, { paymentVouchers, paymentDate, paymentAmount, paymentRefNo }) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      if (shipment.status !== 'premium_paid' && shipment.status !== 'pending_premium') {
        return { ok: false, message: '当前状态不允许上传缴费凭证' }
      }
      shipment.paymentVouchers = paymentVouchers || []
      shipment.paymentDate = paymentDate || ''
      shipment.paymentAmount = Number(paymentAmount) || 0
      shipment.paymentRefNo = paymentRefNo || ''
      shipment.status = 'premium_uploaded'
      shipment.statusName = '凭证已上传'
      shipment.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true }
    },
    verifyPremiumVoucher(shipmentId, { verified, verifyNote }) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      shipment.verifyNote = verifyNote || ''
      if (verified) {
        shipment.status = 'premium_verified'
        shipment.statusName = '凭证已核验'
        shipment.verifyTime = formatDateTime(new Date())
      } else {
        shipment.status = 'premium_paid'
        shipment.statusName = '已缴费'
        shipment.verifyFailReason = verifyNote || '核验不通过'
      }
      shipment.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: { verified } }
    },
    customerConfirmPayment(shipmentId) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      if (shipment.status !== 'premium_verified') return { ok: false, message: '当前状态不允许确认缴费' }
      shipment.status = 'customer_confirmed'
      shipment.statusName = '客户已确认'
      shipment.customerConfirmed = true
      shipment.customerConfirmTime = formatDateTime(new Date())
      shipment.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true }
    },
    syncMultiEndStatus(shipmentId) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      shipment.status = 'completed'
      shipment.statusName = '已完成'
      shipment.completedTime = formatDateTime(new Date())
      // Update policy premium status
      const policy = this.policies.find(p => p.policyNo === shipment.relatedPolicyNo)
      if (policy) {
        policy.premiumStatus = 'paid'
        policy.premiumConfirmedAt = formatDateTime(new Date())
      }
      // Notify both ends
      this.notifications.unshift({
        id: 'NT_' + Date.now(),
        type: 'shipment_complete',
        title: '出运申报已完成',
        content: `申报单 ${shipment.declarationNo} 已完成全部流程，保费已缴纳`,
        targetId: shipment.id,
        role: 'all',
        read: false,
        createTime: formatDateTime(new Date())
      })
      shipment.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true }
    },
    clerkCompleteShipment(shipmentId) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      if (shipment.status !== 'customer_confirmed') return { ok: false, message: '请先等待客户确认缴费' }
      shipment.status = 'completed'
      shipment.statusName = '已完成'
      shipment.completedTime = formatDateTime(new Date())
      const policy = this.policies.find(p => p.policyNo === shipment.relatedPolicyNo)
      if (policy) {
        policy.premiumStatus = 'paid'
        policy.premiumConfirmedAt = formatDateTime(new Date())
      }
      this.notifications.unshift({
        id: 'NT_' + Date.now(),
        type: 'shipment_complete',
        title: '出运申报已完成',
        content: '申报单 ' + shipment.declarationNo + ' 已完成全部流程，保费已缴纳',
        targetId: shipment.id,
        role: 'all',
        read: false,
        createTime: formatDateTime(new Date())
      })
      shipment.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true }
    },
    archiveShipment(shipmentId) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      if (shipment.status !== 'completed') return { ok: false, message: '仅已完成状态可归档' }
      shipment.status = 'archived'
      shipment.statusName = '已归档'
      shipment.archiveTime = formatDateTime(new Date())
      shipment.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true }
    },
    resubmitShipment(shipmentId) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      if (shipment.status !== 'sd_insurer_rejected' && !shipment.limitWarning) {
        return { ok: false, message: '当前状态不允许重新申报' }
      }
      const now = new Date()
      shipment.status = 'declared'
      shipment.statusName = '已申报'
      shipment.insurerDecision = ''
      shipment.insurerOpinion = ''
      shipment.insurerRefNo = ''
      shipment.insurerReviewTime = ''
      shipment.limitWarning = false
      shipment.limitWarningMessage = ''
      shipment.limitImpactChecked = false
      shipment.limitOkAfterSync = false
      shipment.docsDownloaded = false
      shipment.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: shipment }
    },
    autoProcessShipment(shipmentId) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      if (shipment.status !== 'declared') return { ok: false, message: '当前状态不允许自动处理' }
      const now = new Date()
      // Step 1: Finance check
      const trade = this.tradeInfos.find(t =>
        t.buyerName === shipment.buyerName &&
        t.relatedPolicyNo === shipment.relatedPolicyNo
      )
      const isFinanced = trade && (trade.financingStatus === 'financed' || trade.financingStatus === 'financing')
      const financeContractNo = trade?.financeContractNo || ''
      let financeMarked = false
      if (isFinanced) {
        financeMarked = true
        shipment.financeMarked = true
        shipment.financeContractNo = financeContractNo
        shipment.financingStatus = 'financed'
      } else {
        shipment.financeMarked = false
        shipment.financingStatus = 'not_financed'
      }
      shipment.status = 'sd_finance_checked'
      shipment.statusName = '融资校验完成'
      shipment.updateTime = formatDateTime(now)
      // Step 2: Generate documents
      const docs = [
        { name: '出运申报单_' + shipment.declarationNo + '.pdf', size: '0.3 MB', type: 'declaration_form', generatedAt: formatDateTime(now) },
        { name: '商业发票清单_' + shipment.declarationNo + '.pdf', size: '0.5 MB', type: 'invoice_list', generatedAt: formatDateTime(now) },
        { name: '限额使用报告_' + shipment.declarationNo + '.pdf', size: '0.2 MB', type: 'limit_report', generatedAt: formatDateTime(now) },
        { name: '出运申报汇总表_' + shipment.declarationNo + '.xlsx', size: '0.4 MB', type: 'summary_sheet', generatedAt: formatDateTime(now) }
      ]
      if (financeMarked) {
        docs.push({ name: '融资状态确认函_' + shipment.declarationNo + '.pdf', size: '0.2 MB', type: 'finance_cert', generatedAt: formatDateTime(now) })
      }
      shipment.generatedDocs = docs
      shipment.status = 'sd_docs_generated'
      shipment.statusName = '资料已生成'
      shipment.updateTime = formatDateTime(now)
      // Step 3: Push to clerk
      shipment.status = 'sd_clerk_pending'
      shipment.statusName = '待跟单员处理'
      shipment.pushTime = formatDateTime(now)
      this.notifications.unshift({
        id: 'NT_' + Date.now(),
        type: 'shipment_push',
        title: '新出运申报待处理',
        content: '申报单 ' + shipment.declarationNo + ' 已推送至您的工作台，请下载资料并提交保险公司',
        targetId: shipment.id,
        role: 'clerk',
        read: false,
        createTime: formatDateTime(now)
      })
      shipment.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: { isFinanced, financeContractNo, docs, finalStatus: 'sd_clerk_pending' } }
    },
    clerkDownloadDocs(shipmentId) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      if (shipment.status !== 'sd_clerk_pending') return { ok: false, message: '当前状态不允许下载资料' }
      shipment.docsDownloaded = true
      shipment.docsDownloadTime = formatDateTime(new Date())
      shipment.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true }
    },
    processInsurerResult(shipmentId, { approved, insurerOpinion, insurerRefNo }) {
      const idx = this.shipments.findIndex(s => s.id === shipmentId)
      if (idx < 0) return { ok: false, message: '申报不存在' }
      const shipment = this.shipments[idx]
      if (shipment.status !== 'sd_insurer_review') return { ok: false, message: '当前状态不允许回传审批结果' }
      const now = new Date()
      // Record insurer result
      shipment.insurerOpinion = insurerOpinion || ''
      shipment.insurerRefNo = insurerRefNo || ''
      shipment.insurerReviewTime = formatDateTime(now)
      // Rejected — no limit updates
      if (!approved) {
        shipment.status = 'sd_insurer_rejected'
        shipment.statusName = '保险公司已驳回'
        shipment.insurerDecision = 'rejected'
        shipment.updateTime = formatDateTime(now)
        saveStateToStorage(this.$state)
        return { ok: true, data: { approved: false } }
      }
      // Approved — intermediate status
      shipment.status = 'sd_insurer_approved'
      shipment.statusName = '保险公司已通过'
      shipment.insurerDecision = 'approved'
      shipment.updateTime = formatDateTime(now)
      // Update policy data
      const policy = this.policies.find(p => p.policyNo === shipment.relatedPolicyNo)
      if (policy) {
        policy.usedQuota = (policy.usedQuota || 0) + (Number(shipment.shipmentAmount) || 0)
        policy.remainingQuota = Math.max((policy.coverageAmount || 0) - policy.usedQuota, 0)
      }
      // Refresh limit data
      const cl = this.creditLimits.find(c => c.buyerName === shipment.buyerName)
      if (cl) {
        const shipAmount = Number(shipment.shipmentAmount) || 0
        cl.usedLimit = (cl.usedLimit || 0) + shipAmount
        cl.remainingLimit = Math.max((cl.appliedLimit || 0) - cl.usedLimit, 0)
        cl.usageRate = cl.appliedLimit > 0 ? Math.round((cl.usedLimit / cl.appliedLimit) * 100) : 0
        cl.lastShipmentDate = shipment.shipmentDate
      }
      // Validate limit impact
      const limitOk = cl ? Number(shipment.shipmentAmount) <= cl.remainingLimit : true
      shipment.limitImpactChecked = true
      shipment.limitOkAfterSync = limitOk
      if (!limitOk) {
        shipment.limitWarning = true
        shipment.limitWarningMessage = '限额刷新后不足（可用限额: $' + (cl?.remainingLimit || 0).toLocaleString() + '，申报金额: $' + Number(shipment.shipmentAmount).toLocaleString() + '），请调整申报金额或申请增额'
        this.notifications.unshift({
          id: 'NT_' + Date.now(),
          type: 'limit_warning',
          title: '限额不足，需重新申报',
          content: '申报单 ' + shipment.declarationNo + ' 限额数据刷新后不足以覆盖本次出运金额，请重新调整申报金额或申请信用限额增额',
          targetId: shipment.id,
          role: 'customer',
          read: false,
          createTime: formatDateTime(now)
        })
        shipment.updateTime = formatDateTime(now)
        saveStateToStorage(this.$state)
        return { ok: true, data: { approved: true, limitOk: false, remainingLimit: cl?.remainingLimit || 0, message: shipment.limitWarningMessage } }
      }
      // Limit OK → pending_premium
      shipment.status = 'pending_premium'
      shipment.statusName = '待支付保费'
      this.notifications.unshift({
        id: 'NT_' + Date.now(),
        type: 'limit_updated',
        title: '限额更新完成，待客户缴费',
        content: '申报单 ' + shipment.declarationNo + ' 限额数据已刷新，不影响本次出运。请引导客户线下缴纳保费',
        targetId: shipment.id,
        role: 'customer',
        read: false,
        createTime: formatDateTime(now)
      })
      shipment.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: { approved: true, limitOk: true, remainingLimit: cl?.remainingLimit || 0 } }
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
      const now = new Date()
      cur.status = cur.clerkInitiated ? 'clerk_active' : 'active'
      cur.updateTime = formatDateTime(now)
      // Create corresponding policy entry
      if (!this.policies.find(p => p.externalPolicyId === cur.id)) {
        this.policies.unshift({
          id: cur.clerkInitiated ? 'P_EXT_CLERK_' + cur.id : 'P_EXT_' + cur.id,
          policyNo: cur.policyNo,
          insuranceCompany: cur.insuranceCompany,
          policyholder: cur.policyholder || cur.customerCompany,
          insured: cur.insured || '',
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
      cur.status = 'platform_review'
      cur.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    completePlatformOcr(id, ocrFields) {
      const epIdx = this.externalPolicies.findIndex(p => p.id === id)
      if (epIdx < 0) return { ok: false, message: '记录不存在' }
      const cur = this.externalPolicies[epIdx]
      if (cur.status !== 'platform_review' && cur.status !== 'returned') return { ok: false, message: '当前状态不允许OCR完成' }
      const now = new Date()
      this.externalPolicies[epIdx] = {
        ...cur,
        ...ocrFields,
        ocrStatus: 'completed',
        status: cur.clerkInitiated ? 'clerk_review' : cur.status,
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
    },

    // ===== Policy Change Application Flow =====
    createPolicyChangeApp(policyNo, formData) {
      const policy = this.policies.find(p => p.policyNo === policyNo)
      if (!policy) return { ok: false, message: '保单不存在' }
      const now = new Date()
      const chgTypeLabels = {
        add_buyer: '增加买方', remove_buyer: '减少买方', extend: '展期',
        adjust_limit: '额度调整', change_insured: '被保险人变更',
        change_contact: '联系人变更', change_address: '地址变更', other: '其他变更'
      }
      const record = {
        id: createId('CHG'),
        policyNo,
        policyId: policy.id || '',
        companyName: policy.policyholder || '',
        changeType: formData.changeType || 'other',
        changeTypeName: chgTypeLabels[formData.changeType] || '其他变更',
        changeReason: formData.changeReason || '',
        beforeContent: formData.beforeContent || '',
        afterContent: formData.afterContent || '',
        effectiveDate: formData.effectiveDate || '',
        endorsementNo: '',
        changeApplication: formData.changeApplication || [],
        supportingDocs: formData.supportingDocs || [],
        serviceFeePaid: false,
        serviceFeeAmount: 0,
        serviceFeePayTime: '',
        generatedChangeForm: [],
        generatedChecklist: [],
        insurerDecision: '',
        insurerOpinion: '',
        insurerDecisionTime: '',
        insurerAttachments: [],
        clerkUpdateRecord: '',
        clerkSyncTime: '',
        platformSyncTime: '',
        rejectReason: '',
        supplementRequest: '',
        status: 'chg_draft',
        createTime: formatDateTime(now),
        updateTime: formatDateTime(now),
        submitTime: '',
        platformReviewTime: '',
        clerkReviewTime: '',
        insurerReviewTime: '',
        completedTime: ''
      }
      this.policyChangeApplications.unshift(record)
      saveStateToStorage(this.$state)
      return { ok: true, data: record }
    },

    payPolicyChangeServiceFee(id, paymentInfo) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_draft') return { ok: false, message: '当前状态不允许支付' }
      const now = new Date()
      cur.serviceFeePaid = true
      cur.serviceFeeAmount = paymentInfo?.amount || 0
      cur.serviceFeePayTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    submitChangeToPlatform(id) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_draft') return { ok: false, message: '当前状态不允许提交' }
      // if (!cur.serviceFeePaid) return { ok: false, message: '请先支付服务费' }
      const now = new Date()
      cur.status = 'chg_platform_review'
      cur.submitTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    generateChangeDocuments(id, docType) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_platform_review') return { ok: false, message: '当前状态不允许生成文档' }
      if (docType === 'form') {
        if (cur.generatedChangeForm?.length > 0) return { ok: false, message: '不允许重复生成，请先删除已生成的变更申请表' }
        cur.generatedChangeForm = [{ name: `变更申请表_${cur.policyNo}.pdf`, size: '0.3 MB' }]
      } else if (docType === 'checklist') {
        if (cur.generatedChecklist?.length > 0) return { ok: false, message: '不允许重复生成，请先删除已生成的材料清单' }
        cur.generatedChecklist = [{ name: `变更材料清单_${cur.policyNo}.pdf`, size: '0.2 MB' }]
      } else {
        return { ok: false, message: '未知文档类型' }
      }
      cur.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    deleteChangeDocuments(id, docType) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_platform_review') return { ok: false, message: '当前状态不允许删除文档' }
      if (docType === 'form') {
        cur.generatedChangeForm = []
      } else if (docType === 'checklist') {
        cur.generatedChecklist = []
      } else {
        return { ok: false, message: '未知文档类型' }
      }
      cur.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    pushChangeToClerk(id) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_platform_review') return { ok: false, message: '当前状态不允许推送' }
      const now = new Date()
      cur.status = 'chg_clerk_review'
      cur.platformReviewTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    clerkSubmitToInsurer(id) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_clerk_review') return { ok: false, message: '当前状态不允许提交保险公司' }
      const now = new Date()
      cur.status = 'chg_insurer_review'
      cur.clerkReviewTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    clerkRejectChange(id, reason) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_clerk_review') return { ok: false, message: '当前状态不允许驳回' }
      if (!reason?.trim()) return { ok: false, message: '请填写驳回原因' }
      const now = new Date()
      cur.status = 'chg_platform_review'
      cur.rejectReason = reason
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    insurerApproveChange(id, decisionData) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_insurer_review') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'chg_insurer_approved'
      cur.insurerDecision = 'approved'
      cur.insurerOpinion = decisionData?.opinion || ''
      cur.insurerDecisionTime = formatDateTime(now)
      cur.insurerAttachments = decisionData?.attachments || [
        ...(cur.generatedChangeForm || []),
        ...(cur.generatedChecklist || []),
        { name: `变更决定书_${cur.policyNo}.pdf`, size: '0.4 MB' }
      ]
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    insurerRejectChange(id, reason) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_insurer_review') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'chg_insurer_rejected'
      cur.insurerDecision = 'rejected'
      cur.insurerOpinion = reason || ''
      cur.insurerDecisionTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    clerkUpdateRecord(id, updateData) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_insurer_approved') return { ok: false, message: '当前状态不允许录入变更记录' }
      const now = new Date()
      cur.clerkUpdateRecord = updateData?.record || formatDateTime(now) + ' 变更记录已录入'
      cur.clerkSyncTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    syncChangeToPlatform(id) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_insurer_approved') return { ok: false, message: '当前状态不允许同步' }
      const now = new Date()
      cur.status = 'chg_completed'
      cur.platformSyncTime = formatDateTime(now)
      cur.completedTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      // Update the original policy's endorsement info
      const policy = this.policies.find(p => p.policyNo === cur.policyNo)
      if (policy) {
        policy.changeRecord = { changeType: cur.changeType, changeTypeName: cur.changeTypeName, completedTime: formatDateTime(now) }
      }
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    initiateSupplement(id, request) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_insurer_rejected') return { ok: false, message: '当前状态不允许发起补充' }
      const now = new Date()
      cur.status = 'chg_supplement'
      cur.supplementRequest = request || '请补充相关材料'
      cur.rejectReason = ''
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    platformSupplementMaterial(id, supplementData) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_supplement') return { ok: false, message: '当前状态不允许平台补充' }
      const now = new Date()
      cur.status = 'chg_platform_supplemented'
      if (supplementData?.supplementNote) cur.supplementNote = supplementData.supplementNote
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    submitCustomerSupplement(id, supplementData) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_supplement' && cur.status !== 'chg_platform_supplemented') return { ok: false, message: '当前状态不允许客户补充' }
      const now = new Date()
      cur.status = 'chg_customer_supplement'
      if (supplementData?.files) cur.supportingDocs = [...(cur.supportingDocs || []), ...supplementData.files]
      cur.updateTime = formatDateTime(now)
      // Record supplement log
      if (!cur.supplementHistory) cur.supplementHistory = []
      cur.supplementHistory.push({
        note: supplementData?.note || '客户补充了材料',
        files: supplementData?.files || [],
        time: formatDateTime(now)
      })
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    resubmitPlatform(id) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_customer_supplement') return { ok: false, message: '请等待客户补充完成后提交' }
      const now = new Date()
      cur.status = 'chg_platform_review'
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    platformPushCustomerSupplement(id, request) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_platform_review') return { ok: false, message: '当前状态不允许推送客户补充' }
      if (!cur.rejectReason) return { ok: false, message: '无驳回记录，无需推送客户补充' }
      const now = new Date()
      cur.status = 'chg_supplement'
      cur.supplementRequest = request || '请补充相关材料'
      cur.rejectReason = ''
      cur.platformPushTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    generateEndorsement(id) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_completed') return { ok: false, message: '变更未完成，无法生成批单' }
      if (cur.endorsementNo) return { ok: false, message: '批单已生成' }
      const now = new Date()
      cur.endorsementNo = `PD${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
      cur.endorsementTime = formatDateTime(now)
      cur.endorsementContent = {
        changeTypeName: cur.changeTypeName || '',
        beforeContent: cur.beforeContent || '',
        afterContent: cur.afterContent || '',
        changeReason: cur.changeReason || '',
        effectiveDate: cur.effectiveDate || '',
        policyNo: cur.policyNo || '',
        insurer: cur.insurerName || '保险公司'
      }
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    resubmitClerk(id) {
      const cur = this.policyChangeApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'chg_platform_review') return { ok: false, message: '当前状态不允许提交' }
      const now = new Date()
      cur.status = 'chg_clerk_review'
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    // ===== Renewal Application Flow =====
    submitRenewalApplication(payload) {
      const now = new Date()
      const id = payload?.id || createId('RN')
      const existingPolicy = this.policies.find(p => p.policyNo === payload.policyNo)
      const record = {
        id,
        policyNo: payload.policyNo || '',
        insuranceCompany: existingPolicy?.insuranceCompany || payload.insuranceCompany || '',
        policyholder: existingPolicy?.policyholder || payload.policyholder || '',
        insured: existingPolicy?.insured || payload.insured || '',
        coverageAmount: existingPolicy?.coverageAmount || payload.coverageAmount || 0,
        premium: existingPolicy?.premium || payload.premium || 0,
        originalEffectiveDate: existingPolicy?.effectiveDate || payload.originalEffectiveDate || '',
        originalExpiryDate: existingPolicy?.expiryDate || payload.originalExpiryDate || '',
        newStartDate: payload.newStartDate || '',
        newEndDate: payload.newEndDate || '',
        expectedTurnover: payload.expectedTurnover || 0,
        insuranceRatio: payload.insuranceRatio || 80,
        lastYearDeclaredTotal: payload.lastYearDeclaredTotal || 0,
        lastYearClaimTotal: payload.lastYearClaimTotal || 0,
        lossRatio: payload.lossRatio || 0,
        limitUtilization: payload.limitUtilization || 0,
        renewalRate: payload.renewalRate || 0,
        buyerList: payload.buyerList || '',
        renewalApplication: payload.renewalApplication || [],
        lastYearShipmentSummary: payload.lastYearShipmentSummary || [],
        lastYearReceiptSummary: payload.lastYearReceiptSummary || [],
        // Generated documents
        generatedApplicationForm: [],
        generatedMaterials: [],
        // New policy info
        newPolicyNo: '',
        newPolicyStartDate: '',
        newPolicyEndDate: '',
        newPremium: 0,
        newCoverageAmount: 0,
        // Payment
        serviceFee: 1500,
        premiumAmount: 0,
        totalAmount: 0,
        paymentVoucher: [],
        paymentConfirmTime: '',
        // Status
        status: 'renew_inkasso_review',
        createTime: formatDateTime(now),
        submitTime: formatDateTime(now),
        inkassoReviewTime: '',
        clerkReviewTime: '',
        insurerReviewTime: '',
        insurerDecision: '',
        insurerOpinion: '',
        clerkSyncTime: '',
        inkassoSyncTime: '',
        paymentTime: '',
        activeTime: '',
        updateTime: formatDateTime(now)
      }
      this.renewalApplications.unshift(record)
      // Mark original policy as renewing
      if (existingPolicy) {
        existingPolicy.renewalFlag = 'yes'
      }
      saveStateToStorage(this.$state)
      return { ok: true, data: record }
    },

    generateRenewalDocuments(id) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_inkasso_review') return { ok: false, message: '当前状态不允许生成资料' }
      const now = new Date()
      cur.generatedApplicationForm = [
        { name: `续保申请书_${cur.policyNo}.pdf`, size: '0.3 MB', generatedAt: formatDateTime(now) },
        { name: `续保资料清单_${cur.policyNo}.pdf`, size: '0.2 MB', generatedAt: formatDateTime(now) }
      ]
      cur.generatedMaterials = [
        { name: `上年度出运汇总_${cur.policyNo}.xlsx`, size: '0.5 MB', generatedAt: formatDateTime(now) },
        { name: `收汇情况表_${cur.policyNo}.xlsx`, size: '0.4 MB', generatedAt: formatDateTime(now) },
        { name: `买方清单_${cur.policyNo}.xlsx`, size: '0.3 MB', generatedAt: formatDateTime(now) }
      ]
      cur.inkassoReviewTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    pushRenewalToClerk(id) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_inkasso_review') return { ok: false, message: '当前状态不允许推送' }
      if (!cur.generatedApplicationForm.length) return { ok: false, message: '请先生成续保资料' }
      const now = new Date()
      cur.status = 'renew_clerk_review'
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    clerkApproveRenewal(id) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_clerk_review') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'renew_insurer_review'
      cur.clerkReviewTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    clerkRejectRenewal(id, reason) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_clerk_review') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'renew_inkasso_review'
      cur.rejectReason = reason || '跟单员驳回续保申请'
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    insurerApproveRenewal(id, { opinion, newPolicyNo, newStartDate, newEndDate, premium } = {}) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_insurer_review') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'renew_insurer_approved'
      cur.insurerDecision = 'approved'
      cur.insurerOpinion = opinion || '核保通过'
      cur.insurerReviewTime = formatDateTime(now)
      cur.newPolicyNo = newPolicyNo || `POL${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`
      cur.newPolicyStartDate = newStartDate || cur.newStartDate
      cur.newPolicyEndDate = newEndDate || cur.newEndDate
      cur.newPremium = premium || cur.premium || 0
      cur.newCoverageAmount = cur.coverageAmount || 0
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    insurerRejectRenewal(id, reason) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_insurer_review') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'renew_insurer_rejected'
      cur.insurerDecision = 'rejected'
      cur.insurerOpinion = reason || '核保未通过'
      cur.insurerReviewTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    clerkSyncNewPolicy(id) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_insurer_approved') return { ok: false, message: '当前状态不允许同步' }
      const now = new Date()
      cur.status = 'renew_active'
      cur.clerkSyncTime = formatDateTime(now)
      cur.inkassoSyncTime = formatDateTime(now)
      cur.totalAmount = (cur.serviceFee || 0) + (cur.newPremium || 0)
      cur.activeTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      // Create new policy record with active status
      const newPolicy = {
        id: createId('P'),
        policyNo: cur.newPolicyNo,
        insuranceCompany: cur.insuranceCompany,
        policyholder: cur.policyholder,
        insured: cur.insured,
        coverageAmount: cur.newCoverageAmount,
        premium: cur.newPremium,
        effectiveDate: cur.newPolicyStartDate,
        expiryDate: cur.newPolicyEndDate,
        status: 'active',
        paymentStatus: 'unpaid',
        usedQuota: 0,
        remainingQuota: cur.newCoverageAmount || 0,
        currency: 'USD',
        businessType: 'goods',
        renewalFlag: 'yes',
        sourceRenewalId: cur.id,
        createTime: formatDateTime(now),
        updateTime: formatDateTime(now)
      }
      this.policies.unshift(newPolicy)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    // ===== Supplement flow (after insurer reject) =====
    clerkInitiateRenewalSupplement(id) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_insurer_rejected') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'renew_supplement'
      cur.supplementRequest = cur.insurerOpinion || '请补充资料'
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    platformPushRenewalSupplement(id) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_supplement') return { ok: false, message: '当前状态不允许操作' }
      cur.status = 'renew_customer_supplement'
      cur.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    customerSubmitRenewalSupplement(id, data) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_customer_supplement') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'renew_customer_supplemented'
      cur.supplementData = data
      cur.supplementFiles = data?.files || []
      cur.supplementTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    customerPushRenewalToPlatform(id) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_customer_supplemented') return { ok: false, message: '当前状态不允许操作' }
      cur.status = 'renew_platform_review'
      cur.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    platformApproveRenewalSupplement(id) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_platform_review') return { ok: false, message: '当前状态不允许操作' }
      cur.status = 'renew_clerk_resubmit'
      cur.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    clerkResubmitRenewalToInsurer(id) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_clerk_resubmit') return { ok: false, message: '当前状态不允许操作' }
      cur.status = 'renew_insurer_review'
      cur.updateTime = formatDateTime(new Date())
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    // ===== Payment flow (after clerk syncs new policy) =====
    inkassoNotifyRenewalPayment(id) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_active') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'renew_pending_payment'
      cur.paymentApplication = {
        applicationNo: createId('PAY'),
        createTime: formatDateTime(now),
        policyNo: cur.newPolicyNo || cur.policyNo,
        premium: cur.newPremium || cur.premium || 0,
        serviceFee: cur.serviceFee || 1500
      }
      cur.paymentStatus = 'pending'
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    uploadRenewalVoucher(id, files) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_pending_payment') return { ok: false, message: '当前状态不允许上传' }
      const now = new Date()
      cur.status = 'renew_payment_uploaded'
      cur.paymentVoucher = files || []
      cur.paymentStatus = 'paid'
      cur.paymentConfirmTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    inkassoVerifyRenewalVoucher(id) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_payment_uploaded') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'renew_payment_verified'
      cur.paymentStatus = 'paid'
      cur.paymentVerifyTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    clerkSyncRenewalPayment(id) {
      const cur = this.renewalApplications.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'renew_payment_verified') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'renew_paid'
      cur.paymentStatus = 'paid'
      cur.paymentSyncTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      const policy = this.policies.find(p => p.sourceRenewalId === cur.id)
      if (policy) {
        policy.paymentStatus = 'paid'
        policy.paymentVoucher = cur.paymentVoucher || []
        policy.paymentTime = cur.paymentConfirmTime || formatDateTime(now)
      }
      saveStateToStorage(this.$state)
      return { ok: true, data: cur }
    },

    // ===== Surrender Application Lifecycle =====
    createSurrenderApp(policyNo, formData) {
      const policy = this.policies.find(p => p.policyNo === policyNo)
      if (!policy) return { ok: false, message: '保单不存在' }
      // Check active claims
      const activeClaims = this.claims.filter(c => c.relatedPolicyNo === policyNo && c.status !== 'completed')
      if (activeClaims.length > 0) {
        return { ok: false, message: `该保单存在 ${activeClaims.length} 笔未结案理赔记录，请先处理完成后再申请退保` }
      }
      const now = new Date()
      const id = createId('SR')
      const app = {
        id,
        policyNo,
        companyName: formData.companyName || policy.policyholder,
        insured: formData.insured || policy.insured,
        insuranceCompany: formData.insuranceCompany || policy.insuranceCompany,
        coverageAmount: formData.coverageAmount || policy.coverageAmount,
        premium: formData.premium || policy.premium,
        effectiveDate: policy.effectiveDate,
        expiryDate: policy.expiryDate,
        currency: policy.currency || 'USD',
        surrenderReason: formData.surrenderReason || '',
        applicationDate: formData.applicationDate || formatDate(now),
        surrenderEffectiveDate: formData.effectiveDate || '',
        surrenderApplication: formData.surrenderApplication || [],
        originalPolicy: formData.originalPolicy || [],
        legalPersonId: formData.legalPersonId || [],
        paymentReceipt: formData.paymentReceipt || [],
        otherDocuments: formData.otherDocuments || [],
        generatedSurrenderForm: [],
        generatedSurrenderChecklist: [],
        activeMonths: formData.activeMonths || 0,
        shortTermRate: 0,
        refundAmount: 0,
        netRefundAmount: 0,
        insurerPaymentTime: '',
        insurerPaymentRef: '',
        clerkSyncRecord: '',
        clerkSyncTime: '',
        rejectReason: '',
        supplementHistory: [],
        trackingStatus: '',
        trackingStartTime: '',
        status: 'sr_draft',
        createTime: formatDateTime(now),
        updateTime: formatDateTime(now),
        submitTime: '',
        platformReviewTime: '',
        clerkReviewTime: '',
        insurerReviewTime: '',
        completedTime: '',
        terminatedTime: ''
      }
      this.surrenderApplications.unshift(app)
      this.touchSurrenderApplications()
      return { ok: true, data: app, message: '退保申请已创建' }
    },

    submitSurrenderToPlatform(id) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_draft') return { ok: false, message: '当前状态不允许提交' }
      const now = new Date()
      cur.status = 'sr_platform_review'
      cur.submitTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'),
        type: 'surrender_notify',
        toRole: 'inkasso',
        title: '退保申请通知',
        content: `客户 ${cur.companyName} 已提交退保申请（编号：${id}），请尽快处理`,
        time: formatDateTime(now),
        read: false
      })
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '退保申请已提交至平台审核' }
    },

    generateSurrenderDocs(id, docType) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_platform_review') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      const file = { name: docType === 'form' ? `退保申请表_${cur.policyNo}.pdf` : `退保材料清单_${cur.policyNo}.pdf`, size: '0.3 MB', generatedAt: formatDateTime(now) }
      if (docType === 'form') cur.generatedSurrenderForm.push(file)
      else cur.generatedSurrenderChecklist.push(file)
      cur.updateTime = formatDateTime(now)
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: docType === 'form' ? '退保申请表已生成' : '退保材料清单已生成' }
    },

    deleteSurrenderDocs(id, docType) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_platform_review') return { ok: false, message: '当前状态不允许操作' }
      if (docType === 'form') cur.generatedSurrenderForm = []
      else cur.generatedSurrenderChecklist = []
      cur.updateTime = formatDateTime(new Date())
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '已删除' }
    },

    pushSurrenderToClerk(id) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_platform_review') return { ok: false, message: '当前状态不允许操作' }
      if (!cur.generatedSurrenderForm.length) return { ok: false, message: '请先生成退保申请表' }
      const now = new Date()
      cur.status = 'sr_clerk_review'
      cur.platformReviewTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'),
        type: 'surrender_notify',
        toRole: 'clerk',
        title: '退保审核通知',
        content: `平台已推送退保申请（编号：${id}），请审核退保资料`,
        time: formatDateTime(now),
        read: false
      })
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '已推送给跟单员审核' }
    },

    clerkApproveSurrender(id) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_clerk_review') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'sr_insurer_review'
      cur.clerkReviewTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'),
        type: 'surrender_notify',
        toRole: 'clerk',
        title: '退保审核通知',
        content: `跟单员已审核通过退保申请（编号：${id}），请推送保险公司审核`,
        time: formatDateTime(now),
        read: false
      })
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '跟单员审核通过，已推送至保险公司审核' }
    },

    clerkRejectSurrender(id, reason) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_clerk_review') return { ok: false, message: '当前状态不允许操作' }
      if (!reason) return { ok: false, message: '请填写驳回原因' }
      const now = new Date()
      cur.status = 'sr_platform_review'
      cur.rejectReason = reason
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'),
        type: 'surrender_notify',
        toRole: 'inkasso',
        title: '退保驳回通知',
        content: `跟单员驳回了退保申请（编号：${id}），原因：${reason}`,
        time: formatDateTime(now),
        read: false
      })
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '已驳回退保申请，退回平台' }
    },

    insurerApproveSurrender(id, data) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_insurer_review') return { ok: false, message: '当前状态不允许操作' }
      if (!data.refundAmount && data.refundAmount !== 0) return { ok: false, message: '请填写退保金额' }
      const now = new Date()
      cur.status = 'sr_insurer_approved'
      cur.shortTermRate = data.shortTermRate || 0
      cur.refundAmount = data.refundAmount
      cur.netRefundAmount = data.netRefundAmount || data.refundAmount
      cur.surrenderEffectiveDate = data.surrenderEffectiveDate || cur.surrenderEffectiveDate
      cur.insurerReviewTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'),
        type: 'surrender_notify',
        toRole: 'clerk',
        title: '退保批准通知',
        content: `保险公司已批准退保申请（编号：${id}），退保金额：$${Number(data.refundAmount).toLocaleString()}`,
        time: formatDateTime(now),
        read: false
      })
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '保险公司已批准退保' }
    },

    insurerRejectSurrender(id, reason) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_insurer_review') return { ok: false, message: '当前状态不允许操作' }
      if (!reason) return { ok: false, message: '请填写驳回原因' }
      const now = new Date()
      cur.status = 'sr_insurer_rejected'
      cur.rejectReason = reason
      cur.insurerReviewTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '保险公司已驳回退保申请' }
    },

    insurerInitiatePayment(id, data) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_insurer_approved') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'sr_payment_initiated'
      cur.insurerPaymentTime = formatDateTime(now)
      cur.insurerPaymentRef = data.paymentRef || ''
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'),
        type: 'surrender_notify',
        toRole: 'clerk',
        title: '退保支付通知',
        content: `保险公司已发起退保支付（编号：${id}），支付参考号：${cur.insurerPaymentRef}，请同步平台`,
        time: formatDateTime(now),
        read: false
      })
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '退保支付已发起' }
    },

    clerkSyncSurrenderToPlatform(id, data) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_payment_initiated') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'sr_platform_synced'
      cur.clerkSyncRecord = data.syncRecord || '退保金额已同步'
      cur.clerkSyncTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '退保金额信息已同步至平台' }
    },

    customerConfirmRefund(id) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_platform_synced') return { ok: false, message: '当前状态不允许确认' }
      const now = new Date()
      cur.status = 'sr_terminated'
      cur.completedTime = formatDateTime(now)
      cur.terminatedTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      // Update policy status to terminated
      const policy = this.policies.find(p => p.policyNo === cur.policyNo)
      if (policy) {
        policy.status = 'terminated'
        policy.statusName = '保单已终止'
        policy.surrenderRecord = {
          surrenderId: cur.id,
          refundAmount: cur.netRefundAmount,
          terminatedTime: formatDateTime(now)
        }
      }
      // Update related contract
      const contract = this.contracts.find(c => c.policyNo === cur.policyNo)
      if (contract) {
        contract.status = 'cancelled'
        contract.updatedAt = formatDateTime(now)
      }
      // Notify inkasso and clerk for termination sync
      this.notifications.unshift({
        id: createId('NOTIF'),
        type: 'surrender_complete',
        toRole: 'inkasso',
        title: '退保完成通知',
        content: `客户已确认退费，保单 ${cur.policyNo} 已终止，请同步更新`,
        time: formatDateTime(now),
        read: false
      })
      this.notifications.unshift({
        id: createId('NOTIF'),
        type: 'surrender_complete',
        toRole: 'clerk',
        title: '退保跟踪通知',
        content: `保单 ${cur.policyNo} 已终止退保，请开始月度/季度跟踪排查`,
        time: formatDateTime(now),
        read: false
      })
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '退费已确认，保单已终止' }
    },

    // Rejection Flow A — supplement resubmission
    clerkInitiateSupplement(id, request) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_insurer_rejected') return { ok: false, message: '当前状态不允许操作' }
      if (!request) return { ok: false, message: '请填写补充资料要求' }
      const now = new Date()
      cur.status = 'sr_supplement'
      cur.supplementHistory.push({ type: 'request', content: request, time: formatDateTime(now) })
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'),
        type: 'surrender_notify',
        toRole: 'inkasso',
        title: '退保补充资料通知',
        content: `跟单员要求补充退保资料（编号：${id}），请通知客户补充`,
        time: formatDateTime(now),
        read: false
      })
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '已发起补充资料请求' }
    },

    platformNotifyCustomerSupplement(id) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      const validStatuses = ['sr_supplement', 'sr_platform_review']
      if (!validStatuses.includes(cur.status)) return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'sr_customer_supplement'
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'),
        type: 'surrender_notify',
        toRole: 'customer',
        title: '退保补充资料通知',
        content: `您的退保申请（编号：${id}）需要补充资料，请尽快提交`,
        time: formatDateTime(now),
        read: false
      })
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '已通知客户补充资料' }
    },

    customerSubmitSupplement(id, data) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_customer_supplement') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.supplementHistory.push({
        type: 'submission',
        content: data.supplementNote || '',
        files: data.supportingDocs || [],
        time: formatDateTime(now)
      })
      cur.updateTime = formatDateTime(now)
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '补充资料已提交' }
    },

    customerPushToPlatform(id) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_customer_supplement') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'sr_platform_review'
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'),
        type: 'surrender_notify',
        toRole: 'inkasso',
        title: '退保补充资料已提交',
        content: `客户已提交补充资料（编号：${id}），请审核`,
        time: formatDateTime(now),
        read: false
      })
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '补充资料已推送至平台审核' }
    },

    clerkResubmitToInsurer(id) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_platform_review') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'sr_insurer_review'
      cur.updateTime = formatDateTime(now)
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '已重新提交至保险公司审核' }
    },

    // Rejection Flow B — business termination
    clerkRejectTerminate(id, reason) {
      const cur = this.surrenderApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '退保申请不存在' }
      if (cur.status !== 'sr_insurer_rejected') return { ok: false, message: '当前状态不允许操作' }
      if (!reason) return { ok: false, message: '请填写终止原因' }
      const now = new Date()
      cur.status = 'sr_business_terminated'
      cur.rejectReason = reason
      cur.terminatedTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'),
        type: 'surrender_notify',
        toRole: 'customer',
        title: '退保终止通知',
        content: `您的退保申请（编号：${id}）已被终止，原因：${reason}`,
        time: formatDateTime(now),
        read: false
      })
      this.touchSurrenderApplications()
      return { ok: true, data: cur, message: '退保申请已终止' }
    },
    // ===== Credit Limit Application Lifecycle =====
    createAndSubmitClApplication(policyNo, formData) {
      const result = this.createClApplication(policyNo, formData)
      if (!result.ok) return result
      const submitResult = this.submitClToPlatform(result.data.id)
      if (!submitResult.ok) return submitResult
      return { ok: true, data: result.data, message: '限额申请已创建并提交至平台审核' }
    },
    createClApplication(policyNo, formData) {
      const policy = this.policies.find(p => p.policyNo === policyNo)
      if (!policy) return { ok: false, message: '保单不存在' }
      if (!formData.buyerName) return { ok: false, message: '请填写买方名称' }
      if (!formData.appliedLimit) return { ok: false, message: '请填写申请额度' }
      const now = new Date()
      const id = createId('CLA')
      // Simulate credit query API call
      const ratingLevels = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC']
      const rating = ratingLevels[Math.floor(Math.random() * ratingLevels.length)]
      const creditLimit = Math.round(Number(formData.appliedLimit) * (0.5 + Math.random() * 0.8))
      const existingLimits = this.creditLimits.filter(c => c.buyerName === formData.buyerName)
      const existingTotal = existingLimits.reduce((s, c) => s + Number(c.appliedLimit || 0), 0)
      const applied = Number(formData.appliedLimit) || 0
      const totalPolicyLimit = Number(policy.coverageAmount) || 0
      let overLimitWarning = false
      let overLimitMessage = ''
      if (existingTotal + applied > totalPolicyLimit) {
        overLimitWarning = true
        overLimitMessage = `申请额度 $${applied.toLocaleString()} 与现有已用额度 $${existingTotal.toLocaleString()} 之和超出保单总限额 $${totalPolicyLimit.toLocaleString()}，贸易出运申报异常，请确认风险`
      }
      const app = {
        id, policyNo, policyId: policy.id || '',
        buyerName: formData.buyerName,
        policyTotalLimit: totalPolicyLimit,
        existingCreditTotal: existingTotal,
        appliedLimit: applied,
        currency: formData.currency || 'USD',
        applicationDate: formatDate(now),
        applicationReason: formData.applicationReason || '',
        creditQueryResult: {
          buyerCreditRating: rating,
          buyerCreditLimit: creditLimit,
          historicalDefaultRate: Math.round(Math.random() * 50) / 10,
          queryTime: formatDateTime(now)
        },
        overLimitWarning, overLimitMessage,
        generatedApplicationForm: [],
        generatedCreditReport: [],
        generatedChecklist: [],
        insurerDecision: '',
        insurerOpinion: '',
        rejectType: '',
        rejectReason: '',
        approvedLimit: 0, approvedRate: 0,
        effectiveDate: '', expiryDate: '',
        specialConditions: '',
        insurerReviewTime: '',
        recordedQuota: 0, recordedTime: '',
        syncRecord: '', syncTime: '',
        platformUpdateTime: '',
        rejectNotifiedClerk: false,
        rejectNotifiedPlatform: false,
        rejectNotifiedCustomer: false,
        status: 'cl_draft',
        createTime: formatDateTime(now),
        updateTime: formatDateTime(now),
        submitTime: '', platformReviewTime: '',
        clerkReviewTime: '', insurerReviewTime: '',
        completedTime: ''
      }
      this.clApplications.unshift(app)
      this.touchClApplications()
      if (overLimitWarning) {
        this.notifications.unshift({
          id: createId('NOTIF'), type: 'cl_warning', toRole: 'customer',
          title: '限额申请超限预警',
          content: overLimitMessage,
          time: formatDateTime(now), read: false
        })
      }
      return { ok: true, data: app, message: '限额申请已创建', overLimitWarning }
    },
    submitClToPlatform(id) {
      const cur = this.clApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '申请不存在' }
      if (cur.status !== 'cl_draft') return { ok: false, message: '当前状态不允许提交' }
      const now = new Date()
      cur.status = 'cl_platform_review'
      cur.submitTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'), type: 'cl_submit', toRole: 'inkasso',
        title: '限额申请通知',
        content: `客户 ${cur.buyerName} 已提交限额申请（编号：${id}），请尽快处理`,
        time: formatDateTime(now), read: false
      })
      this.touchClApplications()
      return { ok: true, data: cur, message: '限额申请已提交至平台审核' }
    },
    generateClDocuments(id) {
      const cur = this.clApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '申请不存在' }
      if (cur.status !== 'cl_platform_review') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.generatedApplicationForm = [{ name: `限额申请表_${cur.policyNo}.pdf`, size: '0.3 MB' }]
      cur.generatedCreditReport = [{ name: `买方资信报告_${cur.buyerName}.pdf`, size: '1.2 MB' }]
      cur.generatedChecklist = [{ name: `材料清单_${cur.id}.pdf`, size: '0.2 MB' }]
      cur.updateTime = formatDateTime(now)
      this.touchClApplications()
      return { ok: true, data: cur, message: '申请文件已自动生成' }
    },
    pushClToClerk(id) {
      const cur = this.clApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '申请不存在' }
      if (cur.status !== 'cl_platform_review') return { ok: false, message: '当前状态不允许推送' }
      if (!hasFile(cur.generatedApplicationForm)) return { ok: false, message: '请先生成申请文件' }
      const now = new Date()
      cur.status = 'cl_clerk_review'
      cur.platformReviewTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'), type: 'cl_push', toRole: 'clerk',
        title: '限额审核通知',
        content: `平台已推送限额申请（编号：${id}），买方：${cur.buyerName}，请审核`,
        time: formatDateTime(now), read: false
      })
      this.touchClApplications()
      return { ok: true, data: cur, message: '已推送跟单员审核' }
    },
    clerkApproveCl(id) {
      const cur = this.clApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '申请不存在' }
      if (cur.status !== 'cl_clerk_review') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'cl_insurer_review'
      cur.clerkReviewTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'), type: 'cl_clerk_approve', toRole: 'clerk',
        title: '限额审核通过',
        content: `限额申请（编号：${id}）已审核通过，已递交至保险公司核查`,
        time: formatDateTime(now), read: false
      })
      this.touchClApplications()
      return { ok: true, data: cur, message: '审核通过，已递交至保险公司核查' }
    },
    clerkRejectCl(id, reason) {
      const cur = this.clApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '申请不存在' }
      if (cur.status !== 'cl_clerk_review') return { ok: false, message: '当前状态不允许操作' }
      if (!reason) return { ok: false, message: '请填写驳回原因' }
      const now = new Date()
      cur.status = 'cl_platform_review'
      cur.rejectReason = reason
      cur.updateTime = formatDateTime(now)
      this.touchClApplications()
      return { ok: true, data: cur, message: '已驳回，退回至平台' }
    },
    insurerApproveCl(id, data) {
      const cur = this.clApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '申请不存在' }
      if (cur.status !== 'cl_insurer_review') return { ok: false, message: '当前状态不允许操作' }
      if (!data.approvedLimit && data.approvedLimit !== 0) return { ok: false, message: '请填写批准额度' }
      const now = new Date()
      cur.status = 'cl_insurer_approved'
      cur.insurerDecision = 'approved'
      cur.insurerOpinion = data.insurerOpinion || ''
      cur.approvedLimit = Number(data.approvedLimit)
      cur.approvedRate = Number(data.approvedRate) || 0
      cur.effectiveDate = data.effectiveDate || formatDate(now)
      cur.expiryDate = data.expiryDate || addDays(formatDate(now), 365)
      cur.specialConditions = data.specialConditions || ''
      cur.insurerReviewTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'), type: 'cl_insurer_approve', toRole: 'clerk',
        title: '保险公司批准通知',
        content: `保险公司已批准限额申请（编号：${id}），批准额度：$${Number(data.approvedLimit).toLocaleString()}，请录入配额`,
        time: formatDateTime(now), read: false
      })
      this.touchClApplications()
      return { ok: true, data: cur, message: '保险公司已批准限额申请' }
    },
    insurerRejectCl(id, data) {
      const cur = this.clApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '申请不存在' }
      if (cur.status !== 'cl_insurer_review') return { ok: false, message: '当前状态不允许操作' }
      if (!data.rejectReason) return { ok: false, message: '请填写驳回原因' }
      const now = new Date()
      cur.status = 'cl_insurer_rejected'
      cur.insurerDecision = 'rejected'
      cur.insurerOpinion = data.rejectReason
      cur.rejectType = data.rejectType || 'credit_issue'
      cur.rejectReason = data.rejectReason
      cur.insurerReviewTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'), type: 'cl_insurer_reject', toRole: 'clerk',
        title: '保险公司拒绝通知',
        content: `保险公司已驳回限额申请（编号：${id}），原因：${data.rejectReason}`,
        time: formatDateTime(now), read: false
      })
      this.touchClApplications()
      return { ok: true, data: cur, message: '保险公司已驳回限额申请' }
    },
    clerkRecordQuota(id, data) {
      const cur = this.clApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '申请不存在' }
      if (cur.status !== 'cl_insurer_approved') return { ok: false, message: '当前状态不允许操作' }
      if (!data.recordedQuota) return { ok: false, message: '请录入配额' }
      const now = new Date()
      cur.status = 'cl_quota_recording'
      cur.recordedQuota = Number(data.recordedQuota)
      cur.recordedTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      this.touchClApplications()
      return { ok: true, data: cur, message: '配额已录入' }
    },
    clerkSyncToPlatform(id, data) {
      const cur = this.clApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '申请不存在' }
      if (cur.status !== 'cl_quota_recording') return { ok: false, message: '当前状态不允许同步' }
      const now = new Date()
      cur.status = 'cl_platform_synced'
      cur.syncRecord = data?.syncRecord || '配额已核对，同步至平台'
      cur.syncTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'), type: 'cl_sync', toRole: 'inkasso',
        title: '限额同步通知',
        content: `跟单员已同步限额数据（编号：${id}），请确认更新`,
        time: formatDateTime(now), read: false
      })
      this.touchClApplications()
      return { ok: true, data: cur, message: '配额已同步至平台' }
    },
    clerkConfirmReject(id) {
      const cur = this.clApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '申请不存在' }
      if (cur.status !== 'cl_insurer_rejected') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.rejectNotifiedClerk = true
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'), type: 'cl_reject_sync', toRole: 'inkasso',
        title: '限额驳回通知',
        content: `保险公司已驳回限额申请（编号：${id}），原因：${cur.rejectReason}，请处理`,
        time: formatDateTime(now), read: false
      })
      this.touchClApplications()
      return { ok: true, data: cur, message: '已确认驳回结果' }
    },
    platformConfirmUpdate(id) {
      const cur = this.clApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '申请不存在' }
      if (cur.status !== 'cl_platform_synced') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'cl_completed'
      cur.platformUpdateTime = formatDateTime(now)
      cur.completedTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      // Add finalized credit limit
      this.creditLimits.unshift({
        id: createId('CL'), buyerName: cur.buyerName,
        policyNo: cur.policyNo,
        appliedLimit: cur.recordedQuota || cur.approvedLimit || cur.appliedLimit,
        usedLimit: 0, remainingLimit: cur.recordedQuota || cur.approvedLimit || cur.appliedLimit,
        usageRate: 0,
        currency: cur.currency,
        status: 'active',
        effectiveDate: cur.effectiveDate || formatDate(now),
        expiryDate: cur.expiryDate || addDays(formatDate(now), 365),
        lastShipmentDate: null, idleDays: 0
      })
      this.notifications.unshift({
        id: createId('NOTIF'), type: 'cl_complete', toRole: 'customer',
        title: '限额申请完成通知',
        content: `您的限额申请（编号：${id}）已完成，新额度已生效，买方：${cur.buyerName}，额度：$${Number(cur.recordedQuota || cur.approvedLimit || cur.appliedLimit).toLocaleString()}`,
        time: formatDateTime(now), read: false
      })
      this.touchClApplications()
      return { ok: true, data: cur, message: '限额数据已更新' }
    },
    platformPushClReject(id) {
      const cur = this.clApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '申请不存在' }
      if (cur.status !== 'cl_insurer_rejected') return { ok: false, message: '当前状态不允许操作' }
      if (!cur.rejectNotifiedClerk) return { ok: false, message: '请先确认跟单员已获知驳回结果' }
      const now = new Date()
      cur.status = 'cl_customer_confirm'
      cur.rejectNotifiedPlatform = true
      cur.updateTime = formatDateTime(now)
      this.notifications.unshift({
        id: createId('NOTIF'), type: 'cl_reject_complete', toRole: 'customer',
        title: '限额申请驳回通知',
        content: `您的限额申请（编号：${id}）已被保险公司驳回，原因：${cur.rejectReason}，请确认同步`,
        time: formatDateTime(now), read: false
      })
      this.touchClApplications()
      return { ok: true, data: cur, message: '驳回结果已推送客户，待客户确认' }
    },
    customerConfirmClReject(id) {
      const cur = this.clApplications.find(a => a.id === id)
      if (!cur) return { ok: false, message: '申请不存在' }
      if (cur.status !== 'cl_customer_confirm') return { ok: false, message: '当前状态不允许操作' }
      const now = new Date()
      cur.status = 'cl_completed'
      cur.rejectNotifiedCustomer = true
      cur.completedTime = formatDateTime(now)
      cur.updateTime = formatDateTime(now)
      this.touchClApplications()
      return { ok: true, data: cur, message: '已确认同步，流程结束' }
    }
  }
})
