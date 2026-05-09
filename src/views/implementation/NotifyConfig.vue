<template>
  <div class="notify-config">
    <a-page-header title="通知配置" sub-title="调度告警短信通知配置" />
    <a-card class="notify-card" style="margin-top: 16px" title="告警短信通知">
      <a-form layout="vertical">
        <a-alert
          type="info"
          show-icon
          message="有调度告警时，系统会按这里配置的联系人、手机号和短信内容通知干系人。"
          style="margin-bottom: 12px"
        />

        <a-row :gutter="[16, 8]">
          <a-col :xs="24" :md="12">
            <a-form-item label="联系人" required>
              <a-input v-model:value="form.contact" placeholder="请输入联系人" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="触达渠道（手机号）" required>
              <a-input v-model:value="form.phone" placeholder="请输入手机号" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item
              label="短信内容"
              required
              extra="可使用变量：{告警类型}、{任务名称}、{区域}、{机器人}、{发生时间}。发送时会替换为实际告警信息。"
            >
              <a-textarea
                v-model:value="form.smsContent"
                placeholder="请输入短信内容"
                :rows="4"
                :maxlength="200"
                show-count
              />
            </a-form-item>
          </a-col>
        </a-row>

        <div class="sms-preview">
          <div class="preview-title">短信预览</div>
          <div class="preview-content">{{ smsPreview }}</div>
        </div>

        <a-button type="primary" @click="save">保存配置</a-button>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { message } from 'ant-design-vue'

const STORAGE_KEY = 'notify-config'
const defaultSmsContent = '【调度告警】{告警类型}：{任务名称}，区域：{区域}，机器人：{机器人}，发生时间：{发生时间}，请及时处理。'

const form = reactive({
  contact: '',
  phone: '',
  smsContent: defaultSmsContent
})

const smsPreview = computed(() => {
  return form.smsContent
    .replaceAll('{告警类型}', '任务执行异常')
    .replaceAll('{任务名称}', 'A区日常巡检')
    .replaceAll('{区域}', 'A区')
    .replaceAll('{机器人}', '巡检机器人 A')
    .replaceAll('{发生时间}', '2026-05-09 10:30')
})

function save() {
  if (!form.contact.trim() || !form.phone.trim() || !form.smsContent.trim()) {
    message.warning('请填写联系人、手机号和短信内容')
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
  message.success('通知配置已保存')
}

onMounted(() => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    form.contact = parsed.contact || ''
    form.phone = parsed.phone || ''
    form.smsContent = parsed.smsContent || defaultSmsContent
  } catch {
    // ignore parse error
  }
})
</script>

<style scoped lang="css">
.notify-config {
  width: 100%;
}
.notify-card {
  border-radius: 10px;
}
.sms-preview {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}
.preview-title {
  margin-bottom: 6px;
  color: #262626;
  font-weight: 600;
}
.preview-content {
  color: #595959;
  line-height: 1.6;
}
</style>
