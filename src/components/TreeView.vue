<template>
  <div>
    <!-- Search Input -->
    <q-input
      v-model="searchText"
      placeholder="Search service lines..."
      filled
      dense
      class="q-mb-md"
    >
      <template v-slot:prepend>
        <q-icon name="search" />
      </template>
      <template v-slot:append>
        <q-icon
          v-if="searchText"
          name="clear"
          class="cursor-pointer"
          @click="searchText = ''"
        />
      </template>
    </q-input>

    <!-- Results count when filtering -->
    <div v-if="searchText" class="q-mb-sm text-caption text-grey-7">
      <q-icon name="info" size="xs" class="q-mr-xs" />
      {{ filteredMatchCount }} result{{ filteredMatchCount !== 1 ? 's' : '' }} found
    </div>

    <q-tree
      :nodes="filteredTreeNodes"
      node-key="id"
      :expanded="expandedNodes"
      :selected="selectedNodeId"
      @update:selected="handleNodeClick"
      :no-nodes-label="searchText ? 'No matching service lines found' : 'No service lines available'"
    >
      <template v-slot:default-header="prop">
        <div
          class="tree-node-header"
          :class="{ 'is-selected': isNodeSelected(prop.node) }"
          :style="getNodeStyle(prop.node)"
        >
          <div class="row items-center q-py-xs">
            <div class="text-weight-bold node-label">{{ prop.node.label }}</div>
            <q-badge v-if="prop.node.leader" color="grey-7" class="q-ml-sm">
              {{ prop.node.leader }}
            </q-badge>
          </div>
          <div v-if="prop.node.description" class="text-grey-7 text-caption q-mt-xs">
            {{ prop.node.description }}
          </div>
        </div>
      </template>
    </q-tree>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  treeData: {
    type: Array,
    required: true
  },
  currentPath: {
    type: Array,
    default: () => []
  },
  topLevelColors: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['navigate'])

let nodeIdCounter = 0
const nodeIdMap = ref(new Map()) // Maps node names to IDs
const nodePathMap = ref(new Map()) // Maps node IDs to full path array
const selectedNodeId = ref(null)
const expandedNodes = ref([])
const searchText = ref('')
const filteredMatchCount = ref(0)

function convertToQuasarTree(nodes, parentPath = [], topLevelName = null) {
  return nodes.map(node => {
    const nodeId = `node-${nodeIdCounter++}`
    const nodePath = [...parentPath, node.name]
    const currentTopLevel = topLevelName || node.name

    // Store mappings for later lookup
    nodeIdMap.value.set(nodePath.join('|'), nodeId)
    nodePathMap.value.set(nodeId, nodePath)

    return {
      id: nodeId,
      label: node.name,
      description: node.description,
      leader: node.leader,
      level: parentPath.length,
      topLevelName: currentTopLevel,
      fullPath: nodePath,
      children: node.children && node.children.length > 0
        ? convertToQuasarTree(node.children, nodePath, currentTopLevel)
        : undefined
    }
  })
}

const treeNodes = computed(() => {
  nodeIdCounter = 0
  nodeIdMap.value = new Map()
  nodePathMap.value = new Map()
  return convertToQuasarTree(props.treeData)
})

// Check if a node matches the search text
function nodeMatchesSearch(node, searchLower) {
  if (!searchLower) return true

  const label = (node.label || '').toLowerCase()
  const description = (node.description || '').toLowerCase()
  const leader = (node.leader || '').toLowerCase()

  return label.includes(searchLower) ||
         description.includes(searchLower) ||
         leader.includes(searchLower)
}

// Filter tree recursively, keeping parents if children match
function filterTree(nodes, searchLower) {
  if (!searchLower) return nodes

  let matchCount = 0

  const filtered = nodes.reduce((acc, node) => {
    // Check if this node matches
    const nodeMatches = nodeMatchesSearch(node, searchLower)

    // Recursively filter children
    const filteredChildren = node.children
      ? filterTree(node.children, searchLower)
      : []

    // Include this node if it matches OR has matching children
    if (nodeMatches || filteredChildren.length > 0) {
      if (nodeMatches) matchCount++

      acc.push({
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children
      })
    }

    return acc
  }, [])

  filteredMatchCount.value = matchCount
  return filtered
}

const filteredTreeNodes = computed(() => {
  const search = searchText.value.trim().toLowerCase()
  return filterTree(treeNodes.value, search)
})

// Get node style based on level and top-level color
function getNodeStyle(node) {
  const topLevelColor = props.topLevelColors[node.topLevelName]

  if (!topLevelColor) {
    return {}
  }

  const isSelected = isNodeSelected(node)

  if (node.level === 0) {
    // Top level nodes - full color
    return {
      background: isSelected ? topLevelColor.hover : topLevelColor.bg,
      color: topLevelColor.text,
      borderLeft: `4px solid ${topLevelColor.text}`,
      padding: '8px 12px',
      borderRadius: '6px',
      marginBottom: '4px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }
  } else {
    // Child nodes - faded version of parent color
    const opacity = 1 - (node.level * 0.12)
    return {
      background: isSelected ? topLevelColor.hover + '80' : topLevelColor.bg + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
      color: topLevelColor.text,
      borderLeft: `3px solid ${topLevelColor.text}40`,
      padding: '6px 10px',
      borderRadius: '4px',
      marginBottom: '2px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }
  }
}

function isNodeSelected(node) {
  if (!props.currentPath || props.currentPath.length === 0) {
    return false
  }

  // Check if this node's path matches the current path
  const currentPathNames = props.currentPath.map(p => p.name)
  return node.fullPath.join('|') === currentPathNames.join('|')
}

function handleNodeClick(nodeId) {
  if (!nodeId) return

  const nodePath = nodePathMap.value.get(nodeId)
  if (nodePath) {
    selectedNodeId.value = nodeId
    emit('navigate', nodePath)
  }
}

// Watch for currentPath changes and update selection/expansion
watch(() => props.currentPath, (newPath) => {
  // Don't update expansion if user is searching
  if (searchText.value.trim()) return

  if (!newPath || newPath.length === 0) {
    selectedNodeId.value = null
    expandedNodes.value = []
    return
  }

  // Build path string and find matching node
  const pathNames = newPath.map(p => p.name)
  const pathString = pathNames.join('|')
  const nodeId = nodeIdMap.value.get(pathString)

  if (nodeId) {
    selectedNodeId.value = nodeId

    // Expand all parent nodes
    const toExpand = []
    for (let i = 1; i <= pathNames.length; i++) {
      const partialPath = pathNames.slice(0, i).join('|')
      const parentId = nodeIdMap.value.get(partialPath)
      if (parentId) {
        toExpand.push(parentId)
      }
    }
    expandedNodes.value = toExpand
  }
}, { deep: true, immediate: true })

// Auto-expand all nodes when searching
function getAllNodeIds(nodes) {
  const ids = []
  nodes.forEach(node => {
    ids.push(node.id)
    if (node.children) {
      ids.push(...getAllNodeIds(node.children))
    }
  })
  return ids
}

watch(searchText, (newSearch) => {
  if (newSearch.trim()) {
    // Expand all nodes when searching
    expandedNodes.value = getAllNodeIds(filteredTreeNodes.value)
  } else {
    // Restore previous expansion state when clearing search
    expandedNodes.value = []
  }
})
</script>

<style scoped>
.tree-node-header {
  width: 100%;
  transition: all 0.2s ease;
}

.tree-node-header:hover {
  filter: brightness(0.95);
}

.tree-node-header.is-selected {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.node-label {
  font-size: 0.9rem;
  line-height: 1.3;
}

:deep(.q-tree__node-header) {
  padding: 2px !important;
}

:deep(.q-tree__node) {
  margin-bottom: 4px;
}

:deep(.q-tree__node-header-content) {
  width: 100%;
}

:deep(.q-tree__arrow) {
  opacity: 0.6;
}

:deep(.q-tree__node--selected > .q-tree__node-header) {
  background: transparent !important;
}
</style>
