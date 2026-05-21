<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/policy/list">保单管理</t-breadcrumb-item>
        <t-breadcrumb-item>流程管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>

    <div class="page-header">
      <div class="page-title-wp">
        <div class="page-title">保单生命周期流程</div>
        <t-tag v-if="activeTab === 'process'" theme="primary" variant="light" size="small">进行中</t-tag>
      </div>
      <div class="policy-info">
        参考保单号：<span class="policy-no">{{ refPolicyNo }}</span>
      </div>
    </div>

    <t-tabs v-model="activeTab" size="large">
      <t-tab-panel value="process" label="流程管理">
        <div class="flow-progress">
          <div class="flow-steps">
            <template v-for="(step, index) in stepOptions" :key="step.value">
              <div class="flow-step-col">
                <div
                  class="flow-step-dot"
                  :class="{ completed: index + 1 < currentStep, active: index + 1 === currentStep }"
                  @click="setStep(index + 1)"
                >
                  <span v-if="index + 1 < currentStep" class="flow-step-check">✓</span>
                  <span v-else class="flow-step-num">{{ index + 1 }}</span>
                </div>
                <div class="flow-step-label" :class="{ active: index + 1 === currentStep, completed: index + 1 < currentStep }">
                  {{ step.label }}
                </div>
                <div class="flow-step-status">
                  <t-tag v-if="index + 1 < currentStep" theme="success" variant="light" size="small">已完成</t-tag>
                  <t-tag v-else-if="index + 1 === currentStep" theme="primary" variant="light" size="small">进行中</t-tag>
                  <t-tag v-else theme="default" variant="light" size="small">待处理</t-tag>
                </div>
              </div>
              <div v-if="index < stepOptions.length - 1" class="flow-arrow" :class="{ completed: index + 1 < currentStep }">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </template>
          </div>
        </div>

        <div class="flow-timeline">
          <div class="timeline-title-bar">
            <span class="timeline-title">流程详情</span>
            <span class="timeline-hint">点击步骤标题可展开/收起详情</span>
          </div>

          <div
            v-for="(step, index) in stepOptions"
            :key="step.value"
            class="timeline-node"
            :class="{
              'node-completed': index + 1 < currentStep,
              'node-active': index + 1 === currentStep,
              'node-pending': index + 1 > currentStep
            }"
          >
            <div class="node-header" @click="toggleCollapse(index)">
              <div class="node-marker">
                <span v-if="index + 1 < currentStep" class="node-check">✓</span>
                <span v-else-if="index + 1 === currentStep" class="node-dot"></span>
                <span v-else class="node-pending-dot"></span>
              </div>
              <div class="node-info">
                <div class="node-title">
                  <span class="node-step-num">Step {{ index + 1 }}</span>
                  <span class="node-step-name">{{ step.label }}</span>
                  <t-tag :theme="stepRoles[index].role === userStore.role ? 'primary' : 'default'" variant="light" size="small" class="role-tag">{{ stepRoles[index].label }}</t-tag>
                  <span v-if="stepInfo[index].handler" class="node-handler">责任人：{{ stepInfo[index].handler }}</span>
                </div>
                <div class="node-meta">
                  <span class="meta-status" :class="'status-' + getStepStatusText(index + 1)">
                    {{ getStepStatusText(index + 1) }}
                  </span>
                  <span v-if="stepInfo[index].startTime" class="meta-time">开始：{{ stepInfo[index].startTime }}</span>
                  <span v-if="stepInfo[index].endTime" class="meta-time">完成：{{ stepInfo[index].endTime }}</span>
                </div>
              </div>
              <div class="node-toggle">
                <t-icon :name="expandedSteps[index] ? 'chevron-up' : 'chevron-down'" class="toggle-icon" />
              </div>
            </div>

            <div v-show="expandedSteps[index]" class="node-body">
              <!-- Step 1: 合同签署 -->
              <div v-if="index === 0" class="node-content">
                <div class="content-inner">
                  <div class="content-section">
                    <div class="content-section-title">合同签署流程</div>
                    <t-form label-width="120">
                      <t-form-item label="合同编号">
                        <t-input :value="contractData.id" readonly />
                      </t-form-item>
                      <t-form-item label="保单号">
                        <t-input :value="contractData.policyNo" readonly />
                      </t-form-item>
                      <t-form-item label="被保险人">
                        <t-input :value="contractData.companyName" readonly />
                      </t-form-item>
                      <t-form-item label="投保买方">
                        <t-input :value="contractData.insuredName" readonly />
                      </t-form-item>
                      <t-form-item label="合同状态">
                        <t-tag :theme="refContract?.status === 'pending_inkasso_sign' ? 'warning' : 'success'" variant="light">
                          {{ refContract?.status === 'pending_inkasso_sign' ? '待平台签署' : refContract?.status === 'inkasso_signed' ? '平台已签署' : refContract?.status || '未发起' }}
                        </t-tag>
                      </t-form-item>
                      <t-form-item label="保险金额">
                        <t-input :value="'$' + Number(contractData.coverageAmount || 0).toLocaleString()" readonly />
                      </t-form-item>
                      <t-form-item label="保费金额">
                        <t-input :value="'$' + Number(contractData.premium || 0).toLocaleString()" readonly />
                      </t-form-item>
                    </t-form>
                  </div>
                </div>
              </div>

              <!-- Step 2: 保费支付 -->
              <div v-if="index === 1" class="node-content">
                <div class="content-inner">
                  <div class="content-section">
                    <div class="content-section-title">保费支付信息</div>
                    <t-form label-width="120">
                      <t-form-item label="应付保费">
                        <t-input :value="'$' + Number(formData.step2.premiumAmount || 0).toLocaleString()" readonly />
                      </t-form-item>
                      <t-form-item label="支付方式">
                        <t-select v-model="formData.step2.paymentMethod" placeholder="请选择支付方式">
                          <t-option value="qr_code" label="扫码支付" />
                          <t-option value="bank_transfer" label="银行转账" />
                          <t-option value="online" label="在线支付" />
                        </t-select>
                      </t-form-item>
                      <t-form-item label="支付状态">
                        <t-select v-model="formData.step2.paymentStatus" placeholder="请选择支付状态">
                          <t-option value="unpaid" label="未支付" />
                          <t-option value="paid" label="已支付" />
                        </t-select>
                      </t-form-item>
                      <t-form-item label="支付凭证">
                        <t-upload v-model="formData.step2.paymentReceipt" :files="[]" placeholder="上传支付凭证" />
                      </t-form-item>
                    </t-form>
                  </div>
                </div>
              </div>

              <!-- Step 3: 核保材料提交 -->
              <div v-if="index === 2" class="node-content">
                <div class="content-inner">
                  <div class="content-section">
                    <div class="content-section-title">核保材料清单</div>
                    <t-checkbox-group v-model="formData.step3.materials" class="underwriting-checklist">
                      <t-checkbox value="application">投保申请书</t-checkbox>
                      <t-checkbox value="contract">已签署合同</t-checkbox>
                      <t-checkbox value="paymentReceipt">保费支付凭证</t-checkbox>
                      <t-checkbox value="tradeContract">贸易合同副本</t-checkbox>
                      <t-checkbox value="buyerInfo">买方资信报告</t-checkbox>
                      <t-checkbox value="invoice">商业发票</t-checkbox>
                    </t-checkbox-group>
                  </div>
                  <div class="content-section" style="margin-top:16px;">
                    <div class="content-section-title">核保备注</div>
                    <t-textarea v-model="formData.step3.note" placeholder="备注说明（选填）" :rows="2" />
                  </div>
                </div>
              </div>

              <!-- Step 4: 保单生效流程 -->
              <div v-if="index === 3" class="node-content">
                <div class="content-inner">
                  <div class="content-section">
                    <div class="content-section-title">保单生效流程概览</div>
                    <div class="sub-step-bar">
                      <div class="sub-step" :class="{ done: formData.step4.policyIssued }">
                        <div class="sub-step-dot">{{ formData.step4.policyIssued ? '✓' : '1' }}</div>
                        <span class="sub-step-label">保单出具</span>
                      </div>
                      <div class="sub-step-arrow"><t-icon name="chevron-right" /></div>
                      <div class="sub-step" :class="{ done: formData.step4.infoUploaded }">
                        <div class="sub-step-dot">{{ formData.step4.infoUploaded ? '✓' : '2' }}</div>
                        <span class="sub-step-label">信息上传</span>
                      </div>
                      <div class="sub-step-arrow"><t-icon name="chevron-right" /></div>
                      <div class="sub-step" :class="{ done: formData.step4.receiptVerified }">
                        <div class="sub-step-dot">{{ formData.step4.receiptVerified ? '✓' : '3' }}</div>
                        <span class="sub-step-label">缴费凭证</span>
                      </div>
                      <div class="sub-step-arrow"><t-icon name="chevron-right" /></div>
                      <div class="sub-step" :class="{ done: !!formData.step4.activeDate }">
                        <div class="sub-step-dot">{{ formData.step4.activeDate ? '✓' : '4' }}</div>
                        <span class="sub-step-label">保险生效</span>
                      </div>
                    </div>
                  </div>

                  <div class="content-section" style="margin-top:16px;">
                    <div class="content-section-title">保单信息</div>
                    <t-form label-width="120">
                      <t-form-item label="合同编号">
                        <t-input :value="contractData.id" readonly />
                      </t-form-item>
                      <t-form-item label="保单号">
                        <t-input :value="contractData.policyNo" readonly />
                      </t-form-item>
                      <t-form-item label="保险公司">
                        <t-input :value="contractData.insuranceCompany || '待上传'" readonly />
                      </t-form-item>
                      <t-form-item label="被保险人">
                        <t-input :value="contractData.companyName" readonly />
                      </t-form-item>
                      <t-form-item label="保单状态">
                        <t-tag v-if="refContract?.status === 'insurance_active'" theme="success" variant="light">已生效</t-tag>
                        <t-tag v-else-if="['policy_issued','policy_info_uploaded','offline_paid'].includes(refContract?.status)" theme="primary" variant="light">处理中</t-tag>
                        <t-tag v-else theme="default" variant="light">待处理</t-tag>
                      </t-form-item>
                      <t-form-item v-if="formData.step4.activeDate" label="保险生效时间">
                        <t-input :value="formData.step4.activeDate" readonly />
                      </t-form-item>
                    </t-form>
                  </div>
                </div>
              </div>

              <!-- Step 5: 信用限额管理 -->
              <div v-if="index === 4" class="node-content">
                <div class="content-inner">
                  <div class="content-section">
                    <div class="content-section-title">信用限额概览</div>
                    <t-table :data="creditLimitData" :columns="limitColumns" row-key="id" hover stripe>
                      <template #usageRate="{ row }">
                        <t-progress :percentage="row.usageRate" :color="row.usageRate > 80 ? '#ef4444' : row.usageRate > 50 ? '#f59e0b' : '#10b981'" />
                      </template>
                    </t-table>
                    <p class="content-tip">信用限额由保险公司审批，可根据业务需要随时申请新增或调整</p>
                  </div>
                </div>
              </div>

              <!-- Step 6: 出运申报管理 -->
              <div v-if="index === 5" class="node-content">
                <div class="content-inner">
                  <div class="content-section">
                    <div class="content-section-title">出运申报统计</div>
                    <div class="stats-row">
                      <div class="stat-box">
                        <span class="stat-num">{{ shipmentStats.total }}</span>
                        <span class="stat-label">总出运笔数</span>
                      </div>
                      <div class="stat-box">
                        <span class="stat-num">${{ shipmentStats.totalAmount }}</span>
                        <span class="stat-label">总出运金额</span>
                      </div>
                      <div class="stat-box">
                        <span class="stat-num">{{ shipmentStats.declared }}</span>
                        <span class="stat-label">已申报</span>
                      </div>
                      <div class="stat-box">
                        <span class="stat-num">{{ shipmentStats.pending }}</span>
                        <span class="stat-label">待申报</span>
                      </div>
                    </div>
                  </div>
                  <div class="content-section" style="margin-top:16px;">
                    <div class="content-section-title">申报规则</div>
                    <t-form label-width="120">
                      <t-form-item label="申报方式">
                        <t-input value="月度申报" readonly />
                      </t-form-item>
                      <t-form-item label="申报截止日">
                        <t-input value="次月15日" readonly />
                      </t-form-item>
                      <t-form-item label="逾期未申报">
                        <t-alert message="逾期未申报将影响保险赔付，请按时完成申报" theme="warning" />
                      </t-form-item>
                    </t-form>
                  </div>
                </div>
              </div>

              <!-- Step 7: 保单维护 -->
              <div v-if="index === 6" class="node-content">
                <div class="content-inner">
                  <div class="content-section">
                    <div class="content-section-title">保单维护操作</div>
                    <t-form label-width="120">
                      <t-form-item label="维护类型">
                        <t-select v-model="formData.step6.maintenanceType" placeholder="请选择维护类型">
                          <t-option value="renewal" label="续保申请" />
                          <t-option value="change" label="保单变更" />
                          <t-option value="surrender" label="退保申请" />
                        </t-select>
                      </t-form-item>
                      <t-form-item label="申请说明">
                        <t-textarea v-model="formData.step6.description" placeholder="请说明维护原因和具体内容" :rows="3" />
                      </t-form-item>
                      <t-form-item label="附件材料">
                        <t-upload v-model="formData.step6.attachments" :files="[]" placeholder="上传相关申请材料" />
                      </t-form-item>
                    </t-form>
                  </div>
                  <div class="content-section" style="margin-top:16px;">
                    <t-alert message="保单维护申请提交后需经平台审核，审核结果将通过系统通知反馈" theme="info" />
                  </div>
                </div>
              </div>

              <t-divider v-if="index >= 0" />

              <div class="node-approval">
                <div class="approval-row">
                  <div class="approval-field">
                    <span class="approval-label">审批结论</span>
                    <t-radio-group
                      :value="formData['step' + (index + 1)].approvalResult"
                      @change="(v) => { formData['step' + (index + 1)].approvalResult = v }"
                      class="approval-radio-group"
                    >
                      <t-radio value="approved">通过</t-radio>
                      <t-radio value="rejected">退回修改</t-radio>
                    </t-radio-group>
                  </div>
                </div>
                <div class="approval-row">
                  <div class="approval-field approval-field-full">
                    <span class="approval-label">审批意见</span>
                    <t-textarea
                      :value="formData['step' + (index + 1)].auditOpinion"
                      @update:model-value="(v) => { formData['step' + (index + 1)].auditOpinion = v }"
                      placeholder="请输入审批意见"
                      :autosize="{ minRows: 2, maxRows: 4 }"
                      class="approval-textarea"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flow-actions">
          <t-button variant="outline" :disabled="currentStep === 1" @click="prevStep">上一步</t-button>
          <t-button v-if="currentStep < 7" theme="primary" @click="nextStep">下一步</t-button>
          <t-button v-else theme="primary" @click="completeProcess">完成</t-button>
        </div>
      </t-tab-panel>

      <t-tab-panel value="task-list" label="流程任务列表">
        <t-card>
          <t-table
            :data="processTasks"
            :columns="taskColumns"
            row-key="id"
            hover
            stripe
            :pagination="pagination"
            @page-change="onPageChange"
          >
            <template #status="{ row }">
              <t-tag theme="success" variant="light">{{ row.statusName }}</t-tag>
            </template>
            <template #operation="{ row }">
              <t-link theme="primary" @click="handleView(row)">查看详情</t-link>
            </template>
          </t-table>
        </t-card>
      </t-tab-panel>
    </t-tabs>

    <t-dialog v-model:visible="detailVisible" header="流程任务详情" width="800px" :footer="false">
      <div v-if="currentTask" class="detail-body">
        <div class="detail-summary">
          <div class="summary-item">
            <span class="summary-label">任务编号</span>
            <span class="summary-value">{{ currentTask.id }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">保单号</span>
            <span class="summary-value">{{ currentTask.policyNo }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">客户名称</span>
            <span class="summary-value">{{ currentTask.companyName }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">完成时间</span>
            <span class="summary-value">{{ currentTask.endTime }}</span>
          </div>
        </div>
        <t-divider />
        <div v-for="(step, idx) in currentTask.stepOptions" :key="idx" class="detail-step">
          <div class="detail-step-header">
            <span class="detail-step-num">Step {{ idx + 1 }}</span>
            <span class="detail-step-name">{{ step.label }}</span>
            <span v-if="currentTask.stepInfo[idx]?.handler" class="detail-step-handler">责任人：{{ currentTask.stepInfo[idx].handler }}</span>
            <span class="detail-step-time" v-if="currentTask.stepInfo[idx]?.startTime">开始：{{ currentTask.stepInfo[idx].startTime }}</span>
            <span class="detail-step-time" v-if="currentTask.stepInfo[idx]?.endTime">完成：{{ currentTask.stepInfo[idx].endTime }}</span>
          </div>
          <div class="detail-step-content">
            <template v-if="idx === 0">
              <div class="detail-field-row"><span class="detail-field-label">合同编号</span><span class="detail-field-value">{{ currentTask.formData.step1?.contractId || '自动生成' }}</span></div>
              <div class="detail-field-row"><span class="detail-field-label">签署方</span><span class="detail-field-value">长安银科</span></div>
            </template>
            <template v-if="idx === 1">
              <div class="detail-field-row"><span class="detail-field-label">支付方式</span><span class="detail-field-value">{{ { qr_code: '扫码支付', bank_transfer: '银行转账', online: '在线支付' }[currentTask.formData.step2?.paymentMethod] || '扫码支付' }}</span></div>
              <div class="detail-field-row"><span class="detail-field-label">支付状态</span><span class="detail-field-value">{{ { unpaid: '未支付', paid: '已支付' }[currentTask.formData.step2?.paymentStatus] || '已支付' }}</span></div>
            </template>
            <template v-if="idx === 2">
              <div class="detail-field-row"><span class="detail-field-label">核保材料</span><span class="detail-field-value">{{ (currentTask.formData.step3?.materials || []).length }} 项材料已提交</span></div>
            </template>
            <template v-if="idx === 3">
              <div class="detail-field-row"><span class="detail-field-label">信用限额</span><span class="detail-field-value">{{ (currentTask.formData.step4?.limits || 0) }} 个买方</span></div>
            </template>
            <template v-if="idx === 4">
              <div class="detail-field-row"><span class="detail-field-label">出运申报</span><span class="detail-field-value">{{ (currentTask.formData.step5?.shipments || 0) }} 笔</span></div>
            </template>
            <template v-if="idx === 5">
              <div class="detail-field-row"><span class="detail-field-label">维护类型</span><span class="detail-field-value">{{ currentTask.formData.step6?.maintenanceType || '无' }}</span></div>
            </template>
            <t-divider />
            <div class="detail-field-row">
              <span class="detail-field-label">审批结论</span>
              <span class="detail-field-value">{{ { approved: '通过', rejected: '退回修改' }[currentTask.formData['step' + (idx + 1)]?.approvalResult] || '无' }}</span>
            </div>
            <div class="detail-field-row detail-field-row-full">
              <span class="detail-field-label">审批意见</span>
              <span class="detail-field-value">{{ currentTask.formData['step' + (idx + 1)]?.auditOpinion || '无' }}</span>
            </div>
          </div>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useBusinessStore } from '@/stores/business'
import { useUserStore } from '@/stores/user'
import { MessagePlugin } from 'tdesign-vue-next'

const businessStore = useBusinessStore()
const userStore = useUserStore()

const activeTab = ref('process')
const currentStep = ref(1)

const stepOptions = [
  { label: '合同签署', value: 1 },
  { label: '保费支付', value: 2 },
  { label: '核保材料提交', value: 3 },
  { label: '保单生效流程', value: 4 },
  { label: '信用限额管理', value: 5 },
  { label: '出运申报管理', value: 6 },
  { label: '保单维护', value: 7 }
]

const stepRoles = [
  { role: 'customer', label: '客户发起' },
  { role: 'customer', label: '客户' },
  { role: 'clerk', label: '跟单员' },
  { role: 'clerk', label: '跟单员/客户' },
  { role: 'inkasso', label: '长安银科' },
  { role: 'customer', label: '客户' },
  { role: 'customer', label: '客户/跟单员' }
]

// Reference contract — first contract in store for the current company (all for inkasso/clerk)
const refContract = computed(() => {
  const store = businessStore
  const companyName = userStore.companyName
  const role = userStore.role
  if (!companyName) return null
  let contracts
  if (role === 'customer') {
    contracts = store.contracts.filter(c => c.companyName === companyName)
  } else {
    contracts = store.contracts
  }
  return contracts.length > 0 ? contracts[0] : null
})

const refPolicyNo = computed(() => refContract.value?.policyNo || 'PI2026005678')

const contractData = computed(() => {
  const c = refContract.value
  const info = c?.policyInfo
  return {
    id: c?.id || 'CT20260521001',
    policyNo: c?.policyNo || 'PI2026005678',
    companyName: c?.companyName || '深圳XX国际贸易有限公司',
    insuredName: c?.insuredName || 'ABC Corporation',
    coverageAmount: c?.coverageAmount || 500000,
    premium: c?.premium || 12500,
    insuranceCompany: info?.insuranceCompanyName || c?.insuranceCompany || ''
  }
})

const getCurrentTime = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

const stepInfo = reactive([
  { handler: '深圳XX国际贸易有限公司 → 长安银科', startTime: '', endTime: '' },
  { handler: '深圳XX国际贸易有限公司', startTime: '', endTime: '' },
  { handler: '李跟单', startTime: '', endTime: '' },
  { handler: '李跟单 → 客户', startTime: '', endTime: '' },
  { handler: '张经理', startTime: '', endTime: '' },
  { handler: '深圳XX国际贸易有限公司', startTime: '', endTime: '' },
  { handler: '深圳XX国际贸易有限公司', startTime: '', endTime: '' }
])

const setStepStartTime = (stepNum) => {
  const idx = stepNum - 1
  if (idx >= 0 && idx < stepInfo.length && !stepInfo[idx].startTime) {
    stepInfo[idx].startTime = getCurrentTime()
  }
}

const setStepEndTime = (stepNum) => {
  const idx = stepNum - 1
  if (idx >= 0 && idx < stepInfo.length) {
    stepInfo[idx].endTime = getCurrentTime()
  }
}

const formData = reactive({
  step1: { contractId: '', approvalResult: '', auditOpinion: '' },
  step2: { premiumAmount: 12500, paymentMethod: 'qr_code', paymentStatus: 'unpaid', paymentReceipt: [], approvalResult: '', auditOpinion: '' },
  step3: { materials: [], note: '', approvalResult: '', auditOpinion: '' },
  step4: { policyIssued: false, infoUploaded: false, receiptVerified: false, activeDate: '', policyInfo: null, approvalResult: '', auditOpinion: '' },
  step5: { approvalResult: '', auditOpinion: '' },
  step6: { approvalResult: '', auditOpinion: '' },
  step7: { maintenanceType: '', description: '', attachments: [], approvalResult: '', auditOpinion: '' }
})

// Credit limit data
const limitColumns = [
  { colKey: 'buyerName', title: '买方名称', width: 160 },
  { colKey: 'buyerCountry', title: '国家', width: 100 },
  { colKey: 'appliedLimit', title: '申请限额', width: 120 },
  { colKey: 'usedLimit', title: '已使用', width: 100 },
  { colKey: 'remainingLimit', title: '剩余', width: 100 },
  { colKey: 'usageRate', title: '使用率', width: 140, slot: 'usageRate' }
]

const creditLimitData = computed(() => businessStore.creditLimits.slice(0, 3).map(c => ({
  ...c,
  appliedLimit: '$' + Number(c.appliedLimit).toLocaleString(),
  usedLimit: '$' + Number(c.usedLimit).toLocaleString(),
  remainingLimit: '$' + Number(c.remainingLimit).toLocaleString()
})))

// Shipment stats
const shipmentStats = computed(() => {
  const shipments = businessStore.shipments
  return {
    total: shipments.length,
    totalAmount: Number(shipments.reduce((s, it) => s + (Number(it.shipmentAmount) || 0), 0)).toLocaleString(),
    declared: shipments.filter(s => s.status === 'declared').length,
    pending: shipments.filter(s => s.status === 'pending_declare' || s.status === 'timeout_warning').length
  }
})

const expandedSteps = reactive(stepOptions.map((_, i) => i + 1 <= currentStep.value))

const getStepStatusText = (stepNum) => {
  if (stepNum < currentStep.value) return '已完成'
  if (stepNum === currentStep.value) return '进行中'
  return '待处理'
}

const toggleCollapse = (index) => {
  expandedSteps[index] = !expandedSteps[index]
}

const setStep = (step) => {
  if (step <= currentStep.value) {
    currentStep.value = step
  }
}

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--
}

const nextStep = () => {
  if (currentStep.value < 7) {
    setStepEndTime(currentStep.value)
    currentStep.value++
    setStepStartTime(currentStep.value)
    MessagePlugin.success('操作成功')
  }
}

const completeProcess = () => {
  setStepEndTime(currentStep.value)
  businessStore.addCompletedProcessTask({
    policyNo: refPolicyNo.value,
    companyName: contractData.value.companyName,
    startTime: stepInfo[0].startTime,
    endTime: stepInfo[6].endTime,
    stepsCompleted: 7,
    stepOptions: [...stepOptions],
    stepInfo: stepInfo.map(s => ({ ...s })),
    formData: Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, { ...v }])
    )
  })
  MessagePlugin.success('保单生命周期流程已完成！')
  activeTab.value = 'task-list'
}

const updateStep4FromContract = () => {
  const c = refContract.value
  if (!c) return
  const status = c.status
  formData.step4.policyIssued = ['policy_issued', 'policy_info_uploaded', 'offline_paid', 'insurance_active'].includes(status)
  formData.step4.infoUploaded = ['policy_info_uploaded', 'offline_paid', 'insurance_active'].includes(status)
  formData.step4.receiptVerified = ['offline_paid', 'insurance_active'].includes(status)
  formData.step4.activeDate = c.insuranceActiveDate || ''
  formData.step4.policyInfo = c.policyInfo || null
}

onMounted(() => {
  businessStore.ensureSeeded()
  setStepStartTime(currentStep.value)
  updateStep4FromContract()
})

// Task list
const detailVisible = ref(false)
const currentTask = ref(null)

const taskColumns = [
  { colKey: 'id', title: '任务编号', width: 160 },
  { colKey: 'policyNo', title: '保单号', width: 150 },
  { colKey: 'companyName', title: '客户名称', minWidth: 200 },
  { colKey: 'taskType', title: '任务类型', width: 100 },
  { colKey: 'startTime', title: '开始时间', width: 170 },
  { colKey: 'endTime', title: '完成时间', width: 170 },
  { colKey: 'stepsCompleted', title: '完成步骤', width: 100 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 120, slot: 'operation' }
]

const pagination = ref({
  defaultPageSize: 10,
  total: 0,
  defaultCurrent: 1
})

const processTasks = computed(() => businessStore.processTasks)

const onPageChange = (pageInfo) => {
  pagination.value.defaultCurrent = pageInfo.current
  pagination.value.defaultPageSize = pageInfo.pageSize
}

const handleView = (row) => {
  currentTask.value = row
  detailVisible.value = true
}
</script>

<style lang="scss" scoped>
$primary: #0052D9;
$success: #10b981;
$warning: #f59e0b;
$danger: #ef4444;
$gray-100: #f3f4f6;
$gray-200: #e5e7eb;
$gray-300: #d1d5db;
$gray-400: #9ca3af;
$gray-500: #6b7280;
$gray-600: #4b5563;
$gray-700: #374151;
$gray-800: #1f2937;

.breadcrumbs { display: flex; align-items: center; margin-bottom: 16px; font-size: 14px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title-wp { display: flex; align-items: center; gap: 12px; }
.page-title { font-size: 18px; font-weight: 700; color: #111827; }
.policy-info { font-size: 14px; color: $gray-500; }
.policy-no { font-weight: 600; color: $primary; }

.flow-progress {
  background: #fff; border: 1px solid $gray-200; border-radius: 12px;
  padding: 24px 32px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.flow-steps { display: flex; align-items: flex-start; justify-content: center; }
.flow-step-col { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 80px; }
.flow-step-dot {
  width: 40px; height: 40px; border-radius: 50%; background: $gray-200;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: all 0.3s ease; flex-shrink: 0;
  .flow-step-num, .flow-step-check { font-size: 15px; font-weight: 700; color: $gray-500; }
  &.completed { background: $success; box-shadow: 0 0 0 4px rgba($success, 0.15); .flow-step-check { color: #fff; } }
  &.active { background: $primary; box-shadow: 0 0 0 4px rgba($primary, 0.18); .flow-step-num { color: #fff; } }
}
.flow-step-label {
  font-size: 12px; color: $gray-500; text-align: center; font-weight: 500; line-height: 1.3;
  &.completed { color: $success; } &.active { color: $primary; font-weight: 600; }
}
.flow-step-status :deep(.t-tag) { min-width: 52px; justify-content: center; }
.role-tag { margin-left: 4px; font-weight: 500; }
.flow-arrow {
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  margin-top: 8px; color: $gray-300; transition: color 0.3s ease;
  &.completed { color: $success; }
}
.flow-timeline { background: #fff; border: 1px solid $gray-200; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); overflow: hidden; }
.timeline-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid $gray-200; background: #fafbfc; }
.timeline-title { font-size: 15px; font-weight: 600; color: $gray-800; }
.timeline-hint { font-size: 12px; color: $gray-400; }
.timeline-node {
  border-left: 3px solid $gray-200; margin-left: 31px; padding: 0 0 0 24px; position: relative;
  &:last-child { border-left-color: transparent; }
  &.node-completed { border-left-color: $success; .node-check { background: $success; color: #fff; } }
  &.node-active { border-left-color: $primary; .node-dot { background: $primary; box-shadow: 0 0 0 4px rgba($primary, 0.18); } }
  &.node-pending .node-pending-dot { background: $gray-300; }
}
.node-header {
  display: flex; align-items: center; gap: 16px; padding: 16px 16px;
  cursor: pointer; border-radius: 8px; transition: background 0.2s; position: relative;
  &:hover { background: $gray-100; }
}
.node-marker { position: absolute; left: -40px; top: 16px; display: flex; align-items: center; justify-content: center; }
.node-check, .node-dot, .node-pending-dot {
  width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center;
  justify-content: center; font-size: 13px; font-weight: 700;
}
.node-check { background: transparent; color: $success; font-size: 16px; }
.node-dot { background: $primary; box-shadow: 0 0 0 4px rgba($primary, 0.18); }
.node-pending-dot { background: $gray-300; }
.node-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.node-title { display: flex; align-items: center; gap: 12px; }
.node-step-num { font-size: 11px; font-weight: 600; color: $primary; background: rgba($primary, 0.1); padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px; }
.node-step-name { font-size: 15px; font-weight: 600; color: $gray-800; }
.node-handler { font-size: 13px; color: $gray-500; }
.node-meta { display: flex; align-items: center; gap: 16px; }
.meta-status {
  font-size: 12px; font-weight: 500;
  &.status-已完成 { color: $success; } &.status-进行中 { color: $primary; } &.status-待处理 { color: $gray-400; }
}
.meta-time { font-size: 12px; color: $gray-400; }
.node-toggle { display: flex; align-items: center; justify-content: center; color: $gray-400; }
.toggle-icon { font-size: 18px; transition: transform 0.2s; }
.node-body { padding: 0 16px 16px; }
.node-content { background: #f9fafb; border: 1px solid $gray-200; border-radius: 8px; padding: 20px; }
.content-inner .content-section .content-section-title { font-size: 14px; font-weight: 600; color: $gray-700; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid $gray-200; }
.content-tip { font-size: 12px; color: $gray-400; margin-top: 12px; }
.node-approval { padding: 8px 0 0; }
.approval-row { margin-bottom: 12px; }
.approval-field { display: flex; align-items: center; gap: 16px; }
.approval-field-full { display: flex; align-items: flex-start; gap: 16px; }
.approval-label { font-size: 14px; font-weight: 500; color: $gray-700; min-width: 80px; flex-shrink: 0; }
.approval-radio-group :deep(.t-radio) { margin-right: 24px; }
.approval-textarea { flex: 1; max-width: 500px; }
.flow-actions { display: flex; justify-content: center; gap: 16px; margin-top: 24px; padding-top: 24px; border-top: 1px solid $gray-200; }
:deep(.t-divider) { margin: 16px 0; }
.detail-body { max-height: 70vh; overflow-y: auto; padding: 4px 0; }
.detail-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 8px 0; }
.summary-item { display: flex; flex-direction: column; gap: 2px; }
.summary-label { font-size: 12px; color: $gray-500; }
.summary-value { font-size: 14px; color: $gray-800; font-weight: 500; }
.detail-step { border: 1px solid $gray-200; border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
.detail-step-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #f9fafb; border-bottom: 1px solid $gray-200; flex-wrap: wrap; }
.detail-step-num { font-size: 11px; font-weight: 600; color: $primary; background: rgba($primary, 0.1); padding: 2px 8px; border-radius: 4px; }
.detail-step-name { font-size: 14px; font-weight: 600; color: $gray-800; }
.detail-step-handler { font-size: 12px; color: $gray-500; margin-left: auto; }
.detail-step-time { font-size: 12px; color: $gray-400; }
.detail-step-content { padding: 12px 16px; }
.detail-field-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.detail-field-row-full { align-items: flex-start; }
.detail-field-label { font-size: 13px; color: $gray-500; min-width: 100px; flex-shrink: 0; }
.detail-field-value { font-size: 13px; color: $gray-800; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-box {
  text-align: center; padding: 20px; border: 1px solid $gray-200; border-radius: 8px;
  .stat-num { font-size: 24px; font-weight: 700; color: $primary; display: block; }
  .stat-label { font-size: 12px; color: $gray-500; margin-top: 4px; display: block; }
}
.underwriting-checklist { display: flex; flex-direction: column; gap: 8px; }

// Sub-step bar
.sub-step-bar { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 16px 0; }
.sub-step { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 70px; }
.sub-step-dot {
  width: 32px; height: 32px; border-radius: 50%; background: #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #94a3b8;
  .sub-step.done & { background: #10b981; color: #fff; }
}
.sub-step-label { font-size: 12px; color: #64748b; white-space: nowrap; }
.sub-step.done .sub-step-label { color: #10b981; font-weight: 600; }
.sub-step-arrow { color: #cbd5e1; font-size: 16px; margin-top: -10px; }
</style>
