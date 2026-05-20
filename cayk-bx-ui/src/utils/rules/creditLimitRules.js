/**
 * 信用限额规则引擎
 * - 闲置预警/撤销：距上次出运 >60天 → 黄色预警；>90天 → 自动撤销
 * - 集中度限制：单一买方 ≤20%、单一国家 ≤30%
 * - 限额冻结/下调：买方出现逾期/风险信号 → 冻结/下调
 */

/**
 * 检查限额是否被冻结/下调
 * @param {Object} limit - 限额对象
 * @param {Array} claims - 理赔案件列表
 * @returns {Object} { isFrozen, frozenReason, frozenDate, level, message }
 */
export function checkFrozenStatus(limit, claims) {
  if (!limit) return { isFrozen: false, message: '', level: 'normal' }

  // 显式冻结状态
  if (limit.status === 'frozen') {
    return {
      isFrozen: true,
      frozenReason: limit.freezeReason || '保险公司通知冻结',
      frozenDate: limit.freezeDate || limit.updateTime,
      level: 'danger',
      message: `该买方限额已被冻结${limit.freezeReason ? '（' + limit.freezeReason + '）' : ''}。已出运未收汇部分仍受保障，新出运不可使用原限额`,
      canUnfreeze: limit.canUnfreeze || false
    }
  }

  // 自动检测：买方有逾期>30天的未结案理赔 → 建议冻结
  if (claims?.length && limit.status === 'active') {
    const activeClaims = claims.filter(c =>
      c.buyerName === limit.buyerName &&
      c.status !== 'completed' && c.status !== 'rejected' && c.status !== 'closed'
    )
    if (activeClaims.length > 0) {
      const overdueClaims = activeClaims.filter(c => {
        if (!c.createTime) return false
        const daysSinceReport = Math.floor(
          (Date.now() - new Date(c.createTime).getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysSinceReport > 30
      })
      if (overdueClaims.length > 0) {
        return {
          isFrozen: false,
          autoDetected: true,
          overdueDays: Math.floor(
            (Date.now() - new Date(overdueClaims[0].createTime).getTime()) / (1000 * 60 * 60 * 24)
          ),
          level: 'warning',
          message: `买方 "${limit.buyerName}" 有逾期超30天的未结案理赔，建议关注限额状态`
        }
      }
    }
  }

  return { isFrozen: false, message: '', level: 'normal' }
}

export function checkIdleStatus(limit, shipments) {
  if (!limit || !shipments?.length) return { level: 'normal', message: '' }

  const buyerShipments = shipments.filter(
    s => s.buyerName === limit.buyerName && s.status !== 'cancelled'
  )
  if (!buyerShipments.length) return { level: 'normal', message: '' }

  const lastShipment = buyerShipments.sort(
    (a, b) => new Date(b.shipmentDate) - new Date(a.shipmentDate)
  )[0]

  const daysSinceLastShipment = Math.floor(
    (Date.now() - new Date(lastShipment.shipmentDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceLastShipment > 90) {
    return {
      level: 'danger',
      message: `距上次出运已 ${daysSinceLastShipment} 天（>90天），建议撤销该限额（不可逆操作）`,
      daysSinceLastShipment,
      autoRevoke: true
    }
  }

  if (daysSinceLastShipment > 60) {
    return {
      level: 'warning',
      message: `距上次出运已 ${daysSinceLastShipment} 天（>60天），请关注使用情况`,
      daysSinceLastShipment,
      autoRevoke: false
    }
  }

  return { level: 'normal', message: '', daysSinceLastShipment, autoRevoke: false }
}

export function checkConcentration(limit, allLimits) {
  if (!limit || !allLimits?.length) return { warnings: [] }

  const warnings = []

  // 单一买方集中度
  const totalLimit = allLimits.reduce((s, c) => s + (Number(c.appliedLimit) || 0), 0)
  if (totalLimit > 0) {
    const buyerRatio = (Number(limit.appliedLimit) || 0) / totalLimit
    if (buyerRatio > 0.3) {
      warnings.push({
        level: 'danger',
        message: `该买方限额占比 ${(buyerRatio * 100).toFixed(1)}%（>30%），超出推荐集中度`,
        type: 'buyer_concentration'
      })
    } else if (buyerRatio > 0.2) {
      warnings.push({
        level: 'warning',
        message: `该买方限额占比 ${(buyerRatio * 100).toFixed(1)}%（>20%），接近集中度上限30%`,
        type: 'buyer_concentration'
      })
    }
  }

  // 单一国家集中度
  if (limit.buyerCountry) {
    const countryTotal = allLimits
      .filter(c => c.buyerCountry === limit.buyerCountry)
      .reduce((s, c) => s + (Number(c.appliedLimit) || 0), 0)
    if (totalLimit > 0) {
      const countryRatio = countryTotal / totalLimit
      if (countryRatio > 0.3) {
        warnings.push({
          level: 'danger',
          message: `"${limit.buyerCountry}" 国家限额占比 ${(countryRatio * 100).toFixed(1)}%（>30%），超出推荐集中度`,
          type: 'country_concentration'
        })
      }
    }
  }

  return { warnings }
}

export function getStatusTag(limit, shipments, claims) {
  if (limit.status === 'frozen') return { theme: 'danger', label: '已冻结' }
  const freezeCheck = checkFrozenStatus(limit, claims)
  if (freezeCheck.autoDetected) return { theme: 'warning', label: '冻结预警' }
  const idle = checkIdleStatus(limit, shipments)
  if (idle.level === 'danger') return { theme: 'danger', label: '闲置待撤销' }
  if (idle.level === 'warning') return { theme: 'warning', label: '闲置预警' }
  if (limit.status === 'active') return { theme: 'success', label: '正常' }
  return { theme: 'default', label: limit.statusName || limit.status }
}
