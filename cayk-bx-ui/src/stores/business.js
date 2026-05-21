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
    payments: []
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
          id: 'TB2026004',
          companyName: '广州XX科技有限公司',
          unifiedSocialCreditCode: '91440100XXXXXXXXXX',
          registeredAddress: '广州市天河区科技园XX路XX号',
          businessAddress: '广州市天河区科技园XX路XX号',
          organizationCode: 'G401234-6',
          establishmentYear: '2018',
          legalRepresentative: '陈志强',
          enterpriseNature: '民营企业',
          businessType: '科技公司',
          contactName: '陈经理',
          contactPosition: '外贸主管',
          contactPhone: '136****5555',
          companyEmail: 'chen@gz-xx.com',
          exportBusinessHistory: '1-3年',
          exportMainCountries: ['韩国', '日本'],
          mainExportIndustry: '电子',
          expectedInsurableTurnover: 2000000,
          turnoverCurrency: 'USD',
          mainPaymentMethods: 'T/T',
          mostUsedPaymentTerm: 30,
          longestPaymentTerm: 60,
          hasLongerCreditPeriod: '否',
          insuranceType: '短期出口信用保险',
          preferredInsuranceOrgType: '商业性保险机构',
          insuranceBusinessScope: '全部适保业务',
          insuranceCurrency: 'USD',
          insuranceAmount: 200000,
          expectedInsurancePeriod: ['2026-05-01', '2027-04-30'],
          buyerName: 'Samsung Electronics',
          buyerCountry: '韩国',
          buyerAddress: '123 Samsung-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do, Korea',
          cooperationYearsWithBuyer: '1-3年',
          last12MonthExportAmount: 180,
          last12MonthCreditSalesAmount: 150,
          expectedNext12MonthCreditSales: 200,
          creditSalesCurrency: 'USD',
          paymentTerms: 'T/T 30天',
          appliedCreditLimit: 200000,
          creditLimitCurrency: 'USD',
          exportProductCategory: '电子元器件',
          involvesControlledGoods: '否',
          hasTitleRetentionClause: '否',
          businessLicense: [{ name: '营业执照.pdf' }],
          importExportQualification: [{ name: '进出口资质.pdf' }],
          tradeContract: null,
          customsDeclaration: null,
          authorizationDocument: [{ name: '授权文件.pdf' }],
          declarationSignature: '陈志强',
          declarationDate: '2026-05-10',
          companySeal: [{ name: '公章文件.pdf' }],
          status: 'clerk_review',
          createTime: '2026-05-10',
          updateTime: '2026-05-12 16:30:00'
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
        },
        {
          id: 'CL2026004',
          buyerName: 'JKL Co',
          buyerCountry: '日本',
          appliedLimit: 200000,
          usedLimit: 50000,
          remainingLimit: 150000,
          usageRate: 25,
          status: 'frozen',
          effectiveDate: '2026-01-15',
          expiryDate: '2027-01-14',
          freezeDate: '2026-05-10',
          freezeReason: '买方逾期超30天且未回应催款通知',
          canUnfreeze: false
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
      this.processTasks = [
        {
          id: 'PT20260520001',
          policyNo: 'PI2026001234',
          companyName: '深圳XX国际贸易有限公司',
          taskType: '投保流程',
          startTime: '2026-05-18 09:00:00',
          endTime: '2026-05-20 15:30:00',
          stepsCompleted: 7,
          status: 'completed',
          statusName: '已完成',
          stepOptions: [
            { label: '提交投保申请', value: 1 },
            { label: '资料审核', value: 2 },
            { label: '资信调查', value: 3 },
            { label: '信用限额审批', value: 4 },
            { label: '核保出单', value: 5 },
            { label: '缴费生效', value: 6 }
          ],
          stepInfo: [
            { handler: '张三', startTime: '2026-05-18 09:00:00', endTime: '2026-05-18 10:30:00' },
            { handler: '李四', startTime: '2026-05-18 10:30:00', endTime: '2026-05-18 14:00:00' },
            { handler: '王五', startTime: '2026-05-19 09:00:00', endTime: '2026-05-19 11:00:00' },
            { handler: '赵六', startTime: '2026-05-19 11:00:00', endTime: '2026-05-19 16:00:00' },
            { handler: '钱七', startTime: '2026-05-20 09:00:00', endTime: '2026-05-20 11:30:00' },
            { handler: '孙八', startTime: '2026-05-20 13:00:00', endTime: '2026-05-20 14:30:00' }
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
              auditOpinion: '申请资料齐全，同意提交。'
            },
            step3: {
              approvalResult: 'approved',
              auditOpinion: '投保申请材料完整，同意提交审核。'
            },
            step4: {
              checkedItems: ['basicInfo', 'documentCheck', 'riskAssessment'],
              approvalResult: 'approved',
              auditOpinion: '基本信息校验通过，资料完整，风险评估为低风险，同意流转。'
            },
            step5: {
              policyNo: 'POL20260602001',
              issueDate: '2026-05-20',
              policyFile: [{ name: '保单文件.pdf' }],
              approvalResult: 'approved',
              auditOpinion: '保单已签发，信息无误。'
            },
            step6: {
              premiumAmount: '¥12,500.00',
              paymentStatus: 'paid',
              paymentReceipt: [{ name: '支付凭证.pdf' }],
              policyDetailFile: [{ name: '保单明细表.pdf' }],
              rateFile: [{ name: '费率表.pdf' }],
              approvalResult: 'approved',
              auditOpinion: '保费已支付，流程完成。'
            }
          },
          step2Docs: {
            applicationForm: true,
            buyerInfoForm: true
          },
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
          id: 'PT20260519002',
          policyNo: 'PI2026005678',
          companyName: '北京ZZ贸易集团',
          taskType: '投保流程',
          startTime: '2026-05-10 09:00:00',
          endTime: '2026-05-19 17:00:00',
          stepsCompleted: 7,
          status: 'completed',
          statusName: '已完成',
          stepOptions: [
            { label: '提交投保申请', value: 1 },
            { label: '资料审核', value: 2 },
            { label: '资信调查', value: 3 },
            { label: '信用限额审批', value: 4 },
            { label: '核保出单', value: 5 },
            { label: '缴费生效', value: 6 }
          ],
          stepInfo: [
            { handler: '陈经理', startTime: '2026-05-10 09:00:00', endTime: '2026-05-10 11:00:00' },
            { handler: '刘主管', startTime: '2026-05-11 10:00:00', endTime: '2026-05-11 15:00:00' },
            { handler: '王五', startTime: '2026-05-12 09:00:00', endTime: '2026-05-12 12:00:00' },
            { handler: '赵六', startTime: '2026-05-13 09:00:00', endTime: '2026-05-14 11:00:00' },
            { handler: '钱七', startTime: '2026-05-15 09:00:00', endTime: '2026-05-15 16:30:00' },
            { handler: '孙八', startTime: '2026-05-18 09:00:00', endTime: '2026-05-18 15:00:00' }
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
          step2Docs: {
            applicationForm: true,
            buyerInfoForm: true
          },
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
      if (!['draft', 'rejected'].includes(cur.status)) {
        return { ok: false, message: '当前状态不允许提交' }
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
      if (cur.status !== 'pending_review') {
        return { ok: false, message: '仅"待确认"状态允许申请跟单员确认' }
      }
      this.insuranceApplications[idx] = { ...cur, status: 'clerk_review', updateTime: formatDateTime(now) }
      return { ok: true, data: this.insuranceApplications[idx] }
    },
    approveInsuranceApplication(id) {
      const idx = this.insuranceApplications.findIndex(it => it.id === id)
      if (idx < 0) return { ok: false, message: '投保记录不存在' }
      const now = new Date()
      const cur = this.insuranceApplications[idx]
      if (!['pending_review', 'clerk_review'].includes(cur.status)) {
        return { ok: false, message: '当前状态不允许确认完成' }
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
      if (!['pending_review', 'clerk_review'].includes(cur.status)) {
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
    addCompletedProcessTask(task) {
      this.processTasks.unshift({
        id: task.id || createId('PT'),
        policyNo: task.policyNo || '',
        companyName: task.companyName || '',
        taskType: '投保流程',
        startTime: task.startTime || '',
        endTime: task.endTime || '',
        stepsCompleted: task.stepsCompleted || 7,
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
