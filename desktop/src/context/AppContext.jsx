import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AppContext = createContext(null)

const SEED_PATIENTS = [
  { id:'DVG-001', name:'Priya Sharma',  age:34, gender:'Female', phone:'+91 98765 43210', blood:'B+',  notes:'No known allergies',         createdAt:'2024-06-01', lastVisit:'Today',      status:'Analysed' },
  { id:'DVG-002', name:'Rajan Mehta',   age:52, gender:'Male',   phone:'+91 87654 32109', blood:'O+',  notes:'Hypertensive',               createdAt:'2024-05-14', lastVisit:'Yesterday',  status:'Analysed' },
  { id:'DVG-003', name:'Anita Patel',   age:28, gender:'Female', phone:'+91 76543 21098', blood:'A+',  notes:'',                           createdAt:'2024-05-20', lastVisit:'2 days ago', status:'Pending'  },
  { id:'DVG-004', name:'Kiran Kumar',   age:45, gender:'Male',   phone:'+91 65432 10987', blood:'AB+', notes:'Diabetic — monitor healing',  createdAt:'2024-04-30', lastVisit:'1 week ago', status:'Analysed' },
]

const SEED_REPORTS = [
  {
    id:'RPT-001', patientId:'DVG-001', patientName:'Priya Sharma',
    date:'Today, 10:24 AM', imageFile:'RVG_Priya_001.dcm', imageLabel:'Image 1', imageIndex:1, totalImages:1,
    originalImageBase64:null, originalMime:'image/png', preprocessedImageBase64:null,
    annotatedImageBase64:null, annotatedMime:'image/png', pdfBase64:null,
    pdfFilename:'Priya_Sharma_RPT-001.pdf', modelUsed:'UNet + ResNet50',
    findings:[{ fdiNumber:'36', tooth:'FDI 36', type:'Decayed Teeth', className:'Decayed Teeth', severity:'High', confidence:97.1, description:'Decayed Teeth detected at tooth FDI 36.', recommendation:'Composite restoration recommended.' }],
    complaint:'Routine radiographic examination', summary:'Carious lesion at FDI 36 involving enamel and dentine.',
    teeth:'FDI 36', severity:'High', treatment:'Composite restoration. Review in 6 months.', doctorNotes:'', status:'Edited',
    statistics:{}, regionCounts:{},
  },
  {
    id:'RPT-002', patientId:'DVG-002', patientName:'Rajan Mehta',
    date:'Yesterday, 3:12 PM', imageFile:'RVG_Rajan_001.dcm', imageLabel:'Image 1', imageIndex:1, totalImages:1,
    originalImageBase64:null, originalMime:'image/png', preprocessedImageBase64:null,
    annotatedImageBase64:null, annotatedMime:'image/png', pdfBase64:null,
    pdfFilename:'Rajan_Mehta_RPT-002.pdf', modelUsed:'UNet + ResNet50',
    findings:[],
    complaint:'Routine check-up', summary:'No carious lesions. Bone levels normal.',
    teeth:'N/A', severity:'None', treatment:'Continue routine dental hygiene. Review in 12 months.', doctorNotes:'', status:'AI Generated',
    statistics:{}, regionCounts:{},
  },
  {
    id:'RPT-003', patientId:'DVG-004', patientName:'Kiran Kumar',
    date:'5 days ago', imageFile:'RVG_Kiran_001.dcm', imageLabel:'Image 1', imageIndex:1, totalImages:1,
    originalImageBase64:null, originalMime:'image/png', preprocessedImageBase64:null,
    annotatedImageBase64:null, annotatedMime:'image/png', pdfBase64:null,
    pdfFilename:'Kiran_Kumar_RPT-003.pdf', modelUsed:'UNet + ResNet50',
    findings:[{ fdiNumber:'17', tooth:'FDI 17', type:'Decayed Teeth', className:'Decayed Teeth', severity:'High', confidence:94.3, description:'Periapical lesion at FDI 17.', recommendation:'Root canal therapy or extraction.' }],
    complaint:'Sensitivity to cold', summary:'Periapical lesion at FDI 17. Further evaluation required.',
    teeth:'FDI 17', severity:'High', treatment:'CBCT recommended. Consider RCT or extraction.', doctorNotes:'Pain since 3 months.', status:'Downloaded',
    statistics:{}, regionCounts:{},
  },
]

const MODEL_LABELS = {
  unet_resnet50:'UNet + ResNet50', unet_vgg16:'UNet + VGG16',
  unet_densenet:'UNet + DenseNet121', ensemble:'Ensemble',
}

function nextId(arr, prefix) {
  const nums = arr.map(x => parseInt(x.id.replace(prefix+'-',''))).filter(n=>!isNaN(n))
  return `${prefix}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3,'0')}`
}

function safeName(name) {
  return (name||'Patient')
    .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i,'')
    .trim().replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_-]/g,'')
}

export function AppProvider({ children }) {
  const [page,              setPage]              = useState('dashboard')
  const [patients,          setPatients]          = useState(SEED_PATIENTS)
  const [reports,           setReports]           = useState(SEED_REPORTS)
  const [activeReport,      setActiveReport]      = useState(null)
  const [analysisPatient,   setAnalysisPatient]   = useState(null)
  const [selectedPatient,   setSelectedPatient]   = useState(null)

  /* ── Navigation ───────────────────────────────────────────────────── */
  const navigate = useCallback((p, extra={}) => {
    setPage(p)
    if (extra.patient) {
      setAnalysisPatient(extra.patient)
      setSelectedPatient(extra.patient)
    }
  }, [])

  /* ── Patient CRUD ─────────────────────────────────────────────────── */
  const addPatient = useCallback((data) => {
    setPatients(prev => {
      const id = nextId(prev, 'DVG')
      return [{ id, name:data.name.trim(), age:parseInt(data.age), gender:data.gender,
        phone:data.phone.trim(), blood:data.blood, notes:data.notes.trim(),
        createdAt:new Date().toISOString().slice(0,10), lastVisit:'Never', status:'Pending' }, ...prev]
    })
  }, [])

  const updatePatient = useCallback((id, data) => {
    setPatients(prev => prev.map(p => p.id!==id ? p : {
      ...p, name:data.name.trim(), age:parseInt(data.age), gender:data.gender,
      phone:data.phone.trim(), blood:data.blood, notes:data.notes.trim(),
    }))
  }, [])

  const deletePatient = useCallback((id) => {
    setPatients(prev => prev.filter(p => p.id!==id))
    setReports(prev  => prev.filter(r => r.patientId!==id))
    setActiveReport(prev => prev?.patientId===id ? null : prev)
    setSelectedPatient(prev => (prev?.id===id ? null : prev))
  }, [])

  /* ── Report CRUD ──────────────────────────────────────────────────── */
  const addReport = useCallback((data) => {
    const modelId = localStorage.getItem('divulgeai_model') || 'unet_resnet50'
    const reportPatient = patients.find(p => p.id === data.patientId) || null
    let created
    setReports(prev => {
      const id = nextId(prev, 'RPT')
      created = {
        ...data, id,
        modelUsed:   MODEL_LABELS[modelId] || 'UNet + ResNet50',
        date:        new Date().toLocaleString('en-IN', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' }),
        pdfFilename: `${safeName(data.patientName)}_${id}.pdf`,
        status:      'AI Generated',
      }
      return [created, ...prev]
    })
    setPatients(prev => prev.map(p =>
      p.id===data.patientId ? { ...p, status:'Analysed', lastVisit:'Just now' } : p
    ))
    setSelectedPatient(reportPatient)
    // Set as active so Results screen can navigate to it
    setTimeout(() => setActiveReport(created), 0)
    return created
  }, [patients])

  // updateReport — saves ALL form fields the doctor edited
  const updateReport = useCallback((id, formData) => {
    setReports(prev => prev.map(r => {
      if (r.id!==id) return r
      return { ...r, ...formData, status:'Edited' }
    }))
    setActiveReport(prev => {
      if (prev?.id!==id) return prev
      return { ...prev, ...formData, status:'Edited' }
    })
  }, [])

  const markDownloaded = useCallback((id) => {
    setReports(prev => prev.map(r => r.id===id ? { ...r, status:'Downloaded' } : r))
    setActiveReport(prev => prev?.id===id ? { ...prev, status:'Downloaded' } : prev)
  }, [])

  // openReport — always reads latest state from reports array
  const openReport = useCallback((report) => {
    const reportPatient = patients.find(p => p.id === report.patientId) || null
    setReports(prev => {
      const latest = prev.find(r => r.id===report.id) || report
      setActiveReport(latest)
      return prev
    })
    setSelectedPatient(reportPatient)
    setPage('report-detail')
  }, [patients])

  const closeReport = useCallback(() => {
    setActiveReport(null)
  }, [])

  // Expose openReport globally so the history bar in ReportsPage can call it
  useEffect(() => {
    window.__divulgeOpenReport = openReport
    return () => { delete window.__divulgeOpenReport }
  }, [openReport])

  return (
    <AppContext.Provider value={{
      page, navigate,
      patients, addPatient, updatePatient, deletePatient,
      reports, addReport, updateReport, markDownloaded,
      activeReport, openReport, closeReport,
      analysisPatient, setAnalysisPatient,
      selectedPatient,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
