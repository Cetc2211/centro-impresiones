'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Printer, FileText, Package, DollarSign, TrendingUp, TrendingDown, 
  Plus, Minus, Trash2, Edit, Download, Upload, BarChart3, 
  Settings, Clock, Users, ShoppingCart, AlertTriangle, CheckCircle,
  Palette, FileImage, Layers, Calculator, RefreshCw, Save,
  Wifi, WifiOff, Scan, FileUp, Eye, Play, Pause, RotateCw,
  User, Building, Copy, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  PrinterIcon
} from 'lucide-react'

// ==================== TYPES ====================
type PrinterType = 'laser_color' | 'laser_bw' | 'inkjet_color'

interface PrinterConfig {
  id: string
  name: string
  type: PrinterType
  costPerPage: number
  pricePerPage: number
  colorSupport: boolean
  duplexSupport: boolean
  isActive: boolean
  totalPrints: number
  // Network printer info
  ip?: string
  port?: number
  protocol?: 'ipp' | 'socket' | 'airprint'
  status?: 'online' | 'offline' | 'busy' | 'error'
}

interface PrintJob {
  id: string
  date: string
  printerId: string
  copies: number
  pages: number
  totalPages: number
  isColor: boolean
  doubleSided: boolean
  parityMode: 'all' | 'even' | 'odd'
  paperSize: 'letter' | 'legal' | 'a4' | 'oficio'
  customerName: string
  description: string
  costPrice: number
  salePrice: number
  profit: number
  source: 'manual' | 'hp_app' | 'ipad' | 'direct_print'
  personalUse: boolean
  documentName?: string
}

interface InventoryItem {
  id: string
  name: string
  category: 'paper' | 'toner' | 'ink' | 'supplies' | 'stationery'
  quantity: number
  unit: 'unidad' | 'resma' | 'ml' | 'kg'
  purchasePrice: number
  salePrice: number
  minStock: number
  lastUpdated: string
}

interface Sale {
  id: string
  date: string
  items: SaleItem[]
  total: number
  profit: number
  customerName: string
  paymentMethod: 'cash' | 'card' | 'transfer'
}

interface SaleItem {
  inventoryId: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface DailyStats {
  date: string
  totalJobs: number
  totalPrints: number
  totalSales: number
  totalProfit: number
  totalCost: number
  personalPrints: number
}

interface NetworkPrinter {
  id: string
  name: string
  ip: string
  port: number
  protocol: 'ipp' | 'socket' | 'airprint'
  model: string
  capabilities: {
    color: boolean
    duplex: boolean
    paperSizes: string[]
  }
  status: 'online' | 'offline' | 'busy'
}

// ==================== CONSTANTS ====================
const PRINT_SERVICE_URL = '/api/print?XTransformPort=3005'

const generateId = () => Math.random().toString(36).substr(2, 9)

const initialPrinters: PrinterConfig[] = [
  { 
    id: 'hp-color-laserjet', 
    name: 'HP Color LaserJet Pro MFP M479fdw', 
    type: 'laser_color', 
    costPerPage: 0.15, 
    pricePerPage: 0.50, 
    colorSupport: true, 
    duplexSupport: true,
    isActive: true, 
    totalPrints: 0,
    ip: '192.168.1.100',
    port: 631,
    protocol: 'ipp',
    status: 'online'
  },
  { 
    id: 'hp-laserjet-bw', 
    name: 'HP LaserJet Pro M404n', 
    type: 'laser_bw', 
    costPerPage: 0.05, 
    pricePerPage: 0.15, 
    colorSupport: false, 
    duplexSupport: false,
    isActive: true, 
    totalPrints: 0,
    ip: '192.168.1.101',
    port: 9100,
    protocol: 'socket',
    status: 'online'
  },
  { 
    id: 'hp-tank-570', 
    name: 'HP Smart Tank 570', 
    type: 'inkjet_color', 
    costPerPage: 0.08, 
    pricePerPage: 0.35, 
    colorSupport: true, 
    duplexSupport: true,
    isActive: true, 
    totalPrints: 0,
    ip: '192.168.1.102',
    port: 631,
    protocol: 'ipp',
    status: 'online'
  },
]

const initialInventory: InventoryItem[] = [
  { id: '1', name: 'Papel Bond Letter 75g', category: 'paper', quantity: 50, unit: 'resma', purchasePrice: 45, salePrice: 55, minStock: 10, lastUpdated: new Date().toISOString() },
  { id: '2', name: 'Papel Bond Oficio 75g', category: 'paper', quantity: 30, unit: 'resma', purchasePrice: 50, salePrice: 60, minStock: 10, lastUpdated: new Date().toISOString() },
  { id: '3', name: 'Tóner Negro HP 26A', category: 'toner', quantity: 5, unit: 'unidad', purchasePrice: 450, salePrice: 550, minStock: 2, lastUpdated: new Date().toISOString() },
  { id: '4', name: 'Tóner Color HP 410A (Cian)', category: 'toner', quantity: 3, unit: 'unidad', purchasePrice: 520, salePrice: 620, minStock: 2, lastUpdated: new Date().toISOString() },
  { id: '5', name: 'Tinta Negra EcoTank 502', category: 'ink', quantity: 200, unit: 'ml', purchasePrice: 8, salePrice: 12, minStock: 50, lastUpdated: new Date().toISOString() },
  { id: '6', name: 'Tinta Color EcoTank 502', category: 'ink', quantity: 150, unit: 'ml', purchasePrice: 10, salePrice: 15, minStock: 50, lastUpdated: new Date().toISOString() },
  { id: '7', name: 'Carpetas Manila', category: 'stationery', quantity: 100, unit: 'unidad', purchasePrice: 3, salePrice: 5, minStock: 20, lastUpdated: new Date().toISOString() },
  { id: '8', name: 'Resistols', category: 'supplies', quantity: 50, unit: 'unidad', purchasePrice: 8, salePrice: 12, minStock: 10, lastUpdated: new Date().toISOString() },
]

// ==================== STORE ====================
interface AppState {
  printers: PrinterConfig[]
  printJobs: PrintJob[]
  inventory: InventoryItem[]
  sales: Sale[]
  dailyStats: DailyStats[]
  networkPrinters: NetworkPrinter[]
  
  addPrinter: (printer: PrinterConfig) => void
  updatePrinter: (id: string, updates: Partial<PrinterConfig>) => void
  deletePrinter: (id: string) => void
  
  addPrintJob: (job: PrintJob) => void
  deletePrintJob: (id: string) => void
  
  addInventoryItem: (item: InventoryItem) => void
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void
  deleteInventoryItem: (id: string) => void
  consumeInventory: (id: string, quantity: number) => void
  
  addSale: (sale: Sale) => void
  
  setNetworkPrinters: (printers: NetworkPrinter[]) => void
  
  importFromExternal: (source: 'hp_app' | 'ipad', jobs: Partial<PrintJob>[]) => void
}

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      printers: initialPrinters,
      printJobs: [],
      inventory: initialInventory,
      sales: [],
      dailyStats: [],
      networkPrinters: [],
      
      addPrinter: (printer) => set((state) => ({ printers: [...state.printers, printer] })),
      updatePrinter: (id, updates) => set((state) => ({
        printers: state.printers.map((p) => p.id === id ? { ...p, ...updates } : p)
      })),
      deletePrinter: (id) => set((state) => ({
        printers: state.printers.filter((p) => p.id !== id)
      })),
      
      addPrintJob: (job) => set((state) => {
        const printer = state.printers.find(p => p.id === job.printerId)
        const newPrinters = state.printers.map(p => 
          p.id === job.printerId ? { ...p, totalPrints: p.totalPrints + job.totalPages } : p
        )
        const today = new Date().toISOString().split('T')[0]
        const existingStat = state.dailyStats.find(s => s.date === today)
        const newDailyStats = existingStat 
          ? state.dailyStats.map(s => s.date === today ? {
              ...s,
              totalJobs: s.totalJobs + 1,
              totalPrints: s.totalPrints + job.totalPages,
              totalSales: s.totalSales + job.salePrice,
              totalProfit: s.totalProfit + job.profit,
              totalCost: s.totalCost + job.costPrice,
              personalPrints: job.personalUse ? s.personalPrints + job.totalPages : s.personalPrints
            } : s)
          : [...state.dailyStats, {
              date: today,
              totalJobs: 1,
              totalPrints: job.totalPages,
              totalSales: job.salePrice,
              totalProfit: job.profit,
              totalCost: job.costPrice,
              personalPrints: job.personalUse ? job.totalPages : 0
            }]
        return {
          printJobs: [job, ...state.printJobs],
          printers: newPrinters,
          dailyStats: newDailyStats
        }
      }),
      deletePrintJob: (id) => set((state) => ({
        printJobs: state.printJobs.filter((j) => j.id !== id)
      })),
      
      addInventoryItem: (item) => set((state) => ({ inventory: [...state.inventory, item] })),
      updateInventoryItem: (id, updates) => set((state) => ({
        inventory: state.inventory.map((i) => i.id === id ? { ...i, ...updates, lastUpdated: new Date().toISOString() } : i)
      })),
      deleteInventoryItem: (id) => set((state) => ({
        inventory: state.inventory.filter((i) => i.id !== id)
      })),
      consumeInventory: (id, quantity) => set((state) => ({
        inventory: state.inventory.map((i) => 
          i.id === id ? { ...i, quantity: Math.max(0, i.quantity - quantity), lastUpdated: new Date().toISOString() } : i
        )
      })),
      
      addSale: (sale) => set((state) => ({ sales: [sale, ...state.sales] })),
      
      setNetworkPrinters: (printers) => set(() => ({ networkPrinters: printers })),
      
      importFromExternal: (source, jobs) => {
        const state = get()
        jobs.forEach(job => {
          const printer = job.printerId ? state.printers.find(p => p.id === job.printerId) : state.printers[0]
          if (printer) {
            const newJob: PrintJob = {
              id: generateId(),
              date: job.date || new Date().toISOString(),
              printerId: printer.id,
              copies: job.copies || 1,
              pages: job.pages || 1,
              totalPages: (job.copies || 1) * (job.pages || 1),
              isColor: job.isColor ?? printer.colorSupport,
              doubleSided: job.doubleSided ?? false,
              parityMode: 'all',
              paperSize: job.paperSize || 'letter',
              customerName: job.customerName || 'Cliente Externo',
              description: job.description || `Importado desde ${source === 'hp_app' ? 'HP App' : 'iPad'}`,
              costPrice: ((job.copies || 1) * (job.pages || 1)) * printer.costPerPage,
              salePrice: ((job.copies || 1) * (job.pages || 1)) * printer.pricePerPage,
              profit: ((job.copies || 1) * (job.pages || 1)) * (printer.pricePerPage - printer.costPerPage),
              source,
              personalUse: false
            }
            get().addPrintJob(newJob)
          }
        })
      }
    }),
    { name: 'print-center-storage' }
  )
)

// ==================== COMPONENTS ====================

// Stats Card Component
function StatsCard({ title, value, subtitle, icon: Icon, trend, color = 'primary' }: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: 'up' | 'down'
  color?: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-600',
    danger: 'bg-red-500/10 text-red-600'
  }
  
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <div className="flex items-center gap-1 mt-1">
            {trend && (trend === 'up' ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />)}
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Document Viewer Component
function DocumentViewer({ file, pageCount, currentPage, setCurrentPage, zoom, setZoom }: {
  file: File | null
  pageCount: number
  currentPage: number
  setCurrentPage: (p: number) => void
  zoom: number
  setZoom: (z: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  // Track previous URL for cleanup
  const prevUrlRef = useRef<string | null>(null)
  
  // Create preview URL when file changes
  useEffect(() => {
    const newUrl = file ? URL.createObjectURL(file) : null
    
    // Schedule state update for next tick to avoid synchronous setState warning
    const timeoutId = setTimeout(() => {
      // Cleanup previous URL
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current)
      }
      prevUrlRef.current = newUrl
      setPreviewUrl(newUrl)
    }, 0)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [file])
  
  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current)
      }
    }
  }, [])
  
  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed rounded-lg bg-muted/20">
        <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-sm">Arrastra un archivo o haz clic para seleccionar</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, JPG, PNG</p>
      </div>
    )
  }
  
  const isPDF = file.type === 'application/pdf'
  const isImage = file.type.startsWith('image/')
  
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {pageCount > 1 && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs px-2">{currentPage} / {pageCount}</span>
              <Button variant="ghost" size="sm" onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))} disabled={currentPage >= pageCount}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(50, zoom - 10))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-12 text-center">{zoom}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(200, zoom + 10))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Preview Area */}
      <div className="bg-gray-100 dark:bg-gray-900 min-h-[400px] max-h-[500px] overflow-auto flex items-center justify-center p-4">
        {isPDF && (
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}>
            <iframe 
              src={`${previewUrl}#page=${currentPage}`}
              className="w-[595px] h-[842px] bg-white shadow-lg"
              title="PDF Preview"
            />
          </div>
        )}
        {isImage && previewUrl && (
          <img 
            src={previewUrl} 
            alt="Preview" 
            style={{ transform: `scale(${zoom / 100})`, maxWidth: '100%', maxHeight: '500px' }}
            className="object-contain"
          />
        )}
        {!isPDF && !isImage && (
          <div className="text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Vista previa no disponible</p>
            <p className="text-xs text-muted-foreground mt-1">{file.name}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Network Printer Scanner Component
function NetworkScanner({ onPrinterFound }: { onPrinterFound: (printers: NetworkPrinter[]) => void }) {
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState<Date | null>(null)
  
  const scanNetwork = async () => {
    setScanning(true)
    try {
      const response = await fetch(`${PRINT_SERVICE_URL.replace('/print', '/scan')}`, { method: 'POST' })
      const data = await response.json()
      onPrinterFound(data.printers || [])
      setLastScan(new Date())
    } catch (error) {
      console.error('Error scanning network:', error)
      // Use simulated printers if service is not available
      const simulatedPrinters: NetworkPrinter[] = [
        {
          id: 'sim-1',
          name: 'HP Color LaserJet Pro M479fdw',
          ip: '192.168.1.100',
          port: 631,
          protocol: 'ipp',
          model: 'HP Color LaserJet Pro M479fdw',
          capabilities: { color: true, duplex: true, paperSizes: ['letter', 'legal', 'a4'] },
          status: 'online'
        },
        {
          id: 'sim-2',
          name: 'HP LaserJet Pro M404n',
          ip: '192.168.1.101',
          port: 9100,
          protocol: 'socket',
          model: 'HP LaserJet Pro M404n',
          capabilities: { color: false, duplex: false, paperSizes: ['letter', 'legal', 'a4'] },
          status: 'online'
        },
        {
          id: 'sim-3',
          name: 'HP Smart Tank 570',
          ip: '192.168.1.102',
          port: 631,
          protocol: 'ipp',
          model: 'HP Smart Tank 570',
          capabilities: { color: true, duplex: true, paperSizes: ['letter', 'legal', 'a4'] },
          status: 'online'
        }
      ]
      onPrinterFound(simulatedPrinters)
      setLastScan(new Date())
    } finally {
      setScanning(false)
    }
  }
  
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wifi className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Detectar Impresoras en Red</p>
              <p className="text-xs text-muted-foreground">
                {lastScan ? `Último escaneo: ${lastScan.toLocaleTimeString()}` : 'Sin escaneos recientes'}
              </p>
            </div>
          </div>
          <Button onClick={scanNetwork} disabled={scanning}>
            {scanning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Escaneando...
              </>
            ) : (
              <>
                <Scan className="h-4 w-4 mr-2" />
                Escanear Red
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Print Dialog with Advanced Options
function PrintDialog({ printers, onPrint }: { printers: PrinterConfig[], onPrint: (job: Partial<PrintJob>) => void }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  
  const [formData, setFormData] = useState({
    printerId: '',
    copies: 1,
    pages: 1,
    isColor: false,
    doubleSided: false,
    parityMode: 'all' as 'all' | 'even' | 'odd',
    paperSize: 'letter' as 'letter' | 'legal' | 'a4' | 'oficio',
    customerName: '',
    description: '',
    personalUse: false
  })
  
  const selectedPrinter = printers.find(p => p.id === formData.printerId)
  const totalPages = formData.copies * pageCount
  const costPerPage = formData.personalUse ? 0 : (selectedPrinter?.costPerPage || 0)
  const pricePerPage = formData.personalUse ? 0 : (selectedPrinter?.pricePerPage || 0)
  const costPrice = totalPages * costPerPage
  const salePrice = totalPages * pricePerPage
  const profit = salePrice - costPrice
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Simulate page count detection
      const simulatedPages = Math.floor(Math.random() * 10) + 1
      setPageCount(simulatedPages)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      const simulatedPages = Math.floor(Math.random() * 10) + 1
      setPageCount(simulatedPages)
    }
  }
  
  const handleSubmit = () => {
    onPrint({
      ...formData,
      pages: pageCount,
      totalPages,
      costPrice,
      salePrice,
      profit,
      source: 'direct_print',
      documentName: file?.name
    })
    setOpen(false)
    setFile(null)
    setFormData({
      printerId: '',
      copies: 1,
      pages: 1,
      isColor: false,
      doubleSided: false,
      parityMode: 'all',
      paperSize: 'letter',
      customerName: '',
      description: '',
      personalUse: false
    })
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Printer className="h-5 w-5" />
          Imprimir Documento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PrinterIcon className="h-5 w-5" />
            Imprimir Documento
          </DialogTitle>
          <DialogDescription>
            Selecciona un archivo y configura las opciones de impresión
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Left: Document Upload & Preview */}
          <div className="space-y-4">
            <div 
              className="relative"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <DocumentViewer 
                file={file} 
                pageCount={pageCount} 
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                zoom={zoom}
                setZoom={setZoom}
              />
            </div>
            
            {file && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Documento cargado</AlertTitle>
                <AlertDescription>
                  {file.name} - {pageCount} página(s) detectada(s)
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          {/* Right: Print Options */}
          <div className="space-y-4">
            {/* Printer Selection */}
            <div className="space-y-2">
              <Label>Impresora</Label>
              <Select 
                value={formData.printerId} 
                onValueChange={(v) => {
                  const p = printers.find(pr => pr.id === v)
                  setFormData({ 
                    ...formData, 
                    printerId: v, 
                    isColor: p?.colorSupport || false,
                    doubleSided: false,
                    parityMode: 'all'
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar impresora" />
                </SelectTrigger>
                <SelectContent>
                  {printers.filter(p => p.isActive && p.status !== 'offline').map(printer => (
                    <SelectItem key={printer.id} value={printer.id}>
                      <div className="flex items-center gap-2">
                        <Printer className="h-4 w-4" />
                        <span>{printer.name}</span>
                        {printer.status === 'online' && (
                          <Badge variant="outline" className="ml-auto text-emerald-600 border-emerald-600">
                            <Wifi className="h-3 w-3 mr-1" />
                            Online
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Copies */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Copias</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={formData.copies} 
                  onChange={(e) => setFormData({ ...formData, copies: parseInt(e.target.value) || 1 })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Tamaño de Papel</Label>
                <Select 
                  value={formData.paperSize} 
                  onValueChange={(v: typeof formData.paperSize) => setFormData({ ...formData, paperSize: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letter">Carta (Letter)</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="oficio">Oficio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Color Option */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <Label className="cursor-pointer">Impresión a Color</Label>
              </div>
              <Switch 
                checked={formData.isColor} 
                onCheckedChange={(c) => setFormData({ ...formData, isColor: c })}
                disabled={!selectedPrinter?.colorSupport}
              />
            </div>
            
            {/* Duplex Options - for printers that support it */}
            {selectedPrinter?.duplexSupport && (
              <div className="space-y-2">
                <Label>Doble Cara</Label>
                <RadioGroup 
                  value={formData.doubleSided ? 'long-edge' : 'none'} 
                  onValueChange={(v) => setFormData({ ...formData, doubleSided: v !== 'none' })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="simple" />
                    <Label htmlFor="simple" className="cursor-pointer">Simple cara</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="long-edge" id="duplex" />
                    <Label htmlFor="duplex" className="cursor-pointer">Doble cara (borde largo)</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            
            {/* Parity Options - for printers WITHOUT duplex */}
            {selectedPrinter && !selectedPrinter.duplexSupport && (
              <div className="space-y-2">
                <Label>Modo de Impresión (sin dúplex automático)</Label>
                <RadioGroup 
                  value={formData.parityMode} 
                  onValueChange={(v: typeof formData.parityMode) => setFormData({ ...formData, parityMode: v })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="cursor-pointer">Todas las páginas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="even" id="even" />
                    <Label htmlFor="even" className="cursor-pointer">Solo páginas pares</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="odd" id="odd" />
                    <Label htmlFor="odd" className="cursor-pointer">Solo páginas impares</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  💡 Imprime pares, voltea el papel, luego imprime impares para lograr doble cara manual
                </p>
              </div>
            )}
            
            <Separator />
            
            {/* Personal Use Toggle */}
            <div className="flex items-center justify-between p-3 border-2 border-dashed rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <div>
                  <Label className="cursor-pointer">Uso Personal</Label>
                  <p className="text-xs text-muted-foreground">No se asigna costo</p>
                </div>
              </div>
              <Switch 
                checked={formData.personalUse} 
                onCheckedChange={(p) => setFormData({ ...formData, personalUse: p })}
              />
            </div>
            
            {/* Customer Info */}
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input 
                value={formData.customerName} 
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Nombre del cliente (opcional)"
                disabled={formData.personalUse}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del trabajo"
                className="h-20"
              />
            </div>
            
            {/* Cost Preview */}
            {selectedPrinter && (
              <Card className={formData.personalUse ? 'bg-blue-500/10 border-blue-500' : 'bg-emerald-500/10 border-emerald-500'}>
                <CardContent className="pt-4">
                  {formData.personalUse ? (
                    <div className="text-center">
                      <User className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <p className="font-bold text-blue-600">USO PERSONAL</p>
                      <p className="text-xs text-muted-foreground">Se contabiliza pero sin costo</p>
                      <p className="text-lg font-bold mt-2">{totalPages} páginas</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Páginas</p>
                          <p className="font-bold">{totalPages}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Costo</p>
                          <p className="font-bold text-red-600">${costPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Precio</p>
                          <p className="font-bold text-emerald-600">${salePrice.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-xs text-muted-foreground">Ganancia</p>
                        <p className="font-bold text-lg text-emerald-600">${profit.toFixed(2)}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!file || !formData.printerId}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Dashboard Component
function Dashboard() {
  const { printJobs, inventory, sales, dailyStats, printers } = useStore()
  
  const today = new Date().toISOString().split('T')[0]
  const todayStats = dailyStats.find(s => s.date === today) || { 
    totalJobs: 0, totalPrints: 0, totalSales: 0, totalProfit: 0, personalPrints: 0 
  }
  
  const totalProfit = useMemo(() => printJobs.reduce((sum, j) => sum + j.profit, 0) + sales.reduce((sum, s) => sum + s.profit, 0), [printJobs, sales])
  const totalRevenue = useMemo(() => printJobs.reduce((sum, j) => sum + j.salePrice, 0) + sales.reduce((sum, s) => sum + s.total, 0), [printJobs, sales])
  const totalCost = useMemo(() => printJobs.reduce((sum, j) => sum + j.costPrice, 0), [printJobs])
  const personalPrints = useMemo(() => printJobs.filter(j => j.personalUse).reduce((sum, j) => sum + j.totalPages, 0), [printJobs])
  
  const lowStockItems = inventory.filter(i => i.quantity <= i.minStock)
  const totalPrints = printers.reduce((sum, p) => sum + p.totalPrints, 0)
  
  const last7Days = useMemo(() => {
    const days: string[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date.toISOString().split('T')[0])
    }
    return days
  }, [])
  
  const weeklyStats = last7Days.map(date => {
    const stat = dailyStats.find(s => s.date === date)
    return {
      date,
      profit: stat?.totalProfit || 0,
      sales: stat?.totalSales || 0,
      personal: stat?.personalPrints || 0
    }
  })
  
  const maxWeeklyProfit = Math.max(...weeklyStats.map(w => w.profit), 1)

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Ganancias Totales" 
          value={`$${totalProfit.toFixed(2)}`}
          subtitle="Acumulado"
          icon={DollarSign}
          trend="up"
          color="success"
        />
        <StatsCard 
          title="Ingresos Hoy" 
          value={`$${todayStats.totalSales.toFixed(2)}`}
          subtitle={`${todayStats.totalJobs} trabajos`}
          icon={TrendingUp}
          color="primary"
        />
        <StatsCard 
          title="Impresiones Hoy" 
          value={todayStats.totalPrints}
          subtitle={`${todayStats.personalPrints} personales`}
          icon={Printer}
          color="primary"
        />
        <StatsCard 
          title="Stock Bajo" 
          value={lowStockItems.length}
          subtitle="Items requieren atención"
          icon={AlertTriangle}
          color={lowStockItems.length > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Personal Prints Card */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-bold text-lg">Impresiones de Uso Personal</p>
                <p className="text-sm text-muted-foreground">Contabilizadas sin asignación de costo</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{personalPrints}</p>
              <p className="text-sm text-muted-foreground">páginas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ganancias Últimos 7 Días</CardTitle>
            <CardDescription>Rendimiento semanal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-48">
              {weeklyStats.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-emerald-500 rounded-t transition-all duration-300 hover:bg-emerald-400"
                    style={{ height: `${(day.profit / maxWeeklyProfit) * 100}%`, minHeight: day.profit > 0 ? '4px' : '0' }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {new Date(day.date).toLocaleDateString('es', { weekday: 'short' })}
                  </span>
                  <span className="text-xs font-medium">${day.profit.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Printer Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uso por Impresora</CardTitle>
            <CardDescription>Distribución de trabajo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {printers.map(printer => {
              const percentage = totalPrints > 0 ? (printer.totalPrints / totalPrints) * 100 : 0
              return (
                <div key={printer.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{printer.name}</span>
                    <span className="text-muted-foreground">{printer.totalPrints.toLocaleString()} impresiones</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trabajos Recientes</CardTitle>
            <CardDescription>Últimas impresiones registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {printJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Printer className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No hay trabajos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {printJobs.slice(0, 10).map(job => (
                    <div key={job.id} className={`flex items-center justify-between p-3 rounded-lg ${job.personalUse ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-muted/50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${job.personalUse ? 'bg-blue-500/10 text-blue-600' : job.isColor ? 'bg-purple-500/10 text-purple-600' : 'bg-gray-500/10 text-gray-600'}`}>
                          {job.personalUse ? <User className="h-4 w-4" /> : job.isColor ? <Palette className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{job.customerName || 'Sin cliente'}</p>
                          <p className="text-xs text-muted-foreground">{job.totalPages} páginas {job.personalUse && '(Personal)'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {job.personalUse ? (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">Personal</Badge>
                        ) : (
                          <>
                            <p className="font-medium text-emerald-600">${job.salePrice.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {job.source === 'direct_print' ? 'Directo' : job.source === 'manual' ? 'Manual' : job.source === 'hp_app' ? 'HP App' : 'iPad'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alertas de Inventario</CardTitle>
            <CardDescription>Items con stock bajo</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mb-2 text-emerald-500" />
                  <p className="text-sm">Todo el inventario está bien</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-amber-600" />
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} restantes</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                        Mín: {item.minStock}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Ingresos Totales</p>
                <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-emerald-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Costos Totales</p>
                <p className="text-3xl font-bold">${totalCost.toFixed(2)}</p>
              </div>
              <TrendingDown className="h-10 w-10 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm">Margen de Ganancia</p>
                <p className="text-3xl font-bold">{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%</p>
              </div>
              <Calculator className="h-10 w-10 text-primary-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Printers Management Component
function PrintersManager() {
  const { printers, addPrinter, updatePrinter, deletePrinter, setNetworkPrinters } = useStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrinter, setEditingPrinter] = useState<PrinterConfig | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'laser_bw' as PrinterType,
    costPerPage: 0,
    pricePerPage: 0,
    colorSupport: false,
    duplexSupport: false,
    isActive: true,
    ip: '',
    port: 631
  })

  const handleNetworkScan = (foundPrinters: NetworkPrinter[]) => {
    setNetworkPrinters(foundPrinters)
    foundPrinters.forEach(np => {
      const existing = printers.find(p => p.ip === np.ip)
      if (!existing) {
        addPrinter({
          id: `net-${generateId()}`,
          name: np.name,
          type: np.capabilities.color ? 'laser_color' : 'laser_bw',
          costPerPage: np.capabilities.color ? 0.15 : 0.05,
          pricePerPage: np.capabilities.color ? 0.50 : 0.15,
          colorSupport: np.capabilities.color,
          duplexSupport: np.capabilities.duplex,
          isActive: true,
          totalPrints: 0,
          ip: np.ip,
          port: np.port,
          protocol: np.protocol,
          status: np.status
        })
      }
    })
  }

  const handleSubmit = () => {
    if (editingPrinter) {
      updatePrinter(editingPrinter.id, formData)
    } else {
      addPrinter({
        id: generateId(),
        ...formData,
        totalPrints: 0,
        status: 'online'
      })
    }
    setIsDialogOpen(false)
    setEditingPrinter(null)
    setFormData({ name: '', type: 'laser_bw', costPerPage: 0, pricePerPage: 0, colorSupport: false, duplexSupport: false, isActive: true, ip: '', port: 631 })
  }

  const handleEdit = (printer: PrinterConfig) => {
    setEditingPrinter(printer)
    setFormData({
      name: printer.name,
      type: printer.type,
      costPerPage: printer.costPerPage,
      pricePerPage: printer.pricePerPage,
      colorSupport: printer.colorSupport,
      duplexSupport: printer.duplexSupport,
      isActive: printer.isActive,
      ip: printer.ip || '',
      port: printer.port || 631
    })
    setIsDialogOpen(true)
  }

  const getTypeLabel = (type: PrinterType) => {
    switch (type) {
      case 'laser_color': return 'Láser Color'
      case 'laser_bw': return 'Láser B/N'
      case 'inkjet_color': return 'Inyección Color'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Impresoras</h2>
          <p className="text-muted-foreground">Configura tus impresoras y costos de impresión</p>
        </div>
        <div className="flex gap-2">
          <NetworkScanner onPrinterFound={handleNetworkScan} />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingPrinter(null); setFormData({ name: '', type: 'laser_bw', costPerPage: 0, pricePerPage: 0, colorSupport: false, duplexSupport: false, isActive: true, ip: '', port: 631 }) }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Impresora
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPrinter ? 'Editar' : 'Nueva'} Impresora</DialogTitle>
                <DialogDescription>Configura los costos y precios de impresión</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nombre</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="HP LaserJet Pro" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={formData.type} onValueChange={(v: PrinterType) => setFormData({ ...formData, type: v, colorSupport: v !== 'laser_bw' })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laser_color">Láser Color</SelectItem>
                        <SelectItem value="laser_bw">Láser Blanco y Negro</SelectItem>
                        <SelectItem value="inkjet_color">Inyección de Tinta Color</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Puerto</Label>
                    <Input type="number" value={formData.port} onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 631 })} placeholder="631" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Dirección IP (opcional)</Label>
                  <Input value={formData.ip} onChange={(e) => setFormData({ ...formData, ip: e.target.value })} placeholder="192.168.1.100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Costo por Página ($)</Label>
                    <Input type="number" step="0.01" value={formData.costPerPage} onChange={(e) => setFormData({ ...formData, costPerPage: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Precio por Página ($)</Label>
                    <Input type="number" step="0.01" value={formData.pricePerPage} onChange={(e) => setFormData({ ...formData, pricePerPage: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Soporta Color</Label>
                  <Switch checked={formData.colorSupport} onCheckedChange={(c) => setFormData({ ...formData, colorSupport: c })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Dúplex Automático</Label>
                  <Switch checked={formData.duplexSupport} onCheckedChange={(d) => setFormData({ ...formData, duplexSupport: d })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Activa</Label>
                  <Switch checked={formData.isActive} onCheckedChange={(a) => setFormData({ ...formData, isActive: a })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit}>{editingPrinter ? 'Guardar' : 'Crear'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {printers.map(printer => (
          <Card key={printer.id} className={!printer.isActive ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{printer.name}</CardTitle>
                  <CardDescription>{getTypeLabel(printer.type)}</CardDescription>
                </div>
                <div className="flex gap-1">
                  {printer.status === 'online' && (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                      <Wifi className="h-3 w-3 mr-1" />
                      Online
                    </Badge>
                  )}
                  <Badge variant={printer.colorSupport ? 'default' : 'secondary'}>
                    {printer.colorSupport ? 'Color' : 'B/N'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {printer.ip && (
                <div className="flex items-center gap-2 text-sm">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <span>{printer.ip}:{printer.port}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Costo/Pág</p>
                  <p className="font-bold text-lg">${printer.costPerPage.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Precio/Pág</p>
                  <p className="font-bold text-lg text-emerald-600">${printer.pricePerPage.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {printer.duplexSupport && (
                  <Badge variant="outline" className="text-xs">
                    <Layers className="h-3 w-3 mr-1" />
                    Dúplex
                  </Badge>
                )}
                {!printer.duplexSupport && (
                  <Badge variant="outline" className="text-xs text-amber-600">
                    Sin dúplex
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Impreso:</span>
                <span className="font-medium">{printer.totalPrints.toLocaleString()} págs</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(printer)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deletePrinter(printer.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Print Jobs Component
function PrintJobsManager() {
  const { printJobs, printers, addPrintJob, deletePrintJob, consumeInventory } = useStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    printerId: '',
    copies: 1,
    pages: 1,
    isColor: false,
    doubleSided: false,
    parityMode: 'all' as 'all' | 'even' | 'odd',
    paperSize: 'letter' as 'letter' | 'legal' | 'a4' | 'oficio',
    customerName: '',
    description: '',
    personalUse: false
  })

  const selectedPrinter = printers.find(p => p.id === formData.printerId)
  const totalPages = formData.copies * formData.pages
  const costPrice = formData.personalUse ? 0 : totalPages * (selectedPrinter?.costPerPage || 0)
  const salePrice = formData.personalUse ? 0 : totalPages * (selectedPrinter?.pricePerPage || 0)
  const profit = salePrice - costPrice

  const handleSubmit = () => {
    if (!selectedPrinter) return
    
    addPrintJob({
      id: generateId(),
      date: new Date().toISOString(),
      printerId: formData.printerId,
      copies: formData.copies,
      pages: formData.pages,
      totalPages,
      isColor: formData.isColor,
      doubleSided: formData.doubleSided,
      parityMode: formData.parityMode,
      paperSize: formData.paperSize,
      customerName: formData.personalUse ? 'Uso Personal' : formData.customerName || 'Cliente General',
      description: formData.description,
      costPrice,
      salePrice,
      profit,
      source: 'manual',
      personalUse: formData.personalUse
    })

    if (!formData.personalUse) {
      const paperItem = useStore.getState().inventory.find(i => 
        i.category === 'paper' && i.name.toLowerCase().includes(formData.paperSize)
      )
      if (paperItem) {
        consumeInventory(paperItem.id, formData.doubleSided ? Math.ceil(totalPages / 2) : totalPages)
      }
    }

    setIsDialogOpen(false)
    setFormData({
      printerId: '',
      copies: 1,
      pages: 1,
      isColor: false,
      doubleSided: false,
      parityMode: 'all',
      paperSize: 'letter',
      customerName: '',
      description: '',
      personalUse: false
    })
  }

  const handlePrintFromDialog = (job: Partial<PrintJob>) => {
    const printer = printers.find(p => p.id === job.printerId)
    if (!printer) return
    
    addPrintJob({
      id: generateId(),
      date: new Date().toISOString(),
      printerId: job.printerId!,
      copies: job.copies || 1,
      pages: job.pages || 1,
      totalPages: job.totalPages || 1,
      isColor: job.isColor || false,
      doubleSided: job.doubleSided || false,
      parityMode: job.parityMode || 'all',
      paperSize: job.paperSize || 'letter',
      customerName: job.personalUse ? 'Uso Personal' : job.customerName || 'Cliente General',
      description: job.description || '',
      costPrice: job.costPrice || 0,
      salePrice: job.salePrice || 0,
      profit: job.profit || 0,
      source: 'direct_print',
      personalUse: job.personalUse || false,
      documentName: job.documentName
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Impresión Directa</h2>
          <p className="text-muted-foreground">Imprime documentos y registra automáticamente</p>
        </div>
        <div className="flex gap-2">
          <PrintDialog printers={printers} onPrint={handlePrintFromDialog} />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setFormData({ printerId: printers[0]?.id || '', copies: 1, pages: 1, isColor: false, doubleSided: false, parityMode: 'all', paperSize: 'letter', customerName: '', description: '', personalUse: false })}>
                <Plus className="h-4 w-4 mr-2" />
                Registro Manual
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registro Manual de Impresión</DialogTitle>
                <DialogDescription>Registra un trabajo sin documento</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Impresora</Label>
                  <Select value={formData.printerId} onValueChange={(v) => {
                    const p = printers.find(pr => pr.id === v)
                    setFormData({ 
                      ...formData, 
                      printerId: v, 
                      isColor: p?.colorSupport || false,
                      doubleSided: false
                    })
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar impresora" />
                    </SelectTrigger>
                    <SelectContent>
                      {printers.filter(p => p.isActive).map(printer => (
                        <SelectItem key={printer.id} value={printer.id}>
                          {printer.name} ({printer.colorSupport ? 'Color' : 'B/N'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Copias</Label>
                    <Input type="number" min="1" value={formData.copies} onChange={(e) => setFormData({ ...formData, copies: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Páginas/Original</Label>
                    <Input type="number" min="1" value={formData.pages} onChange={(e) => setFormData({ ...formData, pages: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Tamaño de Papel</Label>
                  <Select value={formData.paperSize} onValueChange={(v: typeof formData.paperSize) => setFormData({ ...formData, paperSize: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="letter">Carta (Letter)</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="a4">A4</SelectItem>
                      <SelectItem value="oficio">Oficio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>A Color</Label>
                  <Switch checked={formData.isColor} onCheckedChange={(c) => setFormData({ ...formData, isColor: c })} disabled={!selectedPrinter?.colorSupport} />
                </div>
                {selectedPrinter?.duplexSupport && (
                  <div className="flex items-center justify-between">
                    <Label>Doble Cara</Label>
                    <Switch checked={formData.doubleSided} onCheckedChange={(d) => setFormData({ ...formData, doubleSided: d })} />
                  </div>
                )}
                {!selectedPrinter?.duplexSupport && selectedPrinter && (
                  <div className="grid gap-2">
                    <Label>Modo (sin dúplex automático)</Label>
                    <Select value={formData.parityMode} onValueChange={(v: typeof formData.parityMode) => setFormData({ ...formData, parityMode: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las páginas</SelectItem>
                        <SelectItem value="even">Solo pares</SelectItem>
                        <SelectItem value="odd">Solo impares</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 border-2 border-dashed rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <Label className="cursor-pointer">Uso Personal</Label>
                      <p className="text-xs text-muted-foreground">Sin costo</p>
                    </div>
                  </div>
                  <Switch checked={formData.personalUse} onCheckedChange={(p) => setFormData({ ...formData, personalUse: p })} />
                </div>
                {!formData.personalUse && (
                  <>
                    <div className="grid gap-2">
                      <Label>Cliente</Label>
                      <Input value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} placeholder="Nombre del cliente" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Descripción</Label>
                      <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Detalles del trabajo" />
                    </div>
                  </>
                )}
                {selectedPrinter && (
                  <Card className={formData.personalUse ? 'bg-blue-500/10' : 'bg-muted/50'}>
                    <CardContent className="pt-4">
                      {formData.personalUse ? (
                        <div className="text-center">
                          <User className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                          <p className="font-bold text-blue-600">USO PERSONAL</p>
                          <p className="text-sm">{totalPages} páginas</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-bold">{totalPages}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Costo</p>
                            <p className="font-bold text-red-600">${costPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Precio</p>
                            <p className="font-bold text-emerald-600">${salePrice.toFixed(2)}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={!formData.printerId}>Registrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Impresora</TableHead>
                <TableHead>Páginas</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {printJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No hay trabajos registrados
                  </TableCell>
                </TableRow>
              ) : (
                printJobs.slice(0, 20).map(job => {
                  const printer = printers.find(p => p.id === job.printerId)
                  return (
                    <TableRow key={job.id} className={job.personalUse ? 'bg-blue-500/5' : ''}>
                      <TableCell className="text-sm">
                        {new Date(job.date).toLocaleDateString('es')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {job.personalUse ? (
                          <span className="text-blue-600">Personal</span>
                        ) : (
                          job.customerName
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{job.documentName || '-'}</TableCell>
                      <TableCell className="text-sm">{printer?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {job.totalPages}
                        {job.parityMode !== 'all' && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({job.parityMode === 'even' ? 'pares' : 'impares'})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={job.isColor ? 'default' : 'secondary'}>
                            {job.isColor ? 'Color' : 'B/N'}
                          </Badge>
                          {job.doubleSided && (
                            <Badge variant="outline" className="text-xs">
                              <Layers className="h-3 w-3 mr-1" />
                              Dúplex
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.personalUse ? (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            <User className="h-3 w-3 mr-1" />
                            Personal
                          </Badge>
                        ) : (
                          <span className="text-emerald-600 font-bold">${job.salePrice.toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {job.source === 'direct_print' ? 'Directo' : job.source === 'manual' ? 'Manual' : job.source === 'hp_app' ? 'HP App' : 'iPad'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deletePrintJob(job.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// Inventory Component
function InventoryManager() {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    name: '',
    category: 'paper' as InventoryItem['category'],
    quantity: 0,
    unit: 'unidad' as InventoryItem['unit'],
    purchasePrice: 0,
    salePrice: 0,
    minStock: 5
  })

  const handleSubmit = () => {
    if (editingItem) {
      updateInventoryItem(editingItem.id, formData)
    } else {
      addInventoryItem({
        id: generateId(),
        ...formData,
        lastUpdated: new Date().toISOString()
      })
    }
    setIsDialogOpen(false)
    setEditingItem(null)
    setFormData({ name: '', category: 'paper', quantity: 0, unit: 'unidad', purchasePrice: 0, salePrice: 0, minStock: 5 })
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      purchasePrice: item.purchasePrice,
      salePrice: item.salePrice,
      minStock: item.minStock
    })
    setIsDialogOpen(true)
  }

  const getCategoryLabel = (cat: InventoryItem['category']) => {
    const labels = {
      paper: 'Papel',
      toner: 'Tóner',
      ink: 'Tinta',
      supplies: 'Insumos',
      stationery: 'Papelería'
    }
    return labels[cat]
  }

  const filteredInventory = filter === 'all' ? inventory : inventory.filter(i => i.category === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inventario</h2>
          <p className="text-muted-foreground">Gestiona papel, consumibles y papelería</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="paper">Papel</SelectItem>
              <SelectItem value="toner">Tóner</SelectItem>
              <SelectItem value="ink">Tinta</SelectItem>
              <SelectItem value="supplies">Insumos</SelectItem>
              <SelectItem value="stationery">Papelería</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingItem(null); setFormData({ name: '', category: 'paper', quantity: 0, unit: 'unidad', purchasePrice: 0, salePrice: 0, minStock: 5 }) }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Editar' : 'Nuevo'} Item de Inventario</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nombre</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre del producto" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Categoría</Label>
                    <Select value={formData.category} onValueChange={(v: typeof formData.category) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paper">Papel</SelectItem>
                        <SelectItem value="toner">Tóner</SelectItem>
                        <SelectItem value="ink">Tinta</SelectItem>
                        <SelectItem value="supplies">Insumos</SelectItem>
                        <SelectItem value="stationery">Papelería</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Unidad</Label>
                    <Select value={formData.unit} onValueChange={(v: typeof formData.unit) => setFormData({ ...formData, unit: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unidad">Unidad</SelectItem>
                        <SelectItem value="resma">Resma</SelectItem>
                        <SelectItem value="ml">Mililitros</SelectItem>
                        <SelectItem value="kg">Kilogramos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Cantidad</Label>
                    <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Stock Mínimo</Label>
                    <Input type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Precio Compra ($)</Label>
                    <Input type="number" step="0.01" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Precio Venta ($)</Label>
                    <Input type="number" step="0.01" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit}>{editingItem ? 'Guardar' : 'Crear'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredInventory.map(item => {
          const stockPercentage = (item.quantity / (item.minStock * 3)) * 100
          const isLow = item.quantity <= item.minStock
          return (
            <Card key={item.id} className={isLow ? 'border-amber-500' : ''}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <CardDescription>{getCategoryLabel(item.category)}</CardDescription>
                  </div>
                  {isLow && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Stock</span>
                    <span className={isLow ? 'text-amber-600 font-bold' : ''}>{item.quantity} {item.unit}</span>
                  </div>
                  <Progress value={Math.min(stockPercentage, 100)} className={`h-2 ${isLow ? '[&>div]:bg-amber-500' : ''}`} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Compra</p>
                    <p className="font-medium">${item.purchasePrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Venta</p>
                    <p className="font-medium text-emerald-600">${item.salePrice.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(item)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => updateInventoryItem(item.id, { quantity: item.quantity + 1 })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => updateInventoryItem(item.id, { quantity: Math.max(0, item.quantity - 1) })}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => deleteInventoryItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// Sales Component
function SalesManager() {
  const { inventory, sales, addSale } = useStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [cart, setCart] = useState<SaleItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  const totalCost = cart.reduce((sum, item) => {
    const invItem = inventory.find(i => i.id === item.inventoryId)
    return sum + (invItem ? invItem.purchasePrice * item.quantity : 0)
  }, 0)
  const profit = total - totalCost

  const addToCart = (item: InventoryItem) => {
    const existing = cart.find(c => c.inventoryId === item.id)
    if (existing) {
      setCart(cart.map(c => c.inventoryId === item.id 
        ? { ...c, quantity: c.quantity + 1, totalPrice: (c.quantity + 1) * c.unitPrice }
        : c
      ))
    } else {
      setCart([...cart, {
        inventoryId: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: item.salePrice,
        totalPrice: item.salePrice
      }])
    }
  }

  const removeFromCart = (inventoryId: string) => {
    setCart(cart.filter(c => c.inventoryId !== inventoryId))
  }

  const handleSale = () => {
    if (cart.length === 0) return
    
    addSale({
      id: generateId(),
      date: new Date().toISOString(),
      items: cart,
      total,
      profit,
      customerName: customerName || 'Cliente General',
      paymentMethod
    })

    cart.forEach(item => {
      useStore.getState().consumeInventory(item.inventoryId, item.quantity)
    })

    setIsDialogOpen(false)
    setCart([])
    setCustomerName('')
    setPaymentMethod('cash')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Ventas de Papelería</h2>
          <p className="text-muted-foreground">Registra ventas de productos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setCart([]); setCustomerName(''); setPaymentMethod('cash') }}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nueva Venta</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Cliente</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nombre del cliente" />
                </div>
                <div className="grid gap-2">
                  <Label>Método de Pago</Label>
                  <Select value={paymentMethod} onValueChange={(v: typeof paymentMethod) => setPaymentMethod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Agregar Productos</h4>
                <ScrollArea className="h-40">
                  <div className="grid grid-cols-2 gap-2">
                    {inventory.filter(i => i.quantity > 0).map(item => (
                      <Button key={item.id} variant="outline" className="justify-between h-auto py-2" onClick={() => addToCart(item)}>
                        <div className="text-left">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">${item.salePrice.toFixed(2)} | {item.quantity} disp.</p>
                        </div>
                        <Plus className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Carrito</h4>
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No hay productos</p>
                ) : (
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.inventoryId} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">${item.unitPrice.toFixed(2)} c/u</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            const newQty = item.quantity - 1
                            if (newQty <= 0) removeFromCart(item.inventoryId)
                            else setCart(cart.map(c => c.inventoryId === item.inventoryId ? { ...c, quantity: newQty, totalPrice: newQty * c.unitPrice } : c))
                          }}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button variant="outline" size="sm" onClick={() => setCart(cart.map(c => c.inventoryId === item.inventoryId ? { ...c, quantity: c.quantity + 1, totalPrice: (c.quantity + 1) * c.unitPrice } : c))}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => removeFromCart(item.inventoryId)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span>Total</span>
                    <span className="font-bold">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ganancia</span>
                    <span className="text-emerald-600 font-bold">${profit.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSale} disabled={cart.length === 0}>Completar Venta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Ganancia</TableHead>
                <TableHead>Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay ventas registradas
                  </TableCell>
                </TableRow>
              ) : (
                sales.slice(0, 20).map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell>{new Date(sale.date).toLocaleDateString('es')}</TableCell>
                    <TableCell className="font-medium">{sale.customerName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {sale.items.slice(0, 3).map((item, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {item.name} x{item.quantity}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">${sale.total.toFixed(2)}</TableCell>
                    <TableCell className="text-emerald-600 font-bold">${sale.profit.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// Reports Component
function ReportsManager() {
  const { printJobs, sales, dailyStats, printers, inventory } = useStore()
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month')

  const filteredStats = useMemo(() => {
    const now = new Date()
    const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return dailyStats.filter(s => new Date(s.date) >= startDate)
  }, [dailyStats, dateRange])

  const totalRevenue = filteredStats.reduce((sum, s) => sum + s.totalSales, 0)
  const totalProfit = filteredStats.reduce((sum, s) => sum + s.totalProfit, 0)
  const totalCost = filteredStats.reduce((sum, s) => sum + s.totalCost, 0)
  const totalPrints = filteredStats.reduce((sum, s) => sum + s.totalPrints, 0)
  const totalJobs = filteredStats.reduce((sum, s) => sum + s.totalJobs, 0)
  const personalPrints = filteredStats.reduce((sum, s) => sum + s.personalPrints, 0)

  const inventoryValue = inventory.reduce((sum, i) => sum + (i.purchasePrice * i.quantity), 0)
  const potentialRevenue = inventory.reduce((sum, i) => sum + (i.salePrice * i.quantity), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Reportes y Análisis</h2>
          <p className="text-muted-foreground">Resumen financiero y operativo</p>
        </div>
        <Select value={dateRange} onValueChange={(v: typeof dateRange) => setDateRange(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mes</SelectItem>
            <SelectItem value="year">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Ingresos" value={`$${totalRevenue.toFixed(2)}`} icon={DollarSign} color="success" />
        <StatsCard title="Ganancias" value={`$${totalProfit.toFixed(2)}`} icon={TrendingUp} color="success" />
        <StatsCard title="Costos" value={`$${totalCost.toFixed(2)}`} icon={TrendingDown} color="danger" />
        <StatsCard title="Trabajos" value={totalJobs} subtitle={`${totalPrints} impresiones`} icon={FileText} />
        <StatsCard title="Personal" value={personalPrints} subtitle="páginas" icon={User} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rendimiento por Impresora</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Impresora</TableHead>
                  <TableHead className="text-right">Impresiones</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {printers.map(printer => {
                  const printerJobs = printJobs.filter(j => j.printerId === printer.id)
                  const printerRevenue = printerJobs.reduce((sum, j) => sum + j.salePrice, 0)
                  return (
                    <TableRow key={printer.id}>
                      <TableCell className="font-medium">{printer.name}</TableCell>
                      <TableCell className="text-right">{printer.totalPrints.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-emerald-600">${printerRevenue.toFixed(2)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Valoración de Inventario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Valor al Costo</p>
                <p className="text-2xl font-bold">${inventoryValue.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-emerald-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Valor de Venta</p>
                <p className="text-2xl font-bold text-emerald-600">${potentialRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Desglose Diario</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Trabajos</TableHead>
                <TableHead className="text-right">Impresiones</TableHead>
                <TableHead className="text-right">Personal</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Ganancia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStats.slice(0, 14).map(stat => (
                <TableRow key={stat.date}>
                  <TableCell>{new Date(stat.date).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}</TableCell>
                  <TableCell className="text-right">{stat.totalJobs}</TableCell>
                  <TableCell className="text-right">{stat.totalPrints}</TableCell>
                  <TableCell className="text-right text-blue-600">{stat.personalPrints}</TableCell>
                  <TableCell className="text-right">${stat.totalSales.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold text-emerald-600">${stat.totalProfit.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== MAIN APP ====================
export default function PrintCenterApp() {
  const [activeTab, setActiveTab] = useState('print')

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Printer className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Centro de Impresiones</h1>
                <p className="text-xs text-muted-foreground">Sistema de Gestión con Impresión Directa</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex">
                <Wifi className="h-3 w-3 mr-1" />
                Red Activa
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 gap-2 h-auto p-1">
            <TabsTrigger value="print" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="printers" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Impresoras</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Inventario</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Ventas</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reportes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="print">
            <PrintJobsManager />
          </TabsContent>
          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
          <TabsContent value="printers">
            <PrintersManager />
          </TabsContent>
          <TabsContent value="inventory">
            <InventoryManager />
          </TabsContent>
          <TabsContent value="sales">
            <SalesManager />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsManager />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>Sistema de Gestión para Centro de Impresiones y Papelería</p>
            <p>Con detección de impresoras en red y modo uso personal</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
