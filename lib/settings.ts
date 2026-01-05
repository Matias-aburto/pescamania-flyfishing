import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from './supabase';

const settingsFilePath = path.join(process.cwd(), 'data', 'settings.json');

export interface MenuItem {
  id: string;
  label: string;
  url: string;
}

export interface AppSettings {
  whatsappNumber: string;
  logo: string;
  favicon?: string; // Favicon del sitio
  primaryColor: string;
  minimumPurchase: number; // Mínimo de compra en pesos chilenos
  pickupAddress?: string; // Dirección de retiro
  menuItems?: MenuItem[]; // Items del menú principal
  announcementBar: {
    enabled: boolean;
    messages: string[];
    position: 'top' | 'bottom';
    backgroundColor?: string;
    textColor?: string;
    rotationInterval?: number; // Tiempo en segundos entre rotaciones
  };
}

const defaultSettings: AppSettings = {
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '1234567890',
  logo: '',
  favicon: '',
  primaryColor: '#0284c7',
  minimumPurchase: 0, // 0 significa sin mínimo
  menuItems: [
    { id: '1', label: 'Catálogo', url: '/' }
  ],
  announcementBar: {
    enabled: false,
    messages: [],
    position: 'top',
    backgroundColor: '#0ea5e9',
    textColor: '#ffffff',
    rotationInterval: 5, // 5 segundos por defecto
  },
};

// Verificar si Supabase está configurado
function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

// Convertir datos de Supabase al formato AppSettings
function fromSupabaseRow(row: any): AppSettings {
  return {
    whatsappNumber: row.whatsapp_number || '',
    logo: row.logo || '',
    favicon: row.favicon || '',
    primaryColor: row.primary_color || '#0284c7',
    minimumPurchase: row.minimum_purchase !== undefined ? row.minimum_purchase : 0,
    pickupAddress: row.pickup_address || '',
    menuItems: row.menu_items || [],
    announcementBar: row.announcement_bar || {
      enabled: false,
      messages: [],
      position: 'top',
      backgroundColor: '#0ea5e9',
      textColor: '#ffffff',
      rotationInterval: 5,
    },
  };
}

// Convertir AppSettings al formato de Supabase
function toSupabaseRow(settings: AppSettings): any {
  return {
    whatsapp_number: settings.whatsappNumber,
    logo: settings.logo,
    favicon: settings.favicon || '',
    primary_color: settings.primaryColor,
    minimum_purchase: settings.minimumPurchase,
    pickup_address: settings.pickupAddress || '',
    menu_items: settings.menuItems || [],
    announcement_bar: settings.announcementBar,
  };
}

export async function getSettings(): Promise<AppSettings> {
  // Prioridad 1: Supabase (si está configurado)
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (error) {
        console.error('Error fetching settings from Supabase:', error);
        // Si no existe el registro, crearlo con valores por defecto
        if (error.code === 'PGRST116') {
          try {
            const { data: newData, error: insertError } = await supabase
              .from('app_settings')
              .insert({
                id: 'default',
                ...toSupabaseRow(defaultSettings),
              })
              .select()
              .single();
            
            if (!insertError && newData) {
              return fromSupabaseRow(newData);
            }
          } catch (insertErr) {
            console.error('Error creating default settings:', insertErr);
          }
        }
        // Fallback a sistema de archivos o valores por defecto
      } else if (data) {
        return fromSupabaseRow(data);
      }
    } catch (error) {
      console.error('Error connecting to Supabase:', error);
      // Fallback a sistema de archivos
    }
  }

  // Fallback 2: Sistema de archivos (solo en desarrollo local)
  try {
    if (fs.existsSync(settingsFilePath)) {
      const fileContents = fs.readFileSync(settingsFilePath, 'utf8');
      return JSON.parse(fileContents);
    }
  } catch (error) {
    console.error('Error reading settings file:', error);
  }

  // Fallback 3: Valores por defecto
  return defaultSettings;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  // Prioridad 1: Supabase (si está configurado)
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: 'default',
          ...toSupabaseRow(settings),
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error saving settings to Supabase:', error);
        throw error;
      }
      return; // Éxito, salir
    } catch (error) {
      console.error('Supabase operation failed, falling back to local storage:', error);
      // Fallback a sistema de archivos solo si Supabase falla
    }
  }

  // Fallback 2: Sistema de archivos (solo en desarrollo local)
  try {
    const dir = path.dirname(settingsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error writing settings file:', error);
    throw new Error('No se pudo guardar la configuración. El sistema de archivos es de solo lectura en producción.');
  }
}

