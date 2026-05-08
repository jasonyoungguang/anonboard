<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import FamilyTree from '@/components/FamilyTree.vue'
import Timeline from '@/components/Timeline.vue'
import { getFamilyTree, getAllStories } from '@/api/family'
import { useAuthStore } from '@/stores/auth'
import type { FamilyMember, FamilyRelationship, FamilyStory } from '@/api/family'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isLoggedIn())

const activeTab = ref<'tree' | 'timeline'>('tree')
const loading = ref(true)
const members = ref<FamilyMember[]>([])
const relationships = ref<FamilyRelationship[]>([])
const stories = ref<FamilyStory[]>([])

async function loadData() {
  loading.value = true
  try {
    const [treeRes, storiesRes] = await Promise.all([
      getFamilyTree(),
      getAllStories()
    ])
    members.value = treeRes.data.data?.members || []
    relationships.value = treeRes.data.data?.relationships || []
    stories.value = storiesRes.data.data || []
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
    lastLoadTime = Date.now()
  }
}

let lastLoadTime = 0
const POLL_INTERVAL = 30000
const MIN_RELOAD_GAP = 5000
let pollTimer: number | null = null

function handleFocus() {
  const now = Date.now()
  if (now - lastLoadTime > MIN_RELOAD_GAP) {
    loadData()
  }
}

onMounted(() => {
  loadData()
  pollTimer = window.setInterval(loadData, POLL_INTERVAL)
  window.addEventListener('focus', handleFocus)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  window.removeEventListener('focus', handleFocus)
})
</script>

<template>
  <nav class="navbar">
    <div class="container">
      <a href="/portal/" class="back-portal">← 返回门户</a>
      <span class="navbar-brand">族谱工具</span>
      <div class="navbar-links">
        <router-link to="/submit-story">提交事迹</router-link>
        <router-link to="/admin/login">管理后台</router-link>
      </div>
    </div>
  </nav>

  <div class="container">
    <div class="page-header">
      <h1>家族族谱</h1>
      <p>浏览家族成员关系与生平事迹</p>
    </div>

    <div class="tabs">
      <button :class="['tab-btn', { active: activeTab === 'tree' }]" @click="activeTab = 'tree'">
        家族树
      </button>
      <button :class="['tab-btn', { active: activeTab === 'timeline' }]" @click="activeTab = 'timeline'">
        时间线
      </button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <FamilyTree
      v-if="!loading && activeTab === 'tree'"
      :members="members"
      :relationships="relationships"
      :is-admin="isAdmin"
      @data-changed="loadData"
    />

    <Timeline
      v-if="!loading && activeTab === 'timeline'"
      :stories="stories"
    />
  </div>
</template>
