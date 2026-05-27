<template>
  <div class="data-table">
    <t-table
      :data="data"
      :columns="columns"
      :loading="loading"
      :pagination="paginationConfig"
      :row-key="rowKey"
      :selected-row-keys="selectedRowKeys"
      :expanded-row-keys="expandedRowKeys"
      @select-change="handleSelectChange"
      @page-change="handlePageChange"
      @expand-change="handleExpandChange"
      hover
      stripe
    >
      <template v-for="slot in Object.keys($slots)" #[slot]="slotProps">
        <slot :name="slot" :="slotProps" />
      </template>
    </t-table>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object,
    default: () => ({})
  },
  rowKey: {
    type: String,
    default: 'id'
  },
  selectedRowKeys: {
    type: Array,
    default: () => []
  },
  expandedRowKeys: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:selectedRowKeys', 'pageChange', 'selectChange', 'expandChange'])

const paginationConfig = computed(() => ({
  theme: 'simple',
  defaultCurrent: 1,
  defaultPageSize: 20,
  total: props.pagination.total || 0,
  showJumper: true,
  ...props.pagination
}))

const handleSelectChange = (value) => {
  emit('update:selectedRowKeys', value)
  emit('selectChange', value)
}

const handleExpandChange = (keys) => {
  emit('expandChange', keys)
}

const handlePageChange = (pageInfo) => {
  emit('pageChange', pageInfo)
}
</script>

<style lang="scss" scoped>
.data-table {
  background: #fff;
  border-radius: 4px;
}
</style>
