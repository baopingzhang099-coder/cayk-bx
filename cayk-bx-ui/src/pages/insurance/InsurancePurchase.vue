<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/insurance/purchase">投保管理</t-breadcrumb-item>
        <t-breadcrumb-item>投保信息管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">投保信息管理</div>
      <div class="page-actions">
        <t-button theme="primary" @click="handleAdd">
          <template #icon><t-icon name="add" /></template>
          新增投保
        </t-button>
        <t-button v-if="userStore.role === 'customer'" variant="outline" @click="handleUploadPolicy()">
          <template #icon><t-icon name="upload" /></template>
          上传电子保单
        </t-button>
      </div>
    </div>

    <t-card class="search-card">
      <t-form layout="inline">
        <t-form-item label="企业名称">
          <t-input v-model="searchParams.enterpriseName" placeholder="请输入企业名称" clearable />
        </t-form-item>
        <t-form-item label="买方名称">
          <t-input v-model="searchParams.buyerName" placeholder="请输入买方名称" clearable />
        </t-form-item>
        <t-form-item label="买方国别">
          <t-select v-model="searchParams.buyerCountry" placeholder="请选择买方国别" clearable filterable>
            <t-option v-for="item in countryOptions" :key="item.value" :value="item.value" :label="item.label" />
          </t-select>
        </t-form-item>
        <t-form-item label="状态">
          <t-select v-model="searchParams.status" placeholder="请选择状态" clearable>
            <t-option v-for="item in statusOptions" :key="item.value" :value="item.value" :label="item.label" />
          </t-select>
        </t-form-item>
        <t-form-item label="投保机构类型">
          <t-select v-model="searchParams.preferredInsuranceOrgType" placeholder="请选择" clearable>
            <t-option value="政策性保险机构" label="政策性保险机构" />
            <t-option value="商业性保险机构" label="商业性保险机构" />
            <t-option value="无偏好" label="无偏好" />
          </t-select>
        </t-form-item>
        <t-form-item label="申请日期">
          <t-date-range-picker v-model="searchParams.dateRange" />
        </t-form-item>
        <t-form-item>
          <t-space>
            <t-button theme="primary" @click="handleSearch">查询</t-button>
            <t-button variant="outline" @click="handleReset">重置</t-button>
          </t-space>
        </t-form-item>
      </t-form>
      <div class="search-actions">
        <t-button variant="outline" @click="handleExport">
          <template #icon><t-icon name="download" /></template>
          导出
        </t-button>
      </div>
    </t-card>

    <div class="stats-grid mb-16">
      <stat-card title="待确认" :value="pendingStats.pending_all" icon="search" color="warning" />
      <stat-card title="已确认" :value="pendingStats.approved" icon="check-circle" color="success" />
    </div>

    <t-card>
      <div class="table-header">
        <span class="table-title">投保建议方案列表</span>
        <span class="table-count">共 {{ pagination.total }} 条记录</span>
      </div>
      <t-table
        :data="tableData"
        :columns="columns"
        :loading="loading"
        :pagination="paginationConfig"
        row-key="id"
        hover
        stripe
        @page-change="handlePageChange"
      >
        <template #status="{ row }">
          <status-tag :status="row.status" :status-map="statusMap" />
        </template>
        <template #insuranceAmount="{ row }">
          <span style="font-weight:600;">${{ Number(row.insuranceAmount || 0).toLocaleString() }}</span>
        </template>
        <template #premium="{ row }">
          <span v-if="row.premium" style="font-weight:600;">${{ Number(row.premium || 0).toLocaleString() }}</span>
          <span v-else style="color:#999;">-</span>
        </template>
        <template #serviceFee="{ row }">
          <template v-if="row.serviceFeePaid">
            <span style="color:#00a870;font-weight:600;">${{ Number(row.serviceFeeAmount || 0).toLocaleString() }}</span>
            <t-tag theme="success" variant="light" size="small" style="margin-left:4px;">已支付</t-tag>
          </template>
          <span v-else style="color:#999;">-</span>
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-link @click="handleView(row)">查看</t-link>
            <t-link v-if="isPendingConfirmation(row.status) && userStore.role === 'customer'" @click="handleEdit(row)">编辑</t-link>
            <t-link v-if="isPendingConfirmation(row.status) && userStore.role === 'customer'" theme="primary" @click="handleShowSubmitModal(row)">提交</t-link>
            <t-link v-if="isPendingConfirmation(row.status) && userStore.role === 'customer'" theme="danger" @click="handleShowDeleteModal(row)">删除</t-link>
            <t-link v-if="userStore.role === 'inkasso'" theme="primary" @click="handleGenerateDocuments(row)">生成投保资料</t-link>
            <t-link v-if="userStore.role === 'inkasso' && row.status === 'contract_signing'" theme="primary" @click="handleShowContractSigning(row)">在线合同签署</t-link>
            <t-link v-if="userStore.role === 'customer' && row.status === 'inkasso_signed'" theme="primary" @click="handleShowCustomerSigning(row)">签署合同</t-link>
            <t-link v-if="userStore.role === 'customer' && row.status === 'contract_signed'" theme="primary" @click="handleShowPayment(row)">支付服务费</t-link>
            <t-link v-if="userStore.role === 'inkasso' && row.status === 'service_fee_paid'" theme="primary" @click="handlePushToClerk(row)">推送保单给跟单员</t-link>
            <t-link v-if="userStore.role === 'inkasso' && row.status === 'platform_synced'" theme="primary" @click="handleInkassoPremiumRequest(row)">保费确认申请</t-link>
            <t-link v-if="userStore.role === 'customer' && row.status === 'platform_synced'" theme="primary" @click="handleShowPremiumConfirm(row)">确认保费</t-link>
            <t-link v-if="userStore.role === 'customer' && row.status === 'premium_confirmed'" theme="primary" @click="handleShowPayment(row)">保费交纳凭证上传</t-link>
            <t-link v-if="userStore.role === 'inkasso' && row.status === 'payment_uploaded'" theme="primary" @click="handleActivatePolicy(row)">保单生效</t-link>
            <t-link v-if="row.status === 'active' && userStore.role === 'clerk'" theme="primary" @click="handleUploadPolicy(row)">上传电子保单</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <t-dialog v-model:visible="submitVisible" header="提交申请" width="700px" :footer="false">
      <div class="submit-modal">
        <div class="submit-confirm-bar">
          <t-icon name="check-circle-filled" size="24px" class="confirm-icon" />
          <span>确认提交后，该投保记录状态将由"待确认"变更为"已确认"。</span>
        </div>

        <div class="modal-divider"></div>

        <div class="submit-sections">
          <div class="submit-section">
            <div class="submit-section-title">客户基础信息</div>
            <div class="detail-panel">
              <div class="detail-item">
                <span class="detail-label">投保编号</span>
                <span class="detail-value">{{ currentSubmitData?.id || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">公司中文全称</span>
                <span class="detail-value">{{ currentSubmitData?.companyName || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">联系人</span>
                <span class="detail-value">{{ currentSubmitData?.contactName || '-' }} {{ currentSubmitData?.contactPhone || '' }}</span>
              </div>
            </div>
          </div>

          <div class="submit-section">
            <div class="submit-section-title">投保核心需求</div>
            <div class="detail-panel">
              <div class="detail-item">
                <span class="detail-label">投保类型</span>
                <span class="detail-value">{{ currentSubmitData?.insuranceType || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">机构类型</span>
                <span class="detail-value">{{ currentSubmitData?.preferredInsuranceOrgType || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">投保金额</span>
                <span class="detail-value">{{ currentSubmitData?.insuranceCurrency || 'USD' }} {{ Number(currentSubmitData?.insuranceAmount || 0).toLocaleString() }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">投保期限</span>
                <span class="detail-value">{{ currentSubmitData?.expectedInsurancePeriod?.join(' 至 ') || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">投保目的</span>
                <span class="detail-value">{{ [currentSubmitData?.insurancePrimaryPurpose1, currentSubmitData?.insurancePrimaryPurpose2].filter(Boolean).join('、') || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="submit-section">
            <div class="submit-section-title">买方信息</div>
            <div class="detail-panel">
              <div class="detail-item">
                <span class="detail-label">买方名称</span>
                <span class="detail-value">{{ currentSubmitData?.buyerName || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">买方国别</span>
                <span class="detail-value">{{ currentSubmitData?.buyerCountry || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">拟申请信用限额</span>
                <span class="detail-value">{{ currentSubmitData?.creditLimitCurrency || 'USD' }} {{ Number(currentSubmitData?.appliedCreditLimit || 0).toLocaleString() }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">付款条件</span>
                <span class="detail-value">{{ currentSubmitData?.paymentTerms || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="submit-section">
            <div class="submit-section-title">业务信息</div>
            <div class="detail-panel">
              <div class="detail-item">
                <span class="detail-label">预计可保营业额</span>
                <span class="detail-value">{{ currentSubmitData?.turnoverCurrency || 'USD' }} {{ Number(currentSubmitData?.expectedInsurableTurnover || 0).toLocaleString() }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">申请日期</span>
                <span class="detail-value">{{ currentSubmitData?.createTime || '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <t-button variant="outline" @click="submitVisible = false">取消</t-button>
          <t-button theme="primary" @click="handleConfirmSubmit">确认提交</t-button>
        </div>
      </div>
    </t-dialog>

    <t-dialog v-model:visible="documentVisible" header="投保申请详情" width="800px" :footer="false">
      <div class="document-modal">
        <div class="submit-sections">
          <div class="submit-section">
            <div class="submit-section-title">客户基础信息</div>
            <div class="detail-panel">
              <div class="detail-item">
                <span class="detail-label">投保编号</span>
                <span class="detail-value">{{ currentDocumentData?.id || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">公司中文全称</span>
                <span class="detail-value">{{ currentDocumentData?.companyName || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">联系人</span>
                <span class="detail-value">{{ currentDocumentData?.contactName || '-' }} {{ currentDocumentData?.contactPhone || '' }}</span>
              </div>
            </div>
          </div>
          <div class="submit-section">
            <div class="submit-section-title">投保核心需求</div>
            <div class="detail-panel">
              <div class="detail-item">
                <span class="detail-label">投保类型</span>
                <span class="detail-value">{{ currentDocumentData?.insuranceType || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">机构类型</span>
                <span class="detail-value">{{ currentDocumentData?.preferredInsuranceOrgType || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">投保金额</span>
                <span class="detail-value">{{ currentDocumentData?.insuranceCurrency || 'USD' }} {{ Number(currentDocumentData?.insuranceAmount || 0).toLocaleString() }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">投保期限</span>
                <span class="detail-value">{{ currentDocumentData?.expectedInsurancePeriod?.join(' 至 ') || '-' }}</span>
              </div>
            </div>
          </div>
          <div class="submit-section">
            <div class="submit-section-title">买方信息</div>
            <div class="detail-panel">
              <div class="detail-item">
                <span class="detail-label">买方名称</span>
                <span class="detail-value">{{ currentDocumentData?.buyerName || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">买方国别</span>
                <span class="detail-value">{{ currentDocumentData?.buyerCountry || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">付款条件</span>
                <span class="detail-value">{{ currentDocumentData?.paymentTerms || '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-divider"></div>

        <div class="documents-section">
          <div class="documents-title">生成投保资料</div>
          <div class="documents-grid">
            <div class="document-card" @click="handlePreviewPolicyApplication(currentDocumentData)">
              <div class="doc-card-icon doc-icon-primary">
                <t-icon name="file-text" size="32px" />
              </div>
              <div class="doc-card-info">
                <div class="doc-card-name">投保申请书</div>
                <div class="doc-card-desc">中国人民财产保险股份有限公司短期出口贸易信用保险投保单</div>
              </div>
              <div class="doc-card-actions">
                <t-button variant="outline" size="small" @click.stop="handlePreviewPolicyApplication(currentDocumentData)">
                  <template #icon><t-icon name="browse" /></template>
                  预览
                </t-button>
              </div>
            </div>
            <div class="document-card" @click="handlePreviewBuyerInfo(currentDocumentData)">
              <div class="doc-card-icon doc-icon-success">
                <t-icon name="file-text" size="32px" />
              </div>
              <div class="doc-card-info">
                <div class="doc-card-name">买方信息采集表</div>
                <div class="doc-card-desc">Buyer Information Collection Form</div>
              </div>
              <div class="doc-card-actions">
                <t-button variant="outline" size="small" @click.stop="handlePreviewBuyerInfo(currentDocumentData)">
                  <template #icon><t-icon name="browse" /></template>
                  预览
                </t-button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <t-button variant="outline" @click="handleDocumentConfirm">确定</t-button>
        </div>
      </div>
    </t-dialog>

    <!-- 合同签署弹窗 -->
    <t-dialog v-model:visible="contractSignVisible" header="在线合同签署" width="900px" :close-btn="false" destroy-on-close>
      <div v-if="currentContractData" class="contract-sign-modal">
        <div class="contract-header">
          <div class="contract-title">{{ contractTemplate.title || '短期出口信用保险合同' }}</div>
          <div class="contract-version">版本：{{ contractTemplate.version || 'v2025.1' }}</div>
        </div>
        <div class="contract-parties">
          <div class="party-info-row">
            <span class="party-label">甲方（保险人）：</span>
            <span class="party-value">{{ currentContractData.insuranceCompanyName || currentContractData.preferredInsuranceOrgType || '人保财险' }}</span>
          </div>
          <div class="party-info-row">
            <span class="party-label">乙方（被保险人）：</span>
            <span class="party-value">{{ currentContractData.companyName || '-' }}</span>
          </div>
          <div class="party-info-row">
            <span class="party-label">投保编号：</span>
            <span class="party-value">{{ currentContractData.id }}</span>
          </div>
        </div>
        <div class="contract-clauses">
          <div v-for="clause in contractTemplate.clauses" :key="clause.id" class="clause-item">
            <div class="clause-title">{{ clause.title }}</div>
            <div class="clause-content">{{ clause.content }}</div>
          </div>
        </div>
        <div class="contract-sign-area">
          <div class="sign-status-row">
            <div class="sign-status-item">
              <t-icon name="usergroup" size="16px" />
              <span>平台签署：</span>
              <t-tag v-if="currentContractData.inkassoContractSigned" theme="success" variant="light">已签署 {{ currentContractData.inkassoSignTime || '' }}</t-tag>
              <t-tag v-else theme="warning" variant="light">待签署</t-tag>
            </div>
            <div class="sign-status-item">
              <t-icon name="user" size="16px" />
              <span>客户签署：</span>
              <t-tag v-if="currentContractData.customerContractSigned" theme="success" variant="light">已签署 {{ currentContractData.customerSignTime || '' }}</t-tag>
              <t-tag v-else theme="warning" variant="light">待签署</t-tag>
            </div>
          </div>
          <div v-if="!currentContractData.inkassoContractSigned && userStore.role === 'inkasso'" class="sign-action-bar">
            <t-button theme="primary" size="large" @click="handleInkassoSignContract">平台签署合同</t-button>
          </div>
          <div v-if="currentContractData.inkassoContractSigned && !currentContractData.customerContractSigned && userStore.role === 'customer'" class="sign-action-bar">
            <t-button theme="primary" size="large" @click="handleCustomerSignContract">客户签署合同</t-button>
          </div>
          <div v-if="currentContractData.inkassoContractSigned && currentContractData.customerContractSigned" class="sign-complete-bar">
            <t-icon name="check-circle-filled" size="20px" class="complete-icon" />
            <span>合同已由双方签署完成</span>
          </div>
        </div>
      </div>
      <div v-else class="no-data">暂无数据</div>
      <template #footer>
        <div class="contract-footer">
          <t-button variant="outline" @click="handlePreviewContract">预览合同</t-button>
          <t-button theme="primary" @click="contractSignVisible = false">关闭</t-button>
        </div>
      </template>
    </t-dialog>

    <!-- 服务费支付弹窗 -->
    <t-dialog v-model:visible="paymentVisible" header="支付平台服务费" width="700px" :footer="false" destroy-on-close>
      <div v-if="currentPaymentData" class="payment-modal">
        <div class="payment-section">
          <div class="payment-section-title">付款信息</div>
          <div class="payment-form">
            <div class="payment-row">
              <span class="payment-label">支付主体</span>
              <t-select v-model="paymentForm.paymentSubject" placeholder="请选择支付主体">
                <t-option value="企业" label="企业" />
                <t-option value="个人" label="个人" />
              </t-select>
            </div>
            <div class="payment-row">
              <span class="payment-label">{{ paymentForm.paymentSubject === '企业' ? '付款企业' : '付款人' }}</span>
              <t-select v-model="paymentForm.payerName" :placeholder="paymentForm.paymentSubject === '企业' ? '请选择付款企业' : '请选择付款人'">
                <t-option v-for="opt in (paymentForm.paymentSubject === '企业' ? enterpriseOptions : individualOptions)" :key="opt" :value="opt" :label="opt" />
              </t-select>
            </div>
            <div class="payment-row">
              <span class="payment-label">关联投保</span>
              <span class="payment-value-text">{{ currentPaymentData.id }}（{{ currentPaymentData.companyName }} - {{ currentPaymentData.buyerName || '无买方' }}）</span>
            </div>
          </div>
        </div>
        <div class="payment-divider"></div>
        <div class="payment-section">
          <div class="payment-section-title">支付详情</div>
          <div class="payment-form">
            <div class="payment-row">
              <span class="payment-label">服务费金额</span>
              <span class="payment-amount">{{ paymentForm.amount.toLocaleString() }} USD</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">支付方式</span>
              <t-radio-group v-model="paymentForm.paymentMethod">
                <t-radio value="online">在线支付</t-radio>
                <t-radio value="bank_transfer">银行转账</t-radio>
              </t-radio-group>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <t-button variant="outline" @click="paymentVisible = false">取消</t-button>
          <t-button theme="primary" @click="handleConfirmPayment" :loading="paymentLoading">确认支付</t-button>
        </div>
      </div>
      <div v-else class="no-data">暂无数据</div>
    </t-dialog>

    <!-- 支付二维码弹窗 -->
    <t-dialog v-model:visible="qrVisible" :header="'扫码支付 - ' + (qrSubject || '')" width="500px" :footer="false" destroy-on-close>
      <div v-if="qrData" class="qr-modal">
        <div class="qr-header">
          <div class="qr-icon">📱</div>
          <div class="qr-title">请使用支付工具扫码付款</div>
        </div>
        <div class="qr-code-area">
          <div class="qr-code-box">
            <div class="qr-pattern">
              <div class="qr-corner qr-tl"></div>
              <div class="qr-corner qr-tr"></div>
              <div class="qr-corner qr-bl"></div>
              <div class="qr-corner qr-br"></div>
              <div class="qr-center-icon">{{ qrData.subjectShort || '' }}</div>
            </div>
          </div>
        </div>
        <div class="qr-info">
          <div class="qr-info-row">
            <span class="qr-label">支付主体</span>
            <span class="qr-value">{{ qrData.subject }}</span>
          </div>
          <div class="qr-info-row">
            <span class="qr-label">关联投保</span>
            <span class="qr-value">{{ qrData.applicationId }}</span>
          </div>
          <div class="qr-info-row">
            <span class="qr-label">支付金额</span>
            <span class="qr-amount">{{ qrData.amount.toLocaleString() }} USD</span>
          </div>
          <div class="qr-info-row">
            <span class="qr-label">支付方式</span>
            <span class="qr-value">{{ qrData.method === 'online' ? '在线支付' : '银行转账' }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <t-button variant="outline" @click="qrVisible = false">取消支付</t-button>
          <t-button theme="primary" @click="handlePaymentScanComplete" :loading="paymentLoading">已完成支付</t-button>
        </div>
      </div>
      <div v-else class="no-data">暂无数据</div>
    </t-dialog>

    <t-dialog v-model:visible="previewVisible" :header="previewTitle" width="960px" :footer="false" destroy-on-close>
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
          <t-button variant="outline" @click="previewVisible = false">关闭</t-button>
        </div>
      </div>
    </t-dialog>

    <!-- 确认保费弹窗 -->
    <t-dialog v-model:visible="premiumConfirmVisible" header="确认保费" width="720px" :footer="false" destroy-on-close>
      <div v-if="premiumConfirmData" class="premium-modal">
        <div class="pm-card">
          <div class="pm-card-header">📋 保单信息</div>
          <div class="pm-card-body">
            <div class="pm-grid">
              <div class="pm-field"><span class="pm-label">投保编号</span><span class="pm-value">{{ premiumConfirmData.id }}</span></div>
              <div class="pm-field"><span class="pm-label">企业名称</span><span class="pm-value">{{ premiumConfirmData.companyName }}</span></div>
              <div class="pm-field"><span class="pm-label">保单号</span><span class="pm-value">{{ premiumConfirmData.policyNo || '-' }}</span></div>
              <div class="pm-field"><span class="pm-label">投保人（被保险人）</span><span class="pm-value">{{ premiumConfirmData.companyName || '-' }}</span></div>
              <div class="pm-field"><span class="pm-label">买方名称</span><span class="pm-value">{{ premiumConfirmData.buyerName || '-' }}</span></div>
              <div class="pm-field"><span class="pm-label">保险公司</span><span class="pm-value">{{ premiumConfirmData.uwInsuranceCompany || premiumConfirmData.insuranceCompanyName || '-' }}</span></div>
            </div>
          </div>
        </div>
        <div class="pm-card">
          <div class="pm-card-header">💰 保费明细</div>
          <div class="pm-card-body">
            <div class="pm-grid">
              <div class="pm-field"><span class="pm-label">保额</span><span class="pm-value pm-number">${{ Number(premiumConfirmData.coverageAmount || premiumConfirmData.insuranceAmount || 0).toLocaleString() }}</span></div>
              <div class="pm-field"><span class="pm-label">费率</span><span class="pm-value">{{ premiumConfirmData.premiumRate ? Number(premiumConfirmData.premiumRate) + '%' : '-' }}</span></div>
              <div class="pm-field pm-field-full"><span class="pm-label">保费金额</span><span class="pm-value pm-amount">${{ Number(premiumConfirmData.premium || 0).toLocaleString() }}</span></div>
              <div class="pm-field"><span class="pm-label">平台服务费</span><span class="pm-value pm-number">${{ Number(premiumConfirmData.serviceFee || 0).toLocaleString() }}</span></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <t-space>
            <t-button variant="outline" @click="premiumConfirmVisible = false">取消</t-button>
            <t-button theme="primary" @click="handlePremiumConfirm">确认保费</t-button>
          </t-space>
        </div>
      </div>
      <div v-else class="no-data">暂无数据</div>
    </t-dialog>

    <!-- 长安银科保费确认申请弹窗 -->
    <t-dialog v-model:visible="inkassoPremiumVisible" header="保费确认申请" width="720px" :footer="false" destroy-on-close>
      <div v-if="inkassoPremiumData" class="premium-modal">
        <div class="pm-card">
          <div class="pm-card-header">📋 保单信息</div>
          <div class="pm-card-body">
            <div class="pm-grid">
              <div class="pm-field"><span class="pm-label">投保编号</span><span class="pm-value">{{ inkassoPremiumData.id }}</span></div>
              <div class="pm-field"><span class="pm-label">保单号</span><span class="pm-value">{{ inkassoPremiumData.policyNo || '-' }}</span></div>
              <div class="pm-field"><span class="pm-label">投保人（被保险人）</span><span class="pm-value">{{ inkassoPremiumData.companyName || '-' }}</span></div>
              <div class="pm-field"><span class="pm-label">买方名称</span><span class="pm-value">{{ inkassoPremiumData.buyerName || '-' }}</span></div>
              <div class="pm-field"><span class="pm-label">买方国家</span><span class="pm-value">{{ inkassoPremiumData.buyerCountry || '-' }}</span></div>
              <div class="pm-field"><span class="pm-label">保险类型</span><span class="pm-value">{{ inkassoPremiumData.insuranceType || '-' }}</span></div>
              <div class="pm-field"><span class="pm-label">保险公司</span><span class="pm-value">{{ inkassoPremiumData.uwInsuranceCompany || inkassoPremiumData.insuranceCompanyName || '-' }}</span></div>
              <div class="pm-field"><span class="pm-label">保单生效日期</span><span class="pm-value">{{ inkassoPremiumData.policyStartDate || '-' }}</span></div>
              <div class="pm-field"><span class="pm-label">保单到期日期</span><span class="pm-value">{{ inkassoPremiumData.policyEndDate || '-' }}</span></div>
            </div>
          </div>
        </div>
        <div class="pm-card">
          <div class="pm-card-header">💰 保费明细</div>
          <div class="pm-card-body">
            <div class="pm-grid">
              <div class="pm-field"><span class="pm-label">保额</span><span class="pm-value pm-number">${{ Number(inkassoPremiumData.coverageAmount || inkassoPremiumData.insuranceAmount || 0).toLocaleString() }}</span></div>
              <div class="pm-field"><span class="pm-label">费率</span><span class="pm-value">{{ inkassoPremiumData.premiumRate ? Number(inkassoPremiumData.premiumRate) + '%' : '-' }}</span></div>
              <div class="pm-field pm-field-full"><span class="pm-label">保费金额</span><span class="pm-value pm-amount">${{ Number(inkassoPremiumData.premium || 0).toLocaleString() }}</span></div>
              <div class="pm-field"><span class="pm-label">平台服务费</span><span class="pm-value pm-number">${{ Number(inkassoPremiumData.serviceFee || 0).toLocaleString() }}</span></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <t-space>
            <t-button variant="outline" @click="inkassoPremiumVisible = false">取消</t-button>
            <t-button theme="primary" @click="handleInkassoPremiumRequestSubmit">确认并发送</t-button>
          </t-space>
        </div>
      </div>
      <div v-else class="no-data">暂无数据</div>
    </t-dialog>

    <!-- 保费交纳凭证上传弹窗 -->
    <t-dialog v-model:visible="paymentInitVisible" header="保费交纳凭证上传" width="720px" :footer="false" destroy-on-close>
      <div v-if="paymentInitData" class="premium-modal">
        <div class="pm-card">
          <div class="pm-card-header">💰 支付信息</div>
          <div class="pm-card-body">
            <div class="payment-init-form">
              <div class="payment-init-row">
                <span class="payment-init-label">支付主体</span>
                <t-select v-model="paymentInitForm.paymentSubject" placeholder="请选择支付主体">
                  <t-option value="企业" label="企业" />
                  <t-option value="个人" label="个人" />
                </t-select>
              </div>
              <div class="payment-init-row">
                <span class="payment-init-label">{{ paymentInitForm.paymentSubject === '企业' ? '付款企业' : '付款人' }}</span>
                <t-select v-model="paymentInitForm.payerName" :placeholder="paymentInitForm.paymentSubject === '企业' ? '请选择付款企业' : '请选择付款人'">
                  <t-option v-for="opt in payerOptions" :key="opt" :value="opt" :label="opt" />
                </t-select>
              </div>
            </div>
          </div>
        </div>

        <div class="pm-card">
          <div class="pm-card-header">📋 保单订单信息</div>
          <div class="pm-card-body">
            <div class="pm-grid">
              <div class="pm-field"><span class="pm-label">保单号</span><span class="pm-value">{{ paymentInitData.policyNo || '-' }}</span></div>
              <div class="pm-field"><span class="pm-label">保险公司</span><span class="pm-value">{{ paymentInitData.uwInsuranceCompany || paymentInitData.insuranceCompanyName || '-' }}</span></div>
              <div class="pm-field"><span class="pm-label">保额</span><span class="pm-value pm-number">${{ Number(paymentInitData.coverageAmount || paymentInitData.insuranceAmount || 0).toLocaleString() }}</span></div>
              <div class="pm-field"><span class="pm-label">保费</span><span class="pm-value pm-number">${{ Number(paymentInitData.premium || 0).toLocaleString() }}</span></div>
              <div class="pm-field"><span class="pm-label">投保企业</span><span class="pm-value">{{ paymentInitData.companyName || '-' }}</span></div>
              <div class="pm-field"><span class="pm-label">平台服务费</span><span class="pm-value pm-number">${{ Number(paymentInitData.serviceFee || 0).toLocaleString() }}</span></div>
            </div>
          </div>
        </div>

        <div class="pm-card">
          <div class="pm-card-header">📎 保费交纳凭证</div>
          <div class="pm-card-body">
            <t-upload
              ref="voucherUploadRef"
              v-model="paymentVoucherFiles"
              action="/mock-upload"
              accept=".jpg,.jpeg,.png,.pdf"
              :multiple="true"
              :auto-upload="true"
              :request-method="mockUpload"
              theme="file-flow"
              placeholder="请上传保费交纳凭证（支持jpg/png/pdf，可多选）"
              @change="handleVoucherChange"
            />
            <div v-if="paymentVoucherFiles.length" class="voucher-preview">
              <div class="preview-label">已上传凭证（{{ paymentVoucherFiles.length }} 个文件）：</div>
              <div v-for="(file, idx) in paymentVoucherFiles" :key="(file.name || '') + idx" class="voucher-file-item">
                <t-icon v-if="file.raw?.type?.startsWith('image/')" name="image" size="20px" style="color:#0052d9;flex-shrink:0;" />
                <t-icon v-else name="file-pdf" size="20px" style="color:#e34d57;flex-shrink:0;" />
                <span class="voucher-file-name">{{ file.name }}</span>
                <t-button variant="outline" size="small" @click="handlePreviewVoucherFile(file)">预览</t-button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <t-space>
            <t-button theme="primary" :disabled="!paymentVoucherFiles.length" @click="handlePaymentInitConfirm">{{ paymentVoucherFiles.length ? '支付完成' : '确认支付' }}</t-button>
            <t-button variant="outline" @click="paymentInitVisible = false">取消</t-button>
          </t-space>
        </div>
      </div>
      <div v-else class="no-data">暂无数据</div>
    </t-dialog>

    <!-- 凭证图片预览弹窗 -->
    <t-dialog v-model:visible="previewVoucherVisible" :header="'凭证预览 - ' + (previewVoucherFile?.name || '')" width="720px" :footer="false" destroy-on-close>
      <div class="voucher-preview-modal">
        <img v-if="previewVoucherFile?.raw?.type?.startsWith('image/')" :src="previewVoucherFileUrl" style="width:100%;" />
        <iframe v-else :src="previewVoucherFileUrl" style="width:100%;height:500px;border:none;"></iframe>
      </div>
    </t-dialog>

    <!-- 支付二维码弹窗 -->
    <t-dialog v-model:visible="paymentQrVisible" header="扫码支付" width="500px" :footer="false" destroy-on-close>
      <div v-if="paymentQrData" class="qr-modal">
        <div class="qr-header">
          <div class="qr-icon">📱</div>
          <div class="qr-title">请使用支付工具扫码付款</div>
        </div>
        <div class="qr-code-area">
          <div class="qr-code-box">
            <div class="qr-pattern">
              <div class="qr-corner qr-tl"></div>
              <div class="qr-corner qr-tr"></div>
              <div class="qr-corner qr-bl"></div>
              <div class="qr-corner qr-br"></div>
              <div class="qr-center-icon">{{ paymentQrData.subjectShort || '' }}</div>
            </div>
          </div>
        </div>
        <div class="qr-info">
          <div class="qr-info-row">
            <span class="qr-label">支付主体</span>
            <span class="qr-value">{{ paymentQrData.subject }}</span>
          </div>
          <div class="qr-info-row">
            <span class="qr-label">投保编号</span>
            <span class="qr-value">{{ paymentQrData.applicationId }}</span>
          </div>
          <div class="qr-info-row">
            <span class="qr-label">保单号</span>
            <span class="qr-value">{{ paymentQrData.policyNo || '-' }}</span>
          </div>
          <div class="qr-info-row">
            <span class="qr-label">支付金额</span>
            <span class="qr-amount">{{ paymentQrData.amount.toLocaleString() }} USD</span>
          </div>
        </div>
        <div class="modal-footer">
          <t-button variant="outline" @click="paymentQrVisible = false">取消支付</t-button>
          <t-button theme="primary" @click="handlePaymentQrComplete">已完成支付</t-button>
        </div>
      </div>
      <div v-else class="no-data">暂无数据</div>
    </t-dialog>

    <t-dialog v-model:visible="exportVisible" header="导出预览" width="800px" :footer="false">
      <div class="export-modal">
        <div class="export-filters">
          <h4 class="filter-title">筛选条件</h4>
          <div class="filter-grid">
            <div class="filter-item" v-if="searchParams.enterpriseName">
              <span class="filter-label">企业名称：</span>
              <span class="filter-value">{{ searchParams.enterpriseName }}</span>
            </div>
            <div class="filter-item" v-if="searchParams.buyerName">
              <span class="filter-label">买方名称：</span>
              <span class="filter-value">{{ searchParams.buyerName }}</span>
            </div>
            <div class="filter-item" v-if="searchParams.buyerCountry">
              <span class="filter-label">买方国别：</span>
              <span class="filter-value">{{ searchParams.buyerCountry }}</span>
            </div>
            <div class="filter-item" v-if="searchParams.status">
              <span class="filter-label">状态：</span>
              <span class="filter-value">{{ statusMap[searchParams.status] || searchParams.status }}</span>
            </div>
            <div class="filter-item" v-if="searchParams.preferredInsuranceOrgType">
              <span class="filter-label">机构类型：</span>
              <span class="filter-value">{{ searchParams.preferredInsuranceOrgType }}</span>
            </div>
            <div class="filter-item" v-if="searchParams.dateRange && searchParams.dateRange.length">
              <span class="filter-label">申请日期：</span>
              <span class="filter-value">{{ searchParams.dateRange.join(' 至 ') }}</span>
            </div>
            <div class="filter-item" v-if="!Object.values(searchParams).some(v => v && (Array.isArray(v) ? v.length : true))">
              <span class="filter-label">筛选条件：</span>
              <span class="filter-value">全部数据</span>
            </div>
          </div>
        </div>
        
        <div class="export-preview">
          <h4 class="preview-title">数据预览（共 {{ exportData.length }} 条）</h4>
          <div class="preview-table-wrapper">
            <table class="preview-table">
              <thead>
                <tr>
                  <th>投保编号</th>
                  <th>企业名称</th>
                  <th>买方名称</th>
                  <th>买方国别</th>
                  <th>投保类型</th>
                  <th>机构类型</th>
                  <th>投保金额</th>
                  <th>状态</th>
                  <th>申请日期</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in exportData.slice(0, 10)" :key="row.id">
                  <td>{{ row.id }}</td>
                  <td>{{ row.companyName || row.enterpriseName }}</td>
                  <td>{{ row.buyerName }}</td>
                  <td>{{ row.buyerCountry }}</td>
                  <td>{{ row.insuranceType }}</td>
                  <td>{{ row.preferredInsuranceOrgType }}</td>
                  <td>{{ (row.insuranceCurrency || 'USD') }}{{ Number(row.insuranceAmount || 0).toLocaleString() }}</td>
                  <td>{{ statusMap[row.status] || row.status }}</td>
                  <td>{{ row.createTime }}</td>
                </tr>
                <tr v-if="exportData.length > 10">
                  <td colspan="9" class="more-data">... 还有 {{ exportData.length - 10 }} 条数据</td>
                </tr>
                <tr v-if="exportData.length === 0">
                  <td colspan="9" class="no-data">暂无数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="modal-footer">
          <t-button variant="outline" @click="exportVisible = false">取消</t-button>
          <t-button theme="primary" @click="generateExcel">导出Excel</t-button>
        </div>
      </div>
    </t-dialog>

    <t-dialog v-model:visible="deleteVisible" header="确认删除" width="480px">
      <div class="delete-modal">
        <div v-if="currentDeleteData" class="delete-info">
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">投保编号</span>
              <span class="info-value">{{ currentDeleteData.id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">企业名称</span>
              <span class="info-value">{{ currentDeleteData.companyName || currentDeleteData.enterpriseName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">买方名称</span>
              <span class="info-value">{{ currentDeleteData.buyerName || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">买方国别</span>
              <span class="info-value">{{ currentDeleteData.buyerCountry || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">投保类型</span>
              <span class="info-value">{{ currentDeleteData.insuranceType || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">投保金额</span>
              <span class="info-value">{{ currentDeleteData?.insuranceCurrency || 'USD' }}{{ Number(currentDeleteData?.insuranceAmount || 0).toLocaleString() }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">投保期限</span>
              <span class="info-value">{{ currentDeleteData?.expectedInsurancePeriod?.join(' 至 ') || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="delete-warning-text">
          <span class="warning-highlight">确定要删除这条投保申请吗？</span>
        </div>
        <div class="delete-caution">
          此操作无法撤回
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="deleteVisible = false">取消</t-button>
          <t-button theme="danger" @click="handleConfirmDelete">确认删除</t-button>
        </t-space>
      </template>
    </t-dialog>
  </div>
    <t-dialog v-model:visible="insuranceInfoVisible" header="投保方案确认" width="760px" :footer="false">
      <div v-if="currentInsuranceInfo" class="insurance-info-modal">
        <!-- Section 1: Base Information -->
        <div class="modal-section-title">📄 基础投保建议数据与出运申报</div>
        <div class="info-grid mb-16">
          <div class="info-row">
            <span class="info-label">投保建议编号</span>
            <span class="info-value">{{ currentInsuranceInfo.id || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">投保企业</span>
            <span class="info-value">{{ currentInsuranceInfo.companyName || currentInsuranceInfo.enterpriseName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">出险买方</span>
            <span class="info-value">{{ currentInsuranceInfo.buyerName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">买方国别</span>
            <span class="info-value">{{ currentInsuranceInfo.buyerCountry || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">申请限额额度</span>
            <span class="info-value">{{ currentInsuranceInfo.insuranceCurrency || 'USD' }}{{ Number(currentInsuranceInfo.insuranceAmount || 0).toLocaleString() }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">预估账期与期限</span>
            <span class="info-value">OA {{ currentInsuranceInfo.mostUsedPaymentTerm || 60 }}天 | 12个月</span>
          </div>
        </div>

        <!-- Section 2: Digital recommendation details -->
        <div class="digital-recommend-panel">
          <div class="recommend-header">
            <div class="recommend-title">
              <t-icon name="chart-bubble" />
              <span>💡 贸易信用数字化预审推荐方案</span>
            </div>
            <span class="recommend-badge">AI 算法专属推荐</span>
          </div>

          <div class="recommend-risk-info">
            <div>买方资信评级：<span class="risk-tag">🟢 A级（极低风险）</span></div>
            <div>国别地缘政治风险：<span class="risk-tag">🟢 极低风险</span></div>
            <div>大数据授信审核通过率：<span class="risk-tag">🟢 100%</span></div>
          </div>

          <div class="recommend-table-wp">
            <table class="recommend-table">
              <thead>
                <tr>
                  <th>保障参数</th>
                  <th>常规方案配置</th>
                  <th>数字化推荐保障方案 (政策红利特惠)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>赔付比例 (Coverage Ratio)</td>
                  <td class="regular-val">80.0%</td>
                  <td class="recommend-val">
                    <span>90.0%</span>
                    <span class="highlight-icon">加保 +10% 🌟</span>
                  </td>
                </tr>
                <tr>
                  <td>免赔额 (Deductible)</td>
                  <td class="regular-val">$2,000 USD</td>
                  <td class="recommend-val">
                    <span>$0.00 USD</span>
                    <span class="highlight-icon">全额保障免赔 🌟</span>
                  </td>
                </tr>
                <tr>
                  <td>建议保费费率 (Premium Rate)</td>
                  <td class="regular-val">0.15%</td>
                  <td class="recommend-val">
                    <span>0.11%</span>
                    <span class="highlight-icon">优惠下调 -26.7% 🌟</span>
                  </td>
                </tr>
                <tr>
                  <td>最终保费结算 (Premium)</td>
                  <td class="regular-val">
                    ${{ Number((currentInsuranceInfo.insuranceAmount || 0) * 0.0015).toLocaleString() }} USD
                  </td>
                  <td class="recommend-val">
                    <span>${{ Number((currentInsuranceInfo.insuranceAmount || 0) * 0.0011).toLocaleString() }} USD</span>
                    <span class="highlight-icon">立省 ${{ Number((currentInsuranceInfo.insuranceAmount || 0) * 0.0004).toLocaleString() }} 🌟</span>
                  </td>
                </tr>
                <tr>
                  <td>承保审批时效 (Audit SLA)</td>
                  <td class="regular-val">3~5 工作日</td>
                  <td class="recommend-val">
                    <span>秒级自动预核准</span>
                    <span class="highlight-icon">即时生效 🌟</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="recommend-note">
            * 提示：数字化推荐基于平台大数据贸易信用分析，针对符合低风险、高合规性的优质贸易背景自动赋能。
          </div>
        </div>

        <!-- Section 3: Checkbox willingness -->
        <div class="confirmation-box">
          <t-checkbox v-model="isConfirmedSchema"></t-checkbox>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <t-button variant="outline" @click="insuranceInfoVisible = false">取消</t-button>
          <t-button theme="primary" :disabled="!isConfirmedSchema" @click="handleConfirmInsuranceApply">
            申请投保
          </t-button>
        </div>
      </div>
      <div v-else class="no-data">暂无数据</div>
    </t-dialog>
</template>
<script setup>
import { reactive, computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useBusinessStore } from '@/stores/business'
import { useUserStore } from '@/stores/user'
import * as XLSX from 'xlsx'
import { generatePolicyApplicationXlsx, generateBuyerInfoXlsx } from '@/utils/templateFiller'

const router = useRouter()
const store = useBusinessStore()
const userStore = useUserStore()
const loading = computed(() => false)
const isCustomer = computed(() => userStore.role === 'customer')

const submitVisible = ref(false)
const currentSubmitData = ref(null)

const deleteVisible = ref(false)
const currentDeleteData = ref(null)

const insuranceInfoVisible = ref(false)
const currentInsuranceInfo = ref(null)
const isConfirmedSchema = ref(false)

const documentVisible = ref(false)
const currentDocumentData = ref(null)

const previewVisible = ref(false)
const previewTitle = ref('')
const previewSheets = ref([])
const previewActiveSheet = ref('')
const previewWorkbook = ref(null)
const previewFilename = ref('')

const contractSignVisible = ref(false)
const currentContractData = ref(null)
const contractTemplate = ref({ clauses: [], title: '', version: '' })

const paymentVisible = ref(false)
const currentPaymentData = ref(null)
const paymentLoading = ref(false)
const paymentForm = reactive({
  paymentSubject: '企业',
  payerName: '阿里巴巴企业',
  paymentMethod: 'online',
  amount: 0
})

const qrVisible = ref(false)
const qrSubject = ref('')
const qrData = ref(null)

const premiumConfirmVisible = ref(false)
const premiumConfirmData = ref(null)

const inkassoPremiumVisible = ref(false)
const inkassoPremiumData = ref(null)

const paymentInitVisible = ref(false)
const paymentInitData = ref(null)
const paymentInitForm = reactive({
  paymentSubject: '企业',
  payerName: ''
})
const enterpriseOptions = ['阿里巴巴企业', '腾讯企业']
const individualOptions = ['张三', '李四']
const payerOptions = computed(() =>
  paymentInitForm.paymentSubject === '企业' ? enterpriseOptions : individualOptions
)

const paymentQrVisible = ref(false)
const paymentQrData = ref(null)

const paymentVoucherFiles = ref([])
const paymentVoucherPreview = ref(null)
const previewVoucherVisible = ref(false)
const previewVoucherFile = ref(null)
const previewVoucherFileUrl = ref('')
const voucherUploadRef = ref(null)

const handleVoucherChange = (file, context) => {
  if (context.files) {
    paymentVoucherFiles.value = context.files
  }
}

const mockUpload = () => {
  return Promise.resolve({ status: 'success' })
}

const handlePreviewVoucherFile = (file) => {
  previewVoucherFile.value = file
  if (file.raw) {
    previewVoucherFileUrl.value = URL.createObjectURL(file.raw)
  } else if (file.url) {
    previewVoucherFileUrl.value = file.url
  }
  previewVoucherVisible.value = true
}

const showTablePreview = (wb, title, filename) => {
  previewWorkbook.value = wb
  previewTitle.value = title
  previewFilename.value = filename
  const sheets = []
  wb.SheetNames.forEach(name => {
    const ws = wb.Sheets[name]
    const html = XLSX.utils.sheet_to_html(ws, { id: 'preview-' + name })
    sheets.push({ name, html })
  })
  previewSheets.value = sheets
  previewActiveSheet.value = sheets[0]?.name || ''
  previewVisible.value = true
}

const handleDownloadPreview = () => {
  if (!previewWorkbook.value) return
  XLSX.writeFile(previewWorkbook.value, previewFilename.value)
  MessagePlugin.success('文件已下载')
}

const searchParams = reactive({
  enterpriseName: '',
  buyerName: '',
  buyerCountry: '',
  status: '',
  preferredInsuranceOrgType: '',
  dateRange: []
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

const statusOptions = [
  { value: 'draft', label: '待确认' },
  { value: 'pending_review', label: '已确认' },
  { value: 'contract_signing', label: '合同签署' },
  { value: 'inkasso_signed', label: '平台已签署' },
  { value: 'contract_signed', label: '合同已签署' },
  { value: 'service_fee_paid', label: '服务费已支付' },
  { value: 'platform_synced', label: '待缴纳保单费用' },
  { value: 'premium_confirmed', label: '保费已确认' },
  { value: 'payment_uploaded', label: '凭证已上传' },
  { value: 'active', label: '已生效' },
  { value: 'approved', label: '已确认' }
]

const statusMap = {
  draft: '待确认',
  pending_review: '已确认',
  clerk_review: '跟单员审核',
  contract_signing: '合同签署',
  inkasso_signed: '平台已签署',
  contract_signed: '合同已签署',
  service_fee_paid: '服务费已支付',
  credit_investigating: '资信调查',
  limit_approving: '限额审批',
  underwriting: '核保出单',
  pending_payment: '待缴费',
  approved: '已确认',
  uw_completed: '核保已完成',
  platform_synced: '待缴纳保单费用',
  premium_confirmed: '保费已确认',
  payment_uploaded: '凭证已上传',
  active: '已生效',
  rejected: '待确认',
  ocr_pending: '待确认',
  ocr_clerk_review: '待审核',
  ocr_approved: '已确认'
}

const columns = [
  { colKey: 'id', title: '投保编号', width: 130 },
  { colKey: 'policyNo', title: '保单号', width: 130 },
  { colKey: 'companyName', title: '企业名称', ellipsis: true },
  { colKey: 'buyerName', title: '买方名称', ellipsis: true },
  { colKey: 'buyerCountry', title: '买方国别', width: 100 },
  { colKey: 'insuranceType', title: '投保类型', width: 120 },
  { colKey: 'preferredInsuranceOrgType', title: '机构类型', width: 120 },
  { colKey: 'insuranceAmount', title: '投保金额', align: 'right', width: 130 },
  { colKey: 'premium', title: '保费金额', align: 'right', width: 130, slot: 'premium' },
  { colKey: 'serviceFee', title: '服务费', width: 130, slot: 'serviceFee' },
  { colKey: 'status', title: '状态', width: 110, slot: 'status' },
  { colKey: 'createTime', title: '申请日期', width: 120 },
  { colKey: 'operation', title: '操作', width: 420, fixed: 'right', slot: 'operation' }
]

const pendingStats = computed(() => {
  const list = store.insuranceApplications || []
  return {
    pending_all: list.filter(it => ['draft', 'pending_review', 'contract_signing', 'inkasso_signed', 'contract_signed', 'service_fee_paid', 'credit_investigating', 'platform_synced', 'premium_confirmed', 'payment_uploaded', 'rejected'].includes(it.status)).length,
    approved: list.filter(it => it.status === 'approved' || it.status === 'completed').length
  }
})

const filteredData = computed(() => {
  const list = store.insuranceApplications || []
  return list.filter((it) => {
    if (searchParams.enterpriseName && !String(it.companyName || it.enterpriseName || '').includes(searchParams.enterpriseName)) return false
    if (searchParams.buyerName && !String(it.buyerName || '').includes(searchParams.buyerName)) return false
    if (searchParams.buyerCountry && it.buyerCountry !== searchParams.buyerCountry) return false
    if (searchParams.status && it.status !== searchParams.status) return false
    if (searchParams.preferredInsuranceOrgType && it.preferredInsuranceOrgType !== searchParams.preferredInsuranceOrgType) return false
    return true
  })
})

const pagination = reactive({
  total: 0,
  current: 1,
  pageSize: 20
})

const tableData = computed(() => {
  pagination.total = filteredData.value.length
  const start = (pagination.current - 1) * pagination.pageSize
  return filteredData.value.slice(start, start + pagination.pageSize)
})

const paginationConfig = computed(() => ({
  theme: 'simple',
  ...pagination
}))

const handleSearch = () => { pagination.current = 1 }
const handleReset = () => { searchParams.enterpriseName = ''; searchParams.buyerName = ''; searchParams.buyerCountry = ''; searchParams.status = ''; searchParams.preferredInsuranceOrgType = ''; searchParams.dateRange = []; pagination.current = 1 }
const handlePageChange = (pageInfo) => { pagination.current = pageInfo.current; pagination.pageSize = pageInfo.pageSize }
const exportVisible = ref(false)
const exportData = ref([])

const handleExport = () => {
  exportData.value = filteredData.value
  exportVisible.value = true
}

const generateExcel = () => {
  const headers = [
    { key: 'id', label: '投保编号' },
    { key: 'enterpriseName', label: '企业名称' },
    { key: 'buyerName', label: '买方名称' },
    { key: 'buyerCountry', label: '买方国别' },
    { key: 'insuranceType', label: '投保类型' },
    { key: 'preferredInsuranceOrgType', label: '机构类型' },
    { key: 'insuranceAmount', label: '投保金额' },
    { key: 'paymentTerms', label: '支付条件' },
    { key: 'appliedCreditLimit', label: '申请信用限额' },
    { key: 'historicalOverdueStatus', label: '历史逾期情况' },
    { key: 'buyerHasPublicFinancials', label: '公开财报' },
    { key: 'buyerIsListedCompany', label: '上市公司' },
    { key: 'buyerHasNegativeNews', label: '负面新闻' },
    { key: 'designatedInsuranceCompany', label: '指定保险公司' },
    { key: 'designatedInsuranceCompanyName', label: '指定公司名称' },
    { key: 'companyEnglishName', label: '公司英文名称' },
    { key: 'industrySubCategory', label: '行业细分品类' },
    { key: 'existingCreditPolicy', label: '现有信用险保单' },
    { key: 'threeYearExportAmount25', label: '2025年出口总额' },
    { key: 'cashTransactionRatio', label: '现金交易占比' },
    { key: 'creditTransactionRatio', label: '赊账交易占比' },
    { key: 'status', label: '状态' },
    { key: 'createTime', label: '申请日期' }
  ]
  
  let excelContent = headers.map(h => h.label).join('\t') + '\n'
  
  exportData.value.forEach(row => {
    const rowData = headers.map(h => {
      let value = row[h.key]
      if (h.key === 'enterpriseName') {
        value = value || row.companyName || ''
      }
      if (h.key === 'status') {
        value = statusMap[row[h.key]] || row[h.key]
      }
      if (h.key === 'insuranceAmount') {
        value = (row.insuranceCurrency || 'USD') + ' ' + (Number(value) || 0).toLocaleString()
      }
      return value || '-'
    })
    excelContent += rowData.join('\t') + '\n'
  })
  
  const blob = new Blob(['\uFEFF' + excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `投保信息_${new Date().toISOString().split('T')[0]}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  exportVisible.value = false
  MessagePlugin.success('导出成功')
}

const handleAdd = () => { router.push('/insurance/purchase/new') }
const handleView = (row) => { router.push(`/insurance/purchase/${row.id}`) }
const handleEdit = (row) => { router.push(`/insurance/purchase/${row.id}/edit`) }
const pendingStatuses = ['draft', 'rejected', 'ocr_pending']
const isPendingConfirmation = (status) => pendingStatuses.includes(status)

const handleShowSubmitModal = (row) => {
  currentSubmitData.value = row
  submitVisible.value = true
}
const handleConfirmSubmit = () => {
  const res = store.submitInsuranceApplication(currentSubmitData.value.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '提交失败')
    return
  }
  submitVisible.value = false
  MessagePlugin.success('提交成功，状态已变更为已确认')
}
const handleGenerateDocuments = (row) => {
  // 已处于合同签署及后续阶段，说明投保资料已生成，不能重复生成
  if (['contract_signing', 'inkasso_signed', 'contract_signed', 'service_fee_paid', 'clerk_review', 'credit_investigating', 'limit_approving', 'underwriting', 'pending_payment', 'approved', 'completed'].includes(row.status)) {
    MessagePlugin.warning('该投保记录的投保资料已生成，不能重复生成')
    return
  }
  currentDocumentData.value = row
  documentVisible.value = true
}

const handlePushToClerk = (row) => {
  const result = store.pushToClerk(row.id)
  if (result.ok) {
    store.touchInsuranceApplications()
    MessagePlugin.success('投保资料已推送至跟单员')
  } else {
    MessagePlugin.error(result.message || '操作失败')
  }
}

const handleDocumentConfirm = () => {
  const row = currentDocumentData.value
  if (!row) return
  // 生成投保资料
  try {
    generatePolicyApplicationXlsx(row, statusMap)
  } catch (e) {
    console.error('生成投保申请书失败', e)
  }
  try {
    generateBuyerInfoXlsx(row)
  } catch (e) {
    console.error('生成买方信息采集表失败', e)
  }
  // 更新状态流转到下一步
  const result = store.generateDocuments(row.id)
  if (result.ok) {
    documentVisible.value = false
    store.touchInsuranceApplications()
    MessagePlugin.success('投保资料已生成，流程已流转至合同签署阶段')
  } else {
    MessagePlugin.error(result.message || '操作失败')
  }
}

const handlePreviewPolicyApplication = (row) => {
  if (!row) return
  try {
    const wb = generatePolicyApplicationXlsx(row, statusMap)
    const filename = `投保申请书_${row.id || ''}_${new Date().toISOString().split('T')[0]}.xlsx`
    showTablePreview(wb, '投保申请书 - 预览', filename)
  } catch (e) {
    console.error('生成投保申请书失败', e)
    MessagePlugin.error('生成投保申请书失败：' + (e.message || '未知错误'))
  }
}

const handlePreviewBuyerInfo = (row) => {
  if (!row) return
  try {
    const wb = generateBuyerInfoXlsx(row)
    const filename = `买方信息采集表_${row.id || ''}_${new Date().toISOString().split('T')[0]}.xlsx`
    showTablePreview(wb, '买方信息采集表 - 预览', filename)
  } catch (e) {
    console.error('生成买方信息采集表失败', e)
    MessagePlugin.error('生成买方信息采集表失败：' + (e.message || '未知错误'))
  }
}

const handleApprove = (row) => {
  const res = store.approveInsuranceApplication(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '操作失败')
    return
  }
  MessagePlugin.success('已模拟通过，已生成保单与信用限额')
  router.push('/policy/list')
}
const handleShowDeleteModal = (row) => {
  currentDeleteData.value = row
  deleteVisible.value = true
}

const handleConfirmDelete = () => {
  if (currentDeleteData.value) {
    store.insuranceApplications = store.insuranceApplications.filter(it => it.id !== currentDeleteData.value.id)
    MessagePlugin.success('删除成功')
  }
  deleteVisible.value = false
}

const handleShowInsuranceInfo = (row) => {
  currentInsuranceInfo.value = row
  isConfirmedSchema.value = false
  insuranceInfoVisible.value = true
}

const handleConfirmInsuranceApply = () => {
  if (!isConfirmedSchema.value) {
    MessagePlugin.warning('请先勾选确认')
    return
  }
  
  // Real business state synchronization
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const addDays = (dateStr, days) => {
    const dt = new Date(dateStr)
    dt.setDate(dt.getDate() + days)
    return formatDate(dt)
  }
  const dateStr = formatDate(now)
  const expireStr = addDays(dateStr, 365)
  const policyNo = `PI2026${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  const currentApp = currentInsuranceInfo.value

  // 1. Update the application status to 'approved' and digital data in store.insuranceApplications
  const appIndex = store.insuranceApplications.findIndex(it => it.id === currentApp.id)
  if (appIndex >= 0) {
    store.insuranceApplications[appIndex] = {
      ...store.insuranceApplications[appIndex],
      status: 'approved',
      policyNo,
      insuranceCompanyName: currentApp.preferredInsuranceOrgType === '政策性保险机构' ? '中国信保' : '人保财险',
      policyStartDate: dateStr,
      policyEndDate: expireStr,
      policyPeriod: '12个月',
      maxCompensationLimit: Number(currentApp.insuranceAmount) || 0,
      premiumRate: 1.1, // 0.11% in permil is 1.1%
      premium: Number((currentApp.insuranceAmount || 0) * 0.0011),
      coverageRatio: 90,
      deductible: 0,
      sla: 'instant'
    }
  }

  // 2. Generate active policy record and unshift to store.policies
  const policyId = `P2026${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  store.policies.unshift({
    id: policyId,
    policyNo,
    insuranceCompany: currentApp.preferredInsuranceOrgType === '政策性保险机构' ? '中国信保' : '人保财险',
    policyholder: currentApp.companyName || currentApp.enterpriseName || '深圳XX国际贸易有限公司',
    insured: currentApp.buyerName || 'ABC Corporation',
    coverageAmount: Number(currentApp.insuranceAmount) || 0,
    premium: Number((currentApp.insuranceAmount || 0) * 0.0011),
    effectiveDate: dateStr,
    expiryDate: expireStr,
    status: 'active',
    statusName: '有效',
    usedQuota: 0,
    remainingQuota: Number(currentApp.insuranceAmount) || 0,
    coverageRatio: 90,
    deductible: 0,
    premiumRate: 0.0011
  })

  // 3. Generate active credit limit record and unshift to store.creditLimits
  const limitId = `CL2026${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  store.creditLimits.unshift({
    id: limitId,
    buyerName: currentApp.buyerName || 'ABC Corporation',
    buyerCountry: currentApp.buyerCountry || '美国',
    appliedLimit: Number(currentApp.insuranceAmount) || 0,
    usedLimit: 0,
    remainingLimit: Number(currentApp.insuranceAmount) || 0,
    usageRate: 0,
    status: 'active',
    effectiveDate: dateStr,
    expiryDate: expireStr
  })

  MessagePlugin.success('投保申请成功！已成功应用数字化推荐方案（赔付比90%、0免赔、0.11%优惠费率），保单已同步生成并激活！')
  insuranceInfoVisible.value = false
}

const handleShowContractSigning = (row) => {
  currentContractData.value = row
  contractTemplate.value = store.getContractTemplate('default')
  contractSignVisible.value = true
}

const handleShowCustomerSigning = (row) => {
  currentContractData.value = row
  contractTemplate.value = store.getContractTemplate('default')
  contractSignVisible.value = true
}

const handleInkassoSignContract = () => {
  const row = currentContractData.value
  if (!row) return
  const result = store.signInsuranceContract(row.id, 'inkasso')
  if (result.ok) {
    store.touchInsuranceApplications()
    const updated = store.insuranceApplications.find(it => it.id === row.id)
    if (updated) currentContractData.value = updated
    MessagePlugin.success('平台已签署合同')
  } else {
    MessagePlugin.error(result.message || '签署失败')
  }
}

const handleCustomerSignContract = () => {
  const row = currentContractData.value
  if (!row) return
  const result = store.signInsuranceContract(row.id, 'customer')
  if (result.ok) {
    store.touchInsuranceApplications()
    const updated = store.insuranceApplications.find(it => it.id === row.id)
    if (updated) currentContractData.value = updated
    MessagePlugin.success('客户已签署合同')
  } else {
    MessagePlugin.error(result.message || '签署失败')
  }
}

const handleDownloadContract = () => {
  const row = currentContractData.value
  if (!row) return
  const wb = generateContractXlsx(row, contractTemplate.value)
  const filename = `保险合同_${row.id || ''}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)
  MessagePlugin.success('合同已下载')
}

const handlePreviewContract = () => {
  const row = currentContractData.value
  if (!row) return
  const wb = generateContractXlsx(row, contractTemplate.value)
  const filename = `保险合同_${row.id || ''}_${new Date().toISOString().split('T')[0]}.xlsx`
  showTablePreview(wb, '保险合同 - 预览', filename)
}

const generateContractXlsx = (row, template) => {
  const wb = XLSX.utils.book_new()
  const statusText = row.inkassoContractSigned && row.customerContractSigned
    ? '双方已签署'
    : row.inkassoContractSigned
      ? '平台已签署，待客户签署'
      : '待签署'
  const infoData = [
    ['短期出口信用保险合同'],
    [],
    ['版本', template.version || 'v2025.1'],
    ['甲方（保险人）', row.insuranceCompanyName || row.preferredInsuranceOrgType || '人保财险'],
    ['乙方（被保险人）', row.companyName || '-'],
    ['投保编号', row.id],
    [],
    ['签署状态', statusText],
    ['平台签署时间', row.inkassoSignTime || '-'],
    ['客户签署时间', row.customerSignTime || '-'],
  ]
  const infoSheet = XLSX.utils.aoa_to_sheet(infoData)
  XLSX.utils.book_append_sheet(wb, infoSheet, '合同信息')
  const clauseData = [['条款编号', '条款名称', '条款内容']]
  template.clauses.forEach((clause, i) => {
    clauseData.push([String(i + 1), clause.title, clause.content])
  })
  const clauseSheet = XLSX.utils.aoa_to_sheet(clauseData)
  XLSX.utils.book_append_sheet(wb, clauseSheet, '合同条款')
  return wb
}

const handleShowPayment = (row) => {
  if (row.status === 'premium_confirmed') {
    // Premium payment flow
    paymentInitData.value = row
    paymentInitForm.paymentSubject = '企业'
    paymentInitForm.payerName = '阿里巴巴企业'
    paymentInitVisible.value = true
  } else {
    // Service fee payment flow (contract_signed)
    currentPaymentData.value = row
    const amount = Math.round(Number(row.insuranceAmount || 0) * 0.0011)
    paymentForm.paymentSubject = '企业'
    paymentForm.payerName = '阿里巴巴企业'
    paymentForm.paymentMethod = 'online'
    paymentForm.amount = amount
    paymentVisible.value = true
  }
}

const handleConfirmPayment = () => {
  const row = currentPaymentData.value
  if (!row) return
  const displayName = paymentForm.payerName
  if (!displayName) {
    MessagePlugin.warning('请选择付款企业/付款人')
    return
  }
  qrSubject.value = displayName
  const short = (displayName || '').length > 4 ? (displayName || '').substring(0, 4) + '..' : (displayName || '')
  qrData.value = {
    subject: displayName,
    subjectShort: short,
    applicationId: row.id,
    amount: paymentForm.amount,
    method: paymentForm.paymentMethod
  }
  paymentVisible.value = false
  qrVisible.value = true
}

const handlePaymentScanComplete = async () => {
  const row = currentPaymentData.value
  if (!row) return
  paymentLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 1500))
  const payerName = paymentForm.payerName
  const result = store.payServiceFee(row.id, {
    payerType: paymentForm.paymentSubject,
    payerName,
    paymentSubject: payerName,
    paymentMethod: paymentForm.paymentMethod,
    amount: paymentForm.amount
  })
  paymentLoading.value = false
  if (result.ok) {
    store.touchInsuranceApplications()
    qrVisible.value = false
    MessagePlugin.success('服务费支付成功')
  } else {
    paymentLoading.value = false
    MessagePlugin.error(result.message || '支付失败')
  }
}

const handleInkassoPremiumRequest = (row) => {
  inkassoPremiumData.value = row
  inkassoPremiumVisible.value = true
}

const handleInkassoPremiumRequestSubmit = () => {
  const row = inkassoPremiumData.value
  if (!row) return
  const res = store.initiatePremiumConfirmation(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '申请失败')
    return
  }
  store.touchInsuranceApplications()
  inkassoPremiumVisible.value = false
  MessagePlugin.success('保费确认申请已发送，请客户登录确认')
}

const handleShowPremiumConfirm = (row) => {
  premiumConfirmData.value = row
  premiumConfirmVisible.value = true
}

const handlePremiumConfirm = () => {
  const row = premiumConfirmData.value
  if (!row) return
  const res = store.confirmPremium(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '确认失败')
    return
  }
  store.touchInsuranceApplications()
  premiumConfirmVisible.value = false
  MessagePlugin.success('保费已确认，请进行线下支付并上传支付凭证')
}

const handlePaymentInitConfirm = () => {
  const row = paymentInitData.value
  if (!row) return
  const displayName = paymentInitForm.payerName
  if (!displayName) {
    MessagePlugin.warning('请选择付款企业/付款人')
    return
  }
  if (!paymentVoucherFiles.value || paymentVoucherFiles.value.length === 0) {
    MessagePlugin.warning('请上传保费交纳凭证')
    return
  }
  const voucherFile = paymentVoucherFiles.value[0]
  const res = store.uploadPaymentProof(row.id, {
    payerName: displayName,
    paymentSubject: paymentInitForm.paymentSubject,
    paymentDate: new Date().toISOString().split('T')[0],
    proofNo: '',
    remark: '保费交纳凭证上传',
    voucherFileName: voucherFile.name || '',
    voucherFileType: voucherFile.raw?.type || ''
  })
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '上传失败')
    return
  }
  store.touchInsuranceApplications()
  paymentInitVisible.value = false
  paymentInitData.value = null
  paymentVoucherFiles.value = []
  paymentVoucherPreview.value = null
  MessagePlugin.success('保费交纳凭证已上传，请等待跟单员确认')
}

const handlePaymentQrComplete = () => {
  const row = paymentInitData.value
  if (!row) return
  const payerName = paymentInitForm.payerName || (paymentInitForm.paymentSubject === 'enterprise' ? row.companyName : (row.contactName || row.legalRepresentative))
  const res = store.uploadPaymentProof(row.id, {
    payerName: payerName || '',
    paymentDate: new Date().toISOString().split('T')[0],
    proofNo: '',
    remark: '扫码支付'
  })
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '支付确认失败')
    return
  }
  store.touchInsuranceApplications()
  // 客户缴纳保费 → 完成缴费生效(step6)，标记整个投保流程完成
  store.approveInsuranceTaskStep(row.id + '_flow', {
    handler: row.companyName || '客户',
    approvalResult: 'approved',
    auditOpinion: '客户已完成保费缴纳'
  })
  paymentQrVisible.value = false
  paymentInitData.value = null
  MessagePlugin.success('保费支付完成，请等待平台确认生效')
}

const handleActivatePolicy = (row) => {
  const res = store.activatePolicyByPlatform(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '确认生效失败')
    return
  }
  store.touchInsuranceApplications()
  // 平台确认生效 → 完成缴费生效(step6)，标记整个流程完成
  store.approveInsuranceTaskStep(row.id + '_flow', {
    handler: '长安银科',
    approvalResult: 'approved',
    auditOpinion: '保单已确认为生效'
  })
  MessagePlugin.success('保单已确认为生效状态')
}

const handleUploadPolicy = (row) => {
  // 跳转到保单管理-电子保单列表
  router.push('/policy/list?tab=upload')
}

onMounted(() => {
  store.ensureSeeded()
})
</script>

<style lang="scss" scoped>
.page-container { }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.search-card { margin-bottom: 16px; :deep(.t-card__body) { display: flex; justify-content: space-between; align-items: flex-end; } }
.search-actions { display: flex; gap: 8px; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.table-title { font-size: 16px; font-weight: 600; color: #333; }
.table-count { font-size: 14px; color: #999; }
.mb-16 { margin-bottom: 16px; }

.detail-container { padding: 0 16px; }

.submit-modal {
	  padding: 8px 0;

	  .submit-confirm-bar {
	    display: flex;
	    align-items: center;
	    gap: 10px;
	    padding: 12px 16px;
	    background: #f0f9ff;
	    border: 1px solid #bae6fd;
	    border-radius: 8px;
	    color: #0369a1;
	    font-size: 14px;

	    .confirm-icon {
	      color: #0ea5e9;
	      flex-shrink: 0;
	    }
	  }

	  .modal-divider {
	    height: 1px;
	    background: #e2e8f0;
	    margin: 16px 0;
	  }

	  .submit-sections {
	    display: flex;
	    flex-direction: column;
	    gap: 16px;
	  }

	  .submit-section {
	    background: #fafbfc;
	    border: 1px solid #e8ecf0;
	    border-radius: 8px;
	    overflow: hidden;
	  }

	  .submit-section-title {
	    font-size: 14px;
	    font-weight: 600;
	    color: #1e293b;
	    padding: 10px 16px;
	    background: #f1f4f8;
	    border-bottom: 1px solid #e8ecf0;
	  }

	  .detail-panel {
	    padding: 4px 0;
	  }

	  .detail-item {
	    display: flex;
	    padding: 10px 16px;
	    border-bottom: 1px dashed #eee;

	    &:last-child {
	      border-bottom: none;
	    }
	  }

	  .detail-label {
	    width: 140px;
	    flex-shrink: 0;
	    color: #999;
	    font-size: 13px;
	  }

	  .detail-value {
	    flex: 1;
	    color: #333;
	    font-size: 13px;
	    word-break: break-all;
	  }

	  .modal-footer {
	    display: flex;
	    justify-content: flex-end;
	    gap: 12px;
	    margin-top: 20px;
	    padding-top: 16px;
	    border-top: 1px solid #e2e8f0;
	  }
	}

.document-modal {
  padding: 8px 0;

  .submit-sections {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .submit-section {
    background: #fafbfc;
    border: 1px solid #e8ecf0;
    border-radius: 8px;
    overflow: hidden;
  }

  .submit-section-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    padding: 10px 16px;
    background: #f1f4f8;
    border-bottom: 1px solid #e8ecf0;
  }

  .detail-panel {
    padding: 4px 0;
  }

  .detail-item {
    display: flex;
    padding: 10px 16px;
    border-bottom: 1px dashed #eee;

    &:last-child {
      border-bottom: none;
    }
  }

  .detail-label {
    width: 140px;
    flex-shrink: 0;
    color: #999;
    font-size: 13px;
  }

  .detail-value {
    flex: 1;
    color: #333;
    font-size: 13px;
    word-break: break-all;
  }

  .modal-divider {
    height: 1px;
    background: #e2e8f0;
    margin: 16px 0;
  }

  .documents-section {
    .documents-title {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 12px;
      padding-left: 12px;
      border-left: 4px solid #0052d9;
    }

    .documents-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .document-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 20px;
      border: 1px solid #e8ecf0;
      border-radius: 10px;
      background: #fafbfc;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #0052d9;
        box-shadow: 0 2px 12px rgba(0, 82, 217, 0.08);
      }

      .doc-card-icon {
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;

        &.doc-icon-primary {
          background: #e8f4fd;
          color: #0052d9;
        }

        &.doc-icon-success {
          background: #e8f8e8;
          color: #16a34a;
        }
      }

      .doc-card-info {
        text-align: center;

        .doc-card-name {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .doc-card-desc {
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.4;
        }
      }

      .doc-card-actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }
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

.export-modal {
  padding: 16px 0;

  .export-filters {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e2e8f0;
    
    .filter-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin: 0 0 12px 0;
      padding-left: 8px;
      border-left: 3px solid #1d39c4;
    }
    
    .filter-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    
    .filter-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 6px;
      
      .filter-label {
        font-size: 13px;
        color: #64748b;
        margin-right: 4px;
      }
      
      .filter-value {
        font-size: 13px;
        color: #1e293b;
        font-weight: 500;
      }
    }
  }
  
  .export-preview {
    .preview-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin: 0 0 12px 0;
      padding-left: 8px;
      border-left: 3px solid #1d39c4;
    }
    
    .preview-table-wrapper {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    
    .preview-table {
      width: 100%;
      border-collapse: collapse;
      
      th, td {
        padding: 10px 12px;
        text-align: left;
        font-size: 13px;
        border-bottom: 1px solid #e2e8f0;
      }
      
      th {
        background: #f8fafc;
        font-weight: 600;
        color: #64748b;
        position: sticky;
        top: 0;
        z-index: 1;
      }
      
      td {
        color: #1e293b;
      }
      
      tbody tr:hover {
        background: #f8fafc;
      }
      
      .more-data, .no-data {
        text-align: center;
        color: #94a3b8;
        font-style: italic;
      }
    }
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }
}

.delete-modal {
  padding: 16px 0;
  
  .delete-info {
    width: 100%;
    margin-bottom: 16px;
    
    .info-section {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #e2e8f0;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      
      &:not(:last-child) {
        border-bottom: 1px dashed #e2e8f0;
      }
      
      .info-label {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }
      
      .info-value {
        font-size: 13px;
        color: #1e293b;
        font-weight: 600;
        text-align: right;
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
  
  .delete-warning-text {
    text-align: center;
    margin-bottom: 8px;
    
    .warning-highlight {
      font-size: 14px;
      font-weight: 600;
      color: #dc2626;
    }
  }
  
  .delete-caution {
    font-size: 12px;
    color: #94a3b8;
    margin-bottom: 16px;
    padding: 8px 16px;
    background: #fef3c7;
    border-radius: 4px;
    text-align: center;
    width: 100%;
    box-sizing: border-box;
  }
}
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}

.insurance-info-modal {
  padding: 16px 0;
}
.insurance-info-modal .info-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.insurance-info-modal .info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.insurance-info-modal .info-row:last-child {
  border-bottom: none;
}
.insurance-info-modal .info-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
  flex-shrink: 0;
}
.insurance-info-modal .info-value {
  font-size: 13px;
  color: #333;
  font-weight: 600;
  text-align: right;
}

.modal-section-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin: 16px 0 12px 0;
  padding-left: 10px;
  border-left: 4px solid #0052d9;
}

.digital-recommend-panel {
  background: linear-gradient(135deg, rgba(240, 248, 255, 0.8) 0%, rgba(230, 244, 255, 0.9) 100%);
  border: 1px solid #b3d8ff;
  border-radius: 12px;
  padding: 18px;
  margin-top: 16px;
  box-shadow: 0 4px 16px rgba(0, 82, 217, 0.05);
  backdrop-filter: blur(4px);
  
  .recommend-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    border-bottom: 1px dashed #b3d8ff;
    padding-bottom: 10px;
    
    .recommend-title {
      font-size: 15px;
      font-weight: 700;
      color: #0052d9;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .recommend-badge {
      background: #0052d9;
      color: white;
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 5px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
  }
  
  .recommend-risk-info {
    display: flex;
    gap: 20px;
    margin-bottom: 14px;
    font-size: 13px;
    background: rgba(255, 255, 255, 0.7);
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.9);
    
    .risk-tag {
      font-weight: 700;
      color: #2ba471;
    }
  }
  
  .recommend-table-wp {
    background: white;
    border-radius: 8px;
    border: 1px solid #dbeafe;
    overflow: hidden;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0, 82, 217, 0.02);
  }
  
  .recommend-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    
    th, td {
      padding: 10px 14px;
      text-align: left;
      border-bottom: 1px solid #f1f5f9;
    }
    
    th {
      background: #f8fafc;
      color: #64748b;
      font-weight: 600;
    }
    
    tbody tr:last-child td {
      border-bottom: none;
    }
    
    .regular-val {
      color: #94a3b8;
      text-decoration: line-through;
    }
    
    .recommend-val {
      color: #0052d9;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .highlight-icon {
      font-size: 11px;
      background: #e6f7ff;
      color: #1890ff;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
  }
  
  .recommend-note {
    font-size: 11px;
    color: #64748b;
    line-height: 1.5;
  }
}

.contract-sign-modal {
  padding: 8px 0;
  max-height: 70vh;
  overflow-y: auto;

  .contract-header {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid #1e293b;

    .contract-title {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .contract-version {
      font-size: 12px;
      color: #94a3b8;
    }
  }

  .contract-parties {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;

    .party-info-row {
      display: flex;
      align-items: center;
      gap: 8px;

      .party-label {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
        min-width: 120px;
      }

      .party-value {
        font-size: 13px;
        color: #1e293b;
        font-weight: 600;
      }
    }
  }

  .contract-clauses {
    margin-bottom: 20px;

    .clause-item {
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #fafbfc;
      border: 1px solid #e8ecf0;
      border-radius: 8px;

      .clause-title {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 8px;
      }

      .clause-content {
        font-size: 13px;
        color: #475569;
        line-height: 1.8;
      }
    }
  }

  .contract-sign-area {
    padding: 20px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    text-align: center;

    .sign-status-row {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-bottom: 16px;

      .sign-status-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        color: #475569;
      }
    }

    .sign-action-bar {
      margin-top: 12px;
    }

    .sign-complete-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #16a34a;

      .complete-icon {
        color: #16a34a;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
  }
}

.qr-modal {
  padding: 8px 0;
  text-align: center;

  .qr-header {
    margin-bottom: 20px;

    .qr-icon {
      font-size: 48px;
      margin-bottom: 8px;
    }

    .qr-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
  }

  .qr-code-area {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;

    .qr-code-box {
      width: 200px;
      height: 200px;
      background: #fff;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      position: relative;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);

      .qr-pattern {
        width: 100%;
        height: 100%;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;

        .qr-corner {
          position: absolute;
          width: 36px;
          height: 36px;
          border: 4px solid #1e293b;

          &.qr-tl { top: 0; left: 0; border-right: none; border-bottom: none; }
          &.qr-tr { top: 0; right: 0; border-left: none; border-bottom: none; }
          &.qr-bl { bottom: 0; left: 0; border-right: none; border-top: none; }
          &.qr-br { bottom: 0; right: 0; border-left: none; border-top: none; }
        }

        .qr-center-icon {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          background: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          border: 2px solid #e2e8f0;
        }
      }
    }
  }

  .qr-info {
    text-align: left;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 16px;

    .qr-info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;

      &:not(:last-child) {
        border-bottom: 1px dashed #e2e8f0;
      }

      .qr-label {
        font-size: 13px;
        color: #64748b;
      }

      .qr-value {
        font-size: 13px;
        color: #1e293b;
        font-weight: 500;
      }

      .qr-amount {
        font-size: 18px;
        font-weight: 700;
        color: #0052d9;
      }
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }
}

.payment-modal {
  padding: 8px 0;

  .payment-section {
    margin-bottom: 16px;

    .payment-section-title {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 12px;
      padding-left: 10px;
      border-left: 4px solid #0052d9;
    }
  }

  .payment-divider {
    height: 1px;
    background: #e2e8f0;
    margin: 16px 0;
  }

  .payment-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .payment-row {
    display: flex;
    align-items: center;
    gap: 12px;

    .payment-label {
      min-width: 100px;
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
      flex-shrink: 0;
    }

    .payment-value-text {
      font-size: 13px;
      color: #1e293b;
    }

    .payment-amount {
      font-size: 20px;
      font-weight: 700;
      color: #0052d9;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }
}

.premium-modal {
  padding: 4px 0;

  .pm-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 14px;
    overflow: hidden;
  }
  .pm-card-header {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    padding: 12px 18px;
    background: #f1f5f9;
    border-bottom: 1px solid #e5e7eb;
  }
  .pm-card-body { padding: 14px 18px; }
  .pm-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 24px;
  }
  .pm-field {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px 0;
  }
  .pm-field-full { grid-column: 1 / -1; }
  .pm-label {
    font-size: 12px;
    color: #8a8f9a;
    font-weight: 500;
  }
  .pm-value {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
  }
  .pm-number { font-weight: 700; color: #0052d9; font-family: 'SF Mono', monospace; }
  .pm-amount {
    font-size: 20px;
    font-weight: 700;
    color: #0052d9;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }
}

.proof-modal {
  padding: 8px 0;

  .proof-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .proof-row {
    display: flex;
    align-items: center;
    gap: 12px;

    .proof-label {
      min-width: 90px;
      font-size: 13px;
      color: #333;
      font-weight: 600;
      flex-shrink: 0;
    }

    .proof-value-text {
      font-size: 13px;
      color: #1e293b;
      font-weight: 600;
    }

    :deep(.t-input),
    :deep(.t-date-picker),
    :deep(.t-textarea) {
      flex: 1;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }
}

.confirmation-box {
  margin-top: 18px;
  padding: 14px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  
  :deep(.t-checkbox__label) {
    font-size: 13px;
    color: #475569;
    font-weight: 500;
    line-height: 1.6;
  }
}

.payment-init-modal {
  padding: 8px 0;
}
.payment-init-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
}
.payment-init-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.payment-init-label {
  min-width: 80px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
  flex-shrink: 0;
}
.policy-order-table {
  margin-top: 12px;
}
.order-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.order-table th,
.order-table td {
  border: 1px solid #e2e8f0;
  padding: 10px 8px;
  text-align: center;
}
.order-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
}
.order-table td {
  color: #333;
}
.order-table .premium-cell {
  color: #e34d59;
  font-weight: 600;
}
.contract-footer {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
</style>
