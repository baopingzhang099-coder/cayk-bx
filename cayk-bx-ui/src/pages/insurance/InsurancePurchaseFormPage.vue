<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">{{ pageTitle }}</div>
      <div class="page-actions" v-if="mode !== 'detail'">
        <t-space>
          <t-button variant="outline" @click="handleSave">保存</t-button>
          <t-button theme="primary" @click="handleSubmit">提交</t-button>
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
        <t-tab-panel value="process" label="流程记录">
          <t-timeline mode="alternate">
            <t-timeline-item v-for="item in processTimeline" :key="item.time" :content="item.content" :time="item.time" :color="item.color" />
          </t-timeline>
        </t-tab-panel>
      </t-tabs>
    </t-card>

    <div v-if="mode !== 'detail'" class="form-layout">
      <t-card class="step-card">
        <t-steps layout="vertical" :current="activeStep">
          <t-step title="客户基础信息" />
          <t-step title="业务信息" />
          <t-step title="投保核心需求" />
          <t-step title="买方信息" />
          <t-step title="贸易基础信息" />
          <t-step title="补充资料" />
          <t-step title="投保声明" />
        </t-steps>
        <div class="step-actions">
          <t-space>
            <t-button variant="outline" :disabled="activeStep === 0" @click="activeStep -= 1">上一步</t-button>
            <t-button theme="primary" :disabled="activeStep === 6" @click="activeStep += 1">下一步</t-button>
          </t-space>
        </div>
      </t-card>

      <t-card class="form-card">
        <t-form ref="formRef" :data="formData" :rules="rules" label-align="top">
          <!-- Step 0: 客户基础信息 -->
          <template v-if="activeStep === 0">
            <div class="section-title">主体信息</div>
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

            <div class="section-title">联系信息</div>
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
          </template>

          <!-- Step 1: 业务信息 -->
          <template v-else-if="activeStep === 1">
            <div class="section-title">出口业务经营</div>
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
          </template>

          <!-- Step 2: 投保核心需求 -->
          <template v-else-if="activeStep === 2">
            <div class="section-title">投保意向</div>
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

            <div class="section-title">投保主要目的（按重要性填写1-4）</div>
            <div class="form-grid">
              <t-form-item label="最重要的目的" name="insurancePrimaryPurpose1">
                <t-select v-model="formData.insurancePrimaryPurpose1" placeholder="1=最重要" clearable>
                  <t-option value="保障出口收汇安全" label="保障出口收汇安全" />
                  <t-option value="获取银行贸易融资" label="获取银行贸易融资" />
                  <t-option value="提升公司内部管理" label="提升公司内部管理" />
                  <t-option value="取得海外买方信息" label="取得海外买方信息" />
                </t-select>
              </t-form-item>
              <t-form-item label="次重要的目的" name="insurancePrimaryPurpose2">
                <t-select v-model="formData.insurancePrimaryPurpose2" placeholder="请选择" clearable>
                  <t-option value="保障出口收汇安全" label="保障出口收汇安全" />
                  <t-option value="获取银行贸易融资" label="获取银行贸易融资" />
                  <t-option value="提升公司内部管理" label="提升公司内部管理" />
                  <t-option value="取得海外买方信息" label="取得海外买方信息" />
                </t-select>
              </t-form-item>
              <t-form-item label="第三重要的目的" name="insurancePrimaryPurpose3">
                <t-select v-model="formData.insurancePrimaryPurpose3" placeholder="请选择" clearable>
                  <t-option value="保障出口收汇安全" label="保障出口收汇安全" />
                  <t-option value="获取银行贸易融资" label="获取银行贸易融资" />
                  <t-option value="提升公司内部管理" label="提升公司内部管理" />
                  <t-option value="取得海外买方信息" label="取得海外买方信息" />
                </t-select>
              </t-form-item>
              <t-form-item label="最次要的目的" name="insurancePrimaryPurpose4">
                <t-select v-model="formData.insurancePrimaryPurpose4" placeholder="请选择" clearable>
                  <t-option value="保障出口收汇安全" label="保障出口收汇安全" />
                  <t-option value="获取银行贸易融资" label="获取银行贸易融资" />
                  <t-option value="提升公司内部管理" label="提升公司内部管理" />
                  <t-option value="取得海外买方信息" label="取得海外买方信息" />
                </t-select>
              </t-form-item>
            </div>
          </template>

          <!-- Step 3: 买方信息 -->
          <template v-else-if="activeStep === 3">
            <div class="section-title">买方基础信息</div>
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

            <div class="section-title">买方业务信息</div>
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
            </div>
          </template>

          <!-- Step 4: 贸易基础信息 -->
          <template v-else-if="activeStep === 4">
            <div class="section-title">贸易基础信息</div>
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
            </div>
          </template>

          <!-- Step 5: 补充资料上传 -->
          <template v-else-if="activeStep === 5">
            <div class="section-title">必传资料</div>
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
              <t-form-item label="授权保险公司联系买方的签字文件" name="authorizationDocument" class="form-item-full">
                <t-upload
                  v-model="formData.authorizationDocument"
                  action="https://demo.com/upload"
                  tips="格式：PDF/JPG/PNG；大小：单文件≤10MB"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </t-form-item>
            </div>
          </template>

          <!-- Step 6: 投保声明 -->
          <template v-else-if="activeStep === 6">
            <div class="section-title">投保人声明签署</div>
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
          </template>
        </t-form>
      </t-card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import DetailPanel from '@/components/common/DetailPanel.vue'
import { useBusinessStore } from '@/stores/business'

const route = useRoute()
const router = useRouter()
const store = useBusinessStore()

const formRef = ref(null)
const activeStep = ref(0)

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
  companySeal: null
})

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
    companySeal: row.companySeal ?? null
  })
}

const handleSave = () => {
  const saved = store.createOrUpdateInsuranceApplication({ ...formData, id: formData.id || undefined })
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
.form-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 16px;
  align-items: start;
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
</style>
