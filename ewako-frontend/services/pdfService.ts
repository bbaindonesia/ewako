
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, OrderStatus, ServiceType, HotelBookingData, VisaBookingData, HandlingBookingData, JastipBookingData, PackageInfoData, HotelInfo, RoomBooking } from '../types';
import { APP_NAME } from '../constants';
import { MOCK_EXCHANGE_RATES, convertToIDR, formatCurrency } from './currencyService';


const addHeaderFooter = (doc: jsPDF, title: string) => {
  const pageCount = doc.getNumberOfPages(); 

  doc.setFontSize(18);
  doc.setTextColor(40); // Dark gray
  doc.text(APP_NAME, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text(title, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const datePart = dateString.split('T')[0];
    const date = new Date(datePart);
    if (isNaN(date.getTime())) return '-'; 
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};


const generateHotelDetailsBody = (data: HotelBookingData): any[] => {
    const body: any[] = [
        [{ content: 'Detail Pemesan', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [211, 211, 211], textColor: [0,0,0] } }],
        ['Nama Pemesan', data.customerName],
        ['PPIU/PIHK', data.ppiuName || '-'],
        ['No. Handphone', data.phone],
        ['Alamat', data.address || '-'],
    ];

    const addHotelSection = (hotelInfo: HotelInfo | undefined, title: string) => {
        if (hotelInfo && hotelInfo.name) {
            body.push([{ content: title, colSpan: 2, styles: { fontStyle: 'bold',fillColor: [220, 220, 220], textColor: [0,0,0] } }]);
            body.push(['Nama Hotel', hotelInfo.name]);
            body.push(['Check In', formatDate(hotelInfo.checkIn)]);
            body.push(['Check Out', formatDate(hotelInfo.checkOut)]);
            body.push(['Durasi', `${hotelInfo.nights} malam`]);
            body.push(['Kamar Quad', hotelInfo.rooms.quad]);
            body.push(['Kamar Triple', hotelInfo.rooms.triple]);
            body.push(['Kamar Double', hotelInfo.rooms.double]);
        }
    };
    
    addHotelSection(data.madinahHotel, 'Hotel Madinah');
    addHotelSection(data.makkahHotel, 'Hotel Mekah');

    body.push([{ content: 'Layanan Tambahan', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0,0,0] } }]);
    body.push(['Handling Bandara', data.includeHandling ? `Ya (${data.handlingPax || 'N/A'} pax)` : 'Tidak']);
    body.push(['Visa', data.includeVisa ? `Ya (${data.visaPax || 'N/A'} pax)` : 'Tidak']);
    if (data.includeVisa) {
        body.push(['  Jenis Kendaraan (Visa)', data.visaVehicleType || '-']);
        body.push(['  Nama Maskapai (Visa)', data.visaAirlineName || '-']);
        body.push(['  Tgl. Kedatangan (Visa)', formatDateTime(data.visaArrivalDate)]);
        body.push(['  Tgl. Kepulangan (Visa)', formatDateTime(data.visaDepartureDate)]);
    }
    return body;
};

export const generateOrderRequestPdf = (order: Order) => {
  const doc = new jsPDF();
  const title = `Permintaan Pesanan - ${order.serviceType}`;
  
  const generalInfoBody = [
    ['Order ID', order.id],
    ['Jenis Layanan', order.serviceType],
    ['Status Pesanan', order.status],
    ['Tanggal Pesan', formatDateTime(order.createdAt)],
  ];

  autoTable(doc, {
    startY: 40,
    head: [['Informasi Umum', '']],
    body: generalInfoBody,
    theme: 'grid',
    headStyles: { fillColor: [183, 28, 28], textColor: [255,255,255] }, 
    didDrawPage: (data) => {
        addHeaderFooter(doc, title); 
        doc.setFontSize(10);
        doc.text(`Page ${data.pageNumber} of {totalPages}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
    }
  });

  let specificDataBody: any[] = [];
  switch (order.serviceType) {
    case ServiceType.HOTEL:
      specificDataBody = generateHotelDetailsBody(order.data as HotelBookingData);
      break;
    case ServiceType.VISA:
      const visaData = order.data as VisaBookingData;
      specificDataBody = [
          [{ content: 'Detail Pesanan Visa', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [211, 211, 211], textColor: [0,0,0] } }],
          ['Nama Pemesan', visaData.customerName],
          ['PPIU/PIHK', visaData.ppiuName || '-'],
          ['No. Handphone', visaData.phone],
          ['Alamat', visaData.address || '-'],
          ['Jumlah Jemaah', visaData.pax],
          ['Jenis Kendaraan', visaData.vehicleType || '-'],
      ];
      break;
    case ServiceType.HANDLING:
      const handlingData = order.data as HandlingBookingData;
      specificDataBody = [
          [{ content: 'Detail Pesanan Handling', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [211, 211, 211], textColor: [0,0,0] } }],
          ['Nama Pemesan', handlingData.customerName],
          ['PPIU/PIHK', handlingData.ppiuName || '-'],
          ['No. Handphone', handlingData.phone],
          ['Alamat', handlingData.address || '-'],
          ['Jumlah Jemaah', handlingData.pax],
          ['Include Mutowif', handlingData.includeMutowif ? `Ya (${handlingData.mutowifName || 'Belum Dipilih'})` : 'Tidak'],
      ];
      break;
    case ServiceType.JASTIP:
      const jastipData = order.data as JastipBookingData;
      specificDataBody = [
          [{ content: 'Detail Pesanan Jastip', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [211, 211, 211], textColor: [0,0,0] } }],
          ['Nama Pemesan', jastipData.customerName],
          ['No. Handphone', jastipData.phone],
          ['Jenis Titipan', jastipData.itemType],
          ['Jumlah', `${jastipData.quantity} ${jastipData.unit}`],
          ['Alamat Tujuan', jastipData.deliveryAddress],
          ['Pesan Untuk Pengantar', jastipData.notes || '-'],
      ];
      break;
    default:
      specificDataBody = [['Detail', 'Data tidak tersedia untuk tipe layanan ini']];
  }

   autoTable(doc, {
    head: [['Deskripsi Detail', 'Informasi']],
    body: specificDataBody,
    theme: 'grid',
    headStyles: {fillColor: [60,60,60], textColor: [255,255,255]},
    columnStyles: { 0: { fontStyle: 'bold' } },
     didDrawPage: (data) => {
        addHeaderFooter(doc, title);
        doc.setFontSize(10);
        doc.text(`Page ${data.pageNumber} of {totalPages}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
    }
   });
   doc.output('dataurlnewwindow');
};

export const generateInvoicePdf = (order: Order) => {
  const doc = new jsPDF();
  const title = `Invoice - ${order.serviceType}`;
  
  const customerName = (order.data as any).customerName || 'N/A';
  const customerPhone = (order.data as any).phone || 'N/A';

  autoTable(doc, {
    startY: 40,
    head: [['Informasi Tagihan', '']],
    body: [
      ['Order ID', order.id],
      ['Tanggal Invoice', new Date().toLocaleDateString('id-ID')],
      ['Kepada Yth.', customerName],
      ['No. Telp', customerPhone],
      ['Jenis Layanan', order.serviceType],
      ['Status Pesanan', order.status],
    ],
    theme: 'striped',
    headStyles: { fillColor: [183, 28, 28], textColor: [255,255,255] },
    didDrawPage: (data) => {
        addHeaderFooter(doc, title);
        doc.setFontSize(10);
        doc.text(`Page ${data.pageNumber} of {totalPages}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
    }
  });

  const pricePending = order.status === OrderStatus.REQUEST_CONFIRMATION || typeof order.totalPrice !== 'number' || order.totalPrice === 0;
  const priceUnavailableText = "Menunggu Konfirmasi Admin";
  const items: any[] = [];
  const orderData = order.data as any;
  let totalSARAmt = 0;
  let totalUSDAmt = 0;

  if (!pricePending) {
    if (order.serviceType === ServiceType.HOTEL) {
        const hotelData = orderData as HotelBookingData;
        
        const addHotelItems = (hotelInfo: HotelInfo | undefined, hotelNamePrefix: string) => {
            if (hotelInfo && hotelInfo.name && hotelInfo.pricesSAR) {
                if (hotelInfo.rooms.quad > 0 && hotelInfo.pricesSAR.quad) {
                    const subtotalSAR = hotelInfo.pricesSAR.quad * hotelInfo.nights * hotelInfo.rooms.quad;
                    totalSARAmt += subtotalSAR;
                    items.push([
                        `${hotelNamePrefix}: ${hotelInfo.name} - Kamar Quad`, 
                        `${hotelInfo.rooms.quad}k x ${hotelInfo.nights}m`, 
                        formatCurrency(hotelInfo.pricesSAR.quad, 'SAR', true, 2), 
                        formatCurrency(subtotalSAR, 'SAR', true, 2), 
                        formatCurrency(convertToIDR(subtotalSAR, 'SAR'), 'IDR')
                    ]);
                }
                if (hotelInfo.rooms.triple > 0 && hotelInfo.pricesSAR.triple) {
                    const subtotalSAR = hotelInfo.pricesSAR.triple * hotelInfo.nights * hotelInfo.rooms.triple;
                    totalSARAmt += subtotalSAR;
                    items.push([
                        `${hotelNamePrefix}: ${hotelInfo.name} - Kamar Triple`, 
                        `${hotelInfo.rooms.triple}k x ${hotelInfo.nights}m`, 
                        formatCurrency(hotelInfo.pricesSAR.triple, 'SAR', true, 2), 
                        formatCurrency(subtotalSAR, 'SAR', true, 2), 
                        formatCurrency(convertToIDR(subtotalSAR, 'SAR'), 'IDR')
                    ]);
                }
                if (hotelInfo.rooms.double > 0 && hotelInfo.pricesSAR.double) {
                    const subtotalSAR = hotelInfo.pricesSAR.double * hotelInfo.nights * hotelInfo.rooms.double;
                    totalSARAmt += subtotalSAR;
                    items.push([
                        `${hotelNamePrefix}: ${hotelInfo.name} - Kamar Double`, 
                        `${hotelInfo.rooms.double}k x ${hotelInfo.nights}m`, 
                        formatCurrency(hotelInfo.pricesSAR.double, 'SAR', true, 2), 
                        formatCurrency(subtotalSAR, 'SAR', true, 2), 
                        formatCurrency(convertToIDR(subtotalSAR, 'SAR'), 'IDR')
                    ]);
                }
            }
        };
        addHotelItems(hotelData.madinahHotel, "Hotel Madinah");
        addHotelItems(hotelData.makkahHotel, "Hotel Mekah");

        if (hotelData.includeVisa && hotelData.visaPricePerPaxUSD && hotelData.visaPax) {
            const subtotalUSD = hotelData.visaPricePerPaxUSD * hotelData.visaPax;
            totalUSDAmt += subtotalUSD;
            items.push([
                `Layanan Visa`, 
                `${hotelData.visaPax} pax`, 
                formatCurrency(hotelData.visaPricePerPaxUSD, 'USD', true, 2), 
                formatCurrency(subtotalUSD, 'USD', true, 2), 
                formatCurrency(convertToIDR(subtotalUSD, 'USD'), 'IDR')
            ]);
        }
        if (hotelData.includeHandling && hotelData.handlingPricePerPaxSAR && hotelData.handlingPax) {
            const subtotalSAR = hotelData.handlingPricePerPaxSAR * hotelData.handlingPax;
            totalSARAmt += subtotalSAR;
            items.push([
                `Layanan Handling`, 
                `${hotelData.handlingPax} pax`, 
                formatCurrency(hotelData.handlingPricePerPaxSAR, 'SAR', true, 2), 
                formatCurrency(subtotalSAR, 'SAR', true, 2), 
                formatCurrency(convertToIDR(subtotalSAR, 'SAR'), 'IDR')
            ]);
        }
        if (hotelData.busPriceTotalSAR && hotelData.busPriceTotalSAR > 0) {
            totalSARAmt += hotelData.busPriceTotalSAR;
            items.push([
                `Transportasi Bus (Paket)`, 
                `1 paket`, 
                formatCurrency(hotelData.busPriceTotalSAR, 'SAR', true, 2), 
                formatCurrency(hotelData.busPriceTotalSAR, 'SAR', true, 2), 
                formatCurrency(convertToIDR(hotelData.busPriceTotalSAR, 'SAR'), 'IDR')
            ]);
        }
    } else if (order.serviceType === ServiceType.VISA) {
        const visaData = orderData as VisaBookingData;
        if (visaData.visaPricePerPaxUSD && visaData.pax) {
            const subtotalUSD = visaData.visaPricePerPaxUSD * visaData.pax;
            totalUSDAmt += subtotalUSD;
            items.push([
                `Layanan Visa`, 
                `${visaData.pax} pax`, 
                formatCurrency(visaData.visaPricePerPaxUSD, 'USD', true, 2), 
                formatCurrency(subtotalUSD, 'USD', true, 2), 
                formatCurrency(convertToIDR(subtotalUSD, 'USD'), 'IDR')
            ]);
        }
        if (visaData.busPriceTotalSAR && visaData.busPriceTotalSAR > 0) {
            totalSARAmt += visaData.busPriceTotalSAR;
            items.push([
                `Transportasi Bus (Paket)`, 
                `1 paket`, 
                formatCurrency(visaData.busPriceTotalSAR, 'SAR', true, 2), 
                formatCurrency(visaData.busPriceTotalSAR, 'SAR', true, 2), 
                formatCurrency(convertToIDR(visaData.busPriceTotalSAR, 'SAR'), 'IDR')
            ]);
        }
    } else if (order.serviceType === ServiceType.HANDLING) {
        const handlingData = orderData as HandlingBookingData;
        if (handlingData.handlingPricePerPaxSAR && handlingData.pax) {
            const subtotalSAR = handlingData.handlingPricePerPaxSAR * handlingData.pax;
            totalSARAmt += subtotalSAR;
             items.push([
                `Layanan Handling`, 
                `${handlingData.pax} pax`, 
                formatCurrency(handlingData.handlingPricePerPaxSAR, 'SAR', true, 2), 
                formatCurrency(subtotalSAR, 'SAR', true, 2), 
                formatCurrency(convertToIDR(subtotalSAR, 'SAR'), 'IDR')
            ]);
        }
    } else { 
        items.push([`Layanan ${order.serviceType}`, '-', '-', priceUnavailableText, formatCurrency(order.totalPrice, 'IDR')]);
    }
  } else {
    items.push([`Layanan ${order.serviceType}`, '-', '-', priceUnavailableText, priceUnavailableText]);
  }
  
  const grandTotalIDRText = pricePending ? priceUnavailableText : formatCurrency(order.totalPrice, 'IDR');

  autoTable(doc, {
    head: [['Deskripsi Layanan', 'Qty/Pax', 'Harga Satuan', 'Subtotal Asli', 'Subtotal (IDR)']],
    body: items,
    theme: 'grid',
    foot: [['Total Keseluruhan (IDR)', '', '', '', grandTotalIDRText]],
    headStyles: { halign: 'center' },
    footStyles: { fontStyle: 'bold', fillColor: [220,220,220], textColor: [0,0,0], halign: 'right' },
    columnStyles: { 
        2: { halign: 'right' }, 
        3: { halign: 'right' },
        4: { halign: 'right' },
    },
     didDrawPage: (data) => {
        addHeaderFooter(doc, title);
        doc.setFontSize(10);
        doc.text(`Page ${data.pageNumber} of {totalPages}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
    }
  });
  
  let finalY = (doc as any).lastAutoTable.finalY || 100;
  finalY += 8;

  if (!pricePending) {
    doc.setFontSize(10);
    doc.text("Ringkasan Tagihan Mata Uang Asing:", 14, finalY);
    finalY += 5;
    if (totalSARAmt > 0) {
        doc.text(`Total SAR: ${formatCurrency(totalSARAmt, 'SAR', true, 2)}`, 14, finalY);
        finalY += 5;
    }
    if (totalUSDAmt > 0) {
        doc.text(`Total USD: ${formatCurrency(totalUSDAmt, 'USD', true, 2)}`, 14, finalY);
        finalY += 5;
    }
    doc.text(`Kurs yang digunakan (Estimasi):`, 14, finalY);
    finalY += 5;
    doc.text(`  1 USD = ${formatCurrency(MOCK_EXCHANGE_RATES.USD_TO_IDR, 'IDR', true, 0)}`, 14, finalY);
    finalY += 5;
    doc.text(`  1 SAR = ${formatCurrency(MOCK_EXCHANGE_RATES.SAR_TO_IDR, 'IDR', true, 0)}`, 14, finalY);
    finalY += 5;
  }
  
  finalY += 5; // Extra space before payment details
  doc.setFontSize(10);
  doc.text("Mohon lakukan pembayaran ke rekening berikut:", 14, finalY);
  finalY += 5;
  doc.text("Bank Tujuan: EWAKO ROYAL BANK (Contoh)", 14, finalY); // Replace with dynamic if available
  finalY += 5;
  doc.text("No. Rekening: 123-456-7890 (Contoh)", 14, finalY); // Replace with dynamic if available
  finalY += 5;
  doc.text("Atas Nama: PT EWAKO ROYAL NUSANTARA", 14, finalY);
  finalY += 10;
  doc.text("Harap konfirmasi setelah melakukan pembayaran.", 14, finalY);
  finalY += 5;
  doc.text("Terima kasih.", 14, finalY);

  doc.output('dataurlnewwindow');
};

export const generatePackageInfoPdf = (order: Order) => {
  const doc = new jsPDF();
  const title = `Informasi Paket - Order ID: ${order.id.substring(0,12)}`;
  const packageInfo = order.packageInfo;

  if (!packageInfo) {
      doc.text("Informasi paket tidak tersedia.", 14, 40);
      doc.output('dataurlnewwindow');
      return;
  }
  
  const body: any[] = [
      ['Nama PPIU/PIHK', packageInfo.ppiuName || '-'],
      ['No. Telpon PPIU', packageInfo.ppiuPhone || '-'],
      ['Jumlah Jemaah (Pax)', packageInfo.paxCount || '-'],
      [{ content: 'Akomodasi', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0,0,0] } }],
      ['Hotel Madinah', packageInfo.madinahHotelInfo || 'Tidak ada/Belum diatur'],
      ['Hotel Mekah', packageInfo.makkahHotelInfo || 'Tidak ada/Belum diatur'],
      [{ content: 'Transportasi Bus Utama', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0,0,0] } }],
      ['Nama Bus', packageInfo.busName || '-'],
      ['Jenis Kendaraan Bus', packageInfo.busVehicleType || '-'],
      ['Nama Driver Bus', packageInfo.busDriverName || '-'],
      ['No. HP Driver Bus', packageInfo.busDriverPhone || '-'],
      ['Nomor Syarikah Bus', packageInfo.busSyarikahNumber || '-'],
  ];

  if (packageInfo.busRoutes && packageInfo.busRoutes.length > 0) {
      body.push([{ content: 'Rute Perjalanan Bus', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0,0,0] }}]);
      packageInfo.busRoutes.forEach((route, index) => {
          body.push([`Rute ${index + 1}`, `Tanggal: ${formatDate(route.date)}\nDari: ${route.from} Ke: ${route.to}\nKendaraan Rute: ${route.vehicleDetails || 'Belum diatur'}`]);
      });
  }

 body.push(
      [{ content: 'Kontak Penting', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0,0,0] } }],
      ['Nama Mutowif', packageInfo.mutowifName || '-'],
      ['No. Tlp Mutowif', packageInfo.mutowifPhone || '-'],
      ['Nama Perwakilan Saudi', packageInfo.representativeName || '-'],
      ['No. Tlp Perwakilan Saudi', packageInfo.representativePhone || '-'],
      ['No. Tlp Ewako Royal (PIC Saudi)', packageInfo.ewakoRoyalPhone || '-'],
      [{ content: 'Detail Penerbangan', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0,0,0] } }],
      ['Nama Maskapai', packageInfo.airlineName || '-'],
      ['Kode Penerbangan', packageInfo.airlineCode || '-'],
      ['Tgl & Waktu Kedatangan Saudi', formatDateTime(packageInfo.arrivalDateTime)],
      ['Tgl & Waktu Kepulangan (dari Saudi)', formatDateTime(packageInfo.departureDateTime)],
  );

  autoTable(doc, {
      startY: 40,
      head: [['Deskripsi', 'Informasi']],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [183, 28, 28], textColor: [255,255,255] },
      columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' }, 1: { cellWidth: 'auto'} },
      didDrawPage: (data) => {
          addHeaderFooter(doc, title);
          doc.setFontSize(10);
          doc.text(`Page ${data.pageNumber} of {totalPages}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
      }
  });

  doc.output('dataurlnewwindow');
};
