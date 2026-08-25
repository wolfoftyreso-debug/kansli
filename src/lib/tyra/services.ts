export const OPERATION_LABELS: Record<CanonicalOperation, string> = {
  STORAGE_IN: "Inlagring",
  STORAGE_OUT: "Utlämning",
  STORAGE_CONTINUE: "Fortsatt förvaring",
  STORAGE_TERMINATE: "Avsluta förvaring",
  STORAGE_TRANSFER_IN: "Överföring in",
  STORAGE_TRANSFER_OUT: "Överföring ut",
  TIRE_SWAP: "Hjulskifte",
  TIRE_SWAP_FROM_STORAGE: "Hjulskifte från lager",
  TIRE_SWAP_TO_STORAGE: "Hjulskifte till lager",
  NEW_CUSTOMER_SWAP_AND_STORE: "Nykund: skifte och inlagring",
  EXISTING_CUSTOMER_SWAP_AND_STORE: "Skifte och inlagring",
  CUSTOMER_CARRIED_WHEELS_SWAP: "Kunden har med hjul",
  WHEEL_WASH: "Tvätt",
  WHEEL_BALANCE: "Balansering",
  WHEEL_INSPECTION: "Besiktning",
  WHEEL_REPAIR: "Hjulreparation",
  RIM_REPAIR: "Fälgreparation",
  VALVE_SERVICE: "Ventil",
  TPMS_SERVICE: "TPMS",
  WHEEL_PACKING: "Packning",
  WHEEL_DISPOSAL: "Skrotning av hjul",
  TIRE_REPLACEMENT_REQUIRED: "Däckbyte krävs",
  TIRE_REPLACEMENT_RECOMMENDED: "Däckbyte rekommenderas",
  TIRE_QUOTE: "Sälj däck",
  TIRE_ORDER: "Beställning",
  TIRE_INSTALLATION: "Montering",
  TIRE_DISPOSAL: "Däckskrotning",
};

export function summarizeOperations(operations: readonly string[]): string {
  if (operations.length === 0) return "Inga åtgärder";
  return operations
    .map((operation) => OPERATION_LABELS[operation as CanonicalOperation] ?? operation)
    .join(" · ");
}

export type CanonicalOperation =
  | "STORAGE_IN"
  | "STORAGE_OUT"
  | "STORAGE_CONTINUE"
  | "STORAGE_TERMINATE"
  | "STORAGE_TRANSFER_IN"
  | "STORAGE_TRANSFER_OUT"
  | "TIRE_SWAP"
  | "TIRE_SWAP_FROM_STORAGE"
  | "TIRE_SWAP_TO_STORAGE"
  | "NEW_CUSTOMER_SWAP_AND_STORE"
  | "EXISTING_CUSTOMER_SWAP_AND_STORE"
  | "CUSTOMER_CARRIED_WHEELS_SWAP"
  | "WHEEL_WASH"
  | "WHEEL_BALANCE"
  | "WHEEL_INSPECTION"
  | "WHEEL_REPAIR"
  | "RIM_REPAIR"
  | "VALVE_SERVICE"
  | "TPMS_SERVICE"
  | "WHEEL_PACKING"
  | "WHEEL_DISPOSAL"
  | "TIRE_REPLACEMENT_REQUIRED"
  | "TIRE_REPLACEMENT_RECOMMENDED"
  | "TIRE_QUOTE"
  | "TIRE_ORDER"
  | "TIRE_INSTALLATION"
  | "TIRE_DISPOSAL";

export type DmsCapabilities = {
  supportsReadOrders: boolean;
  supportsWriteOrders: boolean;
  supportsAddOrderLine: boolean;
  supportsUpdateBooking: boolean;
  supportsCustomerLookup: boolean;
  supportsVehicleLookup: boolean;
  supportsPricing: boolean;
  supportsInvoiceStatus: boolean;
};

export type DmsExternalEvent = {
  sourceSystem: string; // e.g. "DMS_A"
  externalEventId: string; // idempotency key
  externalOrderId?: string | null;
  externalBookingId?: string | null;
  externalLineId?: string | null;
  occurredAt: string; // ISO
  payload: unknown;
};

export type DmsCodeMapping = {
  sourceSystem: string;
  dmsCode: string;
  mappingVersion: number;
  canonicalOperation: CanonicalOperation;
  description?: string | null;
  active: boolean;
};
