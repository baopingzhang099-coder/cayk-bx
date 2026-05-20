/**
 * 理赔规则引擎
 * - 4家公司差异化理赔规则（报案时限/调查时限/赔付时限/报案方式/追偿周期）
 */

export const COMPANY_CLAIM_RULES = {
  '中国信保': {
    reportDeadline: '风险发生后30日内（拖欠）/10工作日（破产/拒收/政治风险）',
    reportMethod: '中国国际贸易单一窗口/客服热线95387',
    investigatePeriod: '简单15日/复杂4个月',
    compensatePeriod: '核赔后10日支付',
    recoursePeriod: '赔付后6个月内启动，通常1-3年完成',
    requiredDocs: ['出险通知书', '贸易合同', '商业发票', '提单/运单', '报关单', '买方拒收证明/拖欠证明']
  },
  '人保财险': {
    reportDeadline: '风险发生后10日内',
    reportMethod: 'APP/95518/线下网点',
    investigatePeriod: '简单10工作日/复杂30日',
    compensatePeriod: '达成协议后10日/最长60日',
    recoursePeriod: '3个月内启动，通常6个月-2年完成',
    requiredDocs: ['出险通知书', '贸易合同', '商业发票', '提单/运单', '报关单', '损失证明']
  },
  '太保产险': {
    reportDeadline: '拖欠30日/其他10工作日',
    reportMethod: '官网/APP/95500',
    investigatePeriod: '30工作日出具结论',
    compensatePeriod: '核赔后10日支付',
    recoursePeriod: '6个月内启动，通常1-2年完成',
    requiredDocs: ['出险通知书', '贸易合同', '商业发票', '提单/运单', '损失证明']
  },
  '太平洋保险': {
    reportDeadline: '拖欠30日/其他10工作日',
    reportMethod: '官网/APP',
    investigatePeriod: '30工作日出具结论',
    compensatePeriod: '核赔后10日支付',
    recoursePeriod: '6个月内启动，通常1-2年完成',
    requiredDocs: ['出险通知书', '贸易合同', '商业发票', '提单/运单', '损失证明']
  },
  '平安产险': {
    reportDeadline: '风险发生后10日内',
    reportMethod: '平安好车主APP/95511',
    investigatePeriod: '小额24小时/大额15日',
    compensatePeriod: '小额24小时/大额10日',
    recoursePeriod: '3个月内启动，通常6个月-1年完成',
    requiredDocs: ['出险通知书', '贸易合同', '商业发票', '提单/运单', '报关单']
  },
  '大地保险': {
    reportDeadline: '风险发生后30日内',
    reportMethod: '95590/线下网点',
    investigatePeriod: '小额24小时/大额45工作日',
    compensatePeriod: '小额24小时/大额10日',
    recoursePeriod: '3个月内启动，通常6个月-1年完成',
    requiredDocs: ['出险通知书', '贸易合同', '商业发票', '提单/运单', '报关单']
  },
  '裕利安宜': {
    reportDeadline: '风险发生后30日内',
    reportMethod: '在线平台',
    investigatePeriod: '30工作日',
    compensatePeriod: '核赔后15日',
    recoursePeriod: '6个月内启动',
    requiredDocs: ['出险通知书', '贸易合同', '商业发票', '提单/运单']
  },
  '科法斯': {
    reportDeadline: '风险发生后30日内',
    reportMethod: '在线平台',
    investigatePeriod: '30工作日',
    compensatePeriod: '核赔后15日',
    recoursePeriod: '6个月内启动',
    requiredDocs: ['出险通知书', '贸易合同', '商业发票', '提单/运单']
  }
}

export function getClaimRule(company) {
  return COMPANY_CLAIM_RULES[company] || {
    reportDeadline: '以保单条款为准',
    reportMethod: '以保单条款为准',
    investigatePeriod: '以保单条款为准',
    compensatePeriod: '以保单条款为准',
    recoursePeriod: '以保单条款为准',
    requiredDocs: ['出险通知书', '贸易合同', '商业发票']
  }
}

/**
 * 检查理赔是否超时限
 * @param {Object} claim - 理赔案件
 * @returns {Object} { isOverdue, overdueType, message }
 */
export function checkClaimDeadline(claim) {
  if (!claim) return { isOverdue: false, message: '' }

  const rule = getClaimRule(claim.insuranceCompany)
  const now = new Date()
  const reportDate = claim.createTime ? new Date(claim.createTime) : null

  if (!reportDate) return { isOverdue: false, message: '' }

  // 简单判断：报案超过30天未定损 → 超时预警
  const daysSinceReport = Math.floor((now - reportDate) / (1000 * 60 * 60 * 24))
  if (daysSinceReport > 30 && claim.status === 'pending') {
    return {
      isOverdue: true,
      overdueType: 'pending',
      message: `报案已 ${daysSinceReport} 天，超过常规处理时限，${rule.reportDeadline}`,
      deadline: rule.reportDeadline
    }
  }

  return { isOverdue: false, message: '' }
}
