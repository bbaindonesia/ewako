
export const MOCK_EXCHANGE_RATES = {
  USD_TO_IDR: 16250, // Updated example rate
  SAR_TO_IDR: 4350,  // Updated example rate
};

export const convertToIDR = (amount: number, currency: 'USD' | 'SAR'): number => {
  if (currency === 'USD') {
    return amount * MOCK_EXCHANGE_RATES.USD_TO_IDR;
  }
  if (currency === 'SAR') {
    return amount * MOCK_EXCHANGE_RATES.SAR_TO_IDR;
  }
  // Should ideally not happen if currency is correctly specified,
  // but returning amount might be safer than 0 or throwing error in some UI contexts.
  console.warn(`Unsupported currency for conversion: ${currency}`);
  return amount; 
};

export const formatCurrency = (
    amount: number | undefined | null, 
    currencyCode: 'IDR' | 'USD' | 'SAR', 
    showSymbol = true,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  ): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return currencyCode === 'IDR' ? 'Rp -' : `${currencyCode} -`;
  }

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: minimumFractionDigits,
    maximumFractionDigits: maximumFractionDigits,
  };
  
  // Intl.NumberFormat does not always prefix with the currency code for USD/SAR,
  // so we handle it manually if showSymbol is true and it's not IDR.
  // For IDR, it correctly shows "Rp".
  
  let formatted = new Intl.NumberFormat('id-ID', options).format(amount);

  if (showSymbol) {
    if (currencyCode === 'USD' && !formatted.includes('US$')) {
       // Intl for 'id-ID' might use "$" or "US$". If just "$", prepend "USD ".
       // Or, more robustly, always prepend if we want "USD" explicitly.
       formatted = `USD ${new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits, maximumFractionDigits }).format(amount)}`;
    } else if (currencyCode === 'SAR' && !formatted.includes('SAR')) {
       // Intl for 'id-ID' might not include "SAR".
       formatted = `SAR ${new Intl.NumberFormat('ar-SA', { style: 'decimal', minimumFractionDigits, maximumFractionDigits }).format(amount)}`;
    }
  } else {
      // If not showing symbol, just format as a number according to locale
      // For IDR, it would remove Rp. For USD/SAR, it would be just the number.
      formatted = new Intl.NumberFormat('id-ID', { style: 'decimal', minimumFractionDigits, maximumFractionDigits }).format(amount);
  }


  return formatted;
};
