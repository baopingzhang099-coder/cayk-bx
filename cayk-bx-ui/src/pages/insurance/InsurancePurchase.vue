<template>
  <div class="page-container">
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
        <t-form-item label="状态">
          <t-select v-model="searchParams.status" placeholder="请选择状态" clearable>
            <t-option v-for="item in statusOptions" :key="item.value" :value="item.value" :label="item.label" />
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
      <stat-card title="本月新增" :value="12" icon="document-add" color="primary" />
      <stat-card title="审核中" :value="8" icon="clipboard" color="warning" />
      <stat-card title="已完成" :value="45" icon="check-circle" color="success" />
      <stat-card title="待处理" :value="5" icon="time" color="danger" />
    </div>

    <t-card>
      <div class="table-header">
        <span class="table-title">投保信息列表</span>
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
          ¥{{ row.coverageAmount.toLocaleString() }}
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-link @click="handleView(row)">查看</t-link>
            <t-link @click="handleEdit(row)">编辑</t-link>
            <t-link v-if="row.status === 'pending_submit'" theme="warning" @click="handleSubmit(row)">提交</t-link>
            <t-link v-if="row.status === 'draft'" theme="danger" @click="handleDelete(row)">删除</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <t-dialog v-model:visible="dialogVisible" :header="dialogTitle" width="1000px" :footer="false">
      <insurance-form v-if="dialogVisible" :data="currentRow" @submit="handleFormSubmit" @cancel="dialogVisible = false" />
    </t-dialog>

    <t-dialog v-model:visible="detailVisible" header="投保详情" width="900px" :footer="false">
      <div v-if="currentRow" class="detail-container">
        <t-tabs default-value="customer">
          <t-tab-panel value="customer" label="客户信息">
            <detail-panel :data="currentRow" :columns="customerColumns" title="客户基本信息" />
          </t-tab-panel>
          <t-tab-panel value="buyer" label="买方信息">
            <detail-panel :data="currentRow" :columns="buyerColumns" title="买方信息" />
          </t-tab-panel>
          <t-tab-panel value="insurance" label="投保需求">
            <detail-panel :data="currentRow" :columns="insuranceColumns" title="投保需求" />
          </t-tab-panel>
          <t-tab-panel value="process" label="流程记录">
            <t-timeline mode="alternate">
              <t-timeline-item v-for="item in processTimeline" :key="item.time" :content="item.content" :time="item.time" :color="item.color" />
            </t-timeline>
          </t-tab-panel>
        </t-tabs>
      </div>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import DetailPanel from '@/components/common/DetailPanel.vue'
import InsuranceForm from '@/components/form/InsuranceForm.vue'

const loading = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const dialogTitle = ref('新增投保')
const currentRow = ref(null)

const searchParams = reactive({
  enterpriseName: '',
  buyerName: '',
  status: '',
  dateRange: []
})

const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'pending_material', label: '待补充资料' },
  { value: 'pending_submit', label: '待提交' },
  { value: 'credit_investigating', label: '资信调查中' },
  { value: 'limit_approving', label: '限额审批中' },
  { value: 'underwriting', label: '核保中' },
  { value: 'pending_payment', label: '待支付' },
  { value: 'completed', label: '已完成' },
  { value: 'rejected', label: '已拒绝' }
]

const statusMap = {
  draft: '草稿',
  pending_material: '待补充资料',
  pending_submit: '待提交',
  credit_investigating: '资信调查中',
  limit_approving: '限额审批中',
  underwriting: '核保中',
  pending_payment: '待支付',
  completed: '已完成',
  rejected: '已拒绝'
}

const columns = [
  { colKey: 'id', title: '投保编号', width: 130 },
  { colKey: 'enterpriseName', title: '企业名称', ellipsis: true },
  { colKey: 'buyerName', title: '买方名称', ellipsis: true },
  { colKey: 'insuranceScheme', title: '投保方案' },
  { colKey: 'coverageAmount', title: '投保金额', align: 'right', width: 130 },
  { colKey: 'status', title: '状态', width: 110, slot: 'status' },
  { colKey: 'createTime', title: '申请日期', width: 120 },
  { colKey: 'operation', title: '操作', width: 180, fixed: 'right', slot: 'operation' }
]

const customerColumns = [
  { label: '企业名称', value: 'enterpriseName' },
  { label: '统一社会信用代码', value: 'unifiedSocialCreditCode' },
  { label: '企业地址', value: 'enterpriseAddress' },
  { label: '联系人', value: 'contactName' },
  { label: '联系电话', value: 'contactPhone' },
  { label: '电子邮箱', value: 'contactEmail' }
]

const buyerColumns = [
  { label: '买方名称', value: 'buyerName' },
  { label: '买方国别', value: 'buyerCountry' },
  { label: '买方地址', value: 'buyerAddress' },
  { label: '买方联系人', value: 'buyerContact' },
  { label: '联系电话', value: 'buyerPhone' },
  { label: '历史交易金额', value: 'historicalTransactionAmount' }
]

const insuranceColumns = [
  { label: '投保方案', value: 'insuranceScheme' },
  { label: '投保金额', value: (v) => `¥${v.coverageAmount?.toLocaleString()}` },
  { label: '期望保险公司', value: 'expectedInsuranceCompany' },
  { label: '保单期限', value: 'policyDuration' },
  { label: '特殊需求', value: 'specialRequirements' }
]

const processTimeline = [
  { time: '2026-05-01 10:30', content: '提交投保申请', color: 'success' },
  { time: '2026-05-01 14:00', content: '资料审核通过', color: 'success' },
  { time: '2026-05-02 09:00', content: '保险公司资信调查中', color: 'primary' },
  { time: '2026-05-10', content: '预计完成资信调查', color: 'warning' }
]

const tableData = ref([])
const pagination = reactive({
  total: 0,
  current: 1,
  pageSize: 20
})

const paginationConfig = computed(() => ({
  theme: 'simple',
  ...pagination
}))

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = [
      { id: 'TB2026001', enterpriseName: '深圳XX国际贸易有限公司', unifiedSocialCreditCode: '91440300XXXXXXXXXX', enterpriseAddress: '深圳市南山区XX路XX号', contactName: '张经理', contactPhone: '138****8888', contactEmail: 'zhang@cayk.com', buyerName: 'ABC Corporation', buyerCountry: '美国', buyerAddress: 'New York, USA', buyerContact: 'John Smith', buyerPhone: '+1-212-555-0100', historicalTransactionAmount: '$1,200,000', insuranceScheme: '方案A-全程保障', coverageAmount: 500000, expectedInsuranceCompany: '人保财险', policyDuration: '1年', specialRequirements: '', status: 'credit_investigating', createTime: '2026-05-01' },
      { id: 'TB2026002', enterpriseName: '上海YY进出口公司', unifiedSocialCreditCode: '91310000XXXXXXXXXX', enterpriseAddress: '上海市浦东新区XX路XX号', contactName: '李经理', contactPhone: '139****6666', contactEmail: 'li@cayk.com', buyerName: 'DEF GmbH', buyerCountry: '德国', buyerAddress: 'Hamburg, Germany', buyerContact: 'Hans Mueller', buyerPhone: '+49-40-123456', historicalTransactionAmount: '$800,000', insuranceScheme: '方案B-基本保障', coverageAmount: 300000, expectedInsuranceCompany: '平安保险', policyDuration: '1年', specialRequirements: '', status: 'pending_submit', createTime: '2026-05-02' },
      { id: 'TB2026003', enterpriseName: '北京ZZ贸易集团', unifiedSocialCreditCode: '91110000XXXXXXXXXX', enterpriseAddress: '北京市朝阳区XX路XX号', contactName: '王经理', contactPhone: '137****5555', contactEmail: 'wang@cayk.com', buyerName: 'GHI Ltd', buyerCountry: '英国', buyerAddress: 'London, UK', buyerContact: 'James Wilson', buyerPhone: '+44-20-12345678', historicalTransactionAmount: '$600,000', insuranceScheme: '方案C-标准保障', coverageAmount: 800000, expectedInsuranceCompany: '太平洋保险', policyDuration: '2年', specialRequirements: '', status: 'completed', createTime: '2026-04-28' },
      { id: 'TB2026004', enterpriseName: '广州AA实业公司', unifiedSocialCreditCode: '91440100XXXXXXXXXX', enterpriseAddress: '广州市天河区XX路XX号', contactName: '赵经理', contactPhone: '136****4444', contactEmail: 'zhao@cayk.com', buyerName: 'JKL Co', buyerCountry: '日本', buyerAddress: 'Tokyo, Japan', buyerContact: 'Tanaka Sato', buyerPhone: '+81-3-12345678', historicalTransactionAmount: '$400,000', insuranceScheme: '方案A-全程保障', coverageAmount: 450000, expectedInsuranceCompany: '人保财险', policyDuration: '1年', specialRequirements: '需要加急处理', status: 'pending_material', createTime: '2026-05-03' }
    ]
    pagination.total = 4
    loading.value = false
  }, 300)
}

const handleSearch = () => { fetchData() }
const handleReset = () => { fetchData() }
const handlePageChange = (pageInfo) => { pagination.current = pageInfo.current; pagination.pageSize = pageInfo.pageSize; fetchData() }
const handleExport = () => { console.log('export') }

const handleAdd = () => { currentRow.value = null; dialogTitle.value = '新增投保'; dialogVisible.value = true }
const handleView = (row) => { currentRow.value = row; detailVisible.value = true }
const handleEdit = (row) => { currentRow.value = row; dialogTitle.value = '编辑投保'; dialogVisible.value = true }
const handleSubmit = (row) => { console.log('submit:', row) }
const handleDelete = (row) => { console.log('delete:', row) }
const handleFormSubmit = (formData) => { console.log('form submit:', formData); dialogVisible.value = false; fetchData() }

onMounted(() => { fetchData() })
</script>

<style lang="scss" scoped>
.page-container { }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.search-card { margin-bottom: 16px; :deep(.t-card__body) { display: flex; justify-content: space-between; align-items: flex-end; } }
.search-actions { display: flex; gap: 8px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.table-title { font-size: 16px; font-weight: 600; color: #333; }
.table-count { font-size: 14px; color: #999; }
.mb-16 { margin-bottom: 16px; }
.detail-container { padding: 0 16px; }
</style>
