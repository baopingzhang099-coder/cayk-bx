<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/insurance/purchase">投保管理</t-breadcrumb-item>
        <t-breadcrumb-item>{{ pageTitle }}</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">{{ pageTitle }}</div>
      <div class="page-actions" v-if="mode !== 'detail'">
        <t-space>
          <t-button variant="outline" @click="handleBack">返回</t-button>
          <t-button theme="primary" @click="handleSubmit">申请投保</t-button>
        </t-space>
      </div>
      <div class="page-actions" v-else>
        <t-button variant="outline" @click="handleBack">返回列表</t-button>
      </div>
    </div>

    <!-- 投保流程看板 - 嵌入详情页 -->
    <div v-if="mode === 'detail' && detailData" class="process-flow-section">
      <div class="process-flow-header">
        <span class="process-flow-title">投保流程进度</span>
        <t-tag v-if="detailData.status === 'approved' || detailData.status === 'completed'" theme="success" variant="light" size="small">已完成</t-tag>
        <t-tag v-else-if="detailData.status === 'rejected'" theme="danger" variant="light" size="small">已退回</t-tag>
        <t-tag v-else theme="primary" variant="light" size="small">进行中</t-tag>
      </div>

      <div class="process-steps-bar">
        <template v-for="(step, idx) in processSteps" :key="idx">
          <div class="process-step-item">
            <div class="step-indicator" :class="getStepDotClass(idx)">
              <t-icon v-if="getStepStatus(idx) === 'completed'" name="check" class="step-check-icon" />
              <span v-else class="step-num">{{ idx + 1 }}</span>
            </div>
            <div class="step-label" :class="'step-' + getStepStatus(idx)">{{ step.label }}</div>
            <div class="step-role-tag" :class="'role-' + step.roleKey">{{ step.role }}</div>
          </div>
          <div v-if="idx < processSteps.length - 1" class="step-connector" :class="{ 'connector-done': getStepStatus(idx) === 'completed' }" />
        </template>
      </div>

      <!-- 流程步骤详情 -->
      <div class="process-detail-steps">
        <div class="detail-steps-title">投保流程详细步骤</div>
        <div class="detail-steps-list">
          <div
            v-for="(step, idx) in timelineSteps"
            :key="idx"
            class="timeline-item"
            :class="'tl-' + step.status"
          >
            <div class="tl-dot">
              <t-icon v-if="step.status === 'completed'" name="check" />
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <div class="tl-content">
              <!-- 可点击的标题行 -->
              <div class="tl-header" :class="{ clickable: true }" @click="toggleStep(idx)">
                <div class="tl-header-left">
                  <span class="tl-step-name">{{ step.stepName }}</span>
                  <t-tag
                    v-if="step.status === 'completed'"
                    theme="success"
                    variant="light"
                    size="small"
                  >已完成</t-tag>
                  <t-tag
                    v-else-if="step.status === 'active'"
                    theme="primary"
                    variant="light"
                    size="small"
                  >进行中</t-tag>
                  <t-tag
                    v-else
                    theme="default"
                    variant="light"
                    size="small"
                  >待处理</t-tag>
                </div>
                <div class="tl-header-right">
                  <span v-if="step.status !== 'pending'" class="tl-time-summary">{{ step.startTime }}</span>
                  <t-icon
                    :name="isStepExpanded(idx) ? 'chevron-up' : 'chevron-down'"
                    size="16px"
                    class="tl-expand-icon"
                  />
                </div>
              </div>
              <!-- 展开的内容 -->
              <div v-show="isStepExpanded(idx)" class="tl-body">
                <div class="tl-body-divider"></div>
                <div class="tl-info-row">
                  <t-icon name="user" size="14px" />
                  <span class="tl-info-label">操作人：</span>
                  <span class="tl-info-value">{{ step.operator }}</span>
                  <span class="tl-info-role">（{{ step.role }}）</span>
                </div>
                <div class="tl-info-row">
                  <t-icon name="calendar-1" size="14px" />
                  <span class="tl-info-label">开始时间：</span>
                  <span class="tl-info-value">{{ step.startTime }}</span>
                </div>
                <div class="tl-info-row">
                  <t-icon name="check-circle" size="14px" />
                  <span class="tl-info-label">结束时间：</span>
                  <span class="tl-info-value">{{ step.endTime }}</span>
                </div>
                <div class="tl-info-row">
                  <t-icon name="chat" size="14px" />
                  <span class="tl-info-label">处理内容：</span>
                  <span class="tl-info-value">{{ step.description }}</span>
                </div>
                <div v-if="step.files && step.files.length > 0" class="tl-info-row">
                  <t-icon name="file" size="14px" />
                  <span class="tl-info-label">相关文件：</span>
                  <span class="tl-info-value">
                    <template v-for="(f, fi) in step.files" :key="fi">
                      <t-icon v-if="f.checked" name="check-circle-filled" size="14px" class="file-checked-icon" />
                      <a v-if="f.url" class="tl-file-link" @click.stop="f.preview">{{ f.name }}</a>
                      <span v-else>{{ f.name }}</span>
                      <span v-if="fi < step.files.length - 1">、</span>
                    </template>
                  </span>
                </div>
                <!-- 审核区域：仅对需要审核的步骤且当前角色匹配时显示 -->
                <div v-if="step.needReview && step.status === 'active'" class="tl-review-section">
                  <div class="tl-review-title">审核信息</div>
                  <div class="tl-review-status">
                    <span class="tl-info-label">审核状态：</span>
                    <t-tag v-if="step.reviewStatus === 'approved'" theme="success" variant="light" size="small">已通过</t-tag>
                    <t-tag v-else-if="step.reviewStatus === 'rejected'" theme="danger" variant="light" size="small">已驳回</t-tag>
                    <t-tag v-else theme="warning" variant="light" size="small">待审核</t-tag>
                  </div>
                  <div class="tl-review-field">
                    <span class="tl-info-label">审批建议：</span>
                    <t-textarea
                      v-if="step.reviewStatus === 'pending'"
                      v-model="reviewComments[idx]"
                      placeholder="请输入审批意见..."
                      :maxlength="500"
                      :rows="3"
                    />
                    <span v-else class="tl-review-comment">{{ step.reviewComment || '无' }}</span>
                  </div>
                  <div v-if="step.reviewStatus === 'pending'" class="tl-review-actions">
                    <t-button variant="outline" theme="danger" size="small" @click="handleRejectStep(idx)">
                      <template #icon><t-icon name="close-circle" /></template>
                      驳回
                    </t-button>
                    <t-button theme="primary" size="small" @click="handleApproveStep(idx)">
                      <template #icon><t-icon name="check-circle" /></template>
                      通过审核
                    </t-button>
                  </div>
                </div>
                <!-- 审核结果展示（已完成或待处理的审核步骤） -->
                <div v-else-if="step.needReview && step.reviewStatus && step.reviewStatus !== 'pending'" class="tl-review-section tl-review-readonly">
                  <div class="tl-review-title">审核信息</div>
                  <div class="tl-review-status">
                    <span class="tl-info-label">审核状态：</span>
                    <t-tag v-if="step.reviewStatus === 'approved'" theme="success" variant="light" size="small">已通过</t-tag>
                    <t-tag v-else-if="step.reviewStatus === 'rejected'" theme="danger" variant="light" size="small">已驳回</t-tag>
                  </div>
                  <div class="tl-review-field">
                    <span class="tl-info-label">审批建议：</span>
                    <span class="tl-review-comment">{{ step.reviewComment || '无' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <t-dialog v-model:visible="previewDialogVisible" :header="previewDialogTitle" width="960px" :footer="false" destroy-on-close>
      <div class="preview-modal">
        <t-tabs v-if="previewSheets.length > 1" v-model:value="previewActiveSheet" theme="card">
          <t-tab-panel v-for="sheet in previewSheets" :key="sheet.name" :value="sheet.name" :label="sheet.name">
            <div class="preview-table-wrap" v-html="sheet.html"></div>
          </t-tab-panel>
        </t-tabs>
        <div v-else-if="previewSheets.length === 1" class="preview-table-wrap" v-html="previewSheets[0].html"></div>
        <empty-state v-else description="暂无数据" />
        <div class="modal-footer">
          <t-button variant="outline" @click="handleDownloadPreview">下载文件</t-button>
          <t-button variant="outline" @click="previewDialogVisible = false">关闭</t-button>
        </div>
      </div>
    </t-dialog>

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
              <t-form-item label="公司英文名称" name="companyEnglishName">
                <t-input v-model="formData.companyEnglishName" placeholder="境外业务必填，准确填写官方英文名称（选填）" />
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
              <t-form-item label="传真号码" name="faxNumber">
                <t-input v-model="formData.faxNumber" placeholder="请输入传真号码（选填）" />
              </t-form-item>
            </div>

            <div class="section-title-sub">资质文件</div>
            <div class="form-grid">
              <t-form-item label="企业法人营业执照扫描件" name="businessLicense" class="form-item-full">
                <t-upload
                  v-model="formData.businessLicense"
                  action="https://demo.com/upload"
                />
              </t-form-item>
              <t-form-item label="对外贸易经营者备案登记表" name="importExportQualification" class="form-item-full">
                <t-upload
                  v-model="formData.importExportQualification"
                  action="https://demo.com/upload"
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
              <!-- 业务信息字段（新增） -->
              <t-form-item label="行业细分品类" name="industrySubCategory" class="form-item-full">
                <t-select v-model="formData.industrySubCategory" placeholder="请选择行业细分品类（选填）" clearable filterable>
                  <t-option value="乘用车" label="乘用车" />
                  <t-option value="新能源汽车" label="新能源汽车" />
                  <t-option value="客车/货车" label="客车/货车" />
                  <t-option value="烟草制造" label="烟草制造" />
                  <t-option value="碳酸饮料" label="碳酸饮料" />
                  <t-option value="茶叶/茶饮料" label="茶叶/茶饮料" />
                  <t-option value="计算机及通讯" label="计算机及通讯" />
                  <t-option value="家用电器" label="家用电器" />
                  <t-option value="纺织服装" label="纺织服装" />
                </t-select>
              </t-form-item>
              <t-form-item label="关联公司名单及关系" name="relatedCompanies" class="form-item-full">
                <t-input v-model="formData.relatedCompanies" placeholder="填写关联公司名称、关联关系，如母子公司、兄弟公司等（选填）" />
              </t-form-item>
              <t-form-item label="是否有现有信用险保单" name="existingCreditPolicy" class="form-item-full">
                <t-select v-model="formData.existingCreditPolicy" placeholder="请选择" clearable>
                  <t-option value="是" label="是" />
                  <t-option value="否" label="否" />
                </t-select>
              </t-form-item>
              <template v-if="formData.existingCreditPolicy === '是'">
                <t-form-item label="现保险人名称" name="existingCreditPolicyInsurer">
                  <t-input v-model="formData.existingCreditPolicyInsurer" placeholder="请输入现保险人名称" />
                </t-form-item>
                <t-form-item label="现有保单号" name="existingCreditPolicyNo">
                  <t-input v-model="formData.existingCreditPolicyNo" placeholder="请输入现有保单号" />
                </t-form-item>
                <t-form-item label="续保日期" name="existingCreditPolicyRenewalDate">
                  <t-date-picker v-model="formData.existingCreditPolicyRenewalDate" placeholder="请选择续保日期" />
                </t-form-item>
              </template>
              <!-- 历史业务情况（新增） -->
              <div class="section-title-sub" style="margin-top: 24px;">历史业务情况</div>
              <div class="form-grid">
                <t-form-item label="2023年出口总额（万美元）" name="threeYearExportAmount23">
                  <t-input-number v-model="formData.threeYearExportAmount23" placeholder="选填" :min="0" />
                </t-form-item>
                <t-form-item label="2024年出口总额（万美元）" name="threeYearExportAmount24">
                  <t-input-number v-model="formData.threeYearExportAmount24" placeholder="选填" :min="0" />
                </t-form-item>
                <t-form-item label="2025年出口总额（万美元）" name="threeYearExportAmount25">
                  <t-input-number v-model="formData.threeYearExportAmount25" placeholder="选填" :min="0" />
                </t-form-item>
                <t-form-item label="2023年赊销总额（万美元）" name="threeYearCreditSales23">
                  <t-input-number v-model="formData.threeYearCreditSales23" placeholder="选填" :min="0" />
                </t-form-item>
                <t-form-item label="2024年赊销总额（万美元）" name="threeYearCreditSales24">
                  <t-input-number v-model="formData.threeYearCreditSales24" placeholder="选填" :min="0" />
                </t-form-item>
                <t-form-item label="2025年赊销总额（万美元）" name="threeYearCreditSales25">
                  <t-input-number v-model="formData.threeYearCreditSales25" placeholder="选填" :min="0" />
                </t-form-item>
                <t-form-item label="业务的特殊性" name="exportBusinessSpecial" class="form-item-full">
                  <t-select v-model="formData.exportBusinessSpecial" placeholder="选填" clearable multiple>
                    <t-option value="寄售" label="寄售" />
                    <t-option value="季节性销售" label="季节性销售" />
                    <t-option value="半成品" label="半成品" />
                    <t-option value="长期合同" label="长期合同" />
                  </t-select>
                </t-form-item>
                <t-form-item label="现金交易占比（%）" name="cashTransactionRatio">
                  <t-input-number v-model="formData.cashTransactionRatio" placeholder="选填" :min="0" :max="100" />
                </t-form-item>
                <t-form-item label="信用证交易占比（%）" name="lcTransactionRatio">
                  <t-input-number v-model="formData.lcTransactionRatio" placeholder="选填" :min="0" :max="100" />
                </t-form-item>
                <t-form-item label="关联交易占比（%）" name="relatedPartyRatio">
                  <t-input-number v-model="formData.relatedPartyRatio" placeholder="选填" :min="0" :max="100" />
                </t-form-item>
                <t-form-item label="赊账交易占比（%）" name="creditTransactionRatio">
                  <t-input-number v-model="formData.creditTransactionRatio" placeholder="选填" :min="0" :max="100" />
                </t-form-item>
                <t-form-item label="托收交易占比（%）" name="collectionRatio">
                  <t-input-number v-model="formData.collectionRatio" placeholder="选填" :min="0" :max="100" />
                </t-form-item>
              </div>
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
                />
              </t-form-item>

              <!-- 买方补充信息（新增） -->
              <div class="subsection-header" style="margin-top: 24px; padding: 8px 12px; background: #f5f7fa; border-radius: 6px;">
                <span style="font-weight: 600; font-size: 14px; color: var(--td-brand-color);">买方补充信息（新增）</span>
              </div>
              <t-form-item label="历史逾期情况" name="historicalOverdueStatus">
                <t-select v-model="formData.historicalOverdueStatus" placeholder="请选择" clearable>
                  <t-option value="无逾期" label="无逾期" />
                  <t-option value="有逾期但已结清" label="有逾期但已结清" />
                  <t-option value="有逾期未结清" label="有逾期未结清" />
                </t-select>
              </t-form-item>
              <t-form-item label="买方是否有公开财报" name="buyerHasPublicFinancials">
                <t-select v-model="formData.buyerHasPublicFinancials" placeholder="请选择" clearable>
                  <t-option value="是" label="是" />
                  <t-option value="否" label="否" />
                  <t-option value="未知" label="未知" />
                </t-select>
              </t-form-item>
              <t-form-item label="买方是否为上市公司" name="buyerIsListedCompany">
                <t-select v-model="formData.buyerIsListedCompany" placeholder="请选择" clearable>
                  <t-option value="是" label="是" />
                  <t-option value="否" label="否" />
                  <t-option value="未知" label="未知" />
                </t-select>
              </t-form-item>
              <t-form-item label="买方是否有负面新闻/诉讼" name="buyerHasNegativeNews">
                <t-select v-model="formData.buyerHasNegativeNews" placeholder="请选择" clearable>
                  <t-option value="是" label="是" />
                  <t-option value="否" label="否" />
                  <t-option value="未知" label="未知" />
                </t-select>
              </t-form-item>
              <t-form-item v-if="formData.buyerHasNegativeNews === '是'" label="负面新闻/诉讼说明" name="buyerHasNegativeNewsDesc" class="form-item-full">
                <t-input v-model="formData.buyerHasNegativeNewsDesc" placeholder="请简要说明负面新闻或诉讼情况" />
              </t-form-item>
              <t-form-item label="是否指定具体保险公司" name="designatedInsuranceCompany">
                <t-select v-model="formData.designatedInsuranceCompany" placeholder="请选择" clearable>
                  <t-option value="是" label="是" />
                  <t-option value="否" label="否" />
                </t-select>
              </t-form-item>
              <t-form-item v-if="formData.designatedInsuranceCompany === '是'" label="指定保险公司名称" name="designatedInsuranceCompanyName">
                <t-select v-model="formData.designatedInsuranceCompanyName" placeholder="请选择" clearable>
                  <t-option value="中国信保" label="中国信保" />
                  <t-option value="人保财险" label="人保财险" />
                  <t-option value="太保产险" label="太保产险" />
                  <t-option value="平安产险" label="平安产险" />
                  <t-option value="其他" label="其他" />
                </t-select>
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
                  multiple
                />
              </t-form-item>
              <t-form-item label="出口报关单扫描件（样本）" name="customsDeclaration" class="form-item-full">
                <t-upload
                  v-model="formData.customsDeclaration"
                  action="https://demo.com/upload"
                  multiple
                />
              </t-form-item>
              <t-form-item v-if="formData.involvesControlledGoods === '是'" label="出口许可证" name="exportLicense" class="form-item-full">
                <t-upload
                  v-model="formData.exportLicense"
                  action="https://demo.com/upload"
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
                  />
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
import { useUserStore } from '@/stores/user'
import * as XLSX from 'xlsx'
import { generatePolicyApplicationXlsx, generateBuyerInfoXlsx } from '@/utils/templateFiller'

const route = useRoute()
const router = useRouter()
const store = useBusinessStore()
const userStore = useUserStore()

const formRef = ref(null)
const activeStep = ref(0)
const activeSection = ref(0)

const formSections = [
  '客户基础信息',
  '业务信息',
  '投保核心需求',
  '买方信息',
  '贸易基础信息',
  '投保声明'
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
      for (let i = 0; i < 6; i++) {
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
  companyEnglishName: '',
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
  faxNumber: '',
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
  industrySubCategory: '',
  relatedCompanies: '',
  existingCreditPolicy: '',
  existingCreditPolicyInsurer: '',
  existingCreditPolicyNo: '',
  existingCreditPolicyRenewalDate: '',
  // 历史业务情况（新增）
  threeYearExportAmount23: null,
  threeYearExportAmount24: null,
  threeYearExportAmount25: null,
  threeYearCreditSales23: null,
  threeYearCreditSales24: null,
  threeYearCreditSales25: null,
  exportBusinessSpecial: [],
  cashTransactionRatio: null,
  lcTransactionRatio: null,
  relatedPartyRatio: null,
  creditTransactionRatio: null,
  collectionRatio: null,
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
  // 买方补充信息（新增）
  historicalOverdueStatus: '',
  buyerHasPublicFinancials: '',
  buyerIsListedCompany: '',
  buyerHasNegativeNews: '',
  buyerHasNegativeNewsDesc: '',
  designatedInsuranceCompany: '',
  designatedInsuranceCompanyName: '',
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
  // 所有字段校验暂时全部放开，不做必填和格式限制
  companyName: [],
  companyEnglishName: [],
  unifiedSocialCreditCode: [],
  registeredAddress: [],
  businessAddress: [],
  organizationCode: [],
  establishmentYear: [],
  legalRepresentative: [],
  enterpriseNature: [],
  businessType: [],
  contactName: [],
  contactPosition: [],
  contactPhone: [],
  companyEmail: [],
  faxNumber: [],
  exportBusinessHistory: [],
  exportMainCountries: [],
  mainExportIndustry: [],
  expectedInsurableTurnover: [],
  mainPaymentMethods: [],
  mostUsedPaymentTerm: [],
  longestPaymentTerm: [],
  hasLongerCreditPeriod: [],
  industrySubCategory: [],
  relatedCompanies: [],
  existingCreditPolicy: [],
  existingCreditPolicyInsurer: [],
  existingCreditPolicyNo: [],
  existingCreditPolicyRenewalDate: [],
  threeYearExportAmount23: [],
  threeYearExportAmount24: [],
  threeYearExportAmount25: [],
  threeYearCreditSales23: [],
  threeYearCreditSales24: [],
  threeYearCreditSales25: [],
  exportBusinessSpecial: [],
  cashTransactionRatio: [],
  lcTransactionRatio: [],
  relatedPartyRatio: [],
  creditTransactionRatio: [],
  collectionRatio: [],
  insuranceType: [],
  preferredInsuranceOrgType: [],
  insuranceBusinessScope: [],
  insuranceCurrency: [],
  insuranceAmount: [],
  expectedInsurancePeriod: [],
  insurancePrimaryPurpose1: [],
  buyerName: [],
  buyerCountry: [],
  buyerAddress: [],
  cooperationYearsWithBuyer: [],
  last12MonthExportAmount: [],
  last12MonthCreditSalesAmount: [],
  expectedNext12MonthCreditSales: [],
  creditSalesCurrency: [],
  paymentTerms: [],
  appliedCreditLimit: [],
  creditLimitCurrency: [],
  lcIssuingBank: [],
  historicalOverdueStatus: [],
  buyerHasPublicFinancials: [],
  buyerIsListedCompany: [],
  buyerHasNegativeNews: [],
  buyerHasNegativeNewsDesc: [],
  designatedInsuranceCompany: [],
  designatedInsuranceCompanyName: [],
  exportProductCategory: [],
  involvesControlledGoods: [],
  controlledGoodsDescription: [],
  hasTitleRetentionClause: [],
  businessLicense: [],
  importExportQualification: [],
  tradeContract: [],
  customsDeclaration: [],
  exportLicense: [],
  authorizationDocument: [],
  declarationSignature: [],
  declarationDate: [],
  companySeal: []
}

const detailData = computed(() => {
  const id = route.params?.id
  if (!id) return null
  return store.insuranceApplications.find(it => it.id === id) || null
})

const customerColumns = [
  { label: '公司中文全称', key: 'companyName' },
  { label: '公司英文名称', key: 'companyEnglishName' },
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
  { label: '企业邮箱', key: 'companyEmail' },
  { label: '传真号码', key: 'faxNumber' }
]

const businessColumns = [
  { label: '出口业务经营历史', key: 'exportBusinessHistory' },
  { label: '出口主要国别/地区', key: 'exportMainCountries' },
  { label: '主营出口行业', key: 'mainExportIndustry' },
  { label: '行业细分品类', key: 'industrySubCategory' },
  { label: '预计可保营业额', key: 'expectedInsurableTurnover', formatter: (v, row) => `${row.turnoverCurrency || 'USD'} ${Number(v || 0).toLocaleString()}` },
  { label: '主要付款方式', key: 'mainPaymentMethods' },
  { label: '最常用付款期限（天）', key: 'mostUsedPaymentTerm' },
  { label: '最长付款期限（天）', key: 'longestPaymentTerm' },
  { label: '较长赊账期', key: 'hasLongerCreditPeriod' },
  { label: '最长赊账期（天）', key: 'longestCreditPeriod' },
  { label: '关联公司', key: 'relatedCompanies' },
  { label: '现有信用险保单', key: 'existingCreditPolicy' },
  // 历史业务情况（新增）
  { label: '2023年出口总额（万美元）', key: 'threeYearExportAmount23' },
  { label: '2024年出口总额（万美元）', key: 'threeYearExportAmount24' },
  { label: '2025年出口总额（万美元）', key: 'threeYearExportAmount25' },
  { label: '2023年赊销总额（万美元）', key: 'threeYearCreditSales23' },
  { label: '2024年赊销总额（万美元）', key: 'threeYearCreditSales24' },
  { label: '2025年赊销总额（万美元）', key: 'threeYearCreditSales25' },
  { label: '业务的特殊性', key: 'exportBusinessSpecial' },
  { label: '现金交易占比', key: 'cashTransactionRatio', formatter: v => v != null ? `${v}%` : '-' },
  { label: '信用证交易占比', key: 'lcTransactionRatio', formatter: v => v != null ? `${v}%` : '-' },
  { label: '关联交易占比', key: 'relatedPartyRatio', formatter: v => v != null ? `${v}%` : '-' },
  { label: '赊账交易占比', key: 'creditTransactionRatio', formatter: v => v != null ? `${v}%` : '-' },
  { label: '托收交易占比', key: 'collectionRatio', formatter: v => v != null ? `${v}%` : '-' }
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
  { label: '信用证开证行/SWIFT', key: 'lcIssuingBank' },
  // 买方补充信息（新增）
  { label: '历史逾期情况', key: 'historicalOverdueStatus' },
  { label: '买方是否有公开财报', key: 'buyerHasPublicFinancials' },
  { label: '买方是否为上市公司', key: 'buyerIsListedCompany' },
  { label: '买方是否有负面新闻/诉讼', key: 'buyerHasNegativeNews' },
  { label: '负面新闻/诉讼说明', key: 'buyerHasNegativeNewsDesc' },
  { label: '是否指定具体保险公司', key: 'designatedInsuranceCompany' },
  { label: '指定保险公司名称', key: 'designatedInsuranceCompanyName' }
]

const tradeColumns = [
  { label: '出口商品/服务品类', key: 'exportProductCategory' },
  { label: '涉及管制商品', key: 'involvesControlledGoods' },
  { label: '管制商品名称', key: 'controlledGoodsDescription' },
  { label: '含物权保留条款', key: 'hasTitleRetentionClause' }
]

// policy columns removed

const processSteps = [
  { label: '投保申请', role: '客户', roleKey: 'customer' },
  { label: '跟单员审核', role: '跟单员', roleKey: 'clerk' },
  { label: '服务确认', role: '客户/长安银科', roleKey: 'customer' },
  { label: '资信核保', role: '长安银科', roleKey: 'clerk' },
  { label: '保费支付', role: '客户', roleKey: 'customer' },
  { label: '保单生效', role: '长安银科', roleKey: 'inkasso' }
]

const statusStepMap = {
  draft: 0,
  rejected: 0,
  clerk_review: 1,
  contract_signing: 1,
  inkasso_signed: 2,
  contract_signed: 2,
  service_fee_paid: 2,
  credit_investigating: 3,
  limit_approving: 3,
  underwriting: 3,
  uw_completed: 3,
  platform_synced: 4,
  premium_confirmed: 4,
  payment_uploaded: 4,
  active: 5
}

const getCurrentStepIndex = () => {
  const app = detailData.value
  if (!app) return 0
  return statusStepMap[app.status] ?? 0
}

const getStepStatus = (idx) => {
  const current = getCurrentStepIndex()
  if (idx < current) return 'completed'
  if (idx === current) return 'active'
  return 'pending'
}

const getStepStatusText = (idx) => {
  const s = getStepStatus(idx)
  return s === 'completed' ? '已完成' : s === 'active' ? '进行中' : '待处理'
}

const getStepDotClass = (idx) => {
  return 'step-dot-' + getStepStatus(idx)
}

const getStepTagTheme = (idx) => {
  const s = getStepStatus(idx)
  return s === 'completed' ? 'success' : s === 'active' ? 'primary' : 'default'
}

const stepActions = [
  // Step 0: 投保申请
  {
    role: '客户',
    roleKey: 'customer',
    description: '填写完整的投保申请信息，上传企业资质文件，确认投保声明并签字提交',
    isActiveFor: ['draft', 'rejected']
  },
  // Step 1: 跟单员审核
  {
    role: '跟单员',
    roleKey: 'clerk',
    description: '审核客户提交的投保资料是否完整、准确，核对自动生成的投保申请书和买方信息采集表',
    isActiveFor: ['clerk_review', 'contract_signing']
  },
  {
    role: '长安银科',
    roleKey: 'inkasso',
    description: '在线签署短期出口信用保险合同',
    isActiveFor: ['contract_signing']
  },
  // Step 2: 服务确认
  {
    role: '客户',
    roleKey: 'customer',
    description: '确认并签署合同条款',
    isActiveFor: ['inkasso_signed']
  },
  {
    role: '客户',
    roleKey: 'customer',
    description: '合同已签署，请支付平台服务费',
    isActiveFor: ['contract_signed', 'service_fee_paid']
  },
  // Step 3: 资信核保
  {
    role: '长安银科',
    roleKey: 'inkasso',
    description: '对买方进行资信调查，包括信用评级、财务状况分析、历史交易记录核查',
    isActiveFor: ['credit_investigating']
  },
  {
    role: '长安银科',
    roleKey: 'inkasso',
    description: '根据资信调查结果评估信用限额，提交至保险公司审批',
    isActiveFor: ['limit_approving']
  },
  {
    role: '保险公司',
    roleKey: 'insurer',
    description: '审批信用限额申请，确认承保条件（由跟单员对接保险公司）',
    isActiveFor: ['limit_approving']
  },
  {
    role: '保险公司',
    roleKey: 'insurer',
    description: '保险公司核保并签发保单（跟单员全程配合）',
    isActiveFor: ['underwriting']
  },
  {
    role: '跟单员',
    roleKey: 'clerk',
    description: '对接保险公司完成核保出单，上传保单文件及费率表至系统',
    isActiveFor: ['underwriting']
  },
  {
    role: '跟单员',
    roleKey: 'clerk',
    description: '保险公司核保已完成，跟单员同步保单信息至平台',
    isActiveFor: ['uw_completed']
  },
  // Step 4: 保费支付
  {
    role: '客户',
    roleKey: 'customer',
    description: '确认保单详情及保费金额，确认无误后发起线下支付',
    isActiveFor: ['platform_synced']
  },
  {
    role: '客户',
    roleKey: 'customer',
    description: '保费金额已确认，请进行线下支付并上传支付凭证',
    isActiveFor: ['premium_confirmed']
  },
  {
    role: '长安银科',
    roleKey: 'inkasso',
    description: '确认保费到账，更新保单状态为生效',
    isActiveFor: ['payment_uploaded']
  },
  // Step 5: 保单生效
  {
    role: '长安银科',
    roleKey: 'inkasso',
    description: '确认保费已到账，保单正式生效',
    isActiveFor: ['active']
  }
]
const getCurrentStepActions = () => {
  const app = detailData.value
  if (!app) return []
  const status = app.status
  const matched = stepActions.filter(a => a.isActiveFor.includes(status))
  if (matched.length > 0) {
    const current = getCurrentStepIndex()
    return matched.map(a => ({
      ...a,
      isActive: a.isActiveFor.includes(status) && processSteps[current]?.roleKey === a.roleKey
    }))
  }
  // Fallback: show general info
  const current = getCurrentStepIndex()
  return [{
    role: processSteps[current]?.role || '系统',
    roleKey: processSteps[current]?.roleKey || 'system',
    description: getStepDefaultDesc(current),
    isActive: true
  }]
}

const getStepDefaultDesc = (idx) => {
  const descs = [
    '请填写完整投保信息并提交申请',
    '跟单员正在审核投保资料',
    '双方在线签署短期出口信用保险合同',
    '资信调查、信用限额审批及核保出单处理中',
    '确认保费金额并完成支付',
    '保单正式生效'
  ]
  return descs[idx] || '处理中'
}

const previewDialogVisible = ref(false)
const previewDialogTitle = ref('')
const previewSheets = ref([])
const previewActiveSheet = ref('')
const previewWorkbook = ref(null)
const previewFilename = ref('')

const expandedSteps = ref(new Set())
const reviewComments = ref({})

const getReviews = () => {
  const app = detailData.value
  if (!app) return []
  return app.stepReviews || []
}

const getReviewForStep = (stepIdx) => {
  const reviews = getReviews()
  return reviews.find(r => r.step === stepIdx)
}

const isStepExpanded = (idx) => {
  const step = timelineSteps.value[idx]
  if (!step) return false
  if (expandedSteps.value.has(idx)) return true
  return step.status === 'active'
}

const toggleStep = (idx) => {
  const s = new Set(expandedSteps.value)
  if (s.has(idx)) s.delete(idx)
  else s.add(idx)
  expandedSteps.value = s
}

const handleApproveStep = (idx) => {
  const app = detailData.value
  if (!app) return
  if (!app.stepReviews) app.stepReviews = []
  const existing = app.stepReviews.find(r => r.step === idx)
  const review = {
    step: idx,
    status: 'approved',
    reviewer: userStore.userName || '长安银科',
    comment: reviewComments.value[idx] || '审核通过',
    time: new Date().toLocaleString('zh-CN', { hour12: false })
  }
  if (existing) Object.assign(existing, review)
  else app.stepReviews.push(review)
  MessagePlugin.success('审核通过')
}

const handleRejectStep = (idx) => {
  const app = detailData.value
  if (!app) return
  if (!app.stepReviews) app.stepReviews = []
  const existing = app.stepReviews.find(r => r.step === idx)
  const review = {
    step: idx,
    status: 'rejected',
    reviewer: userStore.userName || '长安银科',
    comment: reviewComments.value[idx] || '驳回',
    time: new Date().toLocaleString('zh-CN', { hour12: false })
  }
  if (existing) Object.assign(existing, review)
  else app.stepReviews.push(review)
  MessagePlugin.success('已驳回')
}

const showTablePreview = (wb, title, filename) => {
  previewWorkbook.value = wb
  previewDialogTitle.value = title
  previewFilename.value = filename
  const sheets = []
  wb.SheetNames.forEach(name => {
    const ws = wb.Sheets[name]
    const html = XLSX.utils.sheet_to_html(ws, { id: 'preview-' + name })
    sheets.push({ name, html })
  })
  previewSheets.value = sheets
  previewActiveSheet.value = sheets[0]?.name || ''
  previewDialogVisible.value = true
}

const handleDownloadPreview = () => {
  if (!previewWorkbook.value) return
  XLSX.writeFile(previewWorkbook.value, previewFilename.value)
  MessagePlugin.success('文件已下载')
}

const timelineSteps = computed(() => {
  const app = detailData.value
  if (!app) return []
  const status = app.status
  const isAdvanced = status !== 'draft' && status !== 'pending_submit' && status !== 'rejected'
  const contactName = app.contactName || app.companyName || '客户'
  const createTime = app.createTime || '-'
  const updateTime = app.updateTime || '-'
  const reviews = app.stepReviews || []

  const stepStatus = (stepIdx) => {
    const current = getCurrentStepIndex()
    if (stepIdx < current) return 'completed'
    if (stepIdx === current) return 'active'
    return 'pending'
  }

  const getReviewByStep = (stepIdx) => reviews.find(r => r.step === stepIdx)

  const baseSteps = [
    {
      stepName: '投保申请',
      operator: contactName,
      role: '客户',
      startTime: createTime,
      endTime: createTime,
      description: '填写完整的投保信息并提交投保申请，系统自动生成投保申请书和买方信息采集表',
      files: [{ name: '投保信息申请表' }, { name: '投保申请书' }, { name: '买方信息采集表' }],
      needReview: false,
      reviews: getReviewByStep(0),
      reviewStatus: null,
      reviewComment: null
    },
    {
      stepName: '跟单员审核',
      operator: '跟单员',
      role: '跟单员',
      startTime: isAdvanced ? createTime : '待处理',
      endTime: isAdvanced ? updateTime : '待处理',
      description: '审核客户提交的投保资料是否完整、准确，核对自动生成的投保申请书和采集表',
      files: [{ name: '投保申请书' }, { name: '买方信息采集表' }],
      needReview: true
    },
    {
      stepName: '服务确认',
      operator: '长安银科 / 客户',
      role: '客户/长安银科',
      startTime: isAdvanced ? updateTime : '待处理',
      endTime: isAdvanced ? updateTime : '待处理',
      description: '在线签署短期出口信用保险合同，双方确认合同条款后支付平台服务费',
      files: [{ name: '短期出口信用保险合同' }],
      needReview: false
    },
    {
      stepName: '资信核保',
      operator: '长安银科 / 保险公司',
      role: '长安银科',
      startTime: isAdvanced ? updateTime : '待处理',
      endTime: isAdvanced ? updateTime : '待处理',
      description: '对买方进行资信调查，评估信用限额，核保出单确认承保条件及保费',
      files: [{ name: '资信调查报告' }, { name: '信用限额审批单' }],
      needReview: true
    },
    {
      stepName: '保费支付',
      operator: contactName,
      role: '客户',
      startTime: isAdvanced ? updateTime : '待处理',
      endTime: isAdvanced ? updateTime : '待处理',
      description: '确认保费金额，缴纳保费并上传支付凭证',
      files: [{ name: '保费明细单' }],
      needReview: false
    },
    {
      stepName: '保单生效',
      operator: '长安银科',
      role: '长安银科',
      startTime: status === 'active' ? updateTime : '待处理',
      endTime: status === 'active' ? updateTime : '待处理',
      description: '确认保费到账，保单正式生效',
      files: [{ name: '电子保单' }],
      needReview: false
    }
  ]

  return baseSteps.map((step, idx) => {
    const r = getReviewByStep(idx)
    const st = stepStatus(idx)
    return {
      ...step,
      status: st,
      startTime: st === 'pending' ? '待处理' : (step.startTime !== '待处理' ? step.startTime : updateTime),
      endTime: st === 'pending' ? '待处理' : (st === 'active' ? '处理中' : (step.endTime !== '待处理' ? step.endTime : updateTime)),
      reviewStatus: r?.status || 'pending',
      reviewComment: r?.comment || ''
    }
  })
})

const initForm = () => {
  if (mode.value === 'create') return
  const row = detailData.value
  if (!row) return
  Object.assign(formData, {
    // 主体信息
    companyName: row.companyName || '',
    companyEnglishName: row.companyEnglishName || '',
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
    faxNumber: row.faxNumber || '',
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
    industrySubCategory: row.industrySubCategory || '',
    relatedCompanies: row.relatedCompanies || '',
    existingCreditPolicy: row.existingCreditPolicy || '',
    existingCreditPolicyInsurer: row.existingCreditPolicyInsurer || '',
    existingCreditPolicyNo: row.existingCreditPolicyNo || '',
    existingCreditPolicyRenewalDate: row.existingCreditPolicyRenewalDate || '',
    // 历史业务情况（新增）
    threeYearExportAmount23: row.threeYearExportAmount23 ?? null,
    threeYearExportAmount24: row.threeYearExportAmount24 ?? null,
    threeYearExportAmount25: row.threeYearExportAmount25 ?? null,
    threeYearCreditSales23: row.threeYearCreditSales23 ?? null,
    threeYearCreditSales24: row.threeYearCreditSales24 ?? null,
    threeYearCreditSales25: row.threeYearCreditSales25 ?? null,
    exportBusinessSpecial: row.exportBusinessSpecial || [],
    cashTransactionRatio: row.cashTransactionRatio ?? null,
    lcTransactionRatio: row.lcTransactionRatio ?? null,
    relatedPartyRatio: row.relatedPartyRatio ?? null,
    creditTransactionRatio: row.creditTransactionRatio ?? null,
    collectionRatio: row.collectionRatio ?? null,
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
    // 买方补充信息（新增）
    historicalOverdueStatus: row.historicalOverdueStatus || '',
    buyerHasPublicFinancials: row.buyerHasPublicFinancials || '',
    buyerIsListedCompany: row.buyerIsListedCompany || '',
    buyerHasNegativeNews: row.buyerHasNegativeNews || '',
    buyerHasNegativeNewsDesc: row.buyerHasNegativeNewsDesc || '',
    designatedInsuranceCompany: row.designatedInsuranceCompany || '',
    designatedInsuranceCompanyName: row.designatedInsuranceCompanyName || '',
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
  if (saved?.id) {
    router.push(`/insurance/purchase/${saved.id}`)
  } else {
    router.push('/insurance/purchase')
  }
  MessagePlugin.success('已保存')
}

const handleSubmit = () => {
  const saved = store.createOrUpdateInsuranceApplication({ ...formData, id: formData.id || undefined })
  MessagePlugin.success('投保申请已创建')
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

:deep(.file-preview) {
  color: #1d39c4;
  cursor: pointer;
  text-decoration: underline;
  margin-right: 8px;
  
  &:hover {
    color: #1e40af;
  }
  
  .preview-icon {
    margin-left: 4px;
    font-size: 12px;
  }
}

.file-preview-modal {
  padding: 16px;
  
  .preview-content {
    .preview-info {
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      
      .info-item {
        display: flex;
        margin-bottom: 8px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .info-label {
          font-size: 13px;
          color: #64748b;
          min-width: 80px;
        }
        
        .info-value {
          font-size: 13px;
          color: #1e293b;
          font-weight: 500;
        }
      }
    }
    
    .preview-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      background: #f8fafc;
      border-radius: 8px;
      
      .file-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }
      
      .file-name {
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 8px;
      }
      
      .file-tip {
        font-size: 14px;
        color: #64748b;
        margin-bottom: 16px;
      }
    }
  }
}
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}

/* ── 投保流程看板 ── */
.process-flow-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.process-flow-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid #e5e7eb;
}

.process-flow-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.process-steps-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 8px;
}

.process-step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.step-connector {
  flex: 1;
  height: 2px;
  background: #e5e7eb;
  margin: 0 4px;
  align-self: center;
  margin-bottom: 32px;
}

.step-connector.connector-done {
  background: #10b981;
}

.step-indicator {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.3s;
  flex-shrink: 0;
}

.step-dot-completed {
  background: #10b981;
  color: #fff;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.15);
}

.step-dot-active {
  background: #0052D9;
  color: #fff;
  box-shadow: 0 0 0 3px rgba(0,82,217,0.18);
}

.step-dot-pending {
  background: #e5e7eb;
  color: #9ca3af;
}

.step-check-icon {
  font-size: 16px;
}

.step-num {
  font-size: 13px;
}

.step-label {
  font-size: 11px;
  text-align: center;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
}

.step-label.step-completed { color: #10b981; }
.step-label.step-active { color: #0052D9; font-weight: 600; }
.step-label.step-pending { color: #9ca3af; }

.step-role-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f3f4f6;
  color: #6b7280;
  white-space: nowrap;
}

.step-role-tag.role-customer { background: #eff6ff; color: #1d4ed8; }
.step-role-tag.role-clerk { background: #fef3c7; color: #b45309; }
.step-role-tag.role-inkasso { background: #ecfdf5; color: #047857; }

.step-role-tag.role-insurer { background: #fdf2f8; color: #be185d; }

/* ── 当前步骤面板 ── */
.process-detail-steps {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 8px 0;
  margin-top: 16px;
}

.detail-steps-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  padding: 14px 20px 6px;
}

.detail-steps-list {
  position: relative;
  padding: 0;
}

.timeline-item {
  display: flex;
  gap: 16px;
  padding: 0 0 0 28px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 18px;
    top: 36px;
    bottom: 0;
    width: 2px;
    background: #e5e7eb;
  }

  &:last-child::before {
    display: none;
  }

  &.tl-completed::before {
    background: #10b981;
  }

  &.tl-active::before {
    background: #0052D9;
  }
}

.tl-dot {
  position: absolute;
  left: 10px;
  top: 18px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  z-index: 1;
  flex-shrink: 0;

  .tl-completed & {
    background: #10b981;
    color: #fff;
  }

  .tl-active & {
    background: #0052D9;
    color: #fff;
    box-shadow: 0 0 0 4px rgba(0, 82, 217, 0.15);
  }

  .tl-pending & {
    background: #e5e7eb;
    color: #9ca3af;
  }
}

.tl-content {
  flex: 1;
  padding: 12px 16px 20px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  margin-bottom: 4px;
  transition: all 0.2s;

  .tl-active & {
    border-color: #bfdbfe;
    box-shadow: 0 2px 8px rgba(0, 82, 217, 0.06);
  }

  .tl-completed & {
    border-color: #d1fae5;
  }
}

.tl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #f0f0f0;
}

.tl-step-name {
  font-size: 14px;
  font-weight: 700;
  color: #111827;

  .tl-active & {
    color: #0052D9;
  }
}

.tl-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tl-info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4b5563;

  .t-icon {
    color: #9ca3af;
    flex-shrink: 0;
  }
}

.tl-info-label {
  color: #9ca3af;
  flex-shrink: 0;
}

.tl-info-value {
  color: #374151;
}

.tl-info-role {
  color: #9ca3af;
  font-size: 12px;
}

.tl-file-link {
  color: #0052D9;
  cursor: pointer;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    color: #003da6;
  }
}

.file-checked-icon {
  color: #10b981;
  margin-right: 4px;
  vertical-align: middle;
}

.preview-modal {
  padding: 8px 0;

  .preview-table-wrap {
    max-height: 480px;
    overflow: auto;
    border: 1px solid #e2e8f0;
    border-radius: 8px;

    :deep(table) {
      border-collapse: collapse;
      width: 100%;
      font-size: 12px;
    }

    :deep(td), :deep(th) {
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      text-align: left;
      white-space: nowrap;
      min-width: 60px;
    }

    :deep(th) {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    :deep(tr:hover td) {
      background: #f1f5f9;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
  }
}
</style>
