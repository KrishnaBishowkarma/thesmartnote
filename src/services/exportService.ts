
import { Note } from "@/types/note";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export enum ExportFormat {
  PDF = "pdf",
  JSON = "json",
  TEXT = "txt",
  MARKDOWN = "md",
  HTML = "html"
}

// Export a single note
export const exportNote = async (note: Note, format: ExportFormat): Promise<void> => {
  let content = '';
  let filename = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}`;
  let mimeType = 'text/plain';
  
  switch (format) {
    case ExportFormat.PDF:
      await exportToPDF(note);
      return;
      
    case ExportFormat.JSON:
      content = JSON.stringify(note, null, 2);
      filename += '.json';
      mimeType = 'application/json';
      break;
      
    case ExportFormat.MARKDOWN:
      content = `# ${note.title}\n\n`;
      content += `${note.content}\n\n`;
      content += `Created: ${new Date(note.created_at).toLocaleString()}\n`;
      content += `Updated: ${new Date(note.updated_at).toLocaleString()}\n`;
      if (note.tags && note.tags.length > 0) {
        content += `Tags: ${note.tags.map(tag => tag.name).join(', ')}\n`;
      }
      filename += '.md';
      break;
      
    case ExportFormat.HTML:
      content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${note.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #333; }
    .content { white-space: pre-wrap; margin: 20px 0; }
    .meta { color: #666; font-size: 0.9em; }
    .tags { margin-top: 20px; }
    .tag { background: #eee; padding: 3px 8px; border-radius: 3px; margin-right: 5px; }
  </style>
</head>
<body>
  <h1>${note.title}</h1>
  <div class="content">${note.content}</div>
  <div class="meta">
    <div>Created: ${new Date(note.created_at).toLocaleString()}</div>
    <div>Updated: ${new Date(note.updated_at).toLocaleString()}</div>
  </div>
  ${note.tags && note.tags.length > 0 ? `
  <div class="tags">
    Tags: ${note.tags.map(tag => `<span class="tag">${tag.name}</span>`).join(' ')}
  </div>
  ` : ''}
</body>
</html>`;
      filename += '.html';
      mimeType = 'text/html';
      break;
      
    case ExportFormat.TEXT:
    default:
      content = `${note.title}\n\n`;
      content += `${note.content}\n\n`;
      content += `Created: ${new Date(note.created_at).toLocaleString()}\n`;
      content += `Updated: ${new Date(note.updated_at).toLocaleString()}\n`;
      if (note.tags && note.tags.length > 0) {
        content += `Tags: ${note.tags.map(tag => tag.name).join(', ')}\n`;
      }
      filename += '.txt';
      break;
  }
  
  // Create blob and trigger download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};

// Export multiple notes
export const exportNotes = (notes: Note[], format: ExportFormat): void => {
  let content = '';
  let filename = `smartnote_export_${new Date().toISOString().split('T')[0]}`;
  let mimeType = 'text/plain';
  
  switch (format) {
    case ExportFormat.JSON:
      content = JSON.stringify(notes, null, 2);
      filename += '.json';
      mimeType = 'application/json';
      break;
      
    case ExportFormat.MARKDOWN:
      content = notes.map(note => {
        let md = `# ${note.title}\n\n`;
        md += `${note.content}\n\n`;
        md += `Created: ${new Date(note.created_at).toLocaleString()}\n`;
        md += `Updated: ${new Date(note.updated_at).toLocaleString()}\n`;
        if (note.tags && note.tags.length > 0) {
          md += `Tags: ${note.tags.map(tag => tag.name).join(', ')}\n`;
        }
        md += '\n---\n\n';
        return md;
      }).join('');
      filename += '.md';
      break;
      
    case ExportFormat.HTML:
      content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartNote Export</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #333; }
    .note { margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
    .content { white-space: pre-wrap; margin: 20px 0; }
    .meta { color: #666; font-size: 0.9em; }
    .tags { margin-top: 20px; }
    .tag { background: #eee; padding: 3px 8px; border-radius: 3px; margin-right: 5px; }
  </style>
</head>
<body>
  <h1>SmartNote Export</h1>
  ${notes.map(note => `
  <div class="note">
    <h2>${note.title}</h2>
    <div class="content">${note.content}</div>
    <div class="meta">
      <div>Created: ${new Date(note.created_at).toLocaleString()}</div>
      <div>Updated: ${new Date(note.updated_at).toLocaleString()}</div>
    </div>
    ${note.tags && note.tags.length > 0 ? `
    <div class="tags">
      Tags: ${note.tags.map(tag => `<span class="tag">${tag.name}</span>`).join(' ')}
    </div>
    ` : ''}
  </div>
  `).join('')}
</body>
</html>`;
      filename += '.html';
      mimeType = 'text/html';
      break;
      
    case ExportFormat.TEXT:
    default:
      content = notes.map(note => {
        let txt = `${note.title}\n\n`;
        txt += `${note.content}\n\n`;
        txt += `Created: ${new Date(note.created_at).toLocaleString()}\n`;
        txt += `Updated: ${new Date(note.updated_at).toLocaleString()}\n`;
        if (note.tags && note.tags.length > 0) {
          txt += `Tags: ${note.tags.map(tag => tag.name).join(', ')}\n`;
        }
        txt += '\n---\n\n';
        return txt;
      }).join('');
      filename += '.txt';
      break;
  }
  
  // Create blob and trigger download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};

// Export to PDF
const exportToPDF = async (note: Note): Promise<void> => {
  // Create a temporary div to render the note
  const container = document.createElement('div');
  container.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1 style="color: #333;">${note.title}</h1>
      <div style="white-space: pre-wrap; margin: 20px 0; line-height: 1.6;">${note.content}</div>
      <div style="color: #666; font-size: 0.9em;">
        <div>Created: ${new Date(note.created_at).toLocaleString()}</div>
        <div>Updated: ${new Date(note.updated_at).toLocaleString()}</div>
      </div>
      ${note.tags && note.tags.length > 0 ? `
      <div style="margin-top: 20px;">
        Tags: ${note.tags.map(tag => tag.name).join(', ')}
      </div>
      ` : ''}
    </div>
  `;
  
  // Append to body temporarily (hidden)
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);
  
  try {
    // Generate canvas from the div
    const canvas = await html2canvas(container);
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculate dimensions to fit in A4
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Save PDF
    const filename = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
};
