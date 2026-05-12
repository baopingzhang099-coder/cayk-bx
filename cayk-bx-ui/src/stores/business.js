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
        }
      ]
      this.creditLimits = [
        {
          id: 'CL2026001',
          buyerName: 'ABC Corporation',
          appliedLimit: 500000,
          usedLimit: 320000,
          remainingLimit: 180000,
          usageRate: 64,
          status: 'active',
          effectiveDate: '2026-02-01',
          expiryDate: '2027-01-31'
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
        }
      ]
      this.shipments = this.shipments.map(normalizeShipment)
      this.claims = [
        {
          id: 'CL2026001',
          claimNo: 'CL20260508001',
          relatedPolicyNo: 'PI2026001234',
          buyerName: 'ABC Corporation',
          claimType: 'goods_damage',
          claimTypeName: '货物损失',
          lossDescription: '货物在运输过程中发生损毁',
          estimatedLossAmount: 50000,
          status: 'processing',
          statusName: '处理中',
          claimAmount: null,
          createTime: '2026-05-08 10:00:00'
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
