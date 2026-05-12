<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">贸易信息管理</div>
      <div class="page-actions">
        <t-button theme="primary">
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

    <t-card>
      <div class="table-header">
        <span class="table-title">贸易信息列表</span>
        <span class="table-count">共 {{ pagination.total }} 条记录</span>
      </div>
      <t-table :data="tableData" :columns="columns" :loading="loading" row-key="id" hover stripe>
        <template #operation="{ row }">
          <t-space>
            <t-link @click="handleView(row)">查看</t-link>
            <t-link @click="handleEdit(row)">编辑</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const loading = ref(false)
const searchParams = reactive({ enterpriseName: '', buyerName: '' })
const pagination = reactive({ total: 0, current: 1, pageSize: 20 })

const columns = [
  { colKey: 'contractNo', title: '合同号', width: 140 },
  { colKey: 'enterpriseName', title: '企业名称', ellipsis: true },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'productInfo', title: '商品信息' },
  { colKey: 'transactionAmount', title: '交易金额', align: 'right' },
  { colKey: 'paymentTerms', title: '付款条件' },
  { colKey: 'createTime', title: '创建时间', width: 160 },
  { colKey: 'operation', title: '操作', width: 120, slot: 'operation' }
]

const tableData = ref([])

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = [
      { id: 1, contractNo: 'C2026001', enterpriseName: '深圳XX国际贸易有限公司', buyerName: 'ABC Corporation', productInfo: '电子产品', transactionAmount: 500000, paymentTerms: 'TT 30天', createTime: '2026-05-01' },
      { id: 2, contractNo: 'C2026002', enterpriseName: '上海YY进出口公司', buyerName: 'DEF GmbH', productInfo: '机械设备', transactionAmount: 300000, paymentTerms: 'TT 45天', createTime: '2026-05-02' },
      { id: 3, contractNo: 'C2026003', enterpriseName: '北京ZZ贸易集团', buyerName: 'GHI Ltd', productInfo: '纺织品', transactionAmount: 200000, paymentTerms: 'LC 60天', createTime: '2026-05-03' }
    ]
    pagination.total = 3
    loading.value = false
  }, 300)
}

const handleSearch = () => fetchData()
const handleReset = () => fetchData()
const handleView = (row) => console.log('view:', row)
const handleEdit = (row) => console.log('edit:', row)

onMounted(() => fetchData())
</script>

<style lang="scss" scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; color: #333; }
.search-card { margin-bottom: 16px; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.table-title { font-size: 16px; font-weight: 600; color: #333; }
.table-count { font-size: 14px; color: #999; }
</style>
