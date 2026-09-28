import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

const maxBytes = 10 * 1024 * 1024
const maxPdfPages = 25

export async function readJobDescription(file: File): Promise<string> {
  if (!file.size) throw new Error('This file is empty.')
  if (file.size > maxBytes) throw new Error('Choose a file under 10 MB.')
  const extension = file.name.split('.').pop()?.toLowerCase()
  let text = ''
  if (extension === 'txt') {
    text = await file.text()
  } else if (extension === 'docx') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    text = result.value
  } else if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true })
    const pdf = await loadingTask.promise
    try {
      if (pdf.numPages > maxPdfPages) throw new Error('Choose a PDF with 25 pages or fewer.')
      const pages: string[] = []
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber)
        const content = await page.getTextContent()
        pages.push(content.items.filter((item): item is typeof item & { str: string } => 'str' in item).map(item => item.str).join(' '))
      }
      text = pages.join('\n')
    } finally {
      await loadingTask.destroy()
    }
  } else {
    throw new Error('Use a .docx, searchable .pdf, or .txt file.')
  }
  text = text.replace(/\r\n?/g, '\n').trim()
  if (!text) throw new Error('No selectable text was found. For a scanned PDF or image, paste the job description below.')
  return text
}
