<template>
  <div class="sub-records-panel" v-if="records.length > 0">
    <div class="panel-header">
      <span class="panel-title">保单子记录</span>
      <span class="panel-count">共 {{ records.length }} 条</span>
    </div>
    <t-table
      :data="records"
      :columns="columns"
      size="small"
      row-key="id"
      :pagination="null"
      hover
      stripe
    >
      <template #type="{ row }">
        <t-tag :theme="typeTheme(row.type)" size="small" variant="light">{{ typeLabel(row.type) }}</t-tag>
      </template>
      <template #status="{ row }">
        <status-tag :status="row.status" :status-map="row.statusMap" />
      </template>
      <template #operation="{ row }">
        <t-space>
          <t-link @click="$emit('view', row)">查看详情</t-link>
          <template v-if="row.type === 'renewal'">
            <t-link v-if="isInkasso && row.status === 'renew_inkasso_review' && !row._raw?.generatedApplicationForm?.length" theme="primary" @click="$emit('renewal-gen-docs', row._raw)">生成续保资料</t-link>
            <t-link v-if="isInkasso && row.status === 'renew_inkasso_review' && row._raw?.generatedApplicationForm?.length" theme="primary" @click="$emit('renewal-push-clerk', row._raw)">推送给跟单员</t-link>
            <t-link v-if="isInkasso && row.status === 'renew_supplement'" theme="primary" @click="$emit('renewal-push-supplement', row._raw)">推送客户补充</t-link>
            <t-link v-if="isInkasso && row.status === 'renew_platform_review'" theme="success" @click="$emit('renewal-approve-supplement', row._raw)">审核通过</t-link>
            <t-link v-if="isInkasso && row.status === 'renew_active'" theme="primary" @click="$emit('renewal-payment', row._raw)">推送缴费申请</t-link>
            <t-link v-if="isInkasso && row.status === 'renew_payment_uploaded'" theme="primary" @click="$emit('renewal-verify-voucher', row._raw)">维护缴费凭证</t-link>

            <t-link v-if="isClerk && row.status === 'renew_clerk_review'" theme="success" @click="$emit('renewal-clerk-approve', row._raw)">审核通过</t-link>
            <t-link v-if="isClerk && row.status === 'renew_clerk_review'" theme="danger" @click="$emit('renewal-clerk-reject', row._raw)">驳回</t-link>
            <t-link v-if="isClerk && row.status === 'renew_insurer_review'" theme="success" @click="$emit('renewal-insurer-approve', row._raw)">保险公司批准</t-link>
            <t-link v-if="isClerk && row.status === 'renew_insurer_review'" theme="danger" @click="$emit('renewal-insurer-reject', row._raw)">保险公司驳回</t-link>
            <t-link v-if="isClerk && row.status === 'renew_insurer_approved'" theme="primary" @click="$emit('renewal-clerk-sync', row._raw)">同步新保单</t-link>
            <t-link v-if="isClerk && row.status === 'renew_insurer_rejected'" theme="primary" @click="$emit('renewal-init-supplement', row._raw)">发起补充请求</t-link>
            <t-link v-if="isClerk && row.status === 'renew_clerk_resubmit'" theme="primary" @click="$emit('renewal-clerk-resubmit', row._raw)">提交续保申请</t-link>
            <t-link v-if="isClerk && row.status === 'renew_payment_verified'" theme="primary" @click="$emit('renewal-sync-payment', row._raw)">同步缴费凭证</t-link>

            <t-link v-if="isCustomer && row.status === 'renew_customer_supplement'" theme="primary" @click="$emit('renewal-customer-supplement', row._raw)">补充材料</t-link>
            <t-link v-if="isCustomer && row.status === 'renew_customer_supplemented'" theme="primary" @click="$emit('renewal-customer-push', row._raw)">推送平台审核</t-link>
            <t-link v-if="isCustomer && row.status === 'renew_pending_payment'" theme="primary" @click="$emit('renewal-upload-voucher', row._raw)">上传缴费凭证</t-link>
          </template>
          <template v-if="row.type === 'surrender'">
            <t-link v-if="isCustomer && row.status === 'sr_platform_synced'" theme="primary" @click="$emit('surrender-confirm-refund', row._raw)">确认退款</t-link>
            <t-link v-if="isCustomer && row.status === 'sr_customer_supplement'" theme="primary" @click="$emit('surrender-customer-supplement', row._raw)">补充材料</t-link>

            <t-link v-if="isInkasso && row.status === 'sr_platform_review' && !row._raw?.generatedDocs?.length" theme="primary" @click="$emit('surrender-gen-docs', row._raw)">生成退保申请表</t-link>
            <t-link v-if="isInkasso && row.status === 'sr_platform_review' && row._raw?.generatedDocs?.length" theme="primary" @click="$emit('surrender-push-clerk', row._raw)">推送给跟单员</t-link>
            <t-link v-if="isInkasso && row.status === 'sr_supplement'" theme="primary" @click="$emit('surrender-platform-supplement', row._raw)">补充材料</t-link>

            <t-link v-if="isClerk && row.status === 'sr_clerk_review'" theme="success" @click="$emit('surrender-clerk-approve', row._raw)">审核通过</t-link>
            <t-link v-if="isClerk && row.status === 'sr_clerk_review'" theme="danger" @click="$emit('surrender-clerk-reject', row._raw)">驳回</t-link>
            <t-link v-if="isClerk && row.status === 'sr_insurer_review'" theme="success" @click="$emit('surrender-insurer-approve', row._raw)">保险公司批准</t-link>
            <t-link v-if="isClerk && row.status === 'sr_insurer_review'" theme="danger" @click="$emit('surrender-insurer-reject', row._raw)">保险公司驳回</t-link>
            <t-link v-if="isClerk && row.status === 'sr_insurer_approved'" theme="primary" @click="$emit('surrender-initiate-payment', row._raw)">发起退款</t-link>
            <t-link v-if="isClerk && row.status === 'sr_payment_initiated'" theme="primary" @click="$emit('surrender-sync-platform', row._raw)">同步平台</t-link>
            <t-link v-if="isClerk && row.status === 'sr_insurer_rejected'" theme="primary" @click="$emit('surrender-init-supplement', row._raw)">发起补充请求</t-link>
            <t-link v-if="isClerk && row.status === 'sr_insurer_rejected'" theme="danger" @click="$emit('surrender-terminate', row._raw)">退保终止</t-link>
          </template>
          <template v-if="row.type === 'change'">
            <t-link v-if="isCustomer && row.status === 'chg_draft'" theme="primary" @click="$emit('change-edit', row._raw)">编辑</t-link>
            <t-link v-if="isCustomer && row.status === 'chg_draft'" theme="primary" @click="$emit('change-submit-platform', row._raw)">提交平台审核</t-link>
            <t-link v-if="isCustomer && row.status === 'chg_insurer_approved'" theme="primary" @click="$emit('change-gen-endorsement', row._raw)">生成批单</t-link>
            <t-link v-if="isCustomer && (row.status === 'chg_supplement' || row.status === 'chg_platform_supplemented')" theme="primary" @click="$emit('change-customer-supplement', row._raw)">补充材料</t-link>
            <t-link v-if="isCustomer && row.status === 'chg_customer_supplement'" theme="primary" @click="$emit('change-resubmit-platform', row._raw)">推送平台审核</t-link>

            <t-link v-if="isInkasso && row.status === 'chg_platform_review' && !row._raw?.generatedChangeForm?.length" theme="primary" @click="$emit('change-gen-docs', row._raw)">生成变更申请表</t-link>
            <t-link v-if="isInkasso && row.status === 'chg_platform_review' && row._raw?.generatedChangeForm?.length && !row._raw?.rejectReason" theme="primary" @click="$emit('change-push-clerk', row._raw)">推送给跟单员</t-link>
            <t-link v-if="isInkasso && row.status === 'chg_platform_review' && row._raw?.rejectReason" theme="primary" @click="$emit('change-push-supplement', row._raw)">推送客户补充</t-link>
            <t-link v-if="isInkasso && row.status === 'chg_supplement'" theme="primary" @click="$emit('change-platform-supplement', row._raw)">补充材料</t-link>

            <t-link v-if="isClerk && row.status === 'chg_clerk_review'" theme="success" @click="$emit('change-clerk-approve', row._raw)">审核通过</t-link>
            <t-link v-if="isClerk && row.status === 'chg_clerk_review'" theme="danger" @click="$emit('change-clerk-reject', row._raw)">驳回</t-link>
            <t-link v-if="isClerk && row.status === 'chg_insurer_review'" theme="success" @click="$emit('change-insurer-approve', row._raw)">保险公司批准</t-link>
            <t-link v-if="isClerk && row.status === 'chg_insurer_review'" theme="danger" @click="$emit('change-insurer-reject', row._raw)">保险公司驳回</t-link>
            <t-link v-if="isClerk && row.status === 'chg_insurer_approved'" theme="primary" @click="$emit('change-clerk-record', row._raw)">录入变更记录</t-link>
            <t-link v-if="isClerk && row.status === 'chg_insurer_approved'" theme="primary" @click="$emit('change-sync-platform', row._raw)">同步平台</t-link>
            <t-link v-if="isClerk && row.status === 'chg_insurer_rejected'" theme="primary" @click="$emit('change-init-supplement', row._raw)">发起补充请求</t-link>
          </template>
          <template v-if="row.type === 'external'">
            <t-link v-if="isCustomer && row.status === 'draft'" theme="primary" @click="$emit('external-submit-platform', row._raw)">提交平台审核</t-link>
            <t-link v-if="isInkasso && row.status === 'platform_review'" theme="primary" @click="$emit('external-ocr', row._raw)">OCR识别</t-link>
            <t-link v-if="isClerk && row.status === 'clerk_review'" theme="success" @click="$emit('external-clerk-approve', row._raw)">审核通过</t-link>
          </template>
          <template v-if="row.type === 'insurance'">
            <t-link v-if="isInkasso && (row.status === 'pending_review' || row.status === 'ocr_pending')" theme="primary" @click="$emit('insurance-submit-clerk', row._raw)">申请跟单员确认</t-link>
            <t-link v-if="isClerk && (row.status === 'clerk_review' || row.status === 'ocr_clerk_review' || row.status === 'ocr_pending')" theme="primary" @click="$emit('insurance-clerk-approve', row._raw)">审核</t-link>
            <t-link v-if="isClerk && row.status === 'approved'" theme="primary" @click="$emit('insurance-submit-uw', row._raw)">提交核保</t-link>
            <t-link v-if="isClerk && row.status === 'underwriting'" theme="primary" @click="$emit('insurance-uw-complete', row._raw)">核保通过</t-link>
            <t-link v-if="isClerk && row.status === 'uw_completed'" theme="primary" @click="$emit('insurance-sync-platform', row._raw)">同步保单</t-link>
            <t-link v-if="isCustomer && row.status === 'rejected'" theme="primary" @click="$emit('insurance-resubmit', row._raw)">重新提交</t-link>
          </template>
        </t-space>
      </template>
    </t-table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import StatusTag from '@/components/common/StatusTag.vue'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  }
})

defineEmits([
  'view',
  // Renewal events
  'renewal-gen-docs', 'renewal-push-clerk', 'renewal-push-supplement',
  'renewal-approve-supplement', 'renewal-payment', 'renewal-verify-voucher',
  'renewal-clerk-approve', 'renewal-clerk-reject',
  'renewal-insurer-approve', 'renewal-insurer-reject',
  'renewal-clerk-sync', 'renewal-init-supplement',
  'renewal-clerk-resubmit', 'renewal-sync-payment',
  'renewal-customer-supplement', 'renewal-customer-push',
  'renewal-upload-voucher',
  // Surrender events
  'surrender-confirm-refund', 'surrender-customer-supplement',
  'surrender-gen-docs', 'surrender-push-clerk',
  'surrender-platform-supplement',
  'surrender-clerk-approve', 'surrender-clerk-reject',
  'surrender-insurer-approve', 'surrender-insurer-reject',
  'surrender-initiate-payment', 'surrender-sync-platform',
  'surrender-init-supplement', 'surrender-terminate',
  // Change events
  'change-edit', 'change-submit-platform', 'change-gen-endorsement',
  'change-customer-supplement', 'change-resubmit-platform',
  'change-gen-docs', 'change-push-clerk', 'change-push-supplement',
  'change-platform-supplement',
  'change-clerk-approve', 'change-clerk-reject',
  'change-insurer-approve', 'change-insurer-reject',
  'change-clerk-record', 'change-sync-platform',
  'change-init-supplement',
  // External events
  'external-submit-platform', 'external-ocr', 'external-clerk-approve',
  // Insurance events
  'insurance-submit-clerk', 'insurance-clerk-approve',
  'insurance-submit-uw', 'insurance-uw-complete',
  'insurance-sync-platform', 'insurance-resubmit'
])

const userStore = useUserStore()
const isInkasso = computed(() => userStore.role === 'inkasso')
const isClerk = computed(() => userStore.role === 'clerk')
const isCustomer = computed(() => userStore.role === 'customer')

const columns = [
  { colKey: 'type', title: '类型', width: 80, slot: 'type' },
  { colKey: 'policyNo', title: '保单号', width: 150 },
  { colKey: 'id', title: '申请编号', width: 150 },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'applicationDate', title: '申请日期', width: 120 },
  { colKey: 'operation', title: '操作', width: 200, fixed: 'right', slot: 'operation' }
]

const typeTheme = (type) => {
  const map = { change: 'warning', renewal: 'primary', surrender: 'danger', external: 'success', insurance: 'default' }
  return map[type] || 'default'
}

const typeLabel = (type) => {
  const map = { change: '变更', renewal: '续保', surrender: '退保', external: '电子保单', insurance: '投保' }
  return map[type] || type
}
</script>

<style lang="scss" scoped>
.sub-records-panel {
  background: #fafbfc;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .panel-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  .panel-count {
    font-size: 12px;
    color: #999;
  }
}
</style>
