/** Size classes from the Fordonsbibliotek proof. Named by size, never by model. */
export const VEHICLE_CLASSES = [
  { id: "smabil", label: "Småbil" },
  { id: "kompakt", label: "Kompakt" },
  { id: "sedan", label: "Sedan" },
  { id: "kombi", label: "Kombi" },
  { id: "kompakt-suv", label: "Kompakt SUV" },
  { id: "stor-suv", label: "Stor SUV" },
  { id: "el-sedan", label: "El-sedan" },
  { id: "el-suv", label: "El-SUV" },
  { id: "minibuss", label: "Minibuss" },
  { id: "skapbil", label: "Skåpbil" },
  { id: "stor-transport", label: "Stor transport" },
  { id: "pickup", label: "Pickup" },
  { id: "liten-skapbil", label: "Liten skåpbil" },
] as const;

export type VehicleClassId = (typeof VEHICLE_CLASSES)[number]["id"];

export function vehicleClassIds(): VehicleClassId[] {
  return VEHICLE_CLASSES.map((entry) => entry.id);
}

export function vehicleClassLabel(id: string): string | null {
  return VEHICLE_CLASSES.find((entry) => entry.id === id)?.label ?? null;
}
