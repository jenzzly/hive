export type TaxonomyMap = { [category: string]: { [type: string]: string[] } };

export const PROPERTY_TAXONOMY: TaxonomyMap = {
  'Residential': {
    'Apartment': ['Studio Apartment','1 Bedroom Apartment','2 Bedroom Apartment','3+ Bedroom Apartment','Penthouse Apartment','Serviced Apartment','Loft Apartment'],
    'House': ['Detached House','Semi-Detached House','Bungalow','Villa','Cottage','Farmhouse'],
    'Shared Living': ['Private Room','Shared Room','Student Housing','Co-Living Space'],
    'Multi-Unit Residence': ['Duplex','Triplex','Townhouse','Row House'],
  },
  'Commercial': {
    'Office': ['Private Office','Shared Office','Coworking Space','Corporate Office Floor'],
    'Retail': ['Shop','Mall Unit','Showroom','Kiosk'],
    'Food & Hospitality': ['Restaurant Space','Café Space','Bar Space','Bakery Space'],
    'Industrial': ['Warehouse','Workshop','Factory Unit','Logistics Space'],
  },
  'Storage / Utility': {
    'Storage': ['Personal Storage Unit','Business Storage','Container Storage','Archive Storage'],
    'Parking': ['Car Garage','Underground Parking','Outdoor Parking','Bike Parking'],
    'Specialized Storage': ['Boat Storage','RV Storage','Equipment Storage'],
  },
  'Land / Outdoor': {
    'Land': ['Residential Plot','Commercial Plot','Agricultural Land','Development Land'],
    'Outdoor Space': ['Garden','Event Garden','Camping Land','Recreational Land'],
  },
  'Hospitality': {
    'Short Stay': ['Guest House','Hostel Room','Hotel Room','Resort Villa','Airbnb Unit'],
  },
  'Mixed Use': {
    'Hybrid Property': ['Live-Work Space','Office + Residence','Retail + Storage','Shop + Apartment'],
  },
};

export const getCategories = () => Object.keys(PROPERTY_TAXONOMY);
export const getTypes = (cat: string) => cat ? Object.keys(PROPERTY_TAXONOMY[cat] ?? {}) : [];
export const getSubcategories = (cat: string, type: string) =>
  cat && type ? PROPERTY_TAXONOMY[cat]?.[type] ?? [] : [];
