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
        <template #coverageAmount="{ row }">
          {{ row.insuranceCurrency || 'USD' }}{{ Number(row.insuranceAmount || 0).toLocaleString() }}
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-link @click="handleView(row)">查看</t-link>
            <t-link v-if="row.status === 'draft' || row.status === 'pending_review'" @click="handleEdit(row)">编辑</t-link>
            <t-link v-if="row.status === 'draft' || row.status === 'pending_review'" theme="danger" @click="handleShowDeleteModal(row)">删除</t-link>
            <t-link v-if="row.status === 'approved' && !row.policyNo" theme="primary" @click="handleShowInsuranceInfo(row)">投保申请</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <t-dialog v-model:visible="submitVisible" header="提交申请" width="700px" :footer="false">
      <div class="submit-modal">
        <div class="modal-info">
          <div class="info-icon">
            <t-icon name="clock" :size="48" />
          </div>
          <div class="info-text">
            <h3>等待平台审核</h3>
            <p>您的投保申请将提交至平台进行审核，请耐心等待审核结果。</p>
          </div>
        </div>
        
        <div class="modal-divider"></div>
        
        <div class="form-preview">
          <h4 class="preview-title">申请信息摘要</h4>
          <div class="preview-grid">
            <div class="preview-card">
              <div class="preview-icon-wrapper bg-blue">
                <t-icon name="file-text" :size="18" />
              </div>
              <div class="preview-content">
                <span class="preview-label">投保编号</span>
                <span class="preview-value">{{ currentSubmitData?.id || '-' }}</span>
              </div>
            </div>
            <div class="preview-card">
              <div class="preview-icon-wrapper bg-green">
                <t-icon name="building" :size="18" />
              </div>
              <div class="preview-content">
                <span class="preview-label">企业名称</span>
                <span class="preview-value">{{ currentSubmitData?.companyName || currentSubmitData?.enterpriseName || '-' }}</span>
              </div>
            </div>
            <div class="preview-card">
              <div class="preview-icon-wrapper bg-purple">
                <t-icon name="user" :size="18" />
              </div>
              <div class="preview-content">
                <span class="preview-label">买方名称</span>
                <span class="preview-value">{{ currentSubmitData?.buyerName || '-' }}</span>
              </div>
            </div>
            <div class="preview-card">
              <div class="preview-icon-wrapper bg-orange">
                <t-icon name="globe" :size="18" />
              </div>
              <div class="preview-content">
                <span class="preview-label">买方国别</span>
                <span class="preview-value">{{ currentSubmitData?.buyerCountry || '-' }}</span>
              </div>
            </div>
            <div class="preview-card">
              <div class="preview-icon-wrapper bg-cyan">
                <t-icon name="tag" :size="18" />
              </div>
              <div class="preview-content">
                <span class="preview-label">投保类型</span>
                <span class="preview-value">{{ currentSubmitData?.insuranceType || '-' }}</span>
              </div>
            </div>
            <div class="preview-card">
              <div class="preview-icon-wrapper bg-yellow">
                <t-icon name="wallet" :size="18" />
              </div>
              <div class="preview-content">
                <span class="preview-label">投保金额</span>
                <span class="preview-value">{{ currentSubmitData?.insuranceCurrency || 'USD' }}{{ Number(currentSubmitData?.insuranceAmount || 0).toLocaleString() }}</span>
              </div>
            </div>
            <div class="preview-card">
              <div class="preview-icon-wrapper bg-red">
                <t-icon name="calendar" :size="18" />
              </div>
              <div class="preview-content">
                <span class="preview-label">投保期限</span>
                <span class="preview-value">{{ currentSubmitData?.expectedInsurancePeriod?.join(' 至 ') || '-' }}</span>
              </div>
            </div>
            <div class="preview-card">
              <div class="preview-icon-wrapper bg-indigo">
                <t-icon name="briefcase" :size="18" />
              </div>
              <div class="preview-content">
                <span class="preview-label">机构类型</span>
                <span class="preview-value">{{ currentSubmitData?.preferredInsuranceOrgType || '-' }}</span>
              </div>
            </div>
            <div class="preview-card">
              <div class="preview-icon-wrapper bg-pink">
                <t-icon name="target" :size="18" />
              </div>
              <div class="preview-content">
                <span class="preview-label">投保目的</span>
                <span class="preview-value">{{ [currentSubmitData?.insurancePrimaryPurpose1, currentSubmitData?.insurancePrimaryPurpose2].filter(Boolean).join('、') || '-' }}</span>
              </div>
            </div>
            <div class="preview-card">
              <div class="preview-icon-wrapper bg-teal">
                <t-icon name="trending-up" :size="18" />
              </div>
              <div class="preview-content">
                <span class="preview-label">预计年销售额</span>
                <span class="preview-value">{{ currentSubmitData?.turnoverCurrency || 'USD' }}{{ Number(currentSubmitData?.expectedInsurableTurnover || 0).toLocaleString() }}</span>
              </div>
            </div>
            <div class="preview-card">
              <div class="preview-icon-wrapper bg-gray">
                <t-icon name="date" :size="18" />
              </div>
              <div class="preview-content">
                <span class="preview-label">申请日期</span>
                <span class="preview-value">{{ currentSubmitData?.createTime || '-' }}</span>
              </div>
            </div>
            <div class="preview-card">
              <div class="preview-icon-wrapper bg-primary">
                <t-icon name="phone" :size="18" />
              </div>
              <div class="preview-content">
                <span class="preview-label">联系人</span>
                <span class="preview-value">{{ currentSubmitData?.contactName || '-' }} {{ currentSubmitData?.contactPhone || '' }}</span>
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
          <t-checkbox v-model="isConfirmedSchema">
            我已仔细核对并确认此『数字化推荐投保建议方案』符合我司本次出运要求，现正式提交投保申请并流转至出单。
          </t-checkbox>
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
import { useBusinessStore } from '@/stores/business'
import { useUserStore } from '@/stores/user'

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
  { value: 'pending_review', label: '待确认' },
  { value: 'approved', label: '已确认' }
]

const statusMap = {
  draft: '待确认',
  pending_review: '待确认',
  clerk_review: '跟单员审核',
  approved: '已确认',
  rejected: '已驳回',
  ocr_pending: '待确认',
  ocr_clerk_review: '待审核',
  ocr_approved: '已确认'
}

const columns = [
  { colKey: 'id', title: '投保编号', width: 130 },
  { colKey: 'companyName', title: '企业名称', ellipsis: true },
  { colKey: 'buyerName', title: '买方名称', ellipsis: true },
  { colKey: 'buyerCountry', title: '买方国别', width: 100 },
  { colKey: 'insuranceType', title: '投保类型', width: 120 },
  { colKey: 'preferredInsuranceOrgType', title: '机构类型', width: 120 },
  { colKey: 'insuranceAmount', title: '投保金额', align: 'right', width: 130 },
  { colKey: 'status', title: '状态', width: 110, slot: 'status' },
  { colKey: 'createTime', title: '申请日期', width: 120 },
  { colKey: 'operation', title: '操作', width: 220, fixed: 'right', slot: 'operation' }
]

const pendingStats = computed(() => {
  const list = store.insuranceApplications || []
  return {
    pending_all: list.filter(it => it.status === 'draft' || it.status === 'pending_review' || it.status === 'rejected').length,
    approved: list.filter(it => it.status === 'approved').length
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
  MessagePlugin.success('提交成功，等待平台审核')
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
    MessagePlugin.warning('请先勾选确认符合数字化推荐的投保方案')
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
  padding: 16px 0;
  
  .modal-info {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    
    .info-icon {
      width: 72px;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      border-radius: 50%;
      color: #fff;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    }
    
    .info-text {
      h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }
      
      p {
        margin: 0;
        font-size: 14px;
        color: #64748b;
        line-height: 1.6;
      }
    }
  }
  
  .modal-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
    margin: 20px 0;
  }
  
  .form-preview {
    .preview-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 20px 0;
      padding-left: 16px;
      border-left: 4px solid #1d39c4;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .preview-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
    
    .preview-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #fff;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        transform: translateY(-1px);
      }
      
      .preview-icon-wrapper {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        flex-shrink: 0;
        
        &.bg-blue { background: #dbeafe; color: #2563eb; }
        &.bg-green { background: #dcfce7; color: #16a34a; }
        &.bg-purple { background: #ede9fe; color: #7c3aed; }
        &.bg-orange { background: #ffedd5; color: #ea580c; }
        &.bg-cyan { background: #cffafe; color: #0891b2; }
        &.bg-yellow { background: #fef3c7; color: #ca8a04; }
        &.bg-red { background: #fee2e2; color: #dc2626; }
        &.bg-indigo { background: #e0e7ff; color: #4f46e5; }
        &.bg-pink { background: #fce7f3; color: #db2777; }
        &.bg-teal { background: #ccfbf1; color: #14b8a6; }
        &.bg-gray { background: #f3f4f6; color: #6b7280; }
        &.bg-primary { background: #e0e7ff; color: #1d39c4; }
      }
      
      .preview-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        
        .preview-label {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        .preview-value {
          font-size: 14px;
          color: #1e293b;
          font-weight: 600;
          word-break: break-all;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 20px;
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
</style>
