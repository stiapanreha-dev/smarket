export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface AvailableSlot {
  start: Date;
  end: Date;
  provider_id?: string;
}

export interface SlotConflict {
  booking_id: string;
  start: Date;
  end: Date;
}
