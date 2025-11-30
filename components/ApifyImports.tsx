// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, RefreshCw, Trash2, Upload, Download, Plus, X, Check, AlertCircle, FileText, Loader } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../supabaseClient';
import { Lead, Source, Stage } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { HighlightText } from './HighlightText';
import { fetchContactProfilePic, checkNumberExists, deleteApifyLeads } from '../services/supabaseService';
import { AlertModal } from './AlertModal';

export type ApifyLead = {
  id: number;
  title: string;
  phone: string | null;
  category: string | null;
  url: string | null;
  city: string | null;
  state: string | null;
  source: string;
  status: 'sent' | 'not sent' | 'error';
  created_at: string;
};

type Props = {
  items: ApifyLead[];
  onImport?: () => void | Promise<void>;
  onOpenChat?: (lead: Lead) => void;
};

export const ApifyImports = ({ items, onImport, onOpenChat }: Props) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [profilePics, setProfilePics] = useState<Record<string, string>>({});
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ isOpen: false, title: '', message: '', type: 'info' });

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'sent' | 'not sent' | 'error',
    city: '',
    state: '',
    category: '',
    dateStart: '',
    dateEnd: ''
  });

  // Fetch profile pictures for items with phone numbers
  useEffect(() => {
    const fetchPics = async () => {
      const pics: { [key: string]: string } = {};
      // Process in batches to avoid overwhelming the server
      const batchSize = 5;
      const itemsWithPhone = items.filter(item => item.phone);

      for (let i = 0; i < itemsWithPhone.length; i += batchSize) {
        const batch = itemsWithPhone.slice(i, i + batchSize);
        await Promise.all(batch.map(async (item) => {
          if (item.phone && !profilePics[item.phone]) {
            const url = await fetchContactProfilePic(item.phone);
            if (url) {
              pics[item.phone] = url;
            }
          }
        }));
        // Update state incrementally
        setProfilePics(prev => ({ ...prev, ...pics }));
      }
    };

    if (items.length > 0) {
      fetchPics();
    }
  }, [items]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    const matchesCity = !filters.city || (item.city && item.city.toLowerCase().includes(filters.city.toLowerCase()));
    const matchesState = !filters.state || (item.state && item.state.toLowerCase().includes(filters.state.toLowerCase()));
    const matchesCategory = !filters.category || (item.category && item.category.toLowerCase().includes(filters.category.toLowerCase()));

    let matchesDate = true;
    if (filters.dateStart) {
      matchesDate = matchesDate && new Date(item.created_at) >= new Date(filters.dateStart);
    }
    if (filters.dateEnd) {
      // Set end date to end of day
      const endDate = new Date(filters.dateEnd);
      endDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(item.created_at) <= endDate;
    }

    return matchesSearch && matchesStatus && matchesCity && matchesState && matchesCategory && matchesDate;
  });

  const activeFiltersCount = Object.values(filters).filter(v => v !== 'all' && v !== '').length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleContact = (item: ApifyLead) => {
    if (onOpenChat) {
      // Convert ApifyLead to Lead structure for chat
      const lead: Lead = {
        id: item.id.toString(),
        chat_id: item.phone || '', // Assuming phone is the chat ID
        name: item.title,
        business: item.title,
        phone: item.phone || '',
        city: item.city || '',
        state: item.state || '',
        category: item.category || '',
        stage: 'New',
        temperature: 'Cold',
        score: 0,
        budget: 0,
        notes: `Imported from Apify. Category: ${item.category || 'N/A'}`,
        source: 'apify',
        last_interaction: 'Never'
      };
      onOpenChat(lead);
    }
  };

  const handleDelete = async () => {
    if (selectedItems.size === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) {
      setDeleting(true);
      try {
        await deleteApifyLeads(Array.from(selectedItems).map(id => id.toString()));
        setSelectedItems(new Set());
        if (onImport) await onImport(); // Refresh list
      } catch (error) {
        console.error('Error deleting items:', error);
        alert('Failed to delete items');
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleImport = async () => {
    if (selectedItems.size === 0) return;

    setImporting(true);
    try {
      const itemsToImport = items.filter(item => selectedItems.has(item.id));
      let importedCount = 0;
      const totalItems = itemsToImport.length;
      const CHUNK_SIZE = 10;

      for (let i = 0; i < totalItems; i += CHUNK_SIZE) {
        const chunk = itemsToImport.slice(i, i + CHUNK_SIZE);

        await Promise.all(chunk.map(async (item) => {
          const { error } = await supabase
            .from('leads')
            .insert([
              {
                name: item.title,
                company_name: item.title,
                phone: item.phone,
                source: 'apify' as Source,
                status: 'New' as Stage,
                value: 0,
                user_id: (await supabase.auth.getUser()).data.user?.id
              }
            ]);

          if (!error) {
            // Update status in apify table
            await supabase
              .from('apify')
              .update({ status: 'sent' })
              .eq('id', item.id);

            importedCount++;
          } else {
            console.error('Error importing lead:', error);
          }
        }));

        // Update progress percentage (if we want to show it, though we don't have a specific progress bar for this action yet, maybe reuse importProgress?)
        setImportProgress(Math.round(((i + chunk.length) / totalItems) * 100));
      }

      // Final refresh
      if (onImport) await onImport();
      setSelectedItems(new Set());
      setAlertModal({ isOpen: true, title: 'Success', message: `Import completed: ${importedCount} leads added.`, type: 'success' });
    } catch (error) {
      console.error('Error importing items:', error);
      setAlertModal({ isOpen: true, title: 'Error', message: 'Error importing items', type: 'error' });
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const handleExportCSV = () => {
    const csvRows = [];
    const headers = ['title', 'street', 'city', 'state', 'country', 'url', 'category', 'phone'];
    csvRows.push(headers.join(','));

    filteredItems.forEach((item) => {
      const row = [
        item.title,
        '', // street
        item.city || '',
        item.state || '',
        '', // country
        item.url || '',
        item.category || '',
        item.phone || '',
      ];

      // Escape values and wrap in quotes if they contain commas
      const escapedRow = row.map(value => {
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(escapedRow.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'apify_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      worker: false, // Disable worker to allow async/await in complete callback easily without complex messaging
      complete: async (results) => {
        const rows = results.data as any[];

        // Map and validate
        const allLeads = rows.map((row: any) => {
          const lead: any = {};
          // Flexible header matching
          const keys = Object.keys(row);

          const findKey = (search: string[]) => keys.find(k => search.includes(k.toLowerCase().trim()));

          lead.title = row[findKey(['title', 'name', 'business', 'company']) || ''] || row.title || 'Unknown';
          lead.phone = row[findKey(['phone', 'phonenumber', 'mobile', 'cell']) || ''] || row.phone;
          lead.category = row[findKey(['category', 'categoryname', 'industry', 'type']) || ''] || row.category;
          lead.url = row[findKey(['url', 'website', 'link']) || ''] || row.url;
          lead.city = row[findKey(['city', 'location']) || ''] || row.city;
          lead.state = row[findKey(['state', 'province']) || ''] || row.state;
          lead.country = row[findKey(['country', 'countrycode']) || ''] || row.country;
          lead.street = row[findKey(['street', 'address']) || ''] || row.street;

          lead.source = 'csv_import';
          lead.status = 'not sent';
          return lead;
        });

        // Filter valid leads (must have phone)
        const leadsWithPhone = allLeads.filter(lead => lead.phone && lead.phone.toString().trim().length > 0);
        const skippedNoPhone = allLeads.length - leadsWithPhone.length;

        if (leadsWithPhone.length === 0) {
          setAlertModal({ isOpen: true, title: 'Import Failed', message: `No valid leads found. (${skippedNoPhone} skipped due to missing phone)`, type: 'error' });
          setImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        // Verify existence sequentially and insert IMMEDIATELY
        let insertedCount = 0;
        let skippedInvalid = 0;
        let errorCount = 0;

        // We process all leads with phone
        for (let i = 0; i < leadsWithPhone.length; i++) {
          const lead = leadsWithPhone[i];

          // Update progress
          setImportProgress(Math.round(((i + 1) / leadsWithPhone.length) * 100));

          // Check existence
          const exists = await checkNumberExists(lead.phone);

          if (exists) {
            // Insert immediately
            const { error } = await supabase.from('apify').insert([lead]);

            if (error) {
              console.error('Error importing lead:', error);
              errorCount++;
            } else {
              insertedCount++;
              // Trigger refresh every item to show real-time progress as requested
              // This might be heavy but it's what the user wants ("já vai ir adicionando na lista")
              if (onImport) await onImport();
            }
          } else {
            console.log(`Skipping invalid WhatsApp number: ${lead.phone}`);
            skippedInvalid++;
          }
        }

        setAlertModal({ isOpen: true, title: 'Import Finished', message: `Success: ${insertedCount}\nInvalid/Skipped: ${skippedInvalid}\nNo Phone: ${skippedNoPhone}\nErrors: ${errorCount}`, type: 'success' });

        // Final refresh just in case
        if (onImport) await onImport();

        setImporting(false);
        setImportProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error) => {
        console.error('CSV Parse Error:', error);
        setAlertModal({ isOpen: true, title: 'Error', message: t('imports.error_parsing_csv'), type: 'error' });
        setImporting(false);
      }
    });
  };

  const handleCleanInvalid = async () => {
    if (!confirm(t('imports.confirm_delete_invalid'))) return;

    try {
      // Delete where phone is null
      const { error: errorNull } = await supabase
        .from('apify')
        .delete()
        .is('phone', null);

      // Delete where phone is empty string (if any)
      const { error: errorEmpty } = await supabase
        .from('apify')
        .delete()
        .eq('phone', '');

      if (errorNull || errorEmpty) {
        console.error('Error cleaning invalid leads:', errorNull || errorEmpty);
        setAlertModal({ isOpen: true, title: 'Error', message: t('imports.error_cleaning_leads'), type: 'error' });
      } else {
        setAlertModal({ isOpen: true, title: 'Success', message: t('imports.invalid_leads_cleaned_success'), type: 'success' });
        if (onImport) await onImport();
      }
    } catch (error) {
      console.error('Error:', error);
      setAlertModal({ isOpen: true, title: 'Error', message: t('imports.an_error_occurred'), type: 'error' });
    }
  };

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden relative">
      <div className="flex items-end justify-between mb-8 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">{t('imports.title')}</h2>
          <p className="text-zinc-500 text-sm mt-2 font-medium">{t('imports.subtitle')}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Minimalist Search */}
          <div className="relative group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" size={16} />
            <input
              type="text"
              placeholder={t('imports.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-b border-zinc-800 text-zinc-200 pl-6 pr-4 py-2 focus:outline-none focus:border-bronze-500 transition-colors text-sm w-64 placeholder:text-zinc-600"
            />
          </div>

          <div className="h-6 w-px bg-white/10 mx-2"></div>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 text-xs font-medium uppercase tracking-wider ${showFilters || activeFiltersCount > 0
                ? 'bg-white/10 text-zinc-100 border-white/10'
                : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200 border-transparent hover:border-white/5'
                }`}
            >
              <Filter size={14} />
              {t('common.filter')}
              {activeFiltersCount > 0 && (
                <span className="ml-1 w-4 h-4 rounded-full bg-bronze-500 text-black text-[9px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)}></div>
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-[#0B0B0B] border border-white/10 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-xl z-50 p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-zinc-200">Filters</h3>
                      <button
                        onClick={() => {
                          setFilters({
                            status: 'all',
                            city: '',
                            state: '',
                            category: '',
                            dateStart: '',
                            dateEnd: ''
                          });
                        }}
                        className="text-[10px] text-bronze-500 hover:text-bronze-400 font-medium uppercase tracking-wide"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Status */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Status</label>
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                          className="w-full bg-zinc-900/50 border border-white/5 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-bronze-500/50 transition-colors appearance-none"
                        >
                          <option value="all">All Statuses</option>
                          <option value="sent">Sent</option>
                          <option value="not sent">Not Sent</option>
                          <option value="error">Error</option>
                        </select>
                      </div>

                      {/* City */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">City</label>
                        <input
                          type="text"
                          value={filters.city}
                          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                          placeholder="e.g. New York"
                          className="w-full bg-zinc-900/50 border border-white/5 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-bronze-500/50 transition-colors placeholder:text-zinc-700"
                        />
                      </div>

                      {/* State */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">State</label>
                        <input
                          type="text"
                          value={filters.state}
                          onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                          placeholder="e.g. NY"
                          className="w-full bg-zinc-900/50 border border-white/5 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-bronze-500/50 transition-colors placeholder:text-zinc-700"
                        />
                      </div>

                      {/* Category */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Category</label>
                        <input
                          type="text"
                          value={filters.category}
                          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                          placeholder="e.g. Real Estate"
                          className="w-full bg-zinc-900/50 border border-white/5 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-bronze-500/50 transition-colors placeholder:text-zinc-700"
                        />
                      </div>

                      {/* Date Range */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Date Added</label>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="date"
                            value={filters.dateStart}
                            onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })}
                            className="w-full bg-zinc-900/50 border border-white/5 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-bronze-500/50 transition-colors"
                          />
                          <input
                            type="date"
                            value={filters.dateEnd}
                            onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })}
                            className="w-full bg-zinc-900/50 border border-white/5 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-bronze-500/50 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {selectedItems.size > 0 && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 hover:bg-red-500/10 text-red-500 hover:text-red-400 rounded-lg border border-transparent hover:border-red-500/20 transition-all flex items-center gap-2 mr-2"
                title="Delete Selected"
              >
                {deleting ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />}
                <span className="text-xs font-bold uppercase tracking-wide">Delete ({selectedItems.size})</span>
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 rounded-lg border border-transparent hover:border-white/5 transition-all"
              title={t('imports.import_csv')}
            >
              <Upload size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />

            <button
              onClick={handleExportCSV}
              className="p-2 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 rounded-lg border border-transparent hover:border-white/5 transition-all"
              title={t('imports.export_csv')}
            >
              <FileDown size={16} />
            </button>

            <button
              onClick={handleCleanInvalid}
              className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg border border-transparent hover:border-red-500/20 transition-all"
              title={t('imports.clean_invalid')}
            >
              <Trash2 size={16} />
            </button>

            <button
              onClick={() => onImport && onImport()}
              className="ml-2 px-4 py-2 bg-zinc-100 hover:bg-white text-black rounded-lg transition-all transform hover:scale-105 text-xs font-bold uppercase tracking-wide shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2"
            >
              <RefreshCw size={14} />
              <span>{t('imports.sync_apify')}</span>
            </button>
          </div>
        </div>
      </div>


      {/* Table Container - No Box, Just Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('imports.all_imports_count', { count: filteredItems.length })}</span>
        </div>

        <div className="overflow-auto custom-scrollbar flex-1 -mx-4 px-4">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm">
              <tr>
                <th className="py-3 px-4 border-b border-white/5 w-10">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                  </div>
                </th>
                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('imports.table.business')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('imports.table.phone')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('imports.table.category')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('imports.table.location')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5">{t('imports.table.status')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border-b border-white/5 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-0 focus:ring-offset-0 cursor-pointer opacity-50 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-500 border border-white/5 group-hover:border-bronze-500/30 group-hover:text-bronze-500 transition-colors overflow-hidden">
                          {profilePics[item.phone || ''] ? (
                            <img src={profilePics[item.phone!]} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            item.title.charAt(0)
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-200 text-sm group-hover:text-white transition-colors">
                            <HighlightText text={item.title} highlight={searchTerm} />
                          </span>
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 truncate max-w-[200px]">
                              {item.url.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-zinc-300 text-sm font-medium font-mono">
                        <HighlightText text={item.phone || '-'} highlight={searchTerm} />
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border uppercase bg-zinc-800 text-zinc-400 border-zinc-700">
                        <HighlightText text={item.category || 'N/A'} highlight={filters.category} />
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-zinc-300 text-sm">
                          <HighlightText text={item.city || '-'} highlight={filters.city} />
                        </span>
                        <span className="text-zinc-500 text-xs">
                          <HighlightText text={item.state || ''} highlight={filters.state} />
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border uppercase ${item.status === 'sent'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : item.status === 'error'
                          ? 'bg-red-500/10 text-red-500 border-red-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}>
                        {item.status === 'sent' ? (
                          <CheckCircle size={12} className="mr-1" />
                        ) : item.status === 'error' ? (
                          <AlertCircle size={12} className="mr-1" />
                        ) : (
                          <Clock size={12} className="mr-1" />
                        )}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleContact(item)}
                        className="p-2 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors"
                        title={t('common.message')}
                      >
                        <MessageSquare size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    {t('common.noItemsFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div >
  );
};
