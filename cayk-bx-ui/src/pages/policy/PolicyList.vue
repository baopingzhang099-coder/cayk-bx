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
    </div>

    <t-tabs v-model="mainTab" theme="card" class="mb-16">
      <t-tab-panel value="review" label="投保确认列表">

        <search-filter
          :status-options="statusOptions"
          @search="handleSearch"
          @reset="handleReset"
        />

        <div class="stats-grid mb-24">
          <stat-card title="确认通过" :value="activePolicyCount" icon="check-circle" color="success" />
          <stat-card title="待确认" :value="pendingReviewCount" icon="clock" color="warning" />
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
          <template #operation="{ row }">
            <t-space>
              <t-link @click="handleView(row)">查看</t-link>
              <t-link v-if="isInkasso && row.status === 'pending_review'" theme="primary" @click="handleApprove(row)">确认</t-link>
              <t-link v-if="isInkasso && row.status === 'pending_review'" theme="danger" @click="handleReject(row)">驳回</t-link>
              <t-link v-if="!isInkasso && row.status === 'rejected'" theme="primary" @click="handleSubmit(row)">重新提交</t-link>
            </t-space>
          </template>
        </data-table>
      </t-tab-panel>

      <t-tab-panel value="policy" label="保单列表">
        <div class="table-header">
          <span class="table-title">保单信息管理</span>
          <t-space>
            <t-button theme="primary" @click="ocrDialogVisible = true">
              <template #icon><t-icon name="file-pdf" /></template>
              新增投保（OCR）
            </t-button>
          </t-space>
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
    </t-tabs>

    <!-- 投保确认详情弹窗 -->
    <!-- 投保确认详情弹窗 -->
    <t-dialog v-model:visible="detailVisible" header="投保方案确认" width="760px" :footer="false">
      <div v-if="currentRow" class="insurance-info-modal">
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

        <!-- Section 3: Checkbox willingness -->
        <div class="confirmation-box">
          <t-checkbox :checked="true" disabled>
            我已仔细核对并确认此『数字化推荐投保建议方案』符合我司本次出运要求，现正式提交投保申请并流转至出单。
          </t-checkbox>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <t-button variant="outline" @click="detailVisible = false">关闭</t-button>
        </div>
      </div>
      <div v-else class="no-data">暂无数据</div>
    </t-dialog>

    <!-- 保单详情弹窗 -->
    <t-dialog v-model:visible="policyDetailVisible" header="保单详情" width="600px" :footer="false">
      <detail-panel title="保单信息" :columns="policyDetailColumns" :data="currentPolicy || {}" />
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

    <!-- 确认弹窗 -->
    <t-dialog v-model:visible="confirmVisible" :header="confirmTitle" width="800px">
      <div class="confirm-content">
        <detail-panel v-if="confirmRow" title="基础信息" :columns="detailColumns" :data="confirmRow || {}" />
        <detail-panel v-if="confirmRow" title="业务信息" :columns="businessColumns" :data="confirmRow || {}" />
        <detail-panel v-if="confirmRow" title="投保需求" :columns="insuranceColumns" :data="confirmRow || {}" />

        <t-form v-if="confirmAction === 'reject'" label-width="100px">
          <t-form-item label="驳回原因">
            <t-textarea v-model="rejectReason" placeholder="请输入驳回原因" :autosize="{ minRows: 3, maxRows: 6 }" />
          </t-form-item>
        </t-form>

        <div class="confirm-tip" v-if="confirmAction === 'submit'">
          <t-icon name="warning-circle" size="16px" class="tip-icon" />
          <span class="tip-text">提交后状态将变为待确认，请确认信息无误</span>
        </div>
        <div v-if="confirmAction === 'approve'" class="attachment-section">
          <t-divider>附件（自动生成）</t-divider>
          <div class="attachment-row">
            <span class="attachment-label">保单申请书</span>
            <t-button variant="outline" size="small" @click="showPreview('policy')">查看预览</t-button>
          </div>
          <div class="attachment-row">
            <span class="attachment-label">买方信息采集表</span>
            <t-button variant="outline" size="small" @click="showPreview('buyer')">查看预览</t-button>
          </div>
        </div>
        <div class="confirm-tip" v-else-if="confirmAction === 'reject'">
          <t-icon name="close-circle" size="16px" class="tip-icon danger" />
          <span class="tip-text">请确认是否驳回此申请，驳回后客户可重新编辑提交。</span>
        </div>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="confirmVisible = false">取消</t-button>
          <t-button v-if="confirmAction === 'approve'" theme="primary" @click="handleConfirm">确认</t-button>
          <t-button v-else-if="confirmAction === 'reject'" theme="danger" @click="handleConfirm">驳回</t-button>
          <t-button v-else-if="confirmAction === 'submit'" theme="primary" @click="handleConfirm">确认</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- 附件预览弹窗 -->
    <t-dialog v-model:visible="previewVisible" :header="previewTitle" width="900px" :destroy-on-close="true" :draggable="true" top="32px">
      <div class="preview-wrapper" ref="previewWrapperRef" @wheel="handlePreviewWheel" v-html="previewHtml"></div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="previewVisible = false">关闭</t-button>
          <t-button theme="primary" @click="previewDownload">下载Excel</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- OCR弹窗 -->
    <policy-ocr-dialog v-model:visible="ocrDialogVisible" />

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

    <!-- 保单变更弹窗 -->
    <policy-change-dialog
      v-model:visible="changeVisible"
      :policy="currentPolicy"
      @saved="handleChangeSaved"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import SearchFilter from '@/components/common/SearchFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import DetailPanel from '@/components/common/DetailPanel.vue'
import PolicyOcrDialog from '@/components/business/PolicyOcrDialog.vue'
import RenewalDialog from '@/components/business/RenewalDialog.vue'
import SurrenderDialog from '@/components/business/SurrenderDialog.vue'
import PolicyChangeDialog from '@/components/business/PolicyChangeDialog.vue'
import { useBusinessStore } from '@/stores/business'
import { useUserStore } from '@/stores/user'
import { generatePolicyApplicationXlsx, generateBuyerInfoXlsx, downloadWorkbook, workbookToHtml } from '@/utils/templateFiller'

const route = useRoute()
const store = useBusinessStore()
const userStore = useUserStore()
const loading = computed(() => false)
const searchParams = ref({ enterpriseName: '', buyerName: '', status: '', dateRange: [] })

const isInkasso = computed(() => userStore.role === 'inkasso')
const mainTab = ref(route.query.tab || 'review')

// ===== Application review =====
const currentStatusTab = ref('all')

const statusTabs = [
  { value: 'all', label: '全部' },
  { value: 'pending_review', label: '待处理' }
]

const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'pending_review', label: '待确认' },
  { value: 'approved', label: '确认通过' },
  { value: 'rejected', label: '已驳回' }
]

const statusMap = {
  draft: '待确认',
  pending_review: '待确认',
  approved: '确认通过',
  rejected: '已驳回'
}

const columns = [
  { colKey: 'id', title: '投保编号', width: 120 },
  { colKey: 'companyName', title: '企业名称', ellipsis: true },
  { colKey: 'buyerName', title: '买方名称', ellipsis: true },
  { colKey: 'buyerCountry', title: '买方国别', width: 100 },
  { colKey: 'insuranceType', title: '投保类型', width: 140 },
  { colKey: 'insuranceAmount', title: '投保金额', align: 'right', width: 120, slot: 'insuranceAmount' },
  { colKey: 'expectedInsurancePeriod', title: '投保期限', width: 160, slot: 'expectedInsurancePeriod' },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 140, fixed: 'right', slot: 'operation' }
]

const pagination = reactive({ total: 0, current: 1, pageSize: 20 })

const filteredData = computed(() => {
  const list = store.insuranceApplications || []
  const p = searchParams.value
  return list.filter((it) => {
    // Only display approved/passed insurance tasks in the Insurance Confirmation List
    if (it.status !== 'approved') return false
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
const pendingReviewCount = computed(() => (store.insuranceApplications || []).filter(p => p.status === 'pending_review').length)
const totalInsuranceAmount = computed(() => (store.insuranceApplications || []).reduce((sum, p) => sum + (Number(p.insuranceAmount) || 0), 0))

// ===== Policy list =====
const policyStatusMap = {
  pending_effect: '待生效',
  active: '有效',
  expiring: '即将到期',
  expired: '已到期',
  suspended: '中止',
  cancelled: '退保',
  terminated: '终止'
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
const currentRow = ref(null)
const policyDetailVisible = ref(false)
const currentPolicy = ref(null)

const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmRow = ref(null)
const confirmAction = ref('')
const rejectReason = ref('')

const ocrDialogVisible = ref(false)
const renewalVisible = ref(false)
const surrenderVisible = ref(false)
const changeVisible = ref(false)

const previewVisible = ref(false)
const previewTitle = ref('')
const previewHtml = ref('')
const previewWb = ref(null)
const previewType = ref('')
const previewWrapperRef = ref(null)

const exportVisible = ref(false)
const exportData = ref([])

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

const handleView = (row) => { currentRow.value = row; detailVisible.value = true }
const handleViewPolicy = (row) => { currentPolicy.value = row; policyDetailVisible.value = true }

const handleApprove = (row) => {
  confirmTitle.value = '投保信息详情'
  confirmRow.value = row
  confirmAction.value = 'approve'
  rejectReason.value = ''
  confirmVisible.value = true
}

const handleReject = (row) => {
  confirmTitle.value = '确认驳回'
  confirmRow.value = row
  confirmAction.value = 'reject'
  rejectReason.value = ''
  confirmVisible.value = true
}

const showPreview = (type) => {
  const row = confirmRow.value
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
  const row = confirmRow.value
  const filename = previewType.value === 'policy'
    ? `保单申请书_${row?.id || ''}_${new Date().toISOString().split('T')[0]}.xlsx`
    : `买方信息采集表_${row?.buyerName || row?.id || ''}_${new Date().toISOString().split('T')[0]}.xlsx`
  downloadWorkbook(previewWb.value, filename)
}

const handleSubmit = (row) => {
  confirmTitle.value = '重新提交申请'
  confirmRow.value = row
  confirmAction.value = 'submit'
  confirmVisible.value = true
}

const handleConfirm = () => {
  if (confirmAction.value === 'approve' && confirmRow.value) {
    const res = store.approveInsuranceApplication(confirmRow.value.id)
    if (res?.ok) MessagePlugin.success('确认成功')
    else MessagePlugin.error(res?.message || '确认失败')
  } else if (confirmAction.value === 'reject' && confirmRow.value) {
    if (!rejectReason.value.trim()) { MessagePlugin.warning('请输入驳回原因'); return }
    const res = store.rejectInsuranceApplication(confirmRow.value.id, rejectReason.value)
    if (res?.ok) MessagePlugin.success('驳回成功')
    else MessagePlugin.error(res?.message || '驳回失败')
  } else if (confirmAction.value === 'submit' && confirmRow.value) {
    const res = store.submitInsuranceApplication(confirmRow.value.id)
    if (res?.ok) MessagePlugin.success('提交申请成功')
    else MessagePlugin.error(res?.message || '提交失败')
  }
  confirmVisible.value = false
}

const handlePolicyChange = (row) => { currentPolicy.value = row; changeVisible.value = true }
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
  if (currentPolicy.value) {
    store.policies = store.policies.map(p =>
      p.policyNo === currentPolicy.value.policyNo
        ? { ...p, status: 'cancelled' }
        : p
    )
    MessagePlugin.success('保单状态已更新为退保')
  }
}
const handleChangeSaved = (data) => {
  MessagePlugin.success('变更申请已记录')
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
</style>
