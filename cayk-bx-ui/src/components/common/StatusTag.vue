<template>
  <div class="status-tag" :class="statusClass">
    <span class="status-dot"></span>
    <span class="status-text">{{ statusText }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true
  },
  statusMap: {
    type: Object,
    default: () => ({})
  }
})

const statusText = computed(() => {
  return props.statusMap[props.status] || props.status
})

const statusClass = computed(() => {
  const status = props.status
  if (['draft', 'pending_submit', 'pending_material'].includes(status)) return 'status-warning'
  if (['credit_investigating', 'limit_approving', 'underwriting', 'processing', 'declaring'].includes(status)) return 'status-primary'
  if (['completed', 'active', 'declared', 'passed', 'effective', 'approved'].includes(status)) return 'status-success'
  if (['rejected', 'suspended', 'cancelled', 'terminated'].includes(status)) return 'status-danger'
  if (['pending_payment', 'pending_declare', 'pending_premium', 'expiring', 'timeout_warning'].includes(status)) return 'status-warning'
  return 'status-default'
})
</script>

<style lang="scss" scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
}

.status-primary {
  background: #E6EFFC;
  color: #0052D9;
  .status-dot { background: #0052D9; }
}

.status-success {
  background: #E6F7F1;
  color: #00A870;
  .status-dot { background: #00A870; }
}

.status-warning {
  background: #FFF8E6;
  color: #FFB800;
  .status-dot { background: #FFB800; }
}

.status-danger {
  background: #FCEDEE;
  color: #E34D57;
  .status-dot { background: #E34D57; }
}

.status-default {
  background: #F5F5F5;
  color: #666666;
  .status-dot { background: #999999; }
}
</style>
