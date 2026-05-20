<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/clerk/permission">系统管理</t-breadcrumb-item>
        <t-breadcrumb-item>权限管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">权限管理</div>
    </div>

    <t-card>
      <t-form layout="inline" class="search-form">
        <t-form-item label="跟单员">
          <t-input v-model="searchParams.clerkName" placeholder="请输入跟单员姓名" clearable />
        </t-form-item>
        <t-form-item label="角色">
          <t-select v-model="searchParams.role" placeholder="请选择角色" clearable>
            <t-option value="admin" label="管理员" />
            <t-option value="senior" label="高级跟单员" />
            <t-option value="normal" label="普通跟单员" />
          </t-select>
        </t-form-item>
        <t-form-item>
          <t-button theme="primary" @click="handleSearch">查询</t-button>
          <t-button variant="outline" @click="handleReset" style="margin-left: 12px;">重置</t-button>
        </t-form-item>
      </t-form>
    </t-card>

    <t-card class="mt-16">
      <div class="table-header">
        <span class="table-title">权限配置列表</span>
        <t-button theme="primary" @click="handleAdd">
          <template #icon><t-icon name="add" /></template>
          新增角色
        </t-button>
      </div>
      <t-table :data="tableData" :columns="columns" row-key="id" hover stripe>
        <template #permissions="{ row }">
          <t-space :size="[4, 4]">
            <t-tag v-for="perm in row.permissions" :key="perm" size="small">{{ perm }}</t-tag>
          </t-space>
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-link @click="handleView(row)">查看</t-link>
            <t-link @click="handleEdit(row)">编辑</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <t-dialog v-model:visible="dialogVisible" :header="dialogTitle" width="600px" :footer="false">
      <t-form :data="formData" label-width="100px">
        <t-form-item label="角色名称">
          <t-input v-model="formData.roleName" placeholder="请输入角色名称" />
        </t-form-item>
        <t-form-item label="角色描述">
          <t-input v-model="formData.description" placeholder="请输入角色描述" />
        </t-form-item>
        <t-form-item label="权限配置">
          <t-checkbox-group v-model="formData.permissions" :options="permissionOptions" />
        </t-form-item>
        <t-form-item>
          <t-space>
            <t-button theme="primary" @click="handleSubmit">提交</t-button>
            <t-button @click="dialogVisible = false">取消</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const searchParams = reactive({ clerkName: '', role: '' })
const dialogVisible = ref(false)
const dialogTitle = ref('新增角色')
const formData = reactive({ roleName: '', description: '', permissions: [] })

const permissionOptions = [
  { value: 'insurance_view', label: '投保查看' },
  { value: 'insurance_edit', label: '投保编辑' },
  { value: 'policy_view', label: '保单查看' },
  { value: 'policy_edit', label: '保单编辑' },
  { value: 'claim_view', label: '理赔查看' },
  { value: 'claim_edit', label: '理赔编辑' },
  { value: 'clerk_view', label: '跟单员查看' },
  { value: 'clerk_manage', label: '跟单员管理' },
  { value: 'stats_view', label: '统计查看' },
  { value: 'stats_export', label: '统计导出' }
]

const columns = [
  { colKey: 'roleName', title: '角色名称', width: 140 },
  { colKey: 'description', title: '角色描述' },
  { colKey: 'clerkCount', title: '关联人数', width: 100, align: 'center' },
  { colKey: 'permissions', title: '权限配置', width: 400, slot: 'permissions' },
  { colKey: 'operation', title: '操作', width: 120, slot: 'operation' }
]

const tableData = ref([
  { id: 1, roleName: '管理员', description: '系统管理员，拥有所有权限', clerkCount: 2, permissions: ['投保查看', '投保编辑', '保单查看', '保单编辑', '理赔查看', '理赔编辑', '跟单员查看', '跟单员管理', '统计查看', '统计导出'] },
  { id: 2, roleName: '高级跟单员', description: '可管理客户投保、保单业务', clerkCount: 5, permissions: ['投保查看', '投保编辑', '保单查看', '保单编辑', '理赔查看', '理赔编辑', '统计查看'] },
  { id: 3, roleName: '普通跟单员', description: '可查看和跟进业务', clerkCount: 8, permissions: ['投保查看', '保单查看', '理赔查看', '统计查看'] }
])

const handleSearch = () => console.log('search')
const handleReset = () => console.log('reset')
const handleAdd = () => { dialogTitle.value = '新增角色'; dialogVisible.value = true }
const handleView = (row) => console.log('view:', row)
const handleEdit = (row) => { dialogTitle.value = '编辑角色'; dialogVisible.value = true }
const handleSubmit = () => { dialogVisible.value = false; console.log('submit:', formData) }
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.search-form { margin-bottom: 0; }
.mt-16 { margin-top: 16px; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.table-title { font-size: 16px; font-weight: 600; color: #333; }
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>
