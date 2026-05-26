<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/policy/list">保单管理</t-breadcrumb-item>
        <t-breadcrumb-item>保单变更管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">保单变更管理</div>
    </div>

    <div class="stats-grid mb-24">
      <stat-card title="总申请" :value="totalCount" icon="file" color="primary" />
      <stat-card title="待处理" :value="pendingCount" icon="search" color="warning" />
      <stat-card title="已完成" :value="completedCount" icon="check-circle" color="success" />
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
        <status-tag :status="row.status" :status-map="chgStatusMap" />
      </template>
      <template #operation="{ row }">
        <t-space>
          <t-link @click="handleView(row)">查看</t-link>

          <!-- Customer operations -->
          <t-link v-if="isCustomer && row.status === 'chg_draft'" theme="primary" @click="handleEdit(row)">编辑</t-link>
          <t-link v-if="isCustomer && row.status === 'chg_draft'" theme="primary" @click="handleSubmitToPlatform(row)">提交平台审核</t-link>
          <t-link v-if="isCustomer && row.status === 'chg_insurer_approved'" theme="primary" @click="handleGenerateEndorsement(row)">生成批单</t-link>
          <t-link v-if="isCustomer && (row.status === 'chg_supplement' || row.status === 'chg_platform_supplemented')" theme="primary" @click="handleCustomerSupplement(row)">补充材料</t-link>

          <!-- Inkasso operations -->
          <t-link v-if="isInkasso && row.status === 'chg_platform_review' && !row.generatedChangeForm.length" theme="primary" @click="handleGenerateDocs(row)">生成变更申请表</t-link>
          <t-link v-if="isInkasso && row.status === 'chg_platform_review' && !row.generatedChecklist.length" theme="primary" @click="handleGenerateChecklist(row)">生成材料清单</t-link>
          <t-link v-if="isInkasso && row.status === 'chg_platform_review' && row.generatedChangeForm.length" theme="danger" @click="handleDeleteDocs(row, 'form')">删除变更申请表</t-link>
          <t-link v-if="isInkasso && row.status === 'chg_platform_review' && row.generatedChecklist.length" theme="danger" @click="handleDeleteDocs(row, 'checklist')">删除材料清单</t-link>
          <t-link v-if="isInkasso && row.status === 'chg_platform_review' && row.generatedChangeForm.length > 0 && !row.rejectReason" theme="primary" @click="handlePushToClerk(row)">推送给跟单员</t-link>
          <t-link v-if="isInkasso && row.status === 'chg_platform_review' && row.rejectReason" theme="primary" @click="handlePushCustomerSupplement(row)">推送客户补充资料</t-link>
          <t-link v-if="isClerk && row.status === 'chg_insurer_review'" theme="success" @click="handleInsurerApprove(row)">批准</t-link>
          <t-link v-if="isClerk && row.status === 'chg_insurer_review'" theme="danger" @click="handleInsurerReject(row)">驳回</t-link>
          <t-link v-if="isClerk && row.status === 'chg_insurer_approved'" theme="primary" @click="handleSyncPlatform(row)">同步平台记录</t-link>
          <t-link v-if="isInkasso && row.status === 'chg_supplement'" theme="primary" @click="handlePlatformSupplement(row)">补充材料</t-link>
          <t-link v-if="isInkasso && (row.status === 'chg_customer_supplement')" theme="primary" @click="handleResubmitPlatform(row)">提交平台</t-link>

          <!-- Clerk operations -->
          <t-link v-if="isClerk && row.status === 'chg_clerk_review'" theme="primary" @click="handleClerkSubmitToInsurer(row)">审核通过</t-link>
          <t-link v-if="isClerk && row.status === 'chg_clerk_review'" theme="danger" @click="handleClerkReject(row)">驳回</t-link>
          <t-link v-if="isClerk && row.status === 'chg_insurer_approved'" theme="primary" @click="handleClerkUpdateRecord(row)">录入变更记录</t-link>
          <t-link v-if="isClerk && row.status === 'chg_insurer_rejected'" theme="primary" @click="handleInitiateSupplement(row)">发起补充请求</t-link>
          <t-link v-if="isClerk && row.status === 'chg_platform_review'" theme="primary" @click="handleResubmitClerk(row)">提交二次审核</t-link>
        </t-space>
      </template>
    </data-table>

    <!-- View Detail Dialog -->
    <t-dialog v-model:visible="detailVisible" :header="'变更详情 - ' + (detailRow?.id || '')" width="800px" :footer="false">
      <div v-if="detailRow" class="detail-body">
        <div class="detail-card">
          <div class="detail-card-title">📋 基本信息</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">申请编号</span><span class="detail-value">{{ detailRow.id }}</span></div>
            <div class="detail-row"><span class="detail-label">保单号</span><span class="detail-value">{{ detailRow.policyNo }}</span></div>
            <div class="detail-row"><span class="detail-label">变更类型</span><span class="detail-value">{{ detailRow.changeTypeName }}</span></div>
            <div class="detail-row"><span class="detail-label">变更原因</span><span class="detail-value">{{ detailRow.changeReason }}</span></div>
            <div class="detail-row"><span class="detail-label">变更前内容</span><span class="detail-value">{{ detailRow.beforeContent || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">变更后内容</span><span class="detail-value">{{ detailRow.afterContent || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">生效日期</span><span class="detail-value">{{ detailRow.effectiveDate || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">状态</span><span class="detail-value"><status-tag :status="detailRow.status" :status-map="chgStatusMap" /></span></div>
          </div>
        </div>

        <div class="detail-card">
          <div class="detail-card-title">📎 上传文件</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">变更申请书</span><span class="detail-value">{{ detailRow.changeApplication?.[0]?.name || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">证明材料</span><span class="detail-value">{{ detailRow.supportingDocs?.[0]?.name || '-' }}</span></div>
          </div>
        </div>

        <div v-if="detailRow.generatedChangeForm.length > 0" class="detail-card">
          <div class="detail-card-title">📄 平台生成文件</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">变更申请表</span><span class="detail-value">{{ detailRow.generatedChangeForm[0]?.name || '-' }} <t-link v-if="isInkasso" theme="primary" @click="handleDocPreview(detailRow, 'change_form')">预览</t-link></span></div>
            <div class="detail-row"><span class="detail-label">材料清单</span><span class="detail-value">{{ detailRow.generatedChecklist[0]?.name || '-' }} <t-link v-if="isInkasso" theme="primary" @click="handleDocPreview(detailRow, 'checklist')">预览</t-link></span></div>
          </div>
        </div>

        <div v-if="detailRow.rejectReason" class="detail-card">
          <div class="detail-card-title">驳回原因</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">驳回原因</span><span class="detail-value" style="color:#e34d57;">{{ detailRow.rejectReason }}</span></div>
          </div>
        </div>

        <div v-if="detailRow.insurerDecision" class="detail-card">
          <div class="detail-card-title">🏛️ 保险公司决定</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">决定</span><span class="detail-value" :style="{ color: detailRow.insurerDecision === 'approved' ? '#00a870' : '#e34d57' }">{{ detailRow.insurerDecision === 'approved' ? '已通过' : '已驳回' }}</span></div>
            <div class="detail-row"><span class="detail-label">意见</span><span class="detail-value">{{ detailRow.insurerOpinion || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">决定时间</span><span class="detail-value">{{ detailRow.insurerDecisionTime || '-' }}</span></div>
            <div class="detail-row"><span class="detail-label">附件</span><span class="detail-value">{{ detailRow.insurerAttachments?.[0]?.name || '-' }}</span></div>
          </div>
        </div>

        <div v-if="detailRow.clerkUpdateRecord" class="detail-card">
          <div class="detail-card-title">✏️ 跟单员变更记录</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">变更记录</span><span class="detail-value">{{ detailRow.clerkUpdateRecord }}</span></div>
            <div class="detail-row"><span class="detail-label">录入时间</span><span class="detail-value">{{ detailRow.clerkSyncTime || '-' }}</span></div>
          </div>
        </div>

        <div v-if="detailRow.supplementRequest" class="detail-card">
          <div class="detail-card-title">📝 补充材料请求</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">补充要求</span><span class="detail-value">{{ detailRow.supplementRequest }}</span></div>
            <div class="detail-row"><span class="detail-label">推送时间</span><span class="detail-value">{{ detailRow.platformPushTime || '-' }}</span></div>
          </div>
        </div>

        <div v-if="detailRow.endorsementNo" class="detail-card">
          <div class="detail-card-title">📄 批单信息</div>
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">批单编号</span><span class="detail-value">{{ detailRow.endorsementNo }}</span></div>
            <div class="detail-row"><span class="detail-label">生成时间</span><span class="detail-value">{{ detailRow.endorsementTime || '-' }}</span></div>
          </div>
        </div>
      </div>
    </t-dialog>

    <!-- Reject Dialog -->
    <t-dialog v-model:visible="rejectVisible" header="驳回变更申请" width="500px">
      <div class="reject-content">
        <div class="confirm-tip" style="margin-top:0;">
          <t-icon name="warning-circle" size="16px" class="tip-icon danger" />
          <span class="tip-text">确认驳回该变更申请？驳回后将退回平台重新处理。</span>
        </div>
        <div class="reject-form" style="margin-top:16px;">
          <label class="reject-label">驳回原因 <span style="color:#dc2626;">*</span></label>
          <t-textarea v-model="rejectReason" placeholder="请输入驳回原因" :rows="4" maxlength="500" show-limit-number />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="rejectVisible = false">取消</t-button>
          <t-button theme="danger" @click="confirmReject">确认驳回</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- Supplement Dialog -->
    <t-dialog v-model:visible="supplementVisible" :header="supplementMode === 'initiate' ? '发起补充材料请求' : (supplementMode === 'platform' ? '平台补充材料' : '客户补充材料')" width="550px">
      <div class="supplement-content">
        <div v-if="supplementMode === 'initiate'" class="reject-content">
          <div class="confirm-tip" style="margin-top:0;">
            <t-icon name="info-circle-filled" size="16px" class="tip-icon" />
            <span class="tip-text">保险公司已驳回，发起补充材料请求推送给平台和客户。</span>
          </div>
          <div class="reject-form" style="margin-top:16px;">
            <label class="reject-label">补充要求说明 <span style="color:#dc2626;">*</span></label>
            <t-textarea v-model="supplementRequest" placeholder="请输入补充要求" :rows="4" maxlength="500" show-limit-number />
          </div>
        </div>
        <div v-if="supplementMode === 'platform'" class="reject-content">
          <div class="confirm-tip" style="margin-top:0;">
            <t-icon name="info-circle-filled" size="16px" class="tip-icon" />
            <span class="tip-text">平台补充相关材料，同时会向客户推送补充材料请求。</span>
          </div>
          <div class="reject-form" style="margin-top:16px;">
            <label class="reject-label">补充说明</label>
            <t-textarea v-model="supplementRequest" placeholder="请输入补充说明" :rows="3" />
          </div>
        </div>
        <div v-if="supplementMode === 'customer'" class="reject-content">
          <div class="confirm-tip" style="margin-top:0;">
            <t-icon name="info-circle-filled" size="16px" class="tip-icon" />
            <span class="tip-text">请上传补充材料后提交。</span>
          </div>
          <div class="reject-form" style="margin-top:16px;">
            <label class="reject-label">补充材料</label>
            <t-upload v-model="supplementFiles" theme="file" :auto-upload="false" accept="application/pdf,image/jpeg,image/png" placeholder="选择补充文件" />
          </div>
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="supplementVisible = false">取消</t-button>
          <t-button theme="primary" @click="confirmSupplement">确认</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- Insurer Approve Dialog -->
    <t-dialog v-model:visible="insurerApproveVisible" header="批准保险公司审核" width="500px">
      <div class="insurer-content">
        <div class="confirm-tip" style="margin-top:0;">
          <t-icon name="info-circle-filled" size="16px" class="tip-icon" />
          <span class="tip-text">确认批准该变更申请？批准后自动同步决定结果给平台。</span>
        </div>
        <div class="reject-form" style="margin-top:16px;">
          <label class="reject-label">审核意见</label>
          <t-textarea v-model="insurerOpinion" placeholder="请输入审核意见（可选）" :rows="3" />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="insurerApproveVisible = false">取消</t-button>
          <t-button theme="success" @click="confirmInsurerApprove">确认批准</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- Insurer Reject Dialog -->
    <t-dialog v-model:visible="insurerRejectVisible" header="驳回保险公司审核" width="500px">
      <div class="insurer-content">
        <div class="confirm-tip" style="margin-top:0;">
          <t-icon name="warning-circle" size="16px" class="tip-icon danger" />
          <span class="tip-text">驳回该变更申请，将退回跟单员处理。</span>
        </div>
        <div class="reject-form" style="margin-top:16px;">
          <label class="reject-label">审批意见 <span style="color:#dc2626;">*</span></label>
          <t-textarea v-model="insurerRejectOpinion" placeholder="请输入审批意见" :rows="4" maxlength="500" show-limit-number />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="insurerRejectVisible = false">取消</t-button>
          <t-button theme="danger" @click="confirmInsurerReject">确认驳回</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- Clerk Update Record Dialog -->
    <t-dialog v-model:visible="recordVisible" header="录入变更记录" width="500px">
      <div class="record-content">
        <div class="confirm-tip" style="margin-top:0;">
          <t-icon name="info-circle-filled" size="16px" class="tip-icon" />
          <span class="tip-text">录入变更记录，完成后同步给平台。</span>
        </div>
        <div class="reject-form" style="margin-top:16px;">
          <label class="reject-label">变更记录 <span style="color:#dc2626;">*</span></label>
          <t-textarea v-model="clerkRecord" placeholder="请输入变更记录内容" :rows="4" maxlength="500" show-limit-number />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="recordVisible = false">取消</t-button>
          <t-button theme="primary" @click="confirmRecord">确认录入</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- Supplement Initiate Dialog (from clerk for insurer rejected) -->
    <t-dialog v-model:visible="supplementInitVisible" header="发起补充材料请求" width="550px">
      <div class="reject-content">
        <div class="confirm-tip" style="margin-top:0;">
          <t-icon name="info-circle-filled" size="16px" class="tip-icon" />
          <span class="tip-text">推送给平台和客户进行补充材料。</span>
        </div>
        <div class="reject-form" style="margin-top:16px;">
          <label class="reject-label">补充要求 <span style="color:#dc2626;">*</span></label>
          <t-textarea v-model="supplementRequest" placeholder="请输入补充材料要求" :rows="4" maxlength="500" show-limit-number />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="supplementInitVisible = false">取消</t-button>
          <t-button theme="primary" @click="confirmSupplementInit">确认发起</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- Push Customer Supplement Dialog -->
    <t-dialog v-model:visible="pushSupplementVisible" header="推送客户补充资料" width="500px">
      <div class="reject-content">
        <div class="confirm-tip" style="margin-top:0;">
          <t-icon name="info-circle-filled" size="16px" class="tip-icon" />
          <span class="tip-text">跟单员驳回的申请将推送给客户补充材料，系统将记录推送历史。</span>
        </div>
        <div class="reject-form" style="margin-top:16px;">
          <label class="reject-label">补充要求 <span style="color:#dc2626;">*</span></label>
          <t-textarea v-model="pushSupplementRequest" placeholder="请输入需要客户补充的材料要求" :rows="4" maxlength="500" show-limit-number />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="pushSupplementVisible = false">取消</t-button>
          <t-button theme="primary" @click="confirmPushCustomerSupplement">确认推送</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- Document Preview Dialog -->
    <t-dialog v-model:visible="docPreviewVisible" :header="docPreviewTitle" width="750px" :destroy-on-close="true" :draggable="true" top="48px">
      <div v-if="docPreviewContent" class="doc-preview-wrapper">
        <div class="doc-preview-header">
          <span class="doc-preview-meta">文件名称：{{ docPreviewFileName }}</span>
          <span class="doc-preview-meta">文件大小：{{ docPreviewFileSize }}</span>
        </div>
        <div class="doc-preview-body" v-html="docPreviewContent"></div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="docPreviewVisible = false">关闭</t-button>
        </t-space>
      </template>
    </t-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import { useBusinessStore } from '@/stores/business'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const store = useBusinessStore()
const userStore = useUserStore()
const loading = computed(() => false)

const isInkasso = computed(() => userStore.role === 'inkasso')
const isClerk = computed(() => userStore.role === 'clerk')
const isCustomer = computed(() => userStore.role === 'customer')

const chgStatusMap = {
  chg_draft: '待提交',
  chg_platform_review: '平台审核中',
  chg_clerk_review: '跟单员审核中',
  chg_insurer_review: '保险公司审核中',
  chg_insurer_approved: '保险公司已通过',
  chg_insurer_rejected: '保险公司已驳回',
  chg_supplement: '待补充材料',
  chg_platform_supplemented: '平台已补充',
  chg_customer_supplement: '客户已补充',
  chg_completed: '已完成'
}

const columns = [
  { colKey: 'id', title: '申请编号', width: 120 },
  { colKey: 'policyNo', title: '保单号', width: 140 },
  { colKey: 'changeTypeName', title: '变更类型', width: 100 },
  { colKey: 'changeReason', title: '变更原因', ellipsis: true },
  { colKey: 'createTime', title: '申请时间', width: 150 },
  { colKey: 'status', title: '状态', width: 110, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 200, fixed: 'right', slot: 'operation' }
]

const pagination = reactive({ total: 0, current: 1, pageSize: 20 })

const allData = computed(() => store.policyChangeApplications || [])

const totalCount = computed(() => allData.value.length)
const pendingCount = computed(() => allData.value.filter(p =>
  ['chg_draft', 'chg_platform_review', 'chg_clerk_review', 'chg_insurer_review',
   'chg_supplement', 'chg_platform_supplemented', 'chg_customer_supplement'].includes(p.status)
).length)
const completedCount = computed(() => allData.value.filter(p =>
  ['chg_completed', 'chg_insurer_approved'].includes(p.status)
).length)

const filteredData = computed(() => {
  return allData.value
})

const tableData = computed(() => {
  pagination.total = filteredData.value.length
  const start = (pagination.current - 1) * pagination.pageSize
  return filteredData.value.slice(start, start + pagination.pageSize)
})

const handlePageChange = (pageInfo) => {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
}

// Dialogs state
const detailVisible = ref(false)
const detailRow = ref(null)
const rejectVisible = ref(false)
const rejectReason = ref('')
const rejectTarget = ref(null)
const supplementVisible = ref(false)
const supplementMode = ref('')
const supplementRequest = ref('')
const supplementFiles = ref([])
const insurerApproveVisible = ref(false)
const insurerOpinion = ref('')
const insurerRejectVisible = ref(false)
const insurerRejectOpinion = ref('')
const recordVisible = ref(false)
const clerkRecord = ref('')
const supplementInitVisible = ref(false)

const handleView = (row) => {
  detailRow.value = row
  detailVisible.value = true
}

const handleEdit = (row) => {
  router.push('/policy/change/new?policyNo=' + row.policyNo)
}

const handleSubmitToPlatform = (row) => {
  const res = store.submitChangeToPlatform(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '提交失败'); return }
  MessagePlugin.success('已提交平台审核')
}

const handleGenerateDocs = (row) => {
  const res = store.generateChangeDocuments(row.id, 'form')
  if (!res?.ok) { MessagePlugin.error(res?.message || '生成失败'); return }
  MessagePlugin.success('变更申请表已生成')
}

const handleGenerateChecklist = (row) => {
  const res = store.generateChangeDocuments(row.id, 'checklist')
  if (!res?.ok) { MessagePlugin.error(res?.message || '生成失败'); return }
  MessagePlugin.success('材料清单已生成')
}

const handleDeleteDocs = (row, docType) => {
  const label = docType === 'form' ? '变更申请表' : '材料清单'
  const res = store.deleteChangeDocuments(row.id, docType)
  if (!res?.ok) { MessagePlugin.error(res?.message || '删除失败'); return }
  MessagePlugin.success(`${label}已删除`)
}

const handlePushToClerk = (row) => {
  const res = store.pushChangeToClerk(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '推送失败'); return }
  MessagePlugin.success('已推送给跟单员审核')
}

const handleClerkSubmitToInsurer = (row) => {
  const res = store.clerkSubmitToInsurer(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '提交失败'); return }
  MessagePlugin.success('已提交保险公司审核')
}

const handleClerkReject = (row) => {
  rejectTarget.value = row
  rejectReason.value = ''
  rejectVisible.value = true
}

const confirmReject = () => {
  if (!rejectReason.value.trim()) { MessagePlugin.warning('请输入驳回原因'); return }
  const res = store.clerkRejectChange(rejectTarget.value.id, rejectReason.value)
  if (!res?.ok) { MessagePlugin.error(res?.message || '驳回失败'); return }
  MessagePlugin.success('已驳回，退回平台处理')
  rejectVisible.value = false
}

const handleInsurerApprove = (row) => {
  detailRow.value = row
  insurerOpinion.value = ''
  insurerApproveVisible.value = true
}

const confirmInsurerApprove = () => {
  if (!detailRow.value) return
  const res = store.insurerApproveChange(detailRow.value.id, {
    opinion: insurerOpinion.value
  })
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  // Auto-sync to platform after approval
  const syncRes = store.syncChangeToPlatform(detailRow.value.id)
  if (!syncRes?.ok) { MessagePlugin.error(syncRes?.message || '同步失败'); return }
  MessagePlugin.success('保险公司已批准，决定结果已同步给平台')
  insurerApproveVisible.value = false
}

const handleInsurerReject = (row) => {
  detailRow.value = row
  insurerRejectOpinion.value = ''
  insurerRejectVisible.value = true
}

const confirmInsurerReject = () => {
  if (!insurerRejectOpinion.value.trim()) { MessagePlugin.warning('请输入审批意见'); return }
  if (!detailRow.value) return
  const res = store.insurerRejectChange(detailRow.value.id, insurerRejectOpinion.value)
  if (!res?.ok) { MessagePlugin.error(res?.message || '驳回失败'); return }
  MessagePlugin.success('保险公司已驳回变更申请')
  insurerRejectVisible.value = false
}

const handleClerkUpdateRecord = (row) => {
  clerkRecord.value = ''
  recordVisible.value = true
}

const confirmRecord = () => {
  if (!clerkRecord.value.trim()) { MessagePlugin.warning('请输入变更记录'); return }
  const res = store.clerkUpdateRecord(detailRow.value?.id, { record: clerkRecord.value })
  if (!res?.ok) { MessagePlugin.error(res?.message || '录入失败'); return }
  MessagePlugin.success('变更记录已录入')
  recordVisible.value = false
}

const handleSyncPlatform = (row) => {
  const res = store.syncChangeToPlatform(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '同步失败'); return }
  MessagePlugin.success('已完成，客户可生成批单')
}

const handleGenerateEndorsement = (row) => {
  const res = store.generateEndorsement(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '生成失败'); return }
  MessagePlugin.success(`批单已生成，编号: ${res.data.endorsementNo}`)
}

const handleInitiateSupplement = (row) => {
  supplementRequest.value = ''
  supplementInitVisible.value = true
}

const confirmSupplementInit = () => {
  if (!supplementRequest.value.trim()) { MessagePlugin.warning('请输入补充要求'); return }
  const res = store.initiateSupplement(detailRow.value?.id, supplementRequest.value)
  if (!res?.ok) { MessagePlugin.error(res?.message || '操作失败'); return }
  MessagePlugin.success('已发起补充材料请求')
  supplementInitVisible.value = false
}

const handleCustomerSupplement = (row) => {
  supplementMode.value = 'customer'
  supplementRequest.value = ''
  supplementFiles.value = []
  supplementVisible.value = true
}

const handlePlatformSupplement = (row) => {
  supplementMode.value = 'platform'
  supplementRequest.value = ''
  supplementVisible.value = true
}

const confirmSupplement = () => {
  if (supplementMode.value === 'customer') {
    const res = store.submitCustomerSupplement(detailRow.value?.id, { files: supplementFiles.value })
    if (!res?.ok) { MessagePlugin.error(res?.message || '提交失败'); return }
    MessagePlugin.success('补充材料已提交')
  } else if (supplementMode.value === 'platform') {
    const res = store.platformSupplementMaterial(detailRow.value?.id, { supplementNote: supplementRequest.value })
    if (!res?.ok) { MessagePlugin.error(res?.message || '提交失败'); return }
    MessagePlugin.success('材料已补充，已向客户推送补充请求')
  }
  supplementVisible.value = false
}

const handleResubmitPlatform = (row) => {
  const res = store.resubmitPlatform(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '提交失败'); return }
  MessagePlugin.success('已提交平台汇总')
}

const handleResubmitClerk = (row) => {
  const res = store.resubmitClerk(row.id)
  if (!res?.ok) { MessagePlugin.error(res?.message || '提交失败'); return }
  MessagePlugin.success('已提交跟单员二次审核')
}

// Push customer supplement
const pushSupplementVisible = ref(false)
const pushSupplementRequest = ref('')

const handlePushCustomerSupplement = (row) => {
  detailRow.value = row
  pushSupplementRequest.value = ''
  pushSupplementVisible.value = true
}

const confirmPushCustomerSupplement = () => {
  if (!pushSupplementRequest.value.trim()) { MessagePlugin.warning('请输入补充要求'); return }
  if (!detailRow.value) return
  const res = store.platformPushCustomerSupplement(detailRow.value.id, pushSupplementRequest.value)
  if (!res?.ok) { MessagePlugin.error(res?.message || '推送失败'); return }
  MessagePlugin.success('已推送客户补充资料')
  pushSupplementVisible.value = false
}

// Document preview
const docPreviewVisible = ref(false)
const docPreviewTitle = ref('')
const docPreviewFileName = ref('')
const docPreviewFileSize = ref('')
const docPreviewContent = ref('')

const handleDocPreview = (row, type) => {
  if (type === 'change_form') {
    const file = row.generatedChangeForm?.[0]
    docPreviewTitle.value = '变更申请表预览'
    docPreviewFileName.value = file?.name || '变更申请表.pdf'
    docPreviewFileSize.value = file?.size || '-'
    docPreviewContent.value = generateChangeFormPreview(row)
  } else if (type === 'checklist') {
    const file = row.generatedChecklist?.[0]
    docPreviewTitle.value = '变更材料清单预览'
    docPreviewFileName.value = file?.name || '变更材料清单.pdf'
    docPreviewFileSize.value = file?.size || '-'
    docPreviewContent.value = generateChecklistPreview(row)
  }
  docPreviewVisible.value = true
}

const generateChangeFormPreview = (row) => {
  return `
    <div style="padding:24px;font-family:'Microsoft YaHei',sans-serif;">
      <h2 style="text-align:center;margin-bottom:24px;font-size:18px;">保单变更申请书</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr><td style="padding:8px 12px;border:1px solid #d0d5dd;width:120px;background:#f8f9fa;font-weight:600;">申请编号</td><td style="padding:8px 12px;border:1px solid #d0d5dd;">${row.id || '-'}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #d0d5dd;background:#f8f9fa;font-weight:600;">保单号</td><td style="padding:8px 12px;border:1px solid #d0d5dd;">${row.policyNo || '-'}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #d0d5dd;background:#f8f9fa;font-weight:600;">变更类型</td><td style="padding:8px 12px;border:1px solid #d0d5dd;">${row.changeTypeName || '-'}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #d0d5dd;background:#f8f9fa;font-weight:600;">变更原因</td><td style="padding:8px 12px;border:1px solid #d0d5dd;">${row.changeReason || '-'}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #d0d5dd;background:#f8f9fa;font-weight:600;">变更前内容</td><td style="padding:8px 12px;border:1px solid #d0d5dd;">${row.beforeContent || '-'}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #d0d5dd;background:#f8f9fa;font-weight:600;">变更后内容</td><td style="padding:8px 12px;border:1px solid #d0d5dd;">${row.afterContent || '-'}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #d0d5dd;background:#f8f9fa;font-weight:600;">生效日期</td><td style="padding:8px 12px;border:1px solid #d0d5dd;">${row.effectiveDate || '-'}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #d0d5dd;background:#f8f9fa;font-weight:600;">申请时间</td><td style="padding:8px 12px;border:1px solid #d0d5dd;">${row.createTime || '-'}</td></tr>
      </table>
      <div style="margin-top:16px;padding:12px;background:#fff8e6;border:1px solid #fef3c7;border-radius:4px;font-size:12px;color:#92400e;">
        提示：此文件为系统生成的预览版本，仅供查看。实际文件以PDF格式为准。
      </div>
    </div>
  `
}

const generateChecklistPreview = (row) => {
  const items = [
    { name: '保单变更申请书', required: true, status: '已提交' },
    { name: '变更事项说明', required: true, status: row.changeReason ? '已提交' : '待提交' },
    { name: '相关证明材料', required: false, status: row.supportingDocs?.length > 0 ? '已提交' : '待提交' }
  ]
  const itemsHtml = items.map((item, idx) => `
    <tr>
      <td style="padding:8px 12px;border:1px solid #d0d5dd;text-align:center;">${idx + 1}</td>
      <td style="padding:8px 12px;border:1px solid #d0d5dd;">${item.name}</td>
      <td style="padding:8px 12px;border:1px solid #d0d5dd;text-align:center;">${item.required ? '<span style="color:#dc2626;">*</span>' : '-'}</td>
      <td style="padding:8px 12px;border:1px solid #d0d5dd;text-align:center;"><span style="color:${item.status === '已提交' ? '#00a870' : '#f59e0b'};">${item.status}</span></td>
    </tr>
  `).join('')
  return `
    <div style="padding:24px;font-family:'Microsoft YaHei',sans-serif;">
      <h2 style="text-align:center;margin-bottom:24px;font-size:18px;">变更材料清单</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f8f9fa;">
            <th style="padding:8px 12px;border:1px solid #d0d5dd;text-align:center;width:40px;">序号</th>
            <th style="padding:8px 12px;border:1px solid #d0d5dd;text-align:left;">材料名称</th>
            <th style="padding:8px 12px;border:1px solid #d0d5dd;text-align:center;width:60px;">必填</th>
            <th style="padding:8px 12px;border:1px solid #d0d5dd;text-align:center;width:80px;">状态</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div style="margin-top:16px;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;font-size:12px;color:#166534;">
        共 ${items.length} 项材料，已提交 ${items.filter(i => i.status === '已提交').length} 项
      </div>
    </div>
  `
}
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 700; color: #1e293b; }
.breadcrumbs { margin-bottom: 16px; }

.confirm-tip { display: flex; align-items: center; gap: 8px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 10px 14px; }
.tip-icon { color: #f59e0b; }
.tip-icon.danger { color: #dc2626; }
.tip-text { font-size: 13px; color: #92400e; }
.reject-form { margin-top: 12px; }
.reject-label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 8px; }
.reject-content { padding: 8px 0; }
.detail-body { padding: 8px 0; }
.detail-card { margin-bottom: 20px; background: #f8fafc; border-radius: 10px; padding: 16px; border: 1px solid #eef2f6; }
.detail-card-title { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 14px; padding-left: 10px; border-left: 3px solid #0052d9; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; background: #fff; border-radius: 8px; border: 1px solid #eef2f6; overflow: hidden; }
.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid #f5f7fa; border-right: 1px solid #f5f7fa; }
.detail-row:nth-child(even) { border-right: none; }
.detail-row:last-child:nth-child(odd) { grid-column: 1 / -1; border-right: none; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 13px; color: #64748b; font-weight: 500; flex-shrink: 0; }
.detail-value { font-size: 13px; color: #1e293b; font-weight: 600; text-align: right; margin-left: 12px; }
.insurer-content, .record-content, .supplement-content { padding: 8px 0; }
.doc-preview-wrapper { max-height: 70vh; overflow-y: auto; }
.doc-preview-header { display: flex; gap: 24px; padding: 12px 16px; background: #f8f9fa; border: 1px solid #eef2f6; border-radius: 6px; margin-bottom: 16px; }
.doc-preview-meta { font-size: 12px; color: #64748b; }
.doc-preview-body { border: 1px solid #eef2f6; border-radius: 6px; overflow: hidden; background: #fff; }
</style>
