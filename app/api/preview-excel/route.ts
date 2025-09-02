
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo encontrado' }, { status: 400 });
    }

    // Verificar se é um arquivo Excel
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ error: 'Formato de arquivo inválido. Use apenas .xlsx ou .xls' }, { status: 400 });
    }

    // Ler o arquivo Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Pegar a primeira planilha
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converter para JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '',
      raw: false 
    });

    // Pegar apenas as primeiras 20 linhas para preview
    const previewData = jsonData.slice(0, 20);
    
    // Identificar o tipo de arquivo baseado no nome
    let fileType = 'unknown';
    if (file.name.toLowerCase().includes('diario') || file.name.toLowerCase().includes('receitas')) {
      fileType = 'diario_receitas';
    } else if (file.name.toLowerCase().includes('controle') || file.name.toLowerCase().includes('formulas')) {
      fileType = 'relatorio_controle';
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        fileType: fileType,
        sheetName: sheetName,
        totalRows: jsonData.length,
        previewData: previewData,
        headers: previewData[0] || [],
        sampleRows: previewData.slice(1, 6) || []
      }
    });

  } catch (error) {
    console.error('Erro ao processar arquivo Excel:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar o arquivo Excel',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
