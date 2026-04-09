import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadConfig() {
  const root = join(__dirname, '..');
  const providersPath = join(root, 'providers.json');
  const settingsPath = join(root, 'settings.json');
  let providers = { providers: [] };
  let settings = {};
  try {
    const text = await fs.readFile(providersPath, 'utf8');
    providers = JSON.parse(text);
  } catch (e) {
    // ignore, will use default
  }
  try {
    const text = await fs.readFile(settingsPath, 'utf8');
    settings = JSON.parse(text);
  } catch (e) {
    // ignore, will use defaults
  }
  return {
    root,
    providersPath,
    providers: providers.providers || [],
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
    l2_enabled: process.env.L2_ENABLED === '1' || false,
    // runtime mode: cloud_only | hybrid | offline_optional | local_only
    mode: process.env.FREEAI_MODE || settings.mode || 'hybrid',
    training: settings.training || null,
  };
}
