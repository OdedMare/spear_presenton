"use client"

import React, { useState } from 'react'
import { Upload, Sparkles, Download, FileText, Loader2, AlertCircle, ChevronRight, RotateCcw, Edit2, Check, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Wrapper from '@/components/Wrapper'
import { Input } from '@/components/ui/input'
import { TutorialButton } from '@/components/tutorial/TutorialButton'



interface TextElement {
  id: string
  type: 'shape' | 'textbox' | 'group_shape' | 'table_cell' | 'smartart' | 'chart_text' | 'notes'
  text: string
  placeholderType?: string
  subtype?: string
  originalLength?: number
  maxLength?: number
  maxLines?: number
}

interface PlaceholderStructure {
  slides: Array<{
    slideNumber: number
    elements: TextElement[]
  }>
  _temp_file_path?: string
  _original_filename?: string
}

interface RewrittenContent {
  slides: Array<{
    slideNumber: number
    elements: Array<{
      id: string
      text: string
    }>
  }>
}

type RewriteMode = 'strict' | 'flexible' | 'translate'
type Language = 'english' | 'hebrew'

const LANGUAGE_OPTIONS = [
  { value: 'hebrew', label: 'עברית (Hebrew)', rtl: true },
  { value: 'english', label: 'English', rtl: false },
  { value: 'arabic', label: 'العربية (Arabic)', rtl: true },
  { value: 'spanish', label: 'Español (Spanish)', rtl: false },
  { value: 'french', label: 'Français (French)', rtl: false },
  { value: 'german', label: 'Deutsch (German)', rtl: false },
  { value: 'russian', label: 'Русский (Russian)', rtl: false },
  { value: 'chinese', label: '中文 (Chinese)', rtl: false },
  { value: 'japanese', label: '日本語 (Japanese)', rtl: false },
]

type LoadingStage =
  | 'extracting_placeholders'
  | 'extracting_content'
  | 'generating_content'
  | 'injecting_content'
  | null

interface ContentRewritePageProps {
  defaultMode?: 'rewrite' | 'translate'
}

export default function ContentRewritePage({ defaultMode = 'rewrite' }: ContentRewritePageProps = {}) {
  const [file, setFile] = useState<File | null>(null)
  const [sourceFile, setSourceFile] = useState<File | null>(null) // PDF/PPTX to extract content from
  const [extractedContent, setExtractedContent] = useState<string>('')
  const [showExtractedPreview, setShowExtractedPreview] = useState(false)
  const [userPrompt, setUserPrompt] = useState('')
  const [rewriteMode, setRewriteMode] = useState<RewriteMode>('strict')
  const [language, setLanguage] = useState<Language>('english')
  const [targetSlideCount, setTargetSlideCount] = useState<number>(0)
  const [isTranslateMode, setIsTranslateMode] = useState(defaultMode === 'translate')
  const [sourceLanguage, setSourceLanguage] = useState<string>('hebrew')
  const [targetLanguage, setTargetLanguage] = useState<string>('english')
  const [placeholderStructure, setPlaceholderStructure] = useState<PlaceholderStructure | null>(null)
  const [rewrittenContent, setRewrittenContent] = useState<RewrittenContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'upload' | 'prompt' | 'preview' | 'download'>('upload')
  const [editingSlide, setEditingSlide] = useState<number | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (!selectedFile.name.endsWith('.pptx')) {
        setError('אנא העלה קובץ .pptx')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const validExtensions = ['.pdf', '.pptx']
      const isValid = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext))

      if (!isValid) {
        setError('אנא העלה קובץ PDF או PPTX')
        return
      }
      setSourceFile(selectedFile)
      setError(null)
    }
  }

  const handleExtractContent = async () => {
    if (!sourceFile) return

    setLoading(true)
    setLoadingStage('extracting_content')
    setError(null)

    try {
      // Step 1: Upload the file
      const uploadFormData = new FormData()
      uploadFormData.append('files', sourceFile)

      const uploadResponse = await fetch(`/api/v1/ppt/files/upload`, {
        method: 'POST',
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        throw new Error('נכשל בהעלאת קובץ המקור')
      }

      const filePaths = await uploadResponse.json()

      // Step 2: Decompose the file to extract text
      const decomposeResponse = await fetch(`/api/v1/ppt/files/decompose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_paths: filePaths
        }),
      })

      if (!decomposeResponse.ok) {
        throw new Error('נכשל בחילוץ תוכן מהקובץ')
      }

      const decomposedFiles = await decomposeResponse.json()

      // Step 3: Read the extracted text using the read-file API
      if (decomposedFiles.length > 0) {
        const textFilePath = decomposedFiles[0].file_path

        // Use the same read-file endpoint as the upload page
        const textResponse = await fetch('/api/read-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filePath: textFilePath }),
        })

        if (!textResponse.ok) {
          throw new Error('נכשל בקריאת התוכן המחולץ')
        }

        const { content } = await textResponse.json()

        setExtractedContent(content)
        setShowExtractedPreview(true)
      }

    } catch (err: any) {
      console.error('Extract content error:', err)
      setError(err.message || 'אירעה שגיאה בעת חילוץ התוכן')
    } finally {
      setLoading(false)
      setLoadingStage(null)
    }
  }

  const handleUseExtractedContent = () => {
    setUserPrompt(extractedContent)
    setShowExtractedPreview(false)
  }

  const handleDiscardExtractedContent = () => {
    setExtractedContent('')
    setSourceFile(null)
    setShowExtractedPreview(false)
  }

  const handleExtractPlaceholders = async () => {
    if (!file) return

    setLoading(true)
    setLoadingStage('extracting_placeholders')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/v1/ppt/rewrite/extract-placeholders`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Server error' }))
        throw new Error(errorData.detail || 'נכשל בחילוץ מציינים')
      }

      const data = await response.json()
      setPlaceholderStructure(data.placeholder_structure)
      setStep('prompt')
    } catch (err: any) {
      console.error('Upload error:', err)
      if (err.message === 'Failed to fetch') {
        setError('לא ניתן להתחבר לשרת ה-API. אנא וודא שהשרת פועל.')
      } else {
        setError(err.message || 'אירעה שגיאה בעת חילוץ המציינים')
      }
    } finally {
      setLoading(false)
      setLoadingStage(null)
    }
  }

  const handleGenerateContent = async () => {
    if (!placeholderStructure) return
    if (!isTranslateMode && !userPrompt) return

    setLoading(true)
    setLoadingStage('generating_content')
    setError(null)

    try {
      // Determine mode
      const mode = isTranslateMode ? 'translate' : rewriteMode

      // Build prompt based on mode
      let enhancedPrompt = ''

      if (isTranslateMode) {
        // Translation mode - simple or with additional instructions
        enhancedPrompt = userPrompt.trim()
          ? `Translate from ${sourceLanguage} to ${targetLanguage}. Additional instructions: ${userPrompt}`
          : `Translate from ${sourceLanguage} to ${targetLanguage}.`
      } else {
        // Existing rewrite mode logic
        const languageInstruction = language === 'hebrew'
          ? '\n\nIMPORTANT: Generate all content in HEBREW language. The text will be displayed left-to-right.'
          : '\n\nIMPORTANT: Generate all content in ENGLISH language.'

        const slideCountInstruction = rewriteMode === 'flexible' && targetSlideCount > 0
          ? `\n\nTarget slide count: Generate exactly ${targetSlideCount} slides.`
          : ''

        enhancedPrompt = userPrompt + languageInstruction + slideCountInstruction
      }

      const response = await fetch(`/api/v1/ppt/rewrite/generate-rewritten-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_prompt: enhancedPrompt,
          placeholder_structure: placeholderStructure,
          mode: mode,
          source_language: isTranslateMode ? sourceLanguage : undefined,
          target_language: isTranslateMode ? targetLanguage : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'נכשל ביצירת תוכן')
      }

      const data = await response.json()
      setRewrittenContent(data.rewritten_content)
      setStep('preview')
    } catch (err: any) {
      setError(err.message || 'אירעה שגיאה בעת יצירת התוכן')
    } finally {
      setLoading(false)
      setLoadingStage(null)
    }
  }

  const handlePreview = async () => {
    if (!placeholderStructure || !rewrittenContent) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('temp_file_path', placeholderStructure._temp_file_path || '')
      formData.append('rewritten_content', JSON.stringify(rewrittenContent))
      formData.append('original_filename', placeholderStructure._original_filename || 'presentation.pptx')

      const response = await fetch(`/api/v1/ppt/rewrite/inject-and-download`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'נכשל ביצירת תצוגה מקדימה')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Open in new tab for preview
      window.open(url, '_blank')

      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'אירעה שגיאה בעת יצירת תצוגה מקדימה')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!placeholderStructure || !rewrittenContent) return

    setLoading(true)
    setLoadingStage('injecting_content')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('temp_file_path', placeholderStructure._temp_file_path || '')
      formData.append('rewritten_content', JSON.stringify(rewrittenContent))
      formData.append('original_filename', placeholderStructure._original_filename || 'presentation.pptx')

      const response = await fetch(`/api/v1/ppt/rewrite/inject-and-download`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'נכשל ביצירת הורדה')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rewritten_${placeholderStructure._original_filename || 'presentation.pptx'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setStep('download')
    } catch (err: any) {
      setError(err.message || 'אירעה שגיאה בעת ההורדה')
    } finally {
      setLoading(false)
      setLoadingStage(null)
    }
  }

  const handleReset = () => {
    setFile(null)
    setSourceFile(null)
    setExtractedContent('')
    setShowExtractedPreview(false)
    setUserPrompt('')
    setRewriteMode('strict')
    setLanguage('english')
    setTargetSlideCount(0)
    setPlaceholderStructure(null)
    setRewrittenContent(null)
    setError(null)
    setStep('upload')
    setEditingSlide(null)
  }

  const handleUpdateElementText = (slideIndex: number, elementId: string, newText: string) => {
    if (!rewrittenContent) return

    const updatedSlides = [...rewrittenContent.slides]
    const slide = updatedSlides[slideIndex]

    const elementIndex = slide.elements.findIndex(el => el.id === elementId)
    if (elementIndex !== -1) {
      slide.elements[elementIndex] = {
        ...slide.elements[elementIndex],
        text: newText
      }
    }

    setRewrittenContent({ slides: updatedSlides })
  }

  const getElementDisplayName = (element: TextElement): string => {
    if (element.type === 'shape' && element.placeholderType) {
      return element.placeholderType.charAt(0).toUpperCase() + element.placeholderType.slice(1)
    }
    if (element.type === 'chart_text' && element.subtype) {
      return `Chart ${element.subtype}`
    }
    return element.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const getElementIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'shape': '📄',
      'textbox': '📝',
      'group_shape': '📦',
      'table_cell': '📊',
      'smartart': '🎨',
      'chart_text': '📈',
      'notes': '🗒️'
    }
    return icons[type] || '📄'
  }

  const toggleEditSlide = (slideIndex: number) => {
    setEditingSlide(editingSlide === slideIndex ? null : slideIndex)
  }

  const getLoadingMessage = (stage: LoadingStage): string => {
    switch (stage) {
      case 'extracting_placeholders':
        return 'מנתח את מבנה המצגת שלך...'
      case 'extracting_content':
        return 'מחלץ תוכן מהקובץ...'
      case 'generating_content':
        return 'AI יוצר תוכן חדש עבור השקפים שלך...'
      case 'injecting_content':
        return 'יוצר את המצגת המשוכתבת שלך...'
      default:
        return 'מעבד...'
    }
  }

  return (
    <Wrapper>
      {/* Extracted Content Preview Modal */}
      {showExtractedPreview && extractedContent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" dir="rtl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">תצוגה מקדימה של תוכן מחולץ</h2>
              <p className="text-sm text-gray-600 mt-1">
                בדוק את התוכן שחולץ מ-{sourceFile?.name}
              </p>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                    {extractedContent}
                  </pre>
                </div>
              </div>

              {/* Character Count */}
              <div className="mt-4 text-sm text-gray-500">
                {extractedContent.length} תווים חולצו
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end bg-gray-50 rounded-b-2xl">
              <Button
                onClick={handleDiscardExtractedContent}
                variant="outline"
                className="border-gray-300 hover:bg-gray-100"
              >
                בטל
              </Button>
              <Button
                onClick={handleUseExtractedContent}
                className="bg-[#5146E5] hover:bg-[#4136D5] text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                השתמש בתוכן זה
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && loadingStage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center gap-6">
              {/* Animated Spinner */}
              <div className="relative">
                <div className="w-20 h-20 border-4 border-[#E9E8F8] rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-[#5146E5] border-t-transparent rounded-full animate-spin"></div>
                <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-[#5146E5]" />
              </div>

              {/* Loading Message */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {getLoadingMessage(loadingStage)}
                </h3>
                <p className="text-sm text-gray-600">
                  זה עשוי לקחת כמה רגעים
                </p>
              </div>

              {/* Progress Steps */}
              <div className="w-full space-y-2">
                {[
                  { stage: 'extracting_placeholders', label: 'חילוץ מבנה' },
                  { stage: 'generating_content', label: 'יצירת תוכן' },
                  { stage: 'injecting_content', label: 'יצירת מצגת' },
                ].map(({ stage: stepStage, label }) => {
                  const isActive = loadingStage === stepStage
                  const isPast =
                    (stepStage === 'extracting_placeholders' && ['generating_content', 'injecting_content'].includes(loadingStage)) ||
                    (stepStage === 'generating_content' && loadingStage === 'injecting_content')

                  return (
                    <div key={stepStage} className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isActive
                          ? 'bg-[#5146E5] ring-4 ring-[#E9E8F8]'
                          : isPast
                            ? 'bg-green-500'
                            : 'bg-gray-200'
                          }`}
                      >
                        {isPast ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : isActive ? (
                          <Loader2 className="w-3 h-3 text-white animate-spin" />
                        ) : null}
                      </div>
                      <span
                        className={`text-sm font-medium ${isActive || isPast ? 'text-gray-900' : 'text-gray-400'
                          }`}
                      >
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8" dir="rtl">
        {/* Description and Help */}
        <div className="text-center mb-8 relative">
          <p className="text-gray-600 max-w-2xl mx-auto">
            {isTranslateMode
              ? 'שמור על עיצוב המצגת, תרגם את התוכן עם AI'
              : 'שמור על עיצוב המצגת, שכתב את התוכן עם AI'
            }
          </p>

          {/* Help Button - Positioned in top right */}
          <div className="absolute top-0 right-0">
            <TutorialButton />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 max-w-4xl mx-auto">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#5146E5] text-white font-semibold">
                  1
                </div>
                <h2 className="text-xl font-semibold font-instrument_sans">העלה את המצגת שלך</h2>
              </div>

              <p className="text-gray-600 mb-6">
                העלה קובץ PowerPoint (.pptx) עם העיצוב שברצונך לשמור
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#5146E5] transition-colors">
                <input
                  type="file"
                  accept=".pptx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#E9E8F8]">
                    <FileText className="w-8 h-8 text-[#5146E5]" />
                  </div>
                  <div>
                    <span className="text-base font-medium text-gray-700 block mb-1">
                      {file ? file.name : 'לחץ להעלאה או גרור ושחרר'}
                    </span>
                    <span className="text-sm text-gray-500">קבצי PowerPoint (.pptx) בלבד</span>
                  </div>
                </label>
              </div>

              {file && (
                <Button
                  onClick={handleExtractPlaceholders}
                  disabled={loading}
                  className="w-full mt-6 bg-[#5146E5] hover:bg-[#4136D5] text-white font-medium py-6"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      מחלץ מציינים...
                    </>
                  ) : (
                    <>
                      המשך לשלב הבא
                      <ChevronRight className="w-5 h-5 ml-2 rotate-180" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Enter Prompt */}
        {step === 'prompt' && placeholderStructure && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Placeholder Structure Info */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-[#5146E5]" />
                <h3 className="text-lg font-semibold">מבנה מציינים</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                נמצאו {placeholderStructure.slides.length} שקפים עם המבנה הבא
              </p>
              <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto border border-gray-200">
                <pre className="text-xs font-mono text-gray-700">
                  {JSON.stringify(
                    {
                      slides: placeholderStructure.slides.map((s) => ({
                        slideNumber: s.slideNumber,
                        elementCount: s.elements.length,
                        elementTypes: s.elements.map(e => e.type),
                      })),
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            {/* Prompt Input */}
            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#5146E5] text-white font-semibold">
                  2
                </div>
                <h2 className="text-xl font-semibold font-instrument_sans">תאר את התוכן שלך</h2>
              </div>

              <p className="text-gray-600 mb-6">
                {isTranslateMode ? 'בחר שפות ותרגם את המצגת שלך' : 'ספר ל-AI איזה תוכן מצגת אתה רוצה ליצור'}
              </p>

              {/* Main Mode Toggle: Rewrite vs Translate - Only show on rewrite page */}
              {defaultMode !== 'translate' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">בחר מצב</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setIsTranslateMode(false)}
                    className={`p-4 rounded-lg border-2 transition-all text-right ${!isTranslateMode
                      ? 'border-[#5146E5] bg-[#E9E8F8]'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!isTranslateMode ? 'border-[#5146E5]' : 'border-gray-300'
                        }`}>
                        {!isTranslateMode && (
                          <div className="w-2 h-2 rounded-full bg-[#5146E5]"></div>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">שכתוב תוכן</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      יצירת תוכן חדש לחלוטין על בסיס ההנחיה שלך
                    </p>
                  </button>

                  <button
                    onClick={() => setIsTranslateMode(true)}
                    className={`p-4 rounded-lg border-2 transition-all text-right ${isTranslateMode
                      ? 'border-[#5146E5] bg-[#E9E8F8]'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isTranslateMode ? 'border-[#5146E5]' : 'border-gray-300'
                        }`}>
                        {isTranslateMode && (
                          <div className="w-2 h-2 rounded-full bg-[#5146E5]"></div>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">תרגום תוכן</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      תרגום מדויק של כל התוכן בין שפות שונות
                    </p>
                  </button>
                </div>
              </div>
              )}

              {/* Translation Language Selectors */}
              {isTranslateMode && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">בחר שפות לתרגום</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">שפת מקור (Source)</label>
                      <select
                        value={sourceLanguage}
                        onChange={(e) => setSourceLanguage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#5146E5] focus:ring-1 focus:ring-[#5146E5]"
                        dir="rtl"
                      >
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">שפת יעד (Target)</label>
                      <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#5146E5] focus:ring-1 focus:ring-[#5146E5]"
                        dir="rtl"
                      >
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Rewrite Mode Selector - Only show if NOT in translate mode */}
              {!isTranslateMode && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">מצב שכתוב</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setRewriteMode('strict')}
                    className={`p-4 rounded-lg border-2 transition-all text-right ${rewriteMode === 'strict'
                      ? 'border-[#5146E5] bg-[#E9E8F8]'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${rewriteMode === 'strict' ? 'border-[#5146E5]' : 'border-gray-300'
                        }`}>
                        {rewriteMode === 'strict' && (
                          <div className="w-2 h-2 rounded-full bg-[#5146E5]"></div>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">מצב קפדני</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      שומר על מבנה מדויק - משכתב רק טקסט באלמנטים קיימים. מושלם לשמירה על פריסות מדויקות.
                    </p>
                  </button>

                  <button
                    onClick={() => setRewriteMode('flexible')}
                    className={`p-4 rounded-lg border-2 transition-all text-right relative ${rewriteMode === 'flexible'
                      ? 'border-[#5146E5] bg-[#E9E8F8]'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${rewriteMode === 'flexible' ? 'border-[#5146E5]' : 'border-gray-300'
                        }`}>
                        {rewriteMode === 'flexible' && (
                          <div className="w-2 h-2 rounded-full bg-[#5146E5]"></div>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">מצב גמיש</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      מתאים מבנה לפי הצורך - יכול להציע שקפים חדשים, טבלאות, ותרשימים. מתאים נקודות תבליט ותזרים תוכן תוך שמירה על העיצוב הכללי.
                    </p>
                  </button>
                </div>
              </div>
              )}

              {/* Language Selector - Only show if NOT in translate mode */}
              {!isTranslateMode && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">שפת פלט</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setLanguage('english')}
                    className={`p-3 rounded-lg border-2 transition-all text-right ${language === 'english'
                      ? 'border-[#5146E5] bg-[#E9E8F8]'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${language === 'english' ? 'border-[#5146E5]' : 'border-gray-300'
                        }`}>
                        {language === 'english' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#5146E5]"></div>
                        )}
                      </div>
                      <span className="font-medium text-gray-900">English</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 mr-5">טקסט משמאל לימין</p>
                  </button>

                  <button
                    onClick={() => setLanguage('hebrew')}
                    className={`p-3 rounded-lg border-2 transition-all text-right ${language === 'hebrew'
                      ? 'border-[#5146E5] bg-[#E9E8F8]'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${language === 'hebrew' ? 'border-[#5146E5]' : 'border-gray-300'
                        }`}>
                        {language === 'hebrew' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#5146E5]"></div>
                        )}
                      </div>
                      <span className="font-medium text-gray-900">עברית (Hebrew)</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 mr-5">תצוגה מימין לשמאל</p>
                  </button>
                </div>
              </div>
              )}

              {/* Slide Count for Flexible Mode */}
              {!isTranslateMode && rewriteMode === 'flexible' && (
                <div className="mb-6">
                  <label htmlFor="slideCount" className="block text-sm font-medium text-gray-700 mb-2">
                    מספר שקפים יעד (אופציונלי)
                  </label>
                  <input
                    id="slideCount"
                    type="number"
                    min="0"
                    max="50"
                    value={targetSlideCount || ''}
                    onChange={(e) => setTargetSlideCount(parseInt(e.target.value) || 0)}
                    placeholder={`השאר ריק לאוטומטי (כרגע ${placeholderStructure?.slides.length || 0} שקפים)`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-[#5146E5] focus:ring-1 focus:ring-[#5146E5]"
                    dir="rtl"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ציין כמה שקפים אתה רוצה במצגת הסופית (השאר כ-0 לאוטומטי)
                  </p>
                </div>
              )}

              {/* Source File Upload for Content Extraction */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  חלץ תוכן מקובץ (אופציונלי)
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  העלה קובץ PDF או PPTX כדי לחלץ את התוכן שלו ולהשתמש בו כהנחיה שלך
                </p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".pdf,.pptx"
                      onChange={handleSourceFileChange}
                      className="hidden"
                      id="source-file-upload"
                    />
                    <label
                      htmlFor="source-file-upload"
                      className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#5146E5] transition-colors text-sm"
                      dir="rtl"
                    >
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {sourceFile ? sourceFile.name : 'בחר קובץ PDF או PPTX'}
                      </span>
                    </label>
                  </div>
                  {sourceFile && !extractedContent && (
                    <Button
                      onClick={handleExtractContent}
                      disabled={loading}
                      variant="outline"
                      className="border-[#5146E5] text-[#5146E5] hover:bg-[#E9E8F8]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          מחלץ...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          חלץ תוכן
                        </>
                      )}
                    </Button>
                  )}
                  {extractedContent && userPrompt === extractedContent && (
                    <Button
                      onClick={handleDiscardExtractedContent}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      הסר תוכן מחולץ
                    </Button>
                  )}
                </div>
                {extractedContent && userPrompt === extractedContent && (
                  <div className="mt-2" dir="rtl">
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      משתמש בתוכן מחולץ ({extractedContent.length} תווים מ-{sourceFile?.name})
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isTranslateMode ? 'הוראות נוספות (אופציונלי)' : 'תיאור התוכן'}
                </label>
                {isTranslateMode && (
                  <p className="text-xs text-gray-600 mb-2">
                    אופציונלי: הוסף הוראות נוספות למתרגם (למשל: "השתמש בשפה פורמלית" או "תרגם מונחים טכניים")
                  </p>
                )}
                <Textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder={
                    isTranslateMode
                      ? 'אופציונלי: הוסף הוראות נוספות למתרגם...'
                      : 'דוגמה: צור מצגת על פתרונות אנרגיה בת-קיימא, עם התמקדות באנרגיה סולארית ורוח. כלול יתרונות, אסטרטגיות יישום ומקרי בוחן.'
                  }
                  rows={6}
                  className="w-full border-gray-300 focus:border-[#5146E5] focus:ring-[#5146E5]"
                  dir="rtl"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-50 py-6"
                  size="lg"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  התחל מחדש
                </Button>
                <Button
                  onClick={handleGenerateContent}
                  disabled={loading || (!isTranslateMode && !userPrompt.trim())}
                  className="flex-1 bg-[#5146E5] hover:bg-[#4136D5] text-white font-medium py-6"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isTranslateMode ? 'מתרגם...' : 'יוצר תוכן...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      {isTranslateMode ? 'תרגם מצגת' : 'יצירת תוכן'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && rewrittenContent && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#5146E5] text-white font-semibold">
                  3
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold font-instrument_sans">
                    {isTranslateMode ? 'תצוגה מקדימה של תרגום' : 'תצוגה מקדימה של תוכן שנוצר'}
                  </h2>
                  {isTranslateMode && (
                    <p className="text-sm text-gray-600 mt-1">
                      תורגם: {sourceLanguage} → {targetLanguage}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-gray-600 mb-4">
                {isTranslateMode
                  ? 'בדוק וערוך את התרגום לפני ההורדה'
                  : 'בדוק וערוך את התוכן שנכתב מחדש לפני ההורדה'
                }
              </p>

              <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  לחץ על כל שקופית כדי לערוך את התוכן שלה
                </p>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {rewrittenContent.slides.map((slide, slideIdx) => {
                  const isEditing = editingSlide === slideIdx
                  const originalSlide = placeholderStructure?.slides[slideIdx]

                  return (
                    <div key={slideIdx} className={`border rounded-lg p-6 transition-all ${isEditing ? 'border-[#5146E5] bg-white shadow-lg' : 'border-gray-200 bg-gray-50'
                      }`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-[#5146E5]">
                          שקופית {slide.slideNumber} ({slide.elements.length} אלמנטים)
                        </h3>
                        <Button
                          onClick={() => toggleEditSlide(slideIdx)}
                          variant={isEditing ? "default" : "outline"}
                          size="sm"
                          className={isEditing ? "bg-[#5146E5] hover:bg-[#4136D5]" : ""}
                        >
                          {isEditing ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              סיום
                            </>
                          ) : (
                            <>
                              <Edit2 className="w-4 h-4 mr-1" />
                              עריכה
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {slide.elements.map((element, elemIdx) => {
                          const originalElement = originalSlide?.elements.find(e => e.id === element.id)
                          const displayName = originalElement ? getElementDisplayName(originalElement) : element.id
                          const icon = originalElement ? getElementIcon(originalElement.type) : '📄'
                          const maxLengthWarning = originalElement?.maxLength && element.text.length > originalElement.maxLength

                          return (
                            <div key={element.id} className="border-l-4 border-[#5146E5] pl-4 py-2">
                              <div className="flex items-center justify-between mb-2">
                                <label className="font-medium text-sm text-gray-700 flex items-center gap-2">
                                  <span>{icon}</span>
                                  <span>{displayName}</span>
                                  {originalElement?.type === 'notes' && (
                                    <span className="text-xs text-gray-500">(הערות דובר)</span>
                                  )}
                                  {maxLengthWarning && (
                                    <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                      חורג מאורך מקסימלי!
                                    </span>
                                  )}
                                </label>
                                {originalElement && (
                                  <span className="text-xs text-gray-500">
                                    {element.text.length}/{originalElement.maxLength || '∞'} תווים
                                  </span>
                                )}
                              </div>
                              {isEditing ? (
                                <Textarea
                                  value={element.text}
                                  onChange={(e) => handleUpdateElementText(slideIdx, element.id, e.target.value)}
                                  rows={Math.min(element.text.split('\n').length + 1, 5)}
                                  className={`w-full border-gray-300 focus:border-[#5146E5] focus:ring-[#5146E5] text-sm ${maxLengthWarning ? 'border-red-300' : ''
                                    }`}
                                  placeholder={`הכנס טקסט ${displayName.toLowerCase()}...`}
                                />
                              ) : (
                                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">
                                  {element.text}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={handlePreview}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 border-[#5146E5] text-[#5146E5] hover:bg-[#E9E8F8] py-6"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      יוצר תצוגה מקדימה...
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5 mr-2" />
                      תצוגה מקדימה ב-PowerPoint
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={loading}
                  className="flex-1 bg-[#5146E5] hover:bg-[#4136D5] text-white font-medium py-6"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      יוצר הורדה...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      הורדת מצגת
                    </>
                  )}
                </Button>
              </div>
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50"
                size="lg"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                התחל מחדש
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Download Complete */}
        {step === 'download' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-6">
                <Download className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-semibold font-instrument_sans mb-3 text-green-600">
                ההורדה הושלמה!
              </h2>

              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                המצגת עם התוכן החדש והעיצוב המקורי נשמרה בתיקיית ההורדות שלך.
              </p>

              <Button
                onClick={handleReset}
                className="bg-[#5146E5] hover:bg-[#4136D5] text-white font-medium py-6 px-8"
                size="lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                צור מצגת נוספת
              </Button>
            </div>
          </div>
        )}
      </main>
    </Wrapper>
  )
}
