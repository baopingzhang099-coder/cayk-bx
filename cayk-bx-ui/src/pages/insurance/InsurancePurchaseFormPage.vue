<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">{{ pageTitle }}</div>
      <div class="page-actions" v-if="mode !== 'detail'">
        <t-space>
          <t-button variant="outline" @click="handleBack">返回</t-button>
          <t-button variant="outline" @click="handleSave">保存</t-button>
          <t-button theme="primary" @click="handleSubmit">申请投保</t-button>
        </t-space>
      </div>
    </div>

    <t-card v-if="mode === 'detail'">
      <t-tabs default-value="customer">
        <t-tab-panel value="customer" label="客户基础信息">
          <detail-panel :data="detailData" :columns="customerColumns" title="客户基础信息" />
        </t-tab-panel>
        <t-tab-panel value="business" label="业务信息">
          <detail-panel :data="detailData" :columns="businessColumns" title="业务信息" />
        </t-tab-panel>
        <t-tab-panel value="insurance" label="投保核心需求">
          <detail-panel :data="detailData" :columns="insuranceColumns" title="投保核心需求" />
        </t-tab-panel>
        <t-tab-panel value="buyer" label="买方信息">
          <detail-panel :data="detailData" :columns="buyerColumns" title="买方信息" />
        </t-tab-panel>
        <t-tab-panel value="trade" label="贸易基础信息">
          <detail-panel :data="detailData" :columns="tradeColumns" title="贸易基础信息" />
        </t-tab-panel>
        <t-tab-panel value="policy" label="保单数字化信息">
          <detail-panel v-if="detailData" :data="detailData" :columns="policyBasicColumns" title="基础信息" />
          <detail-panel v-if="detailData" :data="detailData" :columns="policyLimitColumns" title="责任限额" />
          <detail-panel v-if="detailData" :data="detailData" :columns="policyDeclareColumns" title="申报规则" />
          <detail-panel v-if="detailData" :data="detailData" :columns="policyFeeColumns" title="费用管理" />
          <detail-panel v-if="detailData" :data="detailData" :columns="policyFileColumns" title="保单文件" />
          <empty-state v-if="!detailData" description="暂无保单数字化数据" />
        </t-tab-panel>
      </t-tabs>
    </t-card>

    <div v-if="mode !== 'detail'" class="form-layout-scroll">
      <div class="scroll-sidebar">
        <div class="sidebar-title">目录</div>
        <div class="sidebar-links">
          <div 
            v-for="(item, index) in formSections" 
            :key="index"
            class="sidebar-link"
            :class="{ active: activeSection === index }"
            @click="scrollToSection(index)"
          >
            <span class="section-num">{{ index + 1 }}</span>
            <span class="section-name">{{ item }}</span>
          </div>
        </div>
      </div>

      <div class="scroll-content">
        <t-card class="form-card">
          <t-form ref="formRef" :data="formData" :rules="rules" label-align="top">
            <div id="section-0" class="form-section">
              <div class="section-header">
                <span class="section-num">1</span>
                <span class="section-title">客户基础信息</span>
              </div>
              <div class="section-title-sub">主体信息</div>
            <div class="form-grid">
              <t-form-item label="公司中文全称" name="companyName">
                <t-input v-model="formData.companyName" placeholder="准确填写，需与工商注册信息一致" />
              </t-form-item>
              <t-form-item label="统一社会信用代码" name="unifiedSocialCreditCode">
                <t-input v-model="formData.unifiedSocialCreditCode" placeholder="请输入18位统一社会信用代码" :maxlength="18" />
              </t-form-item>
              <t-form-item label="注册地址" name="registeredAddress" class="form-item-full">
                <t-input v-model="formData.registeredAddress" placeholder="详细填写省/市/区/街道门牌号" />
              </t-form-item>
              <t-form-item label="营业地址" name="businessAddress" class="form-item-full">
                <t-input v-model="formData.businessAddress" placeholder="详细填写实际经营地址，与注册地址不一致需注明" />
              </t-form-item>
              <t-form-item label="组织机构代码" name="organizationCode">
                <t-input v-model="formData.organizationCode" placeholder="请输入组织机构代码" />
              </t-form-item>
              <t-form-item label="成立年份" name="establishmentYear">
                <t-input v-model="formData.establishmentYear" placeholder="YYYY格式，如2020" />
              </t-form-item>
              <t-form-item label="法定代表人姓名" name="legalRepresentative">
                <t-input v-model="formData.legalRepresentative" placeholder="请输入法定代表人姓名" />
              </t-form-item>
              <t-form-item label="企业性质" name="enterpriseNature">
                <t-select v-model="formData.enterpriseNature" placeholder="请选择企业性质" clearable>
                  <t-option value="国有企业" label="国有企业" />
                  <t-option value="民营企业" label="民营企业" />
                  <t-option value="外资企业" label="外资企业" />
                  <t-option value="其他" label="其他" />
                </t-select>
              </t-form-item>
              <t-form-item label="经营性质" name="businessType">
                <t-select v-model="formData.businessType" placeholder="请选择经营性质" clearable>
                  <t-option value="生产型企业" label="生产型企业" />
                  <t-option value="贸易公司" label="贸易公司" />
                  <t-option value="贸易代理" label="贸易代理" />
                </t-select>
              </t-form-item>
            </div>

            <div class="section-title-sub">联系信息</div>
            <div class="form-grid">
              <t-form-item label="联系人姓名" name="contactName">
                <t-input v-model="formData.contactName" placeholder="请输入联系人姓名" />
              </t-form-item>
              <t-form-item label="联系人职务" name="contactPosition">
                <t-input v-model="formData.contactPosition" placeholder="请输入联系人职务" />
              </t-form-item>
              <t-form-item label="联系电话" name="contactPhone">
                <t-input v-model="formData.contactPhone" placeholder="请输入有效手机号" />
              </t-form-item>
              <t-form-item label="企业邮箱" name="companyEmail">
                <t-input v-model="formData.companyEmail" placeholder="请输入企业邮箱" />
              </t-form-item>
            </div>

            <div class="section-title-sub">资质文件</div>
            <div class="form-grid">
              <t-form-item label="企业法人营业执照扫描件" name="businessLicense" class="form-item-full">
                <t-upload
                  v-model="formData.businessLicense"
                  action="https://demo.com/upload"
                  tips="格式：PDF/JPG/PNG；大小：单文件≤10MB"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </t-form-item>
              <t-form-item label="对外贸易经营者备案登记表" name="importExportQualification" class="form-item-full">
                <t-upload
                  v-model="formData.importExportQualification"
                  action="https://demo.com/upload"
                  tips="格式：PDF/JPG/PNG；大小：单文件≤10MB"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </t-form-item>
            </div>
            </div>

            <div id="section-1" class="form-section">
              <div class="section-header">
                <span class="section-num">2</span>
                <span class="section-title">业务信息</span>
              </div>
              <div class="section-title-sub">出口业务经营</div>
              <div class="form-grid">
                <t-form-item label="出口业务经营历史" name="exportBusinessHistory">
                <t-select v-model="formData.exportBusinessHistory" placeholder="请选择出口业务经营历史" clearable>
                  <t-option value="1年以内" label="1年以内" />
                  <t-option value="1-3年" label="1-3年" />
                  <t-option value="3年以上" label="3年以上" />
                  <t-option value="即将从事出口业务" label="即将从事出口业务" />
                </t-select>
              </t-form-item>
              <t-form-item label="出口主要国别/地区" name="exportMainCountries" class="form-item-full">
                <t-select v-model="formData.exportMainCountries" multiple placeholder="最多选择5个，请选择出口主要国别/地区" clearable filterable max="5">
                  <t-option v-for="item in countryOptions" :key="item.value" :value="item.value" :label="item.label" />
                </t-select>
              </t-form-item>
              <t-form-item label="主营出口行业" name="mainExportIndustry" class="form-item-full">
                <t-select v-model="formData.mainExportIndustry" placeholder="请选择主营出口行业" clearable>
                  <t-option value="金属" label="金属" />
                  <t-option value="化工" label="化工" />
                  <t-option value="建筑" label="建筑" />
                  <t-option value="能源" label="能源" />
                  <t-option value="交通工具制造" label="交通工具制造" />
                  <t-option value="IT服务" label="IT服务" />
                  <t-option value="汽车制造" label="汽车制造" />
                  <t-option value="汽车零部件" label="汽车零部件" />
                  <t-option value="食品" label="食品" />
                  <t-option value="计算机及通讯" label="计算机及通讯" />
                  <t-option value="零售" label="零售" />
                  <t-option value="家用电器" label="家用电器" />
                  <t-option value="医疗" label="医疗" />
                  <t-option value="运输" label="运输" />
                  <t-option value="纺织" label="纺织" />
                  <t-option value="造纸" label="造纸" />
                  <t-option value="电子" label="电子" />
                  <t-option value="机械" label="机械" />
                </t-select>
              </t-form-item>
              <t-form-item label="预计未来12个月可保营业额" name="expectedInsurableTurnover" class="form-item-full">
                <t-input-number v-model="formData.expectedInsurableTurnover" placeholder="请输入金额" :min="0" style="width: 100%">
                  <template #suffix>
                    <t-select v-model="formData.turnoverCurrency" placeholder="币种" style="width: 80px">
                      <t-option value="USD" label="USD" />
                      <t-option value="CNY" label="CNY" />
                      <t-option value="EUR" label="EUR" />
                    </t-select>
                  </template>
                </t-input-number>
              </t-form-item>
              <t-form-item label="主要付款方式" name="mainPaymentMethods" class="form-item-full">
                <t-select v-model="formData.mainPaymentMethods" placeholder="请选择主要付款方式" clearable>
                  <t-option value="LC" label="信用证（LC）" />
                  <t-option value="OA" label="放账（OA）" />
                  <t-option value="DP" label="D/P（托收）" />
                  <t-option value="DA" label="DA（承兑）" />
                  <t-option value="预付款" label="预付款" />
                  <t-option value="其他" label="其他" />
                </t-select>
              </t-form-item>
              <t-form-item label="最常用的付款期限（天）" name="mostUsedPaymentTerm">
                <t-input-number v-model="formData.mostUsedPaymentTerm" placeholder="如30/60/90" :min="0" />
              </t-form-item>
              <t-form-item label="最长付款期限（天）" name="longestPaymentTerm">
                <t-input-number v-model="formData.longestPaymentTerm" placeholder="如120/180" :min="0" />
              </t-form-item>
              <t-form-item label="是否为买家提供较长赊账期" name="hasLongerCreditPeriod" class="form-item-full">
                <t-select v-model="formData.hasLongerCreditPeriod" placeholder="请选择" clearable>
                  <t-option value="是" label="是" />
                  <t-option value="否" label="否" />
                </t-select>
              </t-form-item>
              <t-form-item v-if="formData.hasLongerCreditPeriod === '是'" label="最长赊账期（天）" name="longestCreditPeriod">
                <t-input-number v-model="formData.longestCreditPeriod" placeholder="请输入天数" :min="0" />
              </t-form-item>
            </div>
            </div>

            <div id="section-2" class="form-section">
              <div class="section-header">
                <span class="section-num">3</span>
                <span class="section-title">投保核心需求</span>
              </div>
              <div class="section-title-sub">投保意向</div>
              <div class="form-grid">
                <t-form-item label="投保类型" name="insuranceType">
                <t-select v-model="formData.insuranceType" placeholder="请选择投保类型" clearable>
                  <t-option value="短期出口信用保险" label="短期出口信用保险" />
                </t-select>
              </t-form-item>
              <t-form-item label="投保倾向机构类型" name="preferredInsuranceOrgType">
                <t-select v-model="formData.preferredInsuranceOrgType" placeholder="请选择投保倾向机构类型" clearable>
                  <t-option value="政策性保险机构" label="政策性保险机构" />
                  <t-option value="商业性保险机构" label="商业性保险机构" />
                  <t-option value="无偏好" label="无偏好" />
                </t-select>
              </t-form-item>
              <t-form-item label="投保业务范围" name="insuranceBusinessScope" class="form-item-full">
                <t-select v-model="formData.insuranceBusinessScope" placeholder="请选择投保业务范围" clearable>
                  <t-option value="全部适保业务" label="全部适保业务" />
                  <t-option value="部分适保业务-全部信用证" label="部分适保业务-全部信用证支付方式的出口" />
                  <t-option value="部分适保业务-全部非信用证" label="部分适保业务-全部非信用证支付方式的出口" />
                  <t-option value="部分适保业务-全部" label="部分适保业务-全部非信用证及信用证支付方式的出口" />
                </t-select>
              </t-form-item>
              <t-form-item label="投保币种" name="insuranceCurrency">
                <t-select v-model="formData.insuranceCurrency" placeholder="请选择投保币种" clearable>
                  <t-option value="USD" label="USD" />
                  <t-option value="CNY" label="CNY" />
                  <t-option value="EUR" label="EUR" />
                </t-select>
              </t-form-item>
              <t-form-item label="投保金额" name="insuranceAmount">
                <t-input-number v-model="formData.insuranceAmount" placeholder="请输入投保金额" :min="0" />
              </t-form-item>
              <t-form-item label="期望保险期间" name="expectedInsurancePeriod" class="form-item-full">
                <t-date-range-picker v-model="formData.expectedInsurancePeriod" placeholder="请选择保险期间" />
              </t-form-item>
            </div>

            <div class="section-title-sub">风险信息</div>
            <div class="form-grid">
              <t-form-item label="买家集中度" name="buyerConcentration" class="form-item-full">
                <t-radio-group v-model="formData.buyerConcentration">
                  <t-radio value="≤30">≤30%</t-radio>
                  <t-radio value="31-50">31%-50%</t-radio>
                  <t-radio value="51-70">51%-70%</t-radio>
                  <t-radio value="71-85">71%-85%</t-radio>
                  <t-radio value=">85">>85%</t-radio>
                </t-radio-group>
              </t-form-item>
              <t-form-item label="历史投保情况" name="insuranceHistory" class="form-item-full">
                <t-radio-group v-model="formData.insuranceHistory">
                  <t-radio value="none">未购买过</t-radio>
                  <t-radio value="purchased">购买过且未赔付</t-radio>
                  <t-radio value="claimed">购买过曾赔付</t-radio>
                </t-radio-group>
                <t-input v-if="formData.insuranceHistory === 'claimed'" v-model="formData.claimAmount" placeholder="请输入赔付金额（万元）" style="width: 200px; margin-top: 10px" />
              </t-form-item>
              <t-form-item label="需求描述" name="requirements" class="form-item-full">
                <t-textarea v-model="formData.requirements" placeholder="请描述您的需求，如：保费优惠、额度提升、服务质量等" :autosize="{ minRows: 3, maxRows: 5 }" />
              </t-form-item>
              <div v-if="aiKeywords.length > 0" class="ai-analysis">
                <div class="ai-title">
                  <span class="ai-icon">🤖</span>
                  <span>AI需求分析识别</span>
                </div>
                <div class="keyword-tags">
                  <t-tag v-for="keyword in aiKeywords" :key="keyword" theme="primary" variant="light">{{ keyword }}</t-tag>
                </div>
                <div class="ai-suggestion">
                  根据您的需求，我们推荐：<t-tag theme="success" variant="light">{{ aiSuggestion }}</t-tag>
                </div>
              </div>
            </div>
            </div>

            <div id="section-3" class="form-section">
              <div class="section-header">
                <span class="section-num">4</span>
                <span class="section-title">买方信息</span>
              </div>
              <div class="section-title-sub">买方基础信息</div>
              <div class="form-grid">
                <t-form-item label="买方全称（中文/英文）" name="buyerName" class="form-item-full">
                  <t-input v-model="formData.buyerName" placeholder="境内买方填中文，境外买方填英文全称" />
                </t-form-item>
                <t-form-item label="买方所在国别/地区" name="buyerCountry">
                  <t-select v-model="formData.buyerCountry" placeholder="请选择买方所在国家/地区" clearable filterable>
                    <t-option v-for="item in countryOptions" :key="item.value" :value="item.value" :label="item.label" />
                  </t-select>
                </t-form-item>
                <t-form-item label="买方注册地址" name="buyerAddress" class="form-item-full">
                  <t-input v-model="formData.buyerAddress" placeholder="详细填写买方注册地址" />
                </t-form-item>
              </div>

              <div class="section-title-sub">买方业务信息</div>
              <div class="form-grid">
                <t-form-item label="与该买方合作年限" name="cooperationYearsWithBuyer">
                <t-select v-model="formData.cooperationYearsWithBuyer" placeholder="请选择合作年限" clearable>
                  <t-option value="1年以内" label="1年以内" />
                  <t-option value="1-3年" label="1-3年" />
                  <t-option value="3年以上" label="3年以上" />
                </t-select>
              </t-form-item>
              <t-form-item label="过去12个月出口交易额（万美元）" name="last12MonthExportAmount">
                <t-input-number v-model="formData.last12MonthExportAmount" placeholder="填写具体金额" :min="0" />
              </t-form-item>
              <t-form-item label="过去12个月出口赊销交易额（万美元）" name="last12MonthCreditSalesAmount">
                <t-input-number v-model="formData.last12MonthCreditSalesAmount" placeholder="填写具体金额" :min="0" />
              </t-form-item>
              <t-form-item label="预计未来12个月的赊销总额" name="expectedNext12MonthCreditSales">
                <t-input-number v-model="formData.expectedNext12MonthCreditSales" placeholder="填写具体金额" :min="0">
                  <template #suffix>
                    <t-select v-model="formData.creditSalesCurrency" placeholder="币种" style="width: 80px">
                      <t-option value="USD" label="USD" />
                      <t-option value="CNY" label="CNY" />
                      <t-option value="EUR" label="EUR" />
                    </t-select>
                  </template>
                </t-input-number>
              </t-form-item>
              <t-form-item label="付款条件" name="paymentTerms" class="form-item-full">
                <t-input v-model="formData.paymentTerms" placeholder="填写'发送货物后XX天'或'开具发票后XX天'" />
              </t-form-item>
              <t-form-item label="拟申请信用限额（最大应收账款余额）" name="appliedCreditLimit">
                <t-input-number v-model="formData.appliedCreditLimit" placeholder="填写具体金额" :min="0">
                  <template #suffix>
                    <t-select v-model="formData.creditLimitCurrency" placeholder="币种" style="width: 80px">
                      <t-option value="USD" label="USD" />
                      <t-option value="CNY" label="CNY" />
                      <t-option value="EUR" label="EUR" />
                    </t-select>
                  </template>
                </t-input-number>
              </t-form-item>
              <t-form-item v-if="formData.mainPaymentMethods === 'LC'" label="信用证开证行名称、SWIFT CODE" name="lcIssuingBank" class="form-item-full">
                <t-input v-model="formData.lcIssuingBank" placeholder="仅信用证支付方式需填写" />
              </t-form-item>
              <t-form-item label="授权保险公司联系买方的签字文件" name="authorizationDocument" class="form-item-full">
                <t-upload
                  v-model="formData.authorizationDocument"
                  action="https://demo.com/upload"
                  tips="格式：PDF/JPG/PNG；大小：单文件≤10MB"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </t-form-item>
            </div>
            </div>

            <div id="section-4" class="form-section">
              <div class="section-header">
                <span class="section-num">5</span>
                <span class="section-title">贸易基础信息</span>
              </div>
              <div class="form-grid">
                <t-form-item label="出口商品/服务品类" name="exportProductCategory" class="form-item-full">
                  <t-input v-model="formData.exportProductCategory" placeholder="详细填写具体商品名称" />
                </t-form-item>
                <t-form-item label="是否涉及管制商品" name="involvesControlledGoods">
                  <t-select v-model="formData.involvesControlledGoods" placeholder="请选择" clearable>
                    <t-option value="是" label="是" />
                    <t-option value="否" label="否" />
                  </t-select>
                </t-form-item>
                <t-form-item v-if="formData.involvesControlledGoods === '是'" label="管制商品名称" name="controlledGoodsDescription">
                  <t-input v-model="formData.controlledGoodsDescription" placeholder="请注明具体商品名称" />
                </t-form-item>
                <t-form-item label="贸易合同是否含物权保留条款" name="hasTitleRetentionClause">
                <t-select v-model="formData.hasTitleRetentionClause" placeholder="请选择" clearable>
                  <t-option value="是" label="是" />
                  <t-option value="否" label="否" />
                </t-select>
              </t-form-item>
              <t-form-item label="近期贸易合同扫描件（样本）" name="tradeContract" class="form-item-full">
                <t-upload
                  v-model="formData.tradeContract"
                  action="https://demo.com/upload"
                  tips="格式：PDF/JPG/PNG；大小：单文件≤10MB，最多3份；内容：含买卖双方名称、商品名称、付款方式、账期条款"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                />
              </t-form-item>
              <t-form-item label="出口报关单扫描件（样本）" name="customsDeclaration" class="form-item-full">
                <t-upload
                  v-model="formData.customsDeclaration"
                  action="https://demo.com/upload"
                  tips="格式：PDF/JPG/PNG；大小：单文件≤10MB，最多2份；内容：含报关单号、出口国别、商品名称、金额"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                />
              </t-form-item>
              <t-form-item v-if="formData.involvesControlledGoods === '是'" label="出口许可证" name="exportLicense" class="form-item-full">
                <t-upload
                  v-model="formData.exportLicense"
                  action="https://demo.com/upload"
                  tips="格式：PDF/JPG/PNG；大小：单文件≤5MB，最多1份"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </t-form-item>
            </div>
            </div>

            <div id="section-5" class="form-section">
              <div class="section-header">
                <span class="section-num">6</span>
                <span class="section-title">投保声明</span>
              </div>
              <div class="section-title-sub">投保人声明签署</div>
              <div class="form-grid">
                <t-form-item label="投保人声明" name="applicantDeclaration" class="form-item-full">
                  <div class="declaration-text">
                    <p>本人/本公司作为投保人，郑重声明：</p>
                    <p>1. 所填写的各项内容均真实、准确、完整，如有虚假，愿承担相应法律责任；</p>
                    <p>2. 已充分了解所投保的保险条款、保险责任、责任免除等内容；</p>
                    <p>3. 授权保险公司或其委托的第三方进行必要的调查和核实；</p>
                    <p>4. 同意投保单作为保险合同的组成部分。</p>
                  </div>
                </t-form-item>
                <t-form-item label="投保人授权人签字" name="declarationSignature">
                  <t-input v-model="formData.declarationSignature" placeholder="请输入授权人签字" />
                </t-form-item>
                <t-form-item label="声明日期" name="declarationDate">
                  <t-date-picker v-model="formData.declarationDate" placeholder="请选择日期" />
                </t-form-item>
                <t-form-item label="加盖公司公章" name="companySeal" class="form-item-full">
                  <t-upload
                    v-model="formData.companySeal"
                    action="https://demo.com/upload"
                    tips="请上传加盖公司公章的声明文件"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </t-form-item>
              </div>
            </div>

            <div id="section-7" class="form-section">
              <div class="section-header">
                <span class="section-num">8</span>
                <span class="section-title">保单数字化信息</span>
              </div>
              <div class="section-title-sub">基础信息</div>
              <div class="form-grid">
                <t-form-item label="保险单号" name="policyNo">
                <t-input v-model="formData.policyNo" placeholder="保单签发后自动生成" />
              </t-form-item>
              <t-form-item label="保险公司名称" name="insuranceCompanyName">
                <t-input v-model="formData.insuranceCompanyName" placeholder="请输入保险公司名称" />
              </t-form-item>
              <t-form-item label="保险人名称" name="insurerName">
                <t-input v-model="formData.insurerName" placeholder="请输入保险人名称" />
              </t-form-item>
              <t-form-item label="被保险人名称" name="insuredName">
                <t-input v-model="formData.insuredName" placeholder="需与贸易项下卖方信息一致" />
              </t-form-item>
              <t-form-item label="受益人名称" name="beneficiaryName">
                <t-input v-model="formData.beneficiaryName" placeholder="请输入受益人名称" />
              </t-form-item>
              <t-form-item label="保险起止期" name="policyPeriodRange" class="form-item-full">
                <t-date-range-picker v-model="formData.policyPeriodRange" placeholder="请选择保险起止期" />
              </t-form-item>
              <t-form-item label="保险期间" name="policyPeriod">
                <t-input v-model="formData.policyPeriod" placeholder="如12个月" />
              </t-form-item>
              <t-form-item label="续保标识" name="renewalFlag">
                <t-select v-model="formData.renewalFlag" placeholder="请选择" clearable>
                  <t-option value="是" label="是" />
                  <t-option value="否" label="否" />
                </t-select>
              </t-form-item>
              <t-form-item label="国家风险类别版本" name="countryRiskVersion">
                <t-input v-model="formData.countryRiskVersion" placeholder="请输入国家风险类别版本" />
              </t-form-item>
              <t-form-item label="条款版本" name="clauseVersion">
                <t-input v-model="formData.clauseVersion" placeholder="请输入条款版本" />
              </t-form-item>
              <t-form-item label="约定保险范围" name="agreedCoverageScope" class="form-item-full">
                <t-input v-model="formData.agreedCoverageScope" placeholder="请输入约定保险范围" />
              </t-form-item>
              <t-form-item label="业务类型" name="tradeBusinessType">
                <t-select v-model="formData.tradeBusinessType" placeholder="请选择业务类型" clearable>
                  <t-option value="服务贸易" label="服务贸易" />
                  <t-option value="货物贸易" label="货物贸易" />
                </t-select>
              </t-form-item>
            </div>

            <div class="section-title">责任限额</div>
            <div class="form-grid">
              <t-form-item label="最高赔偿限额" name="maxCompensationLimit">
                <t-input-number v-model="formData.maxCompensationLimit" placeholder="请输入最高赔偿限额" :min="0" />
              </t-form-item>
              <t-form-item label="买方信用限额" name="buyerCreditLimit">
                <t-input-number v-model="formData.buyerCreditLimit" placeholder="请输入买方信用限额" :min="0" />
              </t-form-item>
              <t-form-item label="承保风险及赔偿比例" name="coveredRisks" class="form-item-full">
                <t-textarea v-model="formData.coveredRisks" placeholder="如：商业风险—买方破产或无力偿付债务；商业风险—买方拖欠；政治风险" :autosize="{ minRows: 2, maxRows: 4 }" />
              </t-form-item>
              <t-form-item label="限额闲置期（天）" name="limitIdlePeriod">
                <t-input-number v-model="formData.limitIdlePeriod" placeholder="届满前30日提醒" :min="0" />
              </t-form-item>
              <t-form-item label="自行掌握限额" name="selfControlledLimit" class="form-item-full">
                <t-textarea v-model="formData.selfControlledLimit" placeholder="条件、限额要求、申报方式、赔付基数、赔偿比例等" :autosize="{ minRows: 2, maxRows: 4 }" />
              </t-form-item>
              <t-form-item label="免赔额" name="deductible">
                <t-input-number v-model="formData.deductible" placeholder="请输入免赔额" :min="0" />
              </t-form-item>
            </div>

            <div class="section-title">申报规则</div>
            <div class="form-grid">
              <t-form-item label="申报方式" name="declarationMethod">
                <t-input v-model="formData.declarationMethod" placeholder="请输入申报方式" />
              </t-form-item>
              <t-form-item label="申报周期" name="declarationCycle">
                <t-input v-model="formData.declarationCycle" placeholder="月度/季度" />
              </t-form-item>
              <t-form-item label="申报截至日期" name="declarationDeadline">
                <t-input v-model="formData.declarationDeadline" placeholder="如次月15日" />
              </t-form-item>
            </div>

            <div class="section-title">费用管理</div>
            <div class="form-grid">
              <t-form-item label="保险费率（%）" name="premiumRate">
                <t-input-number v-model="formData.premiumRate" placeholder="请输入费率" :min="0" :max="100" />
              </t-form-item>
              <t-form-item label="缴费期限" name="premiumPaymentDeadline">
                <t-input v-model="formData.premiumPaymentDeadline" placeholder="如保险起期前30日" />
              </t-form-item>
              <t-form-item label="缴费方式" name="premiumPaymentMethod">
                <t-select v-model="formData.premiumPaymentMethod" placeholder="请选择缴费方式" clearable>
                  <t-option value="一次性" label="一次性" />
                  <t-option value="分期" label="分期" />
                </t-select>
              </t-form-item>
              <t-form-item label="保费" name="premium">
                <t-input-number v-model="formData.premium" placeholder="自动计算应缴保费" :min="0" />
              </t-form-item>
              <t-form-item label="退保费用" name="surrenderFee">
                <t-input-number v-model="formData.surrenderFee" placeholder="退保时按未到期天数比例计算" :min="0" />
              </t-form-item>
              <t-form-item label="赔款追回款项支付对象" name="recoveryPayee">
                <t-input v-model="formData.recoveryPayee" placeholder="请输入赔款追回款项支付对象" />
              </t-form-item>
            </div>

            <div class="section-title">保单文件</div>
            <div class="form-grid">
              <t-form-item label="保单文件" name="policyFile" class="form-item-full">
                <t-upload v-model="formData.policyFile" action="https://demo.com/upload" tips="格式：PDF；大小：单文件≤10MB" accept=".pdf" />
              </t-form-item>
              <t-form-item label="批单文件" name="endorsementFile" class="form-item-full">
                <t-upload v-model="formData.endorsementFile" action="https://demo.com/upload" tips="格式：PDF；大小：单文件≤10MB" accept=".pdf" />
              </t-form-item>
            </div>
            </div>
          </t-form>
        </t-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import DetailPanel from '@/components/common/DetailPanel.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useBusinessStore } from '@/stores/business'

const route = useRoute()
const router = useRouter()
const store = useBusinessStore()

const formRef = ref(null)
const activeStep = ref(0)
const activeSection = ref(0)

const formSections = [
  '客户基础信息',
  '业务信息',
  '投保核心需求',
  '买方信息',
  '贸易基础信息',
  '投保声明',
  '保单数字化信息'
]

const scrollToSection = (index) => {
  activeSection.value = index
  const element = document.getElementById(`section-${index}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

onMounted(() => {
  const content = document.querySelector('.scroll-content')
  if (content) {
    content.addEventListener('scroll', () => {
      for (let i = 0; i < 7; i++) {
        const section = document.getElementById(`section-${i}`)
        if (section) {
          const rect = section.getBoundingClientRect()
          if (rect.top <= 150 && rect.bottom >= 150) {
            activeSection.value = i
            break
          }
        }
      }
    })
  }
})

const countryOptions = [
  { value: '美国', label: '美国' },
  { value: '德国', label: '德国' },
  { value: '日本', label: '日本' },
  { value: '英国', label: '英国' },
  { value: '法国', label: '法国' },
  { value: '加拿大', label: '加拿大' },
  { value: '澳大利亚', label: '澳大利亚' },
  { value: '韩国', label: '韩国' },
  { value: '新加坡', label: '新加坡' },
  { value: '荷兰', label: '荷兰' },
  { value: '意大利', label: '意大利' },
  { value: '西班牙', label: '西班牙' },
  { value: '巴西', label: '巴西' },
  { value: '印度', label: '印度' },
  { value: '越南', label: '越南' },
  { value: '印度尼西亚', label: '印度尼西亚' },
  { value: '泰国', label: '泰国' },
  { value: '马来西亚', label: '马来西亚' },
  { value: '俄罗斯', label: '俄罗斯' },
  { value: '墨西哥', label: '墨西哥' }
]

const mode = computed(() => {
  if (route.name === 'InsurancePurchaseDetail') return 'detail'
  if (route.name === 'InsurancePurchaseEdit') return 'edit'
  return 'create'
})

const pageTitle = computed(() => {
  if (mode.value === 'detail') return '投保详情'
  if (mode.value === 'edit') return '编辑投保'
  return '新增投保'
})

const formData = reactive({
  // 主体信息
  companyName: '',
  unifiedSocialCreditCode: '',
  registeredAddress: '',
  businessAddress: '',
  organizationCode: '',
  establishmentYear: '',
  legalRepresentative: '',
  enterpriseNature: '',
  businessType: '',
  // 联系信息
  contactName: '',
  contactPosition: '',
  contactPhone: '',
  companyEmail: '',
  // 业务信息
  exportBusinessHistory: '',
  exportMainCountries: [],
  mainExportIndustry: '',
  expectedInsurableTurnover: null,
  turnoverCurrency: 'USD',
  mainPaymentMethods: '',
  mostUsedPaymentTerm: null,
  longestPaymentTerm: null,
  hasLongerCreditPeriod: '',
  longestCreditPeriod: null,
  // 投保核心需求
  insuranceType: '',
  preferredInsuranceOrgType: '',
  insuranceBusinessScope: '',
  insuranceCurrency: 'USD',
  insuranceAmount: null,
  expectedInsurancePeriod: [],
  insurancePrimaryPurpose1: '',
  insurancePrimaryPurpose2: '',
  insurancePrimaryPurpose3: '',
  insurancePrimaryPurpose4: '',
  // 问卷调查字段
  customerType: '',
  serviceType: [],
  productType: '',
  paymentMethods: [
    { name: 'OA赊销', value: 'oa', selected: false, hasTerm: true, term: '', ratio: '' },
    { name: 'DA承兑交单', value: 'da', selected: false, hasTerm: true, term: '', ratio: '' },
    { name: 'DP付款交单', value: 'dp', selected: false, hasTerm: true, term: '', ratio: '' },
    { name: 'LC信用证', value: 'lc', selected: false, hasTerm: false, term: '', ratio: '' },
    { name: 'TT预付', value: 'tt', selected: false, hasTerm: false, term: '', ratio: '' },
    { name: '其他', value: 'other', selected: false, hasTerm: false, term: '', ratio: '' }
  ],
  countries: [],
  buyerConcentration: '',
  insuranceHistory: '',
  claimAmount: '',
  requirements: '',
  // 买方基础信息
  buyerName: '',
  buyerCountry: '',
  buyerAddress: '',
  // 买方业务信息
  cooperationYearsWithBuyer: '',
  last12MonthExportAmount: null,
  last12MonthCreditSalesAmount: null,
  expectedNext12MonthCreditSales: null,
  creditSalesCurrency: 'USD',
  paymentTerms: '',
  appliedCreditLimit: null,
  creditLimitCurrency: 'USD',
  lcIssuingBank: '',
  // 贸易基础信息
  exportProductCategory: '',
  involvesControlledGoods: '',
  controlledGoodsDescription: '',
  hasTitleRetentionClause: '',
  // 补充资料
  businessLicense: null,
  importExportQualification: null,
  tradeContract: null,
  customsDeclaration: null,
  exportLicense: null,
  authorizationDocument: null,
  // 投保声明
  declarationSignature: '',
  declarationDate: '',
  companySeal: null,
  // 保单数字化信息 - 基础信息
  policyNo: '',
  insuranceCompanyName: '',
  insurerName: '',
  insuredName: '',
  beneficiaryName: '',
  policyPeriodRange: [],
  policyPeriod: '',
  renewalFlag: '',
  countryRiskVersion: '',
  clauseVersion: '',
  agreedCoverageScope: '',
  tradeBusinessType: '',
  // 保单数字化信息 - 责任限额
  maxCompensationLimit: null,
  buyerCreditLimit: null,
  coveredRisks: '',
  limitIdlePeriod: null,
  selfControlledLimit: '',
  deductible: null,
  // 保单数字化信息 - 申报规则
  declarationMethod: '',
  declarationCycle: '',
  declarationDeadline: '',
  // 保单数字化信息 - 费用管理
  premiumRate: null,
  premiumPaymentDeadline: '',
  premiumPaymentMethod: '',
  premium: null,
  surrenderFee: null,
  recoveryPayee: '',
  // 保单数字化信息 - 保单文件
  policyFile: null,
  endorsementFile: null
})

const tempCountry = ref('')
const ratioMap = { '≤10': 5, '11-30': 20, '31-50': 40, '51-70': 60, '71-90': 80, '>91': 95 }

const totalRatio = computed(() => {
  return formData.paymentMethods.reduce((sum, item) => {
    if (item.selected && item.ratio) {
      return sum + (ratioMap[item.ratio] || 0)
    }
    return sum
  }, 0)
})

const ratioError = computed(() => {
  const selected = formData.paymentMethods.filter(item => item.selected && item.ratio)
  return selected.length > 0 && totalRatio.value !== 100
})

const countryTotalRatio = computed(() => {
  return formData.countries.reduce((sum, item) => {
    if (item.ratio) {
      return sum + (ratioMap[item.ratio] || 0)
    }
    return sum
  }, 0)
})

const countryRatioError = computed(() => {
  return formData.countries.length > 0 && countryTotalRatio.value !== 100
})

const availableCountries = computed(() => {
  const selectedCountries = formData.countries.map(c => c.country)
  return countryOptions.filter(c => !selectedCountries.includes(c.value)).map(c => c.value)
})

const aiKeywords = computed(() => {
  const text = formData.requirements
  const keywords = []
  const keywordPatterns = {
    '保费': ['保费', '价格', '费用', '优惠', '便宜'],
    '额度': ['额度', '限额', '配额', '保额', '金额'],
    '服务': ['服务', '质量', '响应', '理赔', '售后'],
    '融资': ['融资', '贷款', '资金', '周转'],
    '期限': ['期限', '账期', '周期', '时间']
  }
  for (const [keyword, patterns] of Object.entries(keywordPatterns)) {
    if (patterns.some(p => text.includes(p))) {
      keywords.push(keyword)
    }
  }
  return keywords
})

const aiSuggestion = computed(() => {
  const keywords = aiKeywords.value
  if (keywords.includes('保费') && keywords.includes('额度')) {
    return '建议选择性价比高的综合型保险方案'
  }
  if (keywords.includes('服务')) {
    return '建议选择服务质量优的保险机构'
  }
  if (keywords.includes('融资')) {
    return '建议选择支持保单融资的保险方案'
  }
  return '根据您的需求推荐标准保险方案'
})

const addCountry = (value) => {
  if (value && !formData.countries.some(c => c.country === value)) {
    formData.countries.push({ country: value, ratio: '' })
  }
  tempCountry.value = ''
}

const removeCountry = (index) => {
  formData.countries.splice(index, 1)
}

const rules = {
  // 主体信息
  companyName: [{ required: true, message: '请输入公司中文全称', trigger: 'blur' }],
  unifiedSocialCreditCode: [
    { required: true, message: '请输入统一社会信用代码', trigger: 'blur' },
    { pattern: /^[0-9A-Z]{18}$/, message: '统一社会信用代码为18位', trigger: 'blur' }
  ],
  registeredAddress: [{ required: true, message: '请输入注册地址', trigger: 'blur' }],
  businessAddress: [{ required: true, message: '请输入营业地址', trigger: 'blur' }],
  organizationCode: [{ required: true, message: '请输入组织机构代码', trigger: 'blur' }],
  establishmentYear: [
    { required: true, message: '请输入成立年份', trigger: 'blur' },
    { pattern: /^\d{4}$/, message: '成立年份为4位数字', trigger: 'blur' }
  ],
  legalRepresentative: [{ required: true, message: '请输入法定代表人姓名', trigger: 'blur' }],
  enterpriseNature: [{ required: true, message: '请选择企业性质', trigger: 'change' }],
  businessType: [{ required: true, message: '请选择经营性质', trigger: 'change' }],
  // 联系信息
  contactName: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  contactPosition: [{ required: true, message: '请输入联系人职务', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效手机号', trigger: 'blur' }
  ],
  companyEmail: [
    { required: true, message: '请输入企业邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  // 业务信息
  exportBusinessHistory: [{ required: true, message: '请选择出口业务经营历史', trigger: 'change' }],
  exportMainCountries: [{ required: true, message: '请选择出口主要国别/地区', trigger: 'change' }],
  mainExportIndustry: [{ required: true, message: '请选择主营出口行业', trigger: 'change' }],
  expectedInsurableTurnover: [{ required: true, message: '请输入预计可保营业额', trigger: 'blur' }],
  mainPaymentMethods: [{ required: true, message: '请选择主要付款方式', trigger: 'change' }],
  mostUsedPaymentTerm: [{ required: true, message: '请输入最常用的付款期限', trigger: 'blur' }],
  longestPaymentTerm: [{ required: true, message: '请输入最长付款期限', trigger: 'blur' }],
  hasLongerCreditPeriod: [{ required: true, message: '请选择是否为买家提供较长赊账期', trigger: 'change' }],
  // 投保核心需求
  insuranceType: [{ required: true, message: '请选择投保类型', trigger: 'change' }],
  preferredInsuranceOrgType: [{ required: true, message: '请选择投保倾向机构类型', trigger: 'change' }],
  insuranceBusinessScope: [{ required: true, message: '请选择投保业务范围', trigger: 'change' }],
  insuranceCurrency: [{ required: true, message: '请选择投保币种', trigger: 'change' }],
  insuranceAmount: [{ required: true, message: '请输入投保金额', trigger: 'blur' }],
  expectedInsurancePeriod: [{ required: true, message: '请选择期望保险期间', trigger: 'change' }],
  insurancePrimaryPurpose1: [{ required: true, message: '请选择最重要的投保目的', trigger: 'change' }],
  // 买方信息
  buyerName: [{ required: true, message: '请输入买方全称', trigger: 'blur' }],
  buyerCountry: [{ required: true, message: '请选择买方所在国家/地区', trigger: 'change' }],
  buyerAddress: [{ required: true, message: '请输入买方注册地址', trigger: 'blur' }],
  cooperationYearsWithBuyer: [{ required: true, message: '请选择与买方合作年限', trigger: 'change' }],
  last12MonthExportAmount: [{ required: true, message: '请输入过去12个月出口交易额', trigger: 'blur' }],
  paymentTerms: [{ required: true, message: '请输入付款条件', trigger: 'blur' }],
  appliedCreditLimit: [{ required: true, message: '请输入拟申请信用限额', trigger: 'blur' }],
  // 贸易基础信息
  exportProductCategory: [{ required: true, message: '请输入出口商品/服务品类', trigger: 'blur' }],
  involvesControlledGoods: [{ required: true, message: '请选择是否涉及管制商品', trigger: 'change' }],
  hasTitleRetentionClause: [{ required: true, message: '请选择贸易合同是否含物权保留条款', trigger: 'change' }],
  // 补充资料
  businessLicense: [{ required: true, message: '请上传企业法人营业执照扫描件', trigger: 'change' }],
  importExportQualification: [{ required: true, message: '请上传对外贸易经营者备案登记表', trigger: 'change' }],
  tradeContract: [{ required: true, message: '请上传近期贸易合同扫描件', trigger: 'change' }],
  customsDeclaration: [{ required: true, message: '请上传出口报关单扫描件', trigger: 'change' }],
  authorizationDocument: [{ required: true, message: '请上传授权保险公司联系买方的签字文件', trigger: 'change' }],
  // 投保声明
  declarationSignature: [{ required: true, message: '请输入投保人授权人签字', trigger: 'blur' }],
  declarationDate: [{ required: true, message: '请选择声明日期', trigger: 'change' }],
  companySeal: [{ required: true, message: '请上传加盖公司公章的声明文件', trigger: 'change' }]
}

const detailData = computed(() => {
  const id = route.params?.id
  if (!id) return null
  return store.insuranceApplications.find(it => it.id === id) || null
})

const customerColumns = [
  { label: '公司中文全称', key: 'companyName' },
  { label: '统一社会信用代码', key: 'unifiedSocialCreditCode' },
  { label: '注册地址', key: 'registeredAddress' },
  { label: '营业地址', key: 'businessAddress' },
  { label: '组织机构代码', key: 'organizationCode' },
  { label: '成立年份', key: 'establishmentYear' },
  { label: '法定代表人', key: 'legalRepresentative' },
  { label: '企业性质', key: 'enterpriseNature' },
  { label: '经营性质', key: 'businessType' },
  { label: '联系人', key: 'contactName' },
  { label: '联系人职务', key: 'contactPosition' },
  { label: '联系电话', key: 'contactPhone' },
  { label: '企业邮箱', key: 'companyEmail' }
]

const businessColumns = [
  { label: '出口业务经营历史', key: 'exportBusinessHistory' },
  { label: '出口主要国别/地区', key: 'exportMainCountries' },
  { label: '主营出口行业', key: 'mainExportIndustry' },
  { label: '预计可保营业额', key: 'expectedInsurableTurnover', formatter: (v, row) => `${row.turnoverCurrency || 'USD'} ${Number(v || 0).toLocaleString()}` },
  { label: '主要付款方式', key: 'mainPaymentMethods' },
  { label: '最常用付款期限（天）', key: 'mostUsedPaymentTerm' },
  { label: '最长付款期限（天）', key: 'longestPaymentTerm' },
  { label: '较长赊账期', key: 'hasLongerCreditPeriod' },
  { label: '最长赊账期（天）', key: 'longestCreditPeriod' }
]

const insuranceColumns = [
  { label: '投保类型', key: 'insuranceType' },
  { label: '投保倾向机构类型', key: 'preferredInsuranceOrgType' },
  { label: '投保业务范围', key: 'insuranceBusinessScope' },
  { label: '投保币种', key: 'insuranceCurrency' },
  { label: '投保金额', key: 'insuranceAmount', formatter: (v, row) => `${row.insuranceCurrency || 'USD'} ${Number(v || 0).toLocaleString()}` },
  { label: '期望保险期间', key: 'expectedInsurancePeriod' },
  { label: '投保主要目的1', key: 'insurancePrimaryPurpose1' },
  { label: '投保主要目的2', key: 'insurancePrimaryPurpose2' },
  { label: '投保主要目的3', key: 'insurancePrimaryPurpose3' },
  { label: '投保主要目的4', key: 'insurancePrimaryPurpose4' }
]

const buyerColumns = [
  { label: '买方全称', key: 'buyerName' },
  { label: '买方所在国别', key: 'buyerCountry' },
  { label: '买方注册地址', key: 'buyerAddress' },
  { label: '与买方合作年限', key: 'cooperationYearsWithBuyer' },
  { label: '过去12个月出口交易额（万美元）', key: 'last12MonthExportAmount' },
  { label: '过去12个月赊销交易额（万美元）', key: 'last12MonthCreditSalesAmount' },
  { label: '预计未来12个月赊销总额', key: 'expectedNext12MonthCreditSales', formatter: (v, row) => `${row.creditSalesCurrency || 'USD'} ${Number(v || 0).toLocaleString()}` },
  { label: '付款条件', key: 'paymentTerms' },
  { label: '拟申请信用限额', key: 'appliedCreditLimit', formatter: (v, row) => `${row.creditLimitCurrency || 'USD'} ${Number(v || 0).toLocaleString()}` },
  { label: '信用证开证行/SWIFT', key: 'lcIssuingBank' }
]

const tradeColumns = [
  { label: '出口商品/服务品类', key: 'exportProductCategory' },
  { label: '涉及管制商品', key: 'involvesControlledGoods' },
  { label: '管制商品名称', key: 'controlledGoodsDescription' },
  { label: '含物权保留条款', key: 'hasTitleRetentionClause' }
]

const policyBasicColumns = [
  { label: '保险单号', key: 'policyNo' },
  { label: '保险公司名称', key: 'insuranceCompanyName' },
  { label: '保险人名称', key: 'insurerName' },
  { label: '被保险人名称', key: 'insuredName' },
  { label: '受益人名称', key: 'beneficiaryName' },
  { label: '保险起期', key: 'policyStartDate' },
  { label: '保险止期', key: 'policyEndDate' },
  { label: '保险期间', key: 'policyPeriod' },
  { label: '续保标识', key: 'renewalFlag' },
  { label: '投保金额', key: 'coverageAmount', formatter: (v, row) => `${row.insuranceCurrency || 'USD'} ${Number(v || 0).toLocaleString()}` },
  { label: '国家风险类别版本', key: 'countryRiskVersion' },
  { label: '条款版本', key: 'clauseVersion' },
  { label: '约定保险范围', key: 'agreedCoverageScope' },
  { label: '业务类型', key: 'tradeBusinessType' }
]

const policyLimitColumns = [
  { label: '最高赔偿限额', key: 'maxCompensationLimit', formatter: (v) => v ? `USD ${Number(v).toLocaleString()}` : '-' },
  { label: '买方信用限额', key: 'buyerCreditLimit', formatter: (v) => v ? `USD ${Number(v).toLocaleString()}` : '-' },
  { label: '承保风险及赔偿比例', key: 'coveredRisks' },
  { label: '限额闲置期（天）', key: 'limitIdlePeriod', formatter: (v) => v ? `${v}天` : '-' },
  { label: '自行掌握限额', key: 'selfControlledLimit' },
  { label: '免赔额', key: 'deductible', formatter: (v) => v ? `USD ${Number(v).toLocaleString()}` : '-' }
]

const policyDeclareColumns = [
  { label: '申报方式', key: 'declarationMethod' },
  { label: '申报周期', key: 'declarationCycle' },
  { label: '申报截至日期', key: 'declarationDeadline' }
]

const policyFeeColumns = [
  { label: '保险费率', key: 'premiumRate', formatter: (v) => v ? `${v}%` : '-' },
  { label: '缴费期限', key: 'premiumPaymentDeadline' },
  { label: '缴费方式', key: 'premiumPaymentMethod' },
  { label: '保费', key: 'premium', formatter: (v) => v ? `USD ${Number(v).toLocaleString()}` : '-' },
  { label: '退保费用', key: 'surrenderFee', formatter: (v) => v ? `USD ${Number(v).toLocaleString()}` : '-' },
  { label: '赔款追回款项支付对象', key: 'recoveryPayee' }
]

const policyFileColumns = [
  { label: '保单文件', key: 'policyFile', formatter: (v) => Array.isArray(v) && v.length > 0 ? v.map(f => f.name).join('; ') : '-' },
  { label: '批单文件', key: 'endorsementFile', formatter: (v) => Array.isArray(v) && v.length > 0 ? v.map(f => f.name).join('; ') : '-' }
]

const processTimeline = computed(() => {
  const base = detailData.value
  if (!base) return []
  const timeline = [
    { time: base.createTime || '-', content: '创建投保记录', color: 'success' }
  ]
  if (base.status === 'credit_investigating') timeline.push({ time: base.updateTime || '-', content: '提交投保申请（资信调查中）', color: 'primary' })
  if (base.status === 'completed') timeline.push({ time: base.updateTime || '-', content: '投保完成（生成保单/额度）', color: 'success' })
  return timeline
})

const initForm = () => {
  if (mode.value === 'create') return
  const row = detailData.value
  if (!row) return
  Object.assign(formData, {
    // 主体信息
    companyName: row.companyName || '',
    unifiedSocialCreditCode: row.unifiedSocialCreditCode || '',
    registeredAddress: row.registeredAddress || '',
    businessAddress: row.businessAddress || '',
    organizationCode: row.organizationCode || '',
    establishmentYear: row.establishmentYear || '',
    legalRepresentative: row.legalRepresentative || '',
    enterpriseNature: row.enterpriseNature || '',
    businessType: row.businessType || '',
    // 联系信息
    contactName: row.contactName || '',
    contactPosition: row.contactPosition || '',
    contactPhone: row.contactPhone || '',
    companyEmail: row.companyEmail || '',
    // 业务信息
    exportBusinessHistory: row.exportBusinessHistory || '',
    exportMainCountries: row.exportMainCountries || [],
    mainExportIndustry: row.mainExportIndustry || '',
    expectedInsurableTurnover: row.expectedInsurableTurnover ?? null,
    turnoverCurrency: row.turnoverCurrency || 'USD',
    mainPaymentMethods: row.mainPaymentMethods || '',
    mostUsedPaymentTerm: row.mostUsedPaymentTerm ?? null,
    longestPaymentTerm: row.longestPaymentTerm ?? null,
    hasLongerCreditPeriod: row.hasLongerCreditPeriod || '',
    longestCreditPeriod: row.longestCreditPeriod ?? null,
    // 投保核心需求
    insuranceType: row.insuranceType || '',
    preferredInsuranceOrgType: row.preferredInsuranceOrgType || '',
    insuranceBusinessScope: row.insuranceBusinessScope || '',
    insuranceCurrency: row.insuranceCurrency || 'USD',
    insuranceAmount: row.insuranceAmount ?? null,
    expectedInsurancePeriod: row.expectedInsurancePeriod || [],
    insurancePrimaryPurpose1: row.insurancePrimaryPurpose1 || '',
    insurancePrimaryPurpose2: row.insurancePrimaryPurpose2 || '',
    insurancePrimaryPurpose3: row.insurancePrimaryPurpose3 || '',
    insurancePrimaryPurpose4: row.insurancePrimaryPurpose4 || '',
    // 买方信息
    buyerName: row.buyerName || '',
    buyerCountry: row.buyerCountry || '',
    buyerAddress: row.buyerAddress || '',
    cooperationYearsWithBuyer: row.cooperationYearsWithBuyer || '',
    last12MonthExportAmount: row.last12MonthExportAmount ?? null,
    last12MonthCreditSalesAmount: row.last12MonthCreditSalesAmount ?? null,
    expectedNext12MonthCreditSales: row.expectedNext12MonthCreditSales ?? null,
    creditSalesCurrency: row.creditSalesCurrency || 'USD',
    paymentTerms: row.paymentTerms || '',
    appliedCreditLimit: row.appliedCreditLimit ?? null,
    creditLimitCurrency: row.creditLimitCurrency || 'USD',
    lcIssuingBank: row.lcIssuingBank || '',
    // 贸易基础信息
    exportProductCategory: row.exportProductCategory || '',
    involvesControlledGoods: row.involvesControlledGoods || '',
    controlledGoodsDescription: row.controlledGoodsDescription || '',
    hasTitleRetentionClause: row.hasTitleRetentionClause || '',
    // 补充资料
    businessLicense: row.businessLicense ?? null,
    importExportQualification: row.importExportQualification ?? null,
    tradeContract: row.tradeContract ?? null,
    customsDeclaration: row.customsDeclaration ?? null,
    exportLicense: row.exportLicense ?? null,
    authorizationDocument: row.authorizationDocument ?? null,
    // 投保声明
    declarationSignature: row.declarationSignature || '',
    declarationDate: row.declarationDate || '',
    companySeal: row.companySeal ?? null,
    // 保单数字化信息
    policyNo: row.policyNo || '',
    insuranceCompanyName: row.insuranceCompanyName || '',
    insurerName: row.insurerName || '',
    insuredName: row.insuredName || '',
    beneficiaryName: row.beneficiaryName || '',
    policyPeriodRange: row.policyStartDate && row.policyEndDate ? [row.policyStartDate, row.policyEndDate] : [],
    policyPeriod: row.policyPeriod || '',
    renewalFlag: row.renewalFlag || '',
    countryRiskVersion: row.countryRiskVersion || '',
    clauseVersion: row.clauseVersion || '',
    agreedCoverageScope: row.agreedCoverageScope || '',
    tradeBusinessType: row.tradeBusinessType || '',
    maxCompensationLimit: row.maxCompensationLimit ?? null,
    buyerCreditLimit: row.buyerCreditLimit ?? null,
    coveredRisks: row.coveredRisks || '',
    limitIdlePeriod: row.limitIdlePeriod ?? null,
    selfControlledLimit: row.selfControlledLimit || '',
    deductible: row.deductible ?? null,
    declarationMethod: row.declarationMethod || '',
    declarationCycle: row.declarationCycle || '',
    declarationDeadline: row.declarationDeadline || '',
    premiumRate: row.premiumRate ?? null,
    premiumPaymentDeadline: row.premiumPaymentDeadline || '',
    premiumPaymentMethod: row.premiumPaymentMethod || '',
    premium: row.premium ?? null,
    surrenderFee: row.surrenderFee ?? null,
    recoveryPayee: row.recoveryPayee || '',
    policyFile: row.policyFile ?? null,
    endorsementFile: row.endorsementFile ?? null
  })
}

const handleBack = () => {
  router.push('/insurance/purchase')
}

const handleSave = () => {
  const payload = { ...formData, id: formData.id || undefined }
  if (Array.isArray(payload.policyPeriodRange) && payload.policyPeriodRange.length === 2) {
    payload.policyStartDate = payload.policyPeriodRange[0]
    payload.policyEndDate = payload.policyPeriodRange[1]
  }
  const saved = store.createOrUpdateInsuranceApplication(payload)
  router.replace(`/insurance/purchase/${saved.id}/edit`)
  MessagePlugin.success('已保存')
}

const handleSubmit = async () => {
  const result = await formRef.value?.validate?.()
  if (result !== true) return
  const saved = store.createOrUpdateInsuranceApplication({ ...formData, id: formData.id || undefined })
  const res = store.submitInsuranceApplication(saved.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '提交失败')
    return
  }
  MessagePlugin.success('提交成功，已进入资信调查')
  router.push('/insurance/purchase')
}

onMounted(() => {
  store.ensureSeeded()
  initForm()
})
</script>

<style lang="scss" scoped>
.form-layout-scroll {
  display: flex;
  gap: 16px;
  height: calc(100vh - 180px);
  overflow: hidden;
}

.scroll-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  position: sticky;
  top: 0;
  height: fit-content;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e7e7e7;
}

.sidebar-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: #555;

  &:hover {
    background: #f0f5ff;
    color: #1d39c4;
  }

  &.active {
    background: #1d39c4;
    color: #fff;

    .section-num {
      background: #fff;
      color: #1d39c4;
    }
  }
}

.section-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e6efff;
  color: #1d39c4;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.section-name {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  height: calc(100vh - 200px);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a1a1a1;
    }
  }
}

.form-card {
  margin-bottom: 16px;
}

.form-section {
  padding: 24px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #1d39c4;
}

.section-header .section-num {
  width: 32px;
  height: 32px;
  font-size: 14px;
  background: #1d39c4;
  color: #fff;
}

.section-header .section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.section-title-sub {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin: 20px 0 16px;
  padding-left: 12px;
  border-left: 3px solid #1d39c4;
}

.step-card {
  position: sticky;
  top: 16px;
}

.step-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.form-item-full {
  grid-column: 1 / -1;
}

.declaration-text {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.8;
  color: #666;
}

.declaration-text p {
  margin: 0 0 8px 0;
}

.declaration-text p:last-child {
  margin-bottom: 0;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.payment-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.ratio-summary {
  margin-top: 12px;
  font-size: 13px;
  color: #059669;
  display: flex;
  gap: 16px;
}

.ratio-summary.error {
  color: #dc2626;
}

.country-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.country-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.country-row span:first-child {
  min-width: 100px;
}

.ai-analysis {
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
}

.ai-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 12px;
}

.ai-icon {
  font-size: 18px;
}

.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.ai-suggestion {
  font-size: 14px;
  color: #475569;
}
</style>
