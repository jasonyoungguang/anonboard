<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { addRelative, deleteMember } from '@/api/family'
import type { FamilyMember, FamilyRelationship } from '@/api/family'

const props = defineProps<{
  members: FamilyMember[]
  relationships: FamilyRelationship[]
  isAdmin?: boolean
}>()

const emit = defineEmits<{ dataChanged: [] }>()

const router = useRouter()
const svgRef = ref<SVGSVGElement>()
const svgHeight = ref(500)

// 管理模式状态
const menuTarget = ref<TreeNode | null>(null)
const showContextMenu = ref(false)
const menuX = ref(0)
const menuY = ref(0)

const showRelativeModal = ref(false)
const relativeType = ref('')
const relativeLabel = ref('')
const relativeForm = ref({ name: '', birthYear: null as number | null, deathYear: null as number | null })
const saving = ref(false)
const deleting = ref(false)
const showDeleteConfirm = ref(false)

async function handleDelete() {
  if (!menuTarget.value) return
  showContextMenu.value = false
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!menuTarget.value) return
  deleting.value = true
  try {
    await deleteMember(menuTarget.value.id)
    showDeleteConfirm.value = false
    menuTarget.value = null
    emit('dataChanged')
  } catch (e) {
    console.error('删除失败:', e)
  } finally {
    deleting.value = false
  }
}

function handleNodeClick(event: MouseEvent, treeNode: TreeNode) {
  if (!treeNode.id) return
  if (!props.isAdmin) {
    router.push(`/member/${treeNode.id}`)
    return
  }
  menuTarget.value = treeNode
  menuX.value = event.clientX
  menuY.value = event.clientY
  showContextMenu.value = true
  event.stopPropagation()
}

function openAddRelative(type: string) {
  showContextMenu.value = false
  relativeType.value = type
  const labels: Record<string, string> = { father: '父亲', mother: '母亲', son: '儿子', daughter: '女儿', wife: '妻子', husband: '丈夫' }
  relativeLabel.value = labels[type] || type
  relativeForm.value = { name: '', birthYear: null, deathYear: null }
  showRelativeModal.value = true
}

function closeContextMenu() {
  showContextMenu.value = false
  menuTarget.value = null
}

async function saveRelative() {
  if (!menuTarget.value) return
  saving.value = true
  try {
    await addRelative(menuTarget.value.id, {
      relationType: relativeType.value,
      name: relativeForm.value.name,
      birthYear: relativeForm.value.birthYear ?? undefined,
      deathYear: relativeForm.value.deathYear ?? undefined
    })
    showRelativeModal.value = false
    menuTarget.value = null
    emit('dataChanged')
  } catch (e) {
    console.error('添加亲属失败:', e)
  } finally {
    saving.value = false
  }
}

interface TreeNode {
  id: number
  name: string
  generation: number
  gender: number
  children: TreeNode[]
  spouse?: TreeNode
}

function buildTree(): TreeNode | null {
  if (props.members.length === 0) return null

  // 构建节点映射
  const nodeMap = new Map<number, TreeNode>()
  for (const m of props.members) {
    nodeMap.set(m.id, {
      id: m.id,
      name: m.name,
      generation: m.generation ?? 0,
      gender: m.gender,
      children: []
    })
  }

  // 通过 parent-child 关系链接，同时记录哪些节点是子女
  const childSet = new Set<number>()
  for (const rel of props.relationships) {
    if (rel.relationType === 'parent-child') {
      // memberAId 是父母, memberBId 是子女
      const parent = nodeMap.get(rel.memberAId)
      const child = nodeMap.get(rel.memberBId)
      if (parent && child) {
        parent.children.push(child)
        childSet.add(child.id)
      }
    }
  }

  // 根节点 = 没有父节点的节点
  let roots = Array.from(nodeMap.values()).filter(n => !childSet.has(n.id))
  if (roots.length === 0) return null

  // 添加配偶信息
  for (const rel of props.relationships) {
    if (rel.relationType === 'spouse') {
      const a = nodeMap.get(rel.memberAId)
      const b = nodeMap.get(rel.memberBId)
      if (a) a.spouse = b || undefined
      if (b) b.spouse = a || undefined
    }
  }

  // 通过共享子节点自动推断配偶关系（适用于手动分别添加父母的情况）
  const allNodes = Array.from(nodeMap.values())
  for (let i = 0; i < allNodes.length; i++) {
    for (let j = i + 1; j < allNodes.length; j++) {
      const a = allNodes[i]
      const b = allNodes[j]
      if (a.spouse || b.spouse) continue // 已有配偶关系则不覆盖
      if (a.gender === b.gender) continue // 同性不推断为配偶
      const shared = a.children.filter(c => b.children.some(bc => bc.id === c.id))
      if (shared.length > 0) {
        a.spouse = b
        b.spouse = a
      }
    }
  }

  // 清理配偶间共享的子节点，保留在父亲（gender=1）下
  for (const node of nodeMap.values()) {
    if (node.spouse && node.gender === 2) {
      // 女性配偶：移除与丈夫共享的子节点
      node.children = node.children.filter(c =>
        !node.spouse!.children.some(sc => sc.id === c.id)
      )
    }
  }

  // 如果配偶双方都是根节点，合并所有子节点到一方并移除另一方
  if (roots.length > 1) {
    const spouseRemoval = new Set<number>()
    const processed = new Set<number>()

    for (const r of roots) {
      if (processed.has(r.id)) continue
      const node = nodeMap.get(r.id)
      if (!node) continue

      // 找到也在 roots 中的配偶
      const spouseRoot = roots.find(rr => rr.id === node.spouse?.id && !processed.has(rr.id))
      if (!spouseRoot) {
        processed.add(r.id)
        continue
      }

      const spouseNode = nodeMap.get(spouseRoot.id)
      if (!spouseNode) { processed.add(r.id); continue }

      // 选择有子节点的作为主根（优先男性）
      const primary = node.gender === 1 ? node : spouseNode
      const secondary = node.gender === 1 ? spouseNode : node
      processed.add(primary.id)
      processed.add(secondary.id)

      // 将次要方独有的子节点合并到主根
      for (const child of secondary.children) {
        if (!primary.children.some(c => c.id === child.id)) {
          primary.children.push(child)
        }
      }
      secondary.children = []
      spouseRemoval.add(secondary.id)
    }

    if (spouseRemoval.size > 0) {
      roots = roots.filter(r => !spouseRemoval.has(r.id))
    }
  }

  // 过滤掉作为配偶重复的根节点（优先保留有子节点的）
  if (roots.length > 1) {
    const spouseOnlyIds = new Set<number>()
    for (const r of roots) {
      const node = nodeMap.get(r.id)
      if (node?.spouse && roots.some(rr => rr.id === node.spouse!.id)) {
        if (node.children.length === 0) spouseOnlyIds.add(r.id)
      }
    }
    if (spouseOnlyIds.size > 0 && spouseOnlyIds.size < roots.length) {
      roots = roots.filter(r => !spouseOnlyIds.has(r.id))
    }
  }

  // 移除配偶已在树中但不在根中的孤立配偶根（避免双重显示）
  if (roots.length > 1) {
    roots = roots.filter(r => {
      const node = nodeMap.get(r.id)
      if (!node?.spouse) return true
      // 如果配偶在 roots 中，让已有的配偶合并逻辑处理
      if (roots.some(rr => rr.id === node.spouse!.id)) return true
      // 配偶在树中（非根） → 此节点仅作配偶卡片展示，不作为独立根
      return false
    })
  }

  if (roots.length === 1) return nodeMap.get(roots[0].id) || null

  // 多个根节点：创建虚拟根节点聚合所有分支
  const minRootGen = Math.min(...roots.map(r => r.generation))
  const virtualRoot: TreeNode = {
    id: 0,
    name: '',
    generation: minRootGen - 1,
    gender: 0,
    children: []
  }
  for (const r of roots) {
    const node = nodeMap.get(r.id)
    if (node) virtualRoot.children.push(node)
  }
  return virtualRoot
}

function renderTree() {
  if (!svgRef.value) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const treeData = buildTree()
  if (!treeData) {
    svg.append('text')
      .attr('x', 300)
      .attr('y', 100)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .text('暂无家族数据')
    return
  }

  const width = 1200
  const nodeHeight = 60
  const nodeWidth = 120
  const rulerWidth = 80
  const rulerStartY = 40

  // ---- 年份数据 ----
  const birthYearMap = new Map<number, number>()
  for (const m of props.members) {
    if (m.birthYear != null) birthYearMap.set(m.id, m.birthYear)
  }

  // ---- 用 D3 计算 X 布局 ----
  const root = d3.hierarchy(treeData, d => d.children)
  const treeLayout = d3.tree<TreeNode>()
    .size([width - 200, 100]) // Y 会被覆盖，这里仅要 X
    .separation((a, b) => {
      const aWide = !!(a.data as TreeNode).spouse
      const bWide = !!(b.data as TreeNode).spouse
      return (aWide && bWide) ? 2.5 : (aWide || bWide) ? 2.0 : 1.5
    })
  treeLayout(root)

  // ---- 推断缺失的出生年份（从上到下） ----
  function estimateYear(d: d3.HierarchyNode<TreeNode>): number {
    const id = d.data.id
    if (birthYearMap.has(id)) return birthYearMap.get(id)!

    let minChildYear = Infinity
    if (d.children) {
      for (const child of d.children) {
        const cy = estimateYear(child)
        if (cy < minChildYear) minChildYear = cy
      }
    }
    if (minChildYear < Infinity) return minChildYear - 25

    // 无子节点、无出生年份：按辈分推算
    return 1990 - d.data.generation * 25
  }

  // 估计配偶的出生年份
  function estimateSpouseYear(spouseData: TreeNode, mainYear: number): number {
    if (birthYearMap.has(spouseData.id)) return birthYearMap.get(spouseData.id)!
    // 无出生年份，用主节点的预估年份
    return mainYear
  }

  // 收集所有节点年份（含配偶）
  const visibleNodes = root.descendants().filter(d => d.data.id !== 0)
  const allYears: number[] = []
  for (const d of visibleNodes) {
    const my = estimateYear(d)
    allYears.push(my)
    const spouse = (d.data as TreeNode).spouse
    if (spouse) {
      allYears.push(estimateSpouseYear(spouse, my))
    }
  }
  let minYear = Math.min(...allYears) - 5
  let maxYear = Math.max(...allYears) + 5
  const yearRange = maxYear - minYear

  const yearScale = Math.max(6, Math.min(12, (1200 - rulerStartY - 60) / yearRange))
  const contentHeight = yearRange * yearScale + rulerStartY + 60
  svgHeight.value = contentHeight
  svg.attr('viewBox', `0 0 ${width} ${contentHeight}`)

  function yearToY(year: number): number {
    return rulerStartY + (maxYear - year) * yearScale
  }

  // 覆写 Y 坐标
  visibleNodes.forEach(d => { d.y = yearToY(estimateYear(d)) })

  // ---- 年份尺子 ----
  const rulerG = svg.append('g').attr('transform', `translate(${rulerWidth - 15}, 0)`)

  // 主线
  rulerG.append('line')
    .attr('x1', 0).attr('y1', yearToY(maxYear + 5))
    .attr('x2', 0).attr('y2', yearToY(minYear - 5))
    .attr('stroke', '#cbd5e1')
    .attr('stroke-width', 1.5)

  // 刻度与标签，自动选择合适步长
  const tickStep = yearRange > 100 ? 20 : yearRange > 50 ? 10 : 5
  for (let y = Math.ceil(minYear / tickStep) * tickStep; y <= maxYear; y += tickStep) {
    const py = yearToY(y)
    const isMajor = y % (tickStep * 2) === 0
    rulerG.append('line')
      .attr('x1', 0).attr('y1', py)
      .attr('x2', isMajor ? 12 : 6).attr('y2', py)
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', isMajor ? 1.5 : 0.8)

    // 水平参考线
    svg.append('line')
      .attr('x1', rulerWidth).attr('y1', py)
      .attr('x2', width).attr('y2', py)
      .attr('stroke', isMajor ? '#e2e8f0' : '#f1f5f9')
      .attr('stroke-width', isMajor ? 1 : 0.5)

    if (isMajor) {
      rulerG.append('text')
        .attr('x', 16).attr('y', py)
        .attr('dy', '0.35em')
        .attr('fill', '#64748b')
        .attr('font-size', '11px')
        .attr('font-family', 'monospace')
        .text(String(y))
    }
  }

  // ---- 树连线与节点 ----
  const g = svg.append('g').attr('transform', `translate(${rulerWidth - 5}, 0)`)

  // 连线
  g.selectAll('path.link')
    .data(root.links().filter((l: any) => l.source.data.id !== 0))
    .enter().append('path')
    .attr('class', 'link')
    .attr('fill', 'none')
    .attr('stroke', '#e2e8f0')
    .attr('stroke-width', 2)
    .attr('d', (d: any) => {
      const sx = d.source.x
      const sy = d.source.y
      const tx = d.target.x
      const ty = d.target.y
      return `M${sx},${sy} L${sx},${(sy + ty) / 2} L${tx},${(sy + ty) / 2} L${tx},${ty}`
    })

  // 辅助函数：绘制卡片
  function drawCard(container: d3.Selection<SVGGElement, any, any, any>, xOffset: number, yOffset: number, nodeData: TreeNode) {
    const card = container.append('g')
      .attr('transform', `translate(${xOffset}, ${yOffset})`)

    card.append('rect')
      .attr('x', -nodeWidth / 2)
      .attr('y', -nodeHeight / 2)
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 8)
      .attr('fill', nodeData.gender === 1 ? '#dbeafe' : nodeData.gender === 2 ? '#fce7f3' : '#f1f5f9')
      .attr('stroke', nodeData.gender === 1 ? '#3b82f6' : nodeData.gender === 2 ? '#ec4899' : '#cbd5e1')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('click', (event: MouseEvent) => {
        handleNodeClick(event, nodeData)
      })

    card.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#1e293b')
      .attr('font-size', '13px')
      .attr('font-weight', '600')
      .text(nodeData.name)

    // 显示出生年份小字
    if (nodeData.id && birthYearMap.has(nodeData.id)) {
      card.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.6em')
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px')
        .text(String(birthYearMap.get(nodeData.id)!))
    }
  }

  // 画节点
  const nodeG = g.selectAll('g.node')
    .data(root.descendants().filter(d => d.data.id !== 0))
    .enter().append('g')
    .attr('transform', d => `translate(${d.x},${d.y})`)

  nodeG.each(function(d) {
    const data = d.data as TreeNode
    const el = d3.select(this)

    if (data.spouse) {
      const coupleOffset = 70
      const mainYear = estimateYear(d)
      const spouseYear = estimateSpouseYear(data.spouse, mainYear)
      const spouseYOffset = yearToY(spouseYear) - yearToY(mainYear)

      drawCard(el, -coupleOffset, 0, data)
      drawCard(el, +coupleOffset, spouseYOffset, data.spouse!)

      const innerRight = -coupleOffset + nodeWidth / 2
      const innerLeft  = +coupleOffset - nodeWidth / 2
      el.append('line')
        .attr('x1', innerRight).attr('y1', 0)
        .attr('x2', innerLeft).attr('y2', spouseYOffset)
        .attr('stroke', '#eab308')
        .attr('stroke-width', 2)

      el.append('circle')
        .attr('cx', (innerRight + innerLeft) / 2)
        .attr('cy', spouseYOffset / 2)
        .attr('r', 2.5)
        .attr('fill', '#eab308')
    } else {
      drawCard(el, 0, 0, data)
    }
  })
}

onMounted(renderTree)
watch(() => [props.members, props.relationships], renderTree, { deep: true })
</script>

<template>
  <div class="family-tree-container">
    <svg ref="svgRef" width="100%" :height="svgHeight + 'px'"></svg>

    <!-- 操作菜单 -->
    <div v-if="showContextMenu" class="ctx-menu-overlay" @click="closeContextMenu">
      <div class="ctx-menu" :style="{ left: menuX + 'px', top: menuY + 'px' }">
        <div class="ctx-menu-header">{{ menuTarget?.name }}</div>
        <button class="ctx-menu-item" @click.stop="router.push(`/member/${menuTarget?.id}`)">
          查看详情
        </button>
        <div class="ctx-menu-divider"></div>
        <button class="ctx-menu-item" @click.stop="openAddRelative('father')">添加父亲</button>
        <button class="ctx-menu-item" @click.stop="openAddRelative('mother')">添加母亲</button>
        <button class="ctx-menu-item" @click.stop="openAddRelative('son')">添加儿子</button>
        <button class="ctx-menu-item" @click.stop="openAddRelative('daughter')">添加女儿</button>
        <div class="ctx-menu-divider"></div>
        <button v-if="menuTarget?.gender === 1" class="ctx-menu-item" @click.stop="openAddRelative('wife')">添加妻子</button>
        <button v-if="menuTarget?.gender === 2" class="ctx-menu-item" @click.stop="openAddRelative('husband')">添加丈夫</button>
        <div class="ctx-menu-divider"></div>
        <button class="ctx-menu-item ctx-menu-item-danger" @click.stop="handleDelete">删除</button>
      </div>
    </div>

    <!-- 删除确认 Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content" style="max-width: 360px; text-align: center;">
        <h2 style="margin-bottom: 12px;">确认删除</h2>
        <p style="color: var(--text-secondary); margin-bottom: 8px;">
          确定要删除 <strong>{{ menuTarget?.name }}</strong> 吗？
        </p>
        <p style="color: var(--danger); font-size: 13px; margin-bottom: 20px;">
          此操作不可撤销，相关的所有关系也会同步删除。
        </p>
        <div class="modal-actions" style="justify-content: center;">
          <button class="btn btn-secondary" @click="showDeleteConfirm = false">取消</button>
          <button class="btn btn-danger" :disabled="deleting" @click="confirmDelete">
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 添加亲属 Modal -->
    <div v-if="showRelativeModal" class="modal-overlay" @click.self="showRelativeModal = false">
      <div class="modal-content">
        <h2>为 {{ menuTarget?.name }} 添加{{ relativeLabel }}</h2>
        <div class="form-group">
          <label class="form-label">姓名</label>
          <input v-model="relativeForm.name" class="form-input" placeholder="请输入姓名" />
        </div>
        <div class="form-group">
          <label class="form-label">出生年份</label>
          <input v-model.number="relativeForm.birthYear" type="number" class="form-input" placeholder="可选" />
        </div>
        <div class="form-group">
          <label class="form-label">逝世年份</label>
          <input v-model.number="relativeForm.deathYear" type="number" class="form-input" placeholder="留空表示健在" />
        </div>
        <p class="form-hint">辈分和关系将自动确定</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showRelativeModal = false">取消</button>
          <button class="btn btn-primary" :disabled="!relativeForm.name || saving" @click="saveRelative">
            {{ saving ? '保存中...' : '确认' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ctx-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.ctx-menu {
  position: fixed;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 150px;
  padding: 4px 0;
  z-index: 1000;
}

.ctx-menu-header {
  padding: 8px 16px;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

.ctx-menu-item {
  display: block;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: #334155;
}

.ctx-menu-item:hover {
  background: #f1f5f9;
}

.ctx-menu-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

.ctx-menu-item-danger {
  color: #ef4444;
}

.ctx-menu-item-danger:hover {
  background: #fef2f2;
}

.form-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: -4px;
  margin-bottom: 8px;
}
</style>
