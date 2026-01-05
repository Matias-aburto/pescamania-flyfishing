import fs from 'fs';
import path from 'path';

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

export function getSettings(): AppSettings {
  try {
    const fileContents = fs.readFileSync(settingsFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    // Si el archivo no existe, retornar configuración por defecto
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  const dir = path.dirname(settingsFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
}

