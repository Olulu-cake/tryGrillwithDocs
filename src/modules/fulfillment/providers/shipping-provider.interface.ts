export interface CreateLabelInput {
  orderId: string;
  recipientAddress: {
    name: string;
    line1: string;
    city: string;
    postalCode: string;
    country: string;
  };
  weightKg: number;
  metadata: Record<string, any>;
}

export interface LabelGenerationResult {
  trackingNumber: string;
  labelUrl: string;
  carrierId: string;
}

export interface TrackingStatus {
  trackingNumber: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  lastUpdated: Date;
}

export interface ShippingProvider {
  createLabel(input: CreateLabelInput): Promise<LabelGenerationResult>;
  getTrackingStatus(trackingNumber: string): Promise<TrackingStatus>;
  getTrackingInfo(trackingNumber: string): Promise<TrackingStatus>;
}
