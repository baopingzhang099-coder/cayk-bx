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
  if (['draft', 'pending_submit', 'pending_material', 'pending_review', 'platform_review', 'clerk_review', 'pending_ocr', 'ocr_processing', 'clerk_pending_auth', 'clerk_auth_authorized', 'clerk_confirm', 'chg_draft', 'chg_platform_review', 'chg_supplement', 'chg_platform_supplemented', 'chg_customer_supplement', 'renew_supplement', 'renew_customer_supplement', 'renew_pending_payment', 'renew_clerk_resubmit', 'sr_draft', 'sr_supplement', 'sr_customer_supplement', 'cl_draft', 'cl_customer_confirm'].includes(status)) return 'status-warning'
  if (['credit_investigating', 'limit_approving', 'underwriting', 'processing', 'declaring', 'ocr_completed', 'clerk_ocr_processing', 'clerk_platform_review', 'chg_clerk_review', 'chg_insurer_review', 'renew_customer_supplemented', 'renew_platform_review', 'renew_payment_uploaded', 'renew_payment_verified', 'sr_platform_review', 'sr_clerk_review', 'sr_insurer_review', 'sr_platform_synced', 'cl_platform_review', 'cl_clerk_review', 'cl_insurer_review', 'cl_platform_synced', 'cl_quota_recording', 'sd_platform_review', 'sd_finance_checked', 'sd_docs_generated', 'sd_clerk_pending', 'sd_insurer_review', 'sd_limit_updated', 'premium_uploaded', 'premium_verified', 'premium_paid'].includes(status)) return 'status-primary'
  if (['completed', 'active', 'declared', 'passed', 'effective', 'approved', 'clerk_active', 'chg_insurer_approved', 'chg_completed', 'renew_active', 'renew_paid', 'sr_insurer_approved', 'sr_payment_initiated', 'sr_terminated', 'cl_insurer_approved', 'cl_completed', 'sd_insurer_approved', 'archived'].includes(status)) return 'status-success'
  if (['rejected', 'suspended', 'cancelled', 'terminated', 'returned', 'clerk_ocr_failed', 'chg_insurer_rejected', 'renew_insurer_rejected', 'sr_insurer_rejected', 'sr_business_terminated', 'cl_insurer_rejected', 'sd_insurer_rejected'].includes(status)) return 'status-danger'
  if (['pending_payment', 'pending_declare', 'pending_premium', 'expiring', 'timeout_warning', 'customer_confirmed'].includes(status)) return 'status-warning'
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
