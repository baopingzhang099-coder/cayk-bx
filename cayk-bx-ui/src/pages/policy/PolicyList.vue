<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/policy/list">保单管理</t-breadcrumb-item>
        <t-breadcrumb-item>保单信息管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">保单信息管理</div>
      <t-badge v-if="isClerk && unreadNotificationCount > 0" :count="unreadNotificationCount" :offset="[-4, 4]" dot>
        <t-button shape="circle" variant="text" @click="notificationVisible = true">
          <template #icon><t-icon name="notification" /></template>
        </t-button>
      </t-badge>
      <t-button v-if="isClerk && unreadNotificationCount === 0" shape="circle" variant="text" @click="notificationVisible = true">
        <template #icon><t-icon name="notification" /></template>
      </t-button>
    </div>

    <t-tabs v-model="mainTab" theme="card" class="mb-16">
      <t-tab-panel value="upload" label="电子保单列表">
        <div class="table-header">
          <span class="table-title">电子保单列表</span>
          <t-space>
            <t-button theme="primary" v-if="isCustomer" @click="externalUploadVisible = true">
              <template #icon><t-icon name="file-pdf" /></template>
              上传电子保单
            </t-button>
            <t-button theme="primary" v-if="isClerk" @click="clerkUploadVisible = true">
              <template #icon><t-icon name="file-pdf" /></template>
              代客上传电子保单
            </t-button>
          </t-space>
        </div>

        <div class="stats-grid mb-24">
          <stat-card title="总上传" :value="uploadTotalCount" icon="file" color="primary" />
          <stat-card title="待处理" :value="uploadPendingCount" icon="search" color="warning" />
          <stat-card title="已生效" :value="uploadCompletedCount" icon="check-circle" color="success" />
        </div>

        <data-table
          :data="uploadTableData"
          :columns="uploadColumns"
          :pagination="uploadPagination"
          :loading="uploadLoading"
          row-key="id"
          @page-change="handleUploadPageChange"
        >
          <template #status="{ row }">
            <status-tag :status="row.status" :status-map="uploadStatusMap" />
          </template>
          <template #operation="{ row }">
            <t-space>
              <t-link @click="handleViewUpload(row)">查看</t-link>
              <t-link v-if="isCustomer && row.status === 'draft'" theme="primary" @click="handleExternalSubmitToPlatform(row)">提交平台审核</t-link>
              <t-link v-if="isCustomer && row.status === 'clerk_pending_auth'" theme="primary" @click="handleCustomerAuthorizeExternal(row)">授权</t-link>
              <t-link v-if="isClerk && row.status === 'clerk_auth_authorized'" theme="primary" @click="handlePushToPlatformReview(row)">推送平台审核</t-link>
              <t-link v-if="isInkasso && row.status === 'platform_review'" theme="primary" @click="handleOcrUpload(row)">OCR识别</t-link>
              <t-link v-if="isInkasso && row.status === 'platform_review'" theme="primary" @click="handlePlatformApprove(row)">审核通过</t-link>
              <t-link v-if="isInkasso && row.status === 'returned'" theme="primary" @click="handleOcrUpload(row)">OCR识别</t-link>
              <t-link v-if="isInkasso && row.status === 'returned'" theme="primary" @click="handleResubmit(row)">提交审核</t-link>
              <t-link v-if="isClerk && row.status === 'clerk_review'" theme="primary" @click="handleClerkApproveExternal(row)">审核通过</t-link>
              <t-link v-if="isClerk && row.status === 'clerk_review'" theme="danger" @click="handleClerkRejectExternal(row)">驳回</t-link>
              <t-link v-if="isClerk && (row.status === 'clerk_ocr_failed' || row.status === 'clerk_confirm')" theme="primary" @click="handleClerkApproveFailedOcr(row)">确认生效</t-link>
              <t-link v-if="isClerk && row.status === 'clerk_confirm'" theme="danger" @click="handleClerkRejectExternal(row)">驳回</t-link>
              <t-link v-if="isClerk && row.status === 'clerk_ocr_failed'" theme="danger" @click="handleDeleteExternal(row)">删除</t-link>
            </t-space>
          </template>
        </data-table>
      </t-tab-panel>

      <t-tab-panel value="review" label="保单投保列表">
        <div class="table-header">
          <span class="table-title">投保列表</span>
          <t-space>
            <t-button theme="primary" v-if="isInkasso" @click="ocrDialogVisible = true">
              <template #icon><t-icon name="scan" /></template>
              电子保单数字化（OCR）识别
            </t-button>
          </t-space>
        </div>

        <search-filter
          :status-options="statusOptions"
          @search="handleSearch"
          @reset="handleReset"
        />

        <div class="stats-grid mb-24">
          <stat-card title="已审核" :value="activePolicyCount" icon="check-circle" color="success" />
          <stat-card title="总申请数" :value="store.insuranceApplications.length" icon="file" color="primary" />
          <stat-card title="总投保金额" :value="`$${totalInsuranceAmount.toLocaleString()}`" icon="credit-card" color="danger" />
        </div>

        <data-table
          :data="tableData"
          :columns="columns"
          :pagination="pagination"
          :loading="loading"
          row-key="id"
          @page-change="handlePageChange"
        >
          <template #status="{ row }">
            <status-tag :status="row.status" :status-map="statusMap" />
          </template>
          <template #insuranceAmount="{ row }">
            <span>${{ Number(row.insuranceAmount || 0).toLocaleString() }}</span>
          </template>
          <template #expectedInsurancePeriod="{ row }">
            <span>{{ Array.isArray(row.expectedInsurancePeriod) ? row.expectedInsurancePeriod.join(' ~ ') : row.expectedInsurancePeriod }}</span>
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
              <t-link v-if="isInkasso && row.status === 'pending_review'" theme="primary" @click="handleApprove(row)">申请跟单员确认</t-link>
              <t-link v-if="isClerk && row.status === 'clerk_review'" theme="primary" @click="handleClerkApprove(row)">审核</t-link>
              <t-link v-if="isClerk && row.status === 'approved'" theme="primary" @click="handleSubmitUnderwriting(row)">提交核保</t-link>
              <t-link v-if="isClerk && row.status === 'underwriting'" theme="primary" @click="handleUnderwritingComplete(row)">核保通过</t-link>
              <t-link v-if="isClerk && row.status === 'uw_completed'" theme="primary" @click="handleSyncToPlatform(row)">同步保单</t-link>
              <t-link v-if="isClerk && row.status === 'payment_uploaded'" theme="primary" @click="handleClerkConfirmPayment(row)">确认缴费</t-link>
              <t-link v-if="isInkasso && row.status === 'ocr_pending'" theme="primary" @click="handleApprove(row)">申请跟单员确认</t-link>
              <t-link v-if="isClerk && (row.status === 'ocr_pending' || row.status === 'ocr_clerk_review')" theme="primary" @click="handleClerkApprove(row)">审核</t-link>
              <t-link v-if="isCustomer && row.status === 'ocr_pending'" theme="primary" @click="handleSubmitToPlatform(row)">提交平台审核</t-link>
              <t-link v-if="!isInkasso && !isClerk && row.status === 'rejected'" theme="primary" @click="handleSubmit(row)">重新提交</t-link>
            </t-space>
          </template>
        </data-table>
      </t-tab-panel>

      <t-tab-panel value="policy" label="保单列表">
        <div class="table-header">
          <span class="table-title">保单信息管理</span>
        </div>

        <div class="stats-grid mb-24">
          <stat-card title="有效保单" :value="activePolicyCount" icon="check-circle" color="success" />
          <stat-card title="即将到期" :value="expiringPolicyCount" icon="alarm" color="warning" />
          <stat-card title="总保额" :value="`$${totalCoverage.toLocaleString()}`" icon="wallet" color="primary" />
          <stat-card title="总保费" :value="`$${totalPremium.toLocaleString()}`" icon="credit-card" color="danger" />
        </div>

        <data-table
          :data="policyTableData"
          :columns="policyColumns"
          :pagination="policyPagination"
          :loading="loading"
          row-key="id"
          @page-change="handlePolicyPageChange"
        >
          <template #status="{ row }">
            <status-tag :status="row.status" :status-map="policyStatusMap" />
          </template>
          <template #coverageAmount="{ row }">
            <span>${{ Number(row.coverageAmount || 0).toLocaleString() }}</span>
          </template>
          <template #premium="{ row }">
            <span>${{ Number(row.premium || 0).toLocaleString() }}</span>
          </template>
          <template #operation="{ row }">
            <t-space>
              <t-link @click="handleViewPolicy(row)">查看</t-link>
              <t-link theme="primary" @click="handlePolicyChange(row)">变更</t-link>
              <t-link theme="primary" @click="handleRenewal(row)">续保</t-link>
              <t-link theme="danger" @click="handleSurrender(row)">退保</t-link>
            </t-space>
          </template>
        </data-table>
      </t-tab-panel>


      <t-tab-panel value="renewal" label="保单续保列表">
        <div class="table-header">
          <span class="table-title">续保申请列表</span>
          <span class="table-count">共 {{ renewalApps.length }} 条记录</span>
        </div>
        <data-table :data="renewalTableData" :columns="renewalColumns" :pagination="renewalPagination" :loading="loading" row-key="id" @page-change="handleRenewalPageChange">
          <template #status="{ row }">
            <status-tag :status="row.status" :status-map="renewalStatusMap" />
          </template>
          <template #paymentStatus="{ row }">
            <span :style="{ color: (row.paymentStatus === 'paid' || row.status === 'renew_paid') ? '#00a870' : '#ffb800', fontWeight: 600 }">{{ paymentStatusIcon(row) }}</span>
          </template>
          <template #operation="{ row }">
            <t-space>
              <t-link @click="handleRenewalView(row)">查看</t-link>
              <!-- Inkasso operations -->
              <t-link v-if="isInkasso && row.status === 'renew_inkasso_review' && !row.generatedApplicationForm.length" theme="primary" @click="handleRenewalGenDocs(row)">生成续保资料</t-link>
              <t-link v-if="isInkasso && row.status === 'renew_inkasso_review' && row.generatedApplicationForm.length" theme="primary" @click="handleRenewalPushClerk(row)">推送给跟单员</t-link>
              <t-link v-if="isInkasso && row.status === 'renew_supplement'" theme="primary" @click="handleRenewalPlatformPushSupplement(row)">推送客户补充资料</t-link>
              <t-link v-if="isInkasso && row.status === 'renew_platform_review'" theme="success" @click="handleRenewalPlatformApproveSupplement(row)">审核通过</t-link>
              <t-link v-if="isInkasso && row.status === 'renew_active'" theme="primary" @click="handleRenewalPaymentApplication(row)">推送客户交纳保费申请</t-link>
              <t-link v-if="isInkasso && row.status === 'renew_payment_uploaded'" theme="primary" @click="handleRenewalVerifyVoucher(row)">维护缴费凭证</t-link>
              <!-- Clerk operations -->
              <t-link v-if="isClerk && row.status === 'renew_clerk_review'" theme="success" @click="handleRenewalClerkApprove(row)">审核通过</t-link>
              <t-link v-if="isClerk && row.status === 'renew_clerk_review'" theme="danger" @click="handleRenewalClerkReject(row)">驳回</t-link>
              <t-link v-if="isClerk && row.status === 'renew_insurer_review'" theme="success" @click="handleRenewalInsurerApprove(row)">保险公司批准</t-link>
              <t-link v-if="isClerk && row.status === 'renew_insurer_review'" theme="danger" @click="handleRenewalInsurerReject(row)">保险公司驳回</t-link>
              <t-link v-if="isClerk && row.status === 'renew_insurer_approved'" theme="primary" @click="handleRenewalClerkSync(row)">同步新保单</t-link>
              <t-link v-if="isClerk && row.status === 'renew_insurer_rejected'" theme="primary" @click="handleRenewalInitSupplement(row)">发起补充请求</t-link>
              <t-link v-if="isClerk && row.status === 'renew_clerk_resubmit'" theme="primary" @click="handleRenewalClerkResubmit(row)">提交续保申请</t-link>
              <t-link v-if="isClerk && row.status === 'renew_payment_verified'" theme="primary" @click="handleRenewalSyncPayment(row)">同步缴费凭证</t-link>
              <!-- Customer operations -->
              <t-link v-if="isCustomer && row.status === 'renew_customer_supplement'" theme="primary" @click="handleRenewalCustomerSupplement(row)">补充材料</t-link>
              <t-link v-if="isCustomer && row.status === 'renew_customer_supplemented'" theme="primary" @click="handleRenewalCustomerPushPlatform(row)">推送平台审核</t-link>
              <t-link v-if="isCustomer && row.status === 'renew_pending_payment'" theme="primary" @click="handleRenewalUploadVoucher(row)">上传缴费凭证</t-link>
            </t-space>
          </template>
        </data-table>

        <!-- Renewal Detail Dialog -->
        <t-dialog v-model:visible="renewalDetailVisible" :header="'续保详情 - ' + (renewalDetailRow?.id || '')" width="800px" :footer="false">
          <div v-if="renewalDetailRow" class="detail-body">
            <!-- Basic info -->
            <div class="detail-card">
              <div class="detail-card-title">保单信息</div>
              <div class="detail-grid">
                <div class="detail-row"><span class="detail-label">申请编号</span><span class="detail-value">{{ renewalDetailRow.id }}</span></div>
                <div class="detail-row"><span class="detail-label">保单号</span><span class="detail-value">{{ renewalDetailRow.policyNo }}</span></div>
                <div class="detail-row"><span class="detail-label">保险公司</span><span class="detail-value">{{ renewalDetailRow.insuranceCompany }}</span></div>
                <div class="detail-row"><span class="detail-label">被保险人</span><span class="detail-value">{{ renewalDetailRow.policyholder }}</span></div>
                <div class="detail-row"><span class="detail-label">投保买方</span><span class="detail-value">{{ renewalDetailRow.insured }}</span></div>
                <div class="detail-row"><span class="detail-label">原保险起期</span><span class="detail-value">{{ renewalDetailRow.originalEffectiveDate }}</span></div>
                <div class="detail-row"><span class="detail-label">原保险止期</span><span class="detail-value">{{ renewalDetailRow.originalExpiryDate }}</span></div>
                <div class="detail-row"><span class="detail-label">申请日期</span><span class="detail-value">{{ renewalDetailRow.submitTime }}</span></div>
                <div class="detail-row"><span class="detail-label">状态</span><span class="detail-value"><status-tag :status="renewalDetailRow.status" :status-map="renewalStatusMap" /></span></div>
              </div>
            </div>
            <!-- Generated documents -->
            <div v-if="renewalDetailRow.generatedApplicationForm.length" class="detail-card">
              <div class="detail-card-title">平台生成资料</div>
              <div class="detail-grid">
                <div v-for="(doc, idx) in renewalDetailRow.generatedApplicationForm" :key="'form-'+idx" class="detail-row" style="grid-column:1/-1;">
                  <span class="detail-label">续保申请书</span>
                  <span class="detail-value">{{ doc.name }}（{{ doc.size }}）</span>
                </div>
                <div v-for="(doc, idx) in renewalDetailRow.generatedMaterials" :key="'mat-'+idx" class="detail-row" style="grid-column:1/-1;">
                  <span class="detail-label">附件{{ idx+1 }}</span>
                  <span class="detail-value">{{ doc.name }}（{{ doc.size }}）</span>
                </div>
              </div>
            </div>
            <!-- New policy info -->
            <div v-if="renewalDetailRow.newPolicyNo" class="detail-card">
              <div class="detail-card-title">新保单信息</div>
              <div class="detail-grid">
                <div class="detail-row"><span class="detail-label">新保单号</span><span class="detail-value">{{ renewalDetailRow.newPolicyNo }}</span></div>
                <div class="detail-row"><span class="detail-label">保险起期</span><span class="detail-value">{{ renewalDetailRow.newPolicyStartDate }}</span></div>
                <div class="detail-row"><span class="detail-label">保险止期</span><span class="detail-value">{{ renewalDetailRow.newPolicyEndDate }}</span></div>
                <div class="detail-row"><span class="detail-label">保险金额</span><span class="detail-value">${{ Number(renewalDetailRow.newCoverageAmount || 0).toLocaleString() }}</span></div>
              </div>
            </div>
            <!-- Insurer decision -->
            <div v-if="renewalDetailRow.insurerDecision" class="detail-card">
              <div class="detail-card-title">保险公司核保结果</div>
              <div class="detail-grid">
                <div class="detail-row"><span class="detail-label">决定</span><span class="detail-value" :style="{ color: renewalDetailRow.insurerDecision === 'approved' ? '#00a870' : '#e34d57' }">{{ renewalDetailRow.insurerDecision === 'approved' ? '已通过' : '已驳回' }}</span></div>
                <div class="detail-row"><span class="detail-label">意见</span><span class="detail-value">{{ renewalDetailRow.insurerOpinion }}</span></div>
                <div class="detail-row"><span class="detail-label">核保时间</span><span class="detail-value">{{ renewalDetailRow.insurerReviewTime }}</span></div>
              </div>
            </div>
            <!-- Payment info -->
            <div v-if="['renew_active','renew_pending_payment','renew_payment_uploaded','renew_payment_verified','renew_paid'].includes(renewalDetailRow.status)" class="detail-card">
              <div class="detail-card-title">缴费信息</div>
              <div class="detail-grid">
                <div v-if="renewalDetailRow.paymentApplication" class="detail-row" style="grid-column:1/-1;border-bottom:1px dashed #e0e0e0;padding-bottom:10px;margin-bottom:6px;">
                  <span class="detail-label">保费交纳申请号</span>
                  <span class="detail-value">{{ renewalDetailRow.paymentApplication.applicationNo }}</span>
                </div>
                <div class="detail-row"><span class="detail-label">缴费状态</span><span class="detail-value" :style="{ color: renewalDetailRow.paymentStatus === 'paid' || renewalDetailRow.status === 'renew_paid' ? '#00a870' : '#ffb800', fontWeight: 600 }">{{ paymentStatusIcon(renewalDetailRow) }}</span></div>
                <div class="detail-row"><span class="detail-label">保险费</span><span class="detail-value">${{ Number(renewalDetailRow.newPremium || 0).toLocaleString() }}</span></div>
                <div class="detail-row"><span class="detail-label">平台服务费</span><span class="detail-value">${{ Number(renewalDetailRow.serviceFee || 0).toLocaleString() }}</span></div>
                <div class="detail-row"><span class="detail-label">合计</span><span class="detail-value" style="font-weight:700;color:#0052D9;">${{ Number((renewalDetailRow.newPremium || 0) + (renewalDetailRow.serviceFee || 0)).toLocaleString() }}</span></div>
                <div v-if="renewalDetailRow.paymentVoucher.length" class="detail-row" style="grid-column:1/-1;">
                  <span class="detail-label">缴费凭证</span>
                  <span class="detail-value">{{ renewalDetailRow.paymentVoucher.map(f => f.name).join('、') }}</span>
                </div>
                <div v-if="renewalDetailRow.paymentConfirmTime" class="detail-row" style="grid-column:1/-1;">
                  <span class="detail-label">缴费时间</span>
                  <span class="detail-value">{{ renewalDetailRow.paymentConfirmTime }}</span>
                </div>
              </div>
            </div>
            <!-- Reject info -->
            <div v-if="renewalDetailRow.rejectReason" class="detail-card">
              <div class="detail-card-title">驳回原因</div>
              <div class="detail-grid">
                <div class="detail-row"><span class="detail-label">驳回原因</span><span class="detail-value" style="color:#e34d57;">{{ renewalDetailRow.rejectReason }}</span></div>
              </div>
            </div>
            <!-- Supplement request -->
            <div v-if="renewalDetailRow.supplementRequest" class="detail-card">
              <div class="detail-card-title">补充资料请求</div>
              <div class="detail-grid">
                <div class="detail-row"><span class="detail-label">补充要求</span><span class="detail-value" style="color:#0052D9;">{{ renewalDetailRow.supplementRequest }}</span></div>
              </div>
            </div>
            <!-- Supplement history -->
            <div v-if="renewalDetailRow.supplementData" class="detail-card">
              <div class="detail-card-title">客户补充资料</div>
              <div class="detail-grid">
                <div class="detail-row" style="grid-column:1/-1;">
                  <span class="detail-label">补充内容</span>
                  <span class="detail-value">{{ typeof renewalDetailRow.supplementData === 'object' ? renewalDetailRow.supplementData.content : renewalDetailRow.supplementData }}</span>
                </div>
                <div v-if="renewalDetailRow.supplementFiles?.length || (typeof renewalDetailRow.supplementData === 'object' && renewalDetailRow.supplementData?.files?.length)" class="detail-row" style="grid-column:1/-1;">
                  <span class="detail-label">补充材料</span>
                  <span class="detail-value">{{ (renewalDetailRow.supplementFiles || renewalDetailRow.supplementData?.files || []).map(f => f.name).join('、') }}</span>
                </div>
                <div v-if="renewalDetailRow.supplementTime" class="detail-row" style="grid-column:1/-1;">
                  <span class="detail-label">补充时间</span>
                  <span class="detail-value">{{ renewalDetailRow.supplementTime }}</span>
                </div>
              </div>
            </div>
          </div>
        </t-dialog>

        <!-- Supplement Dialog (Customer) -->
        <t-dialog v-model:visible="renewalSupplementVisible" header="补充资料" width="550px">
          <div class="insurer-content">
            <div v-if="renewalSupplementRow?.supplementRequest" class="confirm-tip" style="margin-top:0;">
              <t-icon name="info-circle-filled" size="16px" class="tip-icon" />
              <span class="tip-text">补充要求：{{ renewalSupplementRow.supplementRequest }}</span>
            </div>
            <div class="reject-form" style="margin-top:16px;">
              <label class="reject-label">补充说明 <span style="color:#dc2626;">*</span></label>
              <t-textarea v-model="renewalSupplementContent" placeholder="请描述补充的内容" :rows="3" maxlength="500" />
            </div>
            <div class="reject-form" style="margin-top:12px;">
              <label class="reject-label">补充材料</label>
              <t-upload v-model="renewalSupplementFiles" theme="file" :auto-upload="false" accept="application/pdf,image/jpeg,image/png" placeholder="选择补充文件" />
            </div>
          </div>
          <template #footer>
            <t-space>
              <t-button variant="outline" @click="renewalSupplementVisible = false">取消</t-button>
              <t-button theme="primary" :disabled="!renewalSupplementContent.trim()" @click="confirmRenewalSupplement">提交补充资料</t-button>
            </t-space>
          </template>
        </t-dialog>

        <!-- Upload Voucher Dialog -->
        <t-dialog v-model:visible="renewalVoucherVisible" header="上传缴费凭证" width="550px">
          <div class="insurer-content">
            <div class="confirm-tip" style="margin-top:0;">
              <t-icon name="info-circle-filled" size="16px" class="tip-icon" />
              <span class="tip-text">请上传线下缴费的电子凭证。</span>
            </div>
            <div class="reject-form" style="margin-top:16px;">
              <t-upload v-model="renewalVoucherFiles" theme="file" :auto-upload="false" accept="image/jpeg,image/png,application/pdf" placeholder="选择缴费凭证文件" />
            </div>
          </div>
          <template #footer>
            <t-space>
              <t-button variant="outline" @click="renewalVoucherVisible = false">取消</t-button>
              <t-button theme="primary" :disabled="!renewalVoucherFiles.length" @click="confirmRenewalVoucher">确认上传</t-button>
            </t-space>
          </template>
        </t-dialog>

        <!-- Insurer Approve Dialog -->
        <t-dialog v-model:visible="renewalInsurerApproveVisible" header="保险公司核保批准" width="500px">
          <div class="insurer-content">
            <div class="confirm-tip" style="margin-top:0;">
              <t-icon name="info-circle-filled" size="16px" class="tip-icon" />
              <span class="tip-text">确认批准该续保申请？批准后将出具新保单。</span>
            </div>
            <div class="reject-form" style="margin-top:16px;">
              <label class="reject-label">核保意见</label>
              <t-textarea v-model="renewalInsurerOpinion" placeholder="请输入核保意见（可选）" :rows="3" />
            </div>
            <div class="reject-form" style="margin-top:12px;">
              <label class="reject-label">新保单号</label>
              <t-input v-model="renewalNewPolicyNo" placeholder="系统自动生成或手动输入" />
            </div>
          </div>
          <template #footer>
            <t-space>
              <t-button variant="outline" @click="renewalInsurerApproveVisible = false">取消</t-button>
              <t-button theme="success" @click="confirmRenewalInsurerApprove">确认批准</t-button>
            </t-space>
          </template>
        </t-dialog>

        <!-- Insurer Reject Dialog -->
        <t-dialog v-model:visible="renewalInsurerRejectVisible" header="保险公司核保驳回" width="500px">
          <div class="insurer-content">
            <div class="confirm-tip" style="margin-top:0;">
              <t-icon name="warning-circle" size="16px" class="tip-icon danger" />
              <span class="tip-text">驳回续保申请，将通知客户转入购买保险入口。</span>
            </div>
            <div class="reject-form" style="margin-top:16px;">
              <label class="reject-label">驳回原因 <span style="color:#dc2626;">*</span></label>
              <t-textarea v-model="renewalInsurerRejectOpinion" placeholder="请输入驳回原因" :rows="4" maxlength="500" show-limit-number />
            </div>
          </div>
          <template #footer>
            <t-space>
              <t-button variant="outline" @click="renewalInsurerRejectVisible = false">取消</t-button>
              <t-button theme="danger" @click="confirmRenewalInsurerReject">确认驳回</t-button>
            </t-space>
          </template>
        </t-dialog>

      </t-tab-panel>

      <t-tab-panel value="surrender" label="保单退保列表">
        <div class="table-header">
          <span class="table-title">退保申请列表</span>
        </div>
        <div class="stats-grid mb-24">
          <stat-card title="总申请" :value="srTotalCount" icon="file" color="primary" />
          <stat-card title="待处理" :value="srPendingCount" icon="search" color="warning" />
          <stat-card title="已完成" :value="srCompletedCount" icon="check-circle" color="success" />
        </div>
        <data-table :data="surrenderTableData" :columns="surrenderColumns" :pagination="surrenderPagination" :loading="loading" row-key="id" @page-change="handleSurrenderPageChange">
          <template #status="{ row }">
            <status-tag :status="row.status" :status-map="srStatusMap" />
          </template>
          <template #coverageAmount="{ row }">
            <span>${{ Number(row.coverageAmount || 0).toLocaleString() }}</span>
          </template>
          <template #operation="{ row }">
            <t-space>
              <t-link @click="handleSurrenderView(row)">查看</t-link>

              <!-- Customer operations -->
              <t-link v-if="isCustomer && row.status === 'sr_platform_synced'" theme="success" @click="handleSurrenderConfirmRefund(row)">确认退款</t-link>
              <t-link v-if="isCustomer && row.status === 'sr_customer_supplement'" theme="primary" @click="handleSurrenderCustomerSupplement(row)">补充材料</t-link>
              <t-link v-if="isCustomer && row.status === 'sr_customer_supplement'" theme="primary" @click="handleSurrenderCustomerPush(row)">推送平台审核</t-link>

              <!-- Inkasso operations -->
              <t-link v-if="isInkasso && row.status === 'sr_platform_review' && !row.generatedSurrenderForm?.length" theme="primary" @click="handleSurrenderGenDocs(row, 'form')">生成退保申请表</t-link>
              <t-link v-if="isInkasso && row.status === 'sr_platform_review' && !row.generatedSurrenderChecklist?.length" theme="primary" @click="handleSurrenderGenDocs(row, 'checklist')">生成材料清单</t-link>
              <t-link v-if="isInkasso && row.status === 'sr_platform_review' && row.generatedSurrenderForm?.length" theme="danger" @click="handleSurrenderDelDocs(row, 'form')">删除退保申请表</t-link>
              <t-link v-if="isInkasso && row.status === 'sr_platform_review' && row.generatedSurrenderChecklist?.length" theme="danger" @click="handleSurrenderDelDocs(row, 'checklist')">删除材料清单</t-link>
              <t-link v-if="isInkasso && row.status === 'sr_platform_review' && row.generatedSurrenderForm?.length > 0 && !row.rejectReason" theme="primary" @click="handleSurrenderPushClerk(row)">推送给跟单员</t-link>
              <t-link v-if="isInkasso && row.status === 'sr_platform_review' && row.rejectReason && !row.supplementHistory?.some(s => s.type === 'submission')" theme="primary" @click="handleSurrenderPushCustomerSupplement(row)">推送客户补充</t-link>
              <t-link v-if="isInkasso && row.status === 'sr_platform_review' && row.rejectReason && row.supplementHistory?.some(s => s.type === 'submission')" theme="primary" @click="handleSurrenderPushClerkAfterSupplement(row)">推送跟单员确认</t-link>
              <t-link v-if="isInkasso && row.status === 'sr_supplement'" theme="primary" @click="handleSurrenderPlatformSupplement(row)">补充材料</t-link>

              <!-- Clerk operations -->
              <t-link v-if="isClerk && row.status === 'sr_clerk_review'" theme="success" @click="handleSurrenderClerkApprove(row)">审核通过</t-link>
              <t-link v-if="isClerk && row.status === 'sr_clerk_review'" theme="danger" @click="handleSurrenderClerkReject(row)">驳回</t-link>
              <t-link v-if="isClerk && row.status === 'sr_insurer_review'" theme="success" @click="handleSurrenderInsurerApprove(row)">保险公司批准</t-link>
              <t-link v-if="isClerk && row.status === 'sr_insurer_review'" theme="danger" @click="handleSurrenderInsurerReject(row)">驳回</t-link>
              <t-link v-if="isClerk && row.status === 'sr_insurer_approved'" theme="primary" @click="handleSurrenderInsurerPay(row)">发起退款</t-link>
              <t-link v-if="isClerk && row.status === 'sr_payment_initiated'" theme="primary" @click="handleSurrenderSyncPlatform(row)">同步平台</t-link>
              <t-link v-if="isClerk && row.status === 'sr_insurer_rejected'" theme="primary" @click="handleSurrenderInitSupplement(row)">发起补充请求</t-link>
              <t-link v-if="isClerk && row.status === 'sr_insurer_rejected'" theme="danger" @click="handleSurrenderRejectTerminate(row)">退保终止</t-link>
            </t-space>
          </template>
        </data-table>
      </t-tab-panel>

    </t-tabs>

    <!-- 投保确认详情弹窗 -->
    <t-dialog v-model:visible="detailVisible" header="投保方案审核" width="760px" :footer="false">
      <div v-if="currentRow" class="insurance-info-modal">
        <!-- 流程状态 - 仅审核模式展示 -->
        <div v-if="detailMode === 'clerk_approve' || detailMode === 'view'" class="clerk-flow-section">
          <div class="modal-section-title">📋 投保流程状态</div>
          <div class="clerk-flow-progress">
            <div class="clerk-flow-steps">
              <template v-for="(step, index) in clerkFlowStepOptions" :key="step.value">
                <div class="clerk-flow-step-col">
                  <div
                    class="clerk-flow-step-dot"
                    :class="{
                      completed: index + 1 < clerkCurrentStep || clerkTaskCompleted,
                      active: index + 1 === clerkCurrentStep && !clerkTaskCompleted
                    }"
                  >
                    <span v-if="index + 1 < clerkCurrentStep || clerkTaskCompleted" class="clerk-flow-step-check">✓</span>
                    <span v-else class="clerk-flow-step-num">{{ index + 1 }}</span>
                  </div>
                  <div
                    class="clerk-flow-step-label"
                    :class="{
                      active: index + 1 === clerkCurrentStep && !clerkTaskCompleted,
                      completed: index + 1 < clerkCurrentStep || clerkTaskCompleted
                    }"
                  >
                    {{ step.label }}
                  </div>
                  <div class="clerk-flow-step-status">
                    <t-tag v-if="index + 1 === clerkCurrentStep" theme="primary" variant="light" size="small">进行中</t-tag>
                    <t-tag v-else theme="default" variant="light" size="small">待处理</t-tag>
                  </div>
                </div>
                <div v-if="index < clerkFlowStepOptions.length - 1" class="clerk-flow-arrow" :class="{ completed: index + 1 < clerkCurrentStep || clerkTaskCompleted }">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </template>
            </div>
          </div>
          <t-divider />
        </div>
        <!-- OCR来源保单 - 跟单员审核编辑模式 -->
        <div v-if="currentRow?.ocrSource && detailMode === 'clerk_approve'">
          <div class="modal-section-title">📄 电子保单OCR识别信息 <span class="edit-badge">可编辑</span></div>
          <div class="edit-form-grid mb-16">
            <div class="edit-form-row">
              <span class="edit-form-label">保单号</span>
              <t-input v-model="ocrEditForm.ocrPolicyNo" placeholder="请输入保单号" />
            </div>
            <div class="edit-form-row">
              <span class="edit-form-label">保险公司</span>
              <t-input v-model="ocrEditForm.ocrInsuranceCompany" placeholder="请输入保险公司名称" />
            </div>
            <div class="edit-form-row">
              <span class="edit-form-label">被保险人名称</span>
              <t-input v-model="ocrEditForm.ocrPolicyholder" placeholder="企业名称(不可修改)" disabled />
            </div>
            <div class="edit-form-row">
              <span class="edit-form-label">保险人名称</span>
              <t-input v-model="ocrEditForm.ocrInsurerName" placeholder="请输入保险人名称" />
            </div>
            <div class="edit-form-row">
              <span class="edit-form-label">受益人名称</span>
              <t-input v-model="ocrEditForm.ocrBeneficiary" placeholder="请输入受益人名称" />
            </div>
            <div class="edit-form-row">
              <span class="edit-form-label">保险起期</span>
              <t-date-picker v-model="ocrEditForm.effectiveDate" placeholder="请选择保险起期" />
            </div>
            <div class="edit-form-row">
              <span class="edit-form-label">保险止期</span>
              <t-date-picker v-model="ocrEditForm.expiryDate" placeholder="请选择保险止期" />
            </div>
            <div class="edit-form-row">
              <span class="edit-form-label">投保金额</span>
              <t-input-adornment prepend="USD">
                <t-input-number v-model="ocrEditForm.insuranceAmount" placeholder="请输入投保金额" :min="0" :step="1000" />
              </t-input-adornment>
            </div>
            <div class="edit-form-row">
              <span class="edit-form-label">最高赔偿限额</span>
              <t-input-adornment prepend="USD">
                <t-input-number v-model="ocrEditForm.ocrMaxCompensation" placeholder="请输入最高赔偿限额" :min="0" :step="1000" />
              </t-input-adornment>
            </div>
            <div class="edit-form-row">
              <span class="edit-form-label">买方名称</span>
              <t-input v-model="ocrEditForm.buyerName" placeholder="请输入买方名称" />
            </div>
            <div class="edit-form-row">
              <span class="edit-form-label">买方信用限额</span>
              <t-input-adornment prepend="USD">
                <t-input-number v-model="ocrEditForm.ocrBuyerCreditLimit" placeholder="请输入买方信用限额" :min="0" :step="1000" />
              </t-input-adornment>
            </div>
            <div class="edit-form-row">
              <span class="edit-form-label">保费</span>
              <t-input-adornment prepend="USD">
                <t-input-number v-model="ocrEditForm.ocrPremium" placeholder="请输入保费金额" :min="0" :step="100" />
              </t-input-adornment>
            </div>
            <div class="edit-form-row">
              <span class="edit-form-label">费率</span>
              <t-input-adornment append="%">
                <t-input-number v-model="ocrEditForm.ocrPremiumRate" placeholder="请输入费率百分比" :min="0" :max="100" :step="0.01" />
              </t-input-adornment>
            </div>
            <div class="edit-form-row">
              <span class="edit-form-label">业务类型</span>
              <t-select v-model="ocrEditForm.ocrBusinessType" placeholder="请选择业务类型" :clearable="false">
                <t-option value="goods" label="货物贸易" />
                <t-option value="service" label="服务贸易" />
              </t-select>
            </div>
          </div>
        </div>
        <!-- OCR来源保单 - 查看模式 -->
        <div v-else-if="currentRow?.ocrSource">
          <div class="modal-section-title">📄 电子保单OCR识别信息</div>
          <div class="info-grid mb-16">
            <div class="info-row">
              <span class="info-label">保单号</span>
              <span class="info-value">{{ currentRow.ocrPolicyNo || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">保险公司</span>
              <span class="info-value">{{ currentRow.ocrInsuranceCompany || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">被保险人名称</span>
              <span class="info-value">{{ currentRow.companyName || currentRow.ocrPolicyholder || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">保险人名称</span>
              <span class="info-value">{{ currentRow.ocrInsurerName || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">受益人名称</span>
              <span class="info-value">{{ currentRow.ocrBeneficiary || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">保险起期</span>
              <span class="info-value">{{ currentRow.expectedInsurancePeriod?.[0] || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">保险止期</span>
              <span class="info-value">{{ currentRow.expectedInsurancePeriod?.[1] || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">投保金额</span>
              <span class="info-value">{{ (currentRow.insuranceCurrency || 'USD') + ' ' + Number(currentRow.insuranceAmount || 0).toLocaleString() }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">最高赔偿限额</span>
              <span class="info-value">{{ (currentRow.insuranceCurrency || 'USD') + ' ' + Number(currentRow.ocrMaxCompensation || currentRow.insuranceAmount || 0).toLocaleString() }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">买方名称</span>
              <span class="info-value">{{ currentRow.buyerName || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">买方信用限额</span>
              <span class="info-value">{{ (currentRow.insuranceCurrency || 'USD') + ' ' + Number(currentRow.ocrBuyerCreditLimit || 0).toLocaleString() }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">保费</span>
              <span class="info-value">{{ (currentRow.insuranceCurrency || 'USD') + ' ' + Number(currentRow.ocrPremium || 0).toLocaleString() }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">费率</span>
              <span class="info-value">{{ currentRow.ocrPremiumRate ? (Number(currentRow.ocrPremiumRate) * 100).toFixed(2) + '%' : '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">业务类型</span>
              <span class="info-value">{{ currentRow.ocrBusinessType === 'goods' ? '货物贸易' : currentRow.ocrBusinessType === 'service' ? '服务贸易' : '-' }}</span>
            </div>
          </div>
        </div>
        <!-- 非OCR来源 -->
        <template v-if="!currentRow?.ocrSource">
        <!-- Section 1: Base Information -->
        <div class="modal-section-title">📄 基础投保建议数据与出运申报</div>
        <div class="info-grid mb-16">
          <div class="info-row">
            <span class="info-label">投保建议编号</span>
            <span class="info-value">{{ currentRow.id || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">投保企业</span>
            <span class="info-value">{{ currentRow.companyName || currentRow.enterpriseName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">出险买方</span>
            <span class="info-value">{{ currentRow.buyerName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">买方国别</span>
            <span class="info-value">{{ currentRow.buyerCountry || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">申请限额额度</span>
            <span class="info-value">{{ currentRow.insuranceCurrency || 'USD' }}{{ Number(currentRow.insuranceAmount || 0).toLocaleString() }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">预估账期与期限</span>
            <span class="info-value">OA {{ currentRow.mostUsedPaymentTerm || 60 }}天 | 12个月</span>
          </div>
        </div>

        <!-- Section 2: Digital recommendation details -->
        <div class="digital-recommend-panel">
          <div class="recommend-header">
            <div class="recommend-title">
              <t-icon name="chart-bubble" />
              <span>💡 贸易信用数字化预审推荐方案</span>
            </div>
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
                    ${{ Number((currentRow.insuranceAmount || 0) * 0.0015).toLocaleString() }} USD
                  </td>
                  <td class="recommend-val">
                    <span>${{ Number((currentRow.insuranceAmount || 0) * 0.0011).toLocaleString() }} USD</span>
                    <span class="highlight-icon">立省 ${{ Number((currentRow.insuranceAmount || 0) * 0.0004).toLocaleString() }} 🌟</span>
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

        <!-- Section 3: Generated Documents (hidden for OCR-sourced policies) -->
        <div v-if="!currentRow?.ocrSource" class="modal-section-title">📎 投保申请书和信息采集表预览</div>
        <div v-if="!currentRow?.ocrSource" class="attachment-section mb-16">
          <div class="attachment-row">
            <div class="attachment-info" style="display: flex; align-items: center; gap: 8px;">
              <t-icon name="file-excel" style="color: #2ca471; font-size: 18px;" />
              <span class="attachment-label">投保申请书</span>
            </div>
            <t-button variant="outline" size="small" @click="showPreview('policy')">
              <template #icon><t-icon name="browse" /></template>
              预览
            </t-button>
          </div>
          <div class="attachment-row">
            <div class="attachment-info" style="display: flex; align-items: center; gap: 8px;">
              <t-icon name="file-excel" style="color: #2ca471; font-size: 18px;" />
              <span class="attachment-label">买方信息采集表</span>
            </div>
            <t-button variant="outline" size="small" @click="showPreview('buyer')">
              <template #icon><t-icon name="browse" /></template>
              预览
            </t-button>
          </div>
        </div>
        </template>

        <!-- Reject reason (resubmit mode) -->
        <div v-if="detailMode === 'resubmit' && currentRow?.rejectReason" class="reject-reason-box">
          <t-icon name="info-circle-filled" size="20px" style="color: #dc2626; flex-shrink: 0; margin-top: 1px;" />
          <div>
            <div style="font-weight: 600; color: #991b1b; margin-bottom: 6px; font-size: 14px;">
              {{ currentRow?.companyName }}，您好！
            </div>
            <div style="color: #b91c1c; font-size: 13px; line-height: 1.7;">
              您的投保申请已被驳回，请您重新补充相关投保资料后再次提交。
              <div style="margin-top: 6px; padding: 8px 10px; background: #fef2f2; border-radius: 4px; font-size: 12px; color: #991b1b;">
                <span style="font-weight: 600;">驳回说明：</span>{{ currentRow?.rejectReason }}
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <t-button v-if="detailMode === 'apply'" theme="primary" @click="handleDetailApply">申请跟单员确认</t-button>
          <t-button v-if="detailMode === 'clerk_approve'" theme="success" @click="handleDetailApply">审核通过</t-button>
          <t-button v-if="detailMode === 'clerk_approve'" theme="danger" @click="handleClerkRejectFromDialog">审核驳回</t-button>
          <t-button v-if="detailMode === 'resubmit'" theme="primary" @click="handleDetailApply">重新提交</t-button>
          <t-button v-if="detailMode === 'underwriting'" theme="primary" @click="handleDetailApply">提交核保</t-button>
        </div>
      </div>
      <div v-else class="no-data">暂无数据</div>
    </t-dialog>

    <!-- 保单详情弹窗 -->
    <t-dialog v-model:visible="policyDetailVisible" header="保单详情" width="820px" :footer="false" destroy-on-close>
      <div v-if="currentPolicy" class="pd-wrapper">
        <!-- 保单信息 -->
        <div class="pd-card">
          <div class="pd-card-header">📋 保单信息</div>
          <div class="pd-card-body">
            <div class="pd-grid">
              <div class="pd-field"><span class="pd-label">保单号</span><span class="pd-value">{{ currentPolicy.policyNo || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">保险公司</span><span class="pd-value">{{ currentPolicy.insuranceCompany || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">被保险人</span><span class="pd-value">{{ currentPolicy.policyholder || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">投保买方</span><span class="pd-value">{{ currentPolicy.insured || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">保险金额</span><span class="pd-value pd-number">${{ Number(currentPolicy.coverageAmount || 0).toLocaleString() }}</span></div>
              <div class="pd-field"><span class="pd-label">保费金额</span><span class="pd-value pd-number">${{ Number(currentPolicy.premium || 0).toLocaleString() }}</span></div>
              <div class="pd-field"><span class="pd-label">生效日期</span><span class="pd-value">{{ currentPolicy.effectiveDate || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">到期日期</span><span class="pd-value">{{ currentPolicy.expiryDate || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">已用额度</span><span class="pd-value pd-number">${{ Number(currentPolicy.usedQuota || 0).toLocaleString() }}</span></div>
              <div class="pd-field"><span class="pd-label">剩余额度</span><span class="pd-value pd-number">${{ Number(currentPolicy.remainingQuota || 0).toLocaleString() }}</span></div>
              <div class="pd-field"><span class="pd-label">币种</span><span class="pd-value">{{ currentPolicy.currency || 'USD' }}</span></div>
              <div class="pd-field"><span class="pd-label">保单状态</span><span class="pd-value">{{ policyStatusMap[currentPolicy.status] || currentPolicy.status || '-' }}</span></div>
            </div>
          </div>
        </div>

        <!-- 投保信息 -->
        <div v-if="currentPolicy._app" class="pd-card">
          <div class="pd-card-header">📄 投保信息</div>
          <div class="pd-card-body">
            <div class="pd-grid">
              <div class="pd-field"><span class="pd-label">投保编号</span><span class="pd-value">{{ currentPolicy._app.id || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">企业名称</span><span class="pd-value">{{ currentPolicy._app.companyName || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">统一社会信用代码</span><span class="pd-value">{{ currentPolicy._app.unifiedSocialCreditCode || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">法定代表人</span><span class="pd-value">{{ currentPolicy._app.legalRepresentative || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">联系人</span><span class="pd-value">{{ currentPolicy._app.contactName || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">联系电话</span><span class="pd-value">{{ currentPolicy._app.contactPhone || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">买方名称</span><span class="pd-value">{{ currentPolicy._app.buyerName || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">买方国别</span><span class="pd-value">{{ currentPolicy._app.buyerCountry || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">投保类型</span><span class="pd-value">{{ currentPolicy._app.insuranceType || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">投保金额</span><span class="pd-value pd-number">${{ Number(currentPolicy._app.insuranceAmount || 0).toLocaleString() }}</span></div>
              <div class="pd-field"><span class="pd-label">投保期限</span><span class="pd-value">{{ Array.isArray(currentPolicy._app.expectedInsurancePeriod) ? currentPolicy._app.expectedInsurancePeriod.join(' ~ ') : (currentPolicy._app.expectedInsurancePeriod || '-') }}</span></div>
              <div class="pd-field"><span class="pd-label">申请日期</span><span class="pd-value">{{ currentPolicy._app.createTime || '-' }}</span></div>
            </div>
          </div>
        </div>

        <!-- 核保信息 -->
        <div v-if="currentPolicy._app" class="pd-card">
          <div class="pd-card-header">✅ 核保信息</div>
          <div class="pd-card-body">
            <div class="pd-grid">
              <div class="pd-field"><span class="pd-label">核保结果</span><span class="pd-value">{{ currentPolicy._app.uwDecision === 'approved' ? '核保通过' : (currentPolicy._app.uwDecision || '-') }}</span></div>
              <div class="pd-field"><span class="pd-label">核保意见</span><span class="pd-value">{{ currentPolicy._app.uwOpinion || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">核保完成时间</span><span class="pd-value">{{ currentPolicy._app.uwCompleteTime || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">同步平台时间</span><span class="pd-value">{{ currentPolicy._app.syncTime || '-' }}</span></div>
            </div>
          </div>
        </div>

        <!-- 缴费信息 -->
        <div v-if="currentPolicy.premiumPaid || currentPolicy._app?.premiumConfirmed" class="pd-card">
          <div class="pd-card-header">💰 缴费信息</div>
          <div class="pd-card-body">
            <div class="pd-grid">
              <div class="pd-field"><span class="pd-label">缴费状态</span><span class="pd-value">{{ currentPolicy.premiumPaid ? '已缴费' : (currentPolicy._app?.premiumConfirmed ? '保费已确认' : '-') }}</span></div>
              <div class="pd-field"><span class="pd-label">缴费时间</span><span class="pd-value">{{ currentPolicy.premiumPaidTime || currentPolicy._app?.premiumConfirmTime || '-' }}</span></div>
            </div>
          </div>
        </div>

        <!-- 电子保单信息 -->
        <div v-if="currentPolicyElectronic" class="pd-card">
          <div class="pd-card-header">📎 电子保单</div>
          <div class="pd-card-body">
            <div class="pd-grid">
              <div class="pd-field"><span class="pd-label">文件名</span><span class="pd-value">{{ currentPolicyElectronic.originalFileName || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">上传人</span><span class="pd-value">{{ currentPolicyElectronic.uploadUser || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">上传角色</span><span class="pd-value">{{ currentPolicyElectronic.uploaderRole === 'clerk' ? '跟单员代传' : '客户上传' }}</span></div>
              <div class="pd-field"><span class="pd-label">上传时间</span><span class="pd-value">{{ currentPolicyElectronic.createTime || '-' }}</span></div>
              <div class="pd-field"><span class="pd-label">OCR状态</span><span class="pd-value">{{ uploadStatusMap[currentPolicyElectronic.status] || currentPolicyElectronic.status || '-' }}</span></div>
            </div>
          </div>
        </div>

      </div>
    </t-dialog>

    <!-- 导出弹窗 -->
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
            <div class="filter-item" v-if="searchParams.status">
              <span class="filter-label">状态：</span>
              <span class="filter-value">{{ statusMap[searchParams.status] || searchParams.status }}</span>
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
                  <th>投保金额</th>
                  <th>状态</th>
                  <th>申请日期</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in exportData.slice(0, 10)" :key="row.id">
                  <td>{{ row.id }}</td>
                  <td>{{ row.companyName }}</td>
                  <td>{{ row.buyerName }}</td>
                  <td>{{ row.buyerCountry }}</td>
                  <td>{{ row.insuranceType }}</td>
                  <td>${{ Number(row.insuranceAmount || 0).toLocaleString() }}</td>
                  <td>{{ statusMap[row.status] || row.status }}</td>
                  <td>{{ row.createTime }}</td>
                </tr>
                <tr v-if="exportData.length > 10">
                  <td colspan="8" class="more-data">... 还有 {{ exportData.length - 10 }} 条数据</td>
                </tr>
                <tr v-if="exportData.length === 0">
                  <td colspan="8" class="no-data">暂无数据</td>
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

    <!-- 跟单员驳回弹窗 -->
    <t-dialog v-model:visible="clerkRejectVisible" header="驳回投保申请" width="500px">
      <div class="reject-content">
        <div class="confirm-tip" style="margin-top: 0;">
          <t-icon name="warning-circle" size="16px" class="tip-icon danger" />
          <span class="tip-text">确认驳回该投保申请？驳回后申请将退回至长安银科角色重新处理。</span>
        </div>
        <div class="reject-form" style="margin-top: 16px;">
          <label class="reject-label">驳回原因 <span style="color: #dc2626;">*</span></label>
          <t-textarea
            v-model="clerkRejectReason"
            placeholder="请输入驳回原因"
            :rows="4"
            maxlength="500"
            show-limit-number
          />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="clerkRejectVisible = false">取消</t-button>
          <t-button theme="danger" @click="handleClerkRejectConfirm">确认驳回</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- 核保通过弹窗 -->
    <t-dialog v-model:visible="uwCompleteVisible" header="核保通过" width="600px" :footer="false" destroy-on-close>
      <div v-if="uwCompleteRow" class="uw-modal">
        <div class="modal-section-title">📋 核保决定</div>
        <div class="uw-form">
          <div class="uw-row">
            <span class="uw-label">核保决定 <span style="color: #dc2626;">*</span></span>
            <t-select v-model="uwForm.decision" placeholder="请选择核保决定">
              <t-option value="approved" label="通过" />
              <t-option value="conditional" label="有条件通过" />
            </t-select>
          </div>
          <div class="uw-row">
            <span class="uw-label">保单号 <span style="color: #dc2626;">*</span></span>
            <t-input v-model="uwForm.policyNo" placeholder="请输入保险公司出具的保单号" />
          </div>
          <div class="uw-row">
            <span class="uw-label">保险公司</span>
            <t-input v-model="uwForm.insuranceCompany" placeholder="请输入保险公司名称" />
          </div>
          <div class="uw-row">
            <span class="uw-label">保额</span>
            <t-input-adornment prepend="USD">
              <t-input-number v-model="uwForm.coverageAmount" placeholder="请输入保额" :min="0" :step="1000" />
            </t-input-adornment>
          </div>
          <div class="uw-row">
            <span class="uw-label">保费</span>
            <t-input-adornment prepend="USD">
              <t-input-number v-model="uwForm.premium" placeholder="请输入保费金额" :min="0" :step="100" />
            </t-input-adornment>
          </div>
          <div class="uw-row">
            <span class="uw-label">核保意见</span>
            <t-textarea v-model="uwForm.opinion" placeholder="请输入核保意见" :rows="3" />
          </div>
        </div>
        <!-- 附件文件 -->
        <div class="uw-attachments">
          <div class="modal-section-title">📎 附加文件</div>
          <div class="uw-attach-row">
            <span class="uw-label">保单明细表</span>
            <t-upload v-model="uwForm.policyDetailFile" theme="file" :multiple="false" :auto-upload="false" accept=".xlsx,.xls,.pdf" placeholder="请上传保单明细表" />
          </div>
          <div class="uw-attach-row">
            <span class="uw-label">费率表</span>
            <t-upload v-model="uwForm.rateFile" theme="file" :multiple="false" :auto-upload="false" accept=".xlsx,.xls,.pdf" placeholder="请上传费率表" />
          </div>
          <div class="uw-attach-row">
            <span class="uw-label">国家（地区）分类表</span>
            <t-upload v-model="uwForm.countryCategoryFile" theme="file" :multiple="false" :auto-upload="false" accept=".xlsx,.xls,.pdf" placeholder="请上传国家（地区）分类表" />
          </div>
        </div>
        <div class="modal-footer">
          <t-button variant="outline" @click="uwCompleteVisible = false">取消</t-button>
          <t-button theme="primary" @click="handleUwConfirm">确认核保</t-button>
        </div>
      </div>
      <div v-else class="no-data">暂无数据</div>
    </t-dialog>

    <!-- 附件预览弹窗 -->
    <t-dialog v-model:visible="previewVisible" :header="previewTitle" width="900px" :destroy-on-close="true" :draggable="true" top="32px">
      <div class="preview-wrapper" ref="previewWrapperRef" @wheel="handlePreviewWheel" v-html="previewHtml"></div>
      <template #footer>
        <t-space>
          <t-button theme="primary" @click="previewDownload">下载Excel</t-button>
          <t-button variant="outline" @click="previewVisible = false">关闭</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- OCR弹窗 -->
    <policy-ocr-dialog v-model:visible="ocrDialogVisible" :external-policy-id="ocrExternalId" />

    <!-- 外部保单上传弹窗 -->
    <external-policy-upload-dialog v-model:visible="externalUploadVisible" />

    <!-- 保单列表上传电子保单弹窗 -->
    <external-policy-upload-dialog
      v-model:visible="policyUploadVisible"
      :policy-no="uploadTargetPolicyNo"
      :upload-company-name="uploadTargetCompanyName"
      :upload-user-name="uploadTargetUserName"
      :uploader-role="uploadTargetRole"
      @upload-success="handlePolicyUploadSuccess"
    />

    <!-- 跟单员代传电子保单弹窗 -->
    <clerk-policy-upload-dialog
      v-model:visible="clerkUploadVisible"
      @upload-success="handleClerkPolicyUploadSuccess"
    />

    <!-- 外部保单详情弹窗 -->
    <t-dialog v-model:visible="externalDetailVisible" :header="'外部保单详情 - ' + (externalDetailRow?.policyNo || externalDetailRow?.id || '')" width="780px" :footer="false">
      <div v-if="externalDetailRow" class="external-detail-body">
        <!-- Section 1: 保单文件 -->
        <div class="detail-card">
          <div class="detail-card-title">📄 保单文件</div>
          <div class="file-card">
            <t-icon name="file-pdf" style="color: #dc2626; font-size: 28px; flex-shrink: 0;" />
            <div class="file-card-body">
              <div class="file-card-name">{{ externalDetailRow.originalFileName || '-' }}</div>
              <div class="file-card-meta">{{ externalDetailRow.fileSize || '-' }} · 上传于 {{ externalDetailRow.createTime || '-' }}</div>
            </div>
          </div>
        </div>

        <!-- Section 2: 上传信息 -->
        <div class="detail-card">
          <div class="detail-card-title">📋 上传信息</div>
          <div class="detail-grid">
            <div class="detail-row">
              <span class="detail-label">上传企业</span>
              <span class="detail-value">{{ externalDetailRow.customerCompany || '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">上传人</span>
              <span class="detail-value">{{ externalDetailRow.uploadUser || '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">上传时间</span>
              <span class="detail-value">{{ externalDetailRow.createTime || '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">状态</span>
              <span class="detail-value"><status-tag :status="externalDetailRow.status" :status-map="externalPolicyStatusMap" /></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">OCR状态</span>
              <span class="detail-value">{{ externalDetailRow.ocrStatus === 'completed' ? '已完成' : externalDetailRow.ocrStatus === 'pending' ? '待识别' : externalDetailRow.ocrStatus === 'processing' ? '识别中' : externalDetailRow.ocrStatus || '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">更新时间</span>
              <span class="detail-value">{{ externalDetailRow.updateTime || '-' }}</span>
            </div>
            <div class="detail-row" v-if="externalDetailRow.rejectReason">
              <span class="detail-label" style="color: #dc2626;">驳回原因</span>
              <span class="detail-value" style="color: #dc2626;">{{ externalDetailRow.rejectReason }}</span>
            </div>
          </div>
        </div>

        <!-- Section 3: 基础信息 -->
        <div class="detail-card">
          <div class="detail-card-title">📋 基础信息</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">保单号</span><span class="detail-value">{{ externalDetailRow.policyNo || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">保险公司</span><span class="detail-value">{{ externalDetailRow.insuranceCompany || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">被保险人</span><span class="detail-value">{{ externalDetailRow.policyholder || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">投保买方</span><span class="detail-value">{{ externalDetailRow.insured || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">保险人名称</span><span class="detail-value">{{ externalDetailRow.insurerName || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">受益人</span><span class="detail-value">{{ externalDetailRow.beneficiary || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">生效日期</span><span class="detail-value">{{ externalDetailRow.effectiveDate || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">到期日期</span><span class="detail-value">{{ externalDetailRow.expiryDate || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">保险期限</span><span class="detail-value">{{ externalDetailRow.insurancePeriod || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">贸易类型</span><span class="detail-value">{{ externalDetailRow.tradeBusinessType === 'goods' ? '货物贸易' : externalDetailRow.tradeBusinessType || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">币种</span><span class="detail-value">{{ externalDetailRow.currency || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">续保</span><span class="detail-value">{{ externalDetailRow.renewalFlag === '是' || externalDetailRow.renewalFlag === true ? '是' : externalDetailRow.renewalFlag === '否' ? '否' : '-' }}</span></div>
          </div>
        </div>

        <!-- Section 4: 责任限额 -->
        <div class="detail-card">
          <div class="detail-card-title">💰 责任限额</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">保险金额</span><span class="detail-value detail-value-currency">{{ (externalDetailRow.currency || 'USD') + ' ' + Number(externalDetailRow.coverageAmount || 0).toLocaleString() }}</span></div>
            <div class="detail-row"><span class="detail-label">最高赔偿限额</span><span class="detail-value detail-value-currency">{{ (externalDetailRow.currency || 'USD') + ' ' + Number(externalDetailRow.maxCompensationLimit || 0).toLocaleString() }}</span></div>
            <div class="detail-row"><span class="detail-label">买方信用限额</span><span class="detail-value detail-value-currency">{{ (externalDetailRow.currency || 'USD') + ' ' + Number(externalDetailRow.buyerCreditLimit || 0).toLocaleString() }}</span></div>
            <div class="detail-row"><span class="detail-label">免赔额</span><span class="detail-value detail-value-currency">{{ (externalDetailRow.currency || 'USD') + ' ' + Number(externalDetailRow.deductible || 0).toLocaleString() }}</span></div>
            <div class="detail-row"><span class="detail-label">等待期</span><span class="detail-value">{{ externalDetailRow.idlePeriod ? externalDetailRow.idlePeriod + ' 天' : '-' }}</span></div>
          </div>
        </div>

        <!-- Section 5: 费用管理 -->
        <div class="detail-card">
          <div class="detail-card-title">💵 费用管理</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">保费金额</span><span class="detail-value detail-value-currency">{{ (externalDetailRow.currency || 'USD') + ' ' + Number(externalDetailRow.premium || 0).toLocaleString() }}</span></div>
            <div class="detail-row"><span class="detail-label">费率</span><span class="detail-value">{{ externalDetailRow.premiumRate ? (Number(externalDetailRow.premiumRate) * 100).toFixed(2) + '%' : '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">缴费方式</span><span class="detail-value">{{ externalDetailRow.premiumPaymentMethod || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">缴费截止日</span><span class="detail-value">{{ externalDetailRow.premiumPaymentDeadline || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">退保手续费</span><span class="detail-value">{{ externalDetailRow.surrenderFee || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">追偿收款人</span><span class="detail-value">{{ externalDetailRow.recoveryPayee || '-' }}</span></div>
          </div>
        </div>

        <!-- Section 6: 申报规则 -->
        <div class="detail-card">
          <div class="detail-card-title">📅 申报规则</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">申报方式</span><span class="detail-value">{{ externalDetailRow.declarationMethod || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">申报周期</span><span class="detail-value">{{ externalDetailRow.declarationCycle || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">申报截止日</span><span class="detail-value">{{ externalDetailRow.declarationDeadline || '-' }}</span></div>
          </div>
        </div>

        <!-- Section 7: 承保范围 -->
        <div class="detail-card">
          <div class="detail-card-title">🔒 承保范围</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">承保风险</span><span class="detail-value detail-value-long">{{ externalDetailRow.coveredRisks || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">条款版本</span><span class="detail-value">{{ externalDetailRow.clauseVersion || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">国别风险版本</span><span class="detail-value">{{ externalDetailRow.countryRiskVersion || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">自有控制限额</span><span class="detail-value">{{ externalDetailRow.selfControlledLimit || '-' }}</span></div>
          </div>
        </div>

        <div class="modal-footer">
          <template v-if="isInkasso && externalDetailRow.status === 'platform_review'">
            <t-button theme="primary" @click="handleOcrUpload(externalDetailRow)">OCR识别</t-button>
            <t-button theme="primary" @click="handlePlatformApprove(externalDetailRow)">审核通过</t-button>
          </template>
          <template v-if="isInkasso && externalDetailRow.status === 'returned'">
            <t-button theme="primary" @click="handleOcrUpload(externalDetailRow)">OCR识别</t-button>
            <t-button theme="primary" @click="handleResubmit(externalDetailRow)">提交审核</t-button>
          </template>
          <template v-if="isClerk && externalDetailRow.status === 'clerk_review'">
            <t-button theme="primary" @click="handleClerkApproveExternal(externalDetailRow)">审核通过</t-button>
            <t-button theme="danger" @click="handleClerkRejectExternal(externalDetailRow)">驳回</t-button>
          </template>
          <template v-if="isCustomer && externalDetailRow.status === 'clerk_pending_auth'">
            <t-button theme="primary" @click="handleCustomerAuthorizeExternal(externalDetailRow)">确认授权</t-button>
          </template>
          <t-button variant="outline" @click="externalDetailVisible = false">关闭</t-button>
        </div>
      </div>
    </t-dialog>

    <!-- 外部保单驳回弹窗 -->
    <t-dialog v-model:visible="externalClerkRejectVisible" header="驳回外部保单" width="500px">
      <div class="reject-content">
        <div class="confirm-tip" style="margin-top: 0;">
          <t-icon name="warning-circle" size="16px" class="tip-icon danger" />
          <span class="tip-text">确认驳回该外部保单？驳回后平台可修正数据后重新提交。</span>
        </div>
        <div class="reject-form" style="margin-top: 16px;">
          <label class="reject-label">驳回原因 <span style="color: #dc2626;">*</span></label>
          <t-textarea
            v-model="externalClerkRejectReason"
            placeholder="请输入驳回原因"
            :rows="4"
            maxlength="500"
            show-limit-number
          />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="externalClerkRejectVisible = false">取消</t-button>
          <t-button theme="danger" @click="confirmExternalClerkReject">确认驳回</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- 续保弹窗 -->
    <renewal-dialog
      v-model:visible="renewalVisible"
      :policy="currentPolicy"
      @saved="handleRenewalSaved"
    />

    <!-- 退保弹窗 -->
    <surrender-dialog
      v-model:visible="surrenderVisible"
      :policy="currentPolicy"
      @saved="handleSurrenderSaved"
    />

    <!-- 退保申请详情弹窗 -->
    <t-dialog v-model:visible="srDetailVisible" :header="'退保详情 - ' + (srDetailRow?.id || '')" width="800px" :footer="false">
      <div v-if="srDetailRow" class="detail-body">
        <div class="detail-card">
          <div class="detail-card-title">基本信息</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">申请编号</span><span class="detail-value">{{ srDetailRow.id }}</span></div>
            <div class="detail-row"><span class="detail-label">保单号</span><span class="detail-value">{{ srDetailRow.policyNo }}</span></div>
            <div class="detail-row"><span class="detail-label">被保险人</span><span class="detail-value">{{ srDetailRow.companyName }}</span></div>
            <div class="detail-row"><span class="detail-label">投保买方</span><span class="detail-value">{{ srDetailRow.insured }}</span></div>
            <div class="detail-row"><span class="detail-label">保险公司</span><span class="detail-value">{{ srDetailRow.insuranceCompany }}</span></div>
            <div class="detail-row"><span class="detail-label">保险金额</span><span class="detail-value">${{ Number(srDetailRow.coverageAmount || 0).toLocaleString() }}</span></div>
            <div class="detail-row"><span class="detail-label">保费金额</span><span class="detail-value">${{ Number(srDetailRow.premium || 0).toLocaleString() }}</span></div>
            <div class="detail-row"><span class="detail-label">保单生效日期</span><span class="detail-value">{{ srDetailRow.effectiveDate }}</span></div>
            <div class="detail-row"><span class="detail-label">保单到期日期</span><span class="detail-value">{{ srDetailRow.expiryDate }}</span></div>
            <div class="detail-row"><span class="detail-label">币种</span><span class="detail-value">{{ srDetailRow.currency }}</span></div>
            <div class="detail-row"><span class="detail-label">状态</span><span class="detail-value"><status-tag :status="srDetailRow.status" :status-map="srStatusMap" /></span></div>
          </div>
        </div>
        <div class="detail-card">
          <div class="detail-card-title">退保申请</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">退保原因</span><span class="detail-value">{{ srDetailRow.surrenderReason }}</span></div>
            <div class="detail-row"><span class="detail-label">申请日期</span><span class="detail-value">{{ srDetailRow.applicationDate }}</span></div>
            <div class="detail-row"><span class="detail-label">退保生效日期</span><span class="detail-value">{{ srDetailRow.surrenderEffectiveDate || '-' }}</span></div>
          </div>
        </div>
        <div v-if="srDetailRow.generatedSurrenderForm?.length > 0" class="detail-card">
          <div class="detail-card-title">平台生成文件</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">退保申请表</span><span class="detail-value">{{ srDetailRow.generatedSurrenderForm[0]?.name }}</span></div>
            <div class="detail-row"><span class="detail-label">材料清单</span><span class="detail-value">{{ srDetailRow.generatedSurrenderChecklist?.[0]?.name || '-' }}</span></div>
          </div>
        </div>
        <div v-if="srDetailRow.refundAmount > 0" class="detail-card">
          <div class="detail-card-title">退保结算</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">已生效月数</span><span class="detail-value">{{ srDetailRow.activeMonths }} 个月</span></div>
            <div class="detail-row"><span class="detail-label">短期费率</span><span class="detail-value">{{ srDetailRow.shortTermRate }}%</span></div>
            <div class="detail-row"><span class="detail-label">应退保费金额</span><span class="detail-value" style="color:#00a870;">${{ Number(srDetailRow.refundAmount).toLocaleString() }}</span></div>
            <div class="detail-row"><span class="detail-label">实退金额</span><span class="detail-value" style="color:#00a870;">${{ Number(srDetailRow.netRefundAmount).toLocaleString() }}</span></div>
          </div>
        </div>
        <div v-if="srDetailRow.insurerPaymentRef" class="detail-card">
          <div class="detail-card-title">保险公司支付信息</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">支付参考号</span><span class="detail-value">{{ srDetailRow.insurerPaymentRef }}</span></div>
            <div class="detail-row"><span class="detail-label">支付时间</span><span class="detail-value">{{ srDetailRow.insurerPaymentTime }}</span></div>
          </div>
        </div>
        <div v-if="srDetailRow.clerkSyncRecord" class="detail-card">
          <div class="detail-card-title">跟单员同步记录</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">同步记录</span><span class="detail-value">{{ srDetailRow.clerkSyncRecord }}</span></div>
            <div class="detail-row"><span class="detail-label">同步时间</span><span class="detail-value">{{ srDetailRow.clerkSyncTime }}</span></div>
          </div>
        </div>
        <div v-if="srDetailRow.rejectReason" class="detail-card">
          <div class="detail-card-title">驳回原因</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">驳回原因</span><span class="detail-value" style="color:#e34d57;">{{ srDetailRow.rejectReason }}</span></div>
          </div>
        </div>
        <div v-if="srDetailRow.supplementHistory?.length > 0" class="detail-card">
          <div class="detail-card-title">补充资料记录</div>
          <div class="detail-grid" v-for="(item, idx) in srDetailRow.supplementHistory" :key="idx">
            <div class="detail-row"><span class="detail-label">{{ item.type === 'request' ? '补充要求' : '补充内容' }}</span><span class="detail-value">{{ item.content }}</span></div>
            <div class="detail-row"><span class="detail-label">时间</span><span class="detail-value">{{ item.time }}</span></div>
          </div>
        </div>
        <div v-if="srDetailRow.trackingStatus" class="detail-card">
          <div class="detail-card-title">跟踪记录</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">跟踪频率</span><span class="detail-value">{{ srDetailRow.trackingStatus === 'monthly' ? '月度' : '季度' }}</span></div>
            <div class="detail-row"><span class="detail-label">开始时间</span><span class="detail-value">{{ srDetailRow.trackingStartTime }}</span></div>
          </div>
        </div>
        <div class="detail-card">
          <div class="detail-card-title">时间轴</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">创建时间</span><span class="detail-value">{{ srDetailRow.createTime }}</span></div>
            <div class="detail-row"><span class="detail-label">提交时间</span><span class="detail-value">{{ srDetailRow.submitTime || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">平台审核时间</span><span class="detail-value">{{ srDetailRow.platformReviewTime || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">跟单员审核时间</span><span class="detail-value">{{ srDetailRow.clerkReviewTime || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">保险公司审核时间</span><span class="detail-value">{{ srDetailRow.insurerReviewTime || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">完成时间</span><span class="detail-value">{{ srDetailRow.completedTime || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">终止时间</span><span class="detail-value">{{ srDetailRow.terminatedTime || '-' }}</span></div>
          </div>
        </div>
      </div>
    </t-dialog>

    <!-- 退保保险公司批准弹窗 -->
    <t-dialog v-model:visible="srInsurerApproveVisible" header="保险公司批准退保" width="550px">
      <div class="insurer-content">
        <div class="confirm-tip" style="margin-top:0;">
          <t-icon name="info-circle-filled" size="16px" class="tip-icon success" />
          <span class="tip-text">确认保险公司批准退保申请，请填写退保金额。</span>
        </div>
        <div class="reject-form" style="margin-top:16px;">
          <label class="reject-label">退保生效日期</label>
          <t-date-picker v-model="srInsurerApproveForm.effectiveDate" style="width:100%;" />
        </div>
        <div class="reject-form" style="margin-top:12px;">
          <label class="reject-label">短期费率 (%)</label>
          <t-input-number v-model="srInsurerApproveForm.shortTermRate" :min="0" :max="100" style="width:100%;" />
        </div>
        <div class="reject-form" style="margin-top:12px;">
          <label class="reject-label">应退保费金额 <span style="color:#dc2626;">*</span></label>
          <t-input-number v-model="srInsurerApproveForm.refundAmount" :min="0" style="width:100%;" />
        </div>
        <div class="reject-form" style="margin-top:12px;">
          <label class="reject-label">实退金额</label>
          <t-input-number v-model="srInsurerApproveForm.netRefundAmount" :min="0" style="width:100%;" />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="srInsurerApproveVisible = false">取消</t-button>
          <t-button theme="success" @click="confirmInsurerApprove">确认批准</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- 退保保险公司驳回弹窗 -->
    <t-dialog v-model:visible="srInsurerRejectVisible" header="保险公司驳回退保" width="500px">
      <div class="reject-content">
        <div class="confirm-tip" style="margin-top:0;">
          <t-icon name="warning-circle" size="16px" class="tip-icon danger" />
          <span class="tip-text">确认驳回退保申请？驳回后可发起补充请求或终止退保。</span>
        </div>
        <div class="reject-form" style="margin-top:16px;">
          <label class="reject-label">驳回原因 <span style="color:#dc2626;">*</span></label>
          <t-textarea v-model="srInsurerRejectReason" placeholder="请输入驳回原因" :rows="4" maxlength="500" show-limit-number />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="srInsurerRejectVisible = false">取消</t-button>
          <t-button theme="danger" @click="confirmInsurerReject">确认驳回</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- 退保发起支付弹窗 -->
    <t-dialog v-model:visible="srPayVisible" header="发起退保支付" width="500px">
      <div class="insurer-content">
        <div class="confirm-tip" style="margin-top:0;">
          <t-icon name="info-circle-filled" size="16px" class="tip-icon" />
          <span class="tip-text">确认保险公司已发起退保支付，请填写支付参考号。</span>
        </div>
        <div class="reject-form" style="margin-top:16px;">
          <label class="reject-label">支付参考号 <span style="color:#dc2626;">*</span></label>
          <t-input v-model="srPayRef" placeholder="请输入支付参考号" />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="srPayVisible = false">取消</t-button>
          <t-button theme="primary" @click="confirmInsurerPay">确认发起支付</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- 退保跟单员驳回弹窗 -->
    <t-dialog v-model:visible="srClerkRejectVisible" header="跟单员驳回退保" width="500px">
      <div class="reject-content">
        <div class="confirm-tip" style="margin-top:0;">
          <t-icon name="warning-circle" size="16px" class="tip-icon danger" />
          <span class="tip-text">确认驳回退保申请？将退回平台处理。</span>
        </div>
        <div class="reject-form" style="margin-top:16px;">
          <label class="reject-label">驳回原因 <span style="color:#dc2626;">*</span></label>
          <t-textarea v-model="srClerkRejectReason" placeholder="请输入驳回原因" :rows="4" maxlength="500" show-limit-number />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="srClerkRejectVisible = false">取消</t-button>
          <t-button theme="danger" @click="confirmClerkReject">确认驳回</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- 退保跟单员同步平台弹窗 -->
    <t-dialog v-model:visible="srSyncVisible" header="同步退保金额至平台" width="500px">
      <div class="insurer-content">
        <div class="confirm-tip" style="margin-top:0;">
          <t-icon name="info-circle-filled" size="16px" class="tip-icon" />
          <span class="tip-text">确认退保金额信息已核对，同步至平台。</span>
        </div>
        <div class="reject-form" style="margin-top:16px;">
          <label class="reject-label">同步记录</label>
          <t-textarea v-model="srSyncRecord" placeholder="请输入同步说明" :rows="3" maxlength="500" />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="srSyncVisible = false">取消</t-button>
          <t-button theme="primary" @click="confirmSyncPlatform">确认同步</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- 退保补充材料请求弹窗 -->
    <t-dialog v-model:visible="srSupplementVisible" header="发起补充资料请求" width="550px">
      <div class="insurer-content">
        <div class="confirm-tip" style="margin-top:0;">
          <t-icon name="info-circle-filled" size="16px" class="tip-icon" />
          <span class="tip-text">发起补充资料请求后，将通知客户补充材料。</span>
        </div>
        <div class="reject-form" style="margin-top:16px;">
          <label class="reject-label">补充资料要求 <span style="color:#dc2626;">*</span></label>
          <t-textarea v-model="srSupplementRequest" placeholder="请输入需要补充的材料说明" :rows="4" maxlength="500" show-limit-number />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="srSupplementVisible = false">取消</t-button>
          <t-button theme="primary" :disabled="!srSupplementRequest.trim()" @click="confirmSupplement">发起补充请求</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- 退保终止弹窗 -->
    <t-dialog v-model:visible="srTerminateVisible" header="退保业务终止" width="500px">
      <div class="reject-content">
        <div class="confirm-tip" style="margin-top:0;">
          <t-icon name="warning-circle" size="16px" class="tip-icon danger" />
          <span class="tip-text">确认终止退保申请？此操作不可撤销，退保流程将结束。</span>
        </div>
        <div class="reject-form" style="margin-top:16px;">
          <label class="reject-label">终止原因 <span style="color:#dc2626;">*</span></label>
          <t-textarea v-model="srTerminateReason" placeholder="请输入终止原因" :rows="4" maxlength="500" show-limit-number />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="srTerminateVisible = false">取消</t-button>
          <t-button theme="danger" @click="confirmTerminate">确认终止</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- 退保客户补充材料弹窗 -->
    <t-dialog v-model:visible="srCustomerSupplementVisible" header="补充资料" width="550px">
      <div class="insurer-content">
        <div v-if="srSupplementTargetRef?.supplementHistory?.length" class="confirm-tip" style="margin-top:0;">
          <t-icon name="info-circle-filled" size="16px" class="tip-icon" />
          <span class="tip-text">补充要求：{{ srSupplementTargetRef.supplementHistory.filter(s => s.type === 'request').pop()?.content }}</span>
        </div>
        <div class="reject-form" style="margin-top:16px;">
          <label class="reject-label">补充说明 <span style="color:#dc2626;">*</span></label>
          <t-textarea v-model="srCustomerSupplementContent" placeholder="请描述补充的内容" :rows="3" maxlength="500" />
        </div>
        <div class="reject-form" style="margin-top:12px;">
          <label class="reject-label">补充材料</label>
          <t-upload v-model="srCustomerSupplementFiles" theme="file" :auto-upload="false" accept=".pdf,.jpg,.png" placeholder="选择补充文件" />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="srCustomerSupplementVisible = false">取消</t-button>
          <t-button theme="primary" :disabled="!srCustomerSupplementContent.trim()" @click="confirmCustomerSupplement">提交补充资料</t-button>
        </t-space>
      </template>
    </t-dialog>

<!-- 限额申请详情弹窗 -->
    <t-dialog v-model:visible="clAppDetailVisible" :header="'限额申请详情 - ' + (clAppDetailRow?.id || '')" width="800px" :footer="false">
      <div v-if="clAppDetailRow" class="detail-body">
        <div class="detail-card">
          <div class="detail-card-title">基本信息</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">申请编号</span><span class="detail-value">{{ clAppDetailRow.id }}</span></div>
            <div class="detail-row"><span class="detail-label">保单号</span><span class="detail-value">{{ clAppDetailRow.policyNo }}</span></div>
            <div class="detail-row"><span class="detail-label">买方名称</span><span class="detail-value">{{ clAppDetailRow.buyerName }}</span></div>
            <div class="detail-row"><span class="detail-label">申请额度</span><span class="detail-value">${{ Number(clAppDetailRow.appliedLimit || 0).toLocaleString() }}</span></div>
            <div class="detail-row"><span class="detail-label">币种</span><span class="detail-value">{{ clAppDetailRow.currency }}</span></div>
            <div class="detail-row"><span class="detail-label">申请日期</span><span class="detail-value">{{ clAppDetailRow.applicationDate }}</span></div>
            <div class="detail-row"><span class="detail-label">申请原因</span><span class="detail-value">{{ clAppDetailRow.applicationReason || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">状态</span><span class="detail-value"><status-tag :status="clAppDetailRow.status" :status-map="clAppStatusMap" /></span></div>
          </div>
        </div>
        <div v-if="clAppDetailRow.creditQueryResult" class="detail-card">
          <div class="detail-card-title">资信查询结果（模拟）</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">买方信用评级</span><span class="detail-value">{{ clAppDetailRow.creditQueryResult.buyerCreditRating }}</span></div>
            <div class="detail-row"><span class="detail-label">资信机构评估额度</span><span class="detail-value">${{ Number(clAppDetailRow.creditQueryResult.buyerCreditLimit).toLocaleString() }}</span></div>
            <div class="detail-row"><span class="detail-label">历史违约率</span><span class="detail-value">{{ clAppDetailRow.creditQueryResult.historicalDefaultRate }}%</span></div>
            <div class="detail-row"><span class="detail-label">查询时间</span><span class="detail-value">{{ clAppDetailRow.creditQueryResult.queryTime }}</span></div>
          </div>
        </div>
        <div v-if="clAppDetailRow.overLimitWarning" class="detail-card" style="border-color:#f59e0b;">
          <div class="detail-card-title" style="color:#f59e0b;">超限预警</div>
          <div style="padding:8px 12px;color:#92400e;background:#fffbeb;border-radius:4px;">{{ clAppDetailRow.overLimitMessage }}</div>
        </div>
        <div v-if="clAppDetailRow.generatedCreditReport?.length > 0" class="detail-card">
          <div class="detail-card-title">生成文件</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">限额申请表</span><span class="detail-value">{{ clAppDetailRow.generatedApplicationForm?.[0]?.name || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">买方资信报告</span><span class="detail-value">{{ clAppDetailRow.generatedCreditReport?.[0]?.name || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">材料清单</span><span class="detail-value">{{ clAppDetailRow.generatedChecklist?.[0]?.name || '-' }}</span></div>
          </div>
        </div>
        <div v-if="clAppDetailRow.insurerDecision === 'approved'" class="detail-card">
          <div class="detail-card-title">保险公司批准结果</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">批准额度</span><span class="detail-value" style="color:#00a870;">${{ Number(clAppDetailRow.approvedLimit).toLocaleString() }}</span></div>
            <div class="detail-row"><span class="detail-label">费率</span><span class="detail-value">{{ clAppDetailRow.approvedRate }}%</span></div>
            <div class="detail-row"><span class="detail-label">生效日期</span><span class="detail-value">{{ clAppDetailRow.effectiveDate || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">到期日期</span><span class="detail-value">{{ clAppDetailRow.expiryDate || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">特殊条件</span><span class="detail-value">{{ clAppDetailRow.specialConditions || '无' }}</span></div>
            <div class="detail-row"><span class="detail-label">审核时间</span><span class="detail-value">{{ clAppDetailRow.insurerReviewTime }}</span></div>
          </div>
        </div>
        <div v-if="clAppDetailRow.insurerDecision === 'rejected'" class="detail-card" style="border-color:#e34d57;">
          <div class="detail-card-title" style="color:#e34d57;">保险公司驳回结果</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">驳回类型</span><span class="detail-value">{{ clAppDetailRow.rejectType === 'refuse_coverage' ? '拒绝承保' : '信用问题' }}</span></div>
            <div class="detail-row"><span class="detail-label">驳回原因</span><span class="detail-value" style="color:#e34d57;">{{ clAppDetailRow.rejectReason }}</span></div>
            <div class="detail-row"><span class="detail-label">审核时间</span><span class="detail-value">{{ clAppDetailRow.insurerReviewTime }}</span></div>
          </div>
        </div>
        <div v-if="clAppDetailRow.recordedQuota > 0" class="detail-card">
          <div class="detail-card-title">配额录入</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">录入配额</span><span class="detail-value">${{ Number(clAppDetailRow.recordedQuota).toLocaleString() }}</span></div>
            <div class="detail-row"><span class="detail-label">录入时间</span><span class="detail-value">{{ clAppDetailRow.recordedTime }}</span></div>
          </div>
        </div>
        <div v-if="clAppDetailRow.syncRecord" class="detail-card">
          <div class="detail-card-title">同步记录</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">同步内容</span><span class="detail-value">{{ clAppDetailRow.syncRecord }}</span></div>
            <div class="detail-row"><span class="detail-label">同步时间</span><span class="detail-value">{{ clAppDetailRow.syncTime }}</span></div>
          </div>
        </div>
      </div>
    </t-dialog>

<!-- 限额申请创建弹窗 -->
    <t-dialog v-model:visible="clAppCreateVisible" header="创建限额申请" width="550px" :destroy-on-close="true" @confirm="confirmClAppCreate" @cancel="clAppCreateVisible = false">
      <t-form ref="clAppCreateFormRef" :data="clAppCreateForm" :rules="clAppCreateRules" label-width="110px">
        <t-form-item label="保单号" name="policyNo">
          <t-select v-model="clAppCreateForm.policyNo" :options="clAppPolicyOptions" placeholder="请选择保单" />
        </t-form-item>
        <t-form-item label="买方名称" name="buyerName">
          <t-input v-model="clAppCreateForm.buyerName" placeholder="请输入买方名称" />
        </t-form-item>
        <t-form-item label="申请额度" name="appliedLimit">
          <t-input-adornment prepend="$">
            <t-input v-model="clAppCreateForm.appliedLimit" type="number" placeholder="请输入申请额度" />
          </t-input-adornment>
        </t-form-item>
        <t-form-item label="币种" name="currency">
          <t-select v-model="clAppCreateForm.currency" :options="[{value:'USD',label:'USD'},{value:'CNY',label:'CNY'},{value:'EUR',label:'EUR'}]" />
        </t-form-item>
        <t-form-item label="申请原因" name="applicationReason">
          <t-textarea v-model="clAppCreateForm.applicationReason" placeholder="请输入申请原因" :autosize="{minRows:2,maxRows:4}" />
        </t-form-item>
      </t-form>
    </t-dialog>

<!-- 限额申请保险公司批准弹窗 -->
    <t-dialog v-model:visible="clAppInsurerApproveVisible" header="保险公司批准限额" width="550px" :destroy-on-close="true" @confirm="confirmClAppInsurerApprove" @cancel="clAppInsurerApproveVisible = false">
      <t-form ref="clAppInsurerApproveFormRef" :data="clAppInsurerApproveForm" :rules="clAppInsurerApproveRules" label-width="110px">
        <t-form-item label="批准额度" name="approvedLimit">
          <t-input-adornment prepend="$">
            <t-input v-model="clAppInsurerApproveForm.approvedLimit" type="number" placeholder="请输入批准额度" />
          </t-input-adornment>
        </t-form-item>
        <t-form-item label="费率" name="approvedRate">
          <t-input-adornment prepend="%">
            <t-input v-model="clAppInsurerApproveForm.approvedRate" type="number" placeholder="请输入费率" />
          </t-input-adornment>
        </t-form-item>
        <t-form-item label="生效日期" name="effectiveDate">
          <t-date-picker v-model="clAppInsurerApproveForm.effectiveDate" placeholder="选择生效日期" />
        </t-form-item>
        <t-form-item label="到期日期" name="expiryDate">
          <t-date-picker v-model="clAppInsurerApproveForm.expiryDate" placeholder="选择到期日期" />
        </t-form-item>
        <t-form-item label="特殊条件" name="specialConditions">
          <t-input v-model="clAppInsurerApproveForm.specialConditions" placeholder="可选项" />
        </t-form-item>
        <t-form-item label="审核意见" name="insurerOpinion">
          <t-textarea v-model="clAppInsurerApproveForm.insurerOpinion" placeholder="请输入审核意见（可选）" :autosize="{minRows:2,maxRows:4}" />
        </t-form-item>
      </t-form>
    </t-dialog>

<!-- 限额申请保险公司驳回弹窗 -->
    <t-dialog v-model:visible="clAppInsurerRejectVisible" header="保险公司驳回限额" width="500px" :destroy-on-close="true" @confirm="confirmClAppInsurerReject" @cancel="clAppInsurerRejectVisible = false">
      <t-form ref="clAppInsurerRejectFormRef" :data="clAppInsurerRejectForm" :rules="clAppInsurerRejectRules" label-width="100px">
        <t-form-item label="驳回类型" name="rejectType">
          <t-radio-group v-model="clAppInsurerRejectForm.rejectType">
            <t-radio value="credit_issue">信用问题</t-radio>
            <t-radio value="refuse_coverage">拒绝承保</t-radio>
          </t-radio-group>
        </t-form-item>
        <t-form-item label="驳回原因" name="rejectReason">
          <t-textarea v-model="clAppInsurerRejectForm.rejectReason" placeholder="请输入驳回原因" :autosize="{minRows:3,maxRows:5}" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <t-dialog v-model:visible="clAppClerkRejectVisible" header="跟单员驳回限额申请" width="500px" :destroy-on-close="true" @confirm="confirmClAppClerkReject" @cancel="clAppClerkRejectVisible = false">
      <t-form label-width="100px">
        <t-form-item label="驳回原因">
          <t-textarea v-model="clAppClerkRejectReason" placeholder="请填写驳回原因" :autosize="{minRows:3,maxRows:5}" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <t-dialog v-model:visible="clAppQuotaVisible" header="录入配额" width="500px" :destroy-on-close="true" @confirm="confirmClAppRecordQuota" @cancel="clAppQuotaVisible = false">
      <t-form label-width="100px">
        <t-form-item label="配额金额">
          <t-input-adornment prepend="$">
            <t-input v-model="clAppRecordedQuota" type="number" placeholder="请输入配额金额" />
          </t-input-adornment>
        </t-form-item>
      </t-form>
    </t-dialog>

    <t-dialog v-model:visible="clAppSyncVisible" header="同步配额至平台" width="500px" :destroy-on-close="true" @confirm="confirmClAppSync" @cancel="clAppSyncVisible = false">
      <t-form label-width="100px">
        <t-form-item label="同步备注">
          <t-textarea v-model="clAppSyncRecord" placeholder="请输入同步备注" :autosize="{minRows:3,maxRows:5}" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 站内信弹窗 -->
    <t-dialog v-model:visible="notificationVisible" header="站内信" width="550px" :footer="false" destroy-on-close>
      <div class="notification-list" v-if="notificationList.length > 0">
        <div
          v-for="n in notificationList"
          :key="n.id"
          class="notification-item"
          :class="{ unread: !n.read }"
          @click="handleMarkNotificationRead(n)"
        >
          <div class="notif-header">
            <span class="notif-type">{{ n.type === 'payment_notification' ? '支付通知' : '系统消息' }}</span>
            <span class="notif-time">{{ n.createTime }}</span>
          </div>
          <div class="notif-body">{{ n.message }}</div>
        </div>
      </div>
      <div v-else class="no-data" style="text-align:center;padding:40px 0;color:#999;">暂无消息</div>
    </t-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import SearchFilter from '@/components/common/SearchFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import DetailPanel from '@/components/common/DetailPanel.vue'
import PolicyOcrDialog from '@/components/business/PolicyOcrDialog.vue'
import ExternalPolicyUploadDialog from '@/components/business/ExternalPolicyUploadDialog.vue'
import ClerkPolicyUploadDialog from '@/components/business/ClerkPolicyUploadDialog.vue'
import RenewalDialog from '@/components/business/RenewalDialog.vue'
import SurrenderDialog from '@/components/business/SurrenderDialog.vue'
import { useBusinessStore } from '@/stores/business'
import { useUserStore } from '@/stores/user'
import { generatePolicyApplicationXlsx, generateBuyerInfoXlsx, downloadWorkbook, workbookToHtml } from '@/utils/templateFiller'

const route = useRoute()
const router = useRouter()
const store = useBusinessStore()
const userStore = useUserStore()
const loading = computed(() => false)
const searchParams = ref({ enterpriseName: '', buyerName: '', status: '', dateRange: [] })

const isInkasso = computed(() => userStore.role === 'inkasso')
const isClerk = computed(() => userStore.role === 'clerk')
const isCustomer = computed(() => userStore.role === 'customer')
const mainTab = ref(route.query.tab || 'review')

// ===== Application review =====
const currentStatusTab = ref('all')

const statusTabs = [
  { value: 'all', label: '全部' },
  { value: 'pending_review', label: '待处理' }
]

const statusOptions = [
  { value: 'approved', label: '已审核' },
  { value: 'clerk_review', label: '待审核' },
  { value: 'underwriting', label: '核保中' },
  { value: 'uw_completed', label: '核保通过' },
  { value: 'platform_synced', label: '待确认保费' },
  { value: 'premium_confirmed', label: '保费已确认' },
  { value: 'payment_uploaded', label: '凭证已上传' },
  { value: 'active', label: '已生效' },
  { value: 'ocr_pending', label: '待确认' },
  { value: 'ocr_clerk_review', label: '待审核' },
  { value: 'ocr_approved', label: '已确认' },
  { value: 'rejected', label: '已驳回' }
]

const statusMap = {
  draft: '已确认',
  pending_review: '已确认',
  clerk_review: '待审核',
  approved: '已审核',
  underwriting: '核保中',
  uw_completed: '核保通过',
  platform_synced: '待确认保费',
  premium_confirmed: '保费已确认',
  payment_uploaded: '凭证已上传',
  active: '已生效',
  ocr_pending: '待确认',
  ocr_clerk_review: '待审核',
  ocr_approved: '已确认',
  rejected: '已驳回'
}

const columns = [
  { colKey: 'id', title: '投保编号', width: 120 },
  { colKey: 'companyName', title: '企业名称', ellipsis: true },
  { colKey: 'buyerName', title: '买方名称', ellipsis: true },
  { colKey: 'buyerCountry', title: '买方国别', width: 100 },
  { colKey: 'insuranceType', title: '投保类型', width: 140 },
  { colKey: 'insuranceAmount', title: '投保金额', align: 'right', width: 120, slot: 'insuranceAmount' },
  { colKey: 'serviceFee', title: '服务费', width: 130, slot: 'serviceFee' },
  { colKey: 'expectedInsurancePeriod', title: '投保期限', width: 160, slot: 'expectedInsurancePeriod' },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 140, fixed: 'right', slot: 'operation' }
]

const pagination = reactive({ total: 0, current: 1, pageSize: 20 })

const filteredData = computed(() => {
  const list = store.insuranceApplications || []
  const p = searchParams.value
  const isCust = userStore.role === 'customer'
  return list.filter((it) => {
    if (isCust) {
      // Customer sees all their items except draft
      if (it.status === 'draft') return false
    } else {
      // Inkasso and clerk see all items except draft
      if (userStore.role === 'inkasso' && it.status === 'draft') return false
      if (userStore.role === 'clerk' && it.status === 'draft') return false
    }
    if (it.status === 'ocr_pending') return false
    if (p.enterpriseName && !String(it.companyName || '').includes(p.enterpriseName)) return false
    if (p.buyerName && !String(it.buyerName || '').includes(p.buyerName)) return false
    if (p.status && it.status !== p.status) return false
    return true
  })
})

const tableData = computed(() => {
  pagination.total = filteredData.value.length
  const start = (pagination.current - 1) * pagination.pageSize
  return filteredData.value.slice(start, start + pagination.pageSize)
})

const activePolicyCount = computed(() => (store.insuranceApplications || []).filter(p => p.status === 'approved').length)
const totalInsuranceAmount = computed(() => (store.insuranceApplications || []).reduce((sum, p) => sum + (Number(p.insuranceAmount) || 0), 0))

// ===== Upload tab (电子保单列表) =====
const uploadStatusMap = {
  draft: '待提交',
  platform_review: '平台审核中',
  clerk_review: '跟单员审核中',
  active: '已生效',
  returned: '已退回',
  pending_ocr: '待识别',
  ocr_processing: '识别中',
  ocr_completed: '已识别',
  rejected: '已驳回',
  clerk_pending_auth: '待客户授权',
  clerk_auth_authorized: '客户已授权',
  clerk_ocr_processing: 'OCR识别中',
  clerk_ocr_failed: 'OCR识别失败',
  clerk_platform_review: '平台OCR识别中',
  clerk_confirm: '待跟单员确认',
  clerk_active: '已生效'
}

const uploadPagination = reactive({ total: 0, current: 1, pageSize: 20 })
const uploadLoading = ref(false)

const uploadColumns = computed(() => {
  const base = [
    { colKey: 'originalFileName', title: '文件名', ellipsis: true, width: 200 },
    { colKey: 'customerCompany', title: '上传企业', ellipsis: true, width: 140 },
    { colKey: 'createTime', title: '上传时间', width: 160 },
    { colKey: 'fileSize', title: '文件大小', width: 100 },
    { colKey: 'uploadUser', title: '上传人', width: 100 },
    { colKey: 'status', title: '状态', width: 100, slot: 'status' },
    { colKey: 'operation', title: '操作', width: 160, fixed: 'right', slot: 'operation' }
  ]
  // Customer doesn't need to see their own company name
  if (isCustomer.value) {
    return base.filter(c => c.colKey !== 'customerCompany' && c.colKey !== 'uploadUser')
  }
  return base
})

const uploadFilteredData = computed(() => {
  let list = store.externalPolicies || []
  if (isCustomer.value) {
    list = list.filter(p => p.customerCompany === userStore.companyName)
  }
  return list
})

const uploadTableData = computed(() => {
  uploadPagination.total = uploadFilteredData.value.length
  const start = (uploadPagination.current - 1) * uploadPagination.pageSize
  return uploadFilteredData.value.slice(start, start + uploadPagination.pageSize)
})

const uploadTotalCount = computed(() => store.externalPolicies.length)
const uploadPendingCount = computed(() => store.externalPolicies.filter(p =>
  ['draft', 'platform_review', 'clerk_pending_auth', 'clerk_auth_authorized',
   'clerk_ocr_processing', 'clerk_ocr_failed', 'clerk_platform_review', 'clerk_confirm'].includes(p.status)
).length)
const uploadCompletedCount = computed(() => store.externalPolicies.filter(p =>
  p.status === 'active' || p.status === 'clerk_active'
).length)

const handleUploadPageChange = (pageInfo) => {
  uploadPagination.current = pageInfo.current
  uploadPagination.pageSize = pageInfo.pageSize
}

const handleViewUpload = (row) => {
  externalDetailRow.value = row
  externalDetailVisible.value = true
}

const handleOcrUpload = (row) => {
  // Open OCR dialog with external policy pre-loaded
  ocrExternalId.value = row.id
  ocrDialogVisible.value = true
}

const handleReupload = (row) => {
  externalUploadVisible.value = true
}

// ===== External policy computeds =====
const customerExternalPolicies = computed(() => {
  const companyName = userStore.companyName
  if (!companyName) return []
  return store.externalPolicies.filter(p => p.customerCompany === companyName)
})

const clerkExternalPolicies = computed(() => {
  return store.externalPolicies.filter(p => p.status === 'pending_clerk_review')
})

// ===== Policy list =====
const policyStatusMap = {
  pending_effect: '待生效',
  activating: '保单生效中',
  active: '有效',
  expiring: '即将到期',
  expired: '已到期',
  suspended: '中止',
  cancelled: '退保',
  renewed: '已续保',
  terminated: '保单已终止',
  applying: '申请中',
  approved: '已确认',
  pending_review: '待确认',
  ocr_approved: '已确认'
}

const policyColumns = [
  { colKey: 'policyNo', title: '保单号', width: 140 },
  { colKey: 'insuranceCompany', title: '保险公司', width: 100 },
  { colKey: 'policyholder', title: '被保险人', ellipsis: true },
  { colKey: 'insured', title: '投保买方', ellipsis: true },
  { colKey: 'coverageAmount', title: '保险金额', align: 'right', width: 120, slot: 'coverageAmount' },
  { colKey: 'premium', title: '保费金额', align: 'right', width: 120, slot: 'premium' },
  { colKey: 'effectiveDate', title: '生效日期', width: 110 },
  { colKey: 'expiryDate', title: '到期日期', width: 110 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 200, fixed: 'right', slot: 'operation' }
]

const policyPagination = reactive({ total: 0, current: 1, pageSize: 20 })

const policyTableData = computed(() => {
  const list = store.policies || []
  policyPagination.total = list.length
  const start = (policyPagination.current - 1) * policyPagination.pageSize
  return list.slice(start, start + policyPagination.pageSize)
})

const expiringPolicyCount = computed(() => (store.policies || []).filter(p => p.status === 'expiring' || p.status === 'pending_effect').length)
const totalCoverage = computed(() => (store.policies || []).reduce((sum, p) => sum + (Number(p.coverageAmount) || 0), 0))
const totalPremium = computed(() => (store.policies || []).reduce((sum, p) => sum + (Number(p.premium) || 0), 0))

// ===== Dialog state =====
const detailVisible = ref(false)
const detailMode = ref('view') // 'view' | 'apply' | 'clerk_approve'
const currentRow = ref(null)
const policyDetailVisible = ref(false)
const currentPolicy = ref(null)
const currentPolicyElectronic = computed(() => {
  if (!currentPolicy.value) return null
  const epId = currentPolicy.value.externalPolicyId
  if (epId) return store.externalPolicies.find(p => p.id === epId)
  // Also try to find by linked policyNo
  const pn = currentPolicy.value.policyNo
  if (pn) return store.externalPolicies.find(p => p.linkedPolicyNo === pn)
  return null
})


const ocrEditForm = ref({
  ocrPolicyNo: '',
  ocrInsuranceCompany: '',
  ocrPolicyholder: '',
  ocrInsurerName: '',
  ocrBeneficiary: '',
  effectiveDate: '',
  expiryDate: '',
  insuranceCurrency: 'USD',
  insuranceAmount: 0,
  ocrMaxCompensation: 0,
  buyerName: '',
  ocrBuyerCreditLimit: 0,
  ocrPremium: 0,
  ocrPremiumRate: 0,
  ocrBusinessType: 'goods'
})

const confirmRow = ref(null)

// ===== Clerk approval flow progress =====
const clerkFlowStepOptions = [
  { label: '提交投保申请', value: 1 },
  { label: '资料审核', value: 2 },
  { label: '资信调查', value: 3 },
  { label: '信用限额审批', value: 4 },
  { label: '核保出单', value: 5 },
  { label: '缴费生效', value: 6 }
]
const clerkFlowStepRoles = [
  { role: 'customer', label: '客户 / 长安银科' },
  { role: 'inkasso', label: '长安银科 / 跟单员' },
  { role: 'insurer', label: '保险公司' },
  { role: 'insurer', label: '保险公司' },
  { role: 'clerk', label: '跟单员' },
  { role: 'customer', label: '客户' }
]
const clerkCurrentStep = ref(1)
const clerkTaskCompleted = ref(false)
const clerkStepInfo = reactive(
  Array.from({ length: 6 }, () => ({ handler: '', startTime: '', endTime: '' }))
)

const getClerkCurrentStep = (status) => {
  const map = {
    clerk_review: 2,
    approved: 3,
    credit_investigating: 3,
    limit_approving: 4,
    underwriting: 3,
    uw_completed: 5,
    platform_synced: 6,
    premium_confirmed: 6,
    payment_uploaded: 6,
    active: 6
  }
  return map[status] || 2
}

const clerkRejectVisible = ref(false)
const clerkRejectReason = ref('')
const uwCompleteVisible = ref(false)
const uwCompleteRow = ref(null)
const uwForm = reactive({
  decision: 'approved',
  policyNo: '',
  insuranceCompany: '',
  coverageAmount: 0,
  premium: 0,
  opinion: '',
  policyDetailFile: [],
  rateFile: [],
  countryCategoryFile: []
})

const ocrDialogVisible = ref(false)
const ocrExternalId = ref(null)
watch(ocrDialogVisible, (v) => { if (!v) ocrExternalId.value = null })
const renewalVisible = ref(false)
const surrenderVisible = ref(false)


const previewVisible = ref(false)
const previewTitle = ref('')
const previewHtml = ref('')
const previewWb = ref(null)
const previewType = ref('')
const previewWrapperRef = ref(null)

const exportVisible = ref(false)
const exportData = ref([])

// ===== External policy state =====
const externalUploadVisible = ref(false)
const clerkUploadVisible = ref(false)
const externalDetailVisible = ref(false)
const externalDetailRow = ref(null)
const externalClerkRejectVisible = ref(false)
const externalClerkRejectReason = ref('')
const externalPagination = reactive({ total: 0, current: 1, pageSize: 20 })
const externalLoading = ref(false)

// ===== Policy list electronic policy upload =====
const policyUploadVisible = ref(false)
const uploadTargetPolicyNo = ref('')
const uploadTargetCompanyName = ref('')
const uploadTargetUserName = ref('')
const uploadTargetRole = ref('customer')

const handleUploadElectronicPolicy = (row) => {
  uploadTargetPolicyNo.value = row.policyNo || ''
  uploadTargetCompanyName.value = row.policyholder || ''
  uploadTargetUserName.value = userStore.userName || userStore.companyName || ''
  uploadTargetRole.value = userStore.role === 'clerk' ? 'clerk' : 'customer'
  policyUploadVisible.value = true
}

const handlePolicyUploadSuccess = (data) => {
  MessagePlugin.success('电子保单上传成功，等待平台OCR识别处理')
}

const handleClerkPolicyUploadSuccess = (data) => {
  MessagePlugin.success('代客上传电子保单成功')
}

const externalPolicyStatusMap = {
  draft: '待提交',
  platform_review: '平台审核中',
  clerk_review: '跟单员审核中',
  active: '已生效',
  returned: '已退回',
  pending_ocr: '待识别',
  ocr_processing: '识别中',
  ocr_completed: '已识别',
  rejected: '已驳回',
  clerk_pending_auth: '待客户授权',
  clerk_auth_authorized: '客户已授权',
  clerk_ocr_processing: 'OCR识别中',
  clerk_ocr_failed: 'OCR识别失败',
  clerk_platform_review: '平台OCR识别中',
  clerk_confirm: '待跟单员确认',
  clerk_active: '已生效'
}

const externalColumns = [
  { colKey: 'id', title: '编号', width: 120 },
  { colKey: 'customerCompany', title: '上传企业', ellipsis: true },
  { colKey: 'policyNo', title: '保单号', width: 140 },
  { colKey: 'insuranceCompany', title: '保险公司', width: 100 },
  { colKey: 'coverageAmount', title: '保险金额', align: 'right', width: 120, slot: 'coverageAmount' },
  { colKey: 'status', title: '状态', width: 110, slot: 'status' },
  { colKey: 'createTime', title: '上传时间', width: 150 },
  { colKey: 'operation', title: '操作', width: 160, fixed: 'right', slot: 'operation' }
]

const clerkExternalColumns = [
  { colKey: 'id', title: '编号', width: 120 },
  { colKey: 'customerCompany', title: '客户企业', ellipsis: true },
  { colKey: 'policyNo', title: '保单号', width: 140 },
  { colKey: 'insuranceCompany', title: '保险公司', width: 100 },
  { colKey: 'coverageAmount', title: '保险金额', align: 'right', width: 120, slot: 'coverageAmount' },
  { colKey: 'status', title: '状态', width: 110, slot: 'status' },
  { colKey: 'createTime', title: '上传时间', width: 150 },
  { colKey: 'operation', title: '操作', width: 140, fixed: 'right', slot: 'operation' }
]

const inkassoExternalColumns = [
  { colKey: 'id', title: '编号', width: 120 },
  { colKey: 'customerCompany', title: '客户企业', ellipsis: true },
  { colKey: 'policyNo', title: '保单号', width: 140 },
  { colKey: 'insuranceCompany', title: '保险公司', width: 100 },
  { colKey: 'coverageAmount', title: '保险金额', align: 'right', width: 120, slot: 'coverageAmount' },
  { colKey: 'status', title: '状态', width: 110, slot: 'status' },
  { colKey: 'createTime', title: '上传时间', width: 150 },
  { colKey: 'operation', title: '操作', width: 100, fixed: 'right', slot: 'operation' }
]

// ===== Column defs =====
const detailColumns = [
  { label: '投保编号', key: 'id' },
  { label: '企业名称', key: 'companyName' },
  { label: '统一社会信用代码', key: 'unifiedSocialCreditCode' },
  { label: '法定代表人', key: 'legalRepresentative' },
  { label: '联系人', key: 'contactName' },
  { label: '联系电话', key: 'contactPhone' },
  { label: '保单编号', key: 'policyNo', formatter: (v) => v || '-' },
  { label: '保险公司', key: 'insuranceCompanyName', formatter: (v) => v || '-' }
]

const businessColumns = [
  { label: '买方名称', key: 'buyerName' },
  { label: '买方国别', key: 'buyerCountry' },
  { label: '合作年限', key: 'cooperationYearsWithBuyer' },
  { label: '主要出口行业', key: 'mainExportIndustry' },
  { label: '主要出口国家', key: 'exportMainCountries', formatter: (v) => Array.isArray(v) ? v.join('、') : v },
  { label: '支付方式', key: 'mainPaymentMethods' }
]

const insuranceColumns = [
  { label: '投保类型', key: 'insuranceType' },
  { label: '投保金额', key: 'insuranceAmount', formatter: (v) => `$${Number(v).toLocaleString()}` },
  { label: '投保期限', key: 'expectedInsurancePeriod', formatter: (v) => Array.isArray(v) ? v.join(' ~ ') : v },
  { label: '申请日期', key: 'createTime' }
]

const policyDetailColumns = [
  { label: '保单号', key: 'policyNo' },
  { label: '保险公司', key: 'insuranceCompany' },
  { label: '被保险人', key: 'policyholder' },
  { label: '投保买方', key: 'insured' },
  { label: '保险金额', key: 'coverageAmount', formatter: (v) => `$${Number(v).toLocaleString()}` },
  { label: '保费金额', key: 'premium', formatter: (v) => `$${Number(v).toLocaleString()}` },
  { label: '生效日期', key: 'effectiveDate' },
  { label: '到期日期', key: 'expiryDate' },
  { label: '已用额度', key: 'usedQuota', formatter: (v) => `$${Number(v || 0).toLocaleString()}` },
  { label: '剩余额度', key: 'remainingQuota', formatter: (v) => `$${Number(v || 0).toLocaleString()}` },
  { label: '币种', key: 'currency' },
  { label: '状态', key: 'status' }
]

// ===== Handlers =====
const handleSearch = (params) => { searchParams.value = params; pagination.current = 1 }
const handleReset = () => { searchParams.value = { enterpriseName: '', buyerName: '', status: '', dateRange: [] }; pagination.current = 1 }
const handlePageChange = (pageInfo) => { pagination.current = pageInfo.current; pagination.pageSize = pageInfo.pageSize }
const handlePolicyPageChange = (pageInfo) => { policyPagination.current = pageInfo.current; policyPagination.pageSize = pageInfo.pageSize }

const handleView = (row) => {
  currentRow.value = row
  detailMode.value = 'view'
  // Setup flow progress data from store processTasks if available
  const task = store.processTasks.find(t => t.id === row.id + '_flow')
  if (task) {
    clerkCurrentStep.value = task.currentStep || getClerkCurrentStep(row.status)
    clerkTaskCompleted.value = task.status === 'completed'
    for (let i = 0; i < clerkFlowStepOptions.length; i++) {
      clerkStepInfo[i] = task.stepInfo[i] || { handler: '', startTime: '', endTime: '' }
    }
  } else {
    const step = getClerkCurrentStep(row.status)
    clerkCurrentStep.value = step
    clerkTaskCompleted.value = false
    clerkStepInfo[0] = { handler: row.companyName || '客户', startTime: row.createTime || '', endTime: row.submitTime || '' }
    for (let i = 1; i < clerkFlowStepOptions.length; i++) {
      clerkStepInfo[i] = { handler: '', startTime: '', endTime: '' }
    }
    if (step >= 2) {
      clerkStepInfo[1] = { handler: '李跟单', startTime: row.clerkReviewTime || '', endTime: '' }
    }
  }
  detailVisible.value = true
}
const handleViewPolicy = (row) => {
  currentPolicy.value = row
  const app = store.insuranceApplications.find(
    a => a.companyName === row.policyholder && (a.buyerName === row.insured || a.policyNo === row.policyNo)
  )
  if (app) {
    currentPolicy.value = { ...row, _app: app }
  }
  policyDetailVisible.value = true
}

const handleApprove = (row) => {
  currentRow.value = row
  detailMode.value = 'apply'
  detailVisible.value = true
}

const showPreview = (type) => {
  const row = confirmRow.value || currentRow.value
  if (!row) return
  previewType.value = type
  if (type === 'policy') {
    previewTitle.value = '保单申请书'
    previewWb.value = generatePolicyApplicationXlsx(row, statusMap)
  } else {
    previewTitle.value = '买方信息采集表'
    previewWb.value = generateBuyerInfoXlsx(row)
  }
  previewHtml.value = workbookToHtml(previewWb.value)
  previewVisible.value = true
  // Reset scroll on next tick
  setTimeout(() => {
    if (previewWrapperRef.value) {
      previewWrapperRef.value.scrollTop = 0
      previewWrapperRef.value.scrollLeft = 0
    }
  }, 50)
}

const handlePreviewWheel = (e) => {
  const el = previewWrapperRef.value
  if (!el) return
  // If holding Shift, let browser handle horizontal scroll natively
  if (e.shiftKey) return
  // If content overflows horizontally, scroll horizontally with wheel
  if (el.scrollWidth > el.clientWidth) {
    el.scrollLeft += e.deltaY
    e.preventDefault()
  }
}

const previewDownload = () => {
  if (!previewWb.value) return
  const row = confirmRow.value || currentRow.value
  const filename = previewType.value === 'policy'
    ? `保单申请书_${row?.id || ''}_${new Date().toISOString().split('T')[0]}.xlsx`
    : `买方信息采集表_${row?.buyerName || row?.id || ''}_${new Date().toISOString().split('T')[0]}.xlsx`
  downloadWorkbook(previewWb.value, filename)
}

const handleSubmit = (row) => {
  currentRow.value = row
  detailMode.value = 'resubmit'
  detailVisible.value = true
}

const handleDetailApply = () => {
  const row = currentRow.value
  if (!row) return

  if (detailMode.value === 'apply') {
    // Inkasso: submit to clerk review
    const res = store.submitToClerkReview(row.id)
    if (!res?.ok) {
      MessagePlugin.error(res?.message || '申请失败')
      return
    }
    MessagePlugin.success('申请成功，已流转至跟单员确认')
    detailVisible.value = false
    // Create process task — starts at step 2 (资料审核) for clerk
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const fmtDt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    const stepOptions = [
      { label: '提交投保申请', value: 1 },
      { label: '资料审核', value: 2 },
      { label: '资信调查', value: 3 },
      { label: '信用限额审批', value: 4 },
      { label: '核保出单', value: 5 },
      { label: '缴费生效', value: 6 }
    ]
    store.processTasks.unshift({
      id: row.id + '_flow',
      policyNo: row.policyNo || `PI${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(Math.floor(Math.random() * 10000))}`,
      companyName: row.companyName || '',
      taskType: '投保流程',
      startTime: fmtDt(now),
      endTime: '',
      stepsCompleted: 1,
      currentStep: 2,
      status: 'processing',
      statusName: '进行中',
      stepOptions,
      stepInfo: [
        { handler: row.declarationSignature || row.legalRepresentative || row.contactName || '客户', startTime: fmtDt(now), endTime: fmtDt(now) },
        { handler: '李跟单', startTime: fmtDt(now), endTime: '' },
        { handler: '', startTime: '', endTime: '' },
        { handler: '', startTime: '', endTime: '' },
        { handler: '', startTime: '', endTime: '' },
        { handler: '', startTime: '', endTime: '' }
      ],
      formData: {
        step1: {
          insurancePlan: 'planA',
          insuranceCompany: 'company1',
          matchRule: '根据各保险公司行业风险清单、国家（地区）分类表设定匹配规则，结合买方资质、贸易背景等因素综合评估后推荐此方案。',
          approvalResult: 'approved',
          auditOpinion: '投保申请已通过长安银科确认，自动流转至跟单员确认。'
        },
        step2: { approvalResult: '', auditOpinion: '' },
        step3: { approvalResult: '', auditOpinion: '' },
        step4: { checkedItems: [], approvalResult: '', auditOpinion: '' },
        step5: { policyNo: '', issueDate: '', policyFile: [], approvalResult: '', auditOpinion: '' },
        step6: { premiumAmount: '', paymentStatus: 'unpaid', paymentReceipt: [], policyDetailFile: [], rateFile: [], approvalResult: '', auditOpinion: '' }
      },
      step2Docs: { applicationForm: true, buyerInfoForm: true },
      planLabels: { planA: '方案A - 短期出口信用保险', planB: '方案B - 中长期出口信用保险', planC: '方案C - 国内贸易信用保险' },
      companyLabels: { company1: '中国出口信用保险公司', company2: '平安财产保险', company3: '太平洋财产保险' }
    })
  } else if (detailMode.value === 'clerk_approve') {
    // Clerk: confirm complete
    // If OCR source, save edited fields first before approving
    if (row?.ocrSource) {
      const idx = store.insuranceApplications.findIndex(a => a.id === row.id)
      if (idx >= 0) {
        store.insuranceApplications[idx] = {
          ...store.insuranceApplications[idx],
          ocrPolicyNo: ocrEditForm.value.ocrPolicyNo,
          ocrInsuranceCompany: ocrEditForm.value.ocrInsuranceCompany,
          ocrPolicyholder: ocrEditForm.value.ocrPolicyholder,
          ocrInsurerName: ocrEditForm.value.ocrInsurerName,
          ocrBeneficiary: ocrEditForm.value.ocrBeneficiary,
          buyerName: ocrEditForm.value.buyerName,
          insuranceCurrency: ocrEditForm.value.insuranceCurrency,
          insuranceAmount: Number(ocrEditForm.value.insuranceAmount),
          ocrMaxCompensation: Number(ocrEditForm.value.ocrMaxCompensation),
          ocrBuyerCreditLimit: Number(ocrEditForm.value.ocrBuyerCreditLimit),
          ocrPremium: Number(ocrEditForm.value.ocrPremium),
          ocrPremiumRate: Number(ocrEditForm.value.ocrPremiumRate) / 100,
          ocrBusinessType: ocrEditForm.value.ocrBusinessType,
          expectedInsurancePeriod: [ocrEditForm.value.effectiveDate, ocrEditForm.value.expiryDate]
        }
      }
    }
    const res = store.approveInsuranceApplication(row.id)
    if (!res?.ok) {
      MessagePlugin.error(res?.message || '确认失败')
      return
    }
    MessagePlugin.success('审核通过')
    // 跟单员审核通过 → 完成资料审核(step2)，推进到资信调查(step3)
    store.approveInsuranceTaskStep(row.id + '_flow', {
      handler: '李跟单',
      approvalResult: 'approved',
      auditOpinion: '审核通过，进入资信调查阶段'
    })
    detailVisible.value = false
  } else if (detailMode.value === 'resubmit') {
    // Customer: resubmit rejected application
    const res = store.submitInsuranceApplication(row.id)
    if (!res?.ok) {
      MessagePlugin.error(res?.message || '提交失败')
      return
    }
    MessagePlugin.success('提交申请成功')
    detailVisible.value = false
  } else if (detailMode.value === 'underwriting') {
    // Clerk: submit to underwriting
    const res = store.submitToUnderwriting(row.id)
    if (!res?.ok) {
      MessagePlugin.error(res?.message || '提交核保失败')
      return
    }
    MessagePlugin.success('已提交核保')
    // 提交核保 → 状态更新核保中，流程已在资信调查阶段，无需再次推进
    detailVisible.value = false
  }
}

const handleClerkApprove = (row) => {
  currentRow.value = row
  detailMode.value = 'clerk_approve'
  // Setup flow progress data - prefer store processTasks if available
  const task = store.processTasks.find(t => t.id === row.id + '_flow')
  if (task) {
    clerkCurrentStep.value = task.currentStep || getClerkCurrentStep(row.status)
    clerkTaskCompleted.value = task.status === 'completed'
    for (let i = 0; i < clerkFlowStepOptions.length; i++) {
      clerkStepInfo[i] = task.stepInfo[i] || { handler: '', startTime: '', endTime: '' }
    }
  } else {
    const step = getClerkCurrentStep(row.status)
    clerkCurrentStep.value = step
    clerkTaskCompleted.value = false
    clerkStepInfo[0] = {
      handler: row.companyName || (row.submitter || '客户'),
      startTime: row.createTime || '',
      endTime: row.submitTime || row.clerkReviewTime || ''
    }
    for (let i = 1; i < clerkFlowStepOptions.length; i++) {
      clerkStepInfo[i] = { handler: '', startTime: '', endTime: '' }
    }
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    if (step >= 2) {
      clerkStepInfo[1] = { handler: '李跟单', startTime: row.clerkReviewTime || '', endTime: '' }
    }
    if (step >= 3) {
      clerkStepInfo[1].endTime = row.clerkReviewTime || fmt(now)
    }
  }
  // Populate OCR edit form if it's an OCR source record
  if (row?.ocrSource) {
    ocrEditForm.value = {
      ocrPolicyNo: row.ocrPolicyNo || '',
      ocrInsuranceCompany: row.ocrInsuranceCompany || '',
      ocrPolicyholder: row.ocrPolicyholder || row.companyName || '',
      ocrInsurerName: row.ocrInsurerName || '',
      ocrBeneficiary: row.ocrBeneficiary || '',
      effectiveDate: row.expectedInsurancePeriod?.[0] || '',
      expiryDate: row.expectedInsurancePeriod?.[1] || '',
      insuranceCurrency: row.insuranceCurrency || 'USD',
      insuranceAmount: row.insuranceAmount || 0,
      ocrMaxCompensation: row.ocrMaxCompensation || 0,
      buyerName: row.buyerName || '',
      ocrBuyerCreditLimit: row.ocrBuyerCreditLimit || 0,
      ocrPremium: row.ocrPremium || 0,
      ocrPremiumRate: (row.ocrPremiumRate || 0) * 100,
      ocrBusinessType: row.ocrBusinessType || 'goods'
    }
  }
  detailVisible.value = true
}

const handleClerkReject = (row) => {
  confirmRow.value = row
  clerkRejectVisible.value = true
  clerkRejectReason.value = ''
}

const handleClerkRejectFromDialog = () => {
  // 关闭审核弹窗，打开驳回弹窗
  const row = currentRow.value
  if (row) {
    detailVisible.value = false
    handleClerkReject(row)
  }
}

const handleClerkRejectConfirm = () => {
  if (!clerkRejectReason.value.trim()) {
    MessagePlugin.warning('请输入驳回原因')
    return
  }
  const res = store.rejectInsuranceApplication(confirmRow.value.id, clerkRejectReason.value)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '驳回失败')
    return
  }
  MessagePlugin.success('已驳回')
  clerkRejectVisible.value = false
}

const handleSubmitUnderwriting = (row) => {
  currentRow.value = row
  detailMode.value = 'underwriting'
  detailVisible.value = true
}

const handleUnderwritingComplete = (row) => {
  uwCompleteRow.value = row
  uwForm.decision = 'approved'
  uwForm.policyNo = ''
  uwForm.insuranceCompany = ''
  uwForm.coverageAmount = Number(row.insuranceAmount || 0)
  uwForm.premium = Math.round(Number(row.insuranceAmount || 0) * 0.0011)
  uwForm.opinion = ''
  uwForm.policyDetailFile = []
  uwForm.rateFile = []
  uwForm.countryCategoryFile = []
  uwCompleteVisible.value = true
}

const handleUwConfirm = () => {
  const row = uwCompleteRow.value
  if (!row) return
  if (!uwForm.policyNo.trim()) {
    MessagePlugin.warning('请输入保单号')
    return
  }
  const res = store.completeUnderwriting(row.id, {
    decision: uwForm.decision,
    policyNo: uwForm.policyNo,
    insuranceCompany: uwForm.insuranceCompany,
    coverageAmount: uwForm.coverageAmount,
    premium: uwForm.premium,
    opinion: uwForm.opinion,
    policyDetailFile: uwForm.policyDetailFile,
    rateFile: uwForm.rateFile,
    countryCategoryFile: uwForm.countryCategoryFile
  })
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '操作失败')
    return
  }
  MessagePlugin.success('核保已通过')
  // 确保流程任务存在，不存在则创建
  let task = store.processTasks.find(t => t.id === row.id + '_flow')
  if (!task) {
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const fmtDt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    const stepOptions = [
      { label: '提交投保申请', value: 1 },
      { label: '资料审核', value: 2 },
      { label: '资信调查', value: 3 },
      { label: '信用限额审批', value: 4 },
      { label: '核保出单', value: 5 },
      { label: '缴费生效', value: 6 }
    ]
    store.processTasks.unshift({
      id: row.id + '_flow',
      policyNo: row.policyNo || '',
      companyName: row.companyName || '',
      taskType: '投保流程',
      startTime: fmtDt(now),
      endTime: '',
      stepsCompleted: 2,
      currentStep: 3,
      status: 'processing',
      statusName: '进行中',
      stepOptions,
      stepInfo: [
        { handler: row.declarationSignature || row.legalRepresentative || row.contactName || '客户', startTime: fmtDt(now), endTime: fmtDt(now) },
        { handler: '李跟单', startTime: fmtDt(now), endTime: fmtDt(now) },
        { handler: '', startTime: fmtDt(now), endTime: '' },
        { handler: '', startTime: '', endTime: '' },
        { handler: '', startTime: '', endTime: '' },
        { handler: '', startTime: '', endTime: '' }
      ],
      formData: {
        step1: { approvalResult: 'approved', auditOpinion: '投保申请已提交' },
        step2: { approvalResult: 'approved', auditOpinion: '资料审核通过' },
        step3: { approvalResult: '', auditOpinion: '' },
        step4: { checkedItems: [], approvalResult: '', auditOpinion: '' },
        step5: { policyNo: '', issueDate: '', policyFile: [], approvalResult: '', auditOpinion: '' },
        step6: { premiumAmount: '', paymentStatus: 'unpaid', paymentReceipt: [], policyDetailFile: [], rateFile: [], approvalResult: '', auditOpinion: '' }
      },
      step2Docs: { applicationForm: true, buyerInfoForm: true },
      planLabels: { planA: '方案A - 短期出口信用保险', planB: '方案B - 中长期出口信用保险', planC: '方案C - 国内贸易信用保险' },
      companyLabels: { company1: '中国出口信用保险公司', company2: '平安财产保险', company3: '太平洋财产保险' }
    })
    task = store.processTasks[0]
  }
  // 核保通过 → 连续推进: 资信调查(step3)完成 → 信用限额审批(step4)完成 → 核保出单(step5)
  store.approveInsuranceTaskStep(row.id + '_flow', {
    handler: '李跟单',
    approvalResult: 'approved',
    auditOpinion: '核保通过，资信调查完成'
  })
  store.approveInsuranceTaskStep(row.id + '_flow', {
    handler: '李跟单',
    approvalResult: 'approved',
    auditOpinion: '核保通过，信用限额审批完成，进入核保出单阶段'
  })
  uwCompleteVisible.value = false
  uwCompleteRow.value = null
}

const handleSyncToPlatform = (row) => {
  const res = store.syncUnderwritingToPlatform(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '同步失败')
    return
  }
  store.touchInsuranceApplications()
  // 确保流程任务存在
  if (!store.processTasks.some(t => t.id === row.id + '_flow')) {
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const fmtDt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    const stepOptions = [
      { label: '提交投保申请', value: 1 },
      { label: '资料审核', value: 2 },
      { label: '资信调查', value: 3 },
      { label: '信用限额审批', value: 4 },
      { label: '核保出单', value: 5 },
      { label: '缴费生效', value: 6 }
    ]
    store.processTasks.unshift({
      id: row.id + '_flow',
      policyNo: row.policyNo || '',
      companyName: row.companyName || '',
      taskType: '投保流程',
      startTime: fmtDt(now),
      endTime: '',
      stepsCompleted: 4,
      currentStep: 5,
      status: 'processing',
      statusName: '进行中',
      stepOptions,
      stepInfo: [
        { handler: row.declarationSignature || row.legalRepresentative || row.contactName || '客户', startTime: fmtDt(now), endTime: fmtDt(now) },
        { handler: '李跟单', startTime: fmtDt(now), endTime: fmtDt(now) },
        { handler: '系统', startTime: fmtDt(now), endTime: fmtDt(now) },
        { handler: '系统', startTime: fmtDt(now), endTime: fmtDt(now) },
        { handler: '', startTime: fmtDt(now), endTime: '' },
        { handler: '', startTime: '', endTime: '' }
      ],
      formData: {
        step1: { approvalResult: 'approved', auditOpinion: '投保申请已提交' },
        step2: { approvalResult: 'approved', auditOpinion: '资料审核通过' },
        step3: { approvalResult: 'approved', auditOpinion: '资信调查完成' },
        step4: { checkedItems: [], approvalResult: 'approved', auditOpinion: '信用限额审批完成' },
        step5: { policyNo: '', issueDate: '', policyFile: [], approvalResult: '', auditOpinion: '' },
        step6: { premiumAmount: '', paymentStatus: 'unpaid', paymentReceipt: [], policyDetailFile: [], rateFile: [], approvalResult: '', auditOpinion: '' }
      },
      step2Docs: { applicationForm: true, buyerInfoForm: true },
      planLabels: { planA: '方案A - 短期出口信用保险', planB: '方案B - 中长期出口信用保险', planC: '方案C - 国内贸易信用保险' },
      companyLabels: { company1: '中国出口信用保险公司', company2: '平安财产保险', company3: '太平洋财产保险' }
    })
  }
  // 同步保单 → 完成核保出单(step5)，推进到缴费生效(step6)
  store.approveInsuranceTaskStep(row.id + '_flow', {
    handler: '跟单员',
    approvalResult: 'approved',
    auditOpinion: '保单已同步至平台，进入缴费生效阶段'
  })
  MessagePlugin.success('保单已同步至平台')
}

const handleClerkConfirmPayment = (row) => {
  if (!row) return
  const app = store.insuranceApplications.find(it => it.id === row.id)
  if (!app) {
    MessagePlugin.error('投保记录不存在')
    return
  }
  if (app.status !== 'payment_uploaded') {
    MessagePlugin.warning('当前状态不允许确认缴费')
    return
  }
  const res = store.activatePolicyByPlatform(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '确认缴费失败')
    return
  }
  store.touchInsuranceApplications()
  // 跟单员确认缴费 → 完成缴费生效(step6)
  store.approveInsuranceTaskStep(row.id + '_flow', {
    handler: '跟单员',
    approvalResult: 'approved',
    auditOpinion: '跟单员已确认缴费凭证，保单生效'
  })
  MessagePlugin.success('缴费已确认，保单已生效')
}

const handlePolicyChange = (row) => { router.push('/policy/change/new?policyNo=' + row.policyNo) }
const handleRenewal = (row) => { currentPolicy.value = row; renewalVisible.value = true }
const handleSurrender = (row) => { currentPolicy.value = row; surrenderVisible.value = true }

const handleRenewalSaved = (data) => {
  if (currentPolicy.value) {
    store.policies = store.policies.map(p =>
      p.policyNo === currentPolicy.value.policyNo
        ? { ...p, renewalFlag: 'yes', status: 'expiring' }
        : p
    )
    MessagePlugin.success('续保申请已记录')
  }
}
const handleSurrenderSaved = (data) => {
  MessagePlugin.success('退保申请已提交，请等待平台审核')
}
// ===== Export =====
const handleExport = () => { exportData.value = filteredData.value; exportVisible.value = true }

const handleExportPolicies = () => {
  const list = store.policies || []
  let content = '保单号\t保险公司\t被保险人\t投保买方\t保险金额\t保费金额\t生效日期\t到期日期\t状态\n'
  list.forEach(p => {
    content += `${p.policyNo}\t${p.insuranceCompany}\t${p.policyholder}\t${p.insured}\t${p.coverageAmount}\t${p.premium}\t${p.effectiveDate}\t${p.expiryDate}\t${policyStatusMap[p.status] || p.status}\n`
  })
  const blob = new Blob(['﻿' + content], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `保单信息_${new Date().toISOString().split('T')[0]}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  MessagePlugin.success('保单导出成功')
}

const generateExcel = () => {
  const headers = [
    { key: 'id', label: '投保编号' }, { key: 'companyName', label: '企业名称' },
    { key: 'buyerName', label: '买方名称' }, { key: 'buyerCountry', label: '买方国别' },
    { key: 'insuranceType', label: '投保类型' }, { key: 'insuranceAmount', label: '投保金额' },
    { key: 'status', label: '状态' }, { key: 'createTime', label: '申请日期' }
  ]
  let content = headers.map(h => h.label).join('\t') + '\n'
  exportData.value.forEach(row => {
    content += headers.map(h => {
      let value = row[h.key]
      if (h.key === 'status') value = statusMap[value] || value
      if (h.key === 'insuranceAmount') value = '$' + (Number(value) || 0).toLocaleString()
      return value || '-'
    }).join('\t') + '\n'
  })
  const blob = new Blob(['﻿' + content], { type: 'application/vnd.ms-excel;charset=utf-8' })
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

const handleSubmitToPlatform = (row) => {
  const res = store.submitOcrToPlatform(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '提交失败')
    return
  }
  MessagePlugin.success('已提交至平台审核')
}

const handleReuploadExternal = (row) => {
  externalUploadVisible.value = true
}

const handleSubmitExternal = (row) => {
  const res = store.submitExternalPolicyForReview(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '提交失败')
    return
  }
  MessagePlugin.success('已提交审核，等待跟单员处理')
}

const handleDeleteExternal = (row) => {
  const res = store.deleteExternalPolicy(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '删除失败')
    return
  }
  MessagePlugin.success('已删除')
}

const handleExternalSubmitToPlatform = (row) => {
  const res = store.submitForPlatformReview(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '提交失败')
    return
  }
  MessagePlugin.success('已提交平台审核')
}

const handleCustomerAuthorizeExternal = (row) => {
  const res = store.clerkAuthorizePolicy(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '授权失败')
    return
  }
  MessagePlugin.success('已授权，跟单员可以继续上传电子保单')
}

const handlePushToPlatformReview = (row) => {
  if (!row.id) return
  const pushRes = store.pushPolicyToPlatformOcr(row.id)
  if (!pushRes?.ok) {
    MessagePlugin.error(pushRes?.message || '推送失败')
    return
  }
  MessagePlugin.success('已推送至平台审核')
}

const handlePlatformApprove = (row) => {
  const res = store.platformApproveExternalPolicy(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '操作失败')
    return
  }
  MessagePlugin.success('审核通过，已推送给跟单员')
  externalDetailVisible.value = false
}

const handleResubmit = (row) => {
  const res = store.resubmitExternalPolicy(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '提交失败')
    return
  }
  MessagePlugin.success('已重新提交审核')
  externalDetailVisible.value = false
}

const handleClerkApproveExternal = (row) => {
  const res = store.approveExternalPolicy(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '操作失败')
    return
  }
  MessagePlugin.success('已通过，外部保单已生效')
  externalDetailVisible.value = false
}

const handleClerkApproveFailedOcr = (row) => {
  const res = store.clerkApproveFailedOcr(row.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '操作失败')
    return
  }
  MessagePlugin.success('已确认生效，电子保单记录已生成')
}

const handleClerkRejectExternal = (row) => {
  externalDetailRow.value = row
  externalClerkRejectReason.value = ''
  externalClerkRejectVisible.value = true
}

const confirmExternalClerkReject = () => {
  if (!externalClerkRejectReason.value.trim()) {
    MessagePlugin.warning('请输入驳回原因')
    return
  }
  const row = externalDetailRow.value
  if (!row) return
  const res = store.rejectExternalPolicy(row.id, externalClerkRejectReason.value)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '驳回失败')
    return
  }
  MessagePlugin.success('已驳回')
  externalClerkRejectVisible.value = false
  externalDetailVisible.value = false
}

const handleExternalPageChange = (pageInfo) => {
  externalPagination.current = pageInfo.current
  externalPagination.pageSize = pageInfo.pageSize
}

// ===== Notifications (站内信) =====
const notificationVisible = ref(false)
const notificationList = computed(() => {
  return (store.notifications || []).filter(n => n.toRole === 'clerk')
})
const unreadNotificationCount = computed(() => {
  return notificationList.value.filter(n => !n.read).length
})

const handleMarkNotificationRead = (notification) => {
  if (!notification.read) {
    notification.read = true
  }
}


// ===== Renewal tab =====
const renewalStatusMap = {
  renew_inkasso_review: '平台审核',
  renew_clerk_review: '跟单员审核',
  renew_insurer_review: '保险公司审核',
  renew_insurer_approved: '保险公司已批准',
  renew_insurer_rejected: '保险公司已驳回',
  renew_supplement: '待补充资料',
  renew_customer_supplement: '客户补充资料',
  renew_customer_supplemented: '补充资料完成',
  renew_platform_review: '平台审核',
  renew_clerk_resubmit: '待重新提交',
  renew_active: '已生效',
  renew_pending_payment: '待缴费',
  renew_payment_uploaded: '凭证已上传',
  renew_payment_verified: '凭证已验证',
  renew_paid: '已缴费'
}

const paymentStatusIcon = (row) => {
  const s = row.paymentStatus || ''
  if (s === 'paid') return '已缴费'
  if (row.status === 'renew_pending_payment') return '待缴费'
  if (row.status === 'renew_payment_uploaded') return '已上传凭证'
  if (row.status === 'renew_payment_verified') return '待同步'
  if (row.status === 'renew_paid') return '已缴费'
  return '-'
}

const renewalColumns = [
  { colKey: 'id', title: '申请编号', width: 160 },
  { colKey: 'policyNo', title: '原保单号', width: 130 },
  { colKey: 'insuranceCompany', title: '保险公司', width: 100 },
  { colKey: 'policyholder', title: '被保险人', ellipsis: true },
  { colKey: 'originalEffectiveDate', title: '原起期', width: 100 },
  { colKey: 'originalExpiryDate', title: '原止期', width: 100 },
  { colKey: 'expectedTurnover', title: '预计营业额', align: 'right', width: 110 },
  { colKey: 'insuranceRatio', title: '投保比例', align: 'right', width: 90 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'paymentStatus', title: '缴费', width: 90, slot: 'paymentStatus' },
  { colKey: 'operation', title: '操作', width: 220, fixed: 'right', slot: 'operation' }
]

const renewalPagination = reactive({ total: 0, current: 1, pageSize: 20 })

const renewalApps = computed(() => store.renewalApplications || [])

const renewalTableData = computed(() => {
  const list = renewalApps.value
  renewalPagination.total = list.length
  const start = (renewalPagination.current - 1) * renewalPagination.pageSize
  return list.slice(start, start + renewalPagination.pageSize)
})

const handleRenewalPageChange = (pageInfo) => {
  renewalPagination.current = pageInfo.current
  renewalPagination.pageSize = pageInfo.pageSize
}

// Renewal detail dialog
const renewalDetailVisible = ref(false)
const renewalDetailRow = ref(null)

const handleRenewalView = (row) => {
  renewalDetailRow.value = row
  renewalDetailVisible.value = true
}

// Insurer approve dialog
const renewalInsurerApproveVisible = ref(false)
const renewalInsurerOpinion = ref('')
const renewalNewPolicyNo = ref('')
let renewalCurrentApproveRow = null

const handleRenewalInsurerApprove = (row) => {
  renewalCurrentApproveRow = row
  renewalInsurerOpinion.value = ''
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  renewalNewPolicyNo.value = `POL${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`
  renewalInsurerApproveVisible.value = true
}

const confirmRenewalInsurerApprove = () => {
  const row = renewalCurrentApproveRow
  if (!row) return
  const res = store.insurerApproveRenewal(row.id, { opinion: renewalInsurerOpinion.value, newPolicyNo: renewalNewPolicyNo.value })
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('续保已批准')
  renewalInsurerApproveVisible.value = false
}

// Insurer reject dialog
const renewalInsurerRejectVisible = ref(false)
const renewalInsurerRejectOpinion = ref('')
let renewalCurrentRejectRow = null

const handleRenewalInsurerReject = (row) => {
  renewalCurrentRejectRow = row
  renewalInsurerRejectOpinion.value = ''
  renewalInsurerRejectVisible.value = true
}

const confirmRenewalInsurerReject = () => {
  const row = renewalCurrentRejectRow
  if (!row) return
  if (!renewalInsurerRejectOpinion.value.trim()) { MessagePlugin.warning('请输入驳回原因'); return }
  const res = store.insurerRejectRenewal(row.id, renewalInsurerRejectOpinion.value)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('续保已驳回')
  renewalInsurerRejectVisible.value = false
}

// Simple action handlers
const handleRenewalGenDocs = (row) => {
  const res = store.generateRenewalDocuments(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('续保资料已生成')
}

const handleRenewalPushClerk = (row) => {
  const res = store.pushRenewalToClerk(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('已推送给跟单员')
}

const handleRenewalClerkApprove = (row) => {
  const res = store.clerkApproveRenewal(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('审核通过，已推送至保险公司审核')
}

const handleRenewalClerkReject = (row) => {
  const reason = prompt('请输入驳回原因')
  if (!reason?.trim()) { MessagePlugin.warning('已取消操作'); return }
  const res = store.clerkRejectRenewal(row.id, reason)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('已驳回')
}

const handleRenewalClerkSync = (row) => {
  const res = store.clerkSyncNewPolicy(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('新保单已同步，状态为已生效')
}

// Supplement flow handlers
const renewalSupplementVisible = ref(false)
const renewalSupplementRow = ref(null)
const renewalSupplementContent = ref('')
const renewalSupplementFiles = ref([])

const handleRenewalInitSupplement = (row) => {
  const res = store.clerkInitiateRenewalSupplement(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('已发起补充请求')
}

const handleRenewalPlatformPushSupplement = (row) => {
  const res = store.platformPushRenewalSupplement(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('已推送客户补充资料')
}

const handleRenewalCustomerSupplement = (row) => {
  renewalSupplementRow.value = row
  renewalSupplementContent.value = ''
  renewalSupplementFiles.value = []
  renewalSupplementVisible.value = true
}

const confirmRenewalSupplement = () => {
  const row = renewalSupplementRow.value
  if (!row || !renewalSupplementContent.value.trim()) { MessagePlugin.warning('请输入补充说明'); return }
  const data = { content: renewalSupplementContent.value, files: renewalSupplementFiles.value || [] }
  const res = store.customerSubmitRenewalSupplement(row.id, data)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('补充资料已提交')
  renewalSupplementVisible.value = false
}

const handleRenewalCustomerPushPlatform = (row) => {
  const res = store.customerPushRenewalToPlatform(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('已推送平台审核')
}

const handleRenewalPlatformApproveSupplement = (row) => {
  const res = store.platformApproveRenewalSupplement(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('审核通过，已推送跟单员')
}

const handleRenewalClerkResubmit = (row) => {
  const res = store.clerkResubmitRenewalToInsurer(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('已提交续保申请')
}

// Payment flow handlers
const handleRenewalPaymentApplication = (row) => {
  const res = store.inkassoNotifyRenewalPayment(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('保费交纳申请已推送客户')
}

const renewalVoucherVisible = ref(false)
const renewalVoucherFiles = ref([])
let renewalCurrentVoucherRow = null

const handleRenewalUploadVoucher = (row) => {
  renewalCurrentVoucherRow = row
  renewalVoucherFiles.value = []
  renewalVoucherVisible.value = true
}

const confirmRenewalVoucher = () => {
  const row = renewalCurrentVoucherRow
  if (!row) return
  if (!renewalVoucherFiles.value.length) { MessagePlugin.warning('请选择缴费凭证'); return }
  const res = store.uploadRenewalVoucher(row.id, renewalVoucherFiles.value)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('缴费凭证已上传')
  renewalVoucherVisible.value = false
}

const handleRenewalVerifyVoucher = (row) => {
  const res = store.inkassoVerifyRenewalVoucher(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('缴费凭证已维护')
}

const handleRenewalSyncPayment = (row) => {
  const res = store.clerkSyncRenewalPayment(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('缴费凭证已同步，状态为已缴费')
}

// ===== Surrender tab =====
const srStatusMap = {
  sr_draft: '退保申请待提交',
  sr_platform_review: '平台审核中',
  sr_clerk_review: '跟单员审核中',
  sr_insurer_review: '保险公司审核中',
  sr_insurer_approved: '保险公司已通过',
  sr_payment_initiated: '退保支付已发起',
  sr_platform_synced: '平台已同步',
  sr_terminated: '保单已终止',
  sr_insurer_rejected: '保险公司已驳回',
  sr_supplement: '待补充材料',
  sr_customer_supplement: '客户补充材料中',
  sr_business_terminated: '退保业务终止'
}

const surrenderColumns = [
  { colKey: 'id', title: '申请编号', width: 160 },
  { colKey: 'policyNo', title: '保单号', width: 140 },
  { colKey: 'companyName', title: '被保险人', ellipsis: true },
  { colKey: 'insuranceCompany', title: '保险公司', width: 100 },
  { colKey: 'coverageAmount', title: '保险金额', align: 'right', width: 120, slot: 'coverageAmount' },
  { colKey: 'status', title: '状态', width: 120, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 260, fixed: 'right', slot: 'operation' }
]

const surrenderPagination = reactive({ total: 0, current: 1, pageSize: 20 })

const surrenderTableData = computed(() => {
  const list = store.surrenderApplications || []
  surrenderPagination.total = list.length
  const start = (surrenderPagination.current - 1) * surrenderPagination.pageSize
  return list.slice(start, start + surrenderPagination.pageSize)
})

const srTotalCount = computed(() => (store.surrenderApplications || []).length)
const srPendingCount = computed(() => (store.surrenderApplications || []).filter(a =>
  ['sr_platform_review', 'sr_clerk_review', 'sr_insurer_review', 'sr_insurer_rejected',
   'sr_supplement', 'sr_customer_supplement'].includes(a.status)
).length)
const srCompletedCount = computed(() => (store.surrenderApplications || []).filter(a =>
  ['sr_terminated', 'sr_business_terminated'].includes(a.status)
).length)

const handleSurrenderPageChange = (pageInfo) => {
  surrenderPagination.current = pageInfo.current
  surrenderPagination.pageSize = pageInfo.pageSize
}

// Surrender dialog state
const srDetailRow = ref(null)
const srDetailVisible = ref(false)
const srInsurerApproveVisible = ref(false)
const srInsurerApproveTarget = ref(null)
const srInsurerApproveForm = reactive({ effectiveDate: '', shortTermRate: 0, refundAmount: 0, netRefundAmount: 0 })
const srInsurerRejectVisible = ref(false)
const srInsurerRejectTarget = ref(null)
const srInsurerRejectReason = ref('')
const srPayVisible = ref(false)
const srPayTarget = ref(null)
const srPayRef = ref('')
const srClerkRejectVisible = ref(false)
const srClerkRejectTarget = ref(null)
const srClerkRejectReason = ref('')
const srSyncVisible = ref(false)
const srSyncTarget = ref(null)
const srSyncRecord = ref('')
const srSupplementVisible = ref(false)
const srSupplementTarget = ref(null)
const srSupplementRequest = ref('')
const srTerminateVisible = ref(false)
const srTerminateTarget = ref(null)
const srTerminateReason = ref('')
const srCustomerSupplementVisible = ref(false)
const srSupplementTargetRef = ref(null)
const srCustomerSupplementContent = ref('')
const srCustomerSupplementFiles = ref([])

// Surrender view detail
const handleSurrenderView = (row) => {
  srDetailRow.value = row
  srDetailVisible.value = true
}

// Surrender generate/delete docs
const handleSurrenderGenDocs = (row, type) => {
  const name = type === 'form' ? '退保申请表' : '材料清单'
  const res = store.generateSurrenderDocs(row.id, type)
  if (!res?.ok) { MessagePlugin.error(res?.message || `生成${name}失败`); return }
  MessagePlugin.success(`${name}已生成`)
}

const handleSurrenderDelDocs = (row, type) => {
  const name = type === 'form' ? '退保申请表' : '材料清单'
  const res = store.deleteSurrenderDocs(row.id, type)
  if (!res?.ok) { MessagePlugin.error(res?.message || `删除${name}失败`); return }
  MessagePlugin.success(`${name}已删除`)
}

// Surrender push to clerk
const handleSurrenderPushClerk = (row) => {
  const res = store.pushSurrenderToClerk(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '推送失败'); return }
  MessagePlugin.success('已推送给跟单员审核')
}

// Surrender push clerk after customer supplement (inkasso → clerk)
const handleSurrenderPushClerkAfterSupplement = (row) => {
  const res = store.pushSurrenderToClerk(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '推送失败'); return }
  MessagePlugin.success('已推送给跟单员确认')
}

// Surrender push customer supplement (from inkasso)
const handleSurrenderPushCustomerSupplement = (row) => {
  const res = store.platformNotifyCustomerSupplement(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('已通知客户补充资料')
}

// Surrender clerk approve/reject
const handleSurrenderClerkApprove = (row) => {
  const res = store.clerkApproveSurrender(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('审核通过，已推送至保险公司审核')
}

const handleSurrenderClerkReject = (row) => {
  srClerkRejectTarget.value = row
  srClerkRejectReason.value = ''
  srClerkRejectVisible.value = true
}

const confirmClerkReject = () => {
  if (!srClerkRejectReason.value.trim()) { MessagePlugin.warning('请填写驳回原因'); return }
  const res = store.clerkRejectSurrender(srClerkRejectTarget.value.id, srClerkRejectReason.value)
  if (!res?.ok) { MessagePlugin.error(res?.message || '驳回失败'); return }
  srClerkRejectVisible.value = false
  MessagePlugin.success('已驳回退保申请')
}

// Surrender insurer approve
const handleSurrenderInsurerApprove = (row) => {
  srInsurerApproveTarget.value = row
  srInsurerApproveForm.effectiveDate = ''
  srInsurerApproveForm.shortTermRate = 0
  srInsurerApproveForm.refundAmount = 0
  srInsurerApproveForm.netRefundAmount = 0
  srInsurerApproveVisible.value = true
}

const confirmInsurerApprove = () => {
  const target = srInsurerApproveTarget.value
  if (!target) return
  if (!srInsurerApproveForm.refundAmount && srInsurerApproveForm.refundAmount !== 0) { MessagePlugin.warning('请填写退保金额'); return }
  const res = store.insurerApproveSurrender(target.id, { ...srInsurerApproveForm })
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  srInsurerApproveVisible.value = false
  MessagePlugin.success('保险公司已批准退保')
}

// Surrender insurer reject
const handleSurrenderInsurerReject = (row) => {
  srInsurerRejectTarget.value = row
  srInsurerRejectReason.value = ''
  srInsurerRejectVisible.value = true
}

const confirmInsurerReject = () => {
  if (!srInsurerRejectReason.value.trim()) { MessagePlugin.warning('请填写驳回原因'); return }
  const res = store.insurerRejectSurrender(srInsurerRejectTarget.value.id, srInsurerRejectReason.value)
  if (!res?.ok) { MessagePlugin.error(res?.message || '驳回失败'); return }
  srInsurerRejectVisible.value = false
  MessagePlugin.success('已驳回退保申请')
}

// Surrender insurer pay
const handleSurrenderInsurerPay = (row) => {
  srPayTarget.value = row
  srPayRef.value = ''
  srPayVisible.value = true
}

const confirmInsurerPay = () => {
  if (!srPayRef.value.trim()) { MessagePlugin.warning('请填写支付参考号'); return }
  const res = store.insurerInitiatePayment(srPayTarget.value.id, { paymentRef: srPayRef.value })
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  srPayVisible.value = false
  MessagePlugin.success('退保支付已发起')
}

// Surrender sync to platform
const handleSurrenderSyncPlatform = (row) => {
  srSyncTarget.value = row
  srSyncRecord.value = '退保金额已核对，已同步至平台'
  srSyncVisible.value = true
}

const confirmSyncPlatform = () => {
  const res = store.clerkSyncSurrenderToPlatform(srSyncTarget.value.id, { syncRecord: srSyncRecord.value })
  if (!res?.ok) { MessagePlugin.error(res?.message || '同步失败'); return }
  srSyncVisible.value = false
  MessagePlugin.success('退保金额已同步至平台')
}

// Surrender customer confirm refund
const handleSurrenderConfirmRefund = (row) => {
  const res = store.customerConfirmRefund(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('退费已确认，保单已终止')
}

// Surrender supplement request (Flow A)
const handleSurrenderInitSupplement = (row) => {
  srSupplementTarget.value = row
  srSupplementRequest.value = ''
  srSupplementVisible.value = true
}

const confirmSupplement = () => {
  if (!srSupplementRequest.value.trim()) { MessagePlugin.warning('请填写补充资料要求'); return }
  const res = store.clerkInitiateSupplement(srSupplementTarget.value.id, srSupplementRequest.value)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  srSupplementVisible.value = false
  MessagePlugin.success('已发起补充资料请求')
}

// Surrender platform supplement
const handleSurrenderPlatformSupplement = (row) => {
  const res = store.platformNotifyCustomerSupplement(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('已推送客户补充资料')
}

// Surrender customer supplement
const handleSurrenderCustomerSupplement = (row) => {
  srSupplementTargetRef.value = row
  srCustomerSupplementContent.value = ''
  srCustomerSupplementFiles.value = []
  srCustomerSupplementVisible.value = true
}

const confirmCustomerSupplement = () => {
  const target = srSupplementTargetRef.value
  if (!target || !srCustomerSupplementContent.value.trim()) { MessagePlugin.warning('请填写补充说明'); return }
  const res = store.customerSubmitSupplement(target.id, {
    supplementNote: srCustomerSupplementContent.value,
    supportingDocs: srCustomerSupplementFiles.value
  })
  if (!res?.ok) { MessagePlugin.error(res?.message || '提交失败'); return }
  srCustomerSupplementVisible.value = false
  MessagePlugin.success('补充资料已提交')
}

// Surrender customer push to platform
const handleSurrenderCustomerPush = (row) => {
  const res = store.customerPushToPlatform(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('已推送平台审核')
}

// Surrender clerk resubmit to insurer
const handleSurrenderResubmitClerk = (row) => {
  const res = store.clerkResubmitToInsurer(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('已重新提交至保险公司审核')
}

// Surrender reject terminate (Flow B)
const handleSurrenderRejectTerminate = (row) => {
  srTerminateTarget.value = row
  srTerminateReason.value = ''
  srTerminateVisible.value = true
}

const confirmTerminate = () => {
  if (!srTerminateReason.value.trim()) { MessagePlugin.warning('请填写终止原因'); return }
  const res = store.clerkRejectTerminate(srTerminateTarget.value.id, srTerminateReason.value)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  srTerminateVisible.value = false
  MessagePlugin.success('退保申请已终止')
}

// ===== Credit Limit Application tab =====
const clAppStatusMap = {
  cl_draft: '限额申请待提交',
  cl_platform_review: '平台审核中',
  cl_clerk_review: '跟单员审核中',
  cl_insurer_review: '保险公司审核中',
  cl_insurer_approved: '保险公司已批准',
  cl_insurer_rejected: '保险公司已驳回',
  cl_quota_recording: '跟单员录入配额中',
  cl_platform_synced: '平台已同步',
  cl_customer_confirm: '客户待确认',
  cl_completed: '已完成'
}
const clAppColumns = [
  { colKey: 'id', title: '申请编号', width: 160 },
  { colKey: 'policyNo', title: '保单号', width: 140 },
  { colKey: 'buyerName', title: '买方名称', ellipsis: true },
  { colKey: 'appliedLimit', title: '申请额度', align: 'right', width: 120, slot: 'appliedLimit' },
  { colKey: 'currency', title: '币种', width: 70 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 280, fixed: 'right', slot: 'operation' }
]
const clAppPagination = reactive({ total: 0, current: 1, pageSize: 20 })
const clAppTableData = computed(() => {
  const list = store.clApplications || []
  clAppPagination.total = list.length
  const start = (clAppPagination.current - 1) * clAppPagination.pageSize
  return list.slice(start, start + clAppPagination.pageSize)
})
const clAppTotalCount = computed(() => (store.clApplications || []).length)
const clAppPendingCount = computed(() => (store.clApplications || []).filter(a => ['cl_platform_review', 'cl_clerk_review', 'cl_insurer_review'].includes(a.status)).length)
const clAppCompletedCount = computed(() => (store.clApplications || []).filter(a => ['cl_completed'].includes(a.status)).length)

const handleClAppPageChange = (pageInfo) => {
  clAppPagination.current = pageInfo.current
  clAppPagination.pageSize = pageInfo.pageSize
}

// Detail view
const clAppDetailRow = ref(null)
const clAppDetailVisible = ref(false)
const handleClAppView = (row) => {
  clAppDetailRow.value = row
  clAppDetailVisible.value = true
}

// Create application
const clAppCreateVisible = ref(false)
const clAppCreateFormRef = ref(null)
const clAppCreateForm = reactive({ policyNo: '', buyerName: '', appliedLimit: '', currency: 'USD', applicationReason: '' })
const clAppCreateRules = {
  policyNo: [{ required: true, message: '请选择保单', type: 'error' }],
  buyerName: [{ required: true, message: '请填写买方名称', type: 'error' }],
  appliedLimit: [{ required: true, message: '请填写申请额度', type: 'error' }]
}
const clAppPolicyOptions = computed(() => {
  return (store.policies || [])
    .filter(p => p.status === 'active' || p.status === 'effective')
    .map(p => ({ value: p.policyNo, label: `${p.policyNo} - ${p.insured || p.policyholder || ''}` }))
})
const handleClAppCreate = () => {
  clAppCreateForm.policyNo = ''
  clAppCreateForm.buyerName = ''
  clAppCreateForm.appliedLimit = ''
  clAppCreateForm.currency = 'USD'
  clAppCreateForm.applicationReason = ''
  clAppCreateVisible.value = true
}
const confirmClAppCreate = () => {
  if (!clAppCreateForm.policyNo) { MessagePlugin.warning('请选择保单'); return }
  if (!clAppCreateForm.buyerName) { MessagePlugin.warning('请填写买方名称'); return }
  if (!clAppCreateForm.appliedLimit) { MessagePlugin.warning('请填写申请额度'); return }
  const res = store.createClApplication(clAppCreateForm.policyNo, { ...clAppCreateForm, appliedLimit: Number(clAppCreateForm.appliedLimit) })
  if (!res?.ok) { MessagePlugin.error(res?.message || '创建失败'); return }
  if (res.overLimitWarning) {
    MessagePlugin.warning('申请额度超出保单总限额，已触发超限预警')
  }
  clAppCreateVisible.value = false
  MessagePlugin.success('限额申请已创建')
}

// Submit to platform
const handleClAppSubmit = (row) => {
  const res = store.submitClToPlatform(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '提交失败'); return }
  MessagePlugin.success('限额申请已提交至平台审核')
}

// Generate docs (platform)
const handleClAppGenDocs = (row) => {
  const res = store.generateClDocuments(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('申请文件已自动生成')
}

// Push to clerk (platform)
const handleClAppPushClerk = (row) => {
  const res = store.pushClToClerk(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '推送失败'); return }
  MessagePlugin.success('已推送跟单员审核')
}

// Clerk approve
const handleClAppClerkApprove = (row) => {
  const res = store.clerkApproveCl(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('审核通过，已递交至保险公司核查')
}

// Clerk reject
const clAppClerkRejectVisible = ref(false)
const clAppClerkRejectTarget = ref(null)
const clAppClerkRejectReason = ref('')
const handleClAppClerkReject = (row) => {
  clAppClerkRejectTarget.value = row
  clAppClerkRejectReason.value = ''
  clAppClerkRejectVisible.value = true
}
const confirmClAppClerkReject = () => {
  if (!clAppClerkRejectReason.value.trim()) { MessagePlugin.warning('请填写驳回原因'); return }
  const res = store.clerkRejectCl(clAppClerkRejectTarget.value.id, clAppClerkRejectReason.value)
  if (!res?.ok) { MessagePlugin.error(res?.message || '驳回失败'); return }
  clAppClerkRejectVisible.value = false
  MessagePlugin.success('已驳回，退回至平台')
}

// Insurer approve
const clAppInsurerApproveVisible = ref(false)
const clAppInsurerApproveTarget = ref(null)
const clAppInsurerApproveFormRef = ref(null)
const clAppInsurerApproveForm = reactive({ approvedLimit: '', approvedRate: '', effectiveDate: '', expiryDate: '', specialConditions: '', insurerOpinion: '' })
const clAppInsurerApproveRules = {
  approvedLimit: [{ required: true, message: '请填写批准额度', type: 'error' }]
}
const handleClAppInsurerApprove = (row) => {
  clAppInsurerApproveTarget.value = row
  clAppInsurerApproveForm.approvedLimit = String(row.appliedLimit || '')
  clAppInsurerApproveForm.approvedRate = ''
  clAppInsurerApproveForm.effectiveDate = ''
  clAppInsurerApproveForm.expiryDate = ''
  clAppInsurerApproveForm.specialConditions = ''
  clAppInsurerApproveForm.insurerOpinion = ''
  clAppInsurerApproveVisible.value = true
}
const confirmClAppInsurerApprove = () => {
  if (!clAppInsurerApproveForm.approvedLimit) { MessagePlugin.warning('请填写批准额度'); return }
  const res = store.insurerApproveCl(clAppInsurerApproveTarget.value.id, { ...clAppInsurerApproveForm, approvedLimit: Number(clAppInsurerApproveForm.approvedLimit), approvedRate: Number(clAppInsurerApproveForm.approvedRate || 0) })
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  clAppInsurerApproveVisible.value = false
  MessagePlugin.success('保险公司已批准限额申请')
}

// Insurer reject
const clAppInsurerRejectVisible = ref(false)
const clAppInsurerRejectTarget = ref(null)
const clAppInsurerRejectFormRef = ref(null)
const clAppInsurerRejectForm = reactive({ rejectType: 'credit_issue', rejectReason: '' })
const clAppInsurerRejectRules = {
  rejectReason: [{ required: true, message: '请填写驳回原因', type: 'error' }]
}
const handleClAppInsurerReject = (row) => {
  clAppInsurerRejectTarget.value = row
  clAppInsurerRejectForm.rejectType = 'credit_issue'
  clAppInsurerRejectForm.rejectReason = ''
  clAppInsurerRejectVisible.value = true
}
const handleClAppRefuseCoverage = (row) => {
  clAppInsurerRejectTarget.value = row
  clAppInsurerRejectForm.rejectType = 'refuse_coverage'
  clAppInsurerRejectForm.rejectReason = ''
  clAppInsurerRejectVisible.value = true
}
const confirmClAppInsurerReject = () => {
  if (!clAppInsurerRejectForm.rejectReason.trim()) { MessagePlugin.warning('请填写驳回原因'); return }
  const res = store.insurerRejectCl(clAppInsurerRejectTarget.value.id, { ...clAppInsurerRejectForm })
  if (!res?.ok) { MessagePlugin.error(res?.message || '驳回失败'); return }
  clAppInsurerRejectVisible.value = false
  MessagePlugin.success('保险公司已驳回限额申请')
}

// Clerk record quota
const clAppQuotaVisible = ref(false)
const clAppQuotaTarget = ref(null)
const clAppRecordedQuota = ref('')
const handleClAppRecordQuota = (row) => {
  clAppQuotaTarget.value = row
  clAppRecordedQuota.value = String(row.approvedLimit || row.appliedLimit || '')
  clAppQuotaVisible.value = true
}
const confirmClAppRecordQuota = () => {
  if (!clAppRecordedQuota.value) { MessagePlugin.warning('请录入配额'); return }
  const res = store.clerkRecordQuota(clAppQuotaTarget.value.id, { recordedQuota: Number(clAppRecordedQuota.value) })
  if (!res?.ok) { MessagePlugin.error(res?.message || '录入失败'); return }
  clAppQuotaVisible.value = false
  MessagePlugin.success('配额已录入')
}

// Clerk sync to platform
const clAppSyncVisible = ref(false)
const clAppSyncTarget = ref(null)
const clAppSyncRecord = ref('')
const handleClAppSync = (row) => {
  clAppSyncTarget.value = row
  clAppSyncRecord.value = '配额已核对，同步至平台'
  clAppSyncVisible.value = true
}
const confirmClAppSync = () => {
  const res = store.clerkSyncToPlatform(clAppSyncTarget.value.id, { syncRecord: clAppSyncRecord.value })
  if (!res?.ok) { MessagePlugin.error(res?.message || '同步失败'); return }
  clAppSyncVisible.value = false
  MessagePlugin.success('配额已同步至平台')
}

// Platform confirm update
const handleClAppPlatformConfirm = (row) => {
  const res = store.platformConfirmUpdate(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('限额数据已更新，新额度已生效')
}

// Platform push reject to customer
const handleClAppPushReject = (row) => {
  const res = store.platformPushClReject(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('驳回结果已推送客户')
}

// Clerk confirm reject
const handleClAppClerkConfirmReject = (row) => {
  const res = store.clerkConfirmReject(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('已确认驳回结果')
}

// Customer confirm reject sync
const handleClAppCustomerConfirmReject = (row) => {
  const res = store.customerConfirmClReject(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('已确认同步，流程结束')
}

onMounted(() => { store.ensureSeeded() })
</script>

<style lang="scss" scoped>
.status-tabs { margin-bottom: 16px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.mb-16 { margin-bottom: 16px; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.table-title { font-size: 16px; font-weight: 600; color: #333; }

.confirm-content { padding: 16px 0; p { margin-bottom: 20px; color: #333; font-size: 14px; line-height: 1.6; } }
.confirm-tip { display: flex; align-items: center; gap: 8px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 10px 14px; margin-top: 16px; }
.tip-icon { color: #f59e0b; &.success { color: #16a34a; } &.danger { color: #dc2626; } }
.tip-text { font-size: 13px; color: #92400e; }
.confirm-tip { &:has(.tip-icon.success) .tip-text { color: #166534; } &:has(.tip-icon.danger) .tip-text { color: #991b1b; } }

.reject-reason-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px 14px;
  margin-top: 12px;
}

.export-modal { padding: 16px; }
.export-filters { margin-bottom: 20px; }
.filter-title, .preview-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 12px; }
.filter-grid { display: flex; flex-wrap: wrap; gap: 12px; }
.filter-item { display: flex; align-items: center; background: #f8f9fa; padding: 8px 12px; border-radius: 4px; }
.filter-label { color: #999; font-size: 13px; }
.filter-value { color: #333; font-size: 13px; font-weight: 500; }
.export-preview { margin-bottom: 20px; }
.preview-table-wrapper { max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 4px; }
.preview-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.preview-table th, .preview-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
.preview-table th { background: #f5f5f5; font-weight: 600; color: #666; position: sticky; top: 0; z-index: 1; }
.preview-table tbody tr:hover { background: #f8f9fa; }
.more-data, .no-data { text-align: center; color: #999; padding: 12px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px; border-top: 1px solid #e0e0e0; }
.breadcrumbs { display: flex; align-items: center; margin-bottom: 16px; font-size: 14px; }
.attachment-section { margin-top: 16px; }
.attachment-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; margin-bottom: 8px; }
.attachment-label { font-size: 14px; color: #333; font-weight: 500; }
.preview-wrapper { max-height: 520px; overflow: auto; resize: both; min-height: 200px; min-width: 400px; border: 1px solid #e0e0e0; border-radius: 4px; padding: 12px; background: #fff; }
.preview-wrapper :deep(table) { border-collapse: collapse; font-size: 12px; white-space: nowrap; }
.preview-wrapper :deep(td) { padding: 5px 8px; border: 1px solid #d0d0d0; max-width: 400px; overflow: hidden; text-overflow: ellipsis; }
.preview-wrapper :deep(th) { padding: 5px 8px; border: 1px solid #d0d0d0; background: #f5f5f5; font-weight: 600; color: #333; text-align: center; white-space: nowrap; }
.preview-wrapper :deep(tr:nth-child(even)) { background: #fafafa; }

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

/* 保单详情弹窗新样式 */
.pd-wrapper { padding: 8px 0; }
.pd-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 14px;
  overflow: hidden;
}
.pd-card-header {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  padding: 12px 18px;
  background: #f1f5f9;
  border-bottom: 1px solid #e5e7eb;
}
.pd-card-body { padding: 14px 18px; }
.pd-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 24px;
}
.pd-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px 0;
}
.pd-label {
  font-size: 12px;
  color: #8a8f9a;
  font-weight: 500;
}
.pd-value {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}
.pd-number { font-weight: 700; color: #0052d9; font-family: 'SF Mono', monospace; }

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
  text-align: left;
  
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

.confirmation-box {
  margin-top: 18px;
  padding: 14px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  margin-bottom: 16px;
  
  :deep(.t-checkbox__label) {
    font-size: 13px;
    color: #475569;
    font-weight: 500;
    line-height: 1.6;
  }
}

.edit-form-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: #fafcff;
  border: 1px solid #e0ecff;
  border-radius: 8px;
  padding: 4px 0;
}
.edit-form-row {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f5ff;
  gap: 12px;
}
.edit-form-row:last-child {
  border-bottom: none;
}
.edit-form-label {
  font-size: 13px;
  color: #333;
  font-weight: 600;
  flex-shrink: 0;
  width: 110px;
  text-align: right;
}
.edit-form-row :deep(.t-input),
.edit-form-row :deep(.t-input-number),
.edit-form-row :deep(.t-select),
.edit-form-row :deep(.t-date-picker) {
  flex: 1;
}
.edit-form-row :deep(.t-input-adornment) {
  flex: 1;
}
.uw-modal {
  padding: 8px 0;
  .uw-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .uw-row {
    display: flex;
    align-items: center;
    gap: 12px;
    .uw-label {
      min-width: 90px;
      font-size: 13px;
      color: #333;
      font-weight: 600;
      flex-shrink: 0;
    }
    :deep(.t-input),
    :deep(.t-input-number),
    :deep(.t-select),
    :deep(.t-textarea) {
      flex: 1;
    }
    :deep(.t-input-adornment) {
      flex: 1;
    }
  }
  .uw-attachments {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #eee;
  }
  .uw-attach-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    .uw-label {
      min-width: 110px;
      font-size: 13px;
      color: #333;
      font-weight: 600;
      flex-shrink: 0;
    }
    :deep(.t-upload) {
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

.edit-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: #0052d9;
  background: #e6f0ff;
  padding: 1px 8px;
  border-radius: 4px;
  margin-left: 8px;
  vertical-align: middle;
}

/* ===== External Policy Detail ===== */
.external-detail-body {
  padding: 8px 0;
  max-height: 68vh;
  overflow-y: auto;
}
.external-detail-body::-webkit-scrollbar { width: 6px; }
.external-detail-body::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
.external-detail-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

.detail-card {
  margin-bottom: 20px;
  background: #f8fafc;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid #eef2f6;
}
.detail-card:last-of-type { margin-bottom: 0; }

.detail-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 14px;
  padding-left: 10px;
  border-left: 3px solid #0052d9;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid #eef2f6;
}
.file-card-body { min-width: 0; }
.file-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  word-break: break-all;
}
.file-card-meta {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eef2f6;
  overflow: hidden;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #f5f7fa;
  border-right: 1px solid #f5f7fa;
}
.detail-row:nth-child(even) { border-right: none; }
.detail-row:nth-last-child(2):not(:nth-child(even)) { border-bottom: none; }
.detail-row:last-child { border-bottom: none; }
.detail-row:only-child { border-right: none; }
/* When odd number of items, last item spans full width */
.detail-row:last-child:nth-child(odd) {
  grid-column: 1 / -1;
  border-right: none;
}

.detail-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
}
.detail-value {
  font-size: 13px;
  color: #1e293b;
  font-weight: 600;
  text-align: right;
  margin-left: 12px;
  word-break: break-all;
}
.detail-value-currency {
  font-family: "SF Mono", "Monaco", "Menlo", monospace;
}
.detail-value-long {
  max-width: 65%;
  line-height: 1.6;
  word-break: break-word;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}
.notification-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}
.notification-item:hover {
  background: #f5f5f5;
}
.notification-item.unread {
  background: #f0f9ff;
  border-left: 3px solid #1890ff;
}
.notification-item.unread:hover {
  background: #e6f7ff;
}
.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.notif-type {
  font-size: 12px;
  color: #1890ff;
  background: #e6f7ff;
  padding: 2px 8px;
  border-radius: 4px;
}
.notif-time {
  font-size: 12px;
  color: #999;
}
.notif-body {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.clerk-flow-section {
  margin-bottom: 16px;
}
.clerk-flow-progress {
  margin: 16px 0 8px;
  overflow-x: auto;
}
.clerk-flow-steps {
  display: flex;
  align-items: flex-start;
  min-width: 660px;
  padding: 8px 0;
}
.clerk-flow-step-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 80px;
}
.clerk-flow-step-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  background: #f0f0f0;
  color: #999;
  transition: all 0.3s;
  flex-shrink: 0;
}
.clerk-flow-step-dot.completed {
  background: #00a870;
  color: #fff;
}
.clerk-flow-step-dot.active {
  background: #0052d9;
  color: #fff;
  box-shadow: 0 0 0 3px rgba(0, 82, 217, 0.15);
}
.clerk-flow-step-num,
.clerk-flow-step-check {
  line-height: 1;
}
.clerk-flow-step-label {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: center;
  font-weight: 500;
}
.clerk-flow-step-label.active {
  color: #0052d9;
  font-weight: 600;
}
.clerk-flow-step-label.completed {
  color: #00a870;
}
.clerk-flow-step-status {
  margin-top: 4px;
}
.clerk-flow-step-role {
  margin-top: 4px;
}
.clerk-flow-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 6px;
  color: #d0d0d0;
  flex-shrink: 0;
}
.clerk-flow-arrow.completed {
  color: #00a870;
}
.clerk-flow-step-info {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.clerk-flow-step-handler {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
}
.clerk-flow-step-time {
  font-size: 10px;
  color: #999;
  white-space: nowrap;
}


/* ===== Change dialog common styles ===== */
.detail-body { padding: 8px 0; }
.reject-content { padding: 8px 0; }
.reject-form { margin-top: 12px; }
.reject-label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 8px; }
.insurer-content, .record-content, .supplement-content { padding: 8px 0; }
.mb-16 { margin-bottom: 16px; }
.doc-preview-wrapper { max-height: 70vh; overflow-y: auto; }
.doc-preview-header { display: flex; gap: 24px; padding: 12px 16px; background: #f8f9fa; border: 1px solid #eef2f6; border-radius: 6px; margin-bottom: 16px; }
.doc-preview-meta { font-size: 12px; color: #64748b; }
.doc-preview-body { border: 1px solid #eef2f6; border-radius: 6px; overflow: hidden; background: #fff; }
.supplement-entry { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; }
.supplement-entry:last-child { border-bottom: none; }
.supplement-entry-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.supplement-time { font-size: 12px; color: #94a3b8; }
.supplement-entry-body { padding-left: 4px; }
.supplement-entry-row { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 4px; }
.supplement-entry-row .detail-label { white-space: nowrap; }
.supplement-entry-row .detail-value { text-align: left; font-weight: 400; }
</style>
