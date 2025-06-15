
import React from 'react';
import { PackageInfoData } from '../types';
import { Card } from './ui/Card';

interface PackageInfoDisplayProps {
  packageInfo?: PackageInfoData;
}

const DetailItem: React.FC<{ label: string, value?: string | number }> = ({ label, value }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-100 sm:mt-0 sm:col-span-2">{value}</dd>
    </div>
  );
};

export const PackageInfoDisplay: React.FC<PackageInfoDisplayProps> = ({ packageInfo }) => {
  if (!packageInfo) {
    return (
      <Card title="Informasi Paket" className="bg-gray-800">
        <p className="text-gray-400">Informasi paket belum tersedia untuk pesanan ini.</p>
      </Card>
    );
  }

  return (
    <Card title="Detail Paket Info" className="bg-gray-800">
      <dl className="divide-y divide-gray-700">
        <DetailItem label="Nama PPIU/PIHK" value={packageInfo.ppiuName} />
        <DetailItem label="No. Telpon PPIU" value={packageInfo.ppiuPhone} />
        <DetailItem label="Jumlah Jemaah (Pax)" value={packageInfo.paxCount} />
        {packageInfo.madinahHotelInfo && <DetailItem label="Hotel Madinah" value={packageInfo.madinahHotelInfo} />}
        {packageInfo.makkahHotelInfo && <DetailItem label="Hotel Mekah" value={packageInfo.makkahHotelInfo} />}
        
        {/* Bus Details */}
        {packageInfo.busVehicleId && packageInfo.busName ? (
            <>
                <DetailItem label="Nama Bus Utama" value={packageInfo.busName} />
                <DetailItem label="Jenis Kendaraan Bus Utama" value={packageInfo.busVehicleType} />
                <DetailItem label="Nama Driver Bus Utama" value={packageInfo.busDriverName} />
                <DetailItem label="No. HP Driver Bus Utama" value={packageInfo.busDriverPhone} />
                <DetailItem label="Nomor Syarikah Bus Utama" value={packageInfo.busSyarikahNumber} />
            </>
        ) : packageInfo.busName ? ( 
             <DetailItem label="Nama Bus (Lama)" value={packageInfo.busName} />
        ) : (
            <DetailItem label="Bus Utama" value="Belum diatur" />
        )}

        {packageInfo.busRoutes && packageInfo.busRoutes.length > 0 && (
          <div className="py-2">
            <dt className="text-sm font-medium text-gray-400 mb-1">Rute Bus:</dt>
            {packageInfo.busRoutes.map((route, index) => (
              <dd key={index} className="mt-1 text-sm text-gray-100 ml-4 border-l-2 border-gray-600 pl-3 mb-2 pb-1">
                <p><strong>Rute {index + 1}:</strong> Tanggal: {route.date ? new Date(route.date).toLocaleDateString('id-ID') : '-'}, Dari: {route.from || '-'} Ke: {route.to || '-'}</p>
                <p className="text-xs text-gray-300">Detail Kendaraan Rute: {route.vehicleDetails || 'Belum diatur'}</p>
              </dd>
            ))}
          </div>
        )}

        <DetailItem label="Nama Mutowif" value={packageInfo.mutowifName} />
        <DetailItem label="No. Tlp Mutowif" value={packageInfo.mutowifPhone} />
        <DetailItem label="Nama Perwakilan Saudi" value={packageInfo.representativeName} />
        <DetailItem label="No. Tlp Perwakilan" value={packageInfo.representativePhone} />
        <DetailItem label="No. Tlp Ewako Royal" value={packageInfo.ewakoRoyalPhone} />
        <DetailItem label="Nama Maskapai" value={packageInfo.airlineName} />
        <DetailItem label="Kode Maskapai" value={packageInfo.airlineCode} />
        <DetailItem label="Tanggal & Waktu Kedatangan" value={packageInfo.arrivalDateTime ? new Date(packageInfo.arrivalDateTime).toLocaleString('id-ID') : undefined} />
        <DetailItem label="Tanggal & Waktu Kepulangan" value={packageInfo.departureDateTime ? new Date(packageInfo.departureDateTime).toLocaleString('id-ID') : undefined} />
      </dl>
    </Card>
  );
};
