<template>
  <div class="notify-config">
    <a-page-header title="通知配置" />
    <a-card style="margin-top: 16px" title="告警通知联系人">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="联系人" required>
              <a-input v-model:value="form.contact" placeholder="请输入联系人" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="触达渠道（手机号）" required>
              <a-input v-model:value="form.phone" placeholder="请输入手机号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-alert type="info" show-icon message="有告警的时候会直接通过短信联系干系人。" style="margin-bottom: 12px" />
        <a-button type="primary" @click="save">保存配置</a-button>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { message } from 'ant-design-vue'

const STORAGE_KEY = 'notify-config'
const form = reactive({
  contact: '',
  phone: ''
})

function save() {
  if (!form.contact.trim() || !form.phone.trim()) {
    message.warning('请填写联系人和手机号')
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
  } catch {
    // ignore parse error
  }
})
</script>
