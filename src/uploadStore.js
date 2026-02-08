import { shallowRef, ref } from 'vue'

export const uploadedPackageJson = shallowRef(null)
export const includeDevDeps = ref(false)

// Shared file-drop handler: parses JSON, stages it
export function handleDroppedFile(file) {
  if (!file) return

  var reader = new FileReader()
  reader.onload = function (e) {
    try {
      var parsed = JSON.parse(e.target.result)
      if (parsed.lockfileVersion) {
        alert('This looks like a package-lock.json. Please drop a package.json instead.')
        return
      }
      uploadedPackageJson.value = parsed
    } catch (err) {
      alert('Invalid JSON file')
    }
  }
  reader.readAsText(file)
}
