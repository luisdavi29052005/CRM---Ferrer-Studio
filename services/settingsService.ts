import { supabase } from '../supabaseClient';

export interface SystemSetting {
    key: string;
    value: string;
}

class SettingsService {
    private cache: { [key: string]: string } = {};
    private lastFetch: number = 0;
    private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    async fetchSettings(forceRefresh = false): Promise<{ [key: string]: string }> {
        if (!forceRefresh && this.lastFetch && (Date.now() - this.lastFetch < this.CACHE_TTL)) {
            return this.cache;
        }

        const { data, error } = await supabase
            .from('system_settings')
            .select('*');

        if (error) {
            console.error('Error fetching system settings:', error);
            return this.cache; // Return stale cache if error
        }

        const newCache: { [key: string]: string } = {};
        data.forEach((setting: SystemSetting) => {
            newCache[setting.key] = setting.value;
        });

        this.cache = newCache;
        this.lastFetch = Date.now();
        return this.cache;
    }

    async getSetting(key: string): Promise<string | null> {
        if (Object.keys(this.cache).length === 0) {
            await this.fetchSettings();
        }
        return this.cache[key] || null;
    }

    async updateSetting(key: string, value: string): Promise<void> {
        const { error } = await supabase
            .from('system_settings')
            .upsert({ key, value });

        if (error) {
            throw error;
        }

        this.cache[key] = value;
    }
}

export const settingsService = new SettingsService();
