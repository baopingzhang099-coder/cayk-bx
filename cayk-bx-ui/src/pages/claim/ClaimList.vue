<template>
  <div class="page-container">
    <div class="breadcrumbs">
      <t-breadcrumb>
        <t-breadcrumb-item to="/insurance/purchase">首页</t-breadcrumb-item>
        <t-breadcrumb-item to="/claim/list">理赔管理</t-breadcrumb-item>
        <t-breadcrumb-item>理赔信息管理</t-breadcrumb-item>
      </t-breadcrumb>
    </div>
    <div class="page-header">
      <div class="page-title">理赔信息管理</div>
      <div class="page-actions">
        <t-button v-if="userStore.role === 'customer'" theme="primary" @click="handleAdd">新建报案</t-button>
      </div>
    </div>

    <search-filter
      :status-options="statusOptions"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="stats-grid mb-24">
      <stat-card title="理赔案件" :value="store.claims.length" icon="first-aid-kit" color="primary" />
      <stat-card title="预估理赔金额" :value="`$${claimTotal.toLocaleString()}`" icon="money" color="warning" />
      <stat-card title="已结案" :value="completedCount" icon="check-circle" color="success" />
      <stat-card title="待处理" :value="pendingCount" icon="time" color="danger" />
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
      <template #claimType="{ row }">
        <t-tag :theme="getClaimTypeTheme(row.claimType)">{{ row.claimTypeName }}</t-tag>
      </template>
      <template #currentStep="{ row }">
        <t-tag :theme="getStepTheme(row.currentStep || 1)" variant="light">
          {{ getStepName(row.currentStep || 1) }}
        </t-tag>
      </template>
      <template #warningLevel="{ row }">
        <t-tag v-if="row.warningLevel === 'danger'" theme="danger" variant="light">红灯</t-tag>
        <t-tag v-else-if="row.warningLevel === 'warning'" theme="warning" variant="light">黄灯</t-tag>
        <t-tag v-else theme="success" variant="light">绿灯</t-tag>
      </template>
      <template #rwaSyncStatus="{ row }">
        <t-tag v-if="row.rwaSyncStatus === 'synced'" theme="success">已同步</t-tag>
        <t-tag v-else-if="row.rwaSyncStatus === 'syncing'" theme="warning">同步中</t-tag>
        <t-tag v-else theme="default" variant="light">未同步</t-tag>
      </template>
      <template #isOverdue="{ row }">
        <t-tag v-if="row.overdueDays > 0" theme="danger">逾期{{ row.overdueDays }}天</t-tag>
        <t-tag v-else-if="row.overdueDays < 0" theme="warning">距报案{{ Math.abs(row.overdueDays) }}天</t-tag>
        <t-tag v-else theme="success">正常</t-tag>
      </template>
      <template #operation="{ row }">
        <t-space>
          <t-link @click="handleView(row)">查看</t-link>
          <t-link v-if="userStore.role === 'customer'" @click="handleEdit(row)">编辑</t-link>
          <t-link v-if="userStore.role === 'customer' && row.docStatus === 'incomplete'" theme="warning" @click="handleSupplement(row)">补充资料</t-link>
          <t-link v-if="userStore.role === 'inkasso' && row.status === 'pending'" theme="warning" @click="handleReceive(row)">接收报案</t-link>
          <t-link v-if="userStore.role === 'inkasso' && row.status === 'assigned' && row.docStatus !== 'prepared'" theme="primary" @click="handlePrepareDocs(row)">准备资料</t-link>
          <t-link v-if="userStore.role === 'inkasso' && row.docStatus === 'prepared'" theme="primary" @click="handleSubmitDocs(row)">资料移交跟单员</t-link>
          <t-link v-if="userStore.role === 'inkasso' && row.docStatus === 'supplemented'" theme="primary" @click="handleIntegrateDocs(row)">整合资料</t-link>
          <t-link v-if="userStore.role === 'clerk' && row.docStatus === 'reviewing'" theme="success" @click="handleReviewDocs(row)">资料初审</t-link>
          <t-link v-if="userStore.role === 'clerk' && row.status === 'processing'" @click="handleEdit(row)">编辑</t-link>
        </t-space>
      </template>
    </data-table>

    <t-dialog v-model:visible="createVisible" header="新建报案" width="900px">
      <t-form ref="createFormRef" :data="createForm" :rules="createRules" label-align="top">
        <t-divider>基本信息</t-divider>
        <div class="form-grid">
          <t-form-item label="关联保单号" name="relatedPolicyNo">
            <t-select v-model="createForm.relatedPolicyNo" placeholder="请选择有效保单" clearable>
              <t-option v-for="p in activePolicies" :key="p.policyNo" :value="p.policyNo" :label="`${p.policyNo} - ${p.policyholder}`" />
            </t-select>
          </t-form-item>
          <t-form-item label="买方名称" name="buyerName">
            <t-select v-model="createForm.buyerName" placeholder="请选择买方" clearable>
              <t-option v-for="b in buyerOptions" :key="b" :value="b" :label="b" />
            </t-select>
          </t-form-item>
          <t-form-item label="报案类型" name="claimType">
            <t-select v-model="createForm.claimType" placeholder="请选择理赔类型" clearable>
              <t-option value="bankruptcy" label="破产" />
              <t-option value="arrears" label="拖欠" />
              <t-option value="rejection" label="拒收" />
              <t-option value="political_risk" label="政治风险" />
              <t-option value="goods_damage" label="货物损失" />
              <t-option value="other" label="其他" />
            </t-select>
          </t-form-item>
          <t-form-item label="出险日期" name="lossDate">
            <t-date-picker v-model="createForm.lossDate" placeholder="请选择出险日期" />
          </t-form-item>
          <t-form-item label="预估损失金额" name="estimatedLossAmount">
            <t-input-number v-model="createForm.estimatedLossAmount" :min="0" placeholder="请输入金额" />
          </t-form-item>
          <t-form-item label="损失币种" name="lossCurrency">
            <t-select v-model="createForm.lossCurrency" placeholder="请选择币种" clearable>
              <t-option value="USD" label="USD - 美元" />
              <t-option value="CNY" label="CNY - 人民币" />
              <t-option value="EUR" label="EUR - 欧元" />
            </t-select>
          </t-form-item>
        </div>

        <t-divider>损失情况</t-divider>
        <div class="form-grid">
          <t-form-item label="损失发生地点" name="lossLocation" class="form-item-full">
            <t-input v-model="createForm.lossLocation" placeholder="请输入损失发生地点" />
          </t-form-item>
          <t-form-item label="损失情况描述" name="lossDescription" class="form-item-full">
            <t-textarea v-model="createForm.lossDescription" placeholder="请输入损失情况描述" :autosize="{ minRows: 3, maxRows: 5 }" />
          </t-form-item>
        </div>

        <t-divider>理赔联系人信息</t-divider>
        <div class="form-grid">
          <t-form-item label="理赔联系人" name="claimContact">
            <t-input v-model="createForm.claimContact" placeholder="请输入联系人姓名" />
          </t-form-item>
          <t-form-item label="理赔联系电话" name="claimPhone">
            <t-input v-model="createForm.claimPhone" placeholder="请输入联系电话" />
          </t-form-item>
          <t-form-item label="理赔联系邮箱" name="claimEmail" class="form-item-full">
            <t-input v-model="createForm.claimEmail" placeholder="请输入邮箱" />
          </t-form-item>
          <t-form-item label="收款银行账户信息" name="bankAccount" class="form-item-full">
            <t-input v-model="createForm.bankAccount" placeholder="请输入银行账户信息（用于收取赔款）" />
          </t-form-item>
        </div>

        <t-divider>附件材料（必传）</t-divider>
        <div class="form-grid">
          <t-form-item label="出险通知书/报案表" name="lossNotice" class="form-item-full">
            <t-upload v-model="createForm.lossNotice" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="贸易合同" name="tradeContract" class="form-item-full">
            <t-upload v-model="createForm.tradeContract" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="商业发票" name="commercialInvoice" class="form-item-full">
            <t-upload v-model="createForm.commercialInvoice" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="提单/运单" name="billOfLading" class="form-item-full">
            <t-upload v-model="createForm.billOfLading" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="报关单" name="customsDeclaration" class="form-item-full">
            <t-upload v-model="createForm.customsDeclaration" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="买方收货凭证" name="receiptProof" class="form-item-full">
            <t-upload v-model="createForm.receiptProof" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="损失证明" name="lossProof" class="form-item-full">
            <t-upload v-model="createForm.lossProof" action="https://demo.com/upload" />
          </t-form-item>
          <t-form-item label="追偿授权书" name="recourseAuth" class="form-item-full">
            <t-upload v-model="createForm.recourseAuth" action="https://demo.com/upload" />
          </t-form-item>
        </div>

      </t-form>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="createVisible = false">取消</t-button>
          <t-button theme="primary" @click="handleCreateSubmit">提交报案</t-button>
        </t-space>
      </template>
    </t-dialog>

    <t-dialog v-model:visible="detailVisible" header="理赔案件详情" width="750px" :footer="false">
      <div v-if="currentRow" class="detail-body">
        <!-- Phase Progress -->
        <t-card title="理赔阶段进度" class="mb-16" theme="default" :bordered="true">
          <div class="phase-steps">
            <div v-for="(s, i) in detailSteps" :key="i" class="phase-step" :class="{ active: i + 1 === currentRow.currentStep, completed: i + 1 < currentRow.currentStep }">
              <div class="phase-dot">
                <span v-if="i + 1 < currentRow.currentStep">✓</span>
                <span v-else>{{ i + 1 }}</span>
              </div>
              <div class="phase-label">{{ s }}</div>
            </div>
            <div v-if="i < detailSteps.length - 1" class="phase-line" :class="{ completed: i + 1 < currentRow.currentStep }"></div>
          </div>
        </t-card>

        <!-- Basic Information formatted -->
        <t-card title="案件信息" class="mb-16" :bordered="true">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">理赔单号</span>
              <span class="info-value">{{ currentRow.claimNo }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">关联保单</span>
              <span class="info-value">{{ currentRow.relatedPolicyNo }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">保险公司</span>
              <span class="info-value">{{ currentRow.insuranceCompany }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">买方名称</span>
              <span class="info-value">{{ currentRow.buyerName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">报案类型</span>
              <span class="info-value">{{ currentRow.claimTypeName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">案件状态</span>
              <span class="info-value">
                <t-tag :theme="currentRow.status === 'pending' ? 'warning' : currentRow.status === 'processing' ? 'primary' : 'success'" variant="light">
                  {{ statusMap[currentRow.status] || currentRow.statusName }}
                </t-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">报案时间</span>
              <span class="info-value">{{ currentRow.createTime }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">出险日期</span>
              <span class="info-value">{{ currentRow.lossDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">损失币种</span>
              <span class="info-value">{{ currentRow.lossCurrency }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">预估损失</span>
              <span class="info-value">${{ Number(currentRow.estimatedLossAmount || 0).toLocaleString() }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">实际赔付</span>
              <span class="info-value">{{ currentRow.claimAmount ? '$' + Number(currentRow.claimAmount).toLocaleString() : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">损失地点</span>
              <span class="info-value">{{ currentRow.lossLocation || '-' }}</span>
            </div>
          </div>
          <div v-if="currentRow.lossDescription" class="info-desc">
            <span class="info-label">损失描述</span>
            <p class="info-desc-text">{{ currentRow.lossDescription }}</p>
          </div>
        </t-card>

        <t-row :gutter="16" class="mb-16">
          <t-col :span="6">
            <t-card title="联系信息" :bordered="true" class="h-full">
              <div class="info-grid compact">
                <div class="info-item">
                  <span class="info-label">联系人</span>
                  <span class="info-value">{{ currentRow.claimContact }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">联系电话</span>
                  <span class="info-value">{{ currentRow.claimPhone }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">联系邮箱</span>
                  <span class="info-value">{{ currentRow.claimEmail }}</span>
                </div>
              </div>
            </t-card>
          </t-col>
          <t-col :span="6">
            <t-card title="资料状态" :bordered="true" class="h-full">
              <div class="info-grid compact">
                <div class="info-item">
                  <span class="info-label">跟单员</span>
                  <span class="info-value">{{ currentRow.clerkName || '未分配' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">资料文件</span>
                  <span class="info-value">{{ currentRow.preparedDocs?.length || 0 }} 份</span>
                </div>
                <div class="info-item">
                  <span class="info-label">补充次数</span>
                  <span class="info-value">{{ currentRow.supplementCount || 0 }} 次</span>
                </div>
              </div>
            </t-card>
          </t-col>
        </t-row>

        <!-- Final Claim Calculation (if decided) -->
        <t-card v-if="currentRow.claimDecision" title="定损赔付计算" class="mt-16" :bordered="true">
          <t-row :gutter="16">
            <t-col :span="6">
              <div class="calc-item">
                <span class="calc-label">核定损失金额</span>
                <span class="calc-value">${{ Number(currentRow.calculatedLoss || 0).toLocaleString() }}</span>
              </div>
            </t-col>
            <t-col :span="6">
              <div class="calc-item">
                <span class="calc-label">免赔额</span>
                <span class="calc-value">${{ Number(currentRow.deductible || 0).toLocaleString() }}</span>
              </div>
            </t-col>
            <t-col :span="6">
              <div class="calc-item">
                <span class="calc-label">实际赔付金额</span>
                <span class="calc-value primary">${{ Number(currentRow.claimAmount || 0).toLocaleString() }}</span>
              </div>
            </t-col>
            <t-col :span="6">
              <div class="calc-item">
                <span class="calc-label">定损结论</span>
                <span class="calc-value">{{ currentRow.claimDecision === 'approved' ? '同意赔付' : currentRow.claimDecision === 'partial' ? '部分赔付' : '拒绝赔付' }}</span>
              </div>
            </t-col>
          </t-row>
        </t-card>
      </div>
    </t-dialog>

    <t-dialog v-model:visible="editVisible" header="编辑理赔" width="650px">
      <t-form ref="editFormRef" :data="editForm" :rules="editRules" label-align="top">
        <div class="form-grid">
          <t-form-item label="理赔单号">
            <t-input :value="currentRow?.claimNo" disabled />
          </t-form-item>
          <t-form-item label="关联保单号" name="relatedPolicyNo">
            <t-select v-model="editForm.relatedPolicyNo" placeholder="请选择保单" clearable>
              <t-option v-for="p in activePolicies" :key="p.policyNo" :value="p.policyNo" :label="p.policyNo" />
            </t-select>
          </t-form-item>
          <t-form-item label="报案类型" name="claimType">
            <t-select v-model="editForm.claimType" placeholder="请选择类型" clearable>
              <t-option value="bankruptcy" label="破产" />
              <t-option value="arrears" label="拖欠" />
              <t-option value="rejection" label="拒收" />
              <t-option value="political_risk" label="政治风险" />
              <t-option value="goods_damage" label="货物损失" />
              <t-option value="other" label="其他" />
            </t-select>
          </t-form-item>
          <t-form-item label="状态" name="status">
            <t-select v-model="editForm.status" placeholder="请选择状态" clearable>
              <t-option value="pending" label="待处理" />
              <t-option value="processing" label="处理中" />
              <t-option value="investigating" label="调查中" />
              <t-option value="supplement" label="补充材料" />
              <t-option value="decided" label="已决定" />
              <t-option value="completed" label="已赔付" />
              <t-option value="rejected" label="已拒赔" />
            </t-select>
          </t-form-item>
          <t-form-item label="预估损失金额" name="estimatedLossAmount">
            <t-input-number v-model="editForm.estimatedLossAmount" :min="0" />
          </t-form-item>
          <t-form-item label="核定赔付金额" name="claimAmount">
            <t-input-number v-model="editForm.claimAmount" :min="0" />
          </t-form-item>
          <t-form-item label="损失描述" name="lossDescription" class="form-item-full">
            <t-textarea v-model="editForm.lossDescription" :autosize="{ minRows: 2, maxRows: 4 }" />
          </t-form-item>
        </div>
      </t-form>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="editVisible = false">取消</t-button>
          <t-button theme="primary" @click="handleEditSubmit">保存</t-button>
        </t-space>
      </template>
    </t-dialog>

    <t-dialog v-model:visible="receiveVisible" header="接收报案" width="480px" @confirm="handleReceiveConfirm">
      <div class="receive-body">
        <t-alert message="请指派跟单员处理此报案" theme="info" class="mb-16" />
        <t-form label-align="top">
          <t-form-item label="报案单号">
            <t-input :value="currentRow?.claimNo" disabled />
          </t-form-item>
          <t-form-item label="指派跟单员" name="assignClerk" :required="true">
            <t-select v-model="selectedClerkId" placeholder="请选择跟单员" clearable>
              <t-option v-for="clerk in store.clerkList" :key="clerk.id" :value="clerk.id" :label="`${clerk.name}（${clerk.department}）`" />
            </t-select>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 资料准备弹窗 (inkasso) -->
    <t-dialog v-model:visible="docPrepareVisible" header="准备理赔资料" width="640px" @confirm="handleDocPrepareConfirm">
      <div class="receive-body">
        <t-alert message="请准备理赔申请资料和理赔资料文件包，完成后提交给跟单员审核" theme="info" class="mb-16" />
        <t-form label-align="top">
          <t-form-item label="报案单号">
            <t-input :value="currentRow?.claimNo" disabled />
          </t-form-item>
          <t-form-item label="跟单员">
            <t-input :value="currentRow?.clerkName" disabled />
          </t-form-item>
          <t-divider>理赔申请资料</t-divider>
          <t-form-item label="出险通知书/报案表">
            <t-upload v-model="docPrepareFiles.appNotice" theme="file" :auto-upload="false" placeholder="请上传文件" />
          </t-form-item>
          <t-form-item label="索赔申请书">
            <t-upload v-model="docPrepareFiles.claimForm" theme="file" :auto-upload="false" placeholder="请上传文件" />
          </t-form-item>
          <t-form-item label="授权委托书">
            <t-upload v-model="docPrepareFiles.authorization" theme="file" :auto-upload="false" placeholder="请上传文件" />
          </t-form-item>
          <t-divider>理赔资料文件包</t-divider>
          <t-form-item label="贸易合同">
            <t-upload v-model="docPrepareFiles.tradeContract" theme="file" :auto-upload="false" placeholder="请上传文件" />
          </t-form-item>
          <t-form-item label="商业发票">
            <t-upload v-model="docPrepareFiles.invoice" theme="file" :auto-upload="false" placeholder="请上传文件" />
          </t-form-item>
          <t-form-item label="提单/运单">
            <t-upload v-model="docPrepareFiles.billOfLading" theme="file" :auto-upload="false" placeholder="请上传文件" />
          </t-form-item>
          <t-form-item label="报关单">
            <t-upload v-model="docPrepareFiles.customsDecl" theme="file" :auto-upload="false" placeholder="请上传文件" />
          </t-form-item>
          <t-form-item label="损失证明">
            <t-upload v-model="docPrepareFiles.lossProof" theme="file" :auto-upload="false" placeholder="请上传文件" />
          </t-form-item>
          <t-form-item label="往来函件/催收记录">
            <t-upload v-model="docPrepareFiles.correspondence" theme="file" :auto-upload="false" placeholder="请上传文件" />
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 资料初审弹窗 (clerk) -->
    <t-dialog v-model:visible="docReviewVisible" header="初审理赔资料" width="640px">
      <div class="receive-body">
        <t-alert message="审核资料完整性，资料完整将提交理赔资料进入处理阶段，不完整将驳回客户补充" theme="info" class="mb-16" />
        <t-form label-align="top">
          <t-form-item label="报案单号">
            <t-input :value="currentRow?.claimNo" disabled />
          </t-form-item>
          <t-form-item v-if="currentRow?.preparedDocs?.length" label="已提交资料">
            <t-list>
              <t-list-item v-for="(doc, i) in currentRow.preparedDocs" :key="i">
                {{ doc.name || `资料${i + 1}` }}
              </t-list-item>
            </t-list>
          </t-form-item>
          <t-form-item v-if="currentRow?.supplementCount > 0" label="补充次数">
            <t-tag theme="warning">{{ currentRow.supplementCount }} 次</t-tag>
          </t-form-item>
          <t-form-item label="审核意见">
            <t-textarea v-model="docReviewComment" placeholder="请输入审核意见（退回时必填）" :rows="3" />
          </t-form-item>
        </t-form>
      </div>
      <template #footer>
        <t-space>
          <t-button variant="outline" @click="docReviewVisible = false">取消</t-button>
          <t-button theme="danger" @click="handleDocReviewReturn">资料不完整</t-button>
          <t-button theme="success" @click="handleDocReviewPass">资料完整</t-button>
        </t-space>
      </template>
    </t-dialog>

    <!-- 补充资料弹窗 (customer) -->
    <t-dialog v-model:visible="docSupplementVisible" header="补充理赔资料" width="540px" @confirm="handleDocSupplementConfirm">
      <div class="receive-body">
        <t-alert v-if="currentRow?.docReviewComment" :message="`退回原因：${currentRow.docReviewComment}`" theme="warning" class="mb-16" />
        <t-alert message="请根据审核意见补充相关资料" theme="info" class="mb-16" />
        <t-form label-align="top">
          <t-form-item label="报案单号">
            <t-input :value="currentRow?.claimNo" disabled />
          </t-form-item>
          <t-divider>补充资料上传</t-divider>
          <t-form-item label="补充文件">
            <t-upload v-model="docSupplementFiles" theme="file" :auto-upload="false" placeholder="请上传补充文件" multiple />
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import SearchFilter from '@/components/common/SearchFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'

import { useBusinessStore } from '@/stores/business'
import { useUserStore } from '@/stores/user'

const store = useBusinessStore()
const userStore = useUserStore()
const loading = computed(() => false)
const searchParams = ref({ enterpriseName: '', buyerName: '', status: '', dateRange: [] })

const statusOptions = [
  { value: 'pending', label: '待接收报案' },
  { value: 'assigned', label: '待接单' },
  { value: 'pending_receive', label: '待接收' },
  { value: 'doc_preparing', label: '资料准备中' },
  { value: 'doc_reviewing', label: '资料审核中' },
  { value: 'doc_incomplete', label: '资料不完整' },
  { value: 'doc_supplemented', label: '已补充' },
  { value: 'processing', label: '处理中' },
  { value: 'investigating', label: '调查中' },
  { value: 'supplement', label: '补充材料' },
  { value: 'decided', label: '已决定' },
  { value: 'completed', label: '已赔付' },
  { value: 'rejected', label: '已拒赔' },
  { value: 'recourse', label: '追偿中' },
  { value: 'closed', label: '已结案' }
]

const statusMap = {
  pending: '待接收报案',
  assigned: '待接单',
  pending_receive: '待接收',
  doc_preparing: '资料准备中',
  doc_reviewing: '资料审核中',
  doc_incomplete: '资料不完整',
  doc_supplemented: '已补充',
  processing: '处理中',
  investigating: '调查中',
  supplement: '补充材料',
  decided: '已决定',
  completed: '已赔付',
  rejected: '已拒赔',
  recourse: '追偿中',
  closed: '已结案'
}

// docStatus to display label mapping (for detail/status column)
const docStatusMap = {
  pending: '待准备',
  prepared: '资料已准备',
  reviewing: '资料审核中',
  passed: '已通过',
  incomplete: '资料不完整',
  supplemented: '已补充'
}

const columns = [
  { colKey: 'claimNo', title: '理赔单号', width: 140 },
  { colKey: 'relatedPolicyNo', title: '保单号', width: 140 },
  { colKey: 'insuranceCompany', title: '保险公司', width: 100 },
  { colKey: 'buyerName', title: '买方名称' },
  { colKey: 'claimType', title: '报案类型', width: 100, slot: 'claimType' },
  { colKey: 'currentStep', title: '当前阶段', width: 100, slot: 'currentStep' },
  { colKey: 'estimatedLossAmount', title: '预估金额', align: 'right' },
  { colKey: 'claimAmount', title: '实际赔付', align: 'right' },
  { colKey: 'lossCurrency', title: '币种', width: 80 },
  { colKey: 'warningLevel', title: '时限预警', width: 80, slot: 'warningLevel' },
  { colKey: 'rwaSyncStatus', title: 'RWA同步', width: 80, slot: 'rwaSyncStatus' },
  { colKey: 'status', title: '状态', width: 100, slot: 'status' },
  { colKey: 'createTime', title: '报案时间', width: 160 },
  { colKey: 'operation', title: '操作', width: 160, fixed: 'right', slot: 'operation' }
]

const pagination = reactive({ total: 0, current: 1, pageSize: 20 })

const filteredData = computed(() => {
  const list = store.claims || []
  const p = searchParams.value
  return list.filter((it) => {
    if (p.buyerName && !String(it.buyerName || '').includes(p.buyerName)) return false
    if (p.status && it.status !== p.status) return false
    return true
  })
})

const tableData = computed(() => {
  pagination.total = filteredData.value.length
  const start = (pagination.current - 1) * pagination.pageSize
  return filteredData.value.slice(start, start + pagination.pageSize)
})

const claimTotal = computed(() => (store.claims || []).reduce((sum, it) => sum + (Number(it.estimatedLossAmount) || 0), 0))
const completedCount = computed(() => (store.claims || []).filter(c => ['completed', 'rejected', 'closed'].includes(c.status)).length)
const pendingCount = computed(() => (store.claims || []).filter(c =>
  ['pending', 'assigned', 'pending_receive', 'doc_preparing', 'doc_reviewing',
   'doc_incomplete', 'doc_supplemented'].includes(c.status)
).length)

const detailSteps = ['报案提交', '跟单接单', '审核补件', '调查定损', '理赔收回']

const activePolicies = computed(() => (store.policies || []).filter(p => p.status === 'active'))
const buyerOptions = computed(() => {
  const buyers = new Set()
  ;(store.policies || []).forEach(p => { if (p.insured) buyers.add(p.insured) })
  return Array.from(buyers)
})

const createVisible = ref(false)
const detailVisible = ref(false)
const editVisible = ref(false)
const receiveVisible = ref(false)
const selectedClerkId = ref('')
const docPrepareVisible = ref(false)
const docReviewVisible = ref(false)
const docSupplementVisible = ref(false)
const docReviewComment = ref('')
const docPrepareFiles = reactive({
  appNotice: [], claimForm: [], authorization: [],
  tradeContract: [], invoice: [], billOfLading: [],
  customsDecl: [], lossProof: [], correspondence: []
})
const docSupplementFiles = ref([])
const createFormRef = ref(null)
const editFormRef = ref(null)
const currentRow = ref(null)

const createForm = reactive({
  relatedPolicyNo: '',
  buyerName: '',
  claimType: '',
  lossDate: '',
  estimatedLossAmount: null,
  lossCurrency: 'USD',
  lossLocation: '',
  lossDescription: '',
  claimContact: '',
  claimPhone: '',
  claimEmail: '',
  bankAccount: '',
  lossNotice: [],
  tradeContract: [],
  commercialInvoice: [],
  billOfLading: [],
  customsDeclaration: [],
  receiptProof: [],
  lossProof: [],
  recourseAuth: []
})

const editForm = reactive({
  relatedPolicyNo: '',
  claimType: '',
  status: '',
  estimatedLossAmount: null,
  claimAmount: null,
  lossDescription: ''
})

const createRules = {
  relatedPolicyNo: [{ required: false, message: '请选择关联保单号', type: 'error' }],
  claimType: [{ required: false, message: '请选择报案类型', type: 'error' }],
  lossDescription: [{ required: false, message: '请输入损失情况描述', type: 'error' }],
  estimatedLossAmount: [{ required: false, message: '请输入预估损失金额', type: 'error' }],
  lossDate: [{ required: false, message: '请选择出险日期', type: 'error' }]
}

const editRules = {
  relatedPolicyNo: [{ required: true, message: '请选择保单', type: 'error' }],
  status: [{ required: true, message: '请选择状态', type: 'error' }]
}

const detailColumns = [
  { label: '理赔单号', key: 'claimNo' },
  { label: '关联保单', key: 'relatedPolicyNo' },
  { label: '保险公司', key: 'insuranceCompany' },
  { label: '买方名称', key: 'buyerName' },
  { label: '报案类型', key: 'claimTypeName' },
  { label: '出险日期', key: 'lossDate' },
  { label: '报案时间', key: 'createTime' },
  { label: '预估损失金额', key: 'estimatedLossAmount', formatter: (v) => `$${Number(v).toLocaleString()}` },
  { label: '实际赔付金额', key: 'claimAmount', formatter: (v) => v ? `$${Number(v).toLocaleString()}` : '-' },
  { label: '损失币种', key: 'lossCurrency' },
  { label: '损失描述', key: 'lossDescription' },
  { label: '案件状态', key: 'statusName' },
  { label: '报案时限', key: 'reportDeadline', formatter: (v) => v || '按保单条款' },
  { label: '调查时限', key: 'investigationDeadline', formatter: (v) => v || '按保单条款' },
  { label: '赔付时限', key: 'paymentDeadline', formatter: (v) => v || '按保单条款' },
  { label: '理赔联系人', key: 'claimContact' },
  { label: '联系电话', key: 'claimPhone' }
]

const getClaimTypeTheme = (type) => {
  const themes = {
    bankruptcy: 'danger',
    arrears: 'warning',
    rejection: 'danger',
    political_risk: 'danger',
    goods_damage: 'warning',
    other: 'default'
  }
  return themes[type] || 'default'
}

const getStepTheme = (step) => {
  if (step <= 2) return 'primary'
  if (step <= 4) return 'warning'
  return 'success'
}

const getStepName = (step) => {
  const steps = { 1: '报案提交', 2: '跟单接单', 3: '审核补件', 4: '调查定损', 5: '理赔收回' }
  return steps[step] || '待报案'
}

const handleSearch = (params) => { searchParams.value = params; pagination.current = 1 }
const handleReset = () => { searchParams.value = { enterpriseName: '', buyerName: '', status: '', dateRange: [] }; pagination.current = 1 }
const handlePageChange = (pageInfo) => { pagination.current = pageInfo.current; pagination.pageSize = pageInfo.pageSize }
const handleAdd = () => {
  Object.assign(createForm, {
    relatedPolicyNo: '',
    buyerName: '',
    claimType: '',
    lossDate: '',
    estimatedLossAmount: null,
    lossCurrency: 'USD',
    lossLocation: '',
    lossDescription: '',
    claimContact: '',
    claimPhone: '',
    claimEmail: '',
    bankAccount: '',
    lossNotice: [],
    tradeContract: [],
    commercialInvoice: [],
    billOfLading: [],
    customsDeclaration: [],
    receiptProof: [],
    lossProof: [],
    recourseAuth: []
  })
  createVisible.value = true
}
const handleView = (row) => {
  currentRow.value = row
  detailVisible.value = true
}
const handleEdit = (row) => {
  currentRow.value = row
  Object.assign(editForm, {
    relatedPolicyNo: row.relatedPolicyNo,
    claimType: row.claimType,
    status: row.status,
    estimatedLossAmount: row.estimatedLossAmount,
    claimAmount: row.claimAmount,
    lossDescription: row.lossDescription
  })
  editVisible.value = true
}

const handleCreateSubmit = async () => {
  // 校验已放开，直接跳过表单校验
  const effectivePolicy = createForm.relatedPolicyNo || (store.policies.find(p => p.status === 'active')?.policyNo || '')
  const typeNameMap = {
    bankruptcy: '破产', arrears: '拖欠', rejection: '拒收',
    political_risk: '政治风险', goods_damage: '货物损失', other: '其他'
  }
  const res = store.createClaim({
    relatedPolicyNo: effectivePolicy,
    claimType: createForm.claimType || 'other',
    claimTypeName: typeNameMap[createForm.claimType] || '其他',
    lossDescription: createForm.lossDescription || '客户发起理赔申请',
    estimatedLossAmount: Number(createForm.estimatedLossAmount) || 10000,
    lossDate: createForm.lossDate || new Date().toISOString().split('T')[0],
    lossCurrency: createForm.lossCurrency || 'USD',
    lossLocation: createForm.lossLocation || '',
    claimContact: createForm.claimContact || '系统用户',
    claimPhone: createForm.claimPhone || '',
    claimEmail: createForm.claimEmail || '',
    bankAccount: createForm.bankAccount || '',
    evidenceMaterials: createForm.tradeContract?.length ? createForm.tradeContract : [{ name: '贸易合同.pdf' }],
    relevantDocuments: createForm.lossNotice?.length ? createForm.lossNotice : [{ name: '报案材料.pdf' }]
  })
  if (!res?.ok) {
    MessagePlugin.error(res?.message || '提交失败')
    return
  }
  MessagePlugin.success('理赔已提交')
  createVisible.value = false
}

const handleEditSubmit = async () => {
  const result = await editFormRef.value?.validate?.()
  if (result !== true) return
  if (currentRow.value) {
    Object.assign(currentRow.value, {
      relatedPolicyNo: editForm.relatedPolicyNo,
      claimType: editForm.claimType,
      status: editForm.status,
      estimatedLossAmount: editForm.estimatedLossAmount,
      claimAmount: editForm.claimAmount,
      lossDescription: editForm.lossDescription
    })
    MessagePlugin.success('理赔信息已更新')
  }
  editVisible.value = false
}

const handleReceive = (row) => {
  currentRow.value = row
  selectedClerkId.value = ''
  receiveVisible.value = true
}

const handleReceiveConfirm = () => {
  if (!selectedClerkId.value) {
    MessagePlugin.warning('请选择跟单员')
    return
  }
  const clerk = store.clerkList.find(c => c.id === selectedClerkId.value)
  if (!clerk) {
    MessagePlugin.warning('请选择有效的跟单员')
    return
  }
  const res = store.inkassoReceiveClaim(currentRow.value.id, clerk.id, clerk.name)
  if (res?.ok) {
    MessagePlugin.success(`已接收报案，指派跟单员 ${clerk.name}`)
  } else {
    MessagePlugin.error(res?.message || '操作失败')
  }
  receiveVisible.value = false
}

const handleAccept = (row) => {
  const res = store.clerkAcceptClaim(row.id)
  if (res?.ok) {
    MessagePlugin.success('已接单，开始处理理赔')
  } else {
    MessagePlugin.error(res?.message || '接单失败')
  }
}

// ===== 资料管理 handlers =====
const handlePrepareDocs = (row) => {
  currentRow.value = row
  Object.assign(docPrepareFiles, {
    appNotice: [], claimForm: [], authorization: [],
    tradeContract: [], invoice: [], billOfLading: [],
    customsDecl: [], lossProof: [], correspondence: []
  })
  docPrepareVisible.value = true
}

const handleDocPrepareConfirm = () => {
  if (!currentRow.value) return
  const docs = []
  Object.entries(docPrepareFiles).forEach(([key, files]) => {
    if (files && files.length > 0) {
      const labels = {
        appNotice: '出险通知书/报案表', claimForm: '索赔申请书', authorization: '授权委托书',
        tradeContract: '贸易合同', invoice: '商业发票', billOfLading: '提单/运单',
        customsDecl: '报关单', lossProof: '损失证明', correspondence: '往来函件/催收记录'
      }
      files.forEach(f => docs.push({ name: labels[key] || key, fileName: f.name || f, category: key }))
    }
  })
  if (docs.length === 0) {
    MessagePlugin.warning('请至少上传一份资料')
    return
  }
  const res = store.prepareClaimDocs(currentRow.value.id, docs)
  if (res?.ok) {
    MessagePlugin.success(`理赔资料已准备 (${docs.length} 份文件)`)
    docPrepareVisible.value = false
  } else {
    MessagePlugin.error(res?.message || '准备资料失败')
  }
}

const handleSubmitDocs = (row) => {
  const res = store.submitDocsToClerk(row.id)
  if (res?.ok) {
    MessagePlugin.success('资料已提交跟单员审核')
  } else {
    MessagePlugin.error(res?.message || '提交失败')
  }
}

const handleReviewDocs = (row) => {
  currentRow.value = row
  docReviewComment.value = ''
  docReviewVisible.value = true
}

const handleDocReviewPass = () => {
  if (!currentRow.value) return
  const res = store.clerkReviewDocs(currentRow.value.id, true, docReviewComment.value)
  if (res?.ok) {
    MessagePlugin.success('资料审核通过，已进入理赔处理阶段')
    docReviewVisible.value = false
  } else {
    MessagePlugin.error(res?.message || '审核失败')
  }
}

const handleDocReviewReturn = () => {
  if (!currentRow.value) return
  if (!docReviewComment.value.trim()) {
    MessagePlugin.warning('退回资料时请填写审核意见')
    return
  }
  const res = store.clerkReviewDocs(currentRow.value.id, false, docReviewComment.value)
  if (res?.ok) {
    MessagePlugin.success('已退回，通知客户补充资料')
    docReviewVisible.value = false
  } else {
    MessagePlugin.error(res?.message || '退回失败')
  }
}

const handleSupplement = (row) => {
  currentRow.value = row
  docSupplementFiles.value = []
  docSupplementVisible.value = true
}

const handleDocSupplementConfirm = () => {
  if (!currentRow.value) return
  const files = docSupplementFiles.value
  if (!files || files.length === 0) {
    MessagePlugin.warning('请至少上传一份补充资料')
    return
  }
  const docs = files.map(f => ({ name: f.name || f, category: 'supplement' }))
  const res = store.customerSupplementDocs(currentRow.value.id, docs)
  if (res?.ok) {
    MessagePlugin.success('补充资料已提交，等待平台整合')
    docSupplementVisible.value = false
  } else {
    MessagePlugin.error(res?.message || '提交失败')
  }
}

const handleIntegrateDocs = (row) => {
  const res = store.inkassoIntegrateDocs(row.id)
  if (res?.ok) {
    MessagePlugin.success('资料整合完成，已重新推送跟单员审核')
  } else {
    MessagePlugin.error(res?.message || '整合失败')
  }
}

onMounted(() => store.ensureSeeded())
</script>

<style lang="scss" scoped>
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.form-item-full { grid-column: 1 / -1; }
.dialog-actions { display: flex; justify-content: center; margin-top: 24px; }
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }
.receive-body { padding: 8px 0; }
.breadcrumbs {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}

/* Detail dialog styles */
.detail-body { padding: 4px 0; }
.mb-16 { margin-bottom: 16px; }
.mt-16 { margin-top: 16px; }

.phase-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.phase-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 60px;
}

.phase-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #999;
  transition: all 0.3s;
}

.phase-step.completed .phase-dot {
  background: #2ba471;
  color: #fff;
}

.phase-step.active .phase-dot {
  background: #0052d9;
  color: #fff;
  box-shadow: 0 0 0 4px rgba(0, 82, 217, 0.18);
}

.phase-label {
  font-size: 12px;
  color: #999;
  font-weight: 600;
}

.phase-step.active .phase-label {
  color: #0052d9;
}

.phase-step.completed .phase-label {
  color: #2ba471;
}

/* Phase connection lines */
.phase-line {
  flex: 1;
  height: 2px;
  background: #e0e0e0;
  margin: 0 4px;
  margin-bottom: 26px;
  min-width: 20px;
  transition: background 0.3s;
}
.phase-line.completed {
  background: #2ba471;
}

/* Info grid for detail dialog */
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px 24px;
}
.info-grid.compact {
  grid-template-columns: 1fr;
  gap: 8px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.info-item.full-width {
  grid-column: 1 / -1;
}
.info-label {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}
.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
.info-desc {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.info-desc-text {
  margin: 4px 0 0;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}
.h-full { height: 100%; }

.calc-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.calc-label { font-size: 12px; color: #999; }
.calc-value { font-size: 16px; font-weight: 700; color: #333; }
.calc-value.primary { color: #0052d9; }
</style>
