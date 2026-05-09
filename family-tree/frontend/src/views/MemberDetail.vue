<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Timeline from '@/components/Timeline.vue'
import { getMemberDetail, getFamilyTree, submitStory } from '@/api/family'
import type { FamilyMember, FamilyRelationship, FamilyStory } from '@/api/family'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const member = ref<FamilyMember | null>(null)
const relationships = ref<FamilyRelationship[]>([])
const stories = ref<FamilyStory[]>([])
const allMembers = ref<FamilyMember[]>([])

// 提交者身份 - localStorage 持久化
const SUBMITTER_KEY = 'anonboard_submitter_name'
const submitterName = ref(localStorage.getItem(SUBMITTER_KEY) || '')

// 故事提交表单
const showStoryForm = ref(false)
const storySubmitting = ref(false)
const storyForm = ref({
  title: '',
  content: '',
  storyYear: undefined as number | undefined,
  storyMonth: undefined as number | undefined,
  category: '生平'
})
const storyFormError = ref('')
const storyFormSuccess = ref('')
const categories = ['生平', '求学', '工作', '婚姻', '成就', '其他']

const memberMap = computed(() => {
  const map = new Map<number, FamilyMember>()
  allMembers.value.forEach(m => map.set(m.id, m))
  return map
})

function getRelativeMemberId(rel: FamilyRelationship): number {
  return rel.memberAId === member.value?.id ? rel.memberBId : rel.memberAId
}

function getRelativeName(rel: FamilyRelationship): string {
  return memberMap.value.get(getRelativeMemberId(rel))?.name || '未知'
}

function getRelativeGender(rel: FamilyRelationship): number {
  return memberMap.value.get(getRelativeMemberId(rel))?.gender || 0
}

function isParent(rel: FamilyRelationship): boolean {
  return rel.relationType === 'parent-child' && rel.memberAId !== member.value?.id
}

function isChild(rel: FamilyRelationship): boolean {
  return rel.relationType === 'parent-child' && rel.memberAId === member.value?.id
}

function getRelationLabel(rel: FamilyRelationship): string {
  if (rel.relationType === 'spouse') return '配偶'
  if (isParent(rel)) return getRelativeGender(rel) === 1 ? '父亲' : '母亲'
  if (isChild(rel)) return getRelativeGender(rel) === 1 ? '儿子' : '女儿'
  return '亲属'
}

async function loadData() {
  const id = Number(route.params.id)
  if (!id || isNaN(id)) {
    router.push('/')
    return
  }

  loading.value = true
  try {
    const [detailRes, treeRes] = await Promise.all([
      getMemberDetail(id, submitterName.value || undefined),
      getFamilyTree()
    ])
    member.value = detailRes.data.data?.member || null
    relationships.value = detailRes.data.data?.relationships || []
    stories.value = detailRes.data.data?.stories || []
    allMembers.value = treeRes.data.data?.members || []
  } catch (e) {
    console.error('加载成员详情失败:', e)
    member.value = null
    relationships.value = []
    stories.value = []
  } finally {
    loading.value = false
  }
}

function toggleStoryForm() {
  showStoryForm.value = !showStoryForm.value
  storyFormError.value = ''
  storyFormSuccess.value = ''
  if (!showStoryForm.value) {
    resetStoryForm()
  }
}

function resetStoryForm() {
  storyForm.value = {
    title: '',
    content: '',
    storyYear: undefined,
    storyMonth: undefined,
    category: '生平'
  }
}

function saveSubmitterName(name: string) {
  submitterName.value = name
  localStorage.setItem(SUBMITTER_KEY, name)
}

async function handleSubmitStory() {
  storyFormError.value = ''
  storyFormSuccess.value = ''

  if (!submitterName.value.trim()) {
    storyFormError.value = '请先输入您的姓名'
    return
  }

  if (!storyForm.value.title.trim()) {
    storyFormError.value = '请输入事迹标题'
    return
  }

  storySubmitting.value = true
  try {
    await submitStory({
      memberId: member.value!.id,
      title: storyForm.value.title.trim(),
      content: storyForm.value.content.trim() || undefined,
      storyYear: storyForm.value.storyYear,
      storyMonth: storyForm.value.storyMonth,
      category: storyForm.value.category,
      submitterName: submitterName.value.trim()
    })
    storyFormSuccess.value = '事迹已提交，待管理员审核后公开显示'
    saveSubmitterName(submitterName.value.trim())
    resetStoryForm()
    // 重新加载故事列表以显示刚提交的故事
    await loadData()
    setTimeout(() => {
      showStoryForm.value = false
      storyFormSuccess.value = ''
    }, 3000)
  } catch (e: any) {
    storyFormError.value = e?.response?.data?.message || '提交失败，请稍后重试'
  } finally {
    storySubmitting.value = false
  }
}

onMounted(loadData)
watch(() => route.params.id, loadData)
</script>

<template>
  <nav class="navbar">
    <div class="container">
      <router-link to="/" class="back-portal">&larr; 返回族谱首页</router-link>
      <div class="navbar-brand" v-if="member">{{ member.name }}</div>
    </div>
  </nav>

  <div class="container">
    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="!member" class="empty-state">
      <h3>成员不存在</h3>
      <p>该成员可能已被删除</p>
      <router-link to="/" class="btn btn-secondary" style="margin-top:12px;display:inline-block">返回族谱</router-link>
    </div>

    <template v-else>
      <div class="page-header">
        <div class="member-card" style="cursor:default">
          <div class="member-avatar">
            <img v-if="member.avatarUrl" :src="member.avatarUrl" class="avatar-img" alt="" />
            <span v-else>{{ member.name.charAt(0) }}</span>
          </div>
          <div class="member-info">
            <h1 style="font-size:24px">{{ member.name }}</h1>
            <p>
              {{ member.gender === 1 ? '男' : member.gender === 2 ? '女' : '未知' }}
              <template v-if="member.birthYear">
                &middot; {{ member.birthYear }}年生
                <template v-if="member.deathYear"> - {{ member.deathYear }}年卒</template>
              </template>
              <template v-if="member.generation"> &middot; 第{{ member.generation }}代</template>
            </p>
          </div>
        </div>
      </div>

      <div v-if="member.bio" class="card">
        <p style="color:var(--text-secondary);line-height:1.8">{{ member.bio }}</p>
      </div>

      <!-- 亲属关系 -->
      <div v-if="relationships.length > 0" class="card">
        <h3 class="card-title">亲属关系</h3>
        <div class="grid-2" style="margin-top:12px">
          <router-link
            v-for="rel in relationships"
            :key="rel.id"
            :to="`/member/${getRelativeMemberId(rel)}`"
            class="rel-item"
          >
            <span class="rel-label">{{ getRelationLabel(rel) }}</span>
            <span class="rel-name">{{ getRelativeName(rel) }} &rarr;</span>
          </router-link>
        </div>
      </div>

      <!-- 生平事迹 -->
      <div style="margin-top:24px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <h3 class="card-title" style="margin-bottom:0">生平事迹</h3>
          <button class="btn btn-primary" @click="toggleStoryForm" style="font-size:13px;padding:6px 14px">
            {{ showStoryForm ? '取消' : '+ 提交事迹' }}
          </button>
        </div>

        <!-- 故事提交表单 -->
        <div v-if="showStoryForm" class="card" style="margin-bottom:16px">
          <!-- 提交者身份 -->
          <div class="form-group">
            <label class="form-label">您的姓名 <span style="color:#ef4444">*</span></label>
            <input
              v-model="submitterName"
              type="text"
              class="form-input"
              placeholder="请输入您的姓名（将用于识别您提交的事迹）"
              @change="saveSubmitterName(submitterName.trim())"
            />
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:2">
              <label class="form-label">事迹标题 <span style="color:#ef4444">*</span></label>
              <input
                v-model="storyForm.title"
                type="text"
                class="form-input"
                placeholder="例如：考入北京大学"
              />
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">类别</label>
              <select v-model="storyForm.category" class="form-input">
                <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1">
              <label class="form-label">年份</label>
              <input
                v-model.number="storyForm.storyYear"
                type="number"
                class="form-input"
                placeholder="如 2000"
              />
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">月份</label>
              <input
                v-model.number="storyForm.storyMonth"
                type="number"
                class="form-input"
                min="1"
                max="12"
                placeholder="1-12"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">详细内容</label>
            <textarea
              v-model="storyForm.content"
              class="form-input"
              rows="4"
              placeholder="描述该事迹的具体内容..."
            ></textarea>
          </div>

          <div v-if="storyFormError" class="form-error">{{ storyFormError }}</div>
          <div v-if="storyFormSuccess" class="form-success">{{ storyFormSuccess }}</div>

          <button
            class="btn btn-primary"
            @click="handleSubmitStory"
            :disabled="storySubmitting"
            style="margin-top:8px"
          >
            {{ storySubmitting ? '提交中...' : '提交事迹' }}
          </button>
        </div>

        <Timeline v-if="stories.length > 0" :stories="stories" :showMemberLink="false" />
        <div v-else class="empty-state">
          <h3>暂无事迹记录</h3>
          <p>点击上方 "+ 提交事迹" 来添加生平事迹</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.rel-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--primary-bg, #f1f5f9);
  text-decoration: none;
  transition: background 0.15s;
}
.rel-item:hover {
  background: #e2e8f0;
}
.rel-label {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  flex-shrink: 0;
}
.rel-name {
  font-weight: 500;
  color: #1e293b;
}

.form-group {
  margin-bottom: 12px;
}
.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 4px;
}
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  color: #1e293b;
  background: #fff;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.form-input:focus {
  outline: none;
  border-color: var(--primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.form-row {
  display: flex;
  gap: 12px;
}
.form-error {
  color: #ef4444;
  font-size: 13px;
  margin-top: 4px;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 6px;
}
.form-success {
  color: #16a34a;
  font-size: 13px;
  margin-top: 4px;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 6px;
}

textarea.form-input {
  resize: vertical;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
</style>
