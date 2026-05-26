<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/policy/list">保单管理</t-breadcrumb-item>
        <t-breadcrumb-item>委托合同签署</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">委托合同签署管理</div>
      <div class="page-header-actions">
        <span class="role-badge-tip">{{ roleTip }}</span>
      </div>
    </div>

    <!-- Customer: Eligible Policies for Initiation -->
    <t-card v-if="isCustomer && eligiblePolicies.length > 0" class="eligible-card" title="可发起委托合同签署">
      <template #actions>
        <t-link theme="primary" @click="eligibleExpanded = !eligibleExpanded">
          {{ eligibleExpanded ? '收起' : '展开' }}
        </t-link>
      </template>
      <div v-if="eligibleExpanded" class="eligible-list">
        <div v-for="item in eligiblePolicies" :key="item.id" class="eligible-item">
          <div class="eligible-info">
            <div class="eligible-main">
              <span class="eligible-policy">{{ item.policyNo }}</span>
              <span class="eligible-company">{{ item.insured }}</span>
            </div>
            <div class="eligible-details">
              <span>保险金额：${{ Number(item.coverageAmount || 0).toLocaleString() }}</span>
              <span>保费：${{ Number(item.premium || 0).toLocaleString() }}</span>
              <span>保险公司：{{ item.insuranceCompany }}</span>
            </div>
          </div>
          <t-button theme="primary" @click="handleInitiateContract(item)">发起委托合同签署申请</t-button>
        </div>
      </div>
    </t-card>

    <!-- Flow Status Steps -->
    <t-card v-if="currentFlowContract" class="flow-card" title="流程进度">
      <div class="flow-steps">
        <div
          v-for="(step, si) in flowSteps"
          :key="si"
          class="flow-step"
          :class="{ active: step.active, done: step.done }"
        >
          <div class="flow-step-icon" :class="`step-icon-${step.key}`">
            <t-icon v-if="step.done" name="check-circle-filled" />
            <t-icon v-else-if="step.active" name="loading" />
            <t-icon v-else name="file-copy" />
          </div>
          <div class="flow-step-body">
            <div class="flow-step-title">{{ step.title }}</div>
            <div class="flow-step-desc">{{ step.desc }}</div>
            <div v-if="step.time" class="flow-step-time">{{ step.time }}</div>
          </div>
        </div>
      </div>
    </t-card>

    <!-- Contract List -->
    <t-card class="contract-list-card">
      <t-table
        :data="contractList"
        :columns="contractColumns"
        row-key="id"
        hover
        stripe
      >
        <template #coverageAmount="{ row }">
          <span>${{ Number(row.coverageAmount || 0).toLocaleString() }}</span>
        </template>
        <template #premium="{ row }">
          <span>${{ Number(row.premium || 0).toLocaleString() }}</span>
        </template>
        <template #status="{ row }">
          <t-tag :theme="contractStatusTheme(row.status)" variant="light">{{ contractStatusLabel(row.status) }}</t-tag>
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-link v-if="isInkasso && row.status === 'pending_inkasso_sign'" theme="primary" @click="handleEsign(row)">在线签署盖章</t-link>
            <t-link v-if="isCustomer && row.status === 'inkasso_signed'" theme="primary" @click="handleQrPay(row)">去支付</t-link>
            <t-link v-if="isClerk && row.status === 'inkasso_signed'" theme="primary" @click="handleSubmitUnderwriting(row)">提交材料</t-link>
            <t-link v-if="isClerk && row.status === 'paid'" theme="primary" @click="handleSubmitUnderwriting(row)">提交核保</t-link>
            <t-link v-if="isClerk && row.status === 'underwriting_submitted'" theme="primary" @click="handleConfirmPolicyIssued(row)">确认出具保单</t-link>
            <t-link v-if="isInkasso && row.status === 'policy_issued'" theme="primary" @click="handleUploadPolicyInfo(row)">上传保单信息</t-link>
            <t-link v-if="isCustomer && row.status === 'policy_info_uploaded'" theme="primary" @click="handleUploadReceipt(row)">上传缴费凭证</t-link>
            <t-link v-if="isInkasso && row.status === 'offline_paid'" theme="primary" @click="handleActivateInsurance(row)">确认保险生效</t-link>
            <t-link @click="handleViewContract(row)">查看</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <!-- ====== Inkasso E-signature Dialog ====== -->
    <t-dialog
      v-model:visible="esignVisible"
      header="电子签章 - 在线签署合同"
      width="680px"
      :footer="false"
      :destroy-on-close="true"
    >
      <div v-if="esignContract" class="esign-body">
        <div class="esign-summary">
          <div class="info-grid">
            <div class="info-row"><span class="info-label">保单号</span><span class="info-value">{{ esignContract.policyNo }}</span></div>
            <div class="info-row"><span class="info-label">被保险人</span><span class="info-value">{{ esignContract.companyName }}</span></div>
            <div class="info-row"><span class="info-label">投保买方</span><span class="info-value">{{ esignContract.insuredName }}</span></div>
            <div class="info-row"><span class="info-label">保险金额</span><span class="info-value">${{ Number(esignContract.coverageAmount || 0).toLocaleString() }}</span></div>
          </div>
        </div>

        <t-alert message="请确认合同信息无误后，调用电子签章服务完成在线签署盖章。" theme="info" class="esign-alert" />

        <div class="esign-seal-area">
          <div class="seal-placeholder" :class="{ 'seal-active': esignStatus === 'signing' }">
            <div v-if="esignStatus === 'idle'" class="seal-prompt">
              <t-icon name="stamp" size="48px" style="color: #b0b0b0;" />
              <p>点击下方按钮调用电子签章服务</p>
            </div>
            <div v-if="esignStatus === 'signing'" class="seal-signing">
              <t-loading :loading="true" size="large" />
              <p>正在调用电子签章服务...</p>
              <p class="seal-sub-text">CA数字证书验证中，请稍候</p>
            </div>
            <div v-if="esignStatus === 'done'" class="seal-done">
              <div class="seal-stamp">
                <div class="seal-circle">
                  <div class="seal-text">长安银科<br/>电子签章</div>
                  <div class="seal-date">{{ esignDate }}</div>
                </div>
              </div>
              <p class="seal-success-text">电子签章已完成</p>
              <p class="seal-sub-text">合同已具备法律效力</p>
            </div>
          </div>
        </div>

        <div class="esign-actions">
          <t-button variant="outline" @click="esignVisible = false" :disabled="esignStatus === 'signing'">取消</t-button>
          <t-button
            v-if="esignStatus === 'idle'"
            theme="primary"
            @click="handleEsignStart"
          >调用电子签章</t-button>
          <t-button
            v-if="esignStatus === 'done'"
            theme="primary"
            @click="handleEsignComplete"
          >签署完成</t-button>
        </div>
      </div>
    </t-dialog>

    <!-- ====== Customer QR Payment Dialog ====== -->
    <t-dialog
      v-model:visible="qrPayVisible"
      :header="`扫码支付 - ${qrContract?.policyNo || ''}`"
      width="520px"
      :footer="false"
      :destroy-on-close="true"
    >
      <div v-if="qrContract" class="qrpay-body">
        <div class="qrpay-amount">
          <span class="qrpay-label">应付保费</span>
          <span class="qrpay-value">${{ Number(qrContract.premium || 0).toLocaleString() }}</span>
          <span class="qrpay-currency">USD</span>
        </div>

        <div class="qr-code-area">
          <div class="qr-code-frame">
            <div class="qr-code-mock">
              <div class="qr-inner">
                <div class="qr-logo">CAYK</div>
                <div class="qr-pattern">
                  <div v-for="i in 80" :key="i" class="qr-dot" :class="{ dark: Math.random() > 0.6 }" />
                </div>
              </div>
            </div>
          </div>
          <p class="qr-hint">请使用微信或支付宝扫描二维码支付</p>
          <p class="qr-policy">保单：{{ qrContract.policyNo }} | 收款：长安银科</p>
        </div>

        <div class="qrpay-info">
          <div class="info-row"><span class="info-label">收款银行</span><span class="info-value">中国工商银行西安高新技术产业开发区支行</span></div>
          <div class="info-row"><span class="info-label">收款户名</span><span class="info-value">长安银科商业保理有限公司</span></div>
          <div class="info-row"><span class="info-label">收款账号</span><span class="info-value">3700 0235 1920 0123 456</span></div>
        </div>

        <div class="qrpay-actions">
          <t-button variant="outline" @click="qrPayVisible = false">取消支付</t-button>
          <t-button theme="primary" @click="handleQrPaySimulate" :loading="qrPaying">模拟扫码支付完成</t-button>
        </div>

        <!-- Payment result -->
        <t-dialog v-model:visible="qrResultVisible" :header="qrSuccess ? '支付成功' : '支付失败'" width="380px" :footer="false" :close-btn="false">
          <div class="qr-result">
            <t-icon v-if="qrSuccess" name="check-circle-filled" size="56px" style="color: #00a870;" />
            <t-icon v-else name="close-circle-filled" size="56px" style="color: #dc2626;" />
            <p class="qr-result-text">{{ qrSuccess ? '保费支付已完成' : '支付失败，请重试' }}</p>
            <p class="qr-result-detail" v-if="qrSuccess">${{ Number(qrContract.premium || 0).toLocaleString() }} USD</p>
          </div>
          <div class="modal-footer">
            <t-button v-if="qrSuccess" theme="primary" @click="handleQrDone">完成</t-button>
            <t-button v-else theme="primary" @click="qrResultVisible = false; qrPaying = false">重新支付</t-button>
          </div>
        </t-dialog>
      </div>
    </t-dialog>

    <!-- ====== Clerk Underwriting Dialog ====== -->
    <t-dialog
      v-model:visible="underwritingVisible"
      header="提交核保 - 向保险公司提交投保材料"
      width="600px"
      :footer="false"
      :destroy-on-close="true"
    >
      <div v-if="underwritingContract" class="underwriting-body">
        <div class="info-grid">
          <div class="info-row"><span class="info-label">保单号</span><span class="info-value">{{ underwritingContract.policyNo }}</span></div>
          <div class="info-row"><span class="info-label">被保险人</span><span class="info-value">{{ underwritingContract.companyName }}</span></div>
          <div class="info-row"><span class="info-label">保险公司</span><span class="info-value">{{ underwritingContract.insuranceCompany }}</span></div>
          <div class="info-row"><span class="info-label">保费金额</span><span class="info-value">${{ Number(underwritingContract.premium || 0).toLocaleString() }}</span></div>
          <div class="info-row"><span class="info-label">支付状态</span><span class="info-value" style="color: #00a870;">已支付</span></div>
        </div>

        <div class="underwriting-section">
          <div class="section-title">核保材料清单</div>
          <t-checkbox-group v-model="underwritingDocs" class="underwriting-docs">
            <t-checkbox value="application">投保申请书</t-checkbox>
            <t-checkbox value="contract">已签署合同</t-checkbox>
            <t-checkbox value="paymentReceipt">保费支付凭证</t-checkbox>
            <t-checkbox value="tradeContract">贸易合同副本</t-checkbox>
            <t-checkbox value="buyerInfo">买方资信报告</t-checkbox>
            <t-checkbox value="invoice">商业发票</t-checkbox>
          </t-checkbox-group>
        </div>

        <div class="underwriting-section">
          <div class="section-title">备注说明</div>
          <t-textarea v-model="underwritingNote" placeholder="请输入核保备注信息（选填）" :rows="3" />
        </div>

        <div class="modal-footer">
          <t-button variant="outline" @click="underwritingVisible = false">取消</t-button>
          <t-button theme="primary" @click="handleUnderwritingSubmit" :loading="underwritingLoading">确认提交核保</t-button>
        </div>
      </div>
    </t-dialog>

    <!-- ====== Inkasso: Policy Info Upload Dialog ====== -->
    <t-dialog
      v-model:visible="policyUploadVisible"
      header="上传保单信息 - 保单数字化整理"
      width="800px"
      :footer="false"
      :destroy-on-close="true"
    >
      <div v-if="policyUploadContract" class="policy-upload-body">
        <t-alert message="请将保险公司出具的保单文件上传至系统，完成保单数字化归档" theme="info" class="upload-alert" />

        <div class="form-section">
          <div class="section-title">保单文件上传</div>
          <t-form label-width="120">
            <t-form-item label="保单文件">
              <t-upload v-model="policyInfoForm.policyFile" :files="[]" placeholder="上传保险公司出具的保单PDF文件" accept=".pdf" theme="file" />
            </t-form-item>
            <t-form-item label="批单文件">
              <t-upload v-model="policyInfoForm.endorsementFile" :files="[]" placeholder="上传批单文件（选填）" accept=".pdf" theme="file" />
            </t-form-item>
          </t-form>
        </div>

        <div class="form-section">
          <div class="section-title">保单基本信息</div>
          <t-form label-width="140">
            <t-form-item label="保险公司">
              <t-input v-model="policyInfoForm.insuranceCompanyName" placeholder="请输入保险公司名称" />
            </t-form-item>
            <t-form-item label="保险人">
              <t-input v-model="policyInfoForm.insurerName" placeholder="请输入保险人（分公司）" />
            </t-form-item>
            <t-form-item label="被保险人">
              <t-input v-model="policyInfoForm.insuredName" readonly />
            </t-form-item>
            <t-form-item label="受益人">
              <t-input v-model="policyInfoForm.beneficiaryName" placeholder="请输入受益人" />
            </t-form-item>
            <t-form-item label="保单起期">
              <t-date-picker v-model="policyInfoForm.policyStartDate" placeholder="选择保险起期" />
            </t-form-item>
            <t-form-item label="保单止期">
              <t-date-picker v-model="policyInfoForm.policyEndDate" placeholder="选择保险止期" />
            </t-form-item>
            <t-form-item label="保险期限">
              <t-select v-model="policyInfoForm.policyPeriod">
                <t-option value="6个月" label="6个月" />
                <t-option value="12个月" label="12个月" />
                <t-option value="24个月" label="24个月" />
              </t-select>
            </t-form-item>
            <t-form-item label="是否可续保">
              <t-radio-group v-model="policyInfoForm.renewalFlag">
                <t-radio value="是">是</t-radio>
                <t-radio value="否">否</t-radio>
              </t-radio-group>
            </t-form-item>
          </t-form>
        </div>

        <div class="form-section">
          <div class="section-title">承保范围与条款</div>
          <t-form label-width="140">
            <t-form-item label="约定承保范围">
              <t-select v-model="policyInfoForm.agreedCoverageScope">
                <t-option value="全部适保业务" label="全部适保业务" />
                <t-option value="部分适保业务-全部非信用证" label="部分适保业务-全部非信用证" />
                <t-option value="部分适保业务-指定买方" label="部分适保业务-指定买方" />
              </t-select>
            </t-form-item>
            <t-form-item label="贸易类型">
              <t-select v-model="policyInfoForm.tradeBusinessType">
                <t-option value="货物贸易" label="货物贸易" />
                <t-option value="服务贸易" label="服务贸易" />
              </t-select>
            </t-form-item>
            <t-form-item label="承保风险">
              <t-textarea v-model="policyInfoForm.coveredRisks" :rows="2" placeholder="请输入承保风险描述" />
            </t-form-item>
            <t-form-item label="条款版本">
              <t-input v-model="policyInfoForm.clauseVersion" placeholder="如：短期出口信用保险条款v2025" />
            </t-form-item>
            <t-form-item label="国家风险版本">
              <t-input v-model="policyInfoForm.countryRiskVersion" placeholder="如：2026版" />
            </t-form-item>
          </t-form>
        </div>

        <div class="form-section">
          <div class="section-title">责任限额</div>
          <t-form label-width="140">
            <t-form-item label="最高赔偿限额">
              <t-input-adornment prepend="$">
                <t-input v-model="policyInfoForm.maxCompensationLimit" type="number" placeholder="请输入最高赔偿限额" />
              </t-input-adornment>
            </t-form-item>
            <t-form-item label="买方信用限额">
              <t-input-adornment prepend="$">
                <t-input v-model="policyInfoForm.buyerCreditLimit" type="number" placeholder="请输入买方信用限额" />
              </t-input-adornment>
            </t-form-item>
            <t-form-item label="自行掌握限额">
              <t-input v-model="policyInfoForm.selfControlledLimit" placeholder="条件与金额描述" />
            </t-form-item>
            <t-form-item label="免赔额">
              <t-input-adornment prepend="$">
                <t-input v-model="policyInfoForm.deductible" type="number" placeholder="请输入免赔额" />
              </t-input-adornment>
            </t-form-item>
            <t-form-item label="限额闲置期">
              <t-input v-model="policyInfoForm.limitIdlePeriod" type="number">
                <template #suffix>天</template>
              </t-input>
            </t-form-item>
          </t-form>
        </div>

        <div class="form-section">
          <div class="section-title">申报规则</div>
          <t-form label-width="140">
            <t-form-item label="申报方式">
              <t-select v-model="policyInfoForm.declarationMethod">
                <t-option value="月度申报" label="月度申报" />
                <t-option value="逐笔申报" label="逐笔申报" />
              </t-select>
            </t-form-item>
            <t-form-item label="申报周期">
              <t-input v-model="policyInfoForm.declarationCycle" placeholder="如：月度" />
            </t-form-item>
            <t-form-item label="申报截止日">
              <t-input v-model="policyInfoForm.declarationDeadline" placeholder="如：次月15日" />
            </t-form-item>
          </t-form>
        </div>

        <div class="form-section">
          <div class="section-title">费用信息</div>
          <t-form label-width="140">
            <t-form-item label="费率">
              <t-input-adornment prepend="%">
                <t-input v-model="policyInfoForm.premiumRate" type="number" placeholder="请输入费率" />
              </t-input-adornment>
            </t-form-item>
            <t-form-item label="保费金额">
              <t-input-adornment prepend="$">
                <t-input v-model="policyInfoForm.premium" type="number" readonly />
              </t-input-adornment>
            </t-form-item>
            <t-form-item label="保费支付方式">
              <t-select v-model="policyInfoForm.premiumPaymentMethod">
                <t-option value="一次性" label="一次性支付" />
                <t-option value="分期" label="分期支付" />
              </t-select>
            </t-form-item>
            <t-form-item label="保费支付截止日">
              <t-input v-model="policyInfoForm.premiumPaymentDeadline" placeholder="如：保险起期前30日" />
            </t-form-item>
            <t-form-item label="退保手续费">
              <t-input v-model="policyInfoForm.surrenderFee" placeholder="退保手续费说明" />
            </t-form-item>
            <t-form-item label="追偿款收款人">
              <t-input v-model="policyInfoForm.recoveryPayee" />
            </t-form-item>
          </t-form>
        </div>

        <div class="modal-footer">
          <t-button variant="outline" @click="policyUploadVisible = false">取消</t-button>
          <t-button theme="primary" @click="handlePolicyUploadSubmit" :loading="policyUploadLoading">确认上传</t-button>
        </div>
      </div>
    </t-dialog>

    <!-- ====== Customer: Payment Receipt Upload Dialog ====== -->
    <t-dialog
      v-model:visible="receiptUploadVisible"
      :header="`上传缴费凭证 - ${receiptUploadContract?.policyNo || ''}`"
      width="500px"
      :footer="false"
      :destroy-on-close="true"
    >
      <div v-if="receiptUploadContract" class="receipt-body">
        <div class="receipt-amount">
          <span class="receipt-label">应付保费</span>
          <span class="receipt-value">${{ Number(receiptUploadContract.premium || 0).toLocaleString() }}</span>
          <span class="receipt-currency">USD</span>
        </div>

        <t-alert message="请将线下支付的保费缴费凭证上传至平台，以便平台确认保险生效" theme="info" class="receipt-alert" />

        <div class="form-section">
          <t-form label-width="100">
            <t-form-item label="支付方式">
              <t-select v-model="receiptForm.paymentMethod">
                <t-option value="bank_transfer" label="银行转账" />
                <t-option value="cash" label="现金支付" />
                <t-option value="online" label="网银支付" />
              </t-select>
            </t-form-item>
            <t-form-item label="缴费凭证">
              <t-upload v-model="receiptForm.files" placeholder="上传缴费凭证（支持jpg、png、pdf）" accept=".jpg,.png,.pdf" theme="file" />
            </t-form-item>
            <t-form-item label="备注说明">
              <t-textarea v-model="receiptForm.remark" placeholder="选填" :rows="2" />
            </t-form-item>
          </t-form>
        </div>

        <div class="modal-footer">
          <t-button variant="outline" @click="receiptUploadVisible = false">取消</t-button>
          <t-button theme="primary" @click="handleReceiptSubmit" :loading="receiptUploadLoading">提交凭证</t-button>
        </div>
      </div>
    </t-dialog>

    <!-- ====== Inkasso: Insurance Activation Dialog ====== -->
    <t-dialog
      v-model:visible="activateVisible"
      header="确认保险生效"
      width="480px"
      :footer="false"
      :destroy-on-close="true"
    >
      <div v-if="activateContract" class="activate-body">
        <div class="activate-icon">
          <t-icon name="check-circle-filled" size="64px" style="color: #00a870;" />
        </div>
        <p class="activate-title">确认保险生效</p>
        <p class="activate-desc">请确认客户（{{ activateContract.companyName }}）已完成线下保费支付，缴费凭证已核实无误。</p>

        <div class="activate-info">
          <div class="info-row"><span class="info-label">保单号</span><span class="info-value">{{ activateContract.policyNo }}</span></div>
          <div class="info-row"><span class="info-label">被保险人</span><span class="info-value">{{ activateContract.companyName }}</span></div>
          <div class="info-row"><span class="info-label">保险金额</span><span class="info-value">${{ Number(activateContract.coverageAmount || 0).toLocaleString() }}</span></div>
          <div class="info-row"><span class="info-label">保费金额</span><span class="info-value">${{ Number(activateContract.premium || 0).toLocaleString() }}</span></div>
        </div>

        <t-alert message="确认生效后，保险责任将正式开始，保单进入有效状态" theme="warning" class="activate-alert" />

        <div class="modal-footer">
          <t-button variant="outline" @click="activateVisible = false">取消</t-button>
          <t-button theme="primary" @click="handleActivateConfirm" :loading="activateLoading">确认保险生效</t-button>
        </div>
      </div>
    </t-dialog>

    <!-- ====== Contract View Dialog ====== -->
    <t-dialog v-model:visible="viewVisible" :header="`合同详情 - ${viewContract?.policyNo || ''}`" width="720px" :footer="false" :close-btn="false" destroy-on-close>
      <div v-if="viewContract" class="contract-view">
        <div class="contract-section">
          <div class="section-title">基本信息</div>
          <div class="info-grid">
            <div class="info-row"><span class="info-label">合同编号</span><span class="info-value">{{ viewContract.id }}</span></div>
            <div class="info-row"><span class="info-label">保单号</span><span class="info-value">{{ viewContract.policyNo }}</span></div>
            <div class="info-row"><span class="info-label">保险公司</span><span class="info-value">{{ viewContract.insuranceCompany }}</span></div>
            <div class="info-row"><span class="info-label">被保险人</span><span class="info-value">{{ viewContract.companyName }}</span></div>
            <div class="info-row"><span class="info-label">投保买方</span><span class="info-value">{{ viewContract.insuredName }}</span></div>
          </div>
        </div>
        <div class="contract-section">
          <div class="section-title">金额与期限</div>
          <div class="info-grid">
            <div class="info-row"><span class="info-label">保险金额</span><span class="info-value">${{ Number(viewContract.coverageAmount || 0).toLocaleString() }}</span></div>
            <div class="info-row"><span class="info-label">保费金额</span><span class="info-value">${{ Number(viewContract.premium || 0).toLocaleString() }}</span></div>
            <div class="info-row"><span class="info-label">生效日期</span><span class="info-value">{{ viewContract.policyStartDate }}</span></div>
            <div class="info-row"><span class="info-label">到期日期</span><span class="info-value">{{ viewContract.policyEndDate }}</span></div>
          </div>
        </div>
        <div class="contract-section">
          <div class="section-title">流程状态</div>
          <div class="info-grid">
            <div class="info-row"><span class="info-label">当前步骤</span><span class="info-value">{{ currentStepLabel(viewContract.status) }}</span></div>
            <div class="info-row"><span class="info-label">合同状态</span><span class="info-value"><t-tag :theme="contractStatusTheme(viewContract.status)" variant="light">{{ contractStatusLabel(viewContract.status) }}</t-tag></span></div>
            <div class="info-row" v-if="viewContract.signDate"><span class="info-label">平台签署时间</span><span class="info-value">{{ viewContract.signDate }}</span></div>
            <div class="info-row" v-if="viewContract.signatory"><span class="info-label">签署方</span><span class="info-value">{{ viewContract.signatory }}</span></div>
            <div class="info-row" v-if="viewContract.paymentDate"><span class="info-label">支付时间</span><span class="info-value">{{ viewContract.paymentDate }}</span></div>
            <div class="info-row" v-if="viewContract.underwritingDate"><span class="info-label">核保提交时间</span><span class="info-value">{{ viewContract.underwritingDate }}</span></div>
            <div class="info-row" v-if="viewContract.policyIssuedDate"><span class="info-label">保单出具时间</span><span class="info-value">{{ viewContract.policyIssuedDate }}</span></div>
            <div class="info-row" v-if="viewContract.policyInfoUploadDate"><span class="info-label">保单信息上传时间</span><span class="info-value">{{ viewContract.policyInfoUploadDate }}</span></div>
            <div class="info-row" v-if="viewContract.offlinePaymentDate"><span class="info-label">线下缴费时间</span><span class="info-value">{{ viewContract.offlinePaymentDate }}</span></div>
            <div class="info-row" v-if="viewContract.insuranceActiveDate"><span class="info-label">保险生效时间</span><span class="info-value">{{ viewContract.insuranceActiveDate }}</span></div>
          </div>
        </div>
        <div class="modal-footer">
          <t-button variant="outline" @click="viewVisible = false">关闭</t-button>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { useBusinessStore } from '@/stores/business'
import { useUserStore } from '@/stores/user'

const store = useBusinessStore()
const userStore = useUserStore()

// ====== Role helpers ======
const isCustomer = computed(() => userStore.role === 'customer')
const isInkasso = computed(() => userStore.role === 'inkasso')
const isClerk = computed(() => userStore.role === 'clerk')

const roleTip = computed(() => {
  if (isCustomer.value) return '当前视图：客户 — 发起签署 → 扫码支付 → 上传缴费凭证'
  if (isInkasso.value) return '当前视图：长安银科 — 电子签章签署合同 → 上传保单信息 → 确认保险生效'
  return '当前视图：跟单员 — 提交核保 → 确认保单出具'
})

// ====== Flow status steps ======
const currentFlowContract = ref(null)
const flowSteps = computed(() => {
  const c = currentFlowContract.value
  if (!c) return []
  const doneStatuses = ['inkasso_signed', 'paid', 'underwriting_submitted', 'policy_issued', 'policy_info_uploaded', 'offline_paid', 'insurance_active']
  const steps = [
    { key: 'initiated', title: '客户发起签署', desc: '客户已发起委托合同签署申请', done: true, time: c.createdAt || '' },
    { key: 'inkasso_sign', title: '平台签署盖章', desc: '长安银科在线签署盖章', active: c.status === 'pending_inkasso_sign', done: doneStatuses.includes(c.status), time: c.signDate || '' },
    { key: 'payment', title: '客户扫码支付', desc: '客户扫描二维码完成支付', active: c.status === 'inkasso_signed', done: ['paid', ...doneStatuses.slice(3)].includes(c.status), time: c.paymentDate || '' },
    { key: 'underwriting', title: '提交保险公司核保', desc: '跟单员提交材料至保险公司', active: c.status === 'paid', done: ['underwriting_submitted', ...doneStatuses.slice(4)].includes(c.status), time: c.underwritingDate || '' },
    { key: 'policy_issue', title: '保单出具与上传', desc: '长安银科上传保单信息与数字化保单', active: ['underwriting_submitted', 'policy_issued'].includes(c.status), done: ['policy_info_uploaded', 'offline_paid', 'insurance_active'].includes(c.status), time: c.policyInfoUploadDate || c.policyIssuedDate || '' },
    { key: 'offline_payment', title: '客户线下缴费', desc: '客户线下支付并上传缴费凭证', active: c.status === 'policy_info_uploaded', done: ['offline_paid', 'insurance_active'].includes(c.status), time: c.offlinePaymentDate || '' },
    { key: 'insurance_active_step', title: '保险生效', desc: '保险正式生效', active: c.status === 'offline_paid', done: c.status === 'insurance_active', time: c.insuranceActiveDate || '' }
  ]
  return steps
})

// ====== Refs ======
const eligibleExpanded = ref(true)
const contractTemplate = ref({ title: '', version: '', clauses: [] })
const viewVisible = ref(false)
const viewContract = ref(null)

// E-sign
const esignVisible = ref(false)
const esignContract = ref(null)
const esignStatus = ref('idle') // idle | signing | done
const esignDate = ref('')

// QR Pay
const qrPayVisible = ref(false)
const qrContract = ref(null)
const qrPaying = ref(false)
const qrResultVisible = ref(false)
const qrSuccess = ref(false)

// Underwriting
const underwritingVisible = ref(false)
const underwritingContract = ref(null)
const underwritingDocs = ref([])
const underwritingNote = ref('')
const underwritingLoading = ref(false)

// Policy Info Upload (clerk)
const policyUploadVisible = ref(false)
const policyUploadContract = ref(null)
const policyUploadLoading = ref(false)
const policyInfoForm = ref({
  insuranceCompanyName: '',
  insurerName: '',
  insuredName: '',
  beneficiaryName: '',
  policyStartDate: '',
  policyEndDate: '',
  policyPeriod: '12个月',
  renewalFlag: '否',
  countryRiskVersion: '2026版',
  clauseVersion: '短期出口信用保险条款v2025',
  agreedCoverageScope: '全部适保业务',
  tradeBusinessType: '货物贸易',
  maxCompensationLimit: '',
  buyerCreditLimit: '',
  coveredRisks: '商业风险—买方破产或无力偿付债务；商业风险—买方拖欠；政治风险',
  limitIdlePeriod: 60,
  selfControlledLimit: '',
  deductible: '',
  declarationMethod: '月度申报',
  declarationCycle: '月度',
  declarationDeadline: '次月15日',
  premiumRate: '',
  premiumPaymentDeadline: '保险起期前30日',
  premiumPaymentMethod: '一次性',
  premium: '',
  surrenderFee: '',
  recoveryPayee: '被保险人',
  policyFile: [],
  endorsementFile: []
})

// Payment Receipt Upload (customer)
const receiptUploadVisible = ref(false)
const receiptUploadContract = ref(null)
const receiptUploadLoading = ref(false)
const receiptForm = ref({
  paymentMethod: 'bank_transfer',
  files: [],
  remark: ''
})

// Insurance Activation (inkasso)
const activateVisible = ref(false)
const activateContract = ref(null)
const activateLoading = ref(false)

// ====== Computed ======
const eligiblePolicies = computed(() => {
  const companyName = userStore.companyName
  if (!companyName) return []
  return store.getApprovedPoliciesForContract(companyName)
})

const contractList = computed(() => {
  const companyName = userStore.companyName
  if (!companyName) return []
  let list = store.contracts
  // Customer only sees their own contracts; inkasso & clerk see all
  if (isCustomer.value) {
    list = list.filter(c => c.companyName === companyName)
  }
  // Filter by role-relevant statuses
  const allContractStatuses = ['pending_inkasso_sign', 'inkasso_signed', 'paid', 'underwriting_submitted', 'policy_issued', 'policy_info_uploaded', 'offline_paid', 'insurance_active']
  if (isCustomer.value) {
    list = list.filter(c => allContractStatuses.includes(c.status))
  } else if (isInkasso.value) {
    list = list.filter(c => allContractStatuses.includes(c.status))
  } else if (isClerk.value) {
    list = list.filter(c => ['inkasso_signed', 'paid', 'underwriting_submitted', 'policy_issued', 'policy_info_uploaded', 'offline_paid', 'insurance_active'].includes(c.status))
  }
  return list
})

const contractColumns = computed(() => {
  const base = [
    { colKey: 'id', title: '合同编号', width: 120 },
    { colKey: 'policyNo', title: '保单号', width: 140 },
    { colKey: 'insuranceCompany', title: '保险公司', width: 100 },
    { colKey: 'companyName', title: '被保险人', ellipsis: true },
    { colKey: 'coverageAmount', title: '保险金额', width: 120, align: 'right', slot: 'coverageAmount' },
    { colKey: 'premium', title: '保费金额', width: 120, align: 'right', slot: 'premium' },
    { colKey: 'status', title: '合同状态', width: 110, slot: 'status' }
  ]
  if (isClerk.value) {
    base.push({ colKey: 'paymentDate', title: '支付时间', width: 100 })
  }
  base.push({ colKey: 'operation', title: '操作', width: 150, fixed: 'right', slot: 'operation' })
  return base
})

// ====== Status helpers ======
const contractStatusLabel = (status) => {
  const map = {
    pending_inkasso_sign: '待平台签署',
    inkasso_signed: '平台已签署',
    paid: '已支付',
    underwriting_submitted: '核保提交中',
    policy_issued: '保单已出具',
    policy_info_uploaded: '保单信息已上传',
    offline_paid: '已线下缴费',
    insurance_active: '保险已生效'
  }
  return map[status] || status
}

const contractStatusTheme = (status) => {
  if (status === 'pending_inkasso_sign') return 'warning'
  if (status === 'inkasso_signed') return 'primary'
  if (status === 'paid') return 'success'
  if (status === 'underwriting_submitted') return 'default'
  if (status === 'policy_issued') return 'warning'
  if (status === 'policy_info_uploaded') return 'primary'
  if (status === 'offline_paid') return 'success'
  if (status === 'insurance_active') return 'success'
  return 'default'
}

// Policy lifecycle integration (for contract detail view — only up to 保单生效)
const lifecycleSteps = [
  { label: '委托合同签署', key: 'contract', done: false, active: false },
  { label: '保费支付', key: 'payment', done: false, active: false },
  { label: '核保提交', key: 'underwriting', done: false, active: false },
  { label: '保单生效', key: 'policy_activation', done: false, active: false }
]

const currentStepLabel = (status) => {
  const map = {
    pending_inkasso_sign: '委托合同签署（待平台签署）',
    inkasso_signed: '保费支付（平台已签署，待支付）',
    paid: '核保提交（已支付，待跟单员提交核保）',
    underwriting_submitted: '核保提交（核保材料已提交）',
    policy_issued: '保单生效流程（保单已出具）',
    policy_info_uploaded: '保单生效流程（保单信息已上传）',
    offline_paid: '保单生效流程（已线下缴费，待确认）',
    insurance_active: '已完成 — 保险已生效'
  }
  return map[status] || '—'
}

// Update lifecycle based on contract status
const getLifecycle = (status) => {
  const stepMap = {
    pending_inkasso_sign: 0,
    inkasso_signed: 1,
    paid: 2,
    underwriting_submitted: 2,
    policy_issued: 3,
    policy_info_uploaded: 3,
    offline_paid: 3,
    insurance_active: 3
  }
  const activeIdx = stepMap[status] !== undefined ? stepMap[status] : 0
  const isComplete = status === 'insurance_active'
  return lifecycleSteps.map((s, i) => ({
    ...s,
    done: i < activeIdx || (isComplete && i === activeIdx),
    active: i === activeIdx && !isComplete
  }))
}

// ====== Fetch template ======
const fetchContractTemplate = () => {
  contractTemplate.value = store.getContractTemplate('default')
}

// ====== Customer: Initiate contract ======
const handleInitiateContract = (policy) => {
  const res = store.initContractFromPolicy(policy)
  if (res) {
    currentFlowContract.value = res
    MessagePlugin.success(`已为保单 ${policy.policyNo} 发起委托合同签署申请，等待平台签署`)
  } else {
    MessagePlugin.warning('该保单已发起过委托合同签署申请')
  }
}

// ====== Inkasso: E-signature ======
const handleEsign = (row) => {
  currentFlowContract.value = row
  esignContract.value = row
  esignStatus.value = 'idle'
  esignDate.value = ''
  esignVisible.value = true
}

const handleEsignStart = () => {
  esignStatus.value = 'signing'
  const now = new Date()
  esignDate.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  // Simulate e-signature service call
  setTimeout(() => {
    esignStatus.value = 'done'
  }, 2500)
}

const handleEsignComplete = () => {
  const res = store.inkassoSignContract(esignContract.value.policyNo, '长安银科')
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '签署失败')
    return
  }
  MessagePlugin.success('电子签章完成，合同已生效')
  esignVisible.value = false
}

// ====== Customer: QR Payment ======
const handleQrPay = (row) => {
  currentFlowContract.value = row
  qrContract.value = row
  qrPaying.value = false
  qrResultVisible.value = false
  qrSuccess.value = false
  qrPayVisible.value = true
}

const handleQrPaySimulate = () => {
  qrPaying.value = true
  // Simulate QR code scan & payment processing
  setTimeout(() => {
    const res = store.processPayment(qrContract.value.policyNo, 'qr_code')
    if (!res?.ok) {
      qrSuccess.value = false
      qrResultVisible.value = true
      qrPaying.value = false
      return
    }
    qrSuccess.value = true
    qrContract.value = res.data
    qrPaying.value = false
    qrResultVisible.value = true
  }, 2000)
}

const handleQrDone = () => {
  qrResultVisible.value = false
  qrPayVisible.value = false
  MessagePlugin.success('缴费完成')
}

// ====== Clerk: Submit underwriting ======
const handleSubmitUnderwriting = (row) => {
  currentFlowContract.value = row
  underwritingContract.value = row
  underwritingDocs.value = ['application', 'contract', 'paymentReceipt']
  underwritingNote.value = ''
  underwritingLoading.value = false
  underwritingVisible.value = true
}

const handleUnderwritingSubmit = () => {
  if (underwritingDocs.value.length === 0) {
    MessagePlugin.warning('请至少选择一份核保材料')
    return
  }
  underwritingLoading.value = true
  // Simulate API call
  setTimeout(() => {
    const res = store.submitUnderwriting(underwritingContract.value.policyNo, userStore.userName || '跟单员')
    if (!res?.ok) {
      MessagePlugin.error(res?.message || '提交失败')
      underwritingLoading.value = false
      return
    }
    MessagePlugin.success('核保材料已提交至保险公司')
    underwritingLoading.value = false
    underwritingVisible.value = false
  }, 1500)
}

// ====== Clerk: Confirm policy issued ======
const handleConfirmPolicyIssued = (row) => {
  currentFlowContract.value = row
  const res = store.confirmPolicyIssued(row.policyNo)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '操作失败')
    return
  }
  MessagePlugin.success('已确认保险公司出具保单，保单待平台上传归档')
}

// ====== Inkasso: Upload policy info ======
const handleUploadPolicyInfo = (row) => {
  currentFlowContract.value = row
  policyUploadContract.value = row
  // Pre-fill from contract data
  const c = row
  policyInfoForm.value = {
    ...policyInfoForm.value,
    insuranceCompanyName: c.insuranceCompany || '',
    insuredName: c.companyName || '',
    premium: c.premium || '',
    maxCompensationLimit: c.coverageAmount || ''
  }
  policyUploadLoading.value = false
  policyUploadVisible.value = true
}

const handlePolicyUploadSubmit = () => {
  policyUploadLoading.value = true
  // Simulate API call
  setTimeout(() => {
    const res = store.uploadPolicyInfo(policyUploadContract.value.policyNo, { ...policyInfoForm.value })
    if (!res?.ok) {
      MessagePlugin.error(res?.message || '上传失败')
      policyUploadLoading.value = false
      return
    }
    MessagePlugin.success('保单信息与数字化保单已上传')
    policyUploadLoading.value = false
    policyUploadVisible.value = false
  }, 1500)
}

// ====== Customer: Upload payment receipt ======
const handleUploadReceipt = (row) => {
  currentFlowContract.value = row
  receiptUploadContract.value = row
  receiptForm.value = {
    paymentMethod: 'bank_transfer',
    files: [],
    remark: ''
  }
  receiptUploadLoading.value = false
  receiptUploadVisible.value = true
}

const handleReceiptSubmit = () => {
  // 暂不对文件内容做校验，默认上传通过
  receiptUploadLoading.value = true
  setTimeout(() => {
    const res = store.uploadPaymentReceipt(receiptUploadContract.value.policyNo, { ...receiptForm.value })
    if (!res?.ok) {
      MessagePlugin.error(res?.message || '上传失败')
      receiptUploadLoading.value = false
      return
    }
    MessagePlugin.success('缴费凭证已上传，等待平台确认保险生效')
    receiptUploadLoading.value = false
    receiptUploadVisible.value = false
  }, 1500)
}

// ====== Clerk: Activate insurance ======
const handleActivateInsurance = (row) => {
  currentFlowContract.value = row
  activateContract.value = row
  activateVisible.value = true
}

const handleActivateConfirm = () => {
  activateLoading.value = true
  setTimeout(() => {
    const res = store.activateInsurance(activateContract.value.policyNo)
    if (!res?.ok) {
      MessagePlugin.error(res?.message || '激活失败')
      activateLoading.value = false
      return
    }
    MessagePlugin.success('保险已正式生效')
    activateLoading.value = false
    activateVisible.value = false
  }, 1000)
}

// ====== View contract ======
const handleViewContract = (row) => {
  currentFlowContract.value = row
  viewContract.value = row
  viewVisible.value = true
}

// ====== Lifecycle ======
onMounted(() => {
  store.ensureSeeded()
  fetchContractTemplate()
})
</script>

<style lang="scss" scoped>
.breadcrumbs { display: flex; align-items: center; margin-bottom: 16px; font-size: 14px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0; }
.page-title { font-size: 20px; font-weight: 600; color: #0f172a; }
.page-header-actions { display: flex; align-items: center; gap: 12px; }
.lifecycle-hint { font-size: 13px; color: #94a3b8; }
.role-badge-tip { font-size: 13px; color: #1e293b; background: linear-gradient(135deg, #eef2ff, #e0e7ff); padding: 6px 16px; border-radius: 20px; font-weight: 500; border: 1px solid #c7d2fe; }

// Lifecycle bar in view dialog
.lifecycle-bar {
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 12px 16px; margin-bottom: 16px;
  display: flex; align-items: center; gap: 12px;
}
.lifecycle-steps-mini { display: flex; align-items: center; gap: 4px; flex: 1; justify-content: center; }
.ls-item { display: flex; align-items: center; gap: 4px; opacity: 0.4; }
.ls-item.ls-done { opacity: 0.8; }
.ls-item.ls-active { opacity: 1; }
.ls-dot {
  width: 20px; height: 20px; border-radius: 50%; background: #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #94a3b8;
  .ls-done & { background: #00a870; color: #fff; }
  .ls-active & { background: #0052d9; color: #fff; }
}
.ls-label { font-size: 11px; color: #64748b; white-space: nowrap; }
.ls-arrow { font-size: 12px; color: #cbd5e1; }

// Eligible policies
.eligible-card {
  margin-bottom: 16px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  :deep(.t-card__header) { padding-bottom: 0; }
  :deep(.t-card__title) { font-size: 15px; font-weight: 600; color: #1e293b; }
}
.eligible-list { display: flex; flex-direction: column; gap: 12px; padding: 4px 0; }
.eligible-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border: 1px solid #e2e8f0; border-radius: 10px;
  transition: all 0.2s ease; background: #fafbfc;
  &:hover { border-color: #0052d9; background: #f0f5ff; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,82,217,0.08); }
}
.eligible-main { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
.eligible-policy { font-weight: 600; color: #0052d9; font-size: 14px; }
.eligible-company { color: #666; font-size: 13px; }
.eligible-details { display: flex; gap: 20px; font-size: 13px; color: #64748b; }

// Flow steps
.flow-card {
  margin-bottom: 16px; border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  :deep(.t-card__title) { font-size: 15px; font-weight: 600; color: #1e293b; }
}
.flow-steps {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;
  padding: 16px 8px;
}
.flow-step {
  display: flex; flex-direction: column; gap: 8px;
  align-items: center; text-align: center;
  position: relative;
  &:not(:last-child)::after {
    content: ''; position: absolute; top: 16px;
    left: calc(50% + 18px); right: calc(-50% + 18px);
    height: 2px; background: #e2e8f0; z-index: 0;
  }
  &.done:not(:last-child)::after { background: #00a870; }
  &.active:not(:last-child)::after { background: #0052d9; }
}
.flow-step-icon {
  position: relative; z-index: 1;
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: #94a3b8;
  background: #f1f5f9;
  transition: all 0.3s ease;
  &.step-icon-initiated:not(.flow-step.done) { background: #f0fdf4; color: #16a34a; }
  &.step-icon-inkasso_sign:not(.flow-step.done) { background: #f0f5ff; color: #0052d9; }
  &.step-icon-payment:not(.flow-step.done) { background: #fefce8; color: #ca8a04; }
  &.step-icon-underwriting:not(.flow-step.done) { background: #fef2f2; color: #dc2626; }
  &.step-icon-policy_issue:not(.flow-step.done) { background: #f5f3ff; color: #7c3aed; }
  &.step-icon-offline_payment:not(.flow-step.done) { background: #fff7ed; color: #ea580c; }
  &.step-icon-insurance_active_step:not(.flow-step.done) { background: #f0fdf4; color: #16a34a; }
}
.flow-step.done .flow-step-icon { background: #f0fdf4; color: #00a870; }
.flow-step.active .flow-step-icon {
  background: #eff6ff; color: #0052d9;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0,82,217,0.3); }
  50% { box-shadow: 0 0 0 8px rgba(0,82,217,0); }
}
.flow-step-body { flex: 1; }
.flow-step-title { font-size: 12px; font-weight: 600; color: #1e293b; line-height: 1.3; }
.flow-step-desc { font-size: 11px; color: #94a3b8; margin-top: 2px; line-height: 1.3; }
.flow-step-time { font-size: 10px; color: #cbd5e1; margin-top: 4px; }

// Contract list
.contract-list-card {
  border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow: hidden;
  :deep(.t-card__body) { padding: 0; }
  :deep(.t-table) { font-size: 13px; }
  :deep(.t-table__th) { background: #f8fafc; color: #64748b; font-weight: 600; font-size: 12px; }
}

// E-sign dialog
.esign-body { padding: 8px 0; }
.esign-summary { margin-bottom: 16px; }
.esign-alert { margin-bottom: 20px; }
.esign-seal-area {
  display: flex; justify-content: center; margin-bottom: 24px;
}
.seal-placeholder {
  width: 220px; height: 220px;
  border: 2px dashed #d0d0d0; border-radius: 16px;
  display: flex; align-items: center; justify-content: center; text-align: center;
  background: #fafafa; transition: all 0.3s;
  &.seal-active { border-color: #0052d9; background: #f0f5ff; }
}
.seal-prompt { p { font-size: 13px; color: #999; margin-top: 12px; } }
.seal-signing { p { font-size: 14px; color: #0052d9; margin-top: 12px; } }
.seal-sub-text { font-size: 12px; color: #94a3b8; margin-top: 4px !important; }
.seal-stamp { display: flex; flex-direction: column; align-items: center; }
.seal-circle {
  width: 130px; height: 130px; border: 3px solid #dc2626; border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: #fff5f5;
  .seal-text { font-size: 14px; font-weight: 700; color: #dc2626; text-align: center; line-height: 1.5; }
  .seal-date { font-size: 10px; color: #dc2626; margin-top: 4px; }
}
.seal-success-text { font-size: 15px; font-weight: 600; color: #00a870; margin-top: 12px; }
.esign-actions { display: flex; justify-content: flex-end; gap: 12px; }

// QR Pay dialog
.qrpay-body { padding: 8px 0; }
.qrpay-amount {
  text-align: center; padding: 20px; margin-bottom: 20px;
  background: linear-gradient(135deg, #1f4e79, #2a6cb8); border-radius: 12px; color: #fff;
  .qrpay-label { font-size: 13px; opacity: 0.9; display: block; }
  .qrpay-value { font-size: 36px; font-weight: 700; display: block; margin: 6px 0; }
  .qrpay-currency { font-size: 14px; opacity: 0.8; }
}
.qr-code-area { text-align: center; margin-bottom: 20px; }
.qr-code-frame {
  display: inline-block; padding: 12px; border: 1px solid #e0e0e0; border-radius: 12px; background: #fff;
}
.qr-code-mock {
  width: 200px; height: 200px; background: #fff; display: flex; align-items: center; justify-content: center;
}
.qr-inner { position: relative; width: 180px; height: 180px; }
.qr-logo {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: #fff; padding: 4px 8px; font-size: 12px; font-weight: 700; color: #1f4e79;
  border: 1px solid #1f4e79; border-radius: 4px; z-index: 2;
}
.qr-pattern {
  display: grid; grid-template-columns: repeat(10, 1fr); gap: 1px;
  width: 180px; height: 180px;
}
.qr-dot {
  width: 100%; height: 0; padding-bottom: 100%; background: #f0f0f0; border-radius: 1px;
  &.dark { background: #1f4e79; }
}
.qr-hint { font-size: 13px; color: #666; margin-top: 12px; }
.qr-policy { font-size: 12px; color: #94a3b8; margin-top: 4px; }
.qrpay-info { margin-bottom: 16px; }
.qrpay-actions { display: flex; justify-content: flex-end; gap: 12px; }
.qr-result { text-align: center; padding: 24px; p { margin: 12px 0; } }
.qr-result-text { font-size: 16px; font-weight: 600; }
.qr-result-detail { font-size: 14px; color: #666; }

// Underwriting dialog
.underwriting-body { padding: 8px 0; }
.underwriting-section { margin-top: 20px; }
.underwriting-docs {
  display: flex; flex-direction: column; gap: 8px; padding: 12px 16px;
  border: 1px solid #e0e0e0; border-radius: 8px;
}

// Shared
.section-title {
  font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 10px;
  padding-left: 8px; border-left: 3px solid #0052d9;
}
.info-grid { display: flex; flex-direction: column; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; }
.info-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; border-bottom: 1px solid #f0f0f0;
  &:last-child { border-bottom: none; }
}
.info-label { font-size: 13px; color: #666; flex-shrink: 0; }
.info-value { font-size: 13px; color: #333; font-weight: 600; text-align: right; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 12px;
  padding-top: 16px; margin-top: 16px; border-top: 1px solid #e0e0e0;
}
.contract-section { margin-bottom: 16px; }
.contract-view { padding: 8px 0; }

// Policy upload dialog
.policy-upload-body { padding: 8px 0; max-height: 65vh; overflow-y: auto; }
.policy-upload-body::-webkit-scrollbar { width: 6px; }
.policy-upload-body::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
.policy-upload-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
.upload-alert { margin-bottom: 16px; }
.form-section { margin-bottom: 20px; }
.form-section .section-title { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 12px; padding-left: 8px; border-left: 3px solid #0052d9; }
.policy-upload-body :deep(.t-form__item) { margin-bottom: 8px; }

// Receipt upload dialog
.receipt-body { padding: 8px 0; }
.receipt-amount {
  text-align: center; padding: 16px; margin-bottom: 16px;
  background: linear-gradient(135deg, #1f4e79, #2a6cb8); border-radius: 12px; color: #fff;
  .receipt-label { font-size: 13px; opacity: 0.9; display: block; }
  .receipt-value { font-size: 30px; font-weight: 700; display: block; margin: 4px 0; }
  .receipt-currency { font-size: 14px; opacity: 0.8; }
}
.receipt-alert { margin-bottom: 16px; }

// Activate dialog
.activate-body { padding: 8px 0; text-align: center; }
.activate-icon { margin-bottom: 12px; }
.activate-title { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
.activate-desc { font-size: 14px; color: #64748b; margin-bottom: 20px; line-height: 1.6; }
.activate-info { text-align: left; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; margin-bottom: 16px; }
.activate-alert { margin-bottom: 16px; text-align: left; }
</style>
