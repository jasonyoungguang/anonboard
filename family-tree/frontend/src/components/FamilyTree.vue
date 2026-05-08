<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { addRelative } from '@/api/family'
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
  const labels: Record<string, string> = { father: '父亲', mother: '母亲', son: '儿子', daughter: '女儿' }
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

  // 按辈分排序
  const sorted = [...props.members].sort((a, b) => (a.generation ?? 999) - (b.generation ?? 999))
  const rootGen = sorted[0].generation || 0

  // 找到最高辈分的人作为根
  let roots = sorted.filter(m => m.generation === rootGen)
  if (roots.length === 0) return null

  // 构建树
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

  // 通过 parent-child 关系链接
  for (const rel of props.relationships) {
    if (rel.relationType === 'parent-child') {
      // memberAId 是父母, memberBId 是子女
      const parent = nodeMap.get(rel.memberAId)
      const child = nodeMap.get(rel.memberBId)
      if (parent && child) {
        parent.children.push(child)
      }
    }
  }

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

  if (roots.length === 1) return nodeMap.get(roots[0].id) || null

  // 多个根节点：创建虚拟根节点聚合所有分支
  const virtualRoot: TreeNode = {
    id: 0,
    name: '',
    generation: rootGen - 1,
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

  // 计算树的高度
  function getDepth(node: TreeNode, depth = 0): number {
    if (!node.children || node.children.length === 0) return depth
    return Math.max(...node.children.map(c => getDepth(c, depth + 1)))
  }
  const depth = getDepth(treeData)
  const height = Math.max(400, (depth + 1) * 180)
  svgHeight.value = height

  svg.attr('viewBox', `0 0 ${width} ${height}`)

  const g = svg.append('g').attr('transform', 'translate(0, 40)')

  // 计算树布局
  const root = d3.hierarchy(treeData, d => d.children)
  const treeLayout = d3.tree<TreeNode>()
    .size([width - 200, (depth + 1) * 150])
    .separation((a, b) => {
      const aWide = !!(a.data as TreeNode).spouse
      const bWide = !!(b.data as TreeNode).spouse
      return (aWide && bWide) ? 2.5 : (aWide || bWide) ? 2.0 : 1.5
    })
  treeLayout(root)

  // 画连线（跳过虚拟根的连线）
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

  // 辅助函数：绘制一个卡片
  function drawCard(container: d3.Selection<SVGGElement, any, any, any>, xOffset: number, nodeData: TreeNode, isSpouse: boolean) {
    const card = container.append('g')
      .attr('transform', `translate(${xOffset}, 0)`)

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
  }

  // 画节点（跳过虚拟根节点）
  const nodeG = g.selectAll('g.node')
    .data(root.descendants().filter(d => d.data.id !== 0))
    .enter().append('g')
    .attr('transform', d => `translate(${d.x},${d.y})`)

  nodeG.each(function(d) {
    const data = d.data as TreeNode
    const el = d3.select(this)

    if (data.spouse) {
      // 夫妻并排：两个独立卡片，链接线从中间引出
      const coupleOffset = 70

      // 丈夫卡片（左侧）
      drawCard(el, -coupleOffset, data, false)

      // 妻子卡片（右侧）
      drawCard(el, +coupleOffset, data.spouse!, true)

      // 婚姻连接线
      const innerRight = -coupleOffset + nodeWidth / 2   // 丈夫卡片右边缘
      const innerLeft  = +coupleOffset - nodeWidth / 2   // 妻子卡片左边缘
      el.append('line')
        .attr('x1', innerRight)
        .attr('y1', 0)
        .attr('x2', innerLeft)
        .attr('y2', 0)
        .attr('stroke', '#eab308')
        .attr('stroke-width', 2)

      // 婚姻连接线中点的小圆点
      el.append('circle')
        .attr('cx', (innerRight + innerLeft) / 2)
        .attr('cy', 0)
        .attr('r', 2.5)
        .attr('fill', '#eab308')
    } else {
      // 单身：居中放置
      drawCard(el, 0, data, false)
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

.form-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: -4px;
  margin-bottom: 8px;
}
</style>
