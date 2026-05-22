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
    claims: [],
    processTasks: [],
    contracts: [],
    payments: [],
    externalPolicies: [],
    clerkList: [],
    tradeInfos: [],
    subsidies: [],
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
    },
    touchInsuranceApplications() {
      this.insuranceUpdateVersion++
    },
    ensureSeeded() {
      if (this.insuranceApplications.length > 0) return
      this.insuranceApplications = [
        {
          id: 'TB2026001',
          // 客户基础信息
          companyName: '深圳XX国际贸易有限公司',
          unifiedSocialCreditCode: '91440300XXXXXXXXXX',
          registeredAddress: '深圳市南山区科技园南区XX大厦12楼',
          businessAddress: '深圳市南山区科技园南区XX大厦12楼',
          organizationCode: 'G101234-8',
          establishmentYear: '2008',
          legalRepresentative: '张伟华',
          enterpriseNature: '民营企业',
          businessType: '贸易公司',
          contactName: '张经理',
          contactPosition: '出口业务经理',
          contactPhone: '138****8888',
          companyEmail: 'zhang@szxx-trade.com',
          // 业务信息
          exportBusinessHistory: '3年以上',
          exportMainCountries: ['美国', '加拿大', '墨西哥'],
          mainExportIndustry: '电子',
          expectedInsurableTurnover: 8000000,
          turnoverCurrency: 'USD',
          mainPaymentMethods: 'OA',
          mostUsedPaymentTerm: 60,
          longestPaymentTerm: 90,
          hasLongerCreditPeriod: '否',
          longestCreditPeriod: null,
          // 投保核心需求
          insuranceType: '短期出口信用保险',
          preferredInsuranceOrgType: '政策性保险机构',
          insuranceBusinessScope: '全部适保业务',
          insuranceCurrency: 'USD',
          insuranceAmount: 500000,
          expectedInsurancePeriod: ['2026-06-01', '2027-05-31'],
          insurancePrimaryPurpose1: '保障出口收汇安全',
          insurancePrimaryPurpose2: '获取银行贸易融资',
          insurancePrimaryPurpose3: '取得海外买方信息',
          insurancePrimaryPurpose4: '提升公司内部管理',
          // 买方信息
          buyerName: 'ABC Corporation',
          buyerCountry: '美国',
          buyerAddress: '123 Broadway, New York, NY 10006, USA',
          cooperationYearsWithBuyer: '3年以上',
          last12MonthExportAmount: 520,
          last12MonthCreditSalesAmount: 480,
          expectedNext12MonthCreditSales: 600,
          creditSalesCurrency: 'USD',
          paymentTerms: '发送货物后60天',
          appliedCreditLimit: 500000,
          creditLimitCurrency: 'USD',
          lcIssuingBank: '',
          // 贸易基础信息
          exportProductCategory: '消费电子产品及零部件',
          involvesControlledGoods: '否',
          controlledGoodsDescription: '',
          hasTitleRetentionClause: '否',
          // 补充资料
          businessLicense: [{ name: '营业执照.pdf' }],
          importExportQualification: [{ name: '进出口资质.pdf' }],
          tradeContract: [{ name: '贸易合同_ABC2025001.pdf' }],
          customsDeclaration: [{ name: '报关单_20260501.pdf' }],
          exportLicense: null,
          authorizationDocument: [{ name: '授权文件.pdf' }],
          // 投保声明
          declarationSignature: '张伟华',
          declarationDate: '2026-05-01',
          companySeal: [{ name: '公章文件.pdf' }],
          // 状态
          status: 'rejected',
          rejectReason: '缺少贸易合同和报关单等核心证明文件，请补充后重新提交。',
          createTime: '2026-05-01',
          updateTime: '2026-05-01 10:30:00'
        },
        {
          id: 'TB2026002',
          // 客户基础信息
          companyName: '上海YY进出口公司',
          unifiedSocialCreditCode: '91310000XXXXXXXXXX',
          registeredAddress: '上海市浦东新区陆家嘴金融区XX号',
          businessAddress: '上海市浦东新区陆家嘴金融区XX号',
          organizationCode: 'G201234-5',
          establishmentYear: '2012',
          legalRepresentative: '李明辉',
          enterpriseNature: '民营企业',
          businessType: '贸易代理',
          contactName: '李经理',
          contactPosition: '业务主管',
          contactPhone: '139****6666',
          companyEmail: 'li@shanghai-yy.com',
          // 业务信息
          exportBusinessHistory: '1-3年',
          exportMainCountries: ['德国', '法国', '荷兰'],
          mainExportIndustry: '机械',
          expectedInsurableTurnover: 5000000,
          turnoverCurrency: 'USD',
          mainPaymentMethods: 'OA',
          mostUsedPaymentTerm: 90,
          longestPaymentTerm: 120,
          hasLongerCreditPeriod: '是',
          longestCreditPeriod: 150,
          // 投保核心需求
          insuranceType: '短期出口信用保险',
          preferredInsuranceOrgType: '政策性保险机构',
          insuranceBusinessScope: '部分适保业务-全部非信用证',
          insuranceCurrency: 'USD',
          insuranceAmount: 300000,
          expectedInsurancePeriod: ['2026-05-01', '2027-04-30'],
          insurancePrimaryPurpose1: '保障出口收汇安全',
          insurancePrimaryPurpose2: '获取银行贸易融资',
          insurancePrimaryPurpose3: '提升公司内部管理',
          insurancePrimaryPurpose4: '取得海外买方信息',
          // 买方信息
          buyerName: 'DEF GmbH',
          buyerCountry: '德国',
          buyerAddress: 'Industriestr. 100, 20099 Hamburg, Germany',
          cooperationYearsWithBuyer: '1-3年',
          last12MonthExportAmount: 380,
          last12MonthCreditSalesAmount: 350,
          expectedNext12MonthCreditSales: 450,
          creditSalesCurrency: 'USD',
          paymentTerms: '开具发票后90天',
          appliedCreditLimit: 300000,
          creditLimitCurrency: 'USD',
          lcIssuingBank: '',
          // 贸易基础信息
          exportProductCategory: '工业机械设备及配件',
          involvesControlledGoods: '否',
          controlledGoodsDescription: '',
          hasTitleRetentionClause: '是',
          // 补充资料
          businessLicense: [{ name: '营业执照.pdf' }],
          importExportQualification: [{ name: '进出口资质.pdf' }],
          tradeContract: [{ name: '贸易合同_DEF2025001.pdf' }],
          customsDeclaration: [{ name: '报关单_20260428.pdf' }],
          exportLicense: null,
          authorizationDocument: [{ name: '授权文件.pdf' }],
          // 投保声明
          declarationSignature: '李明辉',
          declarationDate: '2026-04-28',
          companySeal: [{ name: '公章文件.pdf' }],
          // 状态
          status: 'pending_review',
          createTime: '2026-04-28',
          updateTime: '2026-05-05 14:20:00'
        },
        {
          id: 'TB2026003',
          // 客户基础信息
          companyName: '北京ZZ贸易集团',
          unifiedSocialCreditCode: '91110000XXXXXXXXXX',
          registeredAddress: '北京市朝阳区国贸CBD核心区XX座35层',
          businessAddress: '北京市朝阳区国贸CBD核心区XX座35层',
          organizationCode: 'G301234-2',
          establishmentYear: '2005',
          legalRepresentative: '王建国',
          enterpriseNature: '民营企业',
          businessType: '贸易公司',
          contactName: '王总监',
          contactPosition: '业务总监',
          contactPhone: '137****9999',
          companyEmail: 'wang@zz-trade.com',
          // 业务信息
          exportBusinessHistory: '3年以上',
          exportMainCountries: ['英国', '德国', '法国'],
          mainExportIndustry: '机械',
          expectedInsurableTurnover: 6000000,
          turnoverCurrency: 'USD',
          mainPaymentMethods: 'OA',
          mostUsedPaymentTerm: 60,
          longestPaymentTerm: 120,
          hasLongerCreditPeriod: '是',
          longestCreditPeriod: 180,
          // 投保核心需求
          insuranceType: '短期出口信用保险',
          preferredInsuranceOrgType: '商业性保险机构',
          insuranceBusinessScope: '全部适保业务',
          insuranceCurrency: 'USD',
          insuranceAmount: 400000,
          expectedInsurancePeriod: ['2026-04-01', '2027-03-31'],
          insurancePrimaryPurpose1: '保障出口收汇安全',
          insurancePrimaryPurpose2: '获取银行贸易融资',
          insurancePrimaryPurpose3: '提升公司内部管理',
          insurancePrimaryPurpose4: '取得海外买方信息',
          // 买方信息
          buyerName: 'GHI Ltd',
          buyerCountry: '英国',
          buyerAddress: '20 Liverpool Street, London EC2M 7PD, UK',
          cooperationYearsWithBuyer: '3年以上',
          last12MonthExportAmount: 300,
          last12MonthCreditSalesAmount: 250,
          expectedNext12MonthCreditSales: 350,
          creditSalesCurrency: 'USD',
          paymentTerms: '发送货物后60天',
          appliedCreditLimit: 350000,
          creditLimitCurrency: 'USD',
          lcIssuingBank: '',
          // 贸易基础信息
          exportProductCategory: '机械设备及零部件',
          involvesControlledGoods: '否',
          controlledGoodsDescription: '',
          hasTitleRetentionClause: '否',
          // 补充资料
          businessLicense: [{ name: '营业执照.jpg' }],
          importExportQualification: [{ name: '进出口资质.jpg' }],
          tradeContract: [{ name: '贸易合同_GHI2025001.pdf' }],
          customsDeclaration: [{ name: '报关单_20260315.pdf' }],
          exportLicense: null,
          authorizationDocument: [{ name: '授权文件.pdf' }],
          // 投保声明
          declarationSignature: '王建国',
          declarationDate: '2026-03-15',
          companySeal: [{ name: '公章文件.jpg' }],
          // 状态
          status: 'approved',
          createTime: '2026-03-15',
          updateTime: '2026-04-20 11:00:00',
          // 保单数字化信息 - 基础信息
          policyNo: 'PI2026005678',
          insuranceCompanyName: '太保产险',
          insurerName: '太保产险北京分公司',
          insuredName: '北京ZZ贸易集团',
          beneficiaryName: '北京ZZ贸易集团',
          policyStartDate: '2026-04-01',
          policyEndDate: '2027-03-31',
          policyPeriod: '12个月',
          renewalFlag: '否',
          countryRiskVersion: '2026版',
          clauseVersion: '短期出口信用保险条款v2025',
          agreedCoverageScope: '全部适保业务',
          tradeBusinessType: '货物贸易',
          // 保单数字化信息 - 责任限额
          maxCompensationLimit: 400000,
          buyerCreditLimit: 300000,
          coveredRisks: '商业风险—买方破产或无力偿付债务；商业风险—买方拖欠；政治风险',
          limitIdlePeriod: 60,
          selfControlledLimit: '条件：历史交易良好；限额：单笔不超过50000；赔偿比例：80%',
          deductible: 5000,
          // 保单数字化信息 - 申报规则
          declarationMethod: '月度申报',
          declarationCycle: '月度',
          declarationDeadline: '次月15日',
          // 保单数字化信息 - 费用管理
          premiumRate: 2.5,
          premiumPaymentDeadline: '保险起期前30日',
          premiumPaymentMethod: '一次性',
          premium: 10000,
          surrenderFee: null,
          recoveryPayee: '被保险人',
          // 保单数字化信息 - 保单文件
          policyFile: [{ name: 'PI2026005678_保单.pdf', url: '#', size: 2456789, type: 'application/pdf' }],
          endorsementFile: []
        },
        {
          id: 'TB2026005',
          companyName: '杭州XX机电有限公司',
          unifiedSocialCreditCode: '91330100XXXXXXXXXX',
          registeredAddress: '杭州市滨江区科技园区XX路XX号',
          businessAddress: '杭州市滨江区科技园区XX路XX号',
          organizationCode: 'G501234-7',
          establishmentYear: '2015',
          legalRepresentative: '刘建华',
          enterpriseNature: '民营企业',
          businessType: '制造业',
          contactName: '刘经理',
          contactPosition: '销售总监',
          contactPhone: '137****4444',
          companyEmail: 'liu@hz-xx.com',
          exportBusinessHistory: '3年以上',
          exportMainCountries: ['澳大利亚', '新西兰'],
          mainExportIndustry: '机电',
          expectedInsurableTurnover: 4000000,
          turnoverCurrency: 'USD',
          mainPaymentMethods: 'L/C',
          mostUsedPaymentTerm: 45,
          longestPaymentTerm: 90,
          hasLongerCreditPeriod: '否',
          insuranceType: '短期出口信用保险',
          preferredInsuranceOrgType: '政策性保险机构',
          insuranceBusinessScope: '全部适保业务',
          insuranceCurrency: 'USD',
          insuranceAmount: 300000,
          expectedInsurancePeriod: ['2026-05-15', '2027-05-14'],
          insurancePrimaryPurpose1: '保障出口收汇安全',
          insurancePrimaryPurpose2: '获取银行贸易融资',
          buyerName: 'XYZ Pty Ltd',
          buyerCountry: '澳大利亚',
          buyerAddress: '123 George Street, Sydney NSW 2000, Australia',
          cooperationYearsWithBuyer: '1-3年',
          last12MonthExportAmount: 280,
          last12MonthCreditSalesAmount: 240,
          expectedNext12MonthCreditSales: 320,
          creditSalesCurrency: 'USD',
          paymentTerms: 'L/C at sight',
          appliedCreditLimit: 300000,
          creditLimitCurrency: 'USD',
          exportProductCategory: '机电设备',
          involvesControlledGoods: '否',
          hasTitleRetentionClause: '否',
          businessLicense: [{ name: '营业执照.pdf' }],
          importExportQualification: [{ name: '进出口资质.pdf' }],
          tradeContract: [{ name: '贸易合同_XYZ2026001.pdf' }],
          customsDeclaration: [{ name: '报关单_20260510.pdf' }],
          authorizationDocument: [{ name: '授权文件.pdf' }],
          declarationSignature: '刘建华',
          declarationDate: '2026-05-15',
          companySeal: [{ name: '公章文件.pdf' }],
          status: 'approved',
          createTime: '2026-05-15',
          updateTime: '2026-05-18 09:00:00',
          policyNo: 'PI2026005679',
          insuranceCompanyName: '中国信保',
          insurerName: '中国信保浙江分公司',
          insuredName: '杭州XX机电有限公司',
          beneficiaryName: '杭州XX机电有限公司',
          policyStartDate: '2026-05-15',
          policyEndDate: '2027-05-14',
          policyPeriod: '12个月',
          maxCompensationLimit: 300000,
          declarationMethod: '月度申报',
          declarationCycle: '月度',
          declarationDeadline: '次月15日',
          premiumRate: 2.0,
          premium: 6000,
          policyFile: [{ name: 'PI2026005679_保单.pdf', url: '#', size: 1895678, type: 'application/pdf' }],
          endorsementFile: [{ name: '批单_20260518_001.pdf', url: '#', size: 567890, type: 'application/pdf' }]
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
        },
        {
          id: 'P2026004',
          policyNo: 'PI2026004567',
          insuranceCompany: '中国信保',
          policyholder: '上海YY进出口公司',
          insured: 'DEF GmbH',
          coverageAmount: 300000,
          premium: 7500,
          effectiveDate: '2026-06-01',
          expiryDate: '2027-06-01',
          status: 'applying',
          statusName: '申请中',
          usedQuota: 0,
          remainingQuota: 300000
        },
        {
          id: 'P2026005',
          policyNo: 'PI2026005678',
          insuranceCompany: '人保财险',
          policyholder: '杭州CC贸易有限公司',
          insured: 'MNO Inc',
          coverageAmount: 250000,
          premium: 6250,
          effectiveDate: '2026-05-15',
          expiryDate: '2027-05-15',
          status: 'pending_review',
          statusName: '待确认',
          usedQuota: 0,
          remainingQuota: 250000
        },
        {
          id: 'P2026006',
          policyNo: 'PI2026006789',
          insuranceCompany: '太保产险',
          policyholder: '成都DD商贸有限公司',
          insured: 'PQR Ltd',
          coverageAmount: 450000,
          premium: 11250,
          effectiveDate: '2026-05-20',
          expiryDate: '2027-05-20',
          status: 'approved',
          statusName: '已确认',
          usedQuota: 0,
          remainingQuota: 450000
        },
        {
          id: 'P2026007',
          policyNo: 'PI2026009999',
          insuranceCompany: '人保财险',
          policyholder: '南京FF进出口有限公司',
          insured: 'STG Ltd',
          coverageAmount: 350000,
          premium: 8750,
          effectiveDate: '2026-04-01',
          expiryDate: '2027-04-01',
          status: 'active',
          statusName: '有效',
          usedQuota: 200000,
          remainingQuota: 150000
        },
        {
          id: 'P2026008',
          policyNo: 'PI2026008888',
          insuranceCompany: '平安产险',
          policyholder: '武汉DD物流有限公司',
          insured: 'UVW Corp',
          coverageAmount: 280000,
          premium: 7000,
          effectiveDate: '2026-03-01',
          expiryDate: '2027-03-01',
          status: 'active',
          statusName: '有效',
          usedQuota: 150000,
          remainingQuota: 130000
        }
      ]
      this.creditLimits = [
        {
          id: 'CL2026001',
          buyerName: 'ABC Corporation',
          buyerCountry: '美国',
          appliedLimit: 500000,
          currency: 'USD',
          usedLimit: 320000,
          remainingLimit: 180000,
          usageRate: 64,
          paymentTerms: 'OA 60天',
          paymentMethod: 'OA',
          past12MonthSales: 520000,
          cooperationYears: '3年以上',
          status: 'active',
          statusName: '已批复',
          effectiveDate: '2026-02-01',
          expiryDate: '2027-01-31',
          lastShipmentDate: '2026-05-10',
          idleDays: 12,
          concentrationRate: 32
        },
        {
          id: 'CL2026002',
          buyerName: 'DEF GmbH',
          buyerCountry: '德国',
          appliedLimit: 300000,
          currency: 'USD',
          usedLimit: 150000,
          remainingLimit: 150000,
          usageRate: 50,
          paymentTerms: 'OA 90天',
          paymentMethod: 'OA',
          past12MonthSales: 380000,
          cooperationYears: '1-3年',
          status: 'active',
          statusName: '已批复',
          effectiveDate: '2026-03-01',
          expiryDate: '2027-02-28',
          lastShipmentDate: '2026-05-01',
          idleDays: 21,
          concentrationRate: 20
        },
        {
          id: 'CL2026003',
          buyerName: 'GHI Ltd',
          buyerCountry: '英国',
          appliedLimit: 400000,
          currency: 'USD',
          usedLimit: 400000,
          remainingLimit: 0,
          usageRate: 100,
          paymentTerms: 'OA 60天',
          paymentMethod: 'OA',
          past12MonthSales: 300000,
          cooperationYears: '3年以上',
          status: 'exhausted',
          statusName: '已用罄',
          effectiveDate: '2026-04-01',
          expiryDate: '2027-03-31',
          lastShipmentDate: '2026-04-28',
          idleDays: 24,
          concentrationRate: 25
        },
        {
          id: 'CL2026004',
          buyerName: 'JKL Co',
          buyerCountry: '日本',
          appliedLimit: 200000,
          currency: 'USD',
          usedLimit: 50000,
          remainingLimit: 150000,
          usageRate: 25,
          paymentTerms: 'OA 45天',
          paymentMethod: 'OA',
          past12MonthSales: 250000,
          cooperationYears: '1-3年',
          status: 'frozen',
          statusName: '已冻结',
          effectiveDate: '2026-01-15',
          expiryDate: '2027-01-14',
          lastShipmentDate: '2026-03-10',
          idleDays: 73,
          freezeDate: '2026-05-10',
          freezeReason: '买方逾期超30天且未回应催款通知',
          canUnfreeze: false,
          concentrationRate: 15
        },
        {
          id: 'CL2026005',
          buyerName: 'PQR Ltd',
          buyerCountry: '新加坡',
          appliedLimit: 350000,
          currency: 'USD',
          usedLimit: 0,
          remainingLimit: 350000,
          usageRate: 0,
          paymentTerms: 'LC at sight',
          paymentMethod: 'LC',
          past12MonthSales: 280000,
          cooperationYears: '1-3年',
          status: 'pending',
          statusName: '待审批',
          effectiveDate: '',
          expiryDate: '',
          lastShipmentDate: null,
          idleDays: 0,
          concentrationRate: 18
        },
        {
          id: 'CL2026006',
          buyerName: 'MNO Inc',
          buyerCountry: '韩国',
          appliedLimit: 250000,
          currency: 'USD',
          usedLimit: 0,
          remainingLimit: 250000,
          usageRate: 0,
          paymentTerms: 'OA 30天',
          paymentMethod: 'OA',
          past12MonthSales: 200000,
          cooperationYears: '1年以内',
          status: 'revoked',
          statusName: '已撤销',
          effectiveDate: '2026-01-01',
          expiryDate: '2026-12-31',
          lastShipmentDate: '2026-02-15',
          idleDays: 96,
          revokeDate: '2026-05-16',
          revokeReason: '连续90天无出运，系统自动撤销',
          concentrationRate: 12
        },
        {
          id: 'CL2026007',
          buyerName: 'STV SA',
          buyerCountry: '法国',
          appliedLimit: 180000,
          currency: 'USD',
          usedLimit: 180000,
          remainingLimit: 0,
          usageRate: 100,
          paymentTerms: 'OA 60天',
          paymentMethod: 'OA',
          past12MonthSales: 200000,
          cooperationYears: '1-3年',
          status: 'expired',
          statusName: '已过期',
          effectiveDate: '2025-06-01',
          expiryDate: '2026-05-31',
          lastShipmentDate: '2026-04-15',
          idleDays: 37,
          concentrationRate: 22
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
          claimNo: 'CL20260520001',
          relatedPolicyNo: 'PI2026001234',
          insuranceCompany: '人保财险',
          buyerName: 'ABC Corporation',
          claimType: 'arrears',
          claimTypeName: '买方拖欠',
          lossDescription: '买方ABC Corporation拖欠货款USD 50,000，逾期已超过60天，多次催收无果',
          estimatedLossAmount: 50000,
          claimAmount: null,
          lossDate: '2026-05-01',
          lossCurrency: 'USD',
          lossLocation: '深圳港',
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
          payoutVoucher: [],
          evidenceMaterials: [{ name: '催收记录.pdf', category: 'collection' }, { name: '贸易合同扫描件.pdf', category: 'contract' }],
          relevantDocuments: [{ name: '商业发票.pdf', category: 'invoice' }, { name: '提单副本.pdf', category: 'billoflading' }],
          rwaSyncStatus: 'pending',
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
          status: 'pending',
          statusName: '待接收报案',
          createTime: '2026-05-20 09:30:00',
          claimContact: '张三',
          claimPhone: '13800138001',
          claimEmail: 'zhangsan@example.com',
          bankAccount: '中国工商银行深圳分行 6222****1234'
        },
        {
          id: 'CL2026002',
          claimNo: 'CL20260518002',
          relatedPolicyNo: 'PI2025009876',
          insuranceCompany: '中国信保',
          buyerName: 'GHI Ltd',
          claimType: 'bankruptcy',
          claimTypeName: '破产',
          lossDescription: '买方GHI Ltd已向当地法院申请破产保护，涉及应收账款USD 120,000',
          estimatedLossAmount: 120000,
          claimAmount: null,
          lossDate: '2026-05-10',
          lossCurrency: 'USD',
          lossLocation: '伦敦',
          currentStep: 1,
          currentStepName: '报案提交',
          warningLevel: 'danger',
          clerkId: 'C002',
          clerkName: '赵敏',
          delegationAgreement: [],
          serviceFeePaid: false,
          serviceFeeVoucher: [],
          deductible: null,
          claimDecision: null,
          calculatedLoss: null,
          payoutVoucher: [],
          evidenceMaterials: [{ name: '破产公告.pdf', category: 'bankruptcy' }, { name: '债权申报表.pdf', category: 'claimForm' }],
          relevantDocuments: [{ name: '贸易合同.pdf', category: 'contract' }, { name: '应收账款明细.xlsx', category: 'receivable' }],
          rwaSyncStatus: 'pending',
          docStatus: 'pending',
          docReviewComment: '',
          supplementCount: 0,
          preparedDocs: [],
          supplementedDocs: [],
          clerkConfirmed: false,
          lossNotified: false,
          lossNotifiedTime: null,
          insurerNotified: true,
          insurerNotifiedTime: '2026-05-18 15:00:00',
          status: 'assigned',
          statusName: '待接单',
          createTime: '2026-05-18 10:00:00',
          claimContact: '李四',
          claimPhone: '13900139002',
          claimEmail: 'lisi@example.com',
          bankAccount: '中国建设银行深圳分行 6227****5678'
        },
        {
          id: 'CL2026003',
          claimNo: 'CL20260515003',
          relatedPolicyNo: 'PI2025008765',
          insuranceCompany: '太平洋保险',
          buyerName: 'JKL Co',
          claimType: 'rejection',
          claimTypeName: '拒收',
          lossDescription: '买方JKL Co以质量异议为由拒收货物，货物滞留目的港产生高额滞港费',
          estimatedLossAmount: 35000,
          claimAmount: null,
          lossDate: '2026-05-08',
          lossCurrency: 'USD',
          lossLocation: '东京港',
          currentStep: 1,
          currentStepName: '报案提交',
          warningLevel: 'safe',
          clerkId: 'C001',
          clerkName: '李明',
          delegationAgreement: [],
          serviceFeePaid: false,
          serviceFeeVoucher: [],
          deductible: null,
          claimDecision: null,
          calculatedLoss: null,
          payoutVoucher: [],
          evidenceMaterials: [{ name: '拒收通知函.pdf', category: 'rejectionLetter' }, { name: '质量检验报告.pdf', category: 'inspection' }],
          relevantDocuments: [{ name: '商业发票.pdf', category: 'invoice' }, { name: '提单.pdf', category: 'billoflading' }, { name: '滞港费清单.pdf', category: 'demurrage' }],
          rwaSyncStatus: 'pending',
          docStatus: 'reviewing',
          docReviewComment: '',
          supplementCount: 0,
          preparedDocs: [
            { name: '可能损失通知书.pdf', category: 'appNotice' },
            { name: '索赔申请书.pdf', category: 'claimForm' },
            { name: '贸易合同.pdf', category: 'tradeContract' },
            { name: '商业发票.pdf', category: 'invoice' }
          ],
          supplementedDocs: [],
          clerkConfirmed: false,
          lossNotified: false,
          lossNotifiedTime: null,
          insurerNotified: true,
          insurerNotifiedTime: '2026-05-15 16:00:00',
          status: 'pending_receive',
          statusName: '待接收',
          createTime: '2026-05-15 14:00:00',
          claimContact: '王五',
          claimPhone: '13700137003',
          claimEmail: 'wangwu@example.com',
          bankAccount: '中国农业银行广州分行 6228****9012'
        },
        {
          id: 'CL2026004',
          claimNo: 'CL20260512004',
          relatedPolicyNo: 'PI2026004567',
          insuranceCompany: '大地保险',
          buyerName: 'MNO GmbH',
          claimType: 'arrears',
          claimTypeName: '买方拖欠',
          lossDescription: '买方MNO GmbH拖欠货款USD 28,000，逾期已超90天，邮件及电话催收无效',
          estimatedLossAmount: 28000,
          claimAmount: null,
          lossDate: '2026-04-20',
          lossCurrency: 'USD',
          lossLocation: '汉堡',
          currentStep: 1,
          currentStepName: '报案提交',
          warningLevel: 'safe',
          clerkId: 'C001',
          clerkName: '李明',
          delegationAgreement: [],
          serviceFeePaid: false,
          serviceFeeVoucher: [],
          deductible: null,
          claimDecision: null,
          calculatedLoss: null,
          payoutVoucher: [],
          evidenceMaterials: [{ name: '催收邮件记录.pdf', category: 'collection' }],
          relevantDocuments: [{ name: '贸易合同.pdf', category: 'contract' }, { name: '商业发票.pdf', category: 'invoice' }],
          rwaSyncStatus: 'pending',
          docStatus: 'passed',
          docReviewComment: '资料完整，初审通过',
          supplementCount: 0,
          preparedDocs: [
            { name: '可能损失通知书.pdf', category: 'appNotice' },
            { name: '索赔申请书.pdf', category: 'claimForm' },
            { name: '贸易合同.pdf', category: 'tradeContract' },
            { name: '商业发票.pdf', category: 'invoice' }
          ],
          supplementedDocs: [],
          clerkConfirmed: true,
          lossNotified: true,
          lossNotifiedTime: '2026-05-13 10:30:00',
          insurerNotified: true,
          insurerNotifiedTime: '2026-05-12 16:30:00',
          status: 'pending_contract_sign',
          statusName: '待签署委托合同',
          createTime: '2026-05-12 09:00:00',
          claimContact: '赵六',
          claimPhone: '13600136004',
          claimEmail: 'zhaoliu@example.com',
          bankAccount: '招商银行上海分行 6214****3456'
        },
        {
          id: 'CL2026005',
          claimNo: 'CL20260510005',
          relatedPolicyNo: 'PI2026005678',
          insuranceCompany: '中国信保',
          buyerName: 'PQR Ltd',
          claimType: 'arrears',
          claimTypeName: '买方拖欠',
          lossDescription: '买方PQR Ltd拖欠货款USD 65,000，已通过三方催收仍无进展',
          estimatedLossAmount: 65000,
          claimAmount: null,
          lossDate: '2026-04-01',
          lossCurrency: 'USD',
          lossLocation: '新加坡',
          currentStep: 1,
          currentStepName: '报案提交',
          warningLevel: 'safe',
          clerkId: 'C003',
          clerkName: '王芳',
          delegationAgreement: [
            { name: '委托追偿合同_cayk_legal_2026.pdf', signed: true },
            { name: '授权委托书_authorization_2026.pdf', signed: true }
          ],
          serviceFeePaid: false,
          serviceFeeVoucher: [],
          deductible: null,
          claimDecision: null,
          calculatedLoss: null,
          payoutVoucher: [],
          evidenceMaterials: [{ name: '催收记录汇总.pdf', category: 'collection' }, { name: '三方催收报告.pdf', category: 'thirdParty' }],
          relevantDocuments: [{ name: '贸易合同.pdf', category: 'contract' }, { name: '形式发票.pdf', category: 'invoice' }],
          rwaSyncStatus: 'pending',
          docStatus: 'passed',
          docReviewComment: '资料完整，初审通过，合同已签署',
          supplementCount: 0,
          preparedDocs: [
            { name: '可能损失通知书.pdf', category: 'appNotice' },
            { name: '索赔申请书.pdf', category: 'claimForm' },
            { name: '贸易合同.pdf', category: 'tradeContract' },
            { name: '商业发票.pdf', category: 'invoice' }
          ],
          supplementedDocs: [],
          clerkConfirmed: true,
          lossNotified: true,
          lossNotifiedTime: '2026-05-11 11:00:00',
          insurerNotified: true,
          insurerNotifiedTime: '2026-05-10 15:00:00',
          status: 'pending_payment',
          statusName: '待支付服务费',
          createTime: '2026-05-10 11:00:00',
          claimContact: '钱七',
          claimPhone: '13500135005',
          claimEmail: 'qianqi@example.com',
          bankAccount: '中国银行杭州分行 6217****7890'
        },
        {
          id: 'CL2026006',
          claimNo: 'CL20260506006',
          relatedPolicyNo: 'PI2026006789',
          insuranceCompany: '大地保险',
          buyerName: 'STV SA',
          claimType: 'goods_damage',
          claimTypeName: '货物损失',
          lossDescription: '货物在运输途中因海运事故受损，经检验损失比例约60%',
          estimatedLossAmount: 45000,
          claimAmount: null,
          lossDate: '2026-04-25',
          lossCurrency: 'USD',
          lossLocation: '马六甲海峡',
          currentStep: 5,
          currentStepName: '理赔收回',
          warningLevel: 'safe',
          clerkId: 'C001',
          clerkName: '李明',
          delegationAgreement: [
            { name: '委托追偿合同_cayk_legal_2026.pdf', signed: true },
            { name: '授权委托书_authorization_2026.pdf', signed: true }
          ],
          serviceFeePaid: true,
          serviceFeeVoucher: [{ name: '服务费支付凭证_20260507.png', size: 512000 }],
          deductible: 1500,
          claimDecision: 'approved',
          calculatedLoss: 45000,
          claimAmount: 34500,
          payoutVoucher: [{ name: '赔付到账水单_20260509.pdf', size: 1024000 }],
          evidenceMaterials: [{ name: '货损检验报告.pdf', category: 'surveyReport' }, { name: '海事声明.pdf', category: 'seaProtests' }],
          relevantDocuments: [{ name: '提单.pdf', category: 'billoflading' }, { name: '商业发票.pdf', category: 'invoice' }, { name: '装箱单.pdf', category: 'packingList' }],
          rwaSyncStatus: 'pending',
          docStatus: 'passed',
          docReviewComment: '资料完整，损失核定确认',
          supplementCount: 0,
          preparedDocs: [
            { name: '可能损失通知书.pdf', category: 'appNotice' },
            { name: '索赔申请书.pdf', category: 'claimForm' },
            { name: '贸易合同.pdf', category: 'tradeContract' },
            { name: '商业发票.pdf', category: 'invoice' },
            { name: '货损检验报告.pdf', category: 'surveyReport' }
          ],
          supplementedDocs: [],
          clerkConfirmed: true,
          lossNotified: true,
          lossNotifiedTime: '2026-05-07 09:00:00',
          insurerNotified: true,
          insurerNotifiedTime: '2026-05-06 16:00:00',
          status: 'payment_received',
          statusName: '赔付到账',
          createTime: '2026-05-06 14:00:00',
          claimContact: '孙八',
          claimPhone: '13400134006',
          claimEmail: 'sunba@example.com',
          bankAccount: '中国工商银行成都分行 6222****2345'
        },
        {
          id: 'CL2026007',
          claimNo: 'CL20260425007',
          relatedPolicyNo: 'PI2026001234',
          insuranceCompany: '人保财险',
          buyerName: 'ABC Corporation',
          claimType: 'arrears',
          claimTypeName: '买方拖欠',
          lossDescription: '买方ABC Corporation拖欠货款已全额赔付，案件结清',
          estimatedLossAmount: 80000,
          claimAmount: 64000,
          lossDate: '2026-03-15',
          lossCurrency: 'USD',
          lossLocation: '深圳',
          currentStep: 5,
          currentStepName: '理赔收回',
          warningLevel: 'safe',
          clerkId: 'C001',
          clerkName: '李明',
          delegationAgreement: [
            { name: '委托追偿合同_cayk_legal_2026.pdf', signed: true },
            { name: '授权委托书_authorization_2026.pdf', signed: true }
          ],
          serviceFeePaid: true,
          serviceFeeVoucher: [{ name: '服务费支付凭证_20260426.png', size: 480000 }],
          deductible: 2000,
          claimDecision: 'approved',
          calculatedLoss: 80000,
          payoutVoucher: [{ name: '赔付到账水单_20260430.pdf', size: 2048000 }],
          evidenceMaterials: [{ name: '催收记录.pdf', category: 'collection' }],
          relevantDocuments: [{ name: '贸易合同.pdf', category: 'contract' }, { name: '商业发票.pdf', category: 'invoice' }],
          rwaSyncStatus: 'synced',
          docStatus: 'passed',
          docReviewComment: '资料完整，已全额赔付',
          supplementCount: 0,
          preparedDocs: [
            { name: '可能损失通知书.pdf', category: 'appNotice' },
            { name: '索赔申请书.pdf', category: 'claimForm' },
            { name: '贸易合同.pdf', category: 'tradeContract' },
            { name: '商业发票.pdf', category: 'invoice' }
          ],
          supplementedDocs: [],
          clerkConfirmed: true,
          lossNotified: true,
          lossNotifiedTime: '2026-04-26 10:00:00',
          insurerNotified: true,
          insurerNotifiedTime: '2026-04-25 15:00:00',
          status: 'completed',
          statusName: '已完成',
          createTime: '2026-04-25 10:00:00',
          claimContact: '张三',
          claimPhone: '13800138001',
          claimEmail: 'zhangsan@example.com',
          bankAccount: '中国工商银行深圳分行 6222****1234'
        }
      ]
      this.processTasks = [
        {
          id: 'PT20260522001',
          policyNo: 'PI2026008901',
          companyName: '广州AA进出口公司',
          taskType: '投保流程',
          status: 'pending',
          statusName: '待处理',
          currentStep: 1,
          stepsCompleted: 0,
          startTime: '2026-05-22 09:00:00',
          endTime: '',
          stepOptions: [
            { label: '提交投保申请', value: 1 },
            { label: '资料审核', value: 2 },
            { label: '资信调查', value: 3 },
            { label: '信用限额审批', value: 4 },
            { label: '核保出单', value: 5 },
            { label: '缴费生效', value: 6 }
          ],
          stepInfo: [
            { handler: '张经理(广州AA)', startTime: '2026-05-22 09:00:00', endTime: '2026-05-22 09:30:00' },
            { handler: '', startTime: '', endTime: '' },
            { handler: '', startTime: '', endTime: '' },
            { handler: '', startTime: '', endTime: '' },
            { handler: '', startTime: '', endTime: '' },
            { handler: '', startTime: '', endTime: '' }
          ],
          formData: {
            step1: {
              insurancePlan: 'planA',
              insuranceCompany: 'company1',
              matchRule: '根据买方资信评估结果推荐短期出口信用保险方案。',
              approvalResult: '',
              auditOpinion: ''
            },
            step2: { approvalResult: '', auditOpinion: '' },
            step3: { approvalResult: '', auditOpinion: '' },
            step4: { checkedItems: [], approvalResult: '', auditOpinion: '' },
            step5: { policyNo: '', issueDate: '', policyFile: [], approvalResult: '', auditOpinion: '' },
            step6: { premiumAmount: '', paymentStatus: 'unpaid', paymentReceipt: [], policyDetailFile: [], rateFile: [], approvalResult: '', auditOpinion: '' }
          },
          step2Docs: { applicationForm: false, buyerInfoForm: false },
          planLabels: {
            planA: '方案A - 短期出口信用保险',
            planB: '方案B - 中长期出口信用保险',
            planC: '方案C - 国内贸易信用保险'
          },
          companyLabels: {
            company1: '中国出口信用保险公司',
            company2: '平安财产保险',
            company3: '太平洋财产保险'
          }
        },
        {
          id: 'PT20260521002',
          policyNo: 'PI2026005679',
          companyName: '杭州BB科技有限公司',
          taskType: '投保流程',
          status: 'processing',
          statusName: '处理中',
          currentStep: 2,
          stepsCompleted: 1,
          startTime: '2026-05-21 10:00:00',
          endTime: '',
          stepOptions: [
            { label: '提交投保申请', value: 1 },
            { label: '资料审核', value: 2 },
            { label: '资信调查', value: 3 },
            { label: '信用限额审批', value: 4 },
            { label: '核保出单', value: 5 },
            { label: '缴费生效', value: 6 }
          ],
          stepInfo: [
            { handler: '李敏(杭州BB)', startTime: '2026-05-21 10:00:00', endTime: '2026-05-21 10:30:00' },
            { handler: '刘主管(跟单员)', startTime: '2026-05-21 14:00:00', endTime: '' },
            { handler: '', startTime: '', endTime: '' },
            { handler: '', startTime: '', endTime: '' },
            { handler: '', startTime: '', endTime: '' },
            { handler: '', startTime: '', endTime: '' }
          ],
          formData: {
            step1: {
              insurancePlan: 'planB',
              insuranceCompany: 'company2',
              matchRule: '根据买方资信评估结果，推荐中长期出口信用保险方案。',
              approvalResult: 'approved',
              auditOpinion: '方案合理，同意提交。'
            },
            step2: { approvalResult: '', auditOpinion: '' },
            step3: { approvalResult: '', auditOpinion: '' },
            step4: { checkedItems: [], approvalResult: '', auditOpinion: '' },
            step5: { policyNo: '', issueDate: '', policyFile: [], approvalResult: '', auditOpinion: '' },
            step6: { premiumAmount: '', paymentStatus: 'unpaid', paymentReceipt: [], policyDetailFile: [], rateFile: [], approvalResult: '', auditOpinion: '' }
          },
          step2Docs: { applicationForm: true, buyerInfoForm: false },
          planLabels: {
            planA: '方案A - 短期出口信用保险',
            planB: '方案B - 中长期出口信用保险',
            planC: '方案C - 国内贸易信用保险'
          },
          companyLabels: {
            company1: '中国出口信用保险公司',
            company2: '平安财产保险',
            company3: '太平洋财产保险'
          }
        },
        {
          id: 'PT20260520003',
          policyNo: 'PI2026001234',
          companyName: '深圳XX国际贸易有限公司',
          taskType: '投保流程',
          status: 'processing',
          statusName: '处理中',
          currentStep: 3,
          stepsCompleted: 2,
          startTime: '2026-05-20 09:00:00',
          endTime: '',
          stepOptions: [
            { label: '提交投保申请', value: 1 },
            { label: '资料审核', value: 2 },
            { label: '资信调查', value: 3 },
            { label: '信用限额审批', value: 4 },
            { label: '核保出单', value: 5 },
            { label: '缴费生效', value: 6 }
          ],
          stepInfo: [
            { handler: '张经理(深圳XX)', startTime: '2026-05-20 09:00:00', endTime: '2026-05-20 09:45:00' },
            { handler: '刘主管(跟单员)', startTime: '2026-05-20 10:00:00', endTime: '2026-05-20 14:00:00' },
            { handler: '王五(资信调查)', startTime: '2026-05-21 09:00:00', endTime: '' },
            { handler: '', startTime: '', endTime: '' },
            { handler: '', startTime: '', endTime: '' },
            { handler: '', startTime: '', endTime: '' }
          ],
          formData: {
            step1: {
              insurancePlan: 'planA',
              insuranceCompany: 'company1',
              matchRule: '根据各保险公司行业风险清单、国家（地区）分类表设定匹配规则，结合买方资质、贸易背景等因素综合评估后推荐此方案。',
              approvalResult: 'approved',
              auditOpinion: '方案符合客户需求，风险等级可控，同意通过。'
            },
            step2: {
              approvalResult: 'approved',
              auditOpinion: '申请资料齐全，同意提交资信调查。'
            },
            step3: { approvalResult: '', auditOpinion: '' },
            step4: { checkedItems: [], approvalResult: '', auditOpinion: '' },
            step5: { policyNo: '', issueDate: '', policyFile: [], approvalResult: '', auditOpinion: '' },
            step6: { premiumAmount: '', paymentStatus: 'unpaid', paymentReceipt: [], policyDetailFile: [], rateFile: [], approvalResult: '', auditOpinion: '' }
          },
          step2Docs: { applicationForm: true, buyerInfoForm: true },
          planLabels: {
            planA: '方案A - 短期出口信用保险',
            planB: '方案B - 中长期出口信用保险',
            planC: '方案C - 国内贸易信用保险'
          },
          companyLabels: {
            company1: '中国出口信用保险公司',
            company2: '平安财产保险',
            company3: '太平洋财产保险'
          }
        },
        {
          id: 'PT20260519004',
          policyNo: 'PI2026003456',
          companyName: '成都CC贸易有限公司',
          taskType: '投保流程',
          status: 'processing',
          statusName: '处理中',
          currentStep: 4,
          stepsCompleted: 3,
          startTime: '2026-05-19 09:00:00',
          endTime: '',
          stepOptions: [
            { label: '提交投保申请', value: 1 },
            { label: '资料审核', value: 2 },
            { label: '资信调查', value: 3 },
            { label: '信用限额审批', value: 4 },
            { label: '核保出单', value: 5 },
            { label: '缴费生效', value: 6 }
          ],
          stepInfo: [
            { handler: '王芳(成都CC)', startTime: '2026-05-19 09:00:00', endTime: '2026-05-19 09:30:00' },
            { handler: '刘主管(跟单员)', startTime: '2026-05-19 10:00:00', endTime: '2026-05-19 15:00:00' },
            { handler: '王五(资信调查)', startTime: '2026-05-20 09:00:00', endTime: '2026-05-20 17:00:00' },
            { handler: '赵六(限额审批)', startTime: '2026-05-21 09:00:00', endTime: '' },
            { handler: '', startTime: '', endTime: '' },
            { handler: '', startTime: '', endTime: '' }
          ],
          formData: {
            step1: {
              insurancePlan: 'planA',
              insuranceCompany: 'company1',
              matchRule: '根据买方资信评估结果推荐短期出口信用保险方案。',
              approvalResult: 'approved',
              auditOpinion: '方案合理，同意。'
            },
            step2: {
              approvalResult: 'approved',
              auditOpinion: '资料齐全，审核通过。'
            },
            step3: {
              approvalResult: 'approved',
              auditOpinion: '资信调查完成，买方信用评级为A级，建议通过。'
            },
            step4: { checkedItems: ['basicInfo', 'documentCheck', 'riskAssessment'], approvalResult: '', auditOpinion: '' },
            step5: { policyNo: '', issueDate: '', policyFile: [], approvalResult: '', auditOpinion: '' },
            step6: { premiumAmount: '', paymentStatus: 'unpaid', paymentReceipt: [], policyDetailFile: [], rateFile: [], approvalResult: '', auditOpinion: '' }
          },
          step2Docs: { applicationForm: true, buyerInfoForm: true },
          planLabels: {
            planA: '方案A - 短期出口信用保险',
            planB: '方案B - 中长期出口信用保险',
            planC: '方案C - 国内贸易信用保险'
          },
          companyLabels: {
            company1: '中国出口信用保险公司',
            company2: '平安财产保险',
            company3: '太平洋财产保险'
          }
        },
        {
          id: 'PT20260517005',
          policyNo: 'PI2026007788',
          companyName: '武汉DD工贸有限公司',
          taskType: '投保流程',
          status: 'processing',
          statusName: '处理中',
          currentStep: 5,
          stepsCompleted: 4,
          startTime: '2026-05-17 09:00:00',
          endTime: '',
          stepOptions: [
            { label: '提交投保申请', value: 1 },
            { label: '资料审核', value: 2 },
            { label: '资信调查', value: 3 },
            { label: '信用限额审批', value: 4 },
            { label: '核保出单', value: 5 },
            { label: '缴费生效', value: 6 }
          ],
          stepInfo: [
            { handler: '李敏(武汉DD)', startTime: '2026-05-17 09:00:00', endTime: '2026-05-17 09:30:00' },
            { handler: '刘主管(跟单员)', startTime: '2026-05-17 10:00:00', endTime: '2026-05-17 14:00:00' },
            { handler: '王五(资信调查)', startTime: '2026-05-18 09:00:00', endTime: '2026-05-18 16:00:00' },
            { handler: '赵六(限额审批)', startTime: '2026-05-19 09:00:00', endTime: '2026-05-19 15:00:00' },
            { handler: '钱七(核保出单)', startTime: '2026-05-20 09:00:00', endTime: '' },
            { handler: '', startTime: '', endTime: '' }
          ],
          formData: {
            step1: {
              insurancePlan: 'planC',
              insuranceCompany: 'company3',
              matchRule: '根据国内贸易信用保险方案评估推荐。',
              approvalResult: 'approved',
              auditOpinion: '方案合理，同意。'
            },
            step2: {
              approvalResult: 'approved',
              auditOpinion: '资料审核通过。'
            },
            step3: {
              approvalResult: 'approved',
              auditOpinion: '资信调查完成，买方信用评级为AA级。'
            },
            step4: {
              checkedItems: ['basicInfo', 'documentCheck', 'riskAssessment'],
              approvalResult: 'approved',
              auditOpinion: '信息校验通过，风险评估为低风险，同意审批。'
            },
            step5: { policyNo: 'POL20260602005', issueDate: '', policyFile: [], approvalResult: '', auditOpinion: '' },
            step6: { premiumAmount: '¥18,000.00', paymentStatus: 'unpaid', paymentReceipt: [], policyDetailFile: [], rateFile: [], approvalResult: '', auditOpinion: '' }
          },
          step2Docs: { applicationForm: true, buyerInfoForm: true },
          planLabels: {
            planA: '方案A - 短期出口信用保险',
            planB: '方案B - 中长期出口信用保险',
            planC: '方案C - 国内贸易信用保险'
          },
          companyLabels: {
            company1: '中国出口信用保险公司',
            company2: '平安财产保险',
            company3: '太平洋财产保险'
          }
        },
        {
          id: 'PT20260510006',
          policyNo: 'PI2026009900',
          companyName: '上海EE国际贸易有限公司',
          taskType: '投保流程',
          status: 'completed',
          statusName: '已完成',
          currentStep: 6,
          stepsCompleted: 6,
          startTime: '2026-05-10 09:00:00',
          endTime: '2026-05-18 17:00:00',
          stepOptions: [
            { label: '提交投保申请', value: 1 },
            { label: '资料审核', value: 2 },
            { label: '资信调查', value: 3 },
            { label: '信用限额审批', value: 4 },
            { label: '核保出单', value: 5 },
            { label: '缴费生效', value: 6 }
          ],
          stepInfo: [
            { handler: '陈经理(上海EE)', startTime: '2026-05-10 09:00:00', endTime: '2026-05-10 11:00:00' },
            { handler: '刘主管(跟单员)', startTime: '2026-05-11 10:00:00', endTime: '2026-05-11 15:00:00' },
            { handler: '王五(资信调查)', startTime: '2026-05-12 09:00:00', endTime: '2026-05-12 12:00:00' },
            { handler: '赵六(限额审批)', startTime: '2026-05-13 09:00:00', endTime: '2026-05-14 11:00:00' },
            { handler: '钱七(核保出单)', startTime: '2026-05-15 09:00:00', endTime: '2026-05-15 16:30:00' },
            { handler: '孙八(缴费处理)', startTime: '2026-05-18 09:00:00', endTime: '2026-05-18 15:00:00' }
          ],
          formData: {
            step1: {
              insurancePlan: 'planB',
              insuranceCompany: 'company2',
              matchRule: '根据买方资信评估结果，推荐中长期出口信用保险方案。',
              approvalResult: 'approved',
              auditOpinion: '方案合理，同意。'
            },
            step2: {
              approvalResult: 'approved',
              auditOpinion: '资料已审核，无误。'
            },
            step3: {
              approvalResult: 'approved',
              auditOpinion: '申请已提交。'
            },
            step4: {
              checkedItems: ['basicInfo', 'documentCheck'],
              approvalResult: 'approved',
              auditOpinion: '校验通过。'
            },
            step5: {
              policyNo: 'POL20260602002',
              issueDate: '2026-05-18',
              policyFile: [{ name: '保单文件.pdf' }],
              approvalResult: 'approved',
              auditOpinion: '保单已签发。'
            },
            step6: {
              premiumAmount: '¥10,000.00',
              paymentStatus: 'paid',
              paymentReceipt: [{ name: '支付凭证.pdf' }],
              policyDetailFile: [],
              rateFile: [],
              approvalResult: 'approved',
              auditOpinion: '已支付。'
            }
          },
          step2Docs: { applicationForm: true, buyerInfoForm: true },
          planLabels: {
            planA: '方案A - 短期出口信用保险',
            planB: '方案B - 中长期出口信用保险',
            planC: '方案C - 国内贸易信用保险'
          },
          companyLabels: {
            company1: '中国出口信用保险公司',
            company2: '平安财产保险',
            company3: '太平洋财产保险'
          }
        },
        {
          id: 'PT20260508007',
          policyNo: 'PI2026005678',
          companyName: '北京ZZ贸易集团',
          taskType: '投保流程',
          status: 'completed',
          statusName: '已完成',
          currentStep: 6,
          stepsCompleted: 6,
          startTime: '2026-05-08 09:00:00',
          endTime: '2026-05-16 17:00:00',
          stepOptions: [
            { label: '提交投保申请', value: 1 },
            { label: '资料审核', value: 2 },
            { label: '资信调查', value: 3 },
            { label: '信用限额审批', value: 4 },
            { label: '核保出单', value: 5 },
            { label: '缴费生效', value: 6 }
          ],
          stepInfo: [
            { handler: '赵经理(北京ZZ)', startTime: '2026-05-08 09:00:00', endTime: '2026-05-08 10:30:00' },
            { handler: '刘主管(跟单员)', startTime: '2026-05-09 10:00:00', endTime: '2026-05-09 14:00:00' },
            { handler: '王五(资信调查)', startTime: '2026-05-10 09:00:00', endTime: '2026-05-10 16:00:00' },
            { handler: '赵六(限额审批)', startTime: '2026-05-13 09:00:00', endTime: '2026-05-14 11:00:00' },
            { handler: '钱七(核保出单)', startTime: '2026-05-15 09:00:00', endTime: '2026-05-15 16:30:00' },
            { handler: '孙八(缴费处理)', startTime: '2026-05-16 09:00:00', endTime: '2026-05-16 17:00:00' }
          ],
          formData: {
            step1: {
              insurancePlan: 'planA',
              insuranceCompany: 'company1',
              matchRule: '根据买方资信评估结果，推荐短期出口信用保险方案。',
              approvalResult: 'approved',
              auditOpinion: '方案合理，同意。'
            },
            step2: {
              approvalResult: 'approved',
              auditOpinion: '资料齐全，审核通过。'
            },
            step3: {
              approvalResult: 'approved',
              auditOpinion: '资信调查完成，买方信用评级为A+级。'
            },
            step4: {
              checkedItems: ['basicInfo', 'documentCheck', 'riskAssessment'],
              approvalResult: 'approved',
              auditOpinion: '所有校验通过，同意审批。'
            },
            step5: {
              policyNo: 'POL20260602007',
              issueDate: '2026-05-15',
              policyFile: [{ name: '保单文件.pdf' }],
              approvalResult: 'approved',
              auditOpinion: '保单已签发。'
            },
            step6: {
              premiumAmount: '¥15,000.00',
              paymentStatus: 'paid',
              paymentReceipt: [{ name: '支付凭证.pdf' }],
              policyDetailFile: [{ name: '保单明细表.pdf' }],
              rateFile: [{ name: '费率表.pdf' }],
              approvalResult: 'approved',
              auditOpinion: '保费已支付，流程完成。'
            }
          },
          step2Docs: { applicationForm: true, buyerInfoForm: true },
          planLabels: {
            planA: '方案A - 短期出口信用保险',
            planB: '方案B - 中长期出口信用保险',
            planC: '方案C - 国内贸易信用保险'
          },
          companyLabels: {
            company1: '中国出口信用保险公司',
            company2: '平安财产保险',
            company3: '太平洋财产保险'
          }
        }
      ]
      // Seed external policies - 电子保单上传列表
      if (this.externalPolicies.length === 0) {
        this.externalPolicies = [
          {
            id: 'EP2026001',
            customerCompany: '深圳XX国际贸易有限公司',
            originalFileName: 'export_credit_policy_2026.pdf',
            originalFile: [{ name: 'export_credit_policy_2026.pdf', url: '#', size: 4567890, type: 'application/pdf' }],
            ocrStatus: 'pending',
            status: 'pending_ocr',
            rejectReason: '',
            policyNo: '',
            insuranceCompany: '',
            insurerName: '',
            policyholder: '深圳XX国际贸易有限公司',
            insured: '',
            beneficiary: '',
            effectiveDate: '',
            expiryDate: '',
            insurancePeriod: '',
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
            idlePeriod: 0,
            surrenderFee: '',
            recoveryPayee: '',
            premiumPaymentMethod: '',
            premiumPaymentDeadline: '',
            fileSize: '4.5 MB',
            uploadUser: '张伟华',
            createTime: '2026-05-20 14:30:00',
            updateTime: '2026-05-20 14:30:00'
          },
          {
            id: 'EP2026002',
            customerCompany: '深圳XX国际贸易有限公司',
            originalFileName: 'trade_credit_policy.pdf',
            originalFile: [{ name: 'trade_credit_policy.pdf', url: '#', size: 2890123, type: 'application/pdf' }],
            ocrStatus: 'completed',
            status: 'ocr_completed',
            rejectReason: '',
            policyNo: 'EXTPI2025002',
            insuranceCompany: '太保产险',
            insurerName: '太保产险广东分公司',
            policyholder: '深圳XX国际贸易有限公司',
            insured: 'ABC Corporation',
            beneficiary: '深圳XX国际贸易有限公司',
            effectiveDate: '2026-02-01',
            expiryDate: '2027-02-01',
            insurancePeriod: '12个月',
            renewalFlag: '否',
            coverageAmount: 200000,
            currency: 'USD',
            premiumRate: 0.022,
            premium: 4400,
            maxCompensationLimit: 200000,
            buyerCreditLimit: 150000,
            deductible: 1500,
            coveredRisks: '商业风险—买方破产或无力偿付债务；商业风险—买方拖欠；政治风险',
            clauseVersion: '短期出口信用保险条款v2025',
            countryRiskVersion: '2026版',
            declarationMethod: '月度',
            declarationCycle: '月度',
            declarationDeadline: '次月15日',
            tradeBusinessType: '货物贸易',
            selfControlledLimit: '',
            idlePeriod: 60,
            surrenderFee: '',
            recoveryPayee: '被保险人',
            premiumPaymentMethod: '一次性',
            premiumPaymentDeadline: '保险起期前30日',
            fileSize: '2.8 MB',
            uploadUser: '张伟华',
            createTime: '2026-05-18 09:15:00',
            updateTime: '2026-05-19 11:00:00'
          },
          {
            id: 'EP2026003',
            customerCompany: '上海YY进出口公司',
            originalFileName: 'policy_picc_2025.pdf',
            originalFile: [{ name: 'policy_picc_2025.pdf', url: '#', size: 3210456, type: 'application/pdf' }],
            ocrStatus: 'completed',
            status: 'active',
            rejectReason: '',
            policyNo: 'EXTPI2025003',
            insuranceCompany: '人保财险',
            insurerName: '人保财险上海分公司',
            policyholder: '上海YY进出口公司',
            insured: 'DEF GmbH',
            beneficiary: '上海YY进出口公司',
            effectiveDate: '2025-10-01',
            expiryDate: '2026-10-01',
            insurancePeriod: '12个月',
            renewalFlag: '否',
            coverageAmount: 300000,
            currency: 'USD',
            premiumRate: 0.02,
            premium: 6000,
            maxCompensationLimit: 300000,
            buyerCreditLimit: 200000,
            deductible: 2000,
            coveredRisks: '商业风险',
            clauseVersion: '短期出口信用保险条款v2024',
            countryRiskVersion: '2025版',
            declarationMethod: '月度',
            declarationCycle: '月度',
            declarationDeadline: '次月15日',
            tradeBusinessType: '货物贸易',
            selfControlledLimit: '',
            idlePeriod: 60,
            surrenderFee: '',
            recoveryPayee: '被保险人',
            premiumPaymentMethod: '一次性',
            premiumPaymentDeadline: '保险起期前30日',
            fileSize: '3.1 MB',
            uploadUser: '李明辉',
            createTime: '2026-05-15 16:45:00',
            updateTime: '2026-05-17 09:30:00'
          }
        ]
        // Add a policy entry for the active external policy (EP2026003)
        const ep3 = this.externalPolicies[2]
        if (!this.policies.find(p => p.policyNo === ep3.policyNo)) {
          this.policies.unshift({
            id: 'P_EXT_' + ep3.id,
            policyNo: ep3.policyNo,
            insuranceCompany: ep3.insuranceCompany,
            policyholder: ep3.policyholder,
            insured: ep3.insured,
            coverageAmount: ep3.coverageAmount,
            premium: ep3.premium,
            effectiveDate: ep3.effectiveDate,
            expiryDate: ep3.expiryDate,
            status: 'active',
            statusName: '有效',
            usedQuota: 150000,
            remainingQuota: 150000,
            currency: ep3.currency
          })
        }
        // For the ocr_completed external policy (EP2026002), create linked insuranceApplication
        const ep2 = this.externalPolicies[1]
        if (!this.insuranceApplications.some(a => a.externalPolicyId === ep2.id)) {
          this.insuranceApplications.unshift({
            id: `TB_EXT_${ep2.id}`,
            companyName: ep2.customerCompany,
            buyerName: ep2.insured,
            insuranceType: '短期出口信用保险',
            preferredInsuranceOrgType: '无偏好',
            insuranceCurrency: ep2.currency,
            insuranceAmount: ep2.coverageAmount,
            expectedInsurancePeriod: [ep2.effectiveDate, ep2.expiryDate],
            status: 'ocr_pending',
            createTime: ep2.createTime,
            updateTime: ep2.updateTime,
            ocrSource: true,
            externalPolicyId: ep2.id,
            ocrPolicyNo: ep2.policyNo,
            ocrInsuranceCompany: ep2.insuranceCompany,
            ocrPolicyholder: ep2.policyholder,
            ocrInsurerName: ep2.insurerName,
            ocrBeneficiary: ep2.beneficiary,
            ocrCoverageAmount: ep2.coverageAmount,
            ocrPremium: ep2.premium,
            ocrPremiumRate: ep2.premiumRate,
            ocrMaxCompensation: ep2.maxCompensationLimit,
            ocrBuyerCreditLimit: ep2.buyerCreditLimit,
            ocrBusinessType: ep2.tradeBusinessType
          })
        }
      }
      // Seed OCR-based insurance applications for 长安银科 (direct OCR, not from upload)
      if (!this.insuranceApplications.some(a => a.ocrSource && !a.externalPolicyId)) {
        const now = new Date()
        this.insuranceApplications.push({
          id: `TB${now.getFullYear()}OCR01`,
          companyName: '长安银科',
          buyerName: 'Global Tech Inc.',
          insuranceType: '短期出口信用保险',
          preferredInsuranceOrgType: '无偏好',
          insuranceCurrency: 'USD',
          insuranceAmount: 300000,
          expectedInsurancePeriod: ['2026-06-01', '2027-05-31'],
          status: 'ocr_pending',
          createTime: formatDateTime(now),
          updateTime: formatDateTime(now),
          ocrSource: true,
          ocrPolicyNo: `PI${now.getFullYear()}OCR001`,
          ocrInsuranceCompany: '人保财险',
          ocrPolicyholder: '长安银科',
          ocrCoverageAmount: 300000,
          ocrPremium: 7500,
          ocrBusinessType: 'goods'
        })
      }
      // Seed contracts at various signing flow statuses
      if (this.contracts.length === 0) {
        this.contracts = [
          {
            id: 'CT20260520001',
            policyNo: 'PI2026006789',
            companyName: '成都DD商贸有限公司',
            insuredName: 'PQR Ltd',
            insuranceCompany: '太保产险',
            coverageAmount: 450000,
            premium: 11250,
            policyStartDate: '2026-05-20',
            policyEndDate: '2027-05-20',
            status: 'inkasso_signed',
            paymentStatus: 'unpaid',
            paymentMethod: '',
            paymentDate: '',
            signDate: '2026-05-21 10:30:00',
            signatory: '长安银科',
            createdAt: '2026-05-20 14:00:00',
            updatedAt: '2026-05-21 10:30:00'
          },
          {
            id: 'CT20260518001',
            policyNo: 'PI2026005678',
            companyName: '杭州CC贸易有限公司',
            insuredName: 'MNO Inc',
            insuranceCompany: '人保财险',
            coverageAmount: 250000,
            premium: 6250,
            policyStartDate: '2026-05-15',
            policyEndDate: '2027-05-15',
            status: 'paid',
            paymentStatus: 'paid',
            paymentMethod: 'alipay',
            paymentDate: '2026-05-18 09:15:00',
            signDate: '2026-05-16 11:00:00',
            signatory: '长安银科',
            createdAt: '2026-05-15 10:00:00',
            updatedAt: '2026-05-18 09:15:00'
          },
          {
            id: 'CT20260512001',
            policyNo: 'PI2026004567',
            companyName: '上海YY进出口公司',
            insuredName: 'DEF GmbH',
            insuranceCompany: '中国信保',
            coverageAmount: 300000,
            premium: 7500,
            policyStartDate: '2026-06-01',
            policyEndDate: '2027-06-01',
            status: 'underwriting_submitted',
            paymentStatus: 'paid',
            paymentMethod: 'bank_transfer',
            paymentDate: '2026-05-10 14:00:00',
            signDate: '2026-05-08 09:30:00',
            signatory: '长安银科',
            underwritingDate: '2026-05-12 16:00:00',
            underwritingSubmittedBy: '赵敏',
            createdAt: '2026-05-08 08:00:00',
            updatedAt: '2026-05-12 16:00:00'
          },
          {
            id: 'CT20260425001',
            policyNo: 'PI2025009876',
            companyName: '北京ZZ贸易集团',
            insuredName: 'GHI Ltd',
            insuranceCompany: '太保产险',
            coverageAmount: 400000,
            premium: 10000,
            policyStartDate: '2026-04-01',
            policyEndDate: '2027-04-01',
            status: 'policy_issued',
            paymentStatus: 'paid',
            paymentMethod: 'alipay',
            paymentDate: '2026-04-20 10:00:00',
            signDate: '2026-04-18 14:30:00',
            signatory: '长安银科',
            underwritingDate: '2026-04-22 11:00:00',
            underwritingSubmittedBy: '李明',
            policyIssuedDate: '2026-04-25 15:00:00',
            createdAt: '2026-04-15 09:00:00',
            updatedAt: '2026-04-25 15:00:00'
          },
          {
            id: 'CT20251018001',
            policyNo: 'PI2025008765',
            companyName: '广州AA实业公司',
            insuredName: 'JKL Co',
            insuranceCompany: '平安产险',
            coverageAmount: 200000,
            premium: 5000,
            policyStartDate: '2025-10-01',
            policyEndDate: '2026-10-01',
            status: 'policy_info_uploaded',
            paymentStatus: 'paid',
            paymentMethod: 'wechat',
            paymentDate: '2025-10-10 09:00:00',
            signDate: '2025-10-08 11:00:00',
            signatory: '长安银科',
            underwritingDate: '2025-10-12 10:00:00',
            underwritingSubmittedBy: '张伟',
            policyIssuedDate: '2025-10-15 14:00:00',
            policyInfo: { policyDocNo: 'PICC2025GZ001', fileType: 'pdf' },
            policyInfoUploadDate: '2025-10-18 16:00:00',
            createdAt: '2025-10-05 08:30:00',
            updatedAt: '2025-10-18 16:00:00'
          },
          {
            id: 'CT20260515002',
            policyNo: 'PI2026009999',
            companyName: '南京FF进出口有限公司',
            insuredName: 'STG Ltd',
            insuranceCompany: '人保财险',
            coverageAmount: 350000,
            premium: 8750,
            policyStartDate: '2026-04-01',
            policyEndDate: '2027-04-01',
            status: 'offline_paid',
            paymentStatus: 'paid',
            paymentMethod: 'bank_transfer',
            paymentDate: '2026-04-20 11:00:00',
            signDate: '2026-04-08 14:00:00',
            signatory: '长安银科',
            underwritingDate: '2026-04-12 09:00:00',
            underwritingSubmittedBy: '李明',
            policyIssuedDate: '2026-04-15 15:00:00',
            policyInfo: { policyDocNo: 'PICC2026NJ001', fileType: 'pdf' },
            policyInfoUploadDate: '2026-04-16 10:00:00',
            offlinePaymentReceipt: [{ name: '缴费凭证_南京FF_202604.pdf', url: '#' }],
            offlinePaymentDate: '2026-04-20 09:30:00',
            offlinePaymentMethod: 'bank_transfer',
            offlinePaymentAmount: 8750,
            createdAt: '2026-04-01 08:00:00',
            updatedAt: '2026-04-20 09:30:00'
          },
          {
            id: 'CT20260501001',
            policyNo: 'PI2026008888',
            companyName: '武汉DD物流有限公司',
            insuredName: 'UVW Corp',
            insuranceCompany: '平安产险',
            coverageAmount: 280000,
            premium: 7000,
            policyStartDate: '2026-03-01',
            policyEndDate: '2027-03-01',
            status: 'insurance_active',
            paymentStatus: 'paid',
            paymentMethod: 'alipay',
            paymentDate: '2026-03-10 15:00:00',
            signDate: '2026-03-05 10:00:00',
            signatory: '长安银科',
            underwritingDate: '2026-03-12 11:00:00',
            underwritingSubmittedBy: '王芳',
            policyIssuedDate: '2026-03-15 14:00:00',
            policyInfo: { policyDocNo: 'PAIC2026WH001', fileType: 'pdf' },
            policyInfoUploadDate: '2026-03-16 16:00:00',
            offlinePaymentReceipt: [{ name: '缴费凭证_武汉DD_202603.pdf', url: '#' }],
            offlinePaymentDate: '2026-03-18 09:00:00',
            offlinePaymentMethod: 'bank_transfer',
            offlinePaymentAmount: 7000,
            insuranceActiveDate: '2026-03-20 10:00:00',
            createdAt: '2026-03-01 08:00:00',
            updatedAt: '2026-03-20 10:00:00'
          }
        ]
      }
      // Seed payment records for contracts
      if (this.payments.length === 0) {
        this.payments = [
          { id: 'PAY20260518091500', policyNo: 'PI2026005678', companyName: '杭州CC贸易有限公司', amount: 6250, method: 'alipay', status: 'success', paidAt: '2026-05-18 09:15:00' },
          { id: 'PAY20260510140000', policyNo: 'PI2026004567', companyName: '上海YY进出口公司', amount: 7500, method: 'bank_transfer', status: 'success', paidAt: '2026-05-10 14:00:00' },
          { id: 'PAY20260420100000', policyNo: 'PI2025009876', companyName: '北京ZZ贸易集团', amount: 10000, method: 'alipay', status: 'success', paidAt: '2026-04-20 10:00:00' },
          { id: 'PAY20251010090000', policyNo: 'PI2025008765', companyName: '广州AA实业公司', amount: 5000, method: 'wechat', status: 'success', paidAt: '2025-10-10 09:00:00' },
          { id: 'PAY20260420093000', policyNo: 'PI2026009999', companyName: '南京FF进出口有限公司', amount: 8750, method: 'bank_transfer', status: 'success', paidAt: '2026-04-20 09:30:00' },
          { id: 'PAY20260318100000', policyNo: 'PI2026008888', companyName: '武汉DD物流有限公司', amount: 7000, method: 'alipay', status: 'success', paidAt: '2026-03-18 10:00:00' }
        ]
      }
      this.clerkList = [
        { id: 'C001', workNo: 'C001', name: '李明', department: '业务部', phone: '138****1234', email: 'liming@cayk.com', status: 'active', customerCount: 8, joinDate: '2023-01-15', role: 'senior', permissions: ['insurance_view', 'insurance_edit', 'policy_view', 'policy_edit', 'claim_view', 'stats_view'] },
        { id: 'C002', workNo: 'C002', name: '赵敏', department: '业务部', phone: '139****5678', email: 'zhaomin@cayk.com', status: 'active', customerCount: 6, joinDate: '2023-03-20', role: 'normal', permissions: ['insurance_view', 'policy_view', 'claim_view', 'stats_view'] },
        { id: 'C003', workNo: 'C003', name: '王芳', department: '客服部', phone: '137****9012', email: 'wangfang@cayk.com', status: 'active', customerCount: 5, joinDate: '2024-06-01', role: 'normal', permissions: ['insurance_view', 'policy_view', 'claim_view'] },
        { id: 'C004', workNo: 'C004', name: '张伟', department: '业务部', phone: '136****3456', email: 'zhangwei@cayk.com', status: 'probation', customerCount: 3, joinDate: '2026-04-01', role: 'normal', permissions: ['insurance_view', 'policy_view'] },
        { id: 'C005', workNo: 'C005', name: '刘强', department: '风控部', phone: '135****7890', email: 'liuqiang@cayk.com', status: 'active', customerCount: 0, joinDate: '2024-02-28', role: 'admin', permissions: ['insurance_view', 'insurance_edit', 'policy_view', 'policy_edit', 'claim_view', 'claim_edit', 'clerk_view', 'clerk_manage', 'stats_view', 'stats_export'] }
      ]
      // Seed trade information
      if (this.tradeInfos.length === 0) {
        this.tradeInfos = [
          {
            id: 'TR2026001',
            contractNo: 'CT20260001',
            enterpriseName: '深圳XX国际贸易有限公司',
            buyerName: 'ABC Corporation',
            buyerCountry: '美国',
            productInfo: '消费电子产品及零部件',
            transactionAmount: 500000,
            currency: 'USD',
            paymentTerms: 'OA 60天',
            signDate: '2026-01-15',
            expireDate: '2027-01-14',
            status: '进行中',
            relatedPolicyNo: 'PI2026001234'
          },
          {
            id: 'TR2026002',
            contractNo: 'CT20260002',
            enterpriseName: '上海YY进出口公司',
            buyerName: 'DEF GmbH',
            buyerCountry: '德国',
            productInfo: '工业机械设备及配件',
            transactionAmount: 300000,
            currency: 'USD',
            paymentTerms: 'OA 90天',
            signDate: '2026-03-01',
            expireDate: '2027-02-28',
            status: '进行中',
            relatedPolicyNo: 'PI2026004567'
          },
          {
            id: 'TR2026003',
            contractNo: 'CT20250003',
            enterpriseName: '北京ZZ贸易集团',
            buyerName: 'GHI Ltd',
            buyerCountry: '英国',
            productInfo: '机械设备及零部件',
            transactionAmount: 400000,
            currency: 'USD',
            paymentTerms: 'OA 60天',
            signDate: '2025-10-01',
            expireDate: '2026-09-30',
            status: '已完成',
            relatedPolicyNo: 'PI2025009876'
          },
          {
            id: 'TR2026004',
            contractNo: 'CT20260004',
            enterpriseName: '广州AA实业公司',
            buyerName: 'JKL Co',
            buyerCountry: '日本',
            productInfo: '日用百货及工艺品',
            transactionAmount: 200000,
            currency: 'USD',
            paymentTerms: 'OA 45天',
            signDate: '2025-12-01',
            expireDate: '2026-11-30',
            status: '进行中',
            relatedPolicyNo: 'PI2025008765'
          },
          {
            id: 'TR2026005',
            contractNo: 'CT20260005',
            enterpriseName: '南京FF进出口有限公司',
            buyerName: 'STG Ltd',
            buyerCountry: '新加坡',
            productInfo: '电子产品及元器件',
            transactionAmount: 350000,
            currency: 'USD',
            paymentTerms: 'LC at sight',
            signDate: '2026-04-01',
            expireDate: '2027-03-31',
            status: '进行中',
            relatedPolicyNo: 'PI2026009999'
          },
          {
            id: 'TR2026006',
            contractNo: 'CT20260006',
            enterpriseName: '武汉DD物流有限公司',
            buyerName: 'UVW Corp',
            buyerCountry: '加拿大',
            productInfo: '物流设备及配件',
            transactionAmount: 280000,
            currency: 'USD',
            paymentTerms: 'OA 30天',
            signDate: '2026-03-01',
            expireDate: '2027-02-28',
            status: '进行中',
            relatedPolicyNo: 'PI2026008888'
          }
        ]
      }
      // Seed subsidy data
      if (this.subsidies.length === 0) {
        this.subsidies = [
          {
            id: 'SB2026001',
            policyNo: 'PI2026001234',
            enterpriseName: '深圳XX国际贸易有限公司',
            subsidyType: '保费补贴',
            applicationDate: '2026-02-01',
            subsidyAmount: 2500,
            status: 'approved',
            statusName: '已批复',
            approveDate: '2026-02-15',
            remark: '市级出口信用保险保费补贴',
            attachment: [{ name: '保费补贴申请表_深圳XX.pdf' }]
          },
          {
            id: 'SB2026002',
            policyNo: 'PI2025009876',
            enterpriseName: '北京ZZ贸易集团',
            subsidyType: '保费补贴',
            applicationDate: '2026-04-15',
            subsidyAmount: 2000,
            status: 'pending',
            statusName: '待审批',
            approveDate: '',
            remark: '省级外贸转型升级补贴',
            attachment: [{ name: '保费补贴申请表_北京ZZ.pdf' }]
          },
          {
            id: 'SB2026003',
            policyNo: 'PI2026004567',
            enterpriseName: '上海YY进出口公司',
            subsidyType: '费率优惠',
            applicationDate: '2026-05-10',
            subsidyAmount: 1500,
            status: 'pending',
            statusName: '待审批',
            approveDate: '',
            remark: '中小企业出口信用保险支持',
            attachment: [{ name: '费率优惠申请_上海YY.pdf' }]
          },
          {
            id: 'SB2026004',
            policyNo: 'PI2025008765',
            enterpriseName: '广州AA实业公司',
            subsidyType: '保费补贴',
            applicationDate: '2025-11-01',
            subsidyAmount: 1800,
            status: 'completed',
            statusName: '已到账',
            approveDate: '2025-11-20',
            remark: '市级出口信用保险保费补贴',
            attachment: [{ name: '保费补贴申请表_广州AA.pdf' }]
          },
          {
            id: 'SB2026005',
            policyNo: 'PI2026005678',
            enterpriseName: '杭州CC贸易有限公司',
            subsidyType: '保费补贴',
            applicationDate: '2026-05-20',
            subsidyAmount: 1250,
            status: 'waiting',
            statusName: '待提交',
            approveDate: '',
            remark: '区级外贸扶持资金',
            attachment: []
          }
        ]
      }
    },
    // ===== External policy upload & OCR flow =====
    uploadCustomerPolicy({ file, companyName, uploadUser }) {
      const now = new Date()
      const id = `EP${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
      const record = {
        id,
        customerCompany: companyName || '',
        originalFileName: file?.name || 'unknown.pdf',
        originalFile: file ? [file] : [],
        ocrStatus: 'pending',
        status: 'pending_ocr',
        rejectReason: '',
        policyNo: '',
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
      // OCR records resubmitting don't need attachment validation
      if (cur.ocrSource) {
        this.insuranceApplications[idx] = { ...cur, status: 'pending_review', updateTime: formatDateTime(now) }
        return { ok: true, data: this.insuranceApplications[idx] }
      }
      const missing = []
      if (!hasFile(cur.businessLicense)) missing.push('企业法人营业执照扫描件')
      if (!hasFile(cur.importExportQualification)) missing.push('对外贸易经营者备案登记表')
      if (!hasFile(cur.authorizationDocument)) missing.push('授权保险公司联系买方的签字文件')
      if (missing.length > 0) return { ok: false, message: `提交失败：缺少必传附件（${missing.join('、')}）` }
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
            coverageAmount: Number(cur.insuranceAmount) || 0,
            premium: Number(cur.ocrPremium) || 0,
            effectiveDate: cur.expectedInsurancePeriod?.[0] || formatDate(now),
            expiryDate: cur.expectedInsurancePeriod?.[1] || addDays(formatDate(now), 365),
            status: 'active',
            usedQuota: 0,
            remainingQuota: Number(cur.insuranceAmount) || 0,
            currency: cur.insuranceCurrency || 'USD',
            businessType: 'goods',
            renewalFlag: 'no'
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
      return { ok: true, data: this.tradeInfos[idx] }
    },
    deleteTradeInfo(id) {
      const idx = this.tradeInfos.findIndex(t => t.id === id)
      if (idx < 0) return { ok: false, message: '贸易信息不存在' }
      this.tradeInfos.splice(idx, 1)
      return { ok: true }
    },
    // ===== Subsidy Management =====
    createSubsidy(payload) {
      const now = new Date()
      const item = {
        id: payload.id || createId('SB'),
        policyNo: payload.policyNo || '',
        enterpriseName: payload.enterpriseName || '',
        subsidyType: payload.subsidyType || '保费补贴',
        applicationDate: payload.applicationDate || formatDate(now),
        subsidyAmount: Number(payload.subsidyAmount) || 0,
        status: payload.status || 'waiting',
        statusName: payload.statusName || '待提交',
        approveDate: '',
        remark: payload.remark || '',
        attachment: payload.attachment || []
      }
      this.subsidies.unshift(item)
      return { ok: true, data: item }
    },
    submitSubsidy(id) {
      const cur = this.subsidies.find(s => s.id === id)
      if (!cur) return { ok: false, message: '补贴记录不存在' }
      if (cur.status !== 'waiting') return { ok: false, message: '当前状态不允许提交' }
      cur.status = 'pending'
      cur.statusName = '待审批'
      cur.applicationDate = formatDate(new Date())
      return { ok: true, data: cur }
    },
    approveSubsidy(id) {
      const cur = this.subsidies.find(s => s.id === id)
      if (!cur) return { ok: false, message: '补贴记录不存在' }
      if (cur.status !== 'pending') return { ok: false, message: '当前状态不允许审批' }
      cur.status = 'approved'
      cur.statusName = '已批复'
      cur.approveDate = formatDate(new Date())
      return { ok: true, data: cur }
    },
    completeSubsidy(id) {
      const cur = this.subsidies.find(s => s.id === id)
      if (!cur) return { ok: false, message: '补贴记录不存在' }
      if (cur.status !== 'approved') return { ok: false, message: '当前状态不允许完成' }
      cur.status = 'completed'
      cur.statusName = '已到账'
      return { ok: true, data: cur }
    },
    rejectSubsidy(id) {
      const cur = this.subsidies.find(s => s.id === id)
      if (!cur) return { ok: false, message: '补贴记录不存在' }
      if (cur.status !== 'pending') return { ok: false, message: '当前状态不允许驳回' }
      cur.status = 'waiting'
      cur.statusName = '待提交'
      return { ok: true, data: cur }
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
      if (cur.status !== 'pending_clerk_review') return { ok: false, message: '当前状态不允许通过' }
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
          currency: cur.currency
        })
      }
      return { ok: true, data: cur }
    },

    rejectExternalPolicy(id, rejectReason) {
      const cur = this.externalPolicies.find(p => p.id === id)
      if (!cur) return { ok: false, message: '记录不存在' }
      if (cur.status !== 'pending_clerk_review') return { ok: false, message: '当前状态不允许驳回' }
      if (!rejectReason?.trim()) return { ok: false, message: '请填写驳回原因' }
      cur.status = 'rejected'
      cur.rejectReason = rejectReason
      cur.updateTime = formatDateTime(new Date())
      return { ok: true, data: cur }
    },

    deleteExternalPolicy(id) {
      const idx = this.externalPolicies.findIndex(p => p.id === id)
      if (idx < 0) return { ok: false, message: '记录不存在' }
      this.externalPolicies.splice(idx, 1)
      return { ok: true }
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
    }
  }
})
