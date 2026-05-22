<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/clerk/list">跟单管理</t-breadcrumb-item>
        <t-breadcrumb-item>跟单员信息</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">跟单员信息</div>
      <div class="page-actions">
        <t-button theme="primary" @click="handleAdd">
          <template #icon><t-icon name="add" /></template>
          新增跟单员
        </t-button>
      </div>
    </div>

    <search-filter
      :status-options="statusOptions"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="stats-grid mb-24">
      <stat-card title="总人数" :value="tableData.length" icon="person" color="primary" />
      <stat-card title="在职" :value="activeCount" icon="check-circle" color="success" />
      <stat-card title="待考核" :value="probationCount" icon="time" color="warning" />
      <stat-card title="本月业绩冠军" :value="topPerformer" icon="trophy" color="danger" />
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
      <template #operation="{ row }">
        <t-space>
          <t-link @click="handleView(row)">查看</t-link>
          <t-link @click="handleEdit(row)">编辑</t-link>
          <t-link @click="handlePermission(row)">权限</t-link>
        </t-space>
      </template>
    </data-table>

    <t-dialog v-model:visible="formVisible" :header="formMode === 'create' ? '新增跟单员' : formMode === 'edit' ? '编辑跟单员' : '跟单员详情'" width="550px">
      <t-form v-if="formMode !== 'detail'" ref="formRef" :data="formData" :rules="formRules" label-width="100px" @submit="handleSubmit">
        <t-form-item label="工号" name="workNo">
          <t-input v-model="formData.workNo" placeholder="请输入工号" :disabled="formMode === 'edit'" />
        </t-form-item>
        <t-form-item label="姓名" name="name">
          <t-input v-model="formData.name" placeholder="请输入姓名" />
        </t-form-item>
        <t-form-item label="部门" name="department">
          <t-select v-model="formData.department" placeholder="请选择部门" clearable>
            <t-option value="业务部" label="业务部" />
            <t-option value="客服部" label="客服部" />
            <t-option value="风控部" label="风控部" />
            <t-option value="财务部" label="财务部" />
          </t-select>
        </t-form-item>
        <t-form-item label="联系电话" name="phone">
          <t-input v-model="formData.phone" placeholder="请输入联系电话" />
        </t-form-item>
        <t-form-item label="邮箱" name="email">
          <t-input v-model="formData.email" placeholder="请输入邮箱" />
        </t-form-item>
        <t-form-item label="入职日期" name="joinDate">
          <t-date-picker v-model="formData.joinDate" placeholder="请选择入职日期" clearable />
        </t-form-item>
        <t-form-item label="状态" name="status">
          <t-select v-model="formData.status" placeholder="请选择状态" clearable>
            <t-option value="active" label="在职" />
            <t-option value="probation" label="待考核" />
            <t-option value="inactive" label="离职" />
          </t-select>
        </t-form-item>
        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit">保存</t-button>
            <t-button variant="outline" @click="formVisible = false">取消</t-button>
          </t-space>
        </t-form-item>
      </t-form>

      <detail-panel v-else title="跟单员详情" :columns="detailColumns" :data="currentRow || {}" />
    </t-dialog>

    <t-dialog v-model:visible="permissionVisible" header="权限配置" width="500px">
      <div v-if="currentRow">
        <div class="permission-header">
          <t-avatar size="large">{{ currentRow.name?.charAt(0) }}</t-avatar>
          <div class="permission-info">
            <div class="permission-name">{{ currentRow.name }}</div>
            <div class="permission-dept">{{ currentRow.department }} - {{ currentRow.workNo }}</div>
          </div>
        </div>
        <t-divider />
        <t-form label-width="100px">
          <t-form-item label="角色">
            <t-select v-model="currentRow.role" placeholder="请选择角色" clearable>
              <t-option value="admin" label="管理员" />
              <t-option value="senior" label="高级跟单员" />
              <t-option value="normal" label="普通跟单员" />
            </t-select>
          </t-form-item>
          <t-form-item label="权限配置">
            <t-checkbox-group v-model="currentRow.permissions" :options="permissionOptions" />
          </t-form-item>
          <t-form-item>
            <t-button theme="primary" @click="handlePermissionSave">保存权限</t-button>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { useBusinessStore } from '@/stores/business'
import SearchFilter from '@/components/common/SearchFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import DetailPanel from '@/components/common/DetailPanel.vue'

const businessStore = useBusinessStore()
const loading = ref(false)

const statusOptions = [
  { value: 'active', label: '在职' },
  { value: 'inactive', label: '离职' },
  { value: 'probation', label: '待考核' }
]

const statusMap = {
  active: '在职',
  inactive: '离职',
  probation: '待考核'
}

const columns = [
  { colKey: 'workNo', title: '工号', width: 100 },
  { colKey: 'name', title: '姓名' },
  { colKey: 'department', title: '部门' },
  { colKey: 'phone', title: '联系电话', width: 130 },
  { colKey: 'email', title: '邮箱' },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'customerCount', title: '负责客户', width: 100, align: 'center' },
  { colKey: 'operation', title: '操作', width: 160, fixed: 'right', slot: 'operation' }
]

const tableData = ref([])
const pagination = reactive({ total: 0, current: 1, pageSize: 20 })
const searchParams = ref({ enterpriseName: '', clerkName: '', status: '', dateRange: [] })

const activeCount = computed(() => tableData.value.filter(t => t.status === 'active').length)
const probationCount = computed(() => tableData.value.filter(t => t.status === 'probation').length)
const topPerformer = computed(() => {
  const sorted = [...tableData.value].sort((a, b) => b.customerCount - a.customerCount)
  return sorted.length > 0 ? `${sorted[0].name} ${sorted[0].customerCount}户` : '-'
})

const formVisible = ref(false)
const permissionVisible = ref(false)
const formMode = ref('create')
const currentRow = ref(null)
const formRef = ref(null)

const formData = reactive({
  workNo: '',
  name: '',
  department: '',
  phone: '',
  email: '',
  joinDate: '',
  status: 'active',
  customerCount: 0
})

const formRules = {
  workNo: [{ required: true, message: '请输入工号', type: 'error' }],
  name: [{ required: true, message: '请输入姓名', type: 'error' }],
  department: [{ required: true, message: '请选择部门', type: 'error' }],
  phone: [{ required: true, message: '请输入联系电话', type: 'error' }],
  status: [{ required: true, message: '请选择状态', type: 'error' }]
}

const detailColumns = [
  { label: '工号', key: 'workNo' },
  { label: '姓名', key: 'name' },
  { label: '部门', key: 'department' },
  { label: '联系电话', key: 'phone' },
  { label: '邮箱', key: 'email' },
  { label: '入职日期', key: 'joinDate' },
  { label: '状态', key: 'status' },
  { label: '负责客户数', key: 'customerCount' }
]

const permissionOptions = [
  { value: 'insurance_view', label: '投保查看' },
  { value: 'insurance_edit', label: '投保编辑' },
  { value: 'insurance_submit', label: '投保提交' },
  { value: 'policy_view', label: '保单查看' },
  { value: 'policy_edit', label: '保单编辑' },
  { value: 'claim_view', label: '理赔查看' },
  { value: 'claim_edit', label: '理赔编辑' },
  { value: 'clerk_view', label: '跟单员查看' },
  { value: 'clerk_manage', label: '跟单员管理' },
  { value: 'stats_view', label: '统计查看' },
  { value: 'stats_export', label: '统计导出' }
]

const fetchData = () => {
  loading.value = true
  businessStore.ensureSeeded()
  tableData.value = [...businessStore.clerkList]
  pagination.total = tableData.value.length
  loading.value = false
}

const handleSearch = (params) => {
  searchParams.value = params
  pagination.current = 1
}
const handleReset = () => {
  searchParams.value = { enterpriseName: '', clerkName: '', status: '', dateRange: [] }
  pagination.current = 1
}
const handlePageChange = (pageInfo) => {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
}

const handleAdd = () => {
  formMode.value = 'create'
  currentRow.value = null
  Object.assign(formData, {
    workNo: `C${String(tableData.value.length + 1).padStart(3, '0')}`,
    name: '',
    department: '',
    phone: '',
    email: '',
    joinDate: '',
    status: 'active',
    customerCount: 0
  })
  formVisible.value = true
}

const handleView = (row) => {
  formMode.value = 'detail'
  currentRow.value = { ...row }
  formVisible.value = true
}

const handleEdit = (row) => {
  formMode.value = 'edit'
  currentRow.value = row
  Object.assign(formData, {
    workNo: row.workNo,
    name: row.name,
    department: row.department,
    phone: row.phone,
    email: row.email,
    joinDate: row.joinDate || '',
    status: row.status,
    customerCount: row.customerCount
  })
  formVisible.value = true
}

const handlePermission = (row) => {
  currentRow.value = { ...row, permissions: [...(row.permissions || [])] }
  permissionVisible.value = true
}

const handlePermissionSave = () => {
  const idx = tableData.value.findIndex(t => t.id === currentRow.value.id)
  if (idx >= 0) {
    tableData.value[idx].permissions = currentRow.value.permissions
    tableData.value[idx].role = currentRow.value.role
    const storeIdx = businessStore.clerkList.findIndex(t => t.id === currentRow.value.id)
    if (storeIdx >= 0) {
      businessStore.clerkList[storeIdx].permissions = currentRow.value.permissions
      businessStore.clerkList[storeIdx].role = currentRow.value.role
    }
  }
  MessagePlugin.success('权限配置已保存')
  permissionVisible.value = false
}

const handleSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return
  if (formMode.value === 'create') {
    const newClerk = {
      id: Date.now().toString(),
      ...formData,
      permissions: [],
      role: 'normal'
    }
    tableData.value.unshift(newClerk)
    businessStore.clerkList.unshift(newClerk)
    pagination.total = tableData.value.length
    MessagePlugin.success('跟单员添加成功')
  } else if (currentRow.value) {
    Object.assign(currentRow.value, formData)
    const storeIdx = businessStore.clerkList.findIndex(t => t.id === currentRow.value.id)
    if (storeIdx >= 0) {
      Object.assign(businessStore.clerkList[storeIdx], formData)
    }
    MessagePlugin.success('跟单员信息已更新')
  }
  formVisible.value = false
}

onMounted(() => fetchData())
</script>

<style lang="scss" scoped>
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.mb-24 { margin-bottom: 24px; }
.permission-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.permission-name { font-size: 18px; font-weight: 600; color: #333; }
.permission-dept { color: #666; font-size: 14px; margin-top: 4px; }
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>
