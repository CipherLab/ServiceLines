<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-gradient">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="account_tree"
          @click="treeDrawerOpen = !treeDrawerOpen"
          class="q-mr-sm"
        >
          <q-tooltip>Toggle Tree View</q-tooltip>
        </q-btn>

        <q-toolbar-title>
          <div class="text-h4 text-weight-bold">Service Lines Navigator</div>
          <div class="text-subtitle2">Navigate and manage your organizational service lines</div>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="treeDrawerOpen"
      show-if-above
      :width="380"
      :breakpoint="1024"
      bordered
      class="tree-drawer"
    >
      <q-scroll-area class="fit">
        <div class="q-pa-md">
          <div class="text-h6 q-mb-md text-weight-bold text-grey-8">
            Service Lines Tree
          </div>

          <q-banner v-if="error" class="bg-negative text-white q-mb-md rounded-borders">
            {{ error }}
          </q-banner>

          <div v-if="loading" class="text-center q-pa-xl">
            <q-spinner-dots color="primary" size="40px" />
            <div class="q-mt-md text-grey-7">Loading...</div>
          </div>

          <TreeView
            v-else
            :tree-data="treeData"
            :current-path="currentPath"
            :top-level-colors="topLevelColors"
            @navigate="handleTreeNavigation"
          />
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <q-page class="q-pa-md">
        <q-card>
          <q-tabs
            v-model="activeTab"
            dense
            class="text-grey-8"
            active-color="primary"
            indicator-color="primary"
            align="justify"
          >
            <q-tab name="navigate" icon="explore" label="Navigate" />
            <q-tab name="chat" icon="chat" label="AI Assistant" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="activeTab" animated>
            <q-tab-panel name="navigate">
              <q-banner v-if="error" class="bg-negative text-white q-mb-md">
                {{ error }}
              </q-banner>

              <div v-if="loading" class="text-center q-pa-xl">
                <q-spinner-dots color="primary" size="50px" />
                <div class="q-mt-md text-grey-7">Loading service lines...</div>
              </div>

              <NavigateView
                v-else
                :key="navigateViewKey"
                :data="serviceLineData"
                @add-service-line="handleAddServiceLine"
                @path-changed="handlePathChanged"
              />
            </q-tab-panel>

            <q-tab-panel name="chat">
              <ChatBot
                :service-data="serviceLineData"
                @navigate-to-path="handleChatBotNavigation"
              />
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import NavigateView from './components/NavigateView.vue'
import TreeView from './components/TreeView.vue'
import ChatBot from './components/ChatBot.vue'
import { fetchServiceLines, buildTree, appendServiceLine } from './services/googleSheets'

const $q = useQuasar()
const activeTab = ref('navigate')
const loading = ref(true)
const error = ref(null)
const serviceLineData = ref([])
const treeDrawerOpen = ref(true)
const currentPath = ref([])
const navigateViewKey = ref(0)

// Store NavigateView reference for programmatic navigation
const navigateViewRef = ref(null)

// Color palette from NavigateView (keeping consistency)
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

const treeData = computed(() => {
  return buildTree(serviceLineData.value)
})

// Create a map of top-level names to colors for tree view
const topLevelColors = computed(() => {
  const colorMap = {}
  const topLevelOptions = serviceLineData.value
    .map(row => row['Service Line (L1)'])
    .filter((val, index, self) => val && val !== '—' && self.indexOf(val) === index)

  topLevelOptions.forEach(name => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colorPalette.length
    colorMap[name] = colorPalette[index]
  })

  return colorMap
})

async function loadData() {
  try {
    loading.value = true
    error.value = null
    serviceLineData.value = await fetchServiceLines()
    loading.value = false
  } catch (err) {
    error.value = err.message
    loading.value = false
  }
}

async function handleAddServiceLine(newRow) {
  try {
    // Add to local data immediately for instant UI update
    serviceLineData.value.push(newRow)

    // Try to persist to Google Sheets
    await appendServiceLine(newRow)

    $q.notify({
      type: 'positive',
      message: 'Service line saved to Google Sheets!'
    })
  } catch (error) {
    console.error('[App] Failed to save service line:', error)

    $q.notify({
      type: 'warning',
      message: 'Service line added locally but failed to save to Google Sheets. Check console for details.',
      timeout: 5000
    })
  }
}

function handlePathChanged(path) {
  // Update current path when NavigateView navigation happens
  currentPath.value = path
}

function handleTreeNavigation(pathArray) {
  // When tree node is clicked, update the NavigateView
  // pathArray is an array of node names from root to clicked node
  console.log('[App] Tree navigation to:', pathArray)

  const navigationPath = pathArray.map((name, index) => ({
    name: name,
    level: index
  }))

  // Update localStorage so NavigateView picks it up
  localStorage.setItem('navigation_current_path', JSON.stringify(navigationPath))

  // Update our internal state
  currentPath.value = navigationPath

  // Force NavigateView to remount and read from localStorage
  navigateViewKey.value++

  // Switch to Navigate tab
  activeTab.value = 'navigate'

  // Notify user
  $q.notify({
    type: 'info',
    message: `Navigating to: ${pathArray.join(' > ')}`,
    icon: 'account_tree',
    timeout: 2000
  })
}

function handleChatBotNavigation(pathArray) {
  // When ChatBot recommends a service line, navigate to it
  console.log('[App] ChatBot navigation to:', pathArray)

  // Build the path structure that NavigateView expects
  const navigationPath = pathArray.map((name, index) => ({
    name: name,
    level: index
  }))

  // Update localStorage so NavigateView picks it up
  localStorage.setItem('navigation_current_path', JSON.stringify(navigationPath))

  // Update our internal state
  currentPath.value = navigationPath

  // Force NavigateView to remount and read from localStorage
  navigateViewKey.value++

  // Switch to Navigate tab
  activeTab.value = 'navigate'

  // Notify user
  $q.notify({
    type: 'info',
    message: `Navigating to: ${pathArray.join(' > ')}`,
    timeout: 2000
  })
}

onMounted(() => {
  loadData()
})
</script>

<style>
.bg-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.tree-drawer {
  background: #fafafa;
}

.tree-drawer .q-scrollarea__content {
  max-width: 100%;
}
</style>
