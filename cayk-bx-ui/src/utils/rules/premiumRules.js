/**
 * 保费规则引擎
 * - 保费未缴冻结：保费超期未缴 → 冻结该保单下所有出运申报权限
 * - 逾期提醒
 */

export const PREMIUM_STATUS_MAP = {
  paid: { label: '已缴', theme: 'success' },
  unpaid: { label: '未缴', theme: 'warning' },
  overdue: { label: '逾期未缴', theme: 'danger' },
  partial: { label: '部分缴纳', theme: 'warning' },
  waived: { label: '免缴', theme: 'default' }
}

/**
 * 检查保单保费状态
 * @param {Object} policy - 保单对象
 * @param {string} today - 当前日期 YYYY-MM-DD
 * @returns {Object} { status, isFrozen, message, theme }
 */
export function checkPolicyPremiumStatus(policy, today) {
  if (!policy) return { status: 'unknown', isFrozen: false, message: '', theme: 'default' }

  const premiumStatus = policy.premiumStatus || 'paid'

  if (premiumStatus === 'overdue') {
    return {
      status: 'overdue',
      isFrozen: true,
      message: `保费逾期未缴！请在缴清保费后恢复申报权限`,
      theme: 'danger'
    }
  }

  if (premiumStatus === 'unpaid') {
    return {
      status: 'unpaid',
      isFrozen: true,
      message: '保费未缴纳，请完成缴费后继续操作',
      theme: 'warning'
    }
  }

  // 检查缴费期限是否已到
  if (premiumStatus === 'pending' && policy.premiumDeadline) {
    const deadline = new Date(policy.premiumDeadline)
    const now = today ? new Date(today) : new Date()
    if (deadline < now) {
      return {
        status: 'overdue',
        isFrozen: true,
        message: `缴费期限已过（${policy.premiumDeadline}），保费逾期未缴`,
        theme: 'danger'
      }
    }
    const daysUntilDeadline = Math.floor((deadline - now) / (1000 * 60 * 60 * 24))
    if (daysUntilDeadline <= 7) {
      return {
        status: 'pending',
        isFrozen: false,
        message: `缴费期限将至（${policy.premiumDeadline}），还剩 ${daysUntilDeadline} 天`,
        theme: 'warning'
      }
    }
  }

  return { status: premiumStatus, isFrozen: false, message: '', theme: 'success' }
}

/**
 * 获取保单的保费预警信息列表
 * @param {Array} policies - 所有保单列表
 * @returns {Array} 保费异常保单列表
 */
export function getPremiumAlerts(policies) {
  if (!policies?.length) return []

  return policies
    .map(p => {
      const check = checkPolicyPremiumStatus(p)
      return check.isFrozen || check.status === 'pending'
        ? { policy: p, alert: check }
        : null
    })
    .filter(Boolean)
}
