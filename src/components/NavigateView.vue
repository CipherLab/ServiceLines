<template>
  <div>
    <q-breadcrumbs v-if="currentPath.length > 0" class="q-mb-md">
      <q-breadcrumbs-el label="Home" icon="home" @click="navigateToRoot" />
      <q-breadcrumbs-el
        v-for="(item, index) in currentPath"
        :key="index"
        :label="item.name"
        @click="navigateToLevel(index)"
      />
    </q-breadcrumbs>



    <!-- Max depth message -->
    <q-banner v-if="isAtMaxDepth" class="bg-grey-3 q-mb-md" rounded>
      <template v-slot:avatar>
        <q-icon name="info" color="primary" />
      </template>
      You've reached the deepest level (L4). No further sub-categories available.
    </q-banner>

    <div class="button-grid" v-if="!isAtMaxDepth || currentOptions.length > 0">
      <q-btn
        v-for="option in currentOptions"
        :key="option"
        class="service-btn"
        :class="currentLevel === 0 ? 'top-level-btn' : 'child-level-btn'"
        :style="getButtonStyle(option)"
        @click="selectOption(option)"
        :disable="isAtMaxDepth"
        no-caps
        stack
      >
        <q-icon
          v-if="currentLevel === 0"
          :name="getIcon(option)"
          size="32px"
          class="q-mb-sm"
        />
        <div class="btn-label">{{ option }}</div>
      </q-btn>
      <q-btn
        v-if="!isAtMaxDepth"
        class="service-btn add-btn"
        @click="showAddDialog = true"
        no-caps
        stack
      >
        <q-icon name="add_circle_outline" size="32px" class="q-mb-sm" />
        <div class="btn-label">Add New</div>
      </q-btn>
    </div>
    <!-- Current selection info card -->
    <q-card v-if="currentPath.length > 0" class="q-mb-md" flat bordered>
      <DescriptionThread
        :title="currentPath[currentPath.length - 1].name"
        :leader="currentLeader"
        :path-key="pathKey"
      />
    </q-card>
    <q-dialog v-model="showAddDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add New Service Line</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="newServiceLine.name"
            label="Name"
            filled
            dense
            class="q-mb-md"
          />
          <q-input
            v-model="newServiceLine.description"
            label="Description (Optional)"
            filled
            dense
            type="textarea"
            rows="3"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup :disable="isAddingServiceLine" />
          <q-btn
            flat
            label="Add"
            color="primary"
            @click="addServiceLine"
            :loading="isAddingServiceLine"
            :disable="isAddingServiceLine"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import DescriptionThread from './DescriptionThread.vue'

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  externalPath: {
    type: Array,
    default: null
  }
})

const emit = defineEmits(['add-service-line', 'path-changed'])

const $q = useQuasar()

// Load currentPath from localStorage on mount
function loadPersistedPath() {
  const stored = localStorage.getItem('navigation_current_path')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error('[NavigateView] Failed to parse persisted path:', e)
      return []
    }
  }
  return []
}

const currentPath = ref(loadPersistedPath())
const showAddDialog = ref(false)
const isAddingServiceLine = ref(false)
const newServiceLine = ref({
  name: '',
  description: ''
})

// Icon mapping for top level service lines
const iconMap = {
  'Business Applications': 'business',
  'Cloud & Infrastructure': 'cloud',
  'Data & Analytics': 'bar_chart',
  'Security': 'security',
  'Digital Experience': 'devices',
  'AI & Automation': 'smart_toy',
  'Integration': 'hub',
  'default': 'folder'
}

// Color palette for top levels (light, modern colors)
const colorPalette = [
  { bg: '#E3F2FD', text: '#1565C0', hover: '#BBDEFB' }, // Blue
  { bg: '#F3E5F5', text: '#6A1B9A', hover: '#E1BEE7' }, // Purple
  { bg: '#E8F5E9', text: '#2E7D32', hover: '#C8E6C9' }, // Green
  { bg: '#FFF3E0', text: '#E65100', hover: '#FFE0B2' }, // Orange
  { bg: '#FCE4EC', text: '#C2185B', hover: '#F8BBD0' }, // Pink
  { bg: '#E0F2F1', text: '#00695C', hover: '#B2DFDB' }, // Teal
  { bg: '#F9FBE7', text: '#827717', hover: '#F0F4C3' }, // Lime
  { bg: '#EFEBE9', text: '#4E342E', hover: '#D7CCC8' }, // Brown
]

// Compute path key for storage
const pathKey = computed(() => {
  return currentPath.value.map(p => p.name).join('__')
})

// Current level in the hierarchy
const currentLevel = computed(() => {
  return currentPath.value.length
})

// Check if we're at maximum depth (L4)
const isAtMaxDepth = computed(() => {
  return currentPath.value.length >= 4
})

// Get current leader
const currentLeader = computed(() => {
  if (currentPath.value.length === 0) return ''

  const level = currentPath.value.length - 1
  const leaderKey = level === 0 ? 'Service Line (L1) Leader' :
                    level === 1 ? 'Capability (L2) Leader' :
                    level === 2 ? 'Solution Set (L3) Leader' : 'Sub-function Leader'

  let filtered = props.data

  // Filter based on current path
  for (let i = 0; i < currentPath.value.length; i++) {
    const pathLevel = i === 0 ? 'Service Line (L1)' :
                     i === 1 ? 'Capability (L2)' :
                     i === 2 ? 'Solution Set (L3)' : 'Sub-function (L4)'
    filtered = filtered.filter(row => row[pathLevel] === currentPath.value[i].name)
  }

  // Get the leader from the first matching row
  if (filtered.length > 0) {
    return filtered[0][leaderKey] || ''
  }

  return ''
})

const currentOptions = computed(() => {
  const level = currentPath.value.length
  const levelKey = level === 0 ? 'Service Line (L1)' :
                  level === 1 ? 'Capability (L2)' :
                  level === 2 ? 'Solution Set (L3)' : 'Sub-function (L4)'

  let filtered = props.data

  // Filter based on current path
  for (let i = 0; i < currentPath.value.length; i++) {
    const pathLevel = i === 0 ? 'Service Line (L1)' :
                     i === 1 ? 'Capability (L2)' :
                     i === 2 ? 'Solution Set (L3)' : 'Sub-function (L4)'
    filtered = filtered.filter(row => row[pathLevel] === currentPath.value[i].name)
  }

  // Get unique values for next level
  const values = filtered
    .map(row => row[levelKey])
    .filter(val => val && val !== '—')
    .filter((val, index, self) => self.indexOf(val) === index)
    .sort()

  return values
})

function getIcon(name) {
  return iconMap[name] || iconMap.default
}

function getColorForTopLevel(name) {
  // Hash the name to get a consistent color
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colorPalette.length
  return colorPalette[index]
}

function getButtonStyle(option) {
  if (currentLevel.value === 0) {
    // Top level - assign color based on name
    const color = getColorForTopLevel(option)
    return {
      background: color.bg,
      color: color.text,
      border: `2px solid ${color.text}20`
    }
  } else {
    // Child levels - inherit color from top level with increasing opacity
    const topLevelName = currentPath.value[0]?.name
    if (topLevelName) {
      const color = getColorForTopLevel(topLevelName)
      const opacity = 1 - (currentLevel.value * 0.15) // Fade as we go deeper
      return {
        background: `${color.bg}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
        color: color.text,
        border: `2px solid ${color.text}20`
      }
    }
  }
  return {}
}

function selectOption(option) {
  const pathItem = {
    name: option,
    level: currentPath.value.length
  }

  // Store color info if this is top level
  if (currentPath.value.length === 0) {
    pathItem.color = getColorForTopLevel(option)
  } else if (currentPath.value[0].color) {
    pathItem.color = currentPath.value[0].color
  }

  currentPath.value.push(pathItem)
}

function navigateToRoot() {
  currentPath.value = []
}

function navigateToLevel(index) {
  currentPath.value = currentPath.value.slice(0, index + 1)
}

async function addServiceLine() {
  if (!newServiceLine.value.name.trim()) {
    $q.notify({
      type: 'negative',
      message: 'Please enter a name for the service line'
    })
    return
  }

  isAddingServiceLine.value = true

  try {
    const level = currentPath.value.length
    const levelKey = level === 0 ? 'Service Line (L1)' :
                    level === 1 ? 'Capability (L2)' :
                    level === 2 ? 'Solution Set (L3)' : 'Sub-function (L4)'
    const descKey = `L${level + 1} Description`

    // Create new row
    const newRow = {
      'Service Line (L1)': level >= 0 ? (currentPath.value[0]?.name || newServiceLine.value.name) : '',
      'Capability (L2)': level >= 1 ? (currentPath.value[1]?.name || (level === 1 ? newServiceLine.value.name : '—')) : '—',
      'Solution Set (L3)': level >= 2 ? (currentPath.value[2]?.name || (level === 2 ? newServiceLine.value.name : '—')) : '—',
      'Sub-function (L4)': level >= 3 ? (currentPath.value[3]?.name || (level === 3 ? newServiceLine.value.name : '—')) : '—',
    }
    newRow[levelKey] = newServiceLine.value.name
    newRow[descKey] = newServiceLine.value.description

    emit('add-service-line', newRow)

    $q.notify({
      type: 'positive',
      message: 'Service line added successfully'
    })

    showAddDialog.value = false
    newServiceLine.value = { name: '', description: '' }
  } catch (error) {
    console.error('[NavigateView] Error adding service line:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to add service line'
    })
  } finally {
    isAddingServiceLine.value = false
  }
}

// Watch for path changes and emit to parent
watch(currentPath, (newPath) => {
  // Persist the path to localStorage
  console.log('[NavigateView] Saving current path to localStorage:', newPath)
  localStorage.setItem('navigation_current_path', JSON.stringify(newPath))

  emit('path-changed', newPath)
}, { deep: true })

// Watch for external path changes (from tree or chatbot navigation)
watch(() => props.externalPath, (newPath) => {
  if (newPath && newPath.length > 0) {
    console.log('[NavigateView] External path received:', newPath)
    currentPath.value = newPath
  }
}, { immediate: true, deep: true })

// On mount, log the restored path
onMounted(() => {
  console.log('[NavigateView] Component mounted, current path:', currentPath.value)
  if (currentPath.value.length > 0) {
    console.log('[NavigateView] Restored navigation path from localStorage')
    console.log('[NavigateView] Current pathKey:', pathKey.value)
  }
})
</script>

<style scoped>
.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.service-btn {
  min-height: 120px;
  padding: 16px !important;
  border-radius: 16px !important;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.service-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.service-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.3);
}

.top-level-btn {
  min-height: 140px;
}

.child-level-btn {
  min-height: 100px;
}

.btn-label {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  text-align: center;
  max-width: 100%;
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  border: none !important;
}

.add-btn:hover {
  background: linear-gradient(135deg, #5568d3 0%, #65408b 100%) !important;
}
</style>
