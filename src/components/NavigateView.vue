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

    <div class="button-grid">
      <q-btn
        v-for="option in currentOptions"
        :key="option"
        :label="option"
        color="primary"
        size="lg"
        class="service-btn"
        @click="selectOption(option)"
        unelevated
      />
      <q-btn
        label="+ Add New"
        color="positive"
        size="lg"
        class="service-btn"
        @click="showAddDialog = true"
        unelevated
      />
    </div>

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
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Add" color="primary" @click="addServiceLine" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['add-service-line'])

const $q = useQuasar()
const currentPath = ref([])
const showAddDialog = ref(false)
const newServiceLine = ref({
  name: '',
  description: ''
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

function selectOption(option) {
  currentPath.value.push({
    name: option,
    level: currentPath.value.length
  })
}

function navigateToRoot() {
  currentPath.value = []
}

function navigateToLevel(index) {
  currentPath.value = currentPath.value.slice(0, index + 1)
}

function addServiceLine() {
  if (!newServiceLine.value.name.trim()) {
    $q.notify({
      type: 'negative',
      message: 'Please enter a name for the service line'
    })
    return
  }

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
}
</script>

<style scoped>
.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.service-btn {
  min-height: 80px;
  font-size: 1rem;
  font-weight: 600;
}
</style>
