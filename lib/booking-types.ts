export type CottageOption = {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: string;
  imageUrl: string | null;
  quantity: number | null;
};

export type BookingRequestPayload = {
  name: string;
  email: string;
  phone?: string;
  selected_cottage_id: string;
  number_of_adult: string;
  number_of_kids: string;
  total_price: number;
  summary?: string;
  checkIn?: string;
  checkOut?: string;
  selectedDateKey?: string;  // Local calendar date as YYYY-MM-DD
  timezoneOffset?: number;   // Minutes
};

export type BookingResponse = {
  booking: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    number_of_adult: string;
    number_of_kids: string;
    total_price: number;
    summary: string | null;
    checkIn: string | null;
    checkOut: string | null;
    checkoutTime: string;
    createdAt: string;
    cottage: Array<{
      id: string;
      name: string;
      description: string;
      price: number;
    }>;
    receipt: {
      id: string;
      downPaymentAmount: number;
      fullyPaid: boolean;
      status: string;
    } | null;
  };
  receiptUrl: string | null;
  emailSent: boolean;
  message: string;
};
