import * as XLSX from 'xlsx'

function fmt(v) {
  if (v === null || v === undefined || v === '') return ''
  return String(v)
}

function fmtCurrency(v) {
  if (!v && v !== 0) return ''
  const n = Number(v)
  if (isNaN(n)) return String(v)
  return n.toLocaleString()
}

function fmtPeriod(v) {
  if (!v) return ''
  return Array.isArray(v) ? v.join(' ~ ') : String(v)
}

function arrJoin(v, sep) {
  if (!v) return ''
  if (sep === undefined) sep = '、'
  return Array.isArray(v) ? v.join(sep) : String(v)
}

/**
 * Generate 保单申请书 — matching PICC template structure (206 rows x 19 cols)
 * 中国人民财产保险股份有限公司 短期出口贸易信用保险 投保单
 */
export function generatePolicyApplicationXlsx(row, statusMap) {
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: 投保单正本 ──
  // Expanded to 10 columns (0-9) matching the original template's data area
  const data = [
    // Row 0: empty in original
    [],

    // Row 1-2: Header
    ['', '中国人民财产保险股份有限公司  广州市分公司  '],
    ['', '短期出口贸易信用保险  投保单'],

    // Row 3: 尊敬的投保人
    ['', '尊敬的投保人：在您填写本投保单前请先详细阅读《中国人民财产保险股份有限公司短期出口贸易信用保险条款》，阅读条款时请您特别注意条款中的保险责任、责任免除、投保人被保险人义务、赔偿处理等内容并听取保险人就条款(包括前述需特别注意的内容)所作的说明。'],

    // ════════════════════════════════════════════
    // 一、投保人基本情况 (original rows 4-37)
    // ════════════════════════════════════════════
    ['', '一、投保人基本情况'],
    ['', '公司名称', '', '[中文] ' + fmt(row.companyName)],
    ['', '', '[英文]【可选填】'],
    ['', '注册地址', '', fmt(row.registeredAddress)],
    ['', '营业地址', '', fmt(row.businessAddress || row.registeredAddress), '', '邮政编码', ''],
    ['', '组织机构代码', '', fmt(row.unifiedSocialCreditCode || row.organizationCode || ''), '', '邮政编码', ''],
    ['', '成立年份', '', fmt(row.establishmentYear || ''), '', '法定代表人', '', fmt(row.legalRepresentative || '')],
    [],
    ['', '联系人', '', fmt(row.contactName || ''), '', '职务', '', fmt(row.contactPosition || ''), '', '电话', '', fmt(row.contactPhone || '')],
    ['', '传真', '', '', '', '电子邮件', '', fmt(row.companyEmail || '')],
    ['', '代理人', '', '', '', '职务', '', '', '', '电话', '', ''],
    ['', '传真', '', '', '', '电子邮件', '', ''],
    [],
    ['', '企业性质', '', '请选择：', '', fmt(row.enterpriseNature || ''), '', '国有独资', '', '乡镇企业', '', '外国独资'],
    ['', '', '请选择：', '', '国有控股', '', '私营企业', '', '中外合资'],
    ['', '', '请选择：', '', '国有联营', '', '个体企业', '', '中外合作'],
    [],
    ['', '', '贸易公司', '', '上海交易所'],
    ['', '经营性质', '', fmt(row.businessType || ''), '', '贸易代理', '', '深圳交易所'],
    ['', '是否上市', '', '上市地点：', '', '', '上市年份：', '', '', '年', '', '生产型企业', '', '香港联交所'],
    ['', '', '', '', '', '海外'],
    [],
    ['', '拟投保业务范围', '', fmt(row.insuranceBusinessScope || '所有非信用证支付的贸易')],
    ['', '出口业务经营历史', '', fmt(row.exportBusinessHistory || '') + '年开始从事出口业务'],
    ['', '', '即将从事出口业务'],

    // Row 29: empty
    [],

    ['', '', '公司已于', '', fmt(row.establishmentYear || '____') + '年通过', '', '质量认证体系'],
    [],
    ['', '', '', '', '', '专门信用管理部门和专职信用管理的高级经理'],
    [],
    ['', '关联公司名单及关系（可另加清单申报）：'],
    ['', '1.', '', '名称：', '', '', '', '关系：', ''],
    ['', '2.', '', '名称：', '', '', '', '关系：', ''],
    ['', '3.', '', '名称：', '', '', '', '关系：', ''],
    [],
    [],

    // ════════════════════════════════════════════
    // 二、投保人信用管理情况 (original rows 40-59)
    // ════════════════════════════════════════════
    ['', '二、投保人信用管理情况'],
    ['', '（一）政策与制度'],
    ['', '信用管理政策', '', '有明文信用管理规则，任何人不能突破', '', '信用管理规则中明确规定激励体系，全公司员工认同信用控制理念并全员参加'],
    ['', '信用管控激励体系', '', '有明文信用管理规则，有时可以突破', '', '信用管理规则中明确规定激励体系，仅责任人员认同信用控制理念并履行'],
    ['', '信用管理责任人', '', '有明文信用管理规则，仅供业务参考', '', '信用管理规则中未明确规定激励体系，公司量力而行'],
    ['', '', '无明文信用管理规则', '', '无信用控制激励体系'],

    ['', '（二）贸易过程管理'],
    ['', '1、发生逾期时，在多长时间内采取以下措施与买方联系：'],
    ['', '', '天', '', '天', '', '天', '', '天'],
    ['', '', '天'],
    ['', '2、在贸易合同中是否约定物权保留条款？', '', row.hasTitleRetentionClause === '是' ? '是' : '否'],
    ['', '3、当前是否采取有应收账款保障措施（如有，请简要说明）：'],
    [],
    ['', '说明：', '', '专门信用管理部门和专职信用管理的高级经理'],
    ['', '4、发票开票期限：发货后', fmt(row.mostUsedPaymentTerm || '____'), '天', '', '公司高级财务经理'],
    ['', '5、是否对买方实行授信管理？', '', row.appliedCreditLimit ? '是' : '否', '', '专职人员负责，但职位较低'],
    ['', '（1）信息来源：', '', '', '无专职信用管理人员'],
    ['', '（2）信息更新：', '', '', '天更新一次'],
    ['', '（3）授信政策决策者：'],
    ['', '（4）授信调整：', '', '（请详细说明：', '', '）'],
    [],
    [],

    // ════════════════════════════════════════════
    // 三、业务经营情况 (original rows 62-93)
    // ════════════════════════════════════════════
    ['', '三、业务经营情况'],
    ['', '(一)近三年历史业务情况【针对全部出口业务】'],
    ['', '会计年度', '', '出口总额（万美元）', '', '', '赊销总额（万美元）'],
    ['', '2023', '', '', '', '', ''],
    ['', '2024', '', '', '', '', ''],
    ['', '2025', '', '', '', '', ''],
    ['', '(一)近三年历史业务情况【针对全部出口业务】'],
    ['', '会计年度', '', '出口总额（万美元）', '', '', '赊销总额（万美元）'],
    ['', '2023', '', '', '', '', ''],
    ['', '2024', '', '', '', '', ''],
    ['', '2025', '', '', '', '', ''],
    ['', '* 请排除关联企业贸易'],
    ['', '* 赊销：采用信用证（LC）、放账（OA）、D/P、DA等付款方式的销售、不包括预付款、现货现款等。'],
    [],
    ['', '（二）最近一个完整会计年度出口情况'],
    ['', '主要商品或服务', '', '商品名称或服务内容', '', '销售额（万美元）', '', '占比（%）', '', '预计未来一年销售额（万美元）', '', '付款方式及平均账期'],

    // Row 78-81: Data rows with merges
    ['', fmt(row.exportProductCategory || row.mainExportIndustry || ''), '', fmt(row.mainExportIndustry || ''), '', '', '', '', '', row.expectedInsurableTurnover ? fmtCurrency(row.expectedInsurableTurnover) : '', '', fmt(row.mainPaymentMethods || '') + ' ' + (row.mostUsedPaymentTerm ? row.mostUsedPaymentTerm + '天' : '')],
    [],
    [],
    [],
    ['', '*付款方式：信用证（LC）、放账（OA）、D/P、DA、预付款、其他等'],
    [],
    ['', '国家', '', '出口总额（万美元）', '', '', '预计未来一年出口额（万美元）', '', '', '付款方式及平均账期'],
    ['', arrJoin(row.exportMainCountries), '', '', '', '', row.expectedInsurableTurnover ? fmtCurrency(row.expectedInsurableTurnover) : '', '', '', fmt(row.mainPaymentMethods || '')],
    [],
    [],
    [],
    ['', '*如空间不够，可自行另加页'],
    [],
    ['', '（三）预计今年出口业务结构'],
    ['', '支付方式', '', 'LC', '', 'OA', '', 'DP', '', 'DA', '', '预付款', '', '其他'],
    ['', '出口总额（万美元）', '', '', '', '', '', '', '', '', ''],
    [],
    [],

    // ════════════════════════════════════════════
    // 四、出口收汇情况 (original rows 96-142)
    // ════════════════════════════════════════════
    ['', '四、出口收汇情况'],
    ['', '(一)最近一年应收账款余额情况'],
    ['', '日期（2025年）', '', '应收账款余额（万美元）', '', '', '平均账期（天）'],
    ['', '3月31日', '', '', '', '', row.mostUsedPaymentTerm ? fmt(row.mostUsedPaymentTerm) : ''],
    ['', '6月30日', '', '', '', '', ''],
    ['', '9月30日', '', '', '', '', ''],
    ['', '12月31日', '', '', '', '', ''],
    [],
    ['', '(二)应收账款余额分布'],
    ['', '填表截至时间：    年    月    日'],
    ['', '应收账款余额范围(美元)', '', '', '债务人数目', '', '金额'],
    ['', '高于5,000,001', '', '', '', '', ''],
    ['', '3,000,001 – 5,000,000', '', '', '', '', ''],
    ['', '1,000,001 – 3,000,000', '', '', '', '', ''],
    ['', '500,001 – 1000,000', '', '', '', '', ''],
    ['', '250,001 – 500,000', '', '', '', '', ''],
    ['', '100,001 – 250,000', '', '', '', '', ''],
    ['', '50,001 – 100,000', '', '', '', '', ''],
    ['', '低于50,000', '', '', '', '', ''],
    ['', '合计', '', '', '', '', ''],
    [],
    ['', '(三)逾期应收账款分析'],
    ['', '填表截至时间：    年    月    日'],
    ['', '逾期天数', '', '', '金额(美元)', '', '占比(%)', '', '逾期主要原因 *'],
    ['', '未到期余额', '', '', '', '', '', '', ''],
    ['', '逾期1 – 30天', '', '', '', '', '', '', ''],
    ['', '逾期31 – 60天', '', '', '', '', '', '', ''],
    ['', '逾期61 – 90天', '', '', '', '', '', '', ''],
    ['', '逾期91 – 120天', '', '', '', '', '', '', ''],
    ['', '逾期120 – 180天', '', '', '', '', '', '', ''],
    ['', '逾期180天以上', '', '', '', '', '', '', ''],
    ['', '合计', '', '', '', '', '', '', ''],
    ['', '* 请选择代码填写：A=破产、B=拖欠、C=拒绝接受货物、D=贸易纠纷、E=政治风险、F其他（请详细说明）'],
    [],
    ['', '(四)近三年逾期未收汇整体情况'],
    ['', '会计年度', '', '未收汇金额（万美元）', '', '未收汇原因[同上逾期主要原因]', '', '债务人数目', '', '备注（请说明结果等进一步情况）'],
    ['', '无'],
    [],
    [],
    [],
    ['', '(五)最大几笔逾期未收汇详情'],
    ['', '时间(年/月)', '', '债务人全称及地址', '', '', '国家', '', '逾期或损失金额（万美元）', '', '损失原因（同上）', '', '备注（处理现状等）'],
    ['', '无'],
    [],
    [],
    ['', '*如空间不够，可另加页'],
    ['', '*可以近期向外汇管理局报送的逾期未收汇报表复印件代替此表'],
    [],
    [],

    // ════════════════════════════════════════════
    // 五、投保意向 (original rows 145-163)
    // ════════════════════════════════════════════
    ['', '五、投保意向'],
    ['', '（一）投保主要目的（按重要性填写：1最重要，4最不重要）'],
    ['', '保障出口收汇安全 [  ]', '', ' 获取银行贸易融资 [  ]', '', ' 提升公司内部管理 [  ]', '', ' 取得海外买方信息 [  ]'],
    ['', '（二）投保业务范围（按实际需要选择一种）'],
    ['', '全部信用证支付方式的出口'],
    ['', '全部非信用证支付方式的出口'],
    ['', '全部非信用证及信用证支付方式的出口'],
    ['', '（三）投保金额', '', fmt(row.insuranceAmount ? fmtCurrency(row.insuranceAmount) : ''), '', '万美元'],
    ['', '币种', '', fmt(row.insuranceCurrency || row.currency || 'USD'), '', '美元'],
    ['', '（四）投保主要买方：请填写本投保单之附表《买方清单》'],
    ['', '（五）投保主要开证银行：（根据最近一年实际列举）'],
    ['', '序号', '', '开证行名称（英文大写）', '', '', '', '出口金额（万美元）'],
    ['', '1.', '', fmt(row.lcIssuingBank || ''), '', '', '', ''],
    ['', '2.', '', '', '', '', '', ''],
    ['', '3.', '', '', '', '', '', ''],
    ['', '4.', '', '', '', '', '', ''],
    ['', '5.', '', '', '', '', '', ''],
    ['', '*如空间不够，可另加页'],
    ['', '(六)期望保险期间：', '', '自', fmtPeriod(row.expectedInsurancePeriod || ''), ''],
    [],
    [],

    // ════════════════════════════════════════════
    // 六、其他需要特别说明的事项 (original rows 166-170)
    // ════════════════════════════════════════════
    ['', '六、其他需要特别说明的事项'],
    [],
    [],
    [],
    [],
    [],

    // ════════════════════════════════════════════
    // 七、附件清单 (original rows 172-185)
    // ════════════════════════════════════════════
    ['', '七、附件清单'],
    ['', '(一)投保人资料'],
    ['', '', '营业执照、组织机构代码证、税务证等', '', '√'],
    ['', '', '财务报表', '', '√'],
    ['', '', '赊销贸易合同', '', '√'],
    ['', '', '信用管理制度'],
    ['', '', '其他材料【请说明】'],
    [],
    ['', '(二)买方资料'],
    ['', '', '营业执照、组织机构代码证、税务证等'],
    ['', '', '财务报表'],
    ['', '', '历史交易记录', '', '√'],
    ['', '', '买方出具的抵质押文件'],
    ['', '', '其他材料【请说明】'],
    [],
    [],

    // ════════════════════════════════════════════
    // 投保人声明 (original rows 188-196)
    // ════════════════════════════════════════════
    ['', '    投保人声明：保险人已向本人提供并详细介绍了《中国人民财产保险股份有限公司短期出口贸易信用保险条款》，并对其中免除保险人责任的条款(包括但不限于责任免除、投保人被保险人义务、赔偿处理、其他事项等)，以及本保险合同中付费约定和特别约定的内容向本人做了明确说明，本人已充分理解并接受上述内容，同意以此作为订立保险合同的依据，自愿投保本保险。'],
    [],
    [],
    [],
    [],
    ['', '    上述所填写的内容均属实。'],
    [],
    [],
    ['', '投保人签名 / 签章：', '', fmt(row.declarationSignature || row.legalRepresentative || ''), '', '日期：'],
    [],
    ['', '', '', '', '', '年          月          日'],
  ]

  const merges = buildMerges(data)
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!merges'] = merges
  ws['!cols'] = [
    { wch: 4 },  // col 0: margin/spacer
    { wch: 22 }, // col 1: labels
    { wch: 10 }, // col 2: sub-labels
    { wch: 24 }, // col 3: data fields
    { wch: 10 }, // col 4: sub-labels
    { wch: 20 }, // col 5: data fields
    { wch: 12 }, // col 6: sub-labels
    { wch: 22 }, // col 7: data fields
    { wch: 10 }, // col 8: sub-labels
    { wch: 16 }, // col 9: data fields
    { wch: 14 }, // col 10: option columns
    { wch: 20 }, // col 11: option data
    { wch: 14 }, // col 12: option columns
    { wch: 20 }, // col 13: option data
  ]

  XLSX.utils.book_append_sheet(wb, ws, '投保单正本')

  // ── Sheet 2: 买方清单 ──
  const buyerData = buildBuyerListSheet(row)
  XLSX.utils.book_append_sheet(wb, buyerData, '买方清单')

  return wb
}

function buildMerges(data) {
  const merges = []

  // Title rows
  const titleIndices = [1, 2, 3]
  titleIndices.forEach(r => {
    merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
  })

  // Section headers — merge cols 1-9
  const sectionHeaders = [
    '一、投保人基本情况', '二、投保人信用管理情况', '三、业务经营情况',
    '四、出口收汇情况', '五、投保意向', '六、其他需要特别说明的事项',
    '七、附件清单', '投保人声明：'
  ]

  data.forEach((row, r) => {
    const label = String(row[1] || row[0] || '').trim()

    if (sectionHeaders.some(h => label.startsWith(h) || label.includes(h))) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }

    // 公司名称
    if (label === '公司名称') {
      merges.push({ s: { r, c: 3 }, e: { r, c: 9 } })
    }
    // 英文选项
    if (label.includes('【可选填】')) {
      merges.push({ s: { r, c: 2 }, e: { r, c: 9 } })
    }
    // 注册地址
    if (label === '注册地址') {
      merges.push({ s: { r, c: 3 }, e: { r, c: 9 } })
    }
    // 营业地址
    if (label === '营业地址') {
      merges.push({ s: { r, c: 3 }, e: { r, c: 5 } })
    }
    // 组织机构代码
    if (label === '组织机构代码') {
      merges.push({ s: { r, c: 3 }, e: { r, c: 5 } })
    }
    // 成立年份
    if (label === '成立年份') {
      merges.push({ s: { r, c: 3 }, e: { r, c: 5 } })
      merges.push({ s: { r, c: 7 }, e: { r, c: 9 } })
    }

    // 联系人 row — 3 data groups
    if (label === '联系人') {
      merges.push({ s: { r, c: 3 }, e: { r, c: 4 } })
      merges.push({ s: { r, c: 7 }, e: { r, c: 8 } })
      merges.push({ s: { r, c: 11 }, e: { r, c: 12 } })
    }

    // 传真 rows
    if (label === '传真' && row[3] === '' && row[5] === '') {
      merges.push({ s: { r, c: 3 }, e: { r, c: 4 } })
      merges.push({ s: { r, c: 7 }, e: { r, c: 9 } })
    }

    // 代理人
    if (label === '代理人') {
      merges.push({ s: { r, c: 7 }, e: { r, c: 8 } })
      merges.push({ s: { r, c: 11 }, e: { r, c: 12 } })
    }

    // 经营性质
    if (label === '经营性质') {
      merges.push({ s: { r, c: 3 }, e: { r, c: 4 } })
      merges.push({ s: { r, c: 5 }, e: { r, c: 9 } })
    }

    // 是否上市
    if (label === '是否上市') {
      merges.push({ s: { r, c: 3 }, e: { r, c: 4 } })
      merges.push({ s: { r, c: 5 }, e: { r, c: 9 } })
    }

    // 拟投保业务范围
    if (label === '拟投保业务范围') {
      merges.push({ s: { r, c: 3 }, e: { r, c: 9 } })
    }

    // 出口业务经营历史
    if (label === '出口业务经营历史') {
      merges.push({ s: { r, c: 3 }, e: { r, c: 9 } })
    }

    // 关联公司
    if (label.startsWith('关联公司')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }

    // Section 2 headers
    if (label === '（一）政策与制度') {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }
    if (label === '（二）贸易过程管理') {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }

    // 信用管理 — field labels span cols 1-2
    const creditLabels = ['信用管理政策', '信用管控激励体系', '信用管理责任人']
    if (creditLabels.includes(label)) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 2 } })
    }

    // 物权保留条款
    if (label.startsWith('2、在贸易合同中')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 4 } })
    }

    // 发票开票期限
    if (label.startsWith('4、发票开票期限')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 3 } })
    }

    // 公司已于 (quality cert)
    if (label.startsWith('公司已于')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 2 } })
    }

    // Section 3 headers
    if (label.startsWith('(一)近三年')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }
    if (label.startsWith('（二）最近一个完整')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }
    if (label.startsWith('（三）预计今年')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }

    // 主要商品或服务 header row
    if (label === '主要商品或服务') {
      merges.push({ s: { r, c: 1 }, e: { r, c: 2 } })
      merges.push({ s: { r, c: 3 }, e: { r, c: 4 } })
      merges.push({ s: { r, c: 5 }, e: { r, c: 6 } })
      merges.push({ s: { r, c: 7 }, e: { r, c: 8 } })
      merges.push({ s: { r, c: 9 }, e: { r, c: 10 } })
    }

    // 会计年度 header
    if (label === '会计年度') {
      merges.push({ s: { r, c: 1 }, e: { r, c: 2 } })
      merges.push({ s: { r, c: 3 }, e: { r, c: 6 } })
      merges.push({ s: { r, c: 7 }, e: { r, c: 9 } })
    }

    // 国家 header
    if (label === '国家') {
      merges.push({ s: { r, c: 3 }, e: { r, c: 4 } })
      merges.push({ s: { r, c: 5 }, e: { r, c: 7 } })
      merges.push({ s: { r, c: 8 }, e: { r, c: 9 } })
    }

    // Section 4 headers
    if (label.startsWith('(一)最近一年')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }
    if (label.startsWith('(二)应收账款余额分布')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }
    if (label.startsWith('(三)逾期')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }
    if (label.startsWith('(四)近三年')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }
    if (label.startsWith('(五)最大')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }

    // 日期 header in 四-(一)
    if (label.startsWith('日期（2025年）')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 2 } })
      merges.push({ s: { r, c: 3 }, e: { r, c: 6 } })
      merges.push({ s: { r, c: 7 }, e: { r, c: 9 } })
    }

    // 应收账款余额范围 header
    if (label.startsWith('应收账款余额范围')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 4 } })
      merges.push({ s: { r, c: 5 }, e: { r, c: 6 } })
      merges.push({ s: { r, c: 7 }, e: { r, c: 9 } })
    }

    // 逾期天数 header
    if (label.startsWith('逾期天数')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 3 } })
      merges.push({ s: { r, c: 4 }, e: { r, c: 5 } })
      merges.push({ s: { r, c: 6 }, e: { r, c: 7 } })
      merges.push({ s: { r, c: 8 }, e: { r, c: 9 } })
    }

    // 近三年逾期 header
    if (label.startsWith('会计年度') && row[10] && String(row[10]).includes('备注')) {
      merges.push({ s: { r, c: 3 }, e: { r, c: 4 } })
      merges.push({ s: { r, c: 5 }, e: { r, c: 6 } })
      merges.push({ s: { r, c: 7 }, e: { r, c: 8 } })
      merges.push({ s: { r, c: 9 }, e: { r, c: 10 } })
    }

    // 最大几笔 header
    if (label.startsWith('时间(年/月)')) {
      merges.push({ s: { r, c: 3 }, e: { r, c: 5 } })
      merges.push({ s: { r, c: 6 }, e: { r, c: 7 } })
      merges.push({ s: { r, c: 8 }, e: { r, c: 9 } })
      merges.push({ s: { r, c: 10 }, e: { r, c: 11 } })
    }

    // Section 5: 投保意向
    if (label === '（一）投保主要目的') {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }
    if (label === '（二）投保业务范围（按实际需要选择一种）') {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }
    if (label === '（三）投保金额') {
      merges.push({ s: { r, c: 1 }, e: { r, c: 2 } })
    }
    if (label === '（四）投保主要买方：请填写本投保单之附表《买方清单》') {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }
    if (label.startsWith('（五）投保主要开证银行')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }
    if (label.startsWith('(六)期望保险期间')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 2 } })
    }

    // 开证银行 header row
    if (label === '序号') {
      merges.push({ s: { r, c: 3 }, e: { r, c: 6 } })
      merges.push({ s: { r, c: 7 }, e: { r, c: 9 } })
    }

    // 声明 rows
    if (label.startsWith('投保人声明') || label.startsWith('上述所填写的内容均属实')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }

    // 投保人签名/签章
    if (label.startsWith('投保人签名')) {
      merges.push({ s: { r, c: 3 }, e: { r, c: 4 } })
    }

    // 日期 row at bottom
    if (row[5] && String(row[5]).includes('年          月          日')) {
      merges.push({ s: { r, c: 5 }, e: { r, c: 9 } })
    }

    // 附件清单 section headers
    if (label.startsWith('(一)投保人资料') || label.startsWith('(二)买方资料')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }

    // * 注释行
    if (label.startsWith('*如空间不够') || label.startsWith('*可以近期')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }
    if (label.startsWith('* 请排除')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }
    if (label.startsWith('* 赊销：')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }
    if (label.startsWith('*付款方式')) {
      merges.push({ s: { r, c: 1 }, e: { r, c: 9 } })
    }
  })

  return merges
}

function buildBuyerListSheet(row) {
  const headers = [
    '序号', '买方全称', '买方所在国别', '地址',
    '最早开始出口交易日期', '过去12个月出口交易额',
    '最早开始出口赊销交易日期', '过去12个月出口赊销交易额',
    '支付方式', '拟申请信用期限(天)', '拟申请信用限额'
  ]

  const buyerRow = [
    1,
    fmt(row.buyerName || ''),
    fmt(row.buyerCountry || ''),
    fmt(row.buyerAddress || ''),
    fmt(row.cooperationYearsWithBuyer ? '自' + row.cooperationYearsWithBuyer + '前' : ''),
    row.last12MonthExportAmount ? fmtCurrency(row.last12MonthExportAmount) : '',
    '',
    row.last12MonthCreditSalesAmount ? fmtCurrency(row.last12MonthCreditSalesAmount) : '',
    fmt(row.mainPaymentMethods || ''),
    fmt(row.mostUsedPaymentTerm || row.paymentTermsDays || ''),
    row.appliedCreditLimit ? fmtCurrency(row.appliedCreditLimit) : '',
  ]

  const now = new Date()
  const year = now.getFullYear()

  const sheetData = [
    ['短期出口贸易信用保险投保单（附表）买方清单'],
    ['', '', '', '', '', '', '', '', '填表截至日期：' + year + '年  月  日'],
    ['', '', '', '', '', '', '', '', '货币单位：万美元'],
    headers,
    buyerRow,
    ['', '', '', '', '', '', '', '', '', '', ''],
    [''],
    ['说明：'],
    ['1、按照交易额的大小以从高到低的顺序填写。'],
    ['2、如空间不够，可自行增加行。'],
    ['3、在过去12个月内，如买方已经出现拖欠，请填写《拖欠买方历史交易记录》。'],
  ]

  const ws = XLSX.utils.aoa_to_sheet(sheetData)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
    { s: { r: 7, c: 0 }, e: { r: 7, c: 7 } },
  ]
  ws['!cols'] = [
    { wch: 6 }, { wch: 24 }, { wch: 14 }, { wch: 26 },
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 14 }, { wch: 16 }, { wch: 18 },
  ]
  return ws
}

/**
 * Generate 买方信息采集表
 */
export function generateBuyerInfoXlsx(row) {
  const wb = XLSX.utils.book_new()

  const data = [
    ['买方信息采集表 / Buyer Information Collection Form'],
    [],
    ['一、基本信息 Basic Information'],
    ['申请日期 Date of Application', fmt(row.createTime ? String(row.createTime).split('T')[0] : '')],
    ['被保险人名称 Name of the Insured', fmt(row.companyName || '')],
    ['统一社会信用代码 Registration No.', fmt(row.unifiedSocialCreditCode || '')],
    ['企业地址 Address', fmt(row.registeredAddress || row.businessAddress || '')],
    ['法定代表人 Legal Representative', fmt(row.legalRepresentative || '')],
    ['联系人 Contact Person', fmt(row.contactName || '')],
    ['联系人职务 Position', fmt(row.contactPosition || '')],
    ['联系电话 Telephone', fmt(row.contactPhone || '')],
    ['电子邮箱 E-mail', fmt(row.companyEmail || '')],
    ['企业性质 Type of Organization', fmt(row.enterpriseNature || '')],
    ['经营性质 Business Nature', fmt(row.businessType || '')],
    ['组织机构代码 Org. Code', fmt(row.organizationCode || row.unifiedSocialCreditCode || '')],
    ['成立年份 Year of Establishment', fmt(row.establishmentYear || '')],
    ['关联企业 Associated Companies', fmt(row.relatedCompanies || row.businessLicense ? '详见附件' : '')],
    [],
    ['二、买方详细信息 Buyer Details'],
    ['买方全名 Buyer Name（CN/EN）', fmt(row.buyerName || '')],
    ['买方国别 Country', fmt(row.buyerCountry || '')],
    ['买方地址 Address', fmt(row.buyerAddress || '')],
    ['合作年限 Cooperation Years', fmt(row.cooperationYearsWithBuyer || '')],
    ['主要出口行业 Main Export Industry', fmt(row.mainExportIndustry || '')],
    ['主要出口国家 Export Countries', arrJoin(row.exportMainCountries)],
    ['付款条件 Payment Terms', fmt(row.paymentTerms || '')],
    ['支付方式 Payment Method', fmt(row.mainPaymentMethods || '')],
    ['是否有物权保留条款 Retention of Title', row.hasTitleRetentionClause === '是' || row.hasTitleRetentionClause === '否' ? (row.hasTitleRetentionClause === '是' ? 'Yes 是' : 'No 否') : ''],
    ['最长赊账期 Longest Credit Period', row.longestCreditPeriod ? fmt(row.longestCreditPeriod) : (row.longestPaymentTerm ? fmt(row.longestPaymentTerm) + '天' : '')],
    ['是否提供较长赊账期 Extended Credit', row.hasLongerCreditPeriod === '是' ? '是 Yes' : (row.hasLongerCreditPeriod === '否' ? '否 No' : '')],
    [],
    ['三、交易信息 Transaction Information'],
    ['过去12个月出口交易额 (Export turnover past 12 months)', row.last12MonthExportAmount ? fmtCurrency(row.last12MonthExportAmount) + ' ' + (row.creditSalesCurrency || 'USD') : ''],
    ['过去12个月赊销交易额 (Actual credit sales turnover past 12 months)', row.last12MonthCreditSalesAmount ? fmtCurrency(row.last12MonthCreditSalesAmount) + ' ' + (row.creditSalesCurrency || 'USD') : ''],
    ['预计未来12个月赊销销售额 (Est. credit sales annual turnover)', row.expectedNext12MonthCreditSales ? fmtCurrency(row.expectedNext12MonthCreditSales) + ' ' + (row.creditSalesCurrency || 'USD') : ''],
    ['预计未来12个月投保营业额 (Est. insurable turnover next 12 months)', row.expectedInsurableTurnover ? fmtCurrency(row.expectedInsurableTurnover) + ' ' + (row.turnoverCurrency || row.creditSalesCurrency || 'USD') : ''],
    ['拟申请信用限额 (Applied Credit Limit)', row.appliedCreditLimit ? fmtCurrency(row.appliedCreditLimit) + ' ' + (row.creditLimitCurrency || row.creditSalesCurrency || 'USD') : ''],
    ['预计未来12个月销售总额 (Est. annual shipment next 12 months)', row.estimatedAnnualShipment ? fmtCurrency(row.estimatedAnnualShipment) : ''],
    ['赊销账期天数 Credit Period (Days)', fmt(row.mostUsedPaymentTerm || row.paymentTermsDays || '')],
    ['最常用支付方式 Most Used Payment Term', fmt(row.mostUsedPaymentTerm || '') + '天'],
    [],
    ['四、担保信息 Guarantee Information'],
    ['是否有担保 Guaranty Available', row.hasGuarantee === 'yes' ? '是 Yes' : (row.hasGuarantee === 'no' ? '否 No' : '')],
    ['担保方名称 Guarantor Name', fmt(row.guarantorName || '')],
    [],
    ['五、投保信息 Insurance Information'],
    ['投保类型 Insurance Type', fmt(row.insuranceType || '')],
    ['投保金额 Insurance Amount', row.insuranceAmount ? fmtCurrency(row.insuranceAmount) : ''],
    ['投保币种 Currency', fmt(row.insuranceCurrency || row.currency || 'USD')],
    ['投保期限 Insurance Period', fmtPeriod(row.expectedInsurancePeriod)],
    ['投保业务范围 Business Scope', fmt(row.insuranceBusinessScope || '')],
    ['出口产品类别 Export Product Category', fmt(row.exportProductCategory || '')],
    ['出口业务经营历史 Export Business History', fmt(row.exportBusinessHistory || '')],
    ['投保目的 Insurance Purpose', [
      row.insurancePrimaryPurpose1 || '',
      row.insurancePrimaryPurpose2 || '',
      row.insurancePrimaryPurpose3 || '',
      row.insurancePrimaryPurpose4 || ''
    ].filter(Boolean).join('；') || ''],
    ['政策性/商业性机构 Preferred Org Type', fmt(row.preferredInsuranceOrgType || '')],
    [],
    ['备注 Remarks：'],
    ['以上信息根据投保申请自动生成，仅供内部参考。'],
    ['This form is auto-generated from the insurance application for internal reference only.'],
  ]

  const merge = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 18, c: 0 }, e: { r: 18, c: 3 } },
    { s: { r: 31, c: 0 }, e: { r: 31, c: 3 } },
    { s: { r: 41, c: 0 }, e: { r: 41, c: 3 } },
    { s: { r: 43, c: 0 }, e: { r: 43, c: 3 } },
    { s: { r: 55, c: 0 }, e: { r: 55, c: 3 } },
  ]

  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!merges'] = merge
  ws['!cols'] = [{ wch: 52 }, { wch: 48 }, { wch: 16 }, { wch: 16 }]

  XLSX.utils.book_append_sheet(wb, ws, '买方信息采集表')
  return wb
}

export function downloadWorkbook(wb, filename) {
  XLSX.writeFile(wb, filename)
}

export function workbookToHtml(wb) {
  const sheets = wb.SheetNames
  let html = ''
  sheets.forEach((name, idx) => {
    const ws = wb.Sheets[name]
    const sheetHtml = XLSX.utils.sheet_to_html(ws, { id: `sheet-${idx}`, editable: false, raw: true })
    html += `<h3 style="margin:0 0 8px;font-size:15px;color:#0052D9;white-space:nowrap">${name}</h3>`
    html += sheetHtml.replace(/<table[^>]*>/i, '<table style="border-collapse:collapse;font-size:12px;border:1px solid #d0d0d0">')
    if (idx < sheets.length - 1) html += '<div style="margin:20px 0"></div>'
  })
  return html
}
