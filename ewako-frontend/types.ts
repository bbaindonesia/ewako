
export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: 'customer' | 'admin';
  ppiuName?: string; // Perusahaan Penyelenggara Ibadah Umrah
  address?: string; // Added for registration
  password?: string; // Added for registration form state, not for direct storage in mockUser unless "hashed"
  accountStatus?: 'pending_approval' | 'active' | 'suspended'; // New field for account status
}

export enum OrderStatus {
  REQUEST_CONFIRMATION = "Request Confirmation",
  TENTATIVE_CONFIRMATION = "Tentative Confirmation", // Needs customer approval
  DEFINITE_CONFIRMATION = "Definite Confirmation", // Customer approved, awaiting Admin confirmation / DP
  CONFIRMED_BY_ADMIN = "Confirmed by Admin", // Admin confirmed
  DOWNPAYMENT_RECEIVED = "Downpayment Received",
  FULLY_PAID = "Lunas",
  REJECTED_BY_CUSTOMER = "Rejected by Customer",
  CANCELLED = "Cancelled"
}

export enum ServiceType {
  HOTEL = "Hotel",
  VISA = "Visa",
  HANDLING = "Handling",
  TRAIN_TICKET = "Tiket Kereta",
  JASTIP = "Jasa Titipan"
}

export interface RoomBooking {
  quad: number;
  triple: number;
  double: number;
}

export interface HotelInfo {
  name: string;
  nights: number;
  rooms: RoomBooking;
  checkIn: string; // ISO date string
  checkOut: string; // ISO date string
  // Admin-set unit prices per room type per night in SAR
  pricesSAR?: {
    quad?: number; // Price in SAR
    triple?: number; // Price in SAR
    double?: number; // Price in SAR
  };
}

export interface HotelBookingData {
  customerName: string;
  ppiuName?: string;
  phone: string;
  address: string;
  madinahHotel?: HotelInfo;
  makkahHotel?: HotelInfo;
  includeHandling: boolean;
  handlingPax?: number;
  handlingPricePerPaxSAR?: number; // Price in SAR
  includeVisa: boolean;
  visaPax?: number;
  visaPricePerPaxUSD?: number; // Price in USD
  visaVehicleType?: 'Bus' | 'HiAce' | 'SUV' | '';
  visaAirlineName?: string;
  visaArrivalDate?: string; // ISO date string
  visaDepartureDate?: string; // ISO date string
  muasasahName?: string; 
  busPriceTotalSAR?: number; // Price in SAR, if applicable to hotel package
}

export interface VisaBookingData {
  customerName: string;
  ppiuName?: string;
  phone: string;
  address: string;
  pax: number;
  vehicleType: 'Bus' | 'HiAce' | 'SUV' | '';
  muasasahName?: string; 
  visaPricePerPaxUSD?: number; // Price in USD
  busPriceTotalSAR?: number; // Price in SAR
}

export interface HandlingBookingData {
  customerName: string;
  ppiuName?: string;
  phone: string;
  address: string;
  pax: number;
  includeMutowif: boolean;
  mutowifName?: string; // Selected Mutowif
  handlingPricePerPaxSAR?: number; // Price in SAR
}

export enum JastipItemType {
  FOOD = "Makanan",
  CLOTHES = "Pakaian",
  PERFUME = "Parfum",
  DATES = "Kurma",
  OTHER = "Lainnya"
}

export enum JastipUnit {
  BOX = "Box",
  KG = "Kg",
  PCS = "Pcs",
  KODI = "Kodi",
  BOTTLE = "Botol",
  LUSIN = "Lusin",
  UNIT = "Unit"
}

export interface JastipBookingData {
  customerName: string;
  phone: string;
  itemType: JastipItemType | '';
  unit: JastipUnit | '';
  quantity: number;
  deliveryAddress: string;
  notes?: string;
  // Jastip price is assumed to be set in IDR directly by admin if applicable, or managed outside this LA system's pricing
}

export interface BusRouteItem {
  date: string;
  from: string;
  to: string;
  routeVehicleId?: string; // ID of the vehicle selected for this specific route
  vehicleDetails?: string; // Derived string like "Vehicle Name (Plate) - Driver Name"
}

export interface PackageInfoData {
  ppiuName: string;
  ppiuPhone: string;
  paxCount: number;
  madinahHotelInfo?: string; 
  makkahHotelInfo?: string; 
  
  busVehicleId?: string; // ID of the selected main vehicle for the package
  busName?: string; // Name of the selected main vehicle (derived)
  busVehicleType?: 'Bus' | 'HiAce' | 'SUV' | ''; // Type of the selected main vehicle (derived)
  busDriverName?: string; // Driver name of the selected main vehicle (derived)
  busDriverPhone?: string; // Driver phone of the selected main vehicle (derived)
  busSyarikahNumber?: string; // Nomor Syarikah for the main bus

  busRoutes?: Array<BusRouteItem>; 
  mutowifName?: string;
  mutowifPhone?: string;
  representativeName?: string; 
  representativePhone?: string;
  ewakoRoyalPhone?: string;
  airlineName?: string;
  airlineCode?: string;
  arrivalDateTime?: string; // ISO datetime string
  departureDateTime?: string; // ISO datetime string
}

export interface Mutowif {
  id: string;
  name: string;
  phone: string;
}

export interface ManifestItem {
  id: string;
  namaJemaah: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan' | '';
  tanggalLahir: string; // ISO date string
  usia?: number; // Calculated
  nomorVisa?: string;
  namaDiPaspor: string;
  nomorPaspor: string;
  tanggalTerbitPaspor: string; // ISO date string
  tanggalExpiredPaspor: string; // ISO date string
  kotaTempatIssuedPaspor?: string;
}

// --- Tambahan Baru untuk Kelola Pengguna (Pembayaran), Atur Kendaraan, Chat ---

export interface Payment {
  id: string; // unique payment id
  orderId: string;
  userId: string; // who made the payment - useful if an admin user on behalf of customer
  amount: number; // This will always be in IDR
  paymentDate: string; // ISO date string
  paymentType: 'DP' | 'LUNAS' | 'LAINNYA'; // Down Payment, Full Payment, Other
  paymentMethod: 'Transfer' | 'Midtrans VA' | 'Cash' | 'Lainnya';
  notes?: string;
  createdAt: string; // ISO date string for when the record was made
}

export interface Vehicle {
  id: string;
  type: 'Bus' | 'HiAce' | 'SUV' | ''; // Jenis Kendaraan
  name: string;                         // Nama Kendaraan (Mis: "Bus Mercedes Benz OH 1626 #1")
  plateNumber: string;                  // No. Kendaraan (Plat Nomor)
  driverName?: string;
  driverPhone?: string;                  // No. Driver (Nomor HP)
  companyName?: string;                  // Nama Perusahaan/Syarikah
}

export enum ChatParty {
  ADMIN = 'Admin Ewako',
  CUSTOMER = 'Customer', 
}

export interface ChatMessage {
  id: string;
  orderId: string;        // Chat is associated with an order
  timestamp: string;      // ISO date string
  sender: ChatParty | string; // 'Admin Ewako' or customer's name
  senderId: string;       // 'adminUser' or customer's userId
  text?: string;
  fileName?: string;       // For mock file attachment
  fileType?: 'image/jpeg' | 'image/png' | 'application/pdf'; // Mock file type
  fileDataUrl?: string;    // Base64 Data URL for image previews
  isRead?: boolean;       // Simple read status
}

export interface Order {
  id: string;
  userId: string;
  serviceType: ServiceType;
  data: HotelBookingData | VisaBookingData | HandlingBookingData | JastipBookingData;
  status: OrderStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  adminNotes?: string;
  customerConfirmation?: boolean; // For Tentative Confirmation
  packageInfo?: PackageInfoData;
  manifest?: ManifestItem[];
  totalPrice?: number; // Total price in IDR, calculated from SAR/USD components
  payments?: Payment[];  // Added for payment management
  chatHistory?: ChatMessage[]; // Added for chat feature
}
