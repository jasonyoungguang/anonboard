<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import type { FamilyMember, FamilyRelationship } from '@/api/family'

const props = defineProps<{
  members: FamilyMember[]
  relationships: FamilyRelationship[]
  isAdmin?: boolean
}>()

const router = useRouter()
const svgRef = ref<SVGSVGElement>()
const selectedRootId = ref<number | null>(null)

// 持久化根成员选择
const ROOT_KEY = 'family_classic_root_id'

// ---- 树节点数据结构 ----
interface TreeNode {
  member: FamilyMember
  spouse: FamilyMember | null
  children: TreeNode[]
  depth: number
}

// ---- 构建祖先/子孙子树 ----
function buildGraphMaps() {
  const memberMap = new Map<number, FamilyMember>()
  const childMap = new Map<number, number[]>()  // parentId -> childIds
  const parentMap = new Map<number, number[]>()  // childId -> parentIds
  const spouseMap = new Map<number, number>()    // memberId -> spouseId

  for (const m of props.members) {
    memberMap.set(m.id, m)
  }

  for (const rel of props.relationships) {
    if (rel.relationType === 'parent-child') {
      // A=parent, B=child
      if (!childMap.has(rel.memberAId)) childMap.set(rel.memberAId, [])
      childMap.get(rel.memberAId)!.push(rel.memberBId)
      if (!parentMap.has(rel.memberBId)) parentMap.set(rel.memberBId, [])
      parentMap.get(rel.memberBId)!.push(rel.memberAId)
    } else if (rel.relationType === 'spouse') {
      spouseMap.set(rel.memberAId, rel.memberBId)
      spouseMap.set(rel.memberBId, rel.memberAId)
    }
  }

  return { memberMap, childMap, parentMap, spouseMap }
}

function buildDescendants(
  memberId: number,
  depth: number,
  memberMap: Map<number, FamilyMember>,
  childMap: Map<number, number[]>,
  parentMap: Map<number, number[]>,
  spouseMap: Map<number, number>
): TreeNode | null {
  const member = memberMap.get(memberId)
  if (!member) return null

  const spouseId = spouseMap.get(memberId)
  const spouse = spouseId ? memberMap.get(spouseId) || null : null

  const children: TreeNode[] = []
  const childIds = childMap.get(memberId) || []
  for (const childId of childIds) {
    const childNode = buildDescendants(childId, depth + 1, memberMap, childMap, parentMap, spouseMap)
    if (childNode) children.push(childNode)
  }

  return { member, spouse, children, depth }
}

function buildAncestors(
  memberId: number,
  depth: number,
  memberMap: Map<number, FamilyMember>,
  childMap: Map<number, number[]>,
  parentMap: Map<number, number[]>,
  spouseMap: Map<number, number>
): TreeNode | null {
  const member = memberMap.get(memberId)
  if (!member) return null

  const spouseId = spouseMap.get(memberId)
  const spouse = spouseId ? memberMap.get(spouseId) || null : null

  // 祖先树中，"children" 是父母们
  const parents: TreeNode[] = []
  const parentIds = parentMap.get(memberId) || []
  const usedParentIds = new Set<number>()

  for (const parentId of parentIds) {
    if (usedParentIds.has(parentId)) continue
    usedParentIds.add(parentId)

    // 检查当前父母的配偶是否也在父母列表中，如是则合并为一个节点
    const parentSpouseId = spouseMap.get(parentId)
    if (parentSpouseId != null && parentIds.includes(parentSpouseId)) {
      usedParentIds.add(parentSpouseId)
    }

    const parentNode = buildAncestors(parentId, depth - 1, memberMap, childMap, parentMap, spouseMap)
    if (parentNode) {
      parents.push(parentNode)
    }
  }

  return { member, spouse, children: parents, depth }
}

const nodeWidth = 140
const nodeHeight = 55
const vSpacing = 100  // 垂直层间距
const hSpacing = 200  // 水平节点间距

function renderTree() {
  if (!svgRef.value || !selectedRootId.value) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const { memberMap, childMap, parentMap, spouseMap } = buildGraphMaps()

  const rootMember = memberMap.get(selectedRootId.value)
  if (!rootMember) {
    svg.append('text')
      .attr('x', 400).attr('y', 200)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .text('请选择根成员')
    return
  }

  // 构建子树
  const descendantRoot = buildDescendants(selectedRootId.value, 0, memberMap, childMap, parentMap, spouseMap)
  const ancestorRoot = buildAncestors(selectedRootId.value, 0, memberMap, childMap, parentMap, spouseMap)

  const allNodes: { node: TreeNode; x: number; y: number }[] = []
  const allLinks: { source: { x: number; y: number }; target: { x: number; y: number } }[] = []

  // 布局子孙子树
  if (descendantRoot && descendantRoot.children.length > 0) {
    const hierarchy = d3.hierarchy(descendantRoot, d => d.children)
    const treeLayout = d3.tree<TreeNode>().nodeSize([hSpacing, vSpacing])
    treeLayout(hierarchy)
    layoutSubtree(hierarchy, 0, allNodes, allLinks)
  } else if (descendantRoot) {
    // 只有一个根节点（无子女）
    allNodes.push({ node: descendantRoot, x: 0, y: 0 })
  }

  // 布局祖先子树
  if (ancestorRoot && ancestorRoot.children.length > 0) {
    const hierarchy = d3.hierarchy(ancestorRoot, d => d.children)
    const treeLayout = d3.tree<TreeNode>().nodeSize([hSpacing, vSpacing])
    treeLayout(hierarchy)
    layoutSubtree(hierarchy, 0, allNodes, allLinks, true, true)  // invert=true, skipRoot=true
  }

  // 确定 SVG 尺寸
  const maxWidth = allNodes.length > 0
    ? Math.max(...allNodes.map(n => Math.abs(n.x))) * 2 + nodeWidth + 200
    : 800

  // 找到最大深度
  let minY = 0, maxY = 0
  for (const n of allNodes) {
    if (n.y < minY) minY = n.y
    if (n.y > maxY) maxY = n.y
  }

  const svgHeight = Math.max(400, (maxY - minY) + vSpacing * 2)
  const centerY = Math.abs(minY) + vSpacing

  svg.attr('viewBox', `0 0 ${maxWidth} ${svgHeight}`)

  const g = svg.append('g')
  const centerX = maxWidth / 2

  // 绘制连线
  for (const link of allLinks) {
    const sx = centerX + link.source.x
    const sy = centerY + link.source.y + nodeHeight / 2
    const tx = centerX + link.target.x
    const ty = centerY + link.target.y - nodeHeight / 2
    const midY = (sy + ty) / 2

    g.append('path')
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr('d', `M${sx},${sy} L${sx},${midY} L${tx},${midY} L${tx},${ty}`)
  }

  // 绘制节点
  for (const item of allNodes) {
    const dx = centerX + item.x - nodeWidth / 2
    const dy = centerY + item.y - nodeHeight / 2
    const node = item.node

    const nodeG = g.append('g').attr('transform', `translate(${dx},${dy})`)

    // 有配偶时按"男左女右"排列
    const hasSpouse = node.spouse != null
    const cardWidth = hasSpouse ? nodeWidth * 1.8 : nodeWidth

    const leftPerson = hasSpouse && node.member.gender === 2 && node.spouse!.gender === 1
      ? node.spouse! : node.member
    const rightPerson = hasSpouse && node.member.gender === 2 && node.spouse!.gender === 1
      ? node.member : (hasSpouse ? node.spouse! : null)

    const leftColor = leftPerson.gender === 1 ? '#dbeafe'
      : leftPerson.gender === 2 ? '#fce7f3' : '#f1f5f9'
    const borderColor = leftPerson.gender === 1 ? '#3b82f6'
      : leftPerson.gender === 2 ? '#ec4899' : '#cbd5e1'

    const card = nodeG.append('g')

    // 卡片背景
    card.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', cardWidth).attr('height', nodeHeight)
      .attr('rx', 8)
      .attr('fill', leftColor)
      .attr('stroke', borderColor)
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('click', () => { router.push(`/member/${node.member.id}`) })

    if (hasSpouse && rightPerson) {
      // 分隔线
      card.append('line')
        .attr('x1', nodeWidth).attr('y1', 8)
        .attr('x2', nodeWidth).attr('y2', nodeHeight - 8)
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 1)

      const rightColor = rightPerson.gender === 1 ? '#dbeafe'
        : rightPerson.gender === 2 ? '#fce7f3' : '#f8fafc'

      // 右侧人物区域
      card.append('rect')
        .attr('x', nodeWidth).attr('y', 0)
        .attr('width', nodeWidth * 0.8).attr('height', nodeHeight)
        .attr('rx', 8)
        .attr('fill', rightColor)
        .attr('stroke', 'none')
        .style('cursor', 'pointer')
        .on('click', () => { router.push(`/member/${rightPerson.id}`) })

      // 右侧姓名
      card.append('text')
        .attr('x', nodeWidth + nodeWidth * 0.4).attr('y', nodeHeight / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('fill', '#1e293b')
        .attr('font-size', '12px')
        .attr('font-weight', '500')
        .text(rightPerson.name)

      // 右侧年份
      const rightYear = rightPerson.birthYear
      if (rightYear != null) {
        card.append('text')
          .attr('x', nodeWidth + nodeWidth * 0.4).attr('y', nodeHeight / 2 + 12)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .attr('fill', '#94a3b8')
          .attr('font-size', '9px')
          .text(rightPerson.deathYear != null ? `${rightYear}-${rightPerson.deathYear}` : String(rightYear))
      }
    }

    // 左侧姓名
    card.append('text')
      .attr('x', nodeWidth / 2).attr('y', nodeHeight / 2)
      .attr('dy', '-0.2em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#1e293b')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .text(leftPerson.name)

    // 左侧年份
    const leftYear = leftPerson.birthYear
    if (leftYear != null) {
      card.append('text')
        .attr('x', nodeWidth / 2).attr('y', nodeHeight / 2 + 12)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px')
        .text(leftPerson.deathYear != null ? `${leftYear}-${leftPerson.deathYear}` : String(leftYear))
    }
  }

  // Zoom/Pan - 保存 zoom 行为实例以便重置
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.2, 5])
    .on('zoom', (event) => {
      g.attr('transform', `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`)
    })

  svg.call(zoom)

  // 自动适配视图（auto-fit）
  fitToView(svg, g, zoom)
}

/** 自动缩放+平移使树图适配 SVG 可视区域（使用 viewBox 内部坐标空间） */
function fitToView(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  zoom: d3.ZoomBehavior<SVGSVGElement, unknown>
) {
  const svgNode = svg.node()!
  const gNode = g.node()
  if (!gNode) return

  const bounds = gNode.getBBox()
  if (bounds.width === 0 || bounds.height === 0) return

  // 读取 viewBox 作为参考坐标空间
  const vb = svgNode.getAttribute('viewBox')
  if (!vb) return
  const [, , vbW, vbH] = vb.split(/\s+/).map(Number)
  if (vbW === 0 || vbH === 0) return

  const padding = 0.12
  const scaleX = vbW / (bounds.width * (1 + padding * 2))
  const scaleY = vbH / (bounds.height * (1 + padding * 2))
  const scale = Math.min(scaleX, scaleY, 1.5)

  const tx = vbW / 2 - (bounds.x + bounds.width / 2) * scale
  const ty = vbH / 2 - (bounds.y + bounds.height / 2) * scale

  svg.transition()
    .duration(400)
    .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))
}

/** 手动重置视图（用户点击按钮时调用） */
function resetView() {
  if (!svgRef.value) return
  const svg = d3.select(svgRef.value)
  const g = svg.select<SVGGElement>('g')
  if (g.empty()) return
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.2, 5])
    .on('zoom', (event) => {
      g.attr('transform', `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`)
    })
  svg.call(zoom)
  fitToView(svg, g, zoom)
}

function layoutSubtree(
  root: d3.HierarchyNode<TreeNode>,
  baseY: number,
  allNodes: { node: TreeNode; x: number; y: number }[],
  allLinks: { source: { x: number; y: number }; target: { x: number; y: number } }[],
  invert = false,
  skipRoot = false
) {
  root.each(node => {
    if (skipRoot && node.depth === 0) return
    const y = invert ? baseY - (node.depth) * vSpacing : baseY + (node.depth) * vSpacing
    allNodes.push({ node: node.data, x: node.x, y })
    if (node.parent) {
      const py = invert ? baseY - (node.parent.depth) * vSpacing : baseY + (node.parent.depth) * vSpacing
      allLinks.push({
        source: { x: node.parent.x, y: py },
        target: { x: node.x, y }
      })
    }
  })
}

onMounted(() => {
  // 恢复上次选择的根成员
  const saved = localStorage.getItem(ROOT_KEY)
  if (saved && props.members.find(m => m.id === Number(saved))) {
    selectedRootId.value = Number(saved)
  } else if (props.members.length > 0) {
    selectedRootId.value = props.members[0].id
  }
  if (selectedRootId.value) renderTree()
})

function onRootChange() {
  if (selectedRootId.value) {
    localStorage.setItem(ROOT_KEY, String(selectedRootId.value))
  }
  renderTree()
}

watch(() => [props.members, props.relationships], () => {
  if (selectedRootId.value) renderTree()
})
</script>

<template>
  <div class="classic-tree-container">
    <div class="graph-toolbar">
      <div class="form-group" style="margin-bottom:0;flex:1;max-width:300px">
        <select v-model="selectedRootId" class="form-select" @change="onRootChange">
          <option :value="null" disabled>选择根成员</option>
          <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>
      </div>
      <button class="btn btn-sm btn-outline-secondary" @click="resetView" title="重置缩放">
        适应视图
      </button>
    </div>
    <svg ref="svgRef" width="100%" :height="'600px'"></svg>
  </div>
</template>

<style scoped>
.classic-tree-container {
  width: 100%;
  overflow: auto;
}

.graph-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
</style>
