"use client"

import React, { useState, useEffect } from "react"
import { Folder, Image as ImageIcon, Video, X, Check, Search, HardDrive, Loader2, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getDriveFiles } from "@/app/actions/marketing"

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  thumbnailUrl?: string
  webContentLink?: string
}

interface DriveFilePickerProps {
  isOpen: boolean
  onClose: () => void
  onSelectFiles: (files: DriveFile[]) => void
  selectedFileIds?: string[]
}

const MOCK_DRIVE_FILES: DriveFile[] = [
  {
    id: "drive_01",
    name: "07_Julio_2026 / Demo_Manual_3D_Politorno.mp4",
    mimeType: "video/mp4",
    webContentLink: "https://mariomojica.com/demo",
  },
  {
    id: "drive_02",
    name: "07_Julio_2026 / Render_Estanteria_M00001_Obsidian.png",
    mimeType: "image/png",
    webContentLink: "https://mariomojica.com/demo",
  },
  {
    id: "drive_03",
    name: "07_Julio_2026 / Post_Tornillo_Sobrante_SVG.png",
    mimeType: "image/png",
    webContentLink: "https://mariomojica.com/demo",
  },
  {
    id: "drive_04",
    name: "Marketing / Video_Demostración_Español_4K.mp4",
    mimeType: "video/mp4",
    webContentLink: "https://mariomojica.com/demo",
  },
]

export function DriveFilePicker({ isOpen, onClose, onSelectFiles, selectedFileIds = [] }: DriveFilePickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedFileIds)
  const [files, setFiles] = useState<DriveFile[]>(MOCK_DRIVE_FILES)
  const [loading, setLoading] = useState(false)

  const loadRealDriveFiles = async () => {
    setLoading(true)
    const res = await getDriveFiles()
    if (res.data && res.data.length > 0) {
      setFiles(res.data)
    } else {
      setFiles(MOCK_DRIVE_FILES)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      loadRealDriveFiles()
    }
  }, [isOpen])

  if (!isOpen) return null

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleConfirm = () => {
    const selectedFiles = files.filter((f) => selectedIds.includes(f.id))
    onSelectFiles(selectedFiles)
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl rounded-2xl border border-outline-variant/20 bg-surface-container-high shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header del Modal */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface-container">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Explorador de Google Drive (G:\Mi unidad\Marketing)</h3>
                <p className="text-xs text-on-surface-variant">
                  Explora carpetas como &quot;07_Julio_2026&quot; y selecciona archivos multimedia.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Buscador & Reload */}
          <div className="p-4 border-b border-outline-variant/15 bg-surface-container-low/50 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Buscar archivos en Google Drive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-surface-container border border-outline-variant/20 pl-9 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={loadRealDriveFiles}
              disabled={loading}
              className="p-2 rounded-xl bg-surface-container border border-outline-variant/20 text-on-surface-variant hover:text-primary transition-colors"
              title="Actualizar archivos desde Google Drive API"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Lista de Archivos */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-on-surface-variant">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-xs">Cargando archivos desde Google Drive API...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
                <Folder className="h-10 w-10 mb-2 opacity-30 text-primary" />
                <p className="text-sm font-medium">No se encontraron archivos en Google Drive.</p>
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isSelected = selectedIds.includes(file.id)
                const isVideo = file.mimeType.startsWith("video")

                return (
                  <div
                    key={file.id}
                    onClick={() => toggleSelect(file.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-surface-container border-outline-variant/15 hover:border-outline-variant/40 text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isVideo ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {isVideo ? <Video className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold truncate max-w-md">{file.name}</p>
                        <p className="text-[11px] text-on-surface-variant uppercase">{file.mimeType}</p>
                      </div>
                    </div>

                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-outline-variant/40"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer del Modal */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/20 bg-surface-container">
            <span className="text-xs text-on-surface-variant">
              {selectedIds.length} archivo(s) seleccionado(s)
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 shadow-md shadow-primary/20"
              >
                Confirmar Selección
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
