<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/insurance/purchase">保险购买</t-breadcrumb-item>
        <t-breadcrumb-item>投保流程管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>

    <div class="page-header">
      <div class="page-title-wp">
        <div class="page-title">投保流程详情</div>
        <t-tag v-if="insuranceRecord" theme="primary" variant="light" size="small">进行中</t-tag>
      </div>
      <div class="policy-info">
        参考投保编号：<span class="policy-no">{{ insuranceRecord?.id || '-' }}</span>
      </div>
    </div>

    <div v-if="!insuranceRecord" class="empty-state">
      <template v-if="allRecords.length > 0">
        <h3 style="margin-bottom:16px;font-size:16px;color:#1e293b;">请选择一条投保记录查看流程</h3>
        <t-table
          :data="allRecords"
          :columns="[
            { colKey: 'id', title: '投保编号', width: 180 },
            { colKey: 'companyName', title: '企业名称' },
            { colKey: 'buyerName', title: '买方名称' },
            { colKey: 'insuranceAmount', title: '投保金额', cell: (h, { row }) => '$' + Number(row.insuranceAmount || 0).toLocaleString() },
            { colKey: 'status', title: '状态', cell: (h, { row }) => statusMap[row.status] || row.status },
            { colKey: 'action', title: '操作', cell: (h, { row }) => h('t-link', { theme: 'primary', onClick: () => router.push('/insurance/purchase-process?id=' + row.id) }, '查看流程') }
          ]"
          row-key="id"
          hover
          stripe
          @row-click="({ row }) => router.push('/insurance/purchase-process?id=' + row.id)"
        />
      </template>
      <template v-else>
        <empty-state title="暂无投保记录" description="请先在投保信息管理页面创建投保记录" />
        <t-button theme="primary" @click="goToList" style="margin-top:16px;">前往投保信息管理</t-button>
      </template>
    </div>

    <template v-else>
      <div class="flow-progress">
        <div class="flow-steps">
          <template v-for="(step, index) in processSteps" :key="step.step">
            <div class="flow-step-col">
              <div
                class="flow-step-dot"
                :class="{ completed: currentStep > step.step, active: currentStep === step.step }"
                @click="setStep(step.step)"
              >
                <span v-if="currentStep > step.step" class="flow-step-check">✓</span>
                <span v-else class="flow-step-num">{{ step.step }}</span>
              </div>
              <div class="flow-step-label" :class="{ active: currentStep === step.step, completed: currentStep > step.step }">
                {{ step.label }}
              </div>
              <div class="flow-step-status">
                <t-tag v-if="currentStep > step.step" theme="success" variant="light" size="small">已完成</t-tag>
                <t-tag v-else-if="currentStep === step.step" theme="primary" variant="light" size="small">进行中</t-tag>
                <t-tag v-else theme="default" variant="light" size="small">待处理</t-tag>
              </div>
            </div>
            <div v-if="index < processSteps.length - 1" class="flow-arrow" :class="{ completed: currentStep > step.step }">
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
          v-for="(step, index) in processSteps"
          :key="step.step"
          class="timeline-node"
          :class="{
            'node-completed': currentStep > step.step,
            'node-active': currentStep === step.step,
            'node-pending': currentStep < step.step
          }"
        >
          <div class="node-header" @click="toggleCollapse(index)">
            <div class="node-marker">
              <span v-if="currentStep > step.step" class="node-check">✓</span>
              <span v-else-if="currentStep === step.step" class="node-dot"></span>
              <span v-else class="node-pending-dot"></span>
            </div>
            <div class="node-info">
              <div class="node-title">
                <span class="node-step-num">Step {{ step.step }}</span>
                <span class="node-step-name">{{ step.label }}</span>
                <span v-if="index === 0" class="node-step-time">
                  开始时间：<em>{{ insuranceRecord.createTime || '-' }}</em>
                  <i class="time-sep"></i>
                  结束时间：<em>{{ insuranceRecord.submitTime || insuranceRecord.updateTime || '-' }}</em>
                </span>
                <span v-if="index === 1" class="node-step-time">
                  开始时间：<em>{{ insuranceRecord.generateTime || insuranceRecord.updateTime || '-' }}</em>
                  <i class="time-sep"></i>
                  结束时间：<em>{{ currentStep > 2 ? (insuranceRecord.updateTime || '-') : '进行中' }}</em>
                </span>
                <span v-if="index === 2" class="node-step-time">
                  开始时间：<em>{{ insuranceRecord.inkassoSignTime || insuranceRecord.generateTime || insuranceRecord.updateTime || '-' }}</em>
                  <i class="time-sep"></i>
                  结束时间：<em>{{ insuranceRecord.serviceFeePayTime || (currentStep > 3 ? insuranceRecord.updateTime : '进行中') || '-' }}</em>
                </span>
                <span v-if="index === 3" class="node-step-time">
                  开始时间：<em>{{ insuranceRecord.serviceFeePayTime || insuranceRecord.updateTime || '-' }}</em>
                  <i class="time-sep"></i>
                  结束时间：<em>{{ insuranceRecord.uwCompleteTime || (currentStep > 4 ? insuranceRecord.updateTime : '进行中') || '-' }}</em>
                </span>
                <span v-if="index === 4" class="node-step-time">
                  开始时间：<em>{{ insuranceRecord.uwCompleteTime || insuranceRecord.updateTime || '-' }}</em>
                  <i class="time-sep"></i>
                  结束时间：<em>{{ insuranceRecord.activateTime || (currentStep > 5 ? insuranceRecord.updateTime : '进行中') || '-' }}</em>
                </span>
                <span v-if="index === 5" class="node-step-time">
                  开始时间：<em>{{ insuranceRecord.activateTime || insuranceRecord.updateTime || '-' }}</em>
                  <i class="time-sep"></i>
                  结束时间：<em>{{ currentStep > 6 ? insuranceRecord.updateTime : '进行中' }}</em>
                </span>
                <t-tag :theme="stepRoles[index]?.role === userStore.role ? 'primary' : 'default'" variant="light" size="small">操作人：{{ stepRoles[index]?.label }}</t-tag>
              </div>
            </div>
            <div class="node-toggle">
              <t-icon :name="expandedSteps[index] ? 'chevron-up' : 'chevron-down'" />
            </div>
          </div>

          <div v-show="expandedSteps[index]" class="node-body">
            <!-- Step 1: 投保申请 -->
            <div v-if="index === 0" class="node-content">
            </div>

            <!-- Step 2: 跟单员审核 -->
            <div v-if="index === 1" class="node-content">
              <div class="content-inner">
                <div class="documents-title">审核材料清单</div>
                <t-table
                  :data="[
                    { name: '投保申请书', fileName: insuranceRecord.generatedForm?.[0]?.name || '投保申请书.xlsx', key: 'policy' },
                    { name: '买方信息采集表', fileName: insuranceRecord.generatedCollection?.[0]?.name || '买方信息采集表.xlsx', key: 'buyer' }
                  ]"
                  :columns="[
                    { colKey: 'name', title: '资料名称', width: 180 },
                    { colKey: 'fileName', title: '文件名称', width: 280 },
                    {
                      colKey: 'action', title: '操作', width: 100,
                      cell: (h, { row }) => h('t-link', {
                        theme: 'primary',
                        onClick: () => row.key === 'policy' ? handlePreviewPolicyApplication() : handlePreviewBuyerInfo()
                      }, '预览')
                    }
                  ]"
                  row-key="key"
                  hover
                  size="small"
                />
                <div v-if="currentStep === 2" class="step-actions">
                  <t-button v-if="userStore.role === 'clerk' && insuranceRecord.status === 'clerk_review'" theme="primary" @click="handleClerkApprove">审核通过</t-button>
                  <t-button v-if="userStore.role === 'clerk' && insuranceRecord.status === 'contract_signing'" theme="primary" @click="handleClerkPushESign">电子签合同签署</t-button>
                </div>
              </div>
            </div>

            <!-- Step 3: 服务确认 -->
            <div v-if="index === 2" class="node-content">
              <div class="content-inner">
                <div class="content-section">
                  <t-table
                    :data="[
                      { label: '电子签合同', key: 'contract' },
                      ...(insuranceRecord.serviceFeePaid ? [{ label: '缴费状态', key: 'paid' }] : [])
                    ]"
                    :columns="[
                      { colKey: 'label', title: '项目', width: 120 },
                      {
                        colKey: 'content', title: '内容',
                        cell: (h, { row }) => {
                          if (row.key === 'contract') return h('t-link', { theme: 'primary', onClick: showContractPreview }, '预览')
                          if (row.key === 'paid') return h('span', { style: 'color:#00a870;font-weight:600;' }, '已缴费')
                          return h('span', '')
                        }
                      }
                    ]"
                    row-key="key"
                    size="small"
                    hover
                  />
                  <div v-if="currentStep === 3" class="step-actions">
                    <t-button v-if="userStore.role === 'customer' && insuranceRecord.status === 'inkasso_signed'" theme="primary" @click="goToList">前往签署合同</t-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 4: 资信核保 -->
            <div v-if="index === 3" class="node-content">
              <div class="content-inner">
                <div v-if="insuranceRecord.stampedDocs && insuranceRecord.stampedDocs.length > 0" class="content-section">
                  <div class="content-section-title">客户提交资料</div>
                  <t-table
                    :data="insuranceRecord.stampedDocs.map((doc, i) => ({ ...doc, idx: i }))"
                    :columns="[
                      { colKey: 'name', title: '文件名称', ellipsis: true },
                      { colKey: 'size', title: '大小', width: 100, cell: (h, { row }) => h('span', formatFileSize(row.size)) },
                      {
                        colKey: 'action', title: '操作', width: 80,
                        cell: (h, { row }) => h('t-link', {
                          theme: 'primary',
                          onClick: () => previewStampedDoc(row)
                        }, '预览')
                      }
                    ]"
                    row-key="idx"
                    size="small"
                    hover
                  />
                </div>
                <div v-if="currentStep === 4" class="step-actions" style="margin-top:16px;">
                  <t-button v-if="userStore.role === 'clerk' && insuranceRecord.status === 'credit_investigating'" theme="primary" @click="goToList">核保审核</t-button>
                  <t-button v-if="userStore.role === 'clerk' && insuranceRecord.status === 'uw_completed'" theme="primary" @click="goToList">录入保单到平台</t-button>
                  <t-button v-if="userStore.role === 'inkasso' && insuranceRecord.status === 'platform_synced'" theme="primary" @click="goToList">保费确认申请</t-button>
                </div>
              </div>
            </div>

            <!-- Step 5: 保费支付 -->
            <div v-if="index === 4" class="node-content">
              <div class="content-inner">
                <div class="content-section">
                  <div class="content-section-title">保费支付信息</div>
                  <t-form label-width="120">
                    <t-form-item label="支付状态">
                      <span style="color:#00a870;font-weight:600;">已缴费</span>
                    </t-form-item>
                  </t-form>
                  <div v-if="insuranceRecord.voucherFiles && insuranceRecord.voucherFiles.length > 0" class="content-section" style="margin-top:16px;">
                    <div class="content-section-title">缴费凭证资料</div>
                    <t-table
                      :data="insuranceRecord.voucherFiles.map((doc, i) => ({ ...doc, idx: i }))"
                      :columns="[
                        { colKey: 'name', title: '文件名称', ellipsis: true },
                        { colKey: 'size', title: '大小', width: 100, cell: (h, { row }) => h('span', formatFileSize(row.size)) },
                        {
                          colKey: 'action', title: '操作', width: 80,
                          cell: (h, { row }) => h('t-link', {
                            theme: 'primary',
                            onClick: () => previewVoucherDoc(row)
                          }, '预览')
                        }
                      ]"
                      row-key="idx"
                      size="small"
                      hover
                    />
                  </div>
                  <div v-if="currentStep === 5" class="step-actions">
                    <t-button v-if="userStore.role === 'customer' && insuranceRecord.status === 'platform_synced'" theme="primary" @click="goToList">确认保费</t-button>
                    <t-button v-if="userStore.role === 'customer' && insuranceRecord.status === 'premium_confirmed'" theme="primary" @click="goToList">上传保费凭证</t-button>
                    <t-button v-if="userStore.role === 'inkasso' && insuranceRecord.status === 'payment_uploaded'" theme="primary" @click="goToList">保单生效</t-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 6: 保单生效 -->
            <div v-if="index === 5" class="node-content">
              <div class="content-inner">
                <div class="content-section">
                  <div class="content-section-title">保单生效信息</div>
                  <t-form label-width="120">
                    <t-form-item label="保单号"><t-input :value="insuranceRecord.policyNo || '-'" readonly /></t-form-item>
                    <t-form-item label="保单状态">
                      <t-tag v-if="insuranceRecord.status === 'active'" theme="success" variant="light">已生效</t-tag>
                      <t-tag v-else theme="default" variant="light">处理中</t-tag>
                    </t-form-item>
                  </t-form>
                  <div v-if="currentStep === 6 && userStore.role === 'clerk' && insuranceRecord.status === 'active'" class="step-actions">
                    <t-button theme="primary" @click="goToList">上传电子保单</t-button>
                  </div>
                </div>
              </div>
            </div>

            <t-divider />


	          </div>
	        </div>
      </div>

      <t-dialog v-model:visible="contractPreviewVisible" header="合同预览" width="900px" :footer="false" destroy-on-close>
        <div v-if="contractData" class="contract-sign-modal">
          <div class="contract-header">
            <div class="contract-title">{{ contractData.title }}</div>
            <div class="contract-version">版本：{{ contractData.version }}</div>
          </div>
          <div class="contract-parties">
            <div class="party-info-row">
              <span class="party-label">甲方（保险人）：</span>
              <span class="party-value">{{ insuranceRecord.insuranceCompanyName || insuranceRecord.preferredInsuranceOrgType || '人保财险' }}</span>
            </div>
            <div class="party-info-row">
              <span class="party-label">乙方（被保险人）：</span>
              <span class="party-value">{{ insuranceRecord.companyName || '-' }}</span>
            </div>
            <div class="party-info-row">
              <span class="party-label">投保编号：</span>
              <span class="party-value">{{ insuranceRecord.id }}</span>
            </div>
          </div>
          <div class="contract-clauses">
            <div v-for="clause in contractData.clauses" :key="clause.id" class="clause-item">
              <div class="clause-title">{{ clause.title }}</div>
              <div class="clause-content">{{ clause.content }}</div>
            </div>
          </div>
        </div>
        <template #footer>
          <t-button @click="contractPreviewVisible = false">关闭</t-button>
        </template>
      </t-dialog>

      <t-dialog v-model:visible="stampPreviewVisible" header="客户资料预览" width="800px" :footer="false" destroy-on-close>
        <div class="preview-modal">
          <img v-if="stampPreviewUrl" :src="stampPreviewUrl" style="max-width:100%;max-height:500px;display:block;margin:0 auto;" />
        </div>
        <template #footer>
          <t-button @click="stampPreviewVisible = false">关闭</t-button>
        </template>
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

      <div class="flow-actions">
        <t-button v-if="viewingStep > 1" variant="outline" @click="viewPrevStep">上一步</t-button>
        <t-button v-if="viewingStep < 6" variant="outline" @click="viewNextStep">下一步</t-button>
        <t-button variant="outline" @click="goToList">返回列表</t-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { useBusinessStore } from '@/stores/business'
import { useUserStore } from '@/stores/user'
import EmptyState from '@/components/common/EmptyState.vue'
import * as XLSX from 'xlsx'
import { generatePolicyApplicationXlsx, generateBuyerInfoXlsx } from '@/utils/templateFiller'

const route = useRoute()
const router = useRouter()
const store = useBusinessStore()
const userStore = useUserStore()

const contractPreviewVisible = ref(false)
const contractData = computed(() => store.getContractTemplate('default'))

const formatFileSize = (bytes) => {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

const showContractPreview = () => {
  contractPreviewVisible.value = true
}

const stampPreviewVisible = ref(false)
const stampPreviewUrl = ref('')

const previewStampedDoc = (doc) => {
  if (!doc.data) {
    MessagePlugin.warning('文件数据不可用')
    return
  }
  const mimeType = doc.type || 'image/png'
  const dataUrl = `data:${mimeType};base64,${doc.data}`
  if (mimeType === 'application/pdf') {
    window.open(dataUrl, '_blank')
  } else {
    stampPreviewUrl.value = dataUrl
    stampPreviewVisible.value = true
  }
}

const previewVoucherDoc = (doc) => {
  if (!doc.data) {
    MessagePlugin.warning('文件数据不可用')
    return
  }
  const mimeType = doc.type || 'image/png'
  const dataUrl = `data:${mimeType};base64,${doc.data}`
  if (mimeType === 'application/pdf') {
    window.open(dataUrl, '_blank')
  } else {
    stampPreviewUrl.value = dataUrl
    stampPreviewVisible.value = true
  }
}

const previewVisible = ref(false)
const previewTitle = ref('')
const previewSheets = ref([])
const previewActiveSheet = ref('')
const previewWorkbook = ref(null)
const previewFilename = ref('')

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

const handlePreviewPolicyApplication = () => {
  const row = insuranceRecord.value
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

const handlePreviewBuyerInfo = () => {
  const row = insuranceRecord.value
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

const isCustomer = computed(() => userStore.role === 'customer')
const isInkasso = computed(() => userStore.role === 'inkasso')
const isClerk = computed(() => userStore.role === 'clerk')

const viewingStep = ref(1)
const expandedSteps = reactive([true, false, false, false, false, false])

const processSteps = [
  { step: 1, label: '投保申请' },
  { step: 2, label: '跟单员审核' },
  { step: 3, label: '服务确认' },
  { step: 4, label: '资信核保' },
  { step: 5, label: '保费支付' },
  { step: 6, label: '保单生效' }
]

const stepRoles = [
  { role: 'customer', label: '客户', action: '' },
  { role: 'clerk', label: '跟单员', action: '审核投保资料' },
  { role: 'inkasso', label: '长安银科', action: '推送电子签' },
  { role: 'inkasso', label: '保险公司', action: '核保审核' },
  { role: 'customer', label: '客户', action: '支付保费' },
  { role: 'inkasso', label: '长安银科', action: '确认保单生效' }
]

const statusMap = {
  draft: '待确认',
  pending_review: '待平台审核',
  clerk_review: '跟单员审核',
  clerk_review: '跟单员审核',
  contract_signing: '审核通过',
  inkasso_signed: '服务已确认',
  contract_signed: '合同已签署',
  service_fee_paid: '服务费已支付',
  credit_investigating: '资信调查',
  limit_approving: '限额审批',
  underwriting: '核保出单',
  uw_completed: '核保已完成',
  platform_synced: '待缴纳保单费用',
  premium_confirmed: '保费已确认',
  payment_uploaded: '凭证已上传',
  active: '已生效',
  rejected: '已拒绝',
  pending_payment: '待缴费'
}

const statusToStep = {
  draft: 1, rejected: 1, pending_review: 1,
  clerk_review: 2,
  contract_signing: 3, inkasso_signed: 3, contract_signed: 3, service_fee_paid: 3,
  credit_investigating: 4, limit_approving: 4, underwriting: 4, uw_completed: 4,
  platform_synced: 5, premium_confirmed: 5, payment_uploaded: 5,
  active: 6
}

const allRecords = computed(() => store.insuranceApplications || [])

const insuranceRecord = computed(() => {
  const id = route.query.id
  if (!id) return null
  return store.insuranceApplications.find(a => a.id === id) || null
})

const currentStep = computed(() => {
  if (!insuranceRecord.value) return 0
  if (insuranceRecord.value.status === 'active') return 7
  return statusToStep[insuranceRecord.value.status] || 0
})

const isStepOperator = computed(() => {
  const idx = currentStep.value - 1
  if (idx < 0 || idx >= stepRoles.length) return false
  return userStore.role === stepRoles[idx].role
})

const formData = reactive({})
processSteps.forEach(s => {
  formData['step' + s.step] = {
    approvalResult: '',
    auditOpinion: ''
  }
})

onMounted(() => {
  store.ensureSeeded()
  if (!route.query.id) {
    if (store.insuranceApplications.length > 0) {
      router.replace('/insurance/purchase-process?id=' + store.insuranceApplications[0].id)
    }
  }
  // 初始化当前查看步骤为实际流程步骤
  if (insuranceRecord.value) {
    const step = currentStep.value
    viewingStep.value = step >= 1 && step <= 6 ? step : 1
    setStep(viewingStep.value)
  }
})

const toggleCollapse = (index) => {
  expandedSteps[index] = !expandedSteps[index]
}

const setStep = (step) => {
  viewingStep.value = step
  for (let i = 0; i < expandedSteps.length; i++) {
    expandedSteps[i] = i === step - 1
  }
  const el = document.querySelector('.timeline-node.node-active')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const viewPrevStep = () => {
  const current = viewingStep.value
  if (current > 1) {
    setStep(current - 1)
  }
}

const viewNextStep = () => {
  if (viewingStep.value < 6) setStep(viewingStep.value + 1)
}

const getStepStatus = (index) => {
  const step = index + 1
  if (currentStep.value > step) return '已完成'
  if (currentStep.value === step) return '进行中'
  return '待处理'
}

const goToList = () => {
  router.push('/insurance/purchase')
}

const goToEdit = () => {
  router.push('/insurance/purchase/' + insuranceRecord.value.id + '/edit')
}

const handleSubmit = () => {
  const res = store.submitInsuranceApplication(insuranceRecord.value.id)
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '提交失败')
    return
  }
  MessagePlugin.success('投保申请已提交')
}

const handleDelete = () => {
  MessagePlugin.info('请前往投保信息管理页面执行删除操作')
  router.push('/insurance/purchase')
}

const handleGenerateDocuments = () => {
  MessagePlugin.info('请前往投保信息管理页面生成投保资料')
  router.push('/insurance/purchase')
}

const handleContractSigning = () => {
  MessagePlugin.info('请前往投保信息管理页面进行服务确认')
  router.push('/insurance/purchase')
}

const handleClerkApprove = () => {
  const result = store.generateDocuments(insuranceRecord.value.id)
  if (!result.ok) {
    MessagePlugin.error(result.message || '操作失败')
    return
  }
  store.touchInsuranceApplications()
  MessagePlugin.success('审核通过')
}

const handleClerkPushESign = () => {
  const result = store.signInsuranceContract(insuranceRecord.value.id, 'inkasso')
  if (result.ok) {
    store.touchInsuranceApplications()
    MessagePlugin.success('电子签合同已自动推送客户签署')
  } else {
    MessagePlugin.error(result.message || '操作失败')
  }
}

const handlePushESign = () => {
  const result = store.signInsuranceContract(insuranceRecord.value.id, 'inkasso')
  if (result.ok) {
    store.touchInsuranceApplications()
    MessagePlugin.success('已推送客户电子签合同签署')
  } else {
    MessagePlugin.error(result.message || '操作失败')
  }
}

const handleStepAction = () => {
  const step = currentStep.value
  if (step === 1 && isCustomer.value) {
    handleSubmit()
  } else {
    MessagePlugin.info('请前往投保信息管理页面完成操作')
    router.push('/insurance/purchase')
  }
}
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title-wp { display: flex; align-items: center; gap: 10px; }
.page-title { font-size: 18px; font-weight: 700; color: #1e293b; }
.policy-info { font-size: 13px; color: #64748b; }
.policy-no { font-weight: 600; color: #0052d9; }
.breadcrumbs { margin-bottom: 16px; }
.empty-state { text-align: center; padding: 80px 0; }

.flow-progress {
  background: #fff; border: 1px solid #eef2f6; border-radius: 12px;
  padding: 24px 32px; margin-bottom: 24px;
}
.flow-steps { display: flex; align-items: flex-start; justify-content: center; }
.flow-step-col { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 80px; }
.flow-step-dot {
  width: 40px; height: 40px; border-radius: 50%; background: #e2e8f0;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: all 0.3s ease; flex-shrink: 0;
  .flow-step-num, .flow-step-check { font-size: 15px; font-weight: 700; color: #94a3b8; }
  &.completed { background: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15); .flow-step-check { color: #fff; } }
  &.active { background: #0052d9; box-shadow: 0 0 0 4px rgba(0, 82, 217, 0.18); .flow-step-num { color: #fff; } }
}
.flow-step-label {
  font-size: 12px; color: #94a3b8; text-align: center; font-weight: 500; line-height: 1.3;
  &.completed { color: #10b981; } &.active { color: #0052d9; font-weight: 600; }
}
.flow-step-status :deep(.t-tag) { min-width: 52px; justify-content: center; }
.flow-arrow {
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  margin-top: 8px; color: #cbd5e1; transition: color 0.3s ease;
  &.completed { color: #10b981; }
}

.flow-timeline { background: #fff; border: 1px solid #eef2f6; border-radius: 12px; overflow: hidden; }
.timeline-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid #eef2f6; background: #fafbfc; }
.timeline-title { font-size: 15px; font-weight: 600; color: #1e293b; }
.timeline-hint { font-size: 12px; color: #94a3b8; }

.timeline-node {
  border-left: 3px solid #e2e8f0; margin-left: 31px; padding: 0 0 0 24px; position: relative;
  &:last-child { border-left-color: transparent; }
  &.node-completed { border-left-color: #10b981; .node-check { background: #10b981; color: #fff; } }
  &.node-active { border-left-color: #0052d9; .node-dot { background: #0052d9; box-shadow: 0 0 0 4px rgba(0, 82, 217, 0.18); } }
  &.node-pending .node-pending-dot { background: #cbd5e1; }
}

.node-header {
  display: flex; align-items: center; padding: 14px 16px; cursor: pointer;
  transition: background 0.2s; gap: 12px;
  &:hover { background: #f8fafc; }
}
.node-marker { position: relative; flex-shrink: 0; }
.node-check, .node-dot, .node-pending-dot {
  width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700;
}
.node-check { background: #e2e8f0; color: #94a3b8; }
.node-dot { width: 14px; height: 14px; border-radius: 50%; margin: 7px; }
.node-pending-dot { width: 10px; height: 10px; border-radius: 50%; margin: 9px; }
.node-info { flex: 1; min-width: 0; }
.node-title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.node-step-num { font-size: 11px; font-weight: 600; color: #0052d9; background: rgba(0, 82, 217, 0.1); padding: 2px 8px; border-radius: 4px; }
.node-step-name { font-size: 14px; font-weight: 600; color: #1e293b; }
.node-step-time { font-size: 12px; color: #64748b; display: inline-flex; align-items: center; gap: 4px; }
.node-step-time em { font-style: normal; color: #1e293b; font-weight: 500; }
.node-step-time .time-sep { display: inline-block; width: 12px; }
.node-meta { display: flex; gap: 12px; margin-top: 4px; font-size: 12px; }
.meta-status { font-weight: 500; color: #64748b; }
.meta-status.status-已完成 { color: #10b981; }
.meta-status.status-进行中 { color: #0052d9; }
.meta-status.status-待处理 { color: #94a3b8; }
.meta-time { color: #94a3b8; }
.node-toggle { flex-shrink: 0; color: #94a3b8; }

.node-body { border-top: 1px solid #f1f5f9; }
.node-content { padding: 16px 24px; }
.content-inner { max-width: 800px; }
.content-section { margin-bottom: 8px; }
.content-section:last-child { margin-bottom: 0; }
.content-section-title { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 12px; padding-left: 8px; border-left: 3px solid #0052d9; }
.step-actions { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }

.service-confirm-list { display: flex; flex-direction: column; gap: 12px; padding: 4px 0; }
.confirm-item { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.confirm-label { color: #666; min-width: 100px; }

.preview-info-section { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.preview-info-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.preview-label { color: #64748b; font-weight: 500; min-width: 80px; }
.preview-value { color: #1e293b; }
.divider { height: 1px; background: #eef2f6; margin: 12px 0; }
.documents-title { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 12px; }

.preview-modal { padding: 8px 0; }

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

  :deep(tr:nth-child(even)) {
    background: #fafbfc;
  }

  :deep(tr:hover) {
    background: #f1f5f9;
  }

  :deep(.excel-fm-text) { text-align: left; }
  :deep(.excel-fm-number) { text-align: right; }
  :deep(.excel-fm-datetime) { text-align: center; }
}

.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }

.contract-sign-modal { max-height: 560px; overflow-y: auto; }
.contract-header { text-align: center; padding: 16px 0; border-bottom: 1px solid #eef2f6; }
.contract-title { font-size: 18px; font-weight: 700; color: #1e293b; }
.contract-version { font-size: 12px; color: #94a3b8; margin-top: 4px; }
.contract-parties { padding: 16px 0; border-bottom: 1px solid #eef2f6; }
.party-info-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 14px; }
.party-label { color: #64748b; font-weight: 500; min-width: 120px; }
.party-value { color: #1e293b; font-weight: 500; }
.contract-clauses { padding: 8px 0; }
.clause-item { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
.clause-item:last-child { border-bottom: none; }
.clause-title { font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 6px; }
.clause-content { font-size: 13px; color: #475569; line-height: 1.8; text-align: justify; }

.service-fee-paid-tag { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; padding: 8px 16px; background: rgba(0,168,112,0.08); border-radius: 6px; font-size: 14px; font-weight: 600; color: #00a870; }

.node-approval { padding: 16px 24px; background: #fafbfc; }
.step-time-list { padding: 8px 0; }
.step-time-list .time-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #eef2f6; }
.step-time-list .time-row:last-child { border-bottom: none; }
.step-time-list .time-label { width: 100px; font-size: 13px; color: #64748b; flex-shrink: 0; }
.step-time-list .time-value { font-size: 13px; color: #1e293b; }
.approval-row { margin-bottom: 12px; }
.approval-field { display: flex; align-items: center; gap: 12px; }
.approval-field-full { align-items: flex-start; }
.approval-label { font-size: 13px; font-weight: 600; color: #475569; min-width: 80px; flex-shrink: 0; }
.approval-textarea { flex: 1; }

.flow-actions {
  display: flex; justify-content: center; gap: 12px; margin-top: 24px; padding: 16px 0;
}
</style>
