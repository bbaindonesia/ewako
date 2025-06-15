
import { ADMIN_WHATSAPP_NUMBER } from '../constants';
import { HotelBookingData, VisaBookingData, HandlingBookingData, JastipBookingData, ServiceType } from '../types';

const formatDateForWhatsapp = (dateString?: string, includeTime = false): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  if (includeTime) {
    return date.toLocaleString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
  return date.toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
};


function formatHotelBookingForWhatsApp(data: HotelBookingData): string {
  let message = `-- PESANAN BARU: HOTEL --
Nama: ${data.customerName}
PPIU: ${data.ppiuName || '-'}
No. HP: ${data.phone}
Alamat: ${data.address || '-'}
---
`;

  if (data.madinahHotel && data.madinahHotel.name) {
    message += `MADINAH:
Hotel: ${data.madinahHotel.name}
Check-in: ${formatDateForWhatsapp(data.madinahHotel.checkIn)}
Check-out: ${formatDateForWhatsapp(data.madinahHotel.checkOut)}
Durasi: ${data.madinahHotel.nights} Malam
Kamar: Quad(${data.madinahHotel.rooms.quad}), Triple(${data.madinahHotel.rooms.triple}), Double(${data.madinahHotel.rooms.double})
---
`;
  }

  if (data.makkahHotel && data.makkahHotel.name) {
    message += `MAKKAH:
Hotel: ${data.makkahHotel.name}
Check-in: ${formatDateForWhatsapp(data.makkahHotel.checkIn)}
Check-out: ${formatDateForWhatsapp(data.makkahHotel.checkOut)}
Durasi: ${data.makkahHotel.nights} Malam
Kamar: Quad(${data.makkahHotel.rooms.quad}), Triple(${data.makkahHotel.rooms.triple}), Double(${data.makkahHotel.rooms.double})
---
`;
  }
  
  message += "LAYANAN TAMBAHAN:\n";
  let hasAdditionalService = false;
  if (data.includeHandling) {
    message += `- Handling: YA (Pax: ${data.handlingPax || 'N/A'})\n`;
    hasAdditionalService = true;
  }
  if (data.includeVisa) {
    message += `- Visa: YA (Pax: ${data.visaPax || 'N/A'})\n`;
    if (data.visaVehicleType) message += `  Jenis Kendaraan: ${data.visaVehicleType}\n`;
    if (data.visaAirlineName) message += `  Nama Maskapai: ${data.visaAirlineName}\n`;
    if (data.visaArrivalDate) message += `  Tgl & Waktu Kedatangan: ${formatDateForWhatsapp(data.visaArrivalDate, true)}\n`;
    if (data.visaDepartureDate) message += `  Tgl & Waktu Kepulangan: ${formatDateForWhatsapp(data.visaDepartureDate, true)}\n`;
    hasAdditionalService = true;
  }
  if (!hasAdditionalService) {
    message += "- Tidak ada\n";
  }
  return message;
}

function formatVisaBookingForWhatsApp(data: VisaBookingData): string {
  return `--- PESANAN BARU: VISA ---
Nama: ${data.customerName}
PPIU: ${data.ppiuName || '-'}
No. HP: ${data.phone}
Alamat: ${data.address || '-'}
Jumlah Jemaah: ${data.pax}
Jenis Kendaraan: ${data.vehicleType || '-'}
`;
}

function formatHandlingBookingForWhatsApp(data: HandlingBookingData): string {
  return `--- PESANAN BARU: HANDLING ---
Nama: ${data.customerName}
PPIU: ${data.ppiuName || '-'}
No. HP: ${data.phone}
Alamat: ${data.address || '-'}
Jumlah Jemaah: ${data.pax}
Include Mutowif: ${data.includeMutowif ? `YA (${data.mutowifName || 'Belum Dipilih'})` : 'TIDAK'}
`;
}

function formatJastipBookingForWhatsApp(data: JastipBookingData): string {
  return `--- PESANAN BARU: JASTIP ---
Nama: ${data.customerName}
No. HP: ${data.phone}
Jenis Titipan: ${data.itemType}
Jumlah: ${data.quantity} ${data.unit}
Alamat Tujuan: ${data.deliveryAddress}
Pesan Untuk Pengantar: ${data.notes || '-'}
`;
}


export const sendOrderToWhatsApp = (
  serviceType: ServiceType,
  orderData: HotelBookingData | VisaBookingData | HandlingBookingData | JastipBookingData
) => {
  let messageBody = '';
  switch(serviceType) {
    case ServiceType.HOTEL:
      messageBody = formatHotelBookingForWhatsApp(orderData as HotelBookingData);
      break;
    case ServiceType.VISA:
      messageBody = formatVisaBookingForWhatsApp(orderData as VisaBookingData);
      break;
    case ServiceType.HANDLING:
      messageBody = formatHandlingBookingForWhatsApp(orderData as HandlingBookingData);
      break;
    case ServiceType.JASTIP:
      messageBody = formatJastipBookingForWhatsApp(orderData as JastipBookingData);
      break;
    default:
      messageBody = "Detail pesanan tidak tersedia.";
  }

  const encodedMessage = encodeURIComponent(messageBody);
  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};

export const sendNotificationToCustomer = (customerPhone: string, message: string) => {
  const encodedMessage = encodeURIComponent(message);
  // Ensure customerPhone is in international format without '+' for wa.me link if it causes issues.
  // Or handle '+' correctly. For this example, assuming it's correctly formatted by user input.
  const whatsappUrl = `https://wa.me/${customerPhone}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};
