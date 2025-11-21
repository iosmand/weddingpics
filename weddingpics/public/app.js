import { Uppy, Dashboard, Tus } from "https://releases.transloadit.com/uppy/v3.25.3/uppy.min.mjs"

const GUEST_NAME_KEY = 'weddingpics_guest_name'
const GUEST_SESSION_KEY = 'weddingpics_session_id'

let guestName = ''
let sessionId = ''
let uppy = null

// DOM elements
const guestNameSection = document.getElementById('guest-name-section')
const uploadSection = document.getElementById('upload-section')
const guestNameInput = document.getElementById('guest-name')
const startUploadBtn = document.getElementById('start-upload-btn')
const displayName = document.getElementById('display-name')
const changeNameBtn = document.getElementById('change-name-btn')

// Generate or load session ID
function getSessionId() {
  let id = localStorage.getItem(GUEST_SESSION_KEY)
  if (!id) {
    // Generate a unique session ID (timestamp + random)
    id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
    localStorage.setItem(GUEST_SESSION_KEY, id)
  }
  return id
}

// Load guest name from localStorage on page load
function loadGuestName() {
  const savedName = localStorage.getItem(GUEST_NAME_KEY)
  if (savedName) {
    guestName = savedName
    guestNameInput.value = savedName
    return true
  }
  return false
}

// Save guest name to localStorage
function saveGuestName(name) {
  localStorage.setItem(GUEST_NAME_KEY, name)
}

// Initialize Uppy
function initializeUppy() {
  uppy = new Uppy({
    debug: true,
    autoProceed: false,
    restrictions: {
      allowedFileTypes: ['image/*', 'video/*'],
    },
    locale: {
      strings: {
        // Main strings
        uploadingXFiles: {
          0: '%{smart_count} dosya yükleniyor',
          1: '%{smart_count} dosya yükleniyor'
        },
        uploadXFiles: {
          0: '%{smart_count} dosyayı yükle',
          1: '%{smart_count} dosyayı yükle'
        },
        uploadXNewFiles: {
          0: '+%{smart_count} dosyayı yükle',
          1: '+%{smart_count} dosyayı yükle'
        },
        // Dashboard strings
        browseFiles: 'dosya seç',
        dropPasteFiles: 'Dosyalarınızı buraya sürükleyin veya %{browse}',
        dropPasteFolders: 'Dosyalarınızı buraya sürükleyin veya %{browse}',
        dropPasteBoth: 'Dosyalarınızı buraya sürükleyin veya %{browse}',
        dropPasteImportFiles: 'Dosyalarınızı buraya sürükleyin, yapıştırın, %{browse} veya içe aktarın',
        dropPasteImportFolders: 'Dosyalarınızı buraya sürükleyin, yapıştırın, %{browse} veya içe aktarın',
        dropPasteImportBoth: 'Dosyalarınızı buraya sürükleyin, yapıştırın, %{browse} veya içe aktarın',
        importFiles: 'Dosyaları içe aktar',
        dropHint: 'Dosyalarınızı buraya bırakın',
        // Upload status
        uploadComplete: 'Yükleme tamamlandı',
        uploadPaused: 'Yükleme duraklatıldı',
        resumeUpload: 'Yüklemeye devam et',
        pauseUpload: 'Yüklemeyi duraklat',
        retryUpload: 'Yüklemeyi tekrar dene',
        cancelUpload: 'Yüklemeyi iptal et',
        // File status
        filesUploadedOfTotal: {
          0: '%{complete} / %{smart_count} dosya yüklendi',
          1: '%{complete} / %{smart_count} dosya yüklendi'
        },
        dataUploadedOfTotal: '%{complete} / %{total}',
        xTimeLeft: '%{time} kaldı',
        uploadAllNewFiles: 'Tüm yeni dosyaları yükle',
        // Error messages
        uploadFailed: 'Yükleme başarısız oldu',
        noInternetConnection: 'İnternet bağlantısı yok',
        connectedToInternet: 'İnternete bağlandı',
        // Processing
        processingXFiles: {
          0: '%{smart_count} dosya işleniyor',
          1: '%{smart_count} dosya işleniyor'
        },
        // Info
        addMore: 'Daha fazla ekle',
        addMoreFiles: 'Daha fazla dosya ekle',
        xFilesSelected: {
          0: '%{smart_count} dosya seçildi',
          1: '%{smart_count} dosya seçildi'
        },
        removeFile: 'Dosyayı kaldır',
        editFile: 'Dosyayı düzenle',
        editing: 'Düzenleniyor',
        edit: 'Düzenle',
        finishEditingFile: 'Düzenlemeyi bitir',
        saveChanges: 'Değişiklikleri kaydet',
        // File size
        exceedsSize: '%{file} maksimum izin verilen boyutu aşıyor',
        youCanOnlyUploadFileTypes: 'Sadece şu dosya türlerini yükleyebilirsiniz: %{types}',
        youCanOnlyUploadX: {
          0: 'Sadece %{smart_count} dosya yükleyebilirsiniz',
          1: 'Sadece %{smart_count} dosya yükleyebilirsiniz'
        },
        // Generic
        back: 'Geri',
        close: 'Kapat',
        done: 'Tamam',
        name: 'İsim',
        removeImage: 'Resmi kaldır',
        // Status messages
        complete: 'Tamamlandı',
        uploading: 'Yükleniyor',
        error: 'Hata',
      }
    },
    onBeforeFileAdded: (currentFile, files) => {
      // Add guest name and session ID to file metadata
      const modifiedFile = {
        ...currentFile,
        meta: {
          ...currentFile.meta,
          guestName: guestName,
          sessionId: sessionId
        }
      }
      return modifiedFile
    }
  })

  uppy.use(Dashboard, {
    inline: true,
    target: '#uppy',
    proudlyDisplayPoweredByUppy: false,
    height: 470,
    note: 'Resim ve videolar, dosya başına 5TB\'a kadar',
  })

  uppy.use(Tus, {
    endpoint: '/files',
    chunkSize: 5 * 1024 * 1024, // 5MB chunks
    retryDelays: [0, 1000, 3000, 5000],
  })

  uppy.on('upload-progress', (file, progress) => {
    console.log('Progress:', file.name, progress)
  })

  uppy.on('upload-success', (file, response) => {
    console.log('Upload success:', file.name, response)
  })

  uppy.on('complete', (result) => {
    console.log('Upload complete:', result)
    const statusDiv = document.getElementById('status')
    statusDiv.innerHTML = `
      <div class="success-message">
        ✅ Yükleme tamamlandı! ${result.successful.length} dosya başarıyla yüklendi.
      </div>
    `
    setTimeout(() => {
      statusDiv.innerHTML = ''
    }, 5000)
  })

  uppy.on('upload-error', (file, error) => {
    console.error('Upload error:', file?.name, error)
  })
}

// Initialize session ID
sessionId = getSessionId()

// Check if we have a saved guest name on load
if (loadGuestName()) {
  // Auto-populate the input with saved name
  guestNameInput.placeholder = `Tekrar hoş geldiniz, ${guestName}!`
  
  // Returning user - skip name entry and go directly to upload
  displayName.textContent = guestName
  guestNameSection.style.display = 'none'
  uploadSection.style.display = 'block'
  initializeUppy()
} else {
  // New user - focus on name input
  guestNameInput.focus()
}

// Start upload button handler
startUploadBtn.addEventListener('click', () => {
  const name = guestNameInput.value.trim()
  
  if (!name) {
    alert('Lütfen adınızı girin')
    return
  }
  
  guestName = name
  saveGuestName(guestName) // Save to localStorage
  displayName.textContent = guestName
  
  // Show upload section, hide name section
  guestNameSection.style.display = 'none'
  uploadSection.style.display = 'block'
  
  // Initialize Uppy after name is set
  if (!uppy) {
    initializeUppy()
  }
})

// Change name button handler
changeNameBtn.addEventListener('click', () => {
  uploadSection.style.display = 'none'
  guestNameSection.style.display = 'block'
  guestNameInput.value = guestName
  guestNameInput.placeholder = 'Adınızı yazın'
  guestNameInput.focus()
})

// Allow Enter key to submit name
guestNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    startUploadBtn.click()
  }
})

// Focus on name input when page loads (only if no saved name)
if (!guestName) {
  guestNameInput.focus()
}

