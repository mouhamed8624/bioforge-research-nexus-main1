
-- Drop the existing inventory_items table and recreate with new structure
DROP TABLE IF EXISTS public.inventory_items CASCADE;

-- Create new inventory_items table with French-based columns
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT, -- Number/ID
  produit TEXT NOT NULL, -- Product
  nom_vernaculaire TEXT, -- Vernacular name
  type TEXT CHECK (type IN ('cons', 'reactif')), -- Type (cons|reactif)
  numero_lot_catalogue TEXT, -- Lot/catalog number
  reference TEXT, -- Reference
  fabriquant TEXT, -- Manufacturer
  pays TEXT, -- Country
  rayon TEXT, -- Section/Aisle
  conditionnement TEXT, -- Packaging/Conditioning
  quantite_restante INTEGER DEFAULT 0, -- Remaining quantity
  date_preemption DATE, -- Expiration date
  temperature_conservation TEXT, -- Conservation temperature
  projet_chimique TEXT, -- Chemical project
  projet_source TEXT, -- Source project
  seuil_alerte INTEGER, -- Alert threshold
  observation_commentaire TEXT, -- Observation/Comments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create trigger for updated_at
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
