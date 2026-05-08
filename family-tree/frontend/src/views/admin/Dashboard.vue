<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  getMembers, addMember, updateMember, deleteMember,
  getPendingStories, reviewStory,
  addRelationship, deleteRelationship
} from '@/api/family'
import type { FamilyMember, FamilyStory } from '@/api/family'

const router = useRouter()
const authStore = useAuthStore()
const activeTab = ref<'members' | 'stories'>('members')

// Members
const members = ref<FamilyMember[]>([])
const showMemberModal = ref(false)
const editingMember = ref<FamilyMember | null>(null)
const memberForm = ref({ name: '', gender: 0, birthYear: null as number | null, deathYear: null as number | null, generation: null as number | null, avatarUrl: '', bio: '' })

// Stories
const pendingStories = ref<FamilyStory[]>([])
const showReviewModal = ref(false)
const reviewingStory = ref<FamilyStory | null>(null)
const reviewStatus = ref(1)
const reviewComment = ref('')

// Relationship
const showRelModal = ref(false)
const relForm = ref({ memberAId: 0, memberBId: 0, relationType: 'parent-child' })
const relError = ref('')

async function loadMembers() {
  try {
    const res = await getMembers()
    members.value = res.data.data || []
  } catch (e) {
    console.error(e)
  }
}

async function loadPendingStories() {
  try {
    const res = await getPendingStories()
    pendingStories.value = res.data.data || []
  } catch (e) {
    console.error(e)
  }
}

function openAddMember() {
  editingMember.value = null
  memberForm.value = { name: '', gender: 0, birthYear: null, deathYear: null, generation: null, avatarUrl: '', bio: '' }
  showMemberModal.value = true
}

function openEditMember(m: FamilyMember) {
  editingMember.value = m
  memberForm.value = {
    name: m.name,
    gender: m.gender,
    birthYear: m.birthYear,
    deathYear: m.deathYear,
    generation: m.generation,
    avatarUrl: m.avatarUrl || '',
    bio: m.bio || ''
  }
  showMemberModal.value = true
}

async function saveMember() {
  try {
    if (editingMember.value) {
      await updateMember(editingMember.value.id, memberForm.value)
    } else {
      await addMember(memberForm.value)
    }
    showMemberModal.value = false
    await loadMembers()
  } catch (e) {
    console.error(e)
  }
}

async function handleDeleteMember(id: number) {
  if (!confirm('确定删除此成员？')) return
  try {
    await deleteMember(id)
    await loadMembers()
  } catch (e) {
    console.error(e)
  }
}

function openReview(s: FamilyStory) {
  reviewingStory.value = s
  reviewStatus.value = 1
  reviewComment.value = ''
  showReviewModal.value = true
}

async function handleReview() {
  if (!reviewingStory.value) return
  try {
    await reviewStory(reviewingStory.value.id, reviewStatus.value, reviewComment.value)
    showReviewModal.value = false
    await loadPendingStories()
  } catch (e) {
    console.error(e)
  }
}

function openAddRel() {
  relForm.value = { memberAId: 0, memberBId: 0, relationType: 'parent-child' }
  relError.value = ''
  showRelModal.value = true
}

async function saveRel() {
  if (!relForm.value.memberAId || !relForm.value.memberBId) {
    relError.value = '请选择两个人物'
    return
  }
  try {
    await addRelationship(relForm.value)
    showRelModal.value = false
    relError.value = ''
  } catch (e) {
    relError.value = '添加关系失败'
  }
}

async function handleDeleteRel(id: number) {
  if (!confirm('确定删除此关系？')) return
  try {
    await deleteRelationship(id)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  if (!authStore.isLoggedIn()) {
    router.push('/admin/login')
    return
  }
  loadMembers()
  loadPendingStories()
})
</script>

<template>
  <nav class="navbar">
    <div class="container">
      <router-link to="/" class="back-portal">← 返回族谱首页</router-link>
      <span class="navbar-brand">管理后台</span>
      <div class="navbar-links">
        <span style="font-size:13px;color:var(--text-secondary)">{{ authStore.username }}</span>
        <button @click="authStore.clearAuth(); router.push('/');">退出</button>
      </div>
    </div>
  </nav>

  <div class="container">
    <div class="page-header">
      <h1>管理后台</h1>
      <p>管理家族成员、亲属关系和事迹审核</p>
    </div>

    <div class="tabs">
      <button :class="['tab-btn', { active: activeTab === 'members' }]" @click="activeTab = 'members'">
        成员管理
      </button>
      <button :class="['tab-btn', { active: activeTab === 'stories' }]" @click="activeTab = 'stories'">
        事迹审核 ({{ pendingStories.length }})
      </button>
    </div>

    <!-- 成员管理 -->
    <div v-if="activeTab === 'members'">
      <div style="margin-bottom:16px;display:flex;gap:8px">
        <button class="btn btn-primary" @click="openAddMember()">+ 添加成员</button>
        <button class="btn btn-secondary" @click="openAddRel()">+ 添加关系</button>
      </div>

      <div class="card">
        <table class="table" v-if="members.length > 0">
          <thead>
            <tr>
              <th>姓名</th>
              <th>性别</th>
              <th>生卒年</th>
              <th>辈分</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in members" :key="m.id">
              <td><strong>{{ m.name }}</strong></td>
              <td>{{ m.gender === 1 ? '男' : m.gender === 2 ? '女' : '未知' }}</td>
              <td>{{ m.birthYear || '?' }} - {{ m.deathYear || '?' }}</td>
              <td>第{{ m.generation }}代</td>
              <td style="display:flex;gap:4px">
                <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px" @click="openEditMember(m)">编辑</button>
                <button class="btn btn-danger" style="padding:4px 8px;font-size:12px" @click="handleDeleteMember(m.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <h3>暂无成员</h3>
          <p>点击"添加成员"开始构建族谱</p>
        </div>
      </div>
    </div>

    <!-- 事迹审核 -->
    <div v-if="activeTab === 'stories'">
      <div class="card" v-for="s in pendingStories" :key="s.id" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div>
            <h3 class="card-title">{{ s.title }}</h3>
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">
              提交人: {{ s.submitterName }}
              <template v-if="s.storyYear"> · {{ s.storyYear }}年</template>
              <template v-if="s.category"> · {{ s.category }}</template>
            </p>
            <p v-if="s.content" style="font-size:14px;color:var(--text);margin-bottom:8px">{{ s.content }}</p>
          </div>
          <button class="btn btn-primary" style="flex-shrink:0" @click="openReview(s)">审核</button>
        </div>
      </div>
      <div v-if="pendingStories.length === 0" class="empty-state">
        <h3>暂无待审核事迹</h3>
      </div>
    </div>

    <!-- 成员编辑弹窗 -->
    <div v-if="showMemberModal" class="modal-overlay" @click.self="showMemberModal = false">
      <div class="modal-content">
        <h2>{{ editingMember ? '编辑成员' : '添加成员' }}</h2>
        <div class="form-group">
          <label>姓名</label>
          <input v-model="memberForm.name" class="form-input" placeholder="请输入姓名">
        </div>
        <div class="form-group">
          <label>性别</label>
          <select v-model="memberForm.gender" class="form-select">
            <option :value="0">未知</option>
            <option :value="1">男</option>
            <option :value="2">女</option>
          </select>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>出生年份</label>
            <input v-model.number="memberForm.birthYear" type="number" class="form-input" placeholder="如 1960">
          </div>
          <div class="form-group">
            <label>逝世年份</label>
            <input v-model.number="memberForm.deathYear" type="number" class="form-input" placeholder="留空表示健在">
          </div>
        </div>
        <div class="form-group">
          <label>辈分</label>
          <input v-model.number="memberForm.generation" type="number" class="form-input" placeholder="数字越小辈分越高">
        </div>
        <div class="form-group">
          <label>简介</label>
          <textarea v-model="memberForm.bio" class="form-textarea" placeholder="个人简介" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showMemberModal = false">取消</button>
          <button class="btn btn-primary" @click="saveMember">保存</button>
        </div>
      </div>
    </div>

    <!-- 关系添加弹窗 -->
    <div v-if="showRelModal" class="modal-overlay" @click.self="showRelModal = false">
      <div class="modal-content">
        <h2>添加亲属关系</h2>
        <div class="form-group">
          <label>人物 A</label>
          <select v-model.number="relForm.memberAId" class="form-select">
            <option :value="0">请选择</option>
            <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>人物 B</label>
          <select v-model.number="relForm.memberBId" class="form-select">
            <option :value="0">请选择</option>
            <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>关系类型</label>
          <select v-model="relForm.relationType" class="form-select">
            <option value="parent-child">亲子关系</option>
            <option value="spouse">配偶关系</option>
          </select>
        </div>
        <p v-if="relError" style="color:var(--danger);font-size:14px;margin-bottom:8px">{{ relError }}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showRelModal = false">取消</button>
          <button class="btn btn-primary" @click="saveRel">保存</button>
        </div>
      </div>
    </div>

    <!-- 审核弹窗 -->
    <div v-if="showReviewModal && reviewingStory" class="modal-overlay" @click.self="showReviewModal = false">
      <div class="modal-content">
        <h2>审核事迹</h2>
        <p style="font-weight:600;margin-bottom:8px">{{ reviewingStory.title }}</p>
        <p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">
          提交人: {{ reviewingStory.submitterName }}
        </p>
        <div class="form-group">
          <label>审核结果</label>
          <select v-model.number="reviewStatus" class="form-select">
            <option :value="1">通过</option>
            <option :value="2">驳回</option>
          </select>
        </div>
        <div class="form-group">
          <label>审核意见</label>
          <textarea v-model="reviewComment" class="form-textarea" placeholder="可选" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showReviewModal = false">取消</button>
          <button class="btn btn-primary" @click="handleReview">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>
