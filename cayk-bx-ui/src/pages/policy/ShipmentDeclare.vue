<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/policy/list">保单管理</t-breadcrumb-item>
        <t-breadcrumb-item>出运申报管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">出运申报管理</div>
      <div class="page-actions">
        <t-button theme="primary" @click="handleAdd">
          <template #icon><t-icon name="add" /></template>
          新建申报
        </t-button>
      </div>
    </div>

    <search-filter
      :status-options="statusOptions"
      @search="handleSearch"
      @reset="handleReset"
    />

    <t-alert theme="warning" class="mb-16">
      <template #message>
        <span>超时预警：{{ overdueCount }} 笔</span>
        <span style="margin-left: 24px;">即将到期（3天内）：{{ dueSoonCount }} 笔</span>
        <span style="margin-left: 24px;">正常：{{ normalCount }} 笔</span>
      </template>
    </t-alert>

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
              <template #financingStatus="{ row }">
                <t-tag v-if="row.financingStatus === 'financed'" theme="warning" variant="light">已融资</t-tag>
                <t-tag v-else-if="row.financingStatus === 'not_financed'" theme="default" variant="light">未融资</t-tag>
                <t-tag v-else theme="info" variant="light">待校验</t-tag>
              </template>
              <template #isOverdue="{ row }">
                <t-tag v-if="row.isOverdue" theme="danger">超时</t-tag>
                <t-tag v-else-if="row.isDueSoon" theme="warning">即将到期</t-tag>
                <t-tag v-else theme="success">正常</t-tag>
              </template>
              <template #operation="{ row }">
                <t-space>
                  <t-link @click="handleView(row)">查看</t-link>
                  <template v-if="row.status === 'sd_docs_generated' || (row.status === 'sd_clerk_pending' && row.docsDownloaded)">
                    <t-link @click="handleViewDocs(row)">查看资料</t-link>
                  </template>
                  <template v-if="row.status === 'sd_clerk_pending' && !row.docsDownloaded">
                    <t-link @click="handleDownloadDocs(row)">下载资料</t-link>
                  </template>
                  <template v-if="row.status === 'sd_clerk_pending' && row.docsDownloaded">
                    <t-link @click="handleClerkSubmit(row)">线下提交</t-link>
                  </template>
                  <template v-if="row.status === 'sd_insurer_review'">
                    <t-link @click="handleReturnResult(row)">回传结果</t-link>
                  </template>
                  <template v-if="row.status === 'sd_insurer_rejected' || row.limitWarning">
                    <t-link @click="handleViewRejection(row)">查看驳回原因</t-link>
                    <t-link @click="handleReSubmit(row)">重新申报</t-link>
                  </template>
                  <template v-if="row.status === 'pending_premium'">
                    <t-link @click="handleMarkAsPaid(row)">已缴费</t-link>
                  </template>
                  <template v-if="row.status === 'premium_paid'">
                    <t-link @click="handleUploadVoucher(row)">上传凭证</t-link>
                  </template>
                  <template v-if="row.status === 'premium_uploaded'">
                    <t-link @click="handleVerifyVoucher(row)">核验凭证</t-link>
                  </template>
                  <template v-if="row.status === 'premium_verified' && userStore.role === 'customer'">
                    <t-link @click="handleCustomerConfirm(row)">确认缴费完成</t-link>
                  </template>
                  <template v-if="row.status === 'customer_confirmed' && userStore.role !== 'customer'">
                    <t-link @click="handleClerkComplete(row)">完成</t-link>
                  </template>
                  <template v-if="row.status === 'completed'">
                    <t-link @click="handleArchive(row)">归档资料</t-link>
                  </template>
                </t-space>
              </template>
    </data-table>

    <t-dialog v-model:visible="formVisible" :header="formMode === 'create' ? '新建出运申报' : formMode === 'edit' ? '编辑出运申报' : '出运申报详情'" width="700px">
      <div style="max-height: 600px; overflow-y: auto;">
        <t-form v-if="formMode !== 'detail'" ref="formRef" :data="formData" :rules="formRules" label-width="140px" @submit="handleSubmit">
          <t-divider>关联保单信息</t-divider>
          <t-form-item label="关联保单" name="relatedPolicyNo">
            <t-select v-model="formData.relatedPolicyNo" placeholder="请选择关联保单" clearable @change="handlePolicyChange">
              <t-option v-for="p in activePolicies" :key="p.policyNo" :value="p.policyNo" :label="`${p.policyNo} - ${p.insured}`" />
            </t-select>
          </t-form-item>
          <t-form-item v-if="selectedPolicyInsurance" label="保险公司规则">
            <t-alert :theme="companyRule.theme" class="company-rule-alert">
              <template #message>
                <strong>{{ selectedPolicyInsurance }}</strong>：申报截止日 {{ companyRule.deadline }}，{{ companyRule.method }}，逾期处理：{{ companyRule.penalty }}
              </template>
            </t-alert>
          </t-form-item>
          <t-form-item v-if="frozenLimitCheck?.isFrozen" label="限额冻结">
            <t-alert theme="danger" class="company-rule-alert">
              <template #message>
                <strong>买方限额已冻结</strong>：{{ frozenLimitCheck.message }}
              </template>
            </t-alert>
          </t-form-item>
          <t-form-item v-if="frozenLimitCheck?.autoDetected" label="冻结预警">
            <t-alert theme="warning" class="company-rule-alert">
              <template #message>
                {{ frozenLimitCheck.message }}
              </template>
            </t-alert>
          </t-form-item>
          <t-form-item v-if="premiumCheck.isFrozen" label="保费冻结">
            <t-alert theme="danger" class="company-rule-alert">
              <template #message>
                <strong>保费逾期未缴</strong>：{{ premiumCheck.message }}
              </template>
            </t-alert>
          </t-form-item>
          <t-form-item v-if="renewalGap.hasGapWarning" label="续保提示">
            <t-alert :theme="renewalGap.level === 'danger' ? 'danger' : 'warning'" class="company-rule-alert">
              <template #message>
                {{ renewalGap.message }}
              </template>
            </t-alert>
          </t-form-item>
          <t-form-item v-if="formData.usedLimitRemaining !== null" label="已用限额余额">
            <t-input :value="`$${Number(formData.usedLimitRemaining).toLocaleString()}`" disabled />
          </t-form-item>

          <t-divider>出运信息</t-divider>
          <t-form-item label="买方名称" name="buyerName">
            <t-select v-model="formData.buyerName" placeholder="请选择买方" clearable>
              <t-option v-for="b in buyerOptions" :key="b" :value="b" :label="b" />
            </t-select>
          </t-form-item>
          <t-form-item label="出运日期" name="shipmentDate">
            <t-date-picker v-model="formData.shipmentDate" placeholder="请选择出运日期" clearable />
          </t-form-item>
          <t-form-item label="运输方式" name="transportType">
            <t-select v-model="formData.transportType" placeholder="请选择运输方式" clearable>
              <t-option value="sea" label="海运" />
              <t-option value="air" label="空运" />
              <t-option value="land" label="陆运" />
              <t-option value="other" label="其他" />
            </t-select>
          </t-form-item>
          <t-form-item label="提单号/运单号" name="billOfLadingNo">
            <t-input v-model="formData.billOfLadingNo" placeholder="请输入提单号或运单号" />
          </t-form-item>
          <t-form-item label="目的港" name="destinationPort">
            <t-input v-model="formData.destinationPort" placeholder="请输入目的港" />
          </t-form-item>
          <t-form-item label="货物描述" name="goodsDescription">
            <t-input v-model="formData.goodsDescription" placeholder="请输入货物描述" />
          </t-form-item>

          <t-divider>发票信息</t-divider>
          <t-form-item label="发票号" name="invoiceNo">
            <t-input v-model="formData.invoiceNo" placeholder="请输入发票号" />
          </t-form-item>
          <t-form-item label="发票金额" name="invoiceAmount">
            <t-input-number v-model="formData.invoiceAmount" :min="0" placeholder="请输入发票金额" />
          </t-form-item>
          <t-form-item label="发票日期" name="invoiceDate">
            <t-date-picker v-model="formData.invoiceDate" placeholder="请选择发票日期" clearable />
          </t-form-item>

          <t-divider>申报信息</t-divider>
          <t-form-item label="申报类型" name="declarationType">
            <t-select v-model="formData.declarationType" placeholder="请选择申报类型" clearable>
              <t-option value="single" label="逐笔申报" />
              <t-option value="monthly" label="月度汇总申报" />
            </t-select>
          </t-form-item>
          <t-form-item label="本次申报金额" name="shipmentAmount">
            <t-input-number v-model="formData.shipmentAmount" :min="0" placeholder="请输入申报金额" />
          </t-form-item>
          <t-form-item label="结算币种" name="currency">
            <t-select v-model="formData.currency" placeholder="请选择币种" clearable>
              <t-option value="USD" label="USD - 美元" />
              <t-option value="CNY" label="CNY - 人民币" />
              <t-option value="EUR" label="EUR - 欧元" />
              <t-option value="HKD" label="HKD - 港币" />
            </t-select>
          </t-form-item>
          <t-form-item label="付款条件" name="paymentTerms">
            <t-select v-model="formData.paymentTerms" placeholder="请选择付款条件" clearable>
              <t-option value="TT30" label="TT 30天" />
              <t-option value="TT60" label="TT 60天" />
              <t-option value="LC" label="信用证 LC" />
              <t-option value="DP" label="DP" />
              <t-option value="DA" label="DA" />
              <t-option value="OA" label="OA 赊账" />
            </t-select>
          </t-form-item>
          <t-form-item label="应付款日" name="paymentDueDate">
            <t-date-picker v-model="formData.paymentDueDate" placeholder="系统自动计算，可修改" clearable />
          </t-form-item>
          <t-form-item label="申报期限" name="computedDeadline">
            <t-input :value="computedDeadline" disabled tips="根据出运日期和目的地自动计算" />
          </t-form-item>

          <t-divider>附件上传</t-divider>
          <t-form-item label="商业发票（必传）" name="commercialInvoice">
            <t-upload v-model="formData.commercialInvoice" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="提单/运单（必传）" name="billOfLading">
            <t-upload v-model="formData.billOfLading" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="报关单" name="customsDeclaration">
            <t-upload v-model="formData.customsDeclaration" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="买方收货凭证" name="receiptProof">
            <t-upload v-model="formData.receiptProof" action="https://demo.com/upload" />
          </t-form-item>

          <t-divider v-if="quotaWarning">{{ quotaWarning }}</t-divider>
        </t-form>

        <div v-else>
          <detail-panel title="出运申报详情" :columns="detailColumns" :data="currentRow || {}" />
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="formVisible = false">取消</t-button>
          <t-button v-if="formMode !== 'detail'" theme="primary" @click="formRef?.submit()">提交申报</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- 查看生成资料对话框 -->
    <t-dialog v-model:visible="docsVisible" header="出运申报资料" width="600px">
      <div>
        <t-alert theme="info" class="mb-16">
          <template #message>以下资料已由系统自动生成，可供下载</template>
        </t-alert>
        <t-table v-if="currentDocs.length" :data="currentDocs" :columns="[
          { colKey: 'name', title: '文件名' },
          { colKey: 'size', title: '大小', width: 80 },
          { colKey: 'generatedAt', title: '生成时间', width: 160 }
        ]" row-key="name" size="small" :pagination="false">
          <template #name="{ row }">
            <t-link theme="primary"><t-icon name="file-pdf" /> {{ row.name }}</t-link>
          </template>
        </t-table>
        <t-empty v-else description="暂无生成资料" />
      </div>
    </t-dialog>

    <!-- 回传保险公司审批结果对话框 -->
    <t-dialog v-model:visible="resultVisible" header="回传保险公司审批结果" width="500px">
      <t-form ref="resultFormRef" :data="resultForm" label-width="120px">
        <t-form-item label="审批结果" name="approved">
          <t-radio-group v-model="resultForm.approved">
            <t-radio :value="true">通过</t-radio>
            <t-radio :value="false">驳回</t-radio>
          </t-radio-group>
        </t-form-item>
        <t-form-item label="审批编号" name="insurerRefNo">
          <t-input v-model="resultForm.insurerRefNo" placeholder="请输入保险公司审批编号" />
        </t-form-item>
        <t-form-item label="审批意见" name="insurerOpinion">
          <t-textarea v-model="resultForm.insurerOpinion" placeholder="请输入保险公司审批意见" :rows="3" />
        </t-form-item>
      </t-form>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="resultVisible = false">取消</t-button>
          <t-button theme="primary" @click="handleConfirmResult">确定</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- 上传缴费凭证对话框 -->
    <t-dialog v-model:visible="voucherVisible" header="上传缴费凭证" width="500px">
      <t-form ref="voucherFormRef" :data="voucherForm" label-width="120px">
        <t-form-item label="缴费日期" name="paymentDate">
          <t-date-picker v-model="voucherForm.paymentDate" placeholder="请选择缴费日期" clearable />
        </t-form-item>
        <t-form-item label="缴费金额（元）" name="paymentAmount">
          <t-input-number v-model="voucherForm.paymentAmount" :min="0" placeholder="请输入缴费金额" />
        </t-form-item>
        <t-form-item label="流水号" name="paymentRefNo">
          <t-input v-model="voucherForm.paymentRefNo" placeholder="请输入银行流水号" />
        </t-form-item>
        <t-form-item label="缴费凭证" name="paymentVouchers">
          <t-upload v-model="voucherForm.paymentVouchers" action="https://demo.com/upload" accept="image/*,.pdf" />
        </t-form-item>
      </t-form>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="voucherVisible = false">取消</t-button>
          <t-button theme="primary" @click="handleConfirmVoucher">提交凭证</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- 核验缴费凭证对话框 -->
    <t-dialog v-model:visible="verifyVisible" header="核验缴费凭证" width="500px">
      <div>
        <t-descriptions title="凭证信息" :columns="2" bordered>
          <t-descriptions-item label="缴费日期">{{ verifyForm.paymentDate }}</t-descriptions-item>
          <t-descriptions-item label="缴费金额">{{ verifyForm.paymentAmount }}</t-descriptions-item>
          <t-descriptions-item label="流水号">{{ verifyForm.paymentRefNo }}</t-descriptions-item>
        </t-descriptions>
        <t-divider />
        <t-form ref="verifyFormRef" :data="verifyForm" label-width="120px" style="margin-top: 16px;">
          <t-form-item label="核验结果" name="verified">
            <t-radio-group v-model="verifyForm.verified">
              <t-radio :value="true">核验通过</t-radio>
              <t-radio :value="false">核验不通过</t-radio>
            </t-radio-group>
          </t-form-item>
          <t-form-item label="核验备注" name="verifyNote">
            <t-textarea v-model="verifyForm.verifyNote" placeholder="请输入核验备注" :rows="3" />
          </t-form-item>
        </t-form>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="verifyVisible = false">取消</t-button>
          <t-button theme="primary" @click="handleConfirmVerify">确认核验</t-button>
        </t-space>
      </template>
    </t-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import SearchFilter from '@/components/common/SearchFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import DetailPanel from '@/components/common/DetailPanel.vue'
import { useBusinessStore } from '@/stores/business'
import { useUserStore } from '@/stores/user'
import { checkRenewalGap } from '@/utils/rules/shipmentRules'
import { checkFrozenStatus } from '@/utils/rules/creditLimitRules'

const formatDateTime = (d) => {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d) : d
  const Y = dt.getFullYear()
  const M = String(dt.getMonth() + 1).padStart(2, '0')
  const D = String(dt.getDate()).padStart(2, '0')
  const h = String(dt.getHours()).padStart(2, '0')
  const m = String(dt.getMinutes()).padStart(2, '0')
  const s = String(dt.getSeconds()).padStart(2, '0')
  return `${Y}-${M}-${D} ${h}:${m}:${s}`
}

const store = useBusinessStore()
const userStore = useUserStore()
const loading = computed(() => false)
const searchParams = ref({ enterpriseName: '', buyerName: '', status: '', dateRange: [] })

const statusOptions = [
          { value: 'pending_declare', label: '待申报' },
          { value: 'declaring', label: '申报中' },
          { value: 'declared', label: '已申报' },
          { value: 'sd_platform_review', label: '平台校验中' },
          { value: 'sd_finance_checked', label: '融资校验完成' },
          { value: 'sd_docs_generated', label: '资料已生成' },
          { value: 'sd_clerk_pending', label: '待跟单员处理' },
          { value: 'sd_insurer_review', label: '保险公司审批中' },
          { value: 'sd_insurer_approved', label: '保险公司已通过' },
          { value: 'sd_insurer_rejected', label: '保险公司已驳回' },
          { value: 'sd_limit_updated', label: '限额已更新' },
          { value: 'pending_premium', label: '待支付保费' },
          { value: 'premium_uploaded', label: '凭证已上传' },
          { value: 'premium_verified', label: '凭证已核验' },
          { value: 'timeout_warning', label: '超时预警' },
          { value: 'completed', label: '已完成' },
          { value: 'premium_paid', label: '已缴费' },
          { value: 'customer_confirmed', label: '客户已确认' },
          { value: 'archived', label: '已归档' }
        ]

        const statusMap = {
          pending_declare: '待申报',
          declaring: '申报中',
          declared: '已申报',
          timeout_warning: '超时预警',
          premium_calculating: '保费计算中',
          sd_platform_review: '平台校验中',
          sd_finance_checked: '融资校验完成',
          sd_docs_generated: '资料已生成',
          sd_clerk_pending: '待跟单员处理',
          sd_insurer_review: '保险公司审批中',
          sd_insurer_approved: '保险公司已通过',
          sd_insurer_rejected: '保险公司已驳回',
          sd_limit_updated: '限额已更新',
          pending_premium: '待支付保费',
          premium_uploaded: '凭证已上传',
          premium_verified: '凭证已核验',
          premium_paid: '已缴费',
          customer_confirmed: '客户已确认',
          completed: '已完成',
          archived: '已归档'
        }

const columns = [
  { colKey: 'declarationNo', title: '申报单号', width: 140 },
  { colKey: 'buyerName', title: '买方' },
  { colKey: 'relatedPolicyNo', title: '关联保单' },
  { colKey: 'financingStatus', title: '融资状态', width: 100, slot: 'financingStatus' },
  { colKey: 'shipmentDate', title: '出运日期', width: 110 },
  { colKey: 'shipmentAmount', title: '出运金额', align: 'right' },
  { colKey: 'currency', title: '币种', width: 80 },
  { colKey: 'destinationPort', title: '目的港' },
  { colKey: 'declarationTypeName', title: '申报类型', width: 100 },
  { colKey: 'deadline', title: '申报期限', width: 110 },
  { colKey: 'isOverdue', title: '超期状态', width: 100, slot: 'isOverdue' },
  { colKey: 'status', title: '状态', width: 110, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 200, fixed: 'right', slot: 'operation' }
]

const pagination = reactive({
  total: 0,
  current: 1,
  pageSize: 20
})

const filteredData = computed(() => {
  const list = store.shipments || []
  const p = searchParams.value
  return list.filter((it) => {
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

const overdueCount = computed(() => (store.shipments || []).filter(it => it.isOverdue).length)
const dueSoonCount = computed(() => (store.shipments || []).filter(it => it.isDueSoon && !it.isOverdue).length)
const normalCount = computed(() => (store.shipments || []).length - overdueCount.value - dueSoonCount.value)

const activePolicies = computed(() => (store.policies || []).filter(p => p.status === 'active'))

const buyerOptions = computed(() => {
  const buyers = new Set()
  ;(store.policies || []).forEach(p => { if (p.insured) buyers.add(p.insured) })
  return Array.from(buyers)
})

const formVisible = ref(false)
const formMode = ref('create')
const currentRow = ref(null)
const formRef = ref(null)

const companyRules = {
  '中国信保': { deadline: '次月15日前', method: '线下/系统', penalty: '补缴 + 滞纳金', theme: 'warning' },
  '人保财险': { deadline: '次月10日前', method: '线下/线上', penalty: '补缴 + 滞纳金', theme: 'warning' },
  '太保产险': { deadline: '次月15日前', method: '线下/线上', penalty: '补缴', theme: 'info' },
  '平安产险': { deadline: '次月10日前', method: 'APP实时', penalty: '自动提醒', theme: 'success' },
  '裕利安宜': { deadline: '次月10日前', method: '在线平台', penalty: '补缴', theme: 'info' },
  '安裕': { deadline: '次月10日前', method: '在线平台', penalty: '补缴', theme: 'info' },
  '科法斯': { deadline: '次月15日前', method: '在线平台', penalty: '补缴', theme: 'info' },
  '香港信保局': { deadline: '次月15日前', method: '在线/线下', penalty: '补缴', theme: 'info' }
}

const selectedPolicy = computed(() => {
  if (!formData.relatedPolicyNo) return null
  return store.policies.find(p => p.policyNo === formData.relatedPolicyNo) || null
})

const selectedPolicyInsurance = computed(() => selectedPolicy.value?.insuranceCompany || '')

const companyRule = computed(() => {
  if (!selectedPolicyInsurance.value) return { deadline: '-', method: '-', penalty: '-', theme: 'info' }
  return companyRules[selectedPolicyInsurance.value] || { deadline: '以保单条款为准', method: '-', penalty: '-', theme: 'info' }
})

const premiumCheck = computed(() => {
  if (!selectedPolicy.value) return { isFrozen: false, message: '', level: 'normal' }
  // Check contract payment status — premium is paid on the contract, not on the policy
  const contract = store.contracts.find(c => c.policyNo === selectedPolicy.value.policyNo)
  if (contract && contract.paymentStatus === 'unpaid') {
    return {
      isFrozen: true,
      message: `保费未缴纳（$${Number(contract.premium || selectedPolicy.value.premium || 0).toLocaleString()}），请完成缴费后方可进行出运申报`,
      level: 'warning'
    }
  }
  return { isFrozen: false, message: '', level: 'normal' }
})

const renewalGap = computed(() => {
  if (!selectedPolicy.value) return { hasGapWarning: false, gapDays: 0, message: '', level: 'normal' }
  return checkRenewalGap(selectedPolicy.value)
})

const formData = reactive({
  relatedPolicyNo: '',
  buyerName: '',
  shipmentDate: '',
  destinationPort: '',
  shipmentAmount: 0,
  currency: 'USD',
  paymentTerms: '',
  declarationType: 'single',
  transportType: '',
  billOfLadingNo: '',
  goodsDescription: '',
  invoiceNo: '',
  invoiceAmount: 0,
  invoiceDate: '',
  paymentDueDate: '',
  commercialInvoice: [],
  billOfLading: [],
  customsDeclaration: [],
  receiptProof: [],
  usedLimitRemaining: null
})

const formRules = {
  relatedPolicyNo: [{ required: true, message: '请选择关联保单', type: 'error' }],
  buyerName: [{ required: true, message: '请选择买方', type: 'error' }],
  shipmentDate: [{ required: true, message: '请选择出运日期', type: 'error' }],
  destinationPort: [{ required: true, message: '请输入目的港', type: 'error' }],
  shipmentAmount: [{ required: true, message: '请输入出运货值', type: 'error' }],
  currency: [{ required: true, message: '请选择币种', type: 'error' }],
  paymentTerms: [{ required: true, message: '请选择付款条件', type: 'error' }],
  declarationType: [{ required: true, message: '请选择申报类型', type: 'error' }]
}

const detailColumns = [
  { label: '申报单号', key: 'declarationNo' },
  { label: '关联保单', key: 'relatedPolicyNo' },
  { label: '买方名称', key: 'buyerName' },
  { label: '融资状态', key: 'financingStatus', formatter: (v) => v === 'financed' ? '已融资' : v === 'not_financed' ? '未融资' : '待校验' },
  { label: '融资合同号', key: 'financeContractNo' },
  { label: '出运日期', key: 'shipmentDate' },
  { label: '目的港', key: 'destinationPort' },
  { label: '出运金额', key: 'shipmentAmount' },
  { label: '币种', key: 'currency' },
  { label: '付款条件', key: 'paymentTerms' },
  { label: '申报类型', key: 'declarationTypeName' },
  { label: '申报期限', key: 'deadline' },
  { label: '状态', key: 'statusName' },
  { label: '保险公司审批意见', key: 'insurerOpinion' },
  { label: '保险公司审批编号', key: 'insurerRefNo' },
  { label: '保险公司审批时间', key: 'insurerReviewTime' },
  { label: '缴费日期', key: 'paymentDate' },
  { label: '缴费金额', key: 'paymentAmount' },
  { label: '缴费流水号', key: 'paymentRefNo' },
  { label: '核验时间', key: 'verifyTime' },
  { label: '核验备注', key: 'verifyNote' },
  { label: '生成资料数', key: 'generatedDocs', formatter: (v) => Array.isArray(v) ? `${v.length} 份` : '0 份' }
]

const isHongKong = computed(() => {
  const port = formData.destinationPort || ''
  return port.includes('香港') || port.toLowerCase().includes('hong kong')
})

const addWorkingDays = (date, days) => {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return result
}

const computedDeadline = computed(() => {
  if (!formData.shipmentDate) return '请先选择出运日期'
  const date = new Date(formData.shipmentDate)
  if (isHongKong.value) {
    date.setDate(date.getDate() + 3)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} (出口至香港 3天内)`
  }
  if (formData.declarationType === 'monthly') {
    date.setMonth(date.getMonth() + 1)
    date.setDate(10)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} (月度汇总，次月10日前)`
  }
  const workingDate = addWorkingDays(new Date(formData.shipmentDate), 10)
  return `${workingDate.getFullYear()}-${String(workingDate.getMonth() + 1).padStart(2, '0')}-${String(workingDate.getDate()).padStart(2, '0')} (出运后10个工作日内)`
})

const quotaWarning = computed(() => {
  if (!formData.buyerName || !formData.shipmentAmount) return ''
  const limit = store.creditLimits.find(c => c.buyerName === formData.buyerName)
  if (!limit) return ''
  if (formData.shipmentAmount > limit.remainingLimit) {
    return `⚠️ 超限额警告：本次申报金额 ${formData.shipmentAmount} 超过买方剩余可用限额 ${limit.remainingLimit}`
  }
  return ''
})

const frozenLimitCheck = computed(() => {
  if (!formData.buyerName) return null
  const limit = store.creditLimits.find(c => c.buyerName === formData.buyerName)
  if (!limit) return null
  const claims = store.claims || []
  return checkFrozenStatus(limit, claims)
})

const handlePolicyChange = (value) => {
  const policy = store.policies.find(p => p.policyNo === value)
  if (policy) {
    formData.buyerName = policy.insured || ''
    formData.usedLimitRemaining = policy.remainingQuota || 0
  }
}

const handleSearch = (params) => { searchParams.value = params; pagination.current = 1 }
const handleReset = () => { searchParams.value = { enterpriseName: '', buyerName: '', status: '', dateRange: [] }; pagination.current = 1 }
const handlePageChange = (pageInfo) => { pagination.current = pageInfo.current; pagination.pageSize = pageInfo.pageSize }

const handleAdd = () => {
  formMode.value = 'create'
  currentRow.value = null
  Object.assign(formData, {
    relatedPolicyNo: '',
    buyerName: '',
    shipmentDate: '',
    destinationPort: '',
    shipmentAmount: 0,
    currency: 'USD',
    paymentTerms: '',
    declarationType: 'single',
    transportType: '',
    billOfLadingNo: '',
    goodsDescription: '',
    invoiceNo: '',
    invoiceAmount: 0,
    invoiceDate: '',
    paymentDueDate: '',
    commercialInvoice: [],
    billOfLading: [],
    customsDeclaration: [],
    receiptProof: [],
    usedLimitRemaining: null
  })
  formVisible.value = true
}

const handleView = (row) => {
  formMode.value = 'detail'
  currentRow.value = row
  formVisible.value = true
}

const handleEdit = (row) => {
  formMode.value = 'edit'
  currentRow.value = row
  Object.assign(formData, {
    relatedPolicyNo: row.relatedPolicyNo || '',
    buyerName: row.buyerName || '',
    shipmentDate: row.shipmentDate || '',
    destinationPort: row.destinationPort || '',
    shipmentAmount: Number(row.shipmentAmount) || 0,
    currency: row.currency || 'USD',
    paymentTerms: row.paymentTerms || '',
    declarationType: row.declarationType || 'single',
    transportType: row.transportType || '',
    billOfLadingNo: row.billOfLadingNo || '',
    goodsDescription: row.goodsDescription || '',
    invoiceNo: row.invoiceNo || '',
    invoiceAmount: Number(row.invoiceAmount) || 0,
    invoiceDate: row.invoiceDate || '',
    paymentDueDate: row.paymentDueDate || '',
    commercialInvoice: row.commercialInvoice || [],
    billOfLading: row.billOfLading || [],
    customsDeclaration: row.customsDeclaration || [],
    receiptProof: row.receiptProof || []
  })
  formVisible.value = true
}

const handleSubmit = ({ validateResult }) => {
  if (validateResult !== true) return

  // 限额冻结阻断
  if (frozenLimitCheck.value?.isFrozen) {
    MessagePlugin.error(frozenLimitCheck.value.message || '该买方限额已被冻结，无法进行出运申报')
    return
  }

  // 保费冻结阻断
  if (premiumCheck.value.isFrozen) {
    MessagePlugin.error(premiumCheck.value.message || '保费未缴，申报被冻结')
    return
  }

  // 空窗期严重阻断
  if (renewalGap.value.level === 'danger') {
    MessagePlugin.error(renewalGap.value.message || '保单已过期，无法进行出运申报')
    return
  }

  const doSubmit = () => {
    if (!formData.billOfLading || formData.billOfLading.length === 0) {
      MessagePlugin.error('请上传提单/货运单据')
      return
    }
    const limit = store.creditLimits.find(c => c.buyerName === formData.buyerName)
    if (limit && formData.shipmentAmount > limit.remainingLimit) {
      MessagePlugin.error('申报金额超过买方剩余可用限额，申报失败')
      return
    }
    if (formMode.value === 'create') {
      const shipment = store.createShipment({
        relatedPolicyNo: formData.relatedPolicyNo,
        buyerName: formData.buyerName,
        shipmentDate: formData.shipmentDate,
        destinationPort: formData.destinationPort,
        shipmentAmount: formData.shipmentAmount,
        currency: formData.currency,
        paymentTerms: formData.paymentTerms,
        declarationType: formData.declarationType,
        declarationTypeName: formData.declarationType === 'single' ? '逐笔申报' : '月度汇总',
        transportType: formData.transportType,
        billOfLadingNo: formData.billOfLadingNo,
        goodsDescription: formData.goodsDescription,
        invoiceNo: formData.invoiceNo,
        invoiceAmount: formData.invoiceAmount,
        invoiceDate: formData.invoiceDate,
        paymentDueDate: formData.paymentDueDate,
        commercialInvoice: formData.commercialInvoice,
        billOfLading: formData.billOfLading,
        customsDeclaration: formData.customsDeclaration,
        receiptProof: formData.receiptProof,
        status: 'declared',
        statusName: '已申报'
      })
      MessagePlugin.success('出运申报已提交，系统正在自动处理')

      // Auto-chain: finance check → doc gen → push to clerk
      const autoResult = store.autoProcessShipment(shipment.id)
      if (autoResult.ok) {
        const financedMsg = autoResult.data.isFinanced ? '（已标记融资状态）' : ''
        MessagePlugin.success('融资校验' + financedMsg + '已完成')
        MessagePlugin.success('申报资料已自动生成，共 ' + autoResult.data.docs.length + ' 份文件')
        MessagePlugin.success('申报单已推送至跟单员工作台')
      } else {
        MessagePlugin.error(autoResult.message || '自动处理失败，请联系管理员')
      }
      formVisible.value = false
    } else if (currentRow.value) {
      Object.assign(currentRow.value, {
        relatedPolicyNo: formData.relatedPolicyNo,
        buyerName: formData.buyerName,
        shipmentDate: formData.shipmentDate,
        destinationPort: formData.destinationPort,
        shipmentAmount: formData.shipmentAmount,
        currency: formData.currency,
        paymentTerms: formData.paymentTerms,
        declarationType: formData.declarationType,
        declarationTypeName: formData.declarationType === 'single' ? '逐笔申报' : '月度汇总',
        transportType: formData.transportType,
        billOfLadingNo: formData.billOfLadingNo,
        goodsDescription: formData.goodsDescription,
        invoiceNo: formData.invoiceNo,
        invoiceAmount: formData.invoiceAmount,
        invoiceDate: formData.invoiceDate,
        paymentDueDate: formData.paymentDueDate,
        commercialInvoice: formData.commercialInvoice,
        billOfLading: formData.billOfLading,
        customsDeclaration: formData.customsDeclaration,
        receiptProof: formData.receiptProof
      })
      MessagePlugin.success('出运申报已更新')
      formVisible.value = false
    }
  }

  // 空窗期温和提醒
  if (renewalGap.value.level === 'warning') {
    DialogPlugin.confirm({
      title: '续保提示',
      content: renewalGap.value.message + '\n\n是否仍要提交申报？',
      confirmBtnText: '确认提交',
      cancelBtnText: '取消',
      onConfirm: doSubmit
    })
  } else if (quotaWarning.value) {
    DialogPlugin.confirm({
      title: '超限额警告',
      content: '本次申报金额超过买方剩余可用限额，是否确认提交？',
      confirmBtnText: '确认提交',
      cancelBtnText: '取消',
      onConfirm: doSubmit
    })
  } else {
    doSubmit()
  }
}

// ===== New Business Flow Handlers =====

const docsVisible = ref(false)
const currentDocs = ref([])

const handleViewDocs = (row) => {
  currentDocs.value = row.generatedDocs || []
  docsVisible.value = true
}

const handleDownloadDocs = (row) => {
  const result = store.clerkDownloadDocs(row.id)
  if (result.ok) {
    MessagePlugin.success('资料下载完成，可线下提交保险公司审批')
  } else {
    MessagePlugin.error(result.message)
  }
  handleViewDocs(row)
}

const handleMarkAsPaid = (row) => {
  const result = store.markAsPaid(row.id)
  if (result.ok) {
    MessagePlugin.success('已标记为已缴费，请上传缴费凭证')
  } else {
    MessagePlugin.error(result.message)
  }
}

const handleCustomerConfirm = (row) => {
  DialogPlugin.confirm({
    title: '确认缴费完成',
    content: '确认已完成线下保费缴纳？确认后将通知跟单员进行最终确认',
    confirmBtnText: '确认完成',
    cancelBtnText: '取消',
    onConfirm: () => {
      const result = store.customerConfirmPayment(row.id)
      if (result.ok) {
        MessagePlugin.success('缴费确认已提交，等待跟单员完成确认')
      } else {
        MessagePlugin.error(result.message)
      }
    }
  })
}

const handleClerkSubmit = (row) => {
  DialogPlugin.confirm({
    title: '确认线下提交',
    content: '确认已将出运申报资料线下提交至保险公司审批？',
    confirmBtnText: '确认提交',
    cancelBtnText: '取消',
    onConfirm: () => {
      const result = store.clerkOfflineSubmit(row.id)
      if (result.ok) {
        MessagePlugin.success('已确认资料线下提交，等待保险公司审批')
      } else {
        MessagePlugin.error(result.message)
      }
    }
  })
}

const resultVisible = ref(false)
const resultFormRef = ref(null)
const resultForm = reactive({
  approved: true,
  insurerRefNo: '',
  insurerOpinion: ''
})
let currentResultRow = null

const handleReturnResult = (row) => {
  currentResultRow = row
  resultForm.approved = true
  resultForm.insurerRefNo = ''
  resultForm.insurerOpinion = ''
  resultVisible.value = true
}

const handleViewRejection = (row) => {
  const opinion = row.insurerOpinion || '无详细驳回意见'
  DialogPlugin.alert({
    title: '保险公司驳回原因',
    message: `<div style="margin-bottom:8px;"><strong>审批编号：</strong>${row.insurerRefNo || '-'}</div>
              <div><strong>驳回意见：</strong>${opinion}</div>
              <div style="margin-top:8px;color:#999;font-size:12px;">审批时间：${row.insurerReviewTime || '-'}</div>`,
    confirmBtnText: '知道了'
  })
}

const handleReSubmit = (row) => {
  DialogPlugin.confirm({
    title: '重新申报',
    content: row.limitWarning
      ? '因限额不足需重新申报。确认将申报状态重置为"已申报"，调整申报金额后重新完成后续流程？'
      : '确认要基于原申报信息重新提交？系统将重置申报状态为"已申报"，您需要重新完成后续流程。',
    confirmBtnText: '确认重新申报',
    cancelBtnText: '取消',
    onConfirm: () => {
      const result = store.resubmitShipment(row.id)
      if (result.ok) {
        MessagePlugin.success('已重置为已申报状态，系统正在重新处理')
        const autoResult = store.autoProcessShipment(row.id)
        if (autoResult.ok) {
          MessagePlugin.success('申报单已重新处理并推送至跟单员工作台')
        } else {
          MessagePlugin.error(autoResult.message || '重新处理失败，请联系管理员')
        }
      } else {
        MessagePlugin.error(result.message)
      }
    }
  })
}

const handleConfirmResult = () => {
  if (!currentResultRow) return
  const result = store.processInsurerResult(currentResultRow.id, {
    approved: resultForm.approved,
    insurerOpinion: resultForm.insurerOpinion,
    insurerRefNo: resultForm.insurerRefNo
  })
  if (result.ok) {
    if (result.data.approved) {
      if (result.data.limitOk) {
        MessagePlugin.success('保险公司审批通过，限额已自动更新，申报状态已转入"待支付保费"')
        DialogPlugin.confirm({
          title: '保费缴纳指引',
          content: '请引导客户线下缴纳保费，并在系统上传缴费凭证',
          confirmBtnText: '知道了',
          cancelBtnText: ''
        })
      } else {
        DialogPlugin.alert({
          title: '限额不足预警',
          message: `<div style="margin-bottom:12px;">${result.data.message}</div>
                     <div style="color:#999;font-size:13px;margin-bottom:8px;">建议操作：</div>
                     <ul style="color:#666;font-size:13px;padding-left:20px;margin:0;">
                       <li>申请信用限额增额，提高可用额度</li>
                       <li>调整本次申报金额，降低至可用限额以内</li>
                     </ul>`,
          confirmBtnText: '知道了'
        })
      }
    } else {
      MessagePlugin.success('保险公司驳回结果已回传')
    }
    resultVisible.value = false
  } else {
    MessagePlugin.error(result.message)
  }
}

const voucherVisible = ref(false)
const voucherFormRef = ref(null)
const voucherForm = reactive({
  paymentDate: '',
  paymentAmount: 0,
  paymentRefNo: '',
  paymentVouchers: []
})
let currentVoucherRow = null

const handleUploadVoucher = (row) => {
  currentVoucherRow = row
  voucherForm.paymentDate = ''
  voucherForm.paymentAmount = 0
  voucherForm.paymentRefNo = ''
  voucherForm.paymentVouchers = []
  voucherVisible.value = true
}

const handleConfirmVoucher = () => {
  if (!currentVoucherRow) return
  const result = store.uploadPremiumVoucher(currentVoucherRow.id, {
    paymentVouchers: voucherForm.paymentVouchers,
    paymentDate: voucherForm.paymentDate,
    paymentAmount: voucherForm.paymentAmount,
    paymentRefNo: voucherForm.paymentRefNo
  })
  if (result.ok) {
    MessagePlugin.success('缴费凭证已上传，待核验')
    voucherVisible.value = false
  } else {
    MessagePlugin.error(result.message)
  }
}

const verifyVisible = ref(false)
const verifyFormRef = ref(null)
const verifyForm = reactive({
  verified: true,
  verifyNote: '',
  paymentDate: '',
  paymentAmount: 0,
  paymentRefNo: ''
})
let currentVerifyRow = null

const handleVerifyVoucher = (row) => {
  currentVerifyRow = row
  verifyForm.paymentDate = row.paymentDate || ''
  verifyForm.paymentAmount = row.paymentAmount || 0
  verifyForm.paymentRefNo = row.paymentRefNo || ''
  verifyForm.verified = true
  verifyForm.verifyNote = ''
  verifyVisible.value = true
}

const handleConfirmVerify = () => {
  if (!currentVerifyRow) return
  const result = store.verifyPremiumVoucher(currentVerifyRow.id, {
    verified: verifyForm.verified,
    verifyNote: verifyForm.verifyNote
  })
  if (result.ok) {
    MessagePlugin.success(result.data.verified ? '缴费凭证核验通过' : '核验不通过，请重新上传')
    verifyVisible.value = false
  } else {
    MessagePlugin.error(result.message)
  }
}

const handleClerkComplete = (row) => {
  DialogPlugin.confirm({
    title: '确认完成',
    content: '确认客户已缴费？确认后将完成全部出运申报流程，保单状态更新为"已缴费"',
    confirmBtnText: '确认完成',
    cancelBtnText: '取消',
    onConfirm: () => {
      const result = store.clerkCompleteShipment(row.id)
      if (result.ok) {
        MessagePlugin.success('出运申报已完成，保单保费状态已更新')
      } else {
        MessagePlugin.error(result.message)
      }
    }
  })
}

const handleArchive = (row) => {
  DialogPlugin.confirm({
    title: '确认归档',
    content: '确认将申报资料归档？归档后数据将进入历史档案，仅供查阅',
    confirmBtnText: '确认归档',
    cancelBtnText: '取消',
    onConfirm: () => {
      const result = store.archiveShipment(row.id)
      if (result.ok) {
        MessagePlugin.success('申报资料已归档')
      } else {
        MessagePlugin.error(result.message)
      }
    }
  })
}

onMounted(() => { store.ensureSeeded() })
</script>

<style lang="scss" scoped>
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.mb-16 { margin-bottom: 16px; }
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}
.company-rule-alert { width: 100%; }
</style>
