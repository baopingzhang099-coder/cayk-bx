<template>
  <t-card class="search-filter">
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
      <slot name="actions"></slot>
    </div>
  </t-card>
</template>

<script setup>
import { reactive } from 'vue'

const props = defineProps({
  statusOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['search', 'reset'])

const searchParams = reactive({
  enterpriseName: '',
  buyerName: '',
  status: '',
  dateRange: []
})

const handleSearch = () => {
  emit('search', { ...searchParams })
}

const handleReset = () => {
  searchParams.enterpriseName = ''
  searchParams.buyerName = ''
  searchParams.status = ''
  searchParams.dateRange = []
  emit('reset')
}
</script>

<style lang="scss" scoped>
.search-filter {
  margin-bottom: 16px;

  :deep(.t-card__body) {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
}

.search-actions {
  display: flex;
  gap: 8px;
}
</style>
