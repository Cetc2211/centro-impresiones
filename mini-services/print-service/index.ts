/**
 * Print Service - Servicio de impresión para el centro de copias
 * 
 * Funcionalidades:
 * - Detección de impresoras en la red (mDNS/Bonjour)
 * - Impresión via IPP (Internet Printing Protocol)
 * - Impresión via Socket directo (JetDirect)
 * - Soporte para dúplex, pares/impares, color/B/N
 */

import { serve } from "bun";

// Types
interface Printer {
  id: string;
  name: string;
  ip: string;
  port: number;
  protocol: 'ipp' | 'socket' | 'airprint';
  model: string;
  capabilities: {
    color: boolean;
    duplex: boolean;
    paperSizes: string[];
    resolution: number;
  };
  status: 'online' | 'offline' | 'busy' | 'error';
  queueLength: number;
}

interface PrintJob {
  id: string;
  printerId: string;
  documentBase64: string;
  documentName: string;
  options: {
    copies: number;
    color: boolean;
    duplex: 'none' | 'long-edge' | 'short-edge';
    pageRanges?: string;
    paperSize: string;
    quality: 'draft' | 'normal' | 'high';
    collate: boolean;
    pagesPerSheet: number;
    // Modo uso personal
    personalUse: boolean;
  };
  status: 'pending' | 'printing' | 'completed' | 'error';
  pagesPrinted: number;
  totalPages: number;
  cost: number;
  error?: string;
}

// Base de datos en memoria de impresoras
const printers: Map<string, Printer> = new Map();

// Cola de trabajos de impresión
const printQueue: Map<string, PrintJob> = new Map();

// Impresoras conocidas (configuración inicial)
const knownPrinters: Printer[] = [
  {
    id: 'hp-color-laserjet',
    name: 'HP Color LaserJet Pro MFP M479fdw',
    ip: '192.168.1.100',
    port: 631,
    protocol: 'ipp',
    model: 'HP Color LaserJet Pro MFP M479fdw',
    capabilities: {
      color: true,
      duplex: true,
      paperSizes: ['letter', 'legal', 'a4', 'executive'],
      resolution: 600
    },
    status: 'online',
    queueLength: 0
  },
  {
    id: 'hp-laserjet-bw',
    name: 'HP LaserJet Pro M404n',
    ip: '192.168.1.101',
    port: 9100,
    protocol: 'socket',
    model: 'HP LaserJet Pro M404n',
    capabilities: {
      color: false,
      duplex: false,
      paperSizes: ['letter', 'legal', 'a4'],
      resolution: 1200
    },
    status: 'online',
    queueLength: 0
  },
  {
    id: 'hp-tank-570',
    name: 'HP Smart Tank 570',
    ip: '192.168.1.102',
    port: 631,
    protocol: 'ipp',
    model: 'HP Smart Tank 570',
    capabilities: {
      color: true,
      duplex: true,
      paperSizes: ['letter', 'legal', 'a4', 'photo-4x6', 'photo-5x7'],
      resolution: 4800
    },
    status: 'online',
    queueLength: 0
  }
];

// Inicializar impresoras conocidas
knownPrinters.forEach(p => printers.set(p.id, p));

// Función para detectar impresoras en la red (simulación)
async function discoverPrinters(): Promise<Printer[]> {
  // En producción, esto usaría mDNS/Bonjour o escaneo de red
  // Por ahora, retornamos las impresoras conocidas
  
  // Simulación de escaneo de red
  const networkPrinters: Printer[] = [];
  
  for (const [id, printer] of printers) {
    // Simular ping a la impresora
    try {
      // En producción: const isReachable = await checkPrinterReachable(printer.ip, printer.port);
      const isReachable = true; // Simulación
      
      if (isReachable) {
        networkPrinters.push({
          ...printer,
          status: 'online'
        });
      }
    } catch (error) {
      networkPrinters.push({
        ...printer,
        status: 'offline'
      });
    }
  }
  
  return networkPrinters;
}

// Función para calcular el costo de impresión
function calculatePrintCost(
  pages: number,
  copies: number,
  color: boolean,
  personalUse: boolean
): number {
  if (personalUse) return 0;
  
  const totalPages = pages * copies;
  const costPerPage = color ? 0.15 : 0.05; // Costos configurables
  
  return totalPages * costPerPage;
}

// Función para generar comando PCL para dúplex
function generatePCLCommands(options: PrintJob['options']): Buffer {
  const commands: number[] = [];
  
  // Reset printer
  commands.push(0x1B, 0x45); // ESC E
  
  // Número de copias
  commands.push(0x1B, 0x26, 0x6C, ...toPCLNumber(options.copies), 0x58); // ESC &l # X
  
  // Dúplex
  if (options.duplex !== 'none') {
    const duplexMode = options.duplex === 'long-edge' ? 1 : 2;
    commands.push(0x1B, 0x26, 0x6C, duplexMode, 0x53); // ESC &l # S
  }
  
  // Tamaño de papel
  const paperSizeMap: Record<string, number> = {
    'letter': 2,
    'legal': 3,
    'a4': 26,
    'executive': 1
  };
  const paperCode = paperSizeMap[options.paperSize] || 2;
  commands.push(0x1B, 0x26, 0x6C, paperCode, 0x41); // ESC &l # A
  
  // Calidad de impresión
  const qualityMap = { 'draft': 300, 'normal': 600, 'high': 1200 };
  // commands.push(0x1B, 0x2A, 0x74, ...toPCLNumber(qualityMap[options.quality]), 0x52);
  
  return Buffer.from(commands);
}

function toPCLNumber(num: number): number[] {
  return num.toString().split('').map(c => c.charCodeAt(0));
}

// Función para generar instrucciones de pares/impares
function generateParityInstructions(parity: 'all' | 'even' | 'odd'): string {
  const instructions: string[] = [];
  
  if (parity === 'even') {
    instructions.push('PRINT_PARITY=even');
  } else if (parity === 'odd') {
    instructions.push('PRINT_PARITY=odd');
  }
  
  return instructions.join('\n');
}

// Función para enviar trabajo de impresión via Socket (JetDirect)
async function sendToSocketPrinter(printer: Printer, data: Buffer, options: PrintJob['options']): Promise<{ success: boolean; error?: string }> {
  try {
    // En producción, esto abriría un socket TCP al puerto 9100
    // y enviaría los datos del documento
    
    console.log(`[PRINT] Enviando a ${printer.name} via Socket (${printer.ip}:${printer.port})`);
    console.log(`[PRINT] Opciones:`, options);
    
    // Simular envío exitoso
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Función para enviar trabajo de impresión via IPP
async function sendToIPPPrinter(printer: Printer, data: Buffer, options: PrintJob['options']): Promise<{ success: boolean; error?: string }> {
  try {
    // En producción, esto usaría la librería 'ipp' para enviar el trabajo
    // const ipp = require('ipp');
    // const printer = ipp.Printer(`http://${printer.ip}:${printer.port}/ipp/print`);
    
    console.log(`[PRINT] Enviando a ${printer.name} via IPP (${printer.ip}:${printer.port})`);
    console.log(`[PRINT] Opciones:`, options);
    
    // Simular envío exitoso
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Función para obtener el número de páginas de un PDF
async function getPDFPageCount(data: Buffer): Promise<number> {
  // En producción, usaríamos pdf-lib o similar
  // Por ahora, simulamos 1-10 páginas aleatorias
  return Math.floor(Math.random() * 10) + 1;
}

// API Server
const server = serve({
  port: 3005,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // GET /printers - Listar impresoras detectadas
      if (path === '/printers' && method === 'GET') {
        const discoveredPrinters = await discoverPrinters();
        return Response.json({ printers: discoveredPrinters }, { headers: corsHeaders });
      }
      
      // GET /printers/:id - Obtener detalles de una impresora
      const printerMatch = path.match(/^\/printers\/([^/]+)$/);
      if (printerMatch && method === 'GET') {
        const printerId = printerMatch[1];
        const printer = printers.get(printerId);
        
        if (!printer) {
          return Response.json({ error: 'Impresora no encontrada' }, { status: 404, headers: corsHeaders });
        }
        
        return Response.json(printer, { headers: corsHeaders });
      }
      
      // POST /scan - Escanear red en busca de impresoras
      if (path === '/scan' && method === 'POST') {
        const discoveredPrinters = await discoverPrinters();
        
        // Agregar impresoras descubiertas a la lista
        for (const printer of discoveredPrinters) {
          if (!printers.has(printer.id)) {
            printers.set(printer.id, printer);
          }
        }
        
        return Response.json({ 
          message: 'Escaneo completado',
          printersFound: discoveredPrinters.length,
          printers: discoveredPrinters 
        }, { headers: corsHeaders });
      }
      
      // POST /print - Enviar trabajo de impresión
      if (path === '/print' && method === 'POST') {
        const body = await req.json();
        const { printerId, documentBase64, documentName, options } = body as {
          printerId: string;
          documentBase64: string;
          documentName: string;
          options: PrintJob['options'];
        };
        
        const printer = printers.get(printerId);
        if (!printer) {
          return Response.json({ error: 'Impresora no encontrada' }, { status: 404, headers: corsHeaders });
        }
        
        if (printer.status === 'offline') {
          return Response.json({ error: 'Impresora fuera de línea' }, { status: 400, headers: corsHeaders });
        }
        
        // Decodificar documento
        const documentData = Buffer.from(documentBase64, 'base64');
        
        // Obtener número de páginas
        const pageCount = await getPDFPageCount(documentData);
        
        // Calcular costo
        const cost = calculatePrintCost(
          pageCount,
          options.copies,
          options.color,
          options.personalUse
        );
        
        // Crear trabajo de impresión
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const job: PrintJob = {
          id: jobId,
          printerId,
          documentBase64,
          documentName,
          options,
          status: 'printing',
          pagesPrinted: 0,
          totalPages: pageCount * options.copies,
          cost
        };
        
        printQueue.set(jobId, job);
        
        // Enviar a la impresora
        let result;
        if (printer.protocol === 'ipp') {
          result = await sendToIPPPrinter(printer, documentData, options);
        } else {
          result = await sendToSocketPrinter(printer, documentData, options);
        }
        
        // Actualizar estado del trabajo
        if (result.success) {
          job.status = 'completed';
          job.pagesPrinted = job.totalPages;
        } else {
          job.status = 'error';
          job.error = result.error;
        }
        
        return Response.json({
          jobId,
          status: job.status,
          pagesPrinted: job.pagesPrinted,
          totalPages: job.totalPages,
          cost: job.cost,
          error: job.error
        }, { headers: corsHeaders });
      }
      
      // GET /jobs - Listar trabajos de impresión
      if (path === '/jobs' && method === 'GET') {
        const jobs = Array.from(printQueue.values()).slice(-50);
        return Response.json({ jobs }, { headers: corsHeaders });
      }
      
      // GET /jobs/:id - Estado de un trabajo
      const jobMatch = path.match(/^\/jobs\/([^/]+)$/);
      if (jobMatch && method === 'GET') {
        const jobId = jobMatch[1];
        const job = printQueue.get(jobId);
        
        if (!job) {
          return Response.json({ error: 'Trabajo no encontrado' }, { status: 404, headers: corsHeaders });
        }
        
        return Response.json(job, { headers: corsHeaders });
      }
      
      // POST /print/wifi-direct - Imprimir via WiFi Direct
      if (path === '/print/wifi-direct' && method === 'POST') {
        const body = await req.json();
        const { printerIP, documentBase64, options } = body;
        
        // Similar a /print pero con IP directa
        const documentData = Buffer.from(documentBase64, 'base64');
        const pageCount = await getPDFPageCount(documentData);
        const cost = calculatePrintCost(pageCount, options.copies, options.color, options.personalUse);
        
        const jobId = `job_${Date.now()}`;
        
        // Simular impresión directa
        console.log(`[WIFI-DIRECT] Enviando a ${printerIP}`);
        
        return Response.json({
          jobId,
          status: 'completed',
          pagesPrinted: pageCount * options.copies,
          totalPages: pageCount * options.copies,
          cost
        }, { headers: corsHeaders });
      }
      
      // POST /document/pages - Obtener número de páginas de un documento
      if (path === '/document/pages' && method === 'POST') {
        const body = await req.json();
        const { documentBase64 } = body;
        
        const documentData = Buffer.from(documentBase64, 'base64');
        const pageCount = await getPDFPageCount(documentData);
        
        return Response.json({ pageCount }, { headers: corsHeaders });
      }
      
      // Ruta no encontrada
      return Response.json({ error: 'Ruta no encontrada' }, { status: 404, headers: corsHeaders });
      
    } catch (error) {
      console.error('[ERROR]', error);
      return Response.json({ 
        error: 'Error interno del servidor',
        message: String(error)
      }, { status: 500, headers: corsHeaders });
    }
  }
});

console.log(`🖨️  Print Service running on port ${server.port}`);
console.log(`📡 API endpoints:`);
console.log(`   GET  /printers     - Listar impresoras`);
console.log(`   GET  /printers/:id - Detalles de impresora`);
console.log(`   POST /scan         - Escanear red`);
console.log(`   POST /print        - Enviar trabajo de impresión`);
console.log(`   GET  /jobs         - Listar trabajos`);
console.log(`   GET  /jobs/:id     - Estado de trabajo`);
console.log(`   POST /print/wifi-direct - Impresión WiFi Direct`);
