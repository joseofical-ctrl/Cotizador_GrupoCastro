import { useState, useEffect } from 'preact/hooks';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { guardarPDFEnCarpeta } from '../utils/fileSystem.js';
import { guardarCotizacion } from '../utils/apiService.js';

export default function PDFPreview({
  items,
  cliente,
  subtotal,
  descuento,
  total,
  editId,
  dirHandle,
  soloExportar = false,
  onCambiarCarpeta,
  onVolver,
  onDescargar
}) {
  const [qrBase64, setQrBase64] = useState('');
  const [guardando, setGuardando] = useState(false);

  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  const logoPrincipal = `${baseUrl}logo-grupocastro.jpg`;
  const marcasLogos = {
    hikvision: `${baseUrl}Logo-hikvision.webp`,
    dahua: `${baseUrl}Logo-dahua.webp`,
    starlink: `${baseUrl}Logo-starlink.webp`,
    ezviz: `${baseUrl}Logo-ezviz.webp`
  };

  useEffect(() => {
    QRCode.toDataURL('https://www.hikvisionhuancayo.com/', { width: 150, margin: 1 })
      .then(url => setQrBase64(url))
      .catch(err => console.error("Error generando QR local:", err));
  }, []);

  const formatearMoneda = (cantidad) => {
    return Number(cantidad || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const limpiarTextoPDF = (texto) => {
    if (!texto) return '';
    return String(texto)
      .replace(/×/g, 'x')
      .replace(/÷/g, '/')
      .replace(/[‘’‚‛]/g, "'")
      .replace(/[“”„‟]/g, '"')
      .replace(/[–—―]/g, '-')
      .replace(/[•·▪▫]/g, '-')
      .replace(/≥/g, '>=')
      .replace(/≤/g, '<=')
      .replace(/±/g, '+/-')
      .replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ')
      .replace(/:([a-zA-Z0-9])/g, ': $1');
  };

  const leerHistorialSeguro = () => {
    try {
      return JSON.parse(localStorage.getItem('historialCotizaciones') || '[]');
    } catch {
      return [];
    }
  };

  const historialPrevio = leerHistorialSeguro();
  const proformaOriginal = editId ? historialPrevio.find(cot => cot.id === editId) : null;
  const fechaMostrar = proformaOriginal?.fecha
    ? proformaOriginal.fecha.split(',')[0]
    : new Date().toLocaleDateString('es-PE');

  const descargarPDF = async () => {
    if (guardando) return;
    setGuardando(true);

    try {
      const doc = new jsPDF();
      const nombreClienteSeguro = limpiarTextoPDF(cliente?.nombre || 'CLIENTE').trim();
      const direccionSegura = limpiarTextoPDF(cliente?.direccion || '').trim();
      const telefonoSeguro = limpiarTextoPDF(cliente?.telefono || '').trim();

      if (!soloExportar) {
        const cotizacionActual = {
          id: editId || Date.now(),
          cliente: { nombre: nombreClienteSeguro, direccion: direccionSegura, telefono: telefonoSeguro },
          items: [...items],
          subtotal: formatearMoneda(subtotal),
          descuento: Number(descuento || 0),
          total: formatearMoneda(total),
          fecha: proformaOriginal?.fecha || new Date().toLocaleString('es-PE'),
        };

        // Guardar tanto en la Base de Datos de Hetzner como en localStorage
        await guardarCotizacion(cotizacionActual, Boolean(editId));
      }

      const agregarFooter = (documento) => {
        const footerLineY = 282;
        documento.setDrawColor(200, 0, 0);
        documento.setLineWidth(0.5);
        documento.line(12, footerLineY, 198, footerLineY);

        documento.setFontSize(11);
        documento.setTextColor(150, 0, 0);
        documento.setFont("helvetica", "bold");
        documento.text("4 AÑOS GARANTÍA EN EQUIPOS HIKVISION", 105, footerLineY + 6, { align: 'center' });
      };

      doc.setFillColor(150, 0, 0);
      doc.rect(0, 0, 210, 8, 'F');

      doc.addImage(logoPrincipal, 'JPEG', 12, 12, 55, 16, 'logo', 'FAST');

      const marcasStart = 90;
      const separacionHorizontal = 32;
      doc.addImage(marcasLogos.hikvision, 'WEBP', marcasStart, 14, 25, 5, 'hik', 'FAST');
      doc.addImage(marcasLogos.dahua, 'WEBP', marcasStart + separacionHorizontal, 14, 18, 5, 'dah', 'FAST');
      doc.addImage(marcasLogos.starlink, 'WEBP', marcasStart, 23, 20, 5, 'sta', 'FAST');
      doc.addImage(marcasLogos.ezviz, 'WEBP', marcasStart + separacionHorizontal, 23, 18, 5, 'ezv', 'FAST');

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
          { lbl1: 'CLIENTE:', val1: nombreClienteSeguro.toUpperCase(), lbl2: 'FECHA:', val2: fechaMostrar },
          { lbl1: 'DIRECCIÓN:', val1: direccionSegura.toUpperCase(), lbl2: 'TELÉFONO:', val2: telefonoSeguro }
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
        tableBody.push([
          { content: item.cantidad, styles: { halign: 'center', valign: 'middle' } },
          {
            content: '',
            _customMarca: limpiarTextoPDF(item.marca || ''),
            _customModelo: limpiarTextoPDF(item.modelo || '')
          },
          { content: `S/ ${formatearMoneda(item.precioUnitario)}`, styles: { halign: 'right', valign: 'middle' } },
          { content: `S/ ${formatearMoneda(item.precioTotalFila)}`, styles: { halign: 'right', valign: 'middle' } }
        ]);

        if (item.detalle) {
          const parrafos = limpiarTextoPDF(item.detalle)
            .split(/\r?\n/)
            .map(linea => linea.replace(/[ \t]+/g, ' ').trim())
            .filter(linea => linea.length > 0);

          tableBody.push([
            {
              content: '',
              colSpan: 4,
              _customDetalleParrafos: parrafos,
              styles: {
                halign: 'left',
                valign: 'top',
                fontSize: 7.5,
                textColor: [90, 90, 90],
                fontStyle: 'italic',
                fillColor: [255, 255, 255],
                cellPadding: { top: 3, bottom: 5, left: 18, right: 8 }
              }
            }
          ]);
        }
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 5,
        margin: { left: 12, right: 12, bottom: 25 },
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
        didParseCell: function (data) {
          if (data.section === 'body' && data.cell.raw) {
            if (data.cell.raw._customMarca !== undefined) {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(9);
              const mLines = doc.splitTextToSize(data.cell.raw._customMarca.toUpperCase(), 110);
              doc.setFont("helvetica", "normal");
              doc.setFontSize(7);
              const modLines = doc.splitTextToSize(data.cell.raw._customModelo.toUpperCase(), 110);
              data.cell.text = [...mLines, ...modLines];
            }
            else if (data.cell.raw._customDetalleParrafos) {
              doc.setFont("helvetica", "italic");
              doc.setFontSize(7.5);
              const lineasFinales = [];
              data.cell.raw._customDetalleParrafos.forEach(p => {
                const envueltas = doc.splitTextToSize(p, 158);
                lineasFinales.push(...envueltas);
              });
              data.cell.text = lineasFinales;
            }
          }
        },
        willDrawCell: function (data) {
          if (data.section === 'body' && data.cell.raw && data.cell.raw._customMarca !== undefined) {
            data.cell.text = '';
          }
        },
        didDrawCell: function (data) {
          if (data.section === 'body' && data.cell.raw && data.cell.raw._customMarca !== undefined) {
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

      const montoDesc = Number(descuento || 0);
      const alturaBloqueTotales = montoDesc > 0 ? 28 : 14;
      let cursorY = doc.lastAutoTable.finalY + 10;

      // Verificar que el bloque de totales no choque con el footer (Y=282)
      if (cursorY + alturaBloqueTotales > 272) {
        doc.addPage();
        agregarFooter(doc);
        cursorY = 25;
      }

      if (montoDesc > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(110, 110, 110);
        doc.text(`SUBTOTAL: S/ ${formatearMoneda(subtotal)}`, 198, cursorY, { align: 'right' });

        cursorY += 6; // Baja 6mm para el descuento
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(180, 0, 0);
        doc.text(`DESCUENTO: - S/ ${formatearMoneda(montoDesc)}`, 198, cursorY, { align: 'right' });

        cursorY += 12; // Baja 12mm completos para que la fuente de 24pt jamás pise al descuento
      } else {
        cursorY += 4;
      }

      const totalY = cursorY;
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

      let bloqueY = totalY + 15;

      if (bloqueY + 40 > 275) {
        doc.addPage();
        agregarFooter(doc);
        bloqueY = 25;
      }

      const qrData = qrBase64 || await QRCode.toDataURL('https://www.hikvisionhuancayo.com/', { width: 150, margin: 1 });
      doc.addImage(qrData, 'PNG', 12, bloqueY, 22, 22, 'qr', 'FAST');

      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Técnico Instalador:", 38, bloqueY + 6);
      doc.setFontSize(11);
      doc.text("NILTON H. CASTRO M.", 38, bloqueY + 12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(200, 0, 0);
      doc.setFontSize(9);
      doc.text("Cel. 993996443", 38, bloqueY + 18);

      const terminosY = bloqueY + 30;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.setFont("helvetica", "normal");
      doc.text("1.- Duración de la Oferta: 5 días calendarios.", 12, terminosY);
      doc.text("2.- Pago del 100% al momento de iniciar la instalación de equipos.", 12, terminosY + 4);
      doc.text("3.- Soporte ilimitado vía WhatsApp y Telefónico 993996443 o (064) 600070.", 12, terminosY + 8);

      const nombreArchivoLimpio = nombreClienteSeguro.replace(/[\\/:*?"<>|]/g, '_');
      const nombreFinal = `Proforma_GrupoCastro_${nombreArchivoLimpio}.pdf`;

      // Si es solo exportación (sin guardar en BD ni sobrescribir/eliminar el original en PC)
      if (soloExportar) {
        const nombreExportacion = `Proforma_GrupoCastro_${nombreArchivoLimpio}_Editado.pdf`;
        if (dirHandle) {
          try {
            const pdfBlob = doc.output('blob');
            // Pasar nombreArchivoAnterior = null para jamás tocar ni borrar el PDF original
            const resultado = await guardarPDFEnCarpeta(dirHandle, nombreExportacion, pdfBlob, null);
            if (resultado.exito) {
              onDescargar("PDF exportado sin alterar el registro original");
              return;
            }
          } catch (errCarpeta) {
            console.warn("No se pudo escribir en la carpeta vinculada, usando descarga normal:", errCarpeta);
          }
        }
        doc.save(nombreFinal);
        onDescargar("PDF exportado sin alterar el registro original");
        return;
      }

      let nombreArchivoAnterior = null;
      if (editId && proformaOriginal?.cliente?.nombre) {
        const nombreAntiguoSeguro = limpiarTextoPDF(proformaOriginal.cliente.nombre).trim().replace(/[\\/:*?"<>|]/g, '_');
        nombreArchivoAnterior = `Proforma_GrupoCastro_${nombreAntiguoSeguro}.pdf`;
      }

      // --- LÓGICA DE GUARDADO DIRECTO EN CARPETA ---
      if (dirHandle) {
        try {
          const pdfBlob = doc.output('blob');
          const resultado = await guardarPDFEnCarpeta(dirHandle, nombreFinal, pdfBlob, nombreArchivoAnterior);
          if (resultado.exito) {
            onDescargar('Guardado directo en carpeta ' + dirHandle.name);
            return;
          }
        } catch (errCarpeta) {
          console.warn("No se pudo escribir en la carpeta vinculada, usando descarga normal:", errCarpeta);
        }
      }

      // Respaldo (Fallback) si no hay carpeta configurada o falla el permiso
      doc.save(nombreFinal);
      onDescargar();
    } catch (error) {
      console.error(error);
      alert("Error al generar el PDF: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center p-2 sm:p-4 overflow-y-auto backdrop-blur-sm">
      <div className="w-full max-w-xl flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 sticky top-0 z-[60] px-2">
        {soloExportar && (
          <div className="w-full text-center mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 bg-amber-500/20 border border-amber-400 text-amber-300 font-black text-[11px] sm:text-xs rounded-full uppercase tracking-wider backdrop-blur-md shadow-lg text-center">
              ⚡ MODO SOLO EXPORTACIÓN (NO MODIFICA EL ORIGINAL)
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onVolver}
          className="px-5 sm:px-6 py-2 bg-white text-slate-700 font-bold text-xs sm:text-sm rounded-full shadow-lg hover:bg-slate-100 cursor-pointer transition-all active:scale-95"
        >
          VOLVER
        </button>

        <button
          type="button"
          onClick={onCambiarCarpeta}
          className="hidden md:flex px-5 py-2 bg-slate-800 text-amber-300 border border-slate-600 font-bold rounded-full shadow-lg hover:bg-slate-700 text-xs uppercase transition-all cursor-pointer items-center gap-1.5"
        >
          📁 {dirHandle ? 'Carpeta: ' + dirHandle.name : 'Vincular Carpeta PC'}
        </button>

        <button
          type="button"
          onClick={descargarPDF}
          disabled={guardando}
          className={`px-5 sm:px-8 py-2 font-bold text-xs sm:text-sm rounded-full shadow-lg uppercase transition-all disabled:opacity-50 cursor-pointer active:scale-95 ${soloExportar
            ? 'bg-slate-800 hover:bg-slate-900 border-2 border-slate-600 text-white'
            : 'bg-[#d90000] text-white hover:bg-red-700'
            }`}
        >
          {guardando
            ? (soloExportar ? "Exportando..." : "Guardando...")
            : soloExportar
              ? "Descargar PDF (Sin Guardar Cambios)"
              : dirHandle
                ? `Guardar directo en "${dirHandle.name}"`
                : (editId ? "Confirmar Cambios y Descargar" : "Descargar PDF")}
        </button>
      </div>

      {/* Contenedor adaptativo de la hoja A4 */}
      <div className="w-full flex justify-center overflow-x-auto pb-10 px-0 sm:px-4">
        <div className="bg-white text-slate-900 shadow-2xl flex-shrink-0 flex flex-col w-full max-w-[210mm] min-h-[auto] md:min-h-[297mm] p-4 sm:p-6 md:p-[15mm] rounded-sm transition-all">
          <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b-4 border-red-600 pb-4 text-center sm:text-left">
            <img src={logoPrincipal} className="h-14 sm:h-[18mm] md:h-[20mm] w-auto object-contain" alt="Grupo Castro" />
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-2 items-center">
              <img src={marcasLogos.hikvision} className="h-4 sm:h-[6mm] w-auto object-contain grayscale" alt="Hikvision" />
              <img src={marcasLogos.dahua} className="h-4 sm:h-[6mm] w-auto object-contain grayscale" alt="Dahua" />
              <img src={marcasLogos.starlink} className="h-6 sm:h-[10mm] w-auto object-contain grayscale" alt="Starlink" />
              <img src={marcasLogos.ezviz} className="h-4 sm:h-[6mm] w-auto object-contain grayscale" alt="Ezviz" />
            </div>
            <div className="text-center sm:text-right text-[10px] sm:text-[11px] text-slate-500 font-bold">
              <p>RUC: 10446038643</p>
              <p className="text-red-600 uppercase">Huancayo - Perú</p>
            </div>
          </header>

          <div className="mb-6 text-left">
            <h3 className="text-[10px] font-bold text-red-600 mb-1 uppercase text-left">Datos del cliente</h3>
            <div className="border border-slate-200 rounded-sm overflow-x-auto">
              <table className="w-full text-[11px] sm:text-[12px] border-collapse min-w-[280px]">
                <tbody>
                  <tr className="border-b border-slate-100 text-left">
                    <td className="font-bold py-2 px-2.5 sm:px-3 w-[20mm] sm:w-[25mm] bg-slate-50 text-slate-900 whitespace-nowrap">CLIENTE:</td>
                    <td className="py-2 px-2.5 sm:px-3 uppercase text-slate-700">{cliente.nombre}</td>
                    <td className="font-bold py-2 px-2.5 sm:px-3 w-[20mm] sm:w-[25mm] text-right bg-slate-50 text-slate-900 whitespace-nowrap">FECHA:</td>
                    <td className="py-2 px-2.5 sm:px-3 text-right text-slate-700 font-medium whitespace-nowrap">{fechaMostrar}</td>
                  </tr>
                  <tr className="text-left">
                    <td className="font-bold py-2 px-2.5 sm:px-3 w-[20mm] sm:w-[25mm] bg-slate-50 text-slate-900 whitespace-nowrap">DIRECCIÓN:</td>
                    <td className="py-2 px-2.5 sm:px-3 uppercase text-slate-700">{cliente.direccion}</td>
                    <td className="font-bold py-2 px-2.5 sm:px-3 w-[20mm] sm:w-[25mm] text-right bg-slate-50 text-slate-900 whitespace-nowrap">TELÉFONO:</td>
                    <td className="py-2 px-2.5 sm:px-3 text-right text-slate-700 whitespace-nowrap">{cliente.telefono}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-[#960000] rounded-sm overflow-x-auto mb-6">
            <table className="w-full text-left min-w-[320px] sm:min-w-full">
              <thead className="bg-[#960000] text-white text-[10px] sm:text-[11px] font-bold uppercase">
                <tr>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 w-[12mm] sm:w-[15mm] text-center">CANT</th>
                  <th className="py-2.5 sm:py-3 px-2.5 sm:px-3 border-x border-white/20 text-left">DESCRIPCIÓN</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-right w-[20mm] sm:w-[25mm]">P. UNIT</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-right w-[20mm] sm:w-[25mm]">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {items.map((item, index) => [
                  <tr key={`main-${index}`} className="text-[10px] sm:text-[11px] italic border-b border-slate-50">
                    <td className="py-3 sm:py-4 px-2 sm:px-3 text-center font-bold text-slate-400 align-middle">{item.cantidad}</td>
                    <td className="py-3 sm:py-4 px-2.5 sm:px-4 border-x border-slate-100 font-bold uppercase align-middle">
                      {item.marca}
                      <span className="block text-[9px] font-normal text-slate-500 mt-0.5 whitespace-normal break-words">{item.modelo}</span>
                    </td>
                    <td className="py-3 sm:py-4 px-2 sm:px-3 text-right font-mono text-slate-500 whitespace-nowrap align-middle">S/ {formatearMoneda(item.precioUnitario)}</td>
                    <td className="py-3 sm:py-4 px-2 sm:px-3 text-right font-black text-red-600 whitespace-nowrap align-middle">S/ {formatearMoneda(item.precioTotalFila)}</td>
                  </tr>,
                  item.detalle && (
                    <tr key={`det-${index}`} className="border-b border-slate-100 bg-white">
                      <td colSpan="4" className="py-2 sm:py-3 pl-4 sm:pl-[18mm] pr-3 sm:pr-4 text-[9px] sm:text-[9.5px] font-normal text-slate-500 text-left leading-relaxed normal-case italic whitespace-pre-line">
                        {limpiarTextoPDF(item.detalle)}
                      </td>
                    </tr>
                  )
                ])}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-6 sm:mb-8">
            <div className="flex flex-col items-end">
              {Number(descuento || 0) > 0 && (
                <div className="space-y-0.5 mb-2 text-right pr-2">
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Subtotal: S/ {formatearMoneda(subtotal)}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-red-600 uppercase tracking-wider font-mono">
                    Descuento: - S/ {formatearMoneda(descuento)}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 sm:gap-6 border-b-2 border-red-600 pb-1 px-2">
                <span className="text-red-600 font-bold italic text-[11px] sm:text-[12px] uppercase whitespace-nowrap">Total a Pagar S/</span>
                <span className="text-2xl sm:text-[28px] font-black text-red-700 whitespace-nowrap">{formatearMoneda(total)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-8 px-2 mb-6">
            {qrBase64 && <img src={qrBase64} className="w-16 h-16 sm:w-[22mm] sm:h-[22mm] border border-slate-100 p-1 flex-shrink-0" alt="QR Web" />}
            <div className="pt-1 text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Técnico Instalador</p>
              <p className="text-xs sm:text-[14px] font-black uppercase text-slate-800 leading-none">NILTON H. CASTRO M.</p>
              <p className="text-[11px] font-bold text-red-600 mt-1">Cel. 993996443</p>
            </div>
          </div>

          <div className="text-[9.5px] sm:text-[10px] space-y-1 text-slate-400 px-2 mb-6 text-left">
            <p>1.- Duración de la Oferta: 5 días calendarios.</p>
            <p>2.- Pago del 100% al momento de iniciar la instalación de equipos.</p>
            <p>3.- Soporte ilimitado vía WhatsApp y Telefónico 993996443 o (064) 600070.</p>
          </div>

          <div className="flex-grow"></div>

          <footer className="mt-auto pt-3 border-t-[1.5px] border-red-600 text-center w-full">
            <p className="text-red-600 font-black text-xs sm:text-[14px] uppercase italic leading-none">4 AÑOS GARANTÍA EN EQUIPOS HIKVISION</p>
            <p className="text-slate-300 font-bold text-[9px] sm:text-[10px] uppercase mt-1 italic">www.hikvisionhuancayo.com</p>
          </footer>
        </div>
      </div>
    </div>
  );
}