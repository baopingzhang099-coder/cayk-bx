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

export const useBusinessStore = defineStore('business', {
  state: () => ({
    insuranceApplications: [],
    policies: [],
    creditLimits: [],
    shipments: [],
    claims: []
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
      const coverageAmount = state.insuranceApplications.reduce((sum, it) => sum + (Number(it.coverageAmount) || 0), 0)
      const shipmentAmount = state.shipments.reduce((sum, it) => sum + (Number(it.shipmentAmount) || 0), 0)
      const claimAmount = state.claims.reduce((sum, it) => sum + (Number(it.claimAmount) || 0), 0)
      return { insuranceCount, limitCount, shipmentCount, claimCount, coverageAmount, shipmentAmount, claimAmount }
    }
  },
  actions: {
    ensureSeeded() {
      if (this.insuranceApplications.length > 0) return
      this.insuranceApplications = [
        {
          id: 'TB2026001',
          enterpriseName: '深圳XX国际贸易有限公司',
          unifiedSocialCreditCode: '91440300XXXXXXXXXX',
          enterpriseAddress: '深圳市南山区XX路XX号',
          contactName: '张经理',
          contactPhone: '138****8888',
          contactEmail: 'zhang@cayk.com',
          buyerName: 'ABC Corporation',
          buyerCountry: '美国',
          buyerAddress: 'New York, USA',
          buyerContact: 'John Smith',
          buyerPhone: '+1-212-555-0100',
          historicalTransactionAmount: '$1,200,000',
          insuranceScheme: '方案A-全程保障',
          coverageAmount: 500000,
          premium: 12500,
          expectedInsuranceCompany: '人保财险',
          policyDuration: '1年',
          specialRequirements: '',
          businessLicense: [{ name: '营业执照.jpg' }],
          importExportQualification: [{ name: '进出口资质.jpg' }],
          authorizationDocument: [{ name: '授权文件.pdf' }],
          status: 'pending_submit',
          createTime: '2026-05-01',
          updateTime: '2026-05-01 10:30:00'
        },
        {
          id: 'TB2026002',
          enterpriseName: '上海YY进出口公司',
          unifiedSocialCreditCode: '91310000XXXXXXXXXX',
          enterpriseAddress: '上海市浦东新区XX路XX号',
          contactName: '李经理',
          contactPhone: '139****6666',
          contactEmail: 'li@yy-trade.com',
          buyerName: 'DEF GmbH',
          buyerCountry: '德国',
          buyerAddress: 'Hamburg, Germany',
          buyerContact: 'Hans Mueller',
          buyerPhone: '+49-40-555-1234',
          historicalTransactionAmount: '$800,000',
          insuranceScheme: '方案B-基础保障',
          coverageAmount: 300000,
          premium: 7500,
          expectedInsuranceCompany: '中国信保',
          policyDuration: '1年',
          specialRequirements: '',
          businessLicense: [{ name: '营业执照.pdf' }],
          importExportQualification: [{ name: '进出口资质.pdf' }],
          authorizationDocument: [{ name: '授权文件.pdf' }],
          status: 'credit_investigating',
          createTime: '2026-04-28',
          updateTime: '2026-05-05 14:20:00'
        },
        {
          id: 'TB2026003',
          enterpriseName: '北京ZZ贸易集团',
          unifiedSocialCreditCode: '91110000XXXXXXXXXX',
          enterpriseAddress: '北京市朝阳区XX路XX号',
          contactName: '王总监',
          contactPhone: '137****9999',
          contactEmail: 'wang@zz-trade.com',
          buyerName: 'GHI Ltd',
          buyerCountry: '英国',
          buyerAddress: 'London, UK',
          buyerContact: 'Robert Brown',
          buyerPhone: '+44-20-7123-4567',
          historicalTransactionAmount: '$600,000',
          insuranceScheme: '方案A-全程保障',
          coverageAmount: 400000,
          premium: 10000,
          expectedInsuranceCompany: '太保产险',
          policyDuration: '1年',
          specialRequirements: '',
          businessLicense: [{ name: '营业执照.jpg' }],
          importExportQualification: [{ name: '进出口资质.jpg' }],
          authorizationDocument: [{ name: '授权文件.pdf' }],
          status: 'completed',
          createTime: '2026-03-15',
          updateTime: '2026-04-20 11:00:00'
        }
      ]
      this.policies = [
        {
          id: 'P2026001',
          policyNo: 'PI2026001234',
          insuranceCompany: '人保财险',
          policyholder: '深圳XX国际贸易有限公司',
          insured: 'ABC Corporation',
          coverageAmount: 500000,
          premium: 12500,
          effectiveDate: '2026-01-01',
          expiryDate: '2027-01-01',
          status: 'active',
          statusName: '有效',
          usedQuota: 320000,
          remainingQuota: 180000
        },
        {
          id: 'P2026002',
          policyNo: 'PI2025009876',
          insuranceCompany: '太保产险',
          policyholder: '北京ZZ贸易集团',
          insured: 'GHI Ltd',
          coverageAmount: 400000,
          premium: 10000,
          effectiveDate: '2026-04-01',
          expiryDate: '2027-04-01',
          status: 'active',
          statusName: '有效',
          usedQuota: 150000,
          remainingQuota: 250000
        },
        {
          id: 'P2025008',
          policyNo: 'PI2025008765',
          insuranceCompany: '平安产险',
          policyholder: '广州AA实业公司',
          insured: 'JKL Co',
          coverageAmount: 200000,
          premium: 5000,
          effectiveDate: '2025-10-01',
          expiryDate: '2026-10-01',
          status: 'expiring',
          statusName: '即将到期',
          usedQuota: 180000,
          remainingQuota: 20000
        }
      ]
      this.creditLimits = [
        {
          id: 'CL2026001',
          buyerName: 'ABC Corporation',
          buyerCountry: '美国',
          appliedLimit: 500000,
          usedLimit: 320000,
          remainingLimit: 180000,
          usageRate: 64,
          status: 'active',
          effectiveDate: '2026-02-01',
          expiryDate: '2027-01-31'
        },
        {
          id: 'CL2026002',
          buyerName: 'DEF GmbH',
          buyerCountry: '德国',
          appliedLimit: 300000,
          usedLimit: 150000,
          remainingLimit: 150000,
          usageRate: 50,
          status: 'active',
          effectiveDate: '2026-03-01',
          expiryDate: '2027-02-28'
        },
        {
          id: 'CL2026003',
          buyerName: 'GHI Ltd',
          buyerCountry: '英国',
          appliedLimit: 400000,
          usedLimit: 400000,
          remainingLimit: 0,
          usageRate: 100,
          status: 'exhausted',
          effectiveDate: '2026-04-01',
          expiryDate: '2027-03-31'
        }
      ]
      this.shipments = [
        {
          id: 'SD2026001',
          declarationNo: 'SD20260510001',
          buyerName: 'ABC Corporation',
          relatedPolicyNo: 'PI2026001234',
          shipmentDate: '2026-05-10',
          destinationPort: 'New York, USA',
          shipmentAmount: 50000,
          currency: 'USD',
          declarationType: 'single',
          declarationTypeName: '逐笔申报',
          deadline: '2026-05-25',
          status: 'declared',
          statusName: '已申报',
          isOverdue: false
        },
        {
          id: 'SD2026002',
          declarationNo: 'SD20260501002',
          buyerName: 'DEF GmbH',
          relatedPolicyNo: 'PI2026001235',
          shipmentDate: '2026-05-01',
          destinationPort: 'Hamburg, Germany',
          shipmentAmount: 30000,
          currency: 'USD',
          declarationType: 'single',
          declarationTypeName: '逐笔申报',
          deadline: '2026-05-16',
          status: 'pending_declare',
          statusName: '待申报',
          isOverdue: false
        },
        {
          id: 'SD2026003',
          declarationNo: 'SD20260428003',
          buyerName: 'GHI Ltd',
          relatedPolicyNo: 'PI2025000987',
          shipmentDate: '2026-04-28',
          destinationPort: 'Hong Kong',
          shipmentAmount: 80000,
          currency: 'USD',
          declarationType: 'single',
          declarationTypeName: '逐笔申报',
          deadline: '2026-05-01',
          status: 'pending_declare',
          statusName: '待申报',
          isOverdue: true
        },
        {
          id: 'SD2026004',
          declarationNo: 'SD20260420004',
          buyerName: 'JKL Co',
          relatedPolicyNo: 'PI2025008765',
          shipmentDate: '2026-04-20',
          destinationPort: 'Tokyo, Japan',
          shipmentAmount: 45000,
          currency: 'USD',
          declarationType: 'monthly',
          declarationTypeName: '月度汇总',
          deadline: '2026-05-10',
          status: 'declared',
          statusName: '已申报',
          isOverdue: false
        }
      ]
      this.shipments = this.shipments.map(normalizeShipment)
      this.claims = [
        {
          id: 'CL2026001',
          claimNo: 'CL20260508001',
          relatedPolicyNo: 'PI2026001234',
          insuranceCompany: '人保财险',
          buyerName: 'ABC Corporation',
          claimType: 'goods_damage',
          claimTypeName: '货物损失',
          lossDescription: '货物在运输过程中发生损毁',
          estimatedLossAmount: 50000,
          claimAmount: null,
          lossDate: '2026-05-05',
          lossCurrency: 'USD',
          status: 'processing',
          statusName: '处理中',
          createTime: '2026-05-08 10:00:00',
          reportDeadline: '风险发生后10日',
          investigationDeadline: '简单10工作日/复杂30日',
          paymentDeadline: '协议后10日/最长60日',
          claimContact: '张三',
          claimPhone: '138****1234',
          claimEmail: 'zhangsan@example.com',
          bankAccount: '中国工商银行 6222****12345678'
        },
        {
          id: 'CL2026002',
          claimNo: 'CL20260505002',
          relatedPolicyNo: 'PI2025009876',
          insuranceCompany: '太保产险',
          buyerName: 'GHI Ltd',
          claimType: 'buyer_default',
          claimTypeName: '买方拖欠',
          lossDescription: '买方拖欠货款超过90天',
          estimatedLossAmount: 80000,
          claimAmount: 64000,
          lossDate: '2026-04-15',
          lossCurrency: 'USD',
          status: 'decided',
          statusName: '已决定',
          createTime: '2026-05-05 14:30:00',
          reportDeadline: '拖欠30日/其他10工作日',
          investigationDeadline: '30工作日',
          paymentDeadline: '核赔后10日',
          claimContact: '李四',
          claimPhone: '139****5678',
          claimEmail: 'lisi@example.com',
          bankAccount: '中国建设银行 6227****87654321'
        },
        {
          id: 'CL2026003',
          claimNo: 'CL20260428003',
          relatedPolicyNo: 'PI2025008765',
          insuranceCompany: '平安产险',
          buyerName: 'JKL Co',
          claimType: 'other',
          claimTypeName: '政治风险',
          lossDescription: '因政治风险导致的损失',
          estimatedLossAmount: 30000,
          claimAmount: null,
          lossDate: '2026-04-20',
          lossCurrency: 'USD',
          status: 'pending',
          statusName: '待处理',
          createTime: '2026-04-28 09:15:00',
          reportDeadline: '按保单条款',
          investigationDeadline: '按保单条款',
          paymentDeadline: '按保单条款',
          claimContact: '王五',
          claimPhone: '137****9012',
          claimEmail: 'wangwu@example.com',
          bankAccount: '中国农业银行 6228****24680135'
        }
      ]
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
        id,
        status: 'pending_submit',
        createTime: formatDate(now),
        updateTime: formatDateTime(now),
        ...payload
      }
      this.insuranceApplications.unshift(item)
      return item
    },
    submitInsuranceApplication(id) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const now = new Date()
      const cur = this.insuranceApplications[idx]
      if (!['pending_submit', 'draft', 'pending_material'].includes(cur.status)) {
        return { ok: false, message: '当前状态不允许提交' }
      }
      const missing = []
      if (!hasFile(cur.businessLicense)) missing.push('企业法人营业执照扫描件')
      if (!hasFile(cur.importExportQualification)) missing.push('对外贸易经营者备案登记表')
      if (!hasFile(cur.authorizationDocument)) missing.push('授权保险公司联系买方的签字文件')
      if (missing.length > 0) return { ok: false, message: `提交失败：缺少必传附件（${missing.join('、')}）` }
      this.insuranceApplications[idx] = { ...cur, status: 'credit_investigating', updateTime: formatDateTime(now) }
      return { ok: true, data: this.insuranceApplications[idx] }
    },
    approveInsuranceApplication(id) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const now = new Date()
      const cur = this.insuranceApplications[idx]
      if (cur.status !== 'credit_investigating') {
        return { ok: false, message: '仅“资信调查中”状态允许模拟通过' }
      }
      const next = { ...cur, status: 'completed', updateTime: formatDateTime(now) }
      this.insuranceApplications[idx] = next
      const policyNo = `PI${String(now.getFullYear())}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
      if (!this.policies.some(p => p.policyholder === next.enterpriseName && p.insured === next.buyerName)) {
        this.policies.unshift({
          id: createId('P'),
          policyNo,
          insuranceCompany: next.expectedInsuranceCompany || '人保财险',
          policyholder: next.enterpriseName,
          insured: next.buyerName,
          coverageAmount: Number(next.coverageAmount) || 0,
          premium: Number(next.premium) || 0,
          effectiveDate: formatDate(now),
          expiryDate: addDays(formatDate(now), 365),
          status: 'active',
          statusName: '有效',
          usedQuota: 0,
          remainingQuota: Number(next.coverageAmount) || 0
        })
      }
      if (!this.creditLimits.some(c => c.buyerName === next.buyerName)) {
        const applied = Number(next.coverageAmount) || 0
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
    createCreditLimit(payload) {
      const now = new Date()
      const applied = Number(payload.appliedLimit) || 0
      const used = Number(payload.usedLimit) || 0
      const remaining = Math.max(applied - used, 0)
      const item = {
        id: payload.id || createId('CL'),
        buyerName: payload.buyerName,
        appliedLimit: applied,
        usedLimit: used,
        remainingLimit: remaining,
        usageRate: applied > 0 ? Math.round((used / applied) * 100) : 0,
        status: payload.status || 'pending',
        effectiveDate: payload.effectiveDate || formatDate(now),
        expiryDate: payload.expiryDate || addDays(formatDate(now), 365)
      }
      this.creditLimits.unshift(item)
      return item
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
        deadline,
        status: payload.status || 'declared',
        statusName: payload.statusName || '已申报',
        isOverdue: isOverdueByDeadline(deadline, payload.status || 'declared'),
        isDueSoon: isDueSoonByDeadline(deadline, payload.status || 'declared')
      }
      const normalized = normalizeShipment(item)
      this.shipments.unshift(normalized)
      return normalized
    },
    createClaim(payload) {
      const now = new Date()
      const policyNo = payload.relatedPolicyNo
      const policy = this.policies.find(p => p.policyNo === policyNo)
      if (!policyNo) return { ok: false, message: '请选择关联保单' }
      if (!policy) return { ok: false, message: '关联保单不存在' }
      if (policy.status !== 'active') return { ok: false, message: '关联保单非有效状态，无法发起理赔' }
      const missing = []
      if (!hasFile(payload.evidenceMaterials)) missing.push('证据材料')
      if (!hasFile(payload.relevantDocuments)) missing.push('相关文件')
      if (missing.length > 0) return { ok: false, message: `提交失败：缺少必传附件（${missing.join('、')}）` }
      const item = {
        id: payload.id || createId('CL'),
        claimNo: payload.claimNo || createId('CL'),
        relatedPolicyNo: policyNo,
        buyerName: payload.buyerName || policy.insured,
        claimType: payload.claimType,
        claimTypeName: payload.claimTypeName,
        lossDescription: payload.lossDescription,
        estimatedLossAmount: Number(payload.estimatedLossAmount) || 0,
        lossDate: payload.lossDate,
        lossLocation: payload.lossLocation,
        evidenceMaterials: payload.evidenceMaterials,
        relevantDocuments: payload.relevantDocuments,
        status: payload.status || 'pending',
        statusName: payload.statusName || '待处理',
        claimAmount: payload.claimAmount ?? null,
        createTime: payload.createTime || formatDateTime(now)
      }
      this.claims.unshift(item)
      return { ok: true, data: item }
    }
  }
})
