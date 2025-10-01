<template>
  <div>
    <q-tree
      :nodes="treeNodes"
      node-key="id"
      default-expand-all
    >
      <template v-slot:default-header="prop">
        <div class="row items-center q-py-xs">
          <div class="text-weight-bold">{{ prop.node.label }}</div>
          <q-badge v-if="prop.node.leader" color="secondary" class="q-ml-sm">
            {{ prop.node.leader }}
          </q-badge>
        </div>
        <div v-if="prop.node.description" class="text-grey-7 text-caption q-mt-xs">
          {{ prop.node.description }}
        </div>
      </template>
    </q-tree>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  treeData: {
    type: Array,
    required: true
  }
})

let nodeIdCounter = 0

function convertToQuasarTree(nodes) {
  return nodes.map(node => ({
    id: `node-${nodeIdCounter++}`,
    label: node.name,
    description: node.description,
    leader: node.leader,
    children: node.children && node.children.length > 0
      ? convertToQuasarTree(node.children)
      : undefined
  }))
}

const treeNodes = computed(() => {
  nodeIdCounter = 0
  return convertToQuasarTree(props.treeData)
})
</script>

<style scoped>
:deep(.q-tree__node-header) {
  padding: 8px;
}
</style>
