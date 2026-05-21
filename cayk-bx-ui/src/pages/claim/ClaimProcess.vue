<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/claim/list">理赔管理</t-breadcrumb-item>
        <t-breadcrumb-item>理赔流程管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>

    <div class="page-header">
      <div class="page-title-wp">
        <div class="page-title">理赔流程管理</div>
        <t-tag v-if="activeTab === 'process' && currentClaim" theme="primary" variant="light" size="small">
          进行中 (单号: {{ currentClaim.claimNo }})
        </t-tag>
      </div>
      <div v-if="currentClaim" class="claim-info">
        关联保单：<span class="policy-no">{{ currentClaim.relatedPolicyNo }}</span>
      </div>
    </div>

    <t-tabs v-slot="{ value }" v-model="activeTab" size="large">
      <!-- Process Management Tab -->
      <t-tab-panel value="process" label="流程管理">
        <div v-if="!currentClaim" class="no-claim-wp">
          <t-card class="no-claim-card">
            <div class="no-claim-content">
              <t-icon name="info-circle" size="48px" class="no-claim-icon" />
              <div class="no-claim-title">暂未加载理赔案件</div>
              <div class="no-claim-desc">请先到“理赔案件列表”选择需要处理的案件，或点击下方加载默认演示案件。</div>
              <t-button theme="primary" class="mt-16" @click="loadDefaultClaim">加载默认案件</t-button>
            </div>
          </t-card>
        </div>

        <div v-else>
          <!-- 5-Step Stepper -->
          <div class="flow-progress">
            <div class="flow-steps">
              <template v-for="(step, index) in stepOptions" :key="step.value">
                <div class="flow-step-col">
                  <div
                    class="flow-step-dot"
                    :class="{ completed: index + 1 < currentStep, active: index + 1 === currentStep }"
                    @click="setStep(index + 1)"
                  >
                    <span v-if="index + 1 < currentStep" class="flow-step-check">✓</span>
                    <span v-else class="flow-step-num">{{ index + 1 }}</span>
                  </div>
                  <div class="flow-step-label" :class="{ active: index + 1 === currentStep, completed: index + 1 < currentStep }">
                    {{ step.label }}
                  </div>
                  <div class="flow-step-status">
                    <t-tag v-if="index + 1 < currentStep" theme="success" variant="light" size="small">已完成</t-tag>
                    <t-tag v-else-if="index + 1 === currentStep" theme="primary" variant="light" size="small">进行中</t-tag>
                    <t-tag v-else theme="default" variant="light" size="small">待处理</t-tag>
                  </div>
                </div>
                <div v-if="index < stepOptions.length - 1" class="flow-arrow" :class="{ completed: index + 1 < currentStep }">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </template>
            </div>
          </div>

          <!-- Dynamic Timeline Steps -->
          <div class="flow-timeline">
            <div class="timeline-title-bar">
              <span class="timeline-title">理赔阶段审核详情</span>
              <span class="timeline-hint">点击步骤标题可展开/收起详情</span>
            </div>

            <!-- Step 1: 报案提交 -->
            <div class="timeline-node" :class="getStepNodeClass(1)">
              <div class="node-header" @click="toggleCollapse(0)">
                <div class="node-marker">
                  <span v-if="1 < currentStep" class="node-check">✓</span>
                  <span v-else-if="1 === currentStep" class="node-dot"></span>
                  <span v-else class="node-pending-dot"></span>
                </div>
                <div class="node-info">
                  <div class="node-title">
                    <span class="node-step-num">Step 1</span>
                    <span class="node-step-name">报案提交与OCR识别</span>
                    <t-tag theme="default" variant="light" size="small" class="role-tag">客户</t-tag>
                    <span class="node-handler">处理人：{{ currentClaim.claimContact }}</span>
                  </div>
                  <div class="node-meta">
                    <span class="meta-status" :class="'status-' + getStepStatusText(1)">{{ getStepStatusText(1) }}</span>
                    <span class="meta-time">报案时间：{{ currentClaim.createTime }}</span>
                  </div>
                </div>
                <div class="node-toggle">
                  <t-icon :name="expandedSteps[0] ? 'chevron-up' : 'chevron-down'" class="toggle-icon" />
                </div>
              </div>

              <div v-show="expandedSteps[0]" class="node-body">
                <div class="node-content">
                  <div class="card-grid mb-16">
                    <div class="info-item"><span class="info-label">出险买方：</span><span class="info-val font-semibold">{{ currentClaim.buyerName }}</span></div>
                    <div class="info-item"><span class="info-label">理赔类型：</span><span class="info-val">{{ currentClaim.claimTypeName }}</span></div>
                    <div class="info-item"><span class="info-label">出险日期：</span><span class="info-val">{{ currentClaim.lossDate }}</span></div>
                    <div class="info-item"><span class="info-label">预估损失：</span><span class="info-val text-primary font-bold">${{ Number(currentClaim.estimatedLossAmount).toLocaleString() }} {{ currentClaim.lossCurrency }}</span></div>
                  </div>

                  <div class="ocr-section-title">📁 贸易证明单据上传与 OCR 智能匹配校验</div>

                  <t-form label-align="top" class="mb-16">
                    <t-row :gutter="16">
                      <t-col :span="6">
                        <t-form-item label="贸易合同">
                          <t-upload v-model="ocrDocs.tradeContract" theme="file" accept=".pdf,.jpg,.png" :auto-upload="false" :max="3">
                            <t-button variant="outline" size="small">选择文件</t-button>
                          </t-upload>
                        </t-form-item>
                      </t-col>
                      <t-col :span="6">
                        <t-form-item label="商业发票">
                          <t-upload v-model="ocrDocs.commercialInvoice" theme="file" accept=".pdf,.jpg,.png" :auto-upload="false" :max="5">
                            <t-button variant="outline" size="small">选择文件</t-button>
                          </t-upload>
                        </t-form-item>
                      </t-col>
                    </t-row>
                    <t-row :gutter="16">
                      <t-col :span="6">
                        <t-form-item label="提单/运单">
                          <t-upload v-model="ocrDocs.billOfLading" theme="file" accept=".pdf,.jpg,.png" :auto-upload="false" :max="3">
                            <t-button variant="outline" size="small">选择文件</t-button>
                          </t-upload>
                        </t-form-item>
                      </t-col>
                      <t-col :span="6">
                        <t-form-item label="出口报关单">
                          <t-upload v-model="ocrDocs.customsDeclaration" theme="file" accept=".pdf,.jpg,.png" :auto-upload="false" :max="3">
                            <t-button variant="outline" size="small">选择文件</t-button>
                          </t-upload>
                        </t-form-item>
                      </t-col>
                    </t-row>
                    <t-row :gutter="16">
                      <t-col :span="6">
                        <t-form-item label="损失证明">
                          <t-upload v-model="ocrDocs.lossProof" theme="file" accept=".pdf,.jpg,.png" :auto-upload="false" :max="3">
                            <t-button variant="outline" size="small">选择文件</t-button>
                          </t-upload>
                        </t-form-item>
                      </t-col>
                      <t-col :span="6">
                        <t-form-item label="追偿授权书">
                          <t-upload v-model="ocrDocs.recourseAuth" theme="file" accept=".pdf,.jpg,.png" :auto-upload="false" :max="1">
                            <t-button variant="outline" size="small">选择文件</t-button>
                          </t-upload>
                        </t-form-item>
                      </t-col>
                    </t-row>
                  </t-form>

                  <div v-if="isScanning" class="ocr-progress-wp mb-16">
                    <div class="progress-txt">OCR单证数据一致性校验中... {{ scanProgress }}%</div>
                    <t-progress theme="line" :percentage="scanProgress" status="active" />
                  </div>

                  <div v-if="scanSuccess" class="ocr-result-wp mb-16">
                    <t-alert theme="success" title="OCR 识别匹配成功" message="[智能校验结论]：合同号、发票金额、收货人与本案申报信息 100% 结构化一致，未检出关联交易风险。" />
                  </div>

                  <div class="ocr-actions">
                    <t-button variant="outline" :loading="isScanning" :disabled="scanSuccess" @click="startOCRScan">
                      <template #icon><t-icon name="search" /></template>
                      启动理赔单证 OCR 识别校验
                    </t-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 2: 跟单接单 -->
            <div class="timeline-node" :class="getStepNodeClass(2)">
              <div class="node-header" @click="toggleCollapse(1)">
                <div class="node-marker">
                  <span v-if="2 < currentStep" class="node-check">✓</span>
                  <span v-else-if="2 === currentStep" class="node-dot"></span>
                  <span v-else class="node-pending-dot"></span>
                </div>
                <div class="node-info">
                  <div class="node-title">
                    <span class="node-step-num">Step 2</span>
                    <span class="node-step-name">跟单自动派单与时限预警</span>
                    <t-tag theme="primary" variant="light" size="small" class="role-tag">跟单员</t-tag>
                    <span class="node-handler">处理人：跟单员李明 (C001)</span>
                  </div>
                  <div class="node-meta">
                    <span class="meta-status" :class="'status-' + getStepStatusText(2)">{{ getStepStatusText(2) }}</span>
                    <span v-if="2 <= currentStep" class="meta-time">分派时间：{{ currentClaim.createTime }}</span>
                  </div>
                </div>
                <div class="node-toggle">
                  <t-icon :name="expandedSteps[1] ? 'chevron-up' : 'chevron-down'" class="toggle-icon" />
                </div>
              </div>

              <div v-show="expandedSteps[1]" class="node-body">
                <div class="node-content">
                  <div class="alert-box-warn mb-16">
                    <div class="warning-title">⌛ 报案时限预警监测</div>
                    <div class="warning-desc">对应保险公司规则：{{ currentClaim.reportDeadline }}。</div>
                    <div class="warning-countdown">
                      理赔报案截止死线倒计时：<t-tag theme="success" variant="light" class="mr-8">剩余 18 天</t-tag>
                      时限状态检测：<t-tag theme="success">安全 🟢</t-tag>
                    </div>
                  </div>

                  <div class="card-grid">
                    <div class="info-item"><span class="info-label">承接跟单员：</span><span class="info-val">李明 (业务部一队)</span></div>
                    <div class="info-item"><span class="info-label">当前负载：</span><span class="info-val">3 个处理中理赔案件 (正常)</span></div>
                    <div class="info-item"><span class="info-label">派单模式：</span><span class="info-val">专属客户经理自动分派</span></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 3: 审核补件 -->
            <div class="timeline-node" :class="getStepNodeClass(3)">
              <div class="node-header" @click="toggleCollapse(2)">
                <div class="node-marker">
                  <span v-if="3 < currentStep" class="node-check">✓</span>
                  <span v-else-if="3 === currentStep" class="node-dot"></span>
                  <span v-else class="node-pending-dot"></span>
                </div>
                <div class="node-info">
                  <div class="node-title">
                    <span class="node-step-num">Step 3</span>
                    <span class="node-step-name">委托书盖章与代理服务费缴纳</span>
                    <t-tag theme="primary" variant="light" size="small" class="role-tag">跟单员</t-tag>
                    <span class="node-handler">处理人：跟单员李明 (C001)</span>
                  </div>
                  <div class="node-meta">
                    <span class="meta-status" :class="'status-' + getStepStatusText(3)">{{ getStepStatusText(3) }}</span>
                    <span v-if="3 < currentStep" class="meta-time">提交核保时间：2026-05-21 10:20:00</span>
                  </div>
                </div>
                <div class="node-toggle">
                  <t-icon :name="expandedSteps[2] ? 'chevron-up' : 'chevron-down'" class="toggle-icon" />
                </div>
              </div>

              <div v-show="expandedSteps[2]" class="node-body">
                <div class="node-content">
                  <t-alert theme="info" class="mb-16">
                    <template #message>
                      由于涉及海外大额贸易风险催收，需签署正式《理赔代理委托授权书》授权长银平台，并缴纳理赔代理服务费。
                    </template>
                  </t-alert>

                  <div class="row-flex mb-16">
                    <div class="flex-1 mr-16">
                      <div class="sub-card">
                        <div class="sub-card-title">✍️ 平台理赔委托书签署</div>
                        <div class="sign-status mb-12">
                          签署状态：<t-tag theme="success" variant="light">已盖章上传</t-tag>
                        </div>
                        <div class="file-wp mb-12">
                          <t-icon name="file" size="20px" />
                          <span class="file-name font-12 ml-4">理赔委托授权书_深圳XX国贸_盖章.pdf</span>
                        </div>
                        <t-space>
                          <t-button variant="outline" size="small">📥 下载模板</t-button>
                          <t-button variant="outline" size="small">📤 重新上传</t-button>
                        </t-space>
                      </div>
                    </div>
                    <div class="flex-1">
                      <div class="sub-card">
                        <div class="sub-card-title">💳 理赔代理服务费收取 (费率 0.5%)</div>
                        <div class="fee-row mb-8">
                          预估代理费：<span class="fee-amount">${{ (currentClaim.estimatedLossAmount * 0.005).toFixed(2) }} USD</span>
                        </div>
                        <div class="fee-row mb-12">
                          缴纳状态：
                          <t-tag v-if="serviceFeePaid" theme="success" variant="light">已缴费 ✅</t-tag>
                          <t-tag v-else theme="danger" variant="light">未缴费 ❌</t-tag>
                        </div>
                        <t-button v-if="!serviceFeePaid" theme="primary" size="small" @click="showPaymentDialog">
                          💳 扫码支付代理服务费
                        </t-button>
                        <div v-else class="file-wp font-12">
                          <t-icon name="check-circle" class="text-success" />
                          <span class="ml-4 text-success">已关联银行到账水单: PAY_CL2026.jpg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 4: 调查定损 -->
            <div class="timeline-node" :class="getStepNodeClass(4)">
              <div class="node-header" @click="toggleCollapse(3)">
                <div class="node-marker">
                  <span v-if="4 < currentStep" class="node-check">✓</span>
                  <span v-else-if="4 === currentStep" class="node-dot"></span>
                  <span v-else class="node-pending-dot"></span>
                </div>
                <div class="node-info">
                  <div class="node-title">
                    <span class="node-step-num">Step 4</span>
                    <span class="node-step-name">保险公司海外调查与定损决定</span>
                    <t-tag theme="warning" variant="light" size="small" class="role-tag">保险公司</t-tag>
                    <span class="node-handler">处理人：{{ currentClaim.insuranceCompany }}理赔核算员</span>
                  </div>
                  <div class="node-meta">
                    <span class="meta-status" :class="'status-' + getStepStatusText(4)">{{ getStepStatusText(4) }}</span>
                    <span v-if="4 < currentStep" class="meta-time">出具定损函时间：2026-05-21 11:30:00</span>
                  </div>
                </div>
                <div class="node-toggle">
                  <t-icon :name="expandedSteps[3] ? 'chevron-up' : 'chevron-down'" class="toggle-icon" />
                </div>
              </div>

              <div v-show="expandedSteps[3]" class="node-body">
                <div class="node-content">
                  <div class="alert-box mb-16">
                    <strong>承保条款参考</strong>：约定赔偿比例：<strong>80%</strong>，预计最高赔付：${{ (currentClaim.estimatedLossAmount * 0.8).toLocaleString() }} USD。
                  </div>

                  <div class="form-title">📝 保险公司定损决定录入</div>
                  <t-form label-align="top" class="mb-16">
                    <t-row :gutter="16">
                      <t-col :span="4">
                        <t-form-item label="定损结论">
                          <t-select v-model="claimDecision">
                            <t-option value="approved" label="同意赔付 (Approved)" />
                            <t-option value="partial" label="部分赔付 (Partially Approved)" />
                            <t-option value="rejected" label="拒绝赔付 (Rejected)" />
                          </t-select>
                        </t-form-item>
                      </t-col>
                      <t-col :span="4">
                        <t-form-item label="核定损失金额 (USD)">
                          <t-input-number v-model="calculatedLoss" :min="0" style="width: 100%" />
                        </t-form-item>
                      </t-col>
                      <t-col :span="4">
                        <t-form-item label="免赔额金额 (USD)">
                          <t-input-number v-model="deductibleAmount" :min="0" style="width: 100%" />
                        </t-form-item>
                      </t-col>
                    </t-row>

                    <div class="final-calc-wp mt-12 mb-12">
                      <span class="calc-label">最终赔付金额公式：</span>
                      <span class="calc-formula">损失额 (${{ calculatedLoss.toLocaleString() }}) × 赔付率 (80%) - 免赔额 (${{ deductibleAmount.toLocaleString() }}) = </span>
                      <span class="calc-result">${{ finalCompensatedAmount.toLocaleString() }} USD</span>
                    </div>

                    <t-form-item label="官方理赔定损通知书上传">
                      <t-upload theme="file" accept=".pdf,.png,.jpg" :auto-upload="false" />
                    </t-form-item>
                  </t-form>
                </div>
              </div>
            </div>

            <!-- Step 5: 理赔收回 -->
            <div class="timeline-node" :class="getStepNodeClass(5)">
              <div class="node-header" @click="toggleCollapse(4)">
                <div class="node-marker">
                  <span v-if="5 < currentStep" class="node-check">✓</span>
                  <span v-else-if="5 === currentStep" class="node-dot"></span>
                  <span class="node-pending-dot"></span>
                </div>
                <div class="node-info">
                  <div class="node-title">
                    <span class="node-step-num">Step 5</span>
                    <span class="node-step-name">赔款划拨收回与 RWA 金融清算</span>
                    <t-tag theme="primary" variant="light" size="small" class="role-tag">跟单员</t-tag>
                    <span class="node-handler">处理人：跟单员李明 (C001)</span>
                  </div>
                  <div class="node-meta">
                    <span class="meta-status" :class="'status-' + getStepStatusText(5)">{{ getStepStatusText(5) }}</span>
                    <span v-if="rwaSyncStatus === 'synced'" class="meta-time">RWA销账清算时间：2026-05-21 11:45:00</span>
                  </div>
                </div>
                <div class="node-toggle">
                  <t-icon :name="expandedSteps[4] ? 'chevron-up' : 'chevron-down'" class="toggle-icon" />
                </div>
              </div>

              <div v-show="expandedSteps[4]" class="node-body">
                <div class="node-content">
                  <t-alert theme="warning" class="mb-16">
                    <template #message>
                      收到保险公司理赔款项后，请录入收款银行明细并一键同步清算 RWA 融资资产大屏，进行销账冲账。
                    </template>
                  </t-alert>

                  <t-form label-align="top" class="mb-16">
                    <t-row :gutter="16">
                      <t-col :span="6">
                        <t-form-item label="理赔收款到账银行">
                          <t-input v-model="receivingBank" placeholder="请输入到账银行及分行名称" />
                        </t-form-item>
                      </t-col>
                      <t-col :span="6">
                        <t-form-item label="到账参考号/收款水单上传">
                          <t-upload theme="file" accept=".jpg,.png,.pdf" :auto-upload="false" />
                        </t-form-item>
                      </t-col>
                    </t-row>
                  </t-form>

                  <div class="rwa-sync-panel">
                    <div class="rwa-sync-status mb-16">
                      RWA 平台清算销账状态：
                      <t-tag v-if="rwaSyncStatus === 'synced'" theme="success" variant="light">已完成清算销账 ✅</t-tag>
                      <t-tag v-else theme="warning" variant="light">等待金融同步 ⏳</t-tag>
                    </div>
                    <t-button theme="warning" :loading="isSyncingRwa" :disabled="rwaSyncStatus === 'synced'" @click="syncToRwaPlatform">
                      <template #icon><t-icon name="refresh" /></template>
                      一键同步并清算 RWA 金融资产融资平台
                    </t-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Approval Decisions Card -->
          <div class="approval-card mt-24 mb-24">
            <div class="approval-title">✍️ 长安银科跟单员审核结论</div>
            <t-form label-align="left" label-width="100px">
              <t-form-item label="审批结论">
                <t-radio-group v-model="approvalDecision">
                  <t-radio value="approved">通过，提交进入下一阶段</t-radio>
                  <t-radio value="rejected">退回修改/驳回申请</t-radio>
                </t-radio-group>
              </t-form-item>
              <t-form-item label="审批意见">
                <t-textarea v-model="approvalOpinion" placeholder="请输入审核意见（必填）" :autosize="{ minRows: 3 }" />
              </t-form-item>
            </t-form>
          </div>

          <!-- Bottom Nav buttons -->
          <div class="bottom-actions">
            <t-space>
              <t-button variant="outline" :disabled="currentStep === 1" @click="prevStep">上一步</t-button>
              <t-button v-if="currentStep < 5" theme="primary" :loading="isSubmitting" @click="submitStep">
                下一步
              </t-button>
              <t-button v-else theme="success" :loading="isSubmitting" @click="completeWorkflow">
                确认理赔结案
              </t-button>
            </t-space>
          </div>
        </div>
      </t-tab-panel>

      <!-- Claims Cases List Tab -->
      <t-tab-panel value="task-list" label="理赔案件列表">
        <t-card class="mb-16">
          <div class="section-header">
            <span class="section-title">🔍 快速筛选与检索</span>
          </div>
          <t-form layout="inline" label-width="80px">
            <t-form-item label="理赔单号">
              <t-input v-model="filters.claimNo" placeholder="理赔单号" />
            </t-form-item>
            <t-form-item label="关联保单">
              <t-input v-model="filters.relatedPolicyNo" placeholder="关联保单号" />
            </t-form-item>
            <t-form-item label="理赔状态">
              <t-select v-model="filters.status" placeholder="全部状态" style="width: 150px">
                <t-option value="all" label="全部状态" />
                <t-option value="pending" label="待处理" />
                <t-option value="supplement" label="补充材料" />
                <t-option value="processing" label="处理中" />
                <t-option value="decided" label="已决定" />
                <t-option value="completed" label="已完成" />
              </t-select>
            </t-form-item>
            <t-form-item>
              <t-button theme="primary" @click="searchClaims">查询</t-button>
              <t-button variant="outline" class="ml-8" @click="resetFilters">重置</t-button>
            </t-form-item>
          </t-form>
        </t-card>

        <t-card>
          <div class="table-header">
            <span class="table-title">理赔案件列表</span>
            <span class="table-count">共 {{ filteredClaims.length }} 条记录</span>
          </div>
          <t-table :data="filteredClaims" :columns="columns" row-key="id" hover stripe>
            <template #status="{ row }">
              <status-tag :status="row.status" :status-map="statusMap" />
            </template>
            <template #currentStep="{ row }">
              <t-tag :theme="getStepTheme(row.currentStep || 3)">{{ getStepName(row.currentStep || 3) }}</t-tag>
            </template>
            <template #estimatedLossAmount="{ row }">
              <span>${{ Number(row.estimatedLossAmount).toLocaleString() }} {{ row.lossCurrency }}</span>
            </template>
            <template #operation="{ row }">
              <t-space>
                <t-link theme="primary" @click="handleView(row)">查看</t-link>
                <t-link theme="warning" @click="startProcessing(row)">处理</t-link>
              </t-space>
            </template>
          </t-table>
        </t-card>
      </t-tab-panel>
    </t-tabs>

    <!-- Payment QR Code Modal -->
    <t-dialog v-model:visible="paymentDialogVisible" header="代理费在线支付网关" width="400px" @confirm="confirmPayment">
      <div class="payment-modal-content">
        <div class="payment-title">支付理赔代理服务费 (长银信托清算)</div>
        <div class="payment-fee">${{ currentClaim ? (currentClaim.estimatedLossAmount * 0.005).toFixed(2) : '0.00' }} USD</div>
        <div class="payment-qr-wp">
          <!-- Mock QR Code -->
          <div class="qr-mock">
            <div class="qr-box">
              <div class="qr-corner top-left"></div>
              <div class="qr-corner top-right"></div>
              <div class="qr-corner bottom-left"></div>
              <div class="qr-corner bottom-right"></div>
              <div class="qr-inner">QR CODE</div>
            </div>
          </div>
        </div>
        <div class="payment-note">请使用企业数字钱包或网银扫码支付</div>
      </div>
    </t-dialog>

    <!-- Claim Detail View Dialog -->
    <t-dialog v-model:visible="detailVisible" header="理赔案件审计日志与详情" width="750px" :footer="false">
      <div style="max-height: 600px; overflow-y: auto; padding-right: 8px;">
        <div v-if="currentRow">
          <detail-panel title="理赔基本账单" :columns="detailColumns" :data="currentRow" />
          <t-divider />
          <div class="timeline-log-title mb-16">📜 理赔阶段执行日志历史</div>
          <t-steps :current="currentRow.currentStep || 3" layout="vertical" status="process">
            <t-step-item title="报案提交与OCR验证" :content="`时间: ${currentRow.createTime} | 匹配率: 100%一致 | 处理人: ${currentRow.claimContact}`" />
            <t-step-item title="跟单派单与时限校验" :content="`跟单员: 李明 (C001) | 时限状态: 正常绿色标签`" />
            <t-step-item title="委托书盖章与收费" :content="`委托协议已签署 | 理赔代理费: 已通过网关实缴`" />
            <t-step-item title="调查核赔与定损" :content="`损失金额核定中 | 约定比例: 80%`" />
            <t-step-item title="到账清算与RWA销账" :content="`完成赔付清算与资产融资清算`" />
          </t-steps>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useBusinessStore } from '@/stores/business'
import { useUserStore } from '@/stores/user'
import { MessagePlugin } from 'tdesign-vue-next'
import StatusTag from '@/components/common/StatusTag.vue'
import DetailPanel from '@/components/common/DetailPanel.vue'

const store = useBusinessStore()
const userStore = useUserStore()
const activeTab = ref('process')
const currentStep = ref(3)
const currentClaim = ref(null)

const expandedSteps = ref([true, true, true, false, false])
const approvalDecision = ref('approved')
const approvalOpinion = ref('资料审查无误，企业已全额交纳代理服务费，授权盖章完整，准予向保险公司提报正式理赔卷宗。')

// Step Forms State Variables
const isScanning = ref(false)
const scanProgress = ref(0)
const scanSuccess = ref(false)

const ocrDocs = reactive({
  tradeContract: [],
  commercialInvoice: [],
  billOfLading: [],
  customsDeclaration: [],
  lossProof: [],
  recourseAuth: []
})

const serviceFeePaid = ref(true)
const paymentDialogVisible = ref(false)

const claimDecision = ref('approved')
const calculatedLoss = ref(80000)
const deductibleAmount = ref(2000)
const receivingBank = ref('中国工商银行 深圳科苑支行')

const isSubmitting = ref(false)
const isSyncingRwa = ref(false)
const rwaSyncStatus = ref('pending')

// Table filter filters
const filters = reactive({
  claimNo: '',
  relatedPolicyNo: '',
  status: 'all'
})

// Auto calculate final claim amount
const finalCompensatedAmount = computed(() => {
  if (claimDecision.value === 'rejected') return 0
  const rate = 0.8 // 80% claim ratio
  const amount = calculatedLoss.value * rate - deductibleAmount.value
  return amount > 0 ? amount : 0
})

const stepOptions = [
  { value: 1, label: '报案提交' },
  { value: 2, label: '跟单接单' },
  { value: 3, label: '审核补件' },
  { value: 4, label: '调查定损' },
  { value: 5, label: '理赔收回' }
]

const stepRoles = [
  { role: 'client', label: '客户' },
  { role: 'clerk', label: '跟单员' },
  { role: 'clerk', label: '跟单员' },
  { role: 'insurer', label: '保险公司' },
  { role: 'clerk', label: '跟单员' }
]

const statusMap = {
  pending: '待处理',
  processing: '处理中',
  investigating: '调查中',
  supplement: '补充材料',
  decided: '已决定',
  completed: '已完成',
  rejected: '已拒赔'
}

const columns = [
  { colKey: 'claimNo', title: '理赔单号', width: 140 },
  { colKey: 'insuranceCompany', title: '保险公司', width: 100 },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'claimTypeName', title: '报案类型', width: 100 },
  { colKey: 'estimatedLossAmount', title: '预估损失', align: 'right', width: 120, slot: 'estimatedLossAmount' },
  { colKey: 'currentStep', title: '当前阶段', width: 100, slot: 'currentStep' },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'createTime', title: '报案时间', width: 160 },
  { colKey: 'operation', title: '操作', width: 120, fixed: 'right', slot: 'operation' }
]

const detailColumns = [
  { label: '理赔单号', key: 'claimNo' },
  { label: '关联保单', key: 'relatedPolicyNo' },
  { label: '保险公司', key: 'insuranceCompany' },
  { label: '买方名称', key: 'buyerName' },
  { label: '理赔类型', key: 'claimTypeName' },
  { label: '损失发生日', key: 'lossDate' },
  { label: '报案立案时间', key: 'createTime' },
  { label: '预估损失', key: 'estimatedLossAmount', formatter: (v) => `$${Number(v).toLocaleString()}` },
  { label: '赔付币种', key: 'lossCurrency' },
  { label: '理赔意见/联系人', key: 'claimContact' },
  { label: '理赔联系电话', key: 'claimPhone' },
  { label: '理赔银行账户', key: 'bankAccount' }
]

// Filter logic
const filteredClaims = computed(() => {
  return (store.claims || []).filter(c => {
    if (filters.claimNo && !c.claimNo.includes(filters.claimNo)) return false
    if (filters.relatedPolicyNo && !c.relatedPolicyNo.includes(filters.relatedPolicyNo)) return false
    if (filters.status !== 'all' && c.status !== filters.status) return false
    return true
  })
})

const getStepNodeClass = (stepNum) => {
  if (stepNum < currentStep.value) return 'node-completed'
  if (stepNum === currentStep.value) return 'node-active'
  return 'node-pending'
}

const getStepStatusText = (stepNum) => {
  if (stepNum < currentStep.value) return '已完成'
  if (stepNum === currentStep.value) return '进行中'
  return '待处理'
}

const getStepTheme = (step) => {
  if (step <= 2) return 'primary'
  if (step <= 4) return 'warning'
  return 'success'
}

const getStepName = (step) => {
  const steps = ['报案提交', '跟单接单', '审核补件', '调查定损', '理赔收回']
  return steps[step - 1] || '待报案'
}

const toggleCollapse = (idx) => {
  expandedSteps.value[idx] = !expandedSteps.value[idx]
}

const setStep = (stepNum) => {
  currentStep.value = stepNum
  // Auto collapse others
  expandedSteps.value = expandedSteps.value.map((_, i) => i === stepNum - 1 || i < stepNum)
}

// Simulated OCR
const startOCRScan = () => {
  isScanning.value = true
  scanProgress.value = 0
  scanSuccess.value = false
  const interval = setInterval(() => {
    scanProgress.value += 20
    if (scanProgress.value >= 100) {
      clearInterval(interval)
      isScanning.value = false
      scanSuccess.value = true
      MessagePlugin.success('OCR识别检验完成，单证一致性高分通过')
    }
  }, 300)
}

// Payment Dialog
const showPaymentDialog = () => {
  paymentDialogVisible.value = true
}

const confirmPayment = () => {
  serviceFeePaid.value = true
  paymentDialogVisible.value = false
  if (currentClaim.value) {
    currentClaim.value.serviceFeePaid = true
    syncClaimToStore()
  }
  MessagePlugin.success('服务费通过网关预收缴支付成功！')
}

// RWA Sync
const syncToRwaPlatform = () => {
  isSyncingRwa.value = true
  setTimeout(() => {
    isSyncingRwa.value = false
    rwaSyncStatus.value = 'synced'
    if (currentClaim.value) {
      const idx = store.claims.findIndex(c => c.id === currentClaim.value.id)
      if (idx >= 0) {
        store.claims[idx].rwaSyncStatus = 'synced'
      }
    }
    MessagePlugin.success('理赔收款明细已同步清算至RWA应收账款融资平台，资产额度释放成功！')
  }, 1200)
}

// Sync current claim changes back to store
const syncClaimToStore = () => {
  if (!currentClaim.value) return
  const idx = store.claims.findIndex(c => c.id === currentClaim.value.id)
  if (idx >= 0) {
    store.claims[idx] = { ...store.claims[idx], ...currentClaim.value }
  }
}

// Step actions
const prevStep = () => {
  if (currentStep.value > 1) {
    setStep(currentStep.value - 1)
  }
}

const submitStep = () => {
  if (approvalDecision.value === 'rejected') {
    MessagePlugin.warning('审批驳回：已将意见退回到上一阶段修改。')
    prevStep()
    return
  }

  isSubmitting.value = true
  setTimeout(() => {
    isSubmitting.value = false
    const payload = {}
    if (currentStep.value === 3) {
      currentClaim.value.status = 'processing'
      currentClaim.value.statusName = '处理中'
    } else if (currentStep.value === 4) {
      currentClaim.value.status = 'decided'
      currentClaim.value.statusName = '已决定'
      currentClaim.value.claimDecision = claimDecision.value
      currentClaim.value.calculatedLoss = calculatedLoss.value
      currentClaim.value.deductible = deductibleAmount.value
      currentClaim.value.claimAmount = finalCompensatedAmount.value
      Object.assign(payload, {
        claimDecision: claimDecision.value,
        calculatedLoss: calculatedLoss.value,
        deductible: deductibleAmount.value,
        claimAmount: finalCompensatedAmount.value
      })
    }
    // Persist to store
    if (currentClaim.value) {
      store.advanceClaimStep(currentClaim.value.id, payload)
    }
    MessagePlugin.success(`Step ${currentStep.value} (${stepOptions[currentStep.value - 1].label}) 审查通过，流转进入下一步`)
    setStep(currentStep.value + 1)
  }, 800)
}

const completeWorkflow = () => {
  isSubmitting.value = true
  setTimeout(() => {
    isSubmitting.value = false
    if (currentClaim.value) {
      store.completeClaim(currentClaim.value.id, {
        receivingBank: receivingBank.value,
        rwaSyncStatus: 'synced'
      })
      currentClaim.value.status = 'completed'
      currentClaim.value.statusName = '已赔付'
    }
    MessagePlugin.success('全案定损完毕，理赔实收归档，本案正式结案结清！')
    activeTab.value = 'task-list'
  }, 1000)
}

// Switch and Processing Claim
const startProcessing = (row) => {
  currentClaim.value = row
  // Use currentStep from store data if available, otherwise map from status
  if (row.currentStep) {
    currentStep.value = row.currentStep
  } else if (row.status === 'pending') {
    currentStep.value = 2
  } else if (row.status === 'supplement') {
    currentStep.value = 3
  } else if (row.status === 'processing' || row.status === 'investigating') {
    currentStep.value = 4
  } else if (row.status === 'decided') {
    currentStep.value = 5
  } else {
    currentStep.value = 5
  }
  // Load step form data from claim record
  serviceFeePaid.value = row.serviceFeePaid ?? true
  if (row.claimDecision) {
    claimDecision.value = row.claimDecision
    calculatedLoss.value = row.calculatedLoss || 80000
    deductibleAmount.value = row.deductible || 2000
  }
  if (row.rwaSyncStatus) {
    rwaSyncStatus.value = row.rwaSyncStatus
  }
  setStep(currentStep.value)
  activeTab.value = 'process'
}

// Default loading
const loadDefaultClaim = () => {
  if (store.claims && store.claims.length > 0) {
    startProcessing(store.claims[0])
  } else {
    MessagePlugin.error('无可用理赔案件，请在列表端新建。')
  }
}

// Filter Actions
const searchClaims = () => {
  // filteredClaims computed updates automatically
}

const resetFilters = () => {
  filters.claimNo = ''
  filters.relatedPolicyNo = ''
  filters.status = 'all'
}

// View Dialog Detail
const detailVisible = ref(false)
const currentRow = ref(null)

const handleView = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

onMounted(() => {
  store.ensureSeeded()
  if (store.claims && store.claims.length > 0) {
    currentClaim.value = store.claims[0]
    startProcessing(store.claims[0])
  }
})
</script>

<style lang="scss" scoped>
// Premium Theme Color Variables
$primary: #0052d9;
$success: #2ba471;
$warning: #e37318;
$danger: #d54941;
$gray-100: #f3f3f3;
$gray-200: #eeeeee;
$gray-300: #dcdcdc;
$gray-400: #c5c5c5;
$gray-500: #9e9e9e;
$gray-800: #2c2c2c;

.page-container {
  padding: 24px;
  background: #f5f6f7;
  min-height: 100vh;
}

.breadcrumbs {
  margin-bottom: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title-wp {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: $gray-800;
}

.claim-info {
  font-size: 14px;
  color: $gray-500;
  .policy-no {
    font-weight: 600;
    color: $primary;
  }
}

// Stepper Step Indicator styles
.flow-progress {
  background: #fff;
  border: 1px solid $gray-200;
  border-radius: 12px;
  padding: 24px 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}

.flow-steps {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.flow-step-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 90px;
}

.flow-step-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: $gray-200;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;

  .flow-step-num,
  .flow-step-check {
    font-size: 16px;
    font-weight: 700;
    color: $gray-500;
  }

  &.completed {
    background: $success;
    box-shadow: 0 0 0 4px rgba($success, 0.15);
    .flow-step-check {
      color: #fff;
    }
  }

  &.active {
    background: $primary;
    box-shadow: 0 0 0 4px rgba($primary, 0.18);
    .flow-step-num {
      color: #fff;
    }
  }
}

.flow-step-label {
  font-size: 13px;
  color: $gray-500;
  text-align: center;
  font-weight: 600;
  line-height: 1.3;

  &.completed {
    color: $success;
  }

  &.active {
    color: $primary;
  }
}

.flow-step-status {
  margin-top: 2px;
}

.flow-arrow {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  color: $gray-300;
  transition: color 0.3s ease;

  &.completed {
    color: $success;
  }
}

// Collapsible Timeline Node styles
.flow-timeline {
  background: #fff;
  border: 1px solid $gray-200;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  margin-bottom: 24px;
}

.timeline-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid $gray-200;
  background: #fafbfc;
}

.timeline-title {
  font-size: 16px;
  font-weight: 700;
  color: $gray-800;
}

.timeline-hint {
  font-size: 12px;
  color: $gray-400;
}

.timeline-node {
  border-left: 3px solid $gray-200;
  margin-left: 31px;
  padding: 0 0 24px 24px;
  position: relative;

  &:last-child {
    border-left-color: transparent;
  }

  &.node-completed {
    border-left-color: $success;
    .node-check {
      background: $success;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      font-size: 11px;
      font-weight: bold;
    }
  }

  &.node-active {
    border-left-color: $primary;
    .node-dot {
      background: $primary;
      box-shadow: 0 0 0 4px rgba($primary, 0.18);
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
  }

  &.node-pending {
    .node-pending-dot {
      background: $gray-300;
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
  }
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  cursor: pointer;
}

.node-marker {
  position: absolute;
  left: -9px;
  top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  z-index: 2;
}

.node-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: $gray-800;
}

.node-step-num {
  font-family: monospace;
  color: $gray-400;
}

.role-tag {
  font-weight: 600;
}

.node-handler {
  font-size: 12px;
  color: $gray-500;
  margin-left: 12px;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
}

.meta-status {
  font-weight: 600;
  &.status-已完成 { color: $success; }
  &.status-进行中 { color: $primary; }
  &.status-待处理 { color: $gray-400; }
}

.meta-time {
  color: $gray-400;
}

.node-toggle {
  color: $gray-400;
  margin-right: 24px;
}

.node-body {
  margin-top: 16px;
  margin-right: 24px;
  padding: 16px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid $gray-100;
}

// Step specific content layout styles
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: $gray-400;
}

.info-val {
  font-size: 14px;
  color: $gray-800;
  &.text-primary { color: $primary; }
}

.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }

.ocr-section-title {
  font-size: 14px;
  font-weight: 700;
  color: $gray-800;
  margin-top: 16px;
  margin-bottom: 12px;
}

.ocr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.ocr-file-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid $gray-200;
}

.ocr-file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  &.pdf { color: $danger; }
}

.file-name {
  font-size: 13px;
  color: $gray-800;
}

.ocr-progress-wp {
  background: #fff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid $gray-200;
  .progress-txt {
    font-size: 12px;
    color: $primary;
    margin-bottom: 6px;
    font-weight: 600;
  }
}

.alert-box-warn {
  background: #fff8f8;
  border: 1px solid #ffd4d4;
  border-radius: 8px;
  padding: 16px;
  .warning-title {
    font-size: 14px;
    font-weight: 700;
    color: $danger;
    margin-bottom: 4px;
  }
  .warning-desc {
    font-size: 12px;
    color: $gray-500;
    margin-bottom: 12px;
  }
  .warning-countdown {
    font-size: 13px;
    font-weight: 600;
    color: $gray-800;
  }
}

.sub-card {
  background: #fff;
  border: 1px solid $gray-200;
  border-radius: 8px;
  padding: 16px;
  height: 100%;
}

.sub-card-title {
  font-size: 14px;
  font-weight: 700;
  color: $gray-800;
  margin-bottom: 12px;
  border-bottom: 1px solid $gray-100;
  padding-bottom: 8px;
}

.fee-row {
  font-size: 13px;
  color: $gray-500;
  .fee-amount {
    font-size: 16px;
    font-weight: 800;
    color: $warning;
  }
}

.file-wp {
  display: flex;
  align-items: center;
  color: $gray-500;
  padding: 6px 12px;
  background: #fafbfc;
  border-radius: 4px;
  border: 1px solid $gray-100;
}

.font-12 { font-size: 12px; }
.ml-4 { margin-left: 4px; }
.mr-8 { margin-right: 8px; }
.ml-8 { margin-left: 8px; }
.mt-12 { margin-top: 12px; }
.mb-12 { margin-bottom: 12px; }
.mb-8 { margin-bottom: 8px; }
.mb-16 { margin-bottom: 16px; }
.mt-16 { margin-top: 16px; }
.mt-24 { margin-top: 24px; }
.mb-24 { margin-bottom: 24px; }

.row-flex {
  display: flex;
}

.flex-1 { flex: 1; }
.mr-16 { margin-right: 16px; }

.final-calc-wp {
  background: #f0f7ff;
  border: 1px solid #c2e0ff;
  padding: 12px 16px;
  border-radius: 6px;
  .calc-label {
    font-size: 12px;
    color: $gray-500;
  }
  .calc-formula {
    font-size: 13px;
    color: $gray-800;
    font-family: monospace;
  }
  .calc-result {
    font-size: 16px;
    font-weight: 800;
    color: $primary;
  }
}

.rwa-sync-panel {
  background: #fff;
  border: 1px solid $gray-200;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

// Approval and Bottom Nav Actions styles
.approval-card {
  background: #fff;
  border: 1px solid $gray-200;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}

.approval-title {
  font-size: 16px;
  font-weight: 700;
  color: $gray-800;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid $gray-100;
}

.bottom-actions {
  display: flex;
  justify-content: center;
  background: #fff;
  border: 1px solid $gray-200;
  padding: 18px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}

// No claim UI
.no-claim-wp {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
}

.no-claim-card {
  width: 500px;
  text-align: center;
  padding: 32px;
}

.no-claim-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.no-claim-icon {
  color: $gray-400;
  margin-bottom: 16px;
}

.no-claim-title {
  font-size: 18px;
  font-weight: 700;
  color: $gray-800;
  margin-bottom: 8px;
}

.no-claim-desc {
  font-size: 14px;
  color: $gray-500;
  line-height: 1.5;
}

// Claims List Tab layouts
.section-header {
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: $gray-800;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-title {
  font-size: 16px;
  font-weight: 700;
  color: $gray-800;
}

.table-count {
  font-size: 13px;
  color: $gray-400;
}

// QR Code payment Modal
.payment-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
}

.payment-title {
  font-size: 15px;
  font-weight: 700;
  color: $gray-800;
  margin-bottom: 8px;
}

.payment-fee {
  font-size: 28px;
  font-weight: 900;
  color: $warning;
  margin-bottom: 24px;
}

.payment-qr-wp {
  padding: 16px;
  background: #fff;
  border: 1px solid $gray-200;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
}

.qr-mock {
  width: 180px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafbfc;
}

.qr-box {
  width: 140px;
  height: 140px;
  border: 2px solid $primary;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  font-size: 12px;
  font-weight: bold;
  color: $primary;
}

.qr-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  background: $primary;

  &.top-left { top: -2px; left: -2px; }
  &.top-right { top: -2px; right: -2px; }
  &.bottom-left { bottom: -2px; left: -2px; }
  &.bottom-right { bottom: -2px; right: -2px; }
}

.payment-note {
  font-size: 12px;
  color: $gray-500;
}

.timeline-log-title {
  font-size: 15px;
  font-weight: 700;
  color: $gray-800;
}
</style>
