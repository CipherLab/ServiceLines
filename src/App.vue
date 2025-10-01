<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-gradient">
      <q-toolbar>
        <q-toolbar-title>
          <div class="text-h4 text-weight-bold">Service Lines Navigator</div>
          <div class="text-subtitle2">Navigate and manage your organizational service lines</div>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

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
            <q-tab name="tree" icon="account_tree" label="Tree View" />
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
                :data="serviceLineData"
                @add-service-line="handleAddServiceLine"
              />
            </q-tab-panel>

            <q-tab-panel name="tree">
              <q-banner v-if="error" class="bg-negative text-white q-mb-md">
                {{ error }}
              </q-banner>

              <div v-if="loading" class="text-center q-pa-xl">
                <q-spinner-dots color="primary" size="50px" />
                <div class="q-mt-md text-grey-7">Loading service lines...</div>
              </div>

              <TreeView v-else :tree-data="treeData" />
            </q-tab-panel>

            <q-tab-panel name="chat">
              <ChatBot :tree-data="treeData" />
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import NavigateView from './components/NavigateView.vue'
import TreeView from './components/TreeView.vue'
import ChatBot from './components/ChatBot.vue'
import { fetchServiceLines, buildTree } from './services/googleSheets'

const activeTab = ref('navigate')
const loading = ref(true)
const error = ref(null)
const serviceLineData = ref([])

const treeData = computed(() => {
  return buildTree(serviceLineData.value)
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

function handleAddServiceLine(newRow) {
  serviceLineData.value.push(newRow)
  // TODO: Persist to Google Sheets
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
</style>
