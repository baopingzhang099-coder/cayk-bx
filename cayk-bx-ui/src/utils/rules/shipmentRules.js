/**
 * 出运申报规则引擎
 * - 8家公司差异化申报规则
 * - 续保空窗期控制
 */

export const COMPANY_RULES = {
  '中国信保': { deadline: '次月15日前', method: '中国国际贸易单一窗口/客服热线95387', penalty: '补缴 + 滞纳金', theme: 'warning' },
  '人保财险': { deadline: '次月10日前', method: '线下网点/APP', penalty: '补缴 + 滞纳金', theme: 'warning' },
  '太保产险': { deadline: '次月15日前', method: '官网/APP/95500', penalty: '补缴', theme: 'info' },
  '太平洋保险': { deadline: '次月15日前', method: '官网/APP', penalty: '补缴', theme: 'info' },
  '平安产险': { deadline: '次月10日前', method: 'APP实时', penalty: '自动提醒', theme: 'success' },
  '裕利安宜': { deadline: '次月10日前', method: '在线平台', penalty: '补缴', theme: 'info' },
  '安裕': { deadline: '次月10日前', method: '在线平台', penalty: '补缴', theme: 'info' },
  '科法斯': { deadline: '次月15日前', method: '在线平台', penalty: '补缴', theme: 'info' },
  '香港信保局': { deadline: '次月15日前', method: '在线/线下', penalty: '补缴', theme: 'info' }
}

export function getCompanyRule(insuranceCompany) {
  return COMPANY_RULES[insuranceCompany] || { deadline: '以保单条款为准', method: '-', penalty: '-', theme: 'info' }
}

/**
 * 检查续保空窗期
 * @param {Object} policy - 保单对象
 * @returns {Object} { hasGapWarning, gapDays, message, level }
 */
export function checkRenewalGap(policy) {
  if (!policy?.expiryDate) return { hasGapWarning: false, gapDays: 0, message: '', level: 'normal' }

  const expiry = new Date(policy.expiryDate)
  const today = new Date()
  const daysToExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24))

  // 空窗期：已过期后仍在申报
  if (daysToExpiry < 0) {
    return {
      hasGapWarning: true,
      gapDays: Math.abs(daysToExpiry),
      message: `保单已过期 ${Math.abs(daysToExpiry)} 天，处于空窗期！请立即续保以避免保障中断`,
      level: 'danger'
    }
  }

  // 即将到期
  if (daysToExpiry <= 30) {
    return {
      hasGapWarning: true,
      gapDays: daysToExpiry,
      message: `保单将于 ${daysToExpiry} 天后到期，请及时办理续保手续。到期后将暂停出运申报权限`,
      level: 'warning'
    }
  }

  return { hasGapWarning: false, gapDays: daysToExpiry, message: '', level: 'normal' }
}

/**
 * 检查保费缴纳状态
 * @param {Object} policy - 保单对象
 * @returns {Object} { isFrozen, message, level }
 */
export function checkPremiumStatus(policy) {
  if (!policy) return { isFrozen: false, message: '', level: 'normal' }

  // premiumStatus: 'paid' | 'overdue' | 'unpaid'
  const status = policy.premiumStatus || 'paid'

  if (status === 'overdue') {
    return {
      isFrozen: true,
      message: `保费超期未缴，该保单下所有出运申报已冻结。请尽快缴纳保费（${policy.premium ? '$' + policy.premium : ''}）`,
      level: 'danger'
    }
  }

  if (status === 'unpaid') {
    return {
      isFrozen: true,
      message: '保费未缴纳，请完成缴费后方可进行出运申报',
      level: 'warning'
    }
  }

  return { isFrozen: false, message: '', level: 'normal' }
}
