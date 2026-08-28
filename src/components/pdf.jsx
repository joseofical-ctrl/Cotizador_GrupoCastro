import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PDFPreview({ items, cliente, total, editId, onVolver, onDescargar }) {
  
  const logoPrincipal = "/cotizador/logo-grupocastro.jpg"; 
  const marcasLogos = {
    hikvision: "/cotizador/Logo-hikvision.webp",
    dahua: "/cotizador/Logo-dahua.webp",
    starlink: "/cotizador/Logo-starlink.webp",
    ezviz: "/cotizador/Logo-ezviz.webp"
  };

  const formatearMoneda = (cantidad) => {
    return Number(cantidad).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const historialPrevio = JSON.parse(localStorage.getItem('historialCotizaciones') || '[]');
  let proformaOriginal = null;
  let fechaMostrar = new Date().toLocaleDateString('es-PE'); 

  if (editId) {
    proformaOriginal = historialPrevio.find(cot => cot.id === editId);
    if (proformaOriginal && proformaOriginal.fecha) {
      fechaMostrar = proformaOriginal.fecha.split(',')[0]; 
    }
  }

  const descargarPDF = () => {
    try {
      const doc = new jsPDF();

      const cotizacionActual = {
        id: editId || Date.now(), 
        cliente: { ...cliente },
        items: [...items],
        total: formatearMoneda(total),
        fecha: editId && proformaOriginal ? proformaOriginal.fecha : new Date().toLocaleString('es-PE'),
      };

      let nuevoHistorial;
      if (editId) {
        nuevoHistorial = historialPrevio.map(cot => cot.id === editId ? cotizacionActual : cot);
      } else {
        nuevoHistorial = [cotizacionActual, ...historialPrevio].slice(0, 30);
      }

      localStorage.setItem('historialCotizaciones', JSON.stringify(nuevoHistorial));

      const agregarFooter = (documento) => {
        const techY = 245; 
        const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.hikvisionhuancayo.com/";
        documento.addImage(qrUrl, 'PNG', 12, techY, 22, 22);
        
        documento.setFontSize(9);
        documento.setTextColor(0, 0, 0);
        documento.setFont("helvetica", "bold");
        documento.text("Técnico Instalador:", 38, techY + 6);
        documento.setFontSize(11);
        documento.text("NILTON H. CASTRO M.", 38, techY + 12);
        documento.setFont("helvetica", "bold");
        documento.setTextColor(200, 0, 0);
        documento.setFontSize(9);
        documento.text("Cel. 993996443", 38, techY + 18);

        const footerLineY = techY + 25;
        documento.setDrawColor(230, 230, 230);
        documento.line(12, footerLineY, 198, footerLineY);
        
        documento.setFontSize(8);
        documento.setTextColor(150);
        documento.setFont("helvetica", "normal");
        documento.text("1.- Duración de la Oferta: 5 días calendarios.", 12, footerLineY + 5);
        documento.text("2.- Pago del 100% al momento de iniciar la instalación de equipos.", 12, footerLineY + 9);
        documento.text("3.- Soporte ilimitado vía WhatsApp y Telefónico 993996443.", 12, footerLineY + 13);
        
        documento.setFontSize(11);
        documento.setTextColor(150, 0, 0);
        documento.setFont("helvetica", "bold");
        documento.text("4 AÑOS GARANTÍA EN EQUIPOS HIKVISION", 105, footerLineY + 19, { align: 'center' });
      };

      doc.setFillColor(150, 0, 0);
      doc.rect(0, 0, 210, 8, 'F');
      
      doc.addImage(logoPrincipal, 'WEBP', 12, 12, 55, 16);
      
      const marcasStart = 90; 
      const separacionHorizontal = 32;
      doc.addImage(marcasLogos.hikvision, 'WEBP', marcasStart, 14, 25, 5);
      doc.addImage(marcasLogos.dahua, 'WEBP', marcasStart + separacionHorizontal, 14, 18, 5);
      doc.addImage(marcasLogos.starlink, 'WEBP', marcasStart, 23, 20, 5); 
      doc.addImage(marcasLogos.ezviz, 'WEBP', marcasStart + separacionHorizontal, 23, 18, 5);

      doc.setFontSize(8);
      doc.text("RUC: 10446038643", 198, 15, { align: 'right' });
      doc.setTextColor(150, 0, 0);
      doc.text("HUANCAYO - PERÚ", 198, 20, { align: 'right' });
      doc.line(12, 40, 198, 40);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("DATOS DEL CLIENTE", 12, 46);

      autoTable(doc, {
        startY: 48,
        margin: { left: 12, right: 12 },
        showHead: false,
        columns: [
          { dataKey: 'lbl1' },
          { dataKey: 'val1' },
          { dataKey: 'lbl2' },
          { dataKey: 'val2' }
        ],
        body: [
          { lbl1: 'CLIENTE:', val1: cliente.nombre.toUpperCase(), lbl2: 'FECHA:', val2: fechaMostrar },
          { lbl1: 'DIRECCIÓN:', val1: cliente.direccion.toUpperCase(), lbl2: 'TELÉFONO:', val2: cliente.telefono }
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 
          0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 25 }, 
          1: { cellWidth: 117 }, 
          2: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 22, halign: 'right' },
          3: { halign: 'right', cellWidth: 22 } 
        }
      });

      const tableBody = [];
      items.forEach(item => {
        // FILA PRINCIPAL
        tableBody.push([
          { content: item.cantidad, styles: { halign: 'center', valign: 'middle' } },
          { content: '', _customMarca: item.marca, _customModelo: item.modelo }, 
          { content: `S/ ${formatearMoneda(item.precioUnitario)}`, styles: { halign: 'right', valign: 'middle' } },
          { content: `S/ ${formatearMoneda(item.precioTotalFila)}`, styles: { halign: 'right', valign: 'middle' } }
        ]);

        // FILA DE DETALLE (100% Nativo de AutoTable)
        if (item.detalle) {
          // Limpieza extrema: Borramos espacios invisibles, saltos de línea y tabulaciones del copy-paste
          const detalleLimpio = item.detalle.replace(/[\r\n\t\u00A0\u200B]+/g, ' ').replace(/\s+/g, ' ').trim();

          tableBody.push([
            { 
              content: detalleLimpio, // AutoTable hará el salto de línea perfecto
              colSpan: 4,             // Que abarque toda la tabla
              styles: { 
                halign: 'left',       // Izquierda nativa. NADA de justificados extraños.
                valign: 'middle',
                fontSize: 7.5,
                textColor: [100, 100, 100],
                fontStyle: 'italic',
                fillColor: [255, 255, 255],
                cellPadding: { top: 3, bottom: 5, left: 18, right: 12 } 
              } 
            }
          ]);
        }
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 5,
        margin: { left: 12, right: 12, bottom: 55 },
        head: [['CANT', 'DESCRIPCIÓN DEL EQUIPO', 'P. UNIT', 'TOTAL']],
        body: tableBody,
        headStyles: { fillColor: [150, 0, 0], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 
          0: { halign: 'center', cellWidth: 15 }, 
          1: { halign: 'left' },
          2: { halign: 'right', cellWidth: 25 }, 
          3: { halign: 'right', cellWidth: 25 } 
        },
        theme: 'grid',
        didDrawPage: function () {
          agregarFooter(doc);
        },
        // --- SOLO interceptamos la fila de Marca/Modelo. Dejamos el Detalle en paz. ---
        didParseCell: function (data) {
          if (data.section === 'body' && data.cell.raw && data.cell.raw._customMarca) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            const mLines = doc.splitTextToSize(data.cell.raw._customMarca.toUpperCase(), 110);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            const modLines = doc.splitTextToSize(data.cell.raw._customModelo.toUpperCase(), 110);
            data.cell.text = [...mLines, ...modLines]; 
          }
        },
        willDrawCell: function (data) {
          if (data.section === 'body' && data.cell.raw && data.cell.raw._customMarca) {
            data.cell.text = ''; 
          }
        },
        didDrawCell: function (data) {
          if (data.section === 'body' && data.cell.raw && data.cell.raw._customMarca) {
            const textX = data.cell.x + 3;
            const maxWidth = 110;
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            const marcaLines = doc.splitTextToSize(data.cell.raw._customMarca.toUpperCase(), maxWidth);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            const modeloLines = doc.splitTextToSize(data.cell.raw._customModelo.toUpperCase(), maxWidth);
            
            const textHeight = (marcaLines.length * 3.5) + (modeloLines.length * 3);
            let textY = data.cell.y + ((data.cell.height - textHeight) / 2) + 3; 
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            doc.text(marcaLines, textX, textY);
            
            textY += (marcaLines.length * 3.5); 
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text(modeloLines, textX, textY);
          }
        }
      });

      let totalY = doc.lastAutoTable.finalY + 12;
      
      if (totalY > 235) {
        doc.addPage();
        agregarFooter(doc); 
        totalY = 25; 
      }

      const textoSuma = formatearMoneda(total);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      const anchoNumero = doc.getTextWidth(textoSuma);
      
      doc.setTextColor(150, 0, 0); 
      doc.setFontSize(14); 
      doc.text("TOTAL A PAGAR S/", 198 - anchoNumero - 3, totalY, { align: 'right' });
      
      doc.setFontSize(24); 
      doc.text(textoSuma, 198, totalY, { align: 'right' });
      doc.setTextColor(0, 0, 0); 

      doc.save(`Proforma_GrupoCastro_${cliente.nombre}.pdf`);
      onDescargar(); 
    } catch (error) { 
      console.error(error); 
      alert("Error al generar el PDF: " + error.message); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center p-4 overflow-y-auto backdrop-blur-sm">
      <div className="flex gap-4 mb-6 sticky top-0 z-[60]">
        <button onClick={onVolver} className="px-6 py-2 bg-white text-slate-700 font-bold rounded-full shadow-lg">VOLVER</button>
        <button onClick={descargarPDF} className="px-8 py-2 bg-[#d90000] text-white font-bold rounded-full shadow-lg hover:bg-red-700 uppercase transition-all">
          {editId ? "Confirmar Cambios y Descargar" : "Descargar PDF"}
        </button>
      </div>

      <div className="bg-white shadow-2xl flex-shrink-0 flex flex-col" style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}>
         <header className="flex justify-between items-center mb-6 border-b-4 border-red-600 pb-4">
            <img src={logoPrincipal} className="h-[20mm] w-auto object-contain" />
            <div className="grid grid-cols-2 gap-x-12 gap-y-2">
               <img src={marcasLogos.hikvision} className="h-[6mm] w-auto object-contain grayscale" />
               <img src={marcasLogos.dahua} className="h-[6mm] w-auto object-contain grayscale" />
               <img src={marcasLogos.starlink} className="h-[10mm] w-auto object-contain grayscale" />
               <img src={marcasLogos.ezviz} className="h-[6mm] w-auto object-contain grayscale" />
            </div>
            <div className="text-right text-[11px] text-slate-500 font-bold">
              <p>RUC: 10446038643</p>
              <p className="text-red-600 uppercase">Huancayo - Perú</p>
            </div>
         </header>

         <div className="mb-6">
            <h3 className="text-[10px] font-bold text-red-600 mb-1 uppercase text-left">Datos del cliente</h3>
            <div className="border border-slate-200 rounded-sm">
              <table className="w-full text-[12px] border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100 text-left">
                    <td className="font-bold py-2 px-3 w-[25mm] bg-slate-50 text-slate-900">CLIENTE:</td>
                    <td className="py-2 px-3 uppercase text-slate-700">{cliente.nombre}</td>
                    <td className="font-bold py-2 px-3 w-[25mm] text-right bg-slate-50 text-slate-900">FECHA:</td>
                    <td className="py-2 px-3 text-right text-slate-700 font-medium">{fechaMostrar}</td>
                  </tr>
                  <tr className="text-left">
                    <td className="font-bold py-2 px-3 w-[25mm] bg-slate-50 text-slate-900">DIRECCIÓN:</td>
                    <td className="py-2 px-3 uppercase text-slate-700">{cliente.direccion}</td>
                    <td className="font-bold py-2 px-3 w-[25mm] text-right bg-slate-50 text-slate-900">TELÉFONO:</td>
                    <td className="py-2 px-3 text-right text-slate-700">{cliente.telefono}</td>
                  </tr>
                </tbody>
              </table>
            </div>
         </div>

         <div className="border border-[#960000] rounded-sm overflow-hidden mb-6">
           <table className="w-full text-left">
             <thead className="bg-[#960000] text-white text-[11px] font-bold uppercase">
               <tr>
                 <th className="py-3 px-3 w-[15mm] text-center">CANT</th>
                 <th className="py-3 px-3 border-x border-white/20 text-left">DESCRIPCIÓN</th>
                 <th className="py-3 px-3 text-right w-[25mm]">P. UNIT</th>
                 <th className="py-3 px-3 text-right w-[25mm]">TOTAL</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 text-slate-800">
               {items.map((item, index) => [
                 <tr key={`main-${index}`} className="text-[11px] italic border-b border-slate-50">
                   <td className="py-4 px-3 text-center font-bold text-slate-400 align-middle">{item.cantidad}</td>
                   <td className="py-4 px-4 border-x border-slate-100 font-bold uppercase align-middle">
                     {item.marca} 
                     <span className="block text-[9px] font-normal text-slate-500 mt-0.5 whitespace-normal break-words">{item.modelo}</span>
                   </td>
                   <td className="py-4 px-3 text-right font-mono text-slate-500 whitespace-nowrap align-middle">S/ {formatearMoneda(item.precioUnitario)}</td>
                   <td className="py-4 px-3 text-right font-black text-red-600 whitespace-nowrap align-middle">S/ {formatearMoneda(item.precioTotalFila)}</td>
                 </tr>,
                 item.detalle && (
                   <tr key={`det-${index}`} className="border-b border-slate-100 bg-white">
                     <td colSpan="4" className="py-3 pl-[18mm] pr-4 text-[9.5px] font-normal text-slate-500 text-left leading-relaxed normal-case italic">
                       {item.detalle}
                     </td>
                   </tr>
                 )
               ])}
             </tbody>
           </table>
         </div>

         <div className="flex justify-end mb-8">
            <div className="flex items-center gap-6 border-b-2 border-red-600 pb-1 px-2">
              <span className="text-red-600 font-bold italic text-[12px] uppercase">Total a Pagar S/</span>
              <span className="text-[28px] font-black text-red-700 whitespace-nowrap">{formatearMoneda(total)}</span>
            </div>
         </div>

         <div className="flex-grow"></div>

         <footer className="mt-auto pt-4 border-t border-slate-100 text-left w-full">
            <div className="flex items-start gap-8 px-2 mb-4">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://www.hikvisionhuancayo.com/" className="w-[22mm] border border-slate-100 p-1" />
              <div className="pt-1">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Técnico Instalador</p>
                 <p className="text-[14px] font-black uppercase text-slate-800 leading-none">NILTON H. CASTRO M.</p>
                 <p className="text-[11px] font-bold text-red-600 mt-1">Cel. 993996443</p>
              </div>
            </div>
            
            <div className="text-[10px] space-y-1 text-slate-400 border-t border-slate-100 pt-4 px-2">
              <p>1.- Duración de la Oferta: 5 días calendarios.</p>
              <p>2.- Pago del 100% al momento de iniciar la instalación de equipos.</p>
              <p>3.- Soporte ilimitado vía WhatsApp y Telefónico 993996443.</p>
              <div className="pt-4 text-center">
                <p className="text-red-600 font-black text-[14px] uppercase italic leading-none">4 AÑOS GARANTÍA EN EQUIPOS HIKVISION</p>
                <p className="text-slate-300 font-bold text-[10px] uppercase mt-1 italic">www.hikvisionhuancayo.com</p>
              </div>
            </div>
         </footer>
      </div>
    </div>
  );
}