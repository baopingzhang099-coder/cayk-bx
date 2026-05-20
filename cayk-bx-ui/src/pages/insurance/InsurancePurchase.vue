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
      <stat-card title="待提交" :value="insuranceStats.pending_submit" icon="send" color="warning" />
      <stat-card title="资信调查中" :value="insuranceStats.credit_investigating" icon="search" color="primary" />
      <stat-card title="已完成" :value="insuranceStats.completed" icon="check-circle" color="success" />
      <stat-card title="草稿" :value="insuranceStats.draft" icon="edit" color="danger" />
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
          {{ row.insuranceCurrency || 'USD' }}{{ Number(row.insuranceAmount || 0).toLocaleString() }}
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-link @click="handleView(row)">查看</t-link>
            <t-link v-if="row.status === 'draft' || row.status === 'rejected'" @click="handleEdit(row)">编辑</t-link>
            <t-tag v-if="row.status === 'pending_review'" theme="warning">审核中</t-tag>
            <t-tag v-if="row.status === 'rejected'" theme="danger">已驳回</t-tag>
            <t-link v-if="row.status === 'draft' || row.status === 'rejected'" theme="primary" @click="handleShowSubmitModal(row)">提交审核</t-link>
            <t-link v-if="row.status === 'draft'" theme="danger" @click="handleDelete(row)">删除</t-link>
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
            <div class="preview-item">
              <span class="preview-label">投保编号</span>
              <span class="preview-value">{{ currentSubmitData?.id || '-' }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">企业名称</span>
              <span class="preview-value">{{ currentSubmitData?.companyName || currentSubmitData?.enterpriseName || '-' }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">买方名称</span>
              <span class="preview-value">{{ currentSubmitData?.buyerName || '-' }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">买方国别</span>
              <span class="preview-value">{{ currentSubmitData?.buyerCountry || '-' }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">投保类型</span>
              <span class="preview-value">{{ currentSubmitData?.insuranceType || '-' }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">投保金额</span>
              <span class="preview-value">{{ currentSubmitData?.insuranceCurrency || 'USD' }}{{ Number(currentSubmitData?.insuranceAmount || 0).toLocaleString() }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">投保期限</span>
              <span class="preview-value">{{ currentSubmitData?.expectedInsurancePeriod?.join(' 至 ') || '-' }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">机构类型</span>
              <span class="preview-value">{{ currentSubmitData?.preferredInsuranceOrgType || '-' }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">投保目的</span>
              <span class="preview-value">{{ [currentSubmitData?.insurancePrimaryPurpose1, currentSubmitData?.insurancePrimaryPurpose2].filter(Boolean).join('、') || '-' }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">预计年销售额</span>
              <span class="preview-value">{{ currentSubmitData?.turnoverCurrency || 'USD' }}{{ Number(currentSubmitData?.expectedInsurableTurnover || 0).toLocaleString() }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">申请日期</span>
              <span class="preview-value">{{ currentSubmitData?.createTime || '-' }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">联系人</span>
              <span class="preview-value">{{ currentSubmitData?.contactName || '-' }} {{ currentSubmitData?.contactPhone || '' }}</span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <t-button variant="outline" @click="submitVisible = false">取消</t-button>
          <t-button theme="primary" @click="handleConfirmSubmit">确认提交</t-button>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import { useBusinessStore } from '@/stores/business'

const router = useRouter()
const store = useBusinessStore()
const loading = computed(() => false)

const submitVisible = ref(false)
const currentSubmitData = ref(null)

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
  { value: 'draft', label: '草稿' },
  { value: 'pending_review', label: '待审核' },
  { value: 'approved', label: '审核通过' },
  { value: 'rejected', label: '已驳回' }
]

const statusMap = {
  draft: '草稿',
  pending_review: '待审核',
  approved: '审核通过',
  rejected: '已驳回'
}

const columns = [
  { colKey: 'id', title: '投保编号', width: 130 },
  { colKey: 'enterpriseName', title: '企业名称', ellipsis: true },
  { colKey: 'buyerName', title: '买方名称', ellipsis: true },
  { colKey: 'buyerCountry', title: '买方国别', width: 100 },
  { colKey: 'insuranceType', title: '投保类型', width: 120 },
  { colKey: 'preferredInsuranceOrgType', title: '机构类型', width: 120 },
  { colKey: 'insuranceAmount', title: '投保金额', align: 'right', width: 130 },
  { colKey: 'status', title: '状态', width: 110, slot: 'status' },
  { colKey: 'createTime', title: '申请日期', width: 120 },
  { colKey: 'operation', title: '操作', width: 220, fixed: 'right', slot: 'operation' }
]

const insuranceStats = computed(() => store.insuranceStats)

const filteredData = computed(() => {
  const list = store.insuranceApplications || []
  return list.filter((it) => {
    if (searchParams.enterpriseName && !String(it.enterpriseName || '').includes(searchParams.enterpriseName)) return false
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
const handleExport = () => { console.log('export') }

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
const handleDelete = (row) => { store.insuranceApplications = store.insuranceApplications.filter(it => it.id !== row.id) }

onMounted(() => { store.ensureSeeded() })
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

.submit-modal {
  padding: 16px 0;
  
  .modal-info {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 16px;
    
    .info-icon {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e0f2fe;
      border-radius: 50%;
      color: #0ea5e9;
    }
    
    .info-text {
      h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1a1a1a;
      }
      
      p {
        margin: 0;
        font-size: 14px;
        color: #666;
        line-height: 1.6;
      }
    }
  }
  
  .modal-divider {
    height: 1px;
    background: #e7e7e7;
    margin: 16px 0;
  }
  
  .form-preview {
    .preview-title {
      font-size: 15px;
      font-weight: 600;
      color: #333;
      margin: 0 0 16px 0;
      padding-left: 12px;
      border-left: 3px solid #1d39c4;
    }
    
    .preview-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .preview-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 10px 12px;
      background: #fafafa;
      border-radius: 6px;
      
      .preview-label {
        font-size: 13px;
        color: #999;
      }
      
      .preview-value {
        font-size: 14px;
        color: #333;
        font-weight: 500;
        word-break: break-all;
      }
    }
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e7e7e7;
  }
}
</style>
