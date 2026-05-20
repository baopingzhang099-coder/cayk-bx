<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/policy/list">保单管理</t-breadcrumb-item>
        <t-breadcrumb-item>贸易信息管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">贸易信息管理</div>
      <div class="page-actions">
        <t-button theme="primary" @click="handleAdd">
          <template #icon><t-icon name="add" /></template>
          新增贸易
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
        <t-form-item>
          <t-space>
            <t-button theme="primary" @click="handleSearch">查询</t-button>
            <t-button variant="outline" @click="handleReset">重置</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-card>

    <div class="stats-grid mb-24">
      <stat-card title="贸易合同" :value="tableData.length" icon="folder" color="primary" />
      <stat-card title="交易总额" value="$1,500,000" icon="money" color="success" />
      <stat-card title="进行中" :value="activeCount" icon="loading" color="warning" />
      <stat-card title="已完成" :value="completedCount" icon="check-circle" color="success" />
    </div>

    <t-card>
      <div class="table-header">
        <span class="table-title">贸易信息列表</span>
        <span class="table-count">共 {{ pagination.total }} 条记录</span>
      </div>
      <t-table :data="tableData" :columns="columns" :loading="loading" row-key="id" hover stripe>
        <template #status="{ row }">
          <status-tag :status="row.status" :status-map="statusMap" />
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-link @click="handleView(row)">查看</t-link>
            <t-link @click="handleEdit(row)">编辑</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <t-dialog v-model:visible="formVisible" :header="formMode === 'create' ? '新增贸易' : formMode === 'edit' ? '编辑贸易' : '贸易详情'" width="700px">
      <t-form v-if="formMode !== 'detail'" ref="formRef" :data="formData" :rules="formRules" label-width="120px" @submit="handleSubmit">
        <t-divider>基本信息</t-divider>
        <t-form-item label="合同号" name="contractNo">
          <t-input v-model="formData.contractNo" placeholder="请输入合同号" />
        </t-form-item>
        <t-form-item label="企业名称" name="enterpriseName">
          <t-input v-model="formData.enterpriseName" placeholder="请输入企业名称" />
        </t-form-item>
        <t-form-item label="买方名称" name="buyerName">
          <t-input v-model="formData.buyerName" placeholder="请输入买方名称" />
        </t-form-item>
        <t-form-item label="买方国别" name="buyerCountry">
          <t-select v-model="formData.buyerCountry" placeholder="请选择买方国别" clearable>
            <t-option value="美国" label="美国" />
            <t-option value="德国" label="德国" />
            <t-option value="日本" label="日本" />
            <t-option value="英国" label="英国" />
            <t-option value="法国" label="法国" />
            <t-option value="香港" label="香港" />
          </t-select>
        </t-form-item>

        <t-divider>商品与交易信息</t-divider>
        <t-form-item label="商品信息" name="productInfo">
          <t-textarea v-model="formData.productInfo" placeholder="请输入商品信息" :autosize="{ minRows: 2, maxRows: 4 }" />
        </t-form-item>
        <t-form-item label="交易金额" name="transactionAmount">
          <t-input-number v-model="formData.transactionAmount" :min="0" placeholder="请输入交易金额" />
        </t-form-item>
        <t-form-item label="结算币种" name="currency">
          <t-select v-model="formData.currency" placeholder="请选择币种" clearable>
            <t-option value="USD" label="USD - 美元" />
            <t-option value="CNY" label="CNY - 人民币" />
            <t-option value="EUR" label="EUR - 欧元" />
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
        <t-form-item label="合同签订日期" name="signDate">
          <t-date-picker v-model="formData.signDate" placeholder="请选择日期" clearable />
        </t-form-item>
        <t-form-item label="合同到期日期" name="expireDate">
          <t-date-picker v-model="formData.expireDate" placeholder="请选择日期" clearable />
        </t-form-item>

        <t-divider>上传文件</t-divider>
        <t-form-item label="贸易合同扫描件" name="contractFiles">
          <t-upload v-model="formData.contractFiles" action="https://demo.com/upload" />
        </t-form-item>

        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit">保存</t-button>
            <t-button variant="outline" @click="formVisible = false">取消</t-button>
          </t-space>
        </t-form-item>
      </t-form>

      <detail-panel v-else title="贸易详情" :columns="detailColumns" :data="currentRow || {}" />
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import DetailPanel from '@/components/common/DetailPanel.vue'

const loading = ref(false)
const searchParams = reactive({ enterpriseName: '', buyerName: '' })
const pagination = reactive({ total: 0, current: 1, pageSize: 20 })

const statusMap = {
  active: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

const columns = [
  { colKey: 'contractNo', title: '合同号', width: 140 },
  { colKey: 'enterpriseName', title: '企业名称', ellipsis: true },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'productInfo', title: '商品信息', ellipsis: true },
  { colKey: 'transactionAmount', title: '交易金额', align: 'right' },
  { colKey: 'currency', title: '币种', width: 80 },
  { colKey: 'paymentTerms', title: '付款条件' },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'operation', title: '操作', width: 120, slot: 'operation' }
]

const tableData = ref([])

const activeCount = computed(() => tableData.value.filter(t => t.status === 'active').length)
const completedCount = computed(() => tableData.value.filter(t => t.status === 'completed').length)

const formVisible = ref(false)
const formMode = ref('create')
const currentRow = ref(null)
const formRef = ref(null)

const formData = reactive({
  contractNo: '',
  enterpriseName: '',
  buyerName: '',
  buyerCountry: '',
  productInfo: '',
  transactionAmount: 0,
  currency: 'USD',
  paymentTerms: '',
  signDate: '',
  expireDate: '',
  contractFiles: []
})

const formRules = {
  contractNo: [{ required: true, message: '请输入合同号', type: 'error' }],
  enterpriseName: [{ required: true, message: '请输入企业名称', type: 'error' }],
  buyerName: [{ required: true, message: '请输入买方名称', type: 'error' }],
  transactionAmount: [{ required: true, message: '请输入交易金额', type: 'error' }]
}

const detailColumns = [
  { label: '合同号', key: 'contractNo' },
  { label: '企业名称', key: 'enterpriseName' },
  { label: '买方名称', key: 'buyerName' },
  { label: '买方国别', key: 'buyerCountry' },
  { label: '商品信息', key: 'productInfo' },
  { label: '交易金额', key: 'transactionAmount' },
  { label: '币种', key: 'currency' },
  { label: '付款条件', key: 'paymentTerms' },
  { label: '签订日期', key: 'signDate' },
  { label: '到期日期', key: 'expireDate' },
  { label: '状态', key: 'status' }
]

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = [
      { id: 1, contractNo: 'C2026001', enterpriseName: '深圳XX国际贸易有限公司', buyerName: 'ABC Corporation', buyerCountry: '美国', productInfo: '电子产品', transactionAmount: 500000, currency: 'USD', paymentTerms: 'TT 30天', signDate: '2026-03-15', expireDate: '2027-03-15', status: 'active' },
      { id: 2, contractNo: 'C2026002', enterpriseName: '上海YY进出口公司', buyerName: 'DEF GmbH', buyerCountry: '德国', productInfo: '机械设备', transactionAmount: 300000, currency: 'USD', paymentTerms: 'LC 60天', signDate: '2026-02-20', expireDate: '2027-02-20', status: 'active' },
      { id: 3, contractNo: 'C2026003', enterpriseName: '北京ZZ贸易集团', buyerName: 'GHI Ltd', buyerCountry: '英国', productInfo: '纺织品', transactionAmount: 200000, currency: 'EUR', paymentTerms: 'TT 45天', signDate: '2026-01-10', expireDate: '2027-01-10', status: 'completed' }
    ]
    pagination.total = tableData.value.length
    loading.value = false
  }, 300)
}

const handleSearch = () => {
  loading.value = true
  setTimeout(() => {
    let filtered = [
      { id: 1, contractNo: 'C2026001', enterpriseName: '深圳XX国际贸易有限公司', buyerName: 'ABC Corporation', buyerCountry: '美国', productInfo: '电子产品', transactionAmount: 500000, currency: 'USD', paymentTerms: 'TT 30天', signDate: '2026-03-15', expireDate: '2027-03-15', status: 'active' },
      { id: 2, contractNo: 'C2026002', enterpriseName: '上海YY进出口公司', buyerName: 'DEF GmbH', buyerCountry: '德国', productInfo: '机械设备', transactionAmount: 300000, currency: 'USD', paymentTerms: 'LC 60天', signDate: '2026-02-20', expireDate: '2027-02-20', status: 'active' },
      { id: 3, contractNo: 'C2026003', enterpriseName: '北京ZZ贸易集团', buyerName: 'GHI Ltd', buyerCountry: '英国', productInfo: '纺织品', transactionAmount: 200000, currency: 'EUR', paymentTerms: 'TT 45天', signDate: '2026-01-10', expireDate: '2027-01-10', status: 'completed' }
    ]
    if (searchParams.enterpriseName) {
      filtered = filtered.filter(t => t.enterpriseName.includes(searchParams.enterpriseName))
    }
    if (searchParams.buyerName) {
      filtered = filtered.filter(t => t.buyerName.includes(searchParams.buyerName))
    }
    tableData.value = filtered
    pagination.total = filtered.length
    loading.value = false
  }, 300)
}

const handleReset = () => {
  searchParams.enterpriseName = ''
  searchParams.buyerName = ''
  fetchData()
}

const handleAdd = () => {
  formMode.value = 'create'
  currentRow.value = null
  Object.assign(formData, {
    contractNo: `C${new Date().getFullYear()}${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
    enterpriseName: '',
    buyerName: '',
    buyerCountry: '',
    productInfo: '',
    transactionAmount: 0,
    currency: 'USD',
    paymentTerms: '',
    signDate: '',
    expireDate: '',
    contractFiles: []
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
    contractNo: row.contractNo,
    enterpriseName: row.enterpriseName,
    buyerName: row.buyerName,
    buyerCountry: row.buyerCountry,
    productInfo: row.productInfo,
    transactionAmount: row.transactionAmount,
    currency: row.currency,
    paymentTerms: row.paymentTerms,
    signDate: row.signDate,
    expireDate: row.expireDate,
    contractFiles: row.contractFiles || []
  })
  formVisible.value = true
}

const handleSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return
  if (formMode.value === 'create') {
    tableData.value.unshift({
      id: Date.now(),
      ...formData,
      status: 'active'
    })
    MessagePlugin.success('新增贸易成功')
  } else if (currentRow.value) {
    Object.assign(currentRow.value, formData)
    MessagePlugin.success('贸易信息已更新')
  }
  formVisible.value = false
}

onMounted(() => fetchData())
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.search-card { margin-bottom: 16px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.mb-24 { margin-bottom: 24px; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.table-title { font-size: 16px; font-weight: 600; color: #333; }
.table-count { font-size: 14px; color: #999; }
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>
