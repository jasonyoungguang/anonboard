<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getFamilyTree, submitStory } from '@/api/family'
import type { FamilyMember } from '@/api/family'

const members = ref<FamilyMember[]>([])
const loading = ref(true)
const submitting = ref(false)
const submitted = ref(false)
const error = ref('')

const form = ref({
  memberId: 0,
  title: '',
  content: '',
  storyYear: new Date().getFullYear(),
  storyMonth: new Date().getMonth() + 1,
  category: '',
  submitterName: ''
})

async function loadMembers() {
  loading.value = true
  try {
    const res = await getFamilyTree()
    members.value = res.data.data?.members || []
  } catch (e) {
    console.error('加载成员列表失败:', e)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!form.value.memberId) {
    error.value = '请选择关联人物'
    return
  }
  if (!form.value.title.trim()) {
    error.value = '请输入事迹标题'
    return
  }
  if (!form.value.submitterName.trim()) {
    error.value = '请输入您的姓名'
    return
  }

  submitting.value = true
  error.value = ''
  try {
    await submitStory(form.value)
    submitted.value = true
  } catch (e: any) {
    error.value = e.response?.data?.message || '提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

onMounted(loadMembers)
</script>

<template>
  <nav class="navbar">
    <div class="container">
      <router-link to="/" class="back-portal">← 返回族谱首页</router-link>
      <span class="navbar-brand">提交事迹</span>
    </div>
  </nav>

  <div class="container">
    <div class="page-header">
      <h1>提交生平事迹</h1>
      <p>填写家族成员的生平事迹，提交后将由管理员审核</p>
    </div>

    <div v-if="submitted" class="card" style="text-align:center;padding:40px">
      <h3 style="color:var(--success);margin-bottom:12px">提交成功！</h3>
      <p style="color:var(--text-secondary);margin-bottom:20px">您的提交已收到，等待管理员审核后展示。</p>
      <button class="btn btn-primary" @click="submitted = false; form = { memberId: 0, title: '', content: '', storyYear: new Date().getFullYear(), storyMonth: new Date().getMonth() + 1, category: '', submitterName: '' }">
        继续提交
      </button>
      <router-link to="/" class="btn btn-secondary" style="margin-left:8px">返回首页</router-link>
    </div>

    <div v-else class="card" style="max-width:600px">
      <div class="form-group">
        <label>关联人物 *</label>
        <select v-model="form.memberId" class="form-select">
          <option :value="0">请选择人物</option>
          <option v-for="m in members" :key="m.id" :value="m.id">
            {{ m.name }} (第{{ m.generation }}代)
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>事迹标题 *</label>
        <input v-model="form.title" class="form-input" placeholder="例如：考入北京大学">
      </div>

      <div class="form-group">
        <label>详细内容</label>
        <textarea v-model="form.content" class="form-textarea" placeholder="请详细描述事迹内容..." />
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label>年份</label>
          <input v-model.number="form.storyYear" type="number" class="form-input" placeholder="如 2024">
        </div>
        <div class="form-group">
          <label>月份</label>
          <input v-model.number="form.storyMonth" type="number" class="form-input" min="1" max="12" placeholder="1-12">
        </div>
      </div>

      <div class="form-group">
        <label>分类</label>
        <select v-model="form.category" class="form-select">
          <option value="">选择分类（可选）</option>
          <option value="出生">出生</option>
          <option value="求学">求学</option>
          <option value="工作">工作</option>
          <option value="婚嫁">婚嫁</option>
          <option value="荣誉">荣誉</option>
          <option value="其他">其他</option>
        </select>
      </div>

      <div class="form-group">
        <label>您的姓名 *</label>
        <input v-model="form.submitterName" class="form-input" placeholder="请输入您的真实姓名">
      </div>

      <p v-if="error" style="color:var(--danger);font-size:14px;margin-bottom:12px">{{ error }}</p>

      <div class="modal-actions">
        <router-link to="/" class="btn btn-secondary">取消</router-link>
        <button class="btn btn-primary" :disabled="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : '提交审核' }}
        </button>
      </div>
    </div>
  </div>
</template>
