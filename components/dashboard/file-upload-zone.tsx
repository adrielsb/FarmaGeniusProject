
"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, X, FileSpreadsheet, Eye } from "lucide-react"

interface FileUploadZoneProps {
  file: File | null
  onFileChange: (file: File | null) => void
  onPreview?: (file: File) => void
  accept: string
  label: string
}

export function FileUploadZone({ file, onFileChange, onPreview, accept, label }: FileUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null
    onFileChange(selectedFile)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files?.[0] || null
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      onFileChange(droppedFile)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const clearFile = () => {
    onFileChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Card
        className="relative border-2 border-dashed border-slate-600 hover:border-slate-500 transition-colors cursor-pointer bg-slate-800/50"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="p-6 text-center">
          {file ? (
            <div className="space-y-2">
              <FileSpreadsheet className="mx-auto h-8 w-8 text-green-400" />
              <div className="text-sm font-medium text-green-400">
                {file.name}
              </div>
              <div className="text-xs text-slate-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
              {onPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPreview(file)
                  }}
                  className="mt-2"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  clearFile()
                }}
                className="absolute top-2 right-2 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="mx-auto h-8 w-8 text-slate-400" />
              <div className="text-sm text-slate-300">
                Clique ou solte o arquivo aqui
              </div>
              <div className="text-xs text-slate-500">
                Arquivo Excel (.xlsx) apenas
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
