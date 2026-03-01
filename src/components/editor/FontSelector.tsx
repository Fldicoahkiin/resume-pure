'use client';

import { useState } from 'react';
import { ChevronDown, Check, Type } from 'lucide-react';
import { getFontOptions, FontConfig } from '@/lib/fonts';
import { useTranslation } from 'react-i18next';

interface FontSelectorProps {
    value: string;
    onChange: (fontFamily: string) => void;
}

export function FontSelector({ value, onChange }: FontSelectorProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { enSansSerif, enSerif, zhFonts, all } = getFontOptions();

    const selectedFont = all.find(f => f.family === value) || all[0];

    const filterFonts = (fonts: FontConfig[]) =>
        fonts.filter(f => f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || f.family.toLowerCase().includes(searchQuery.toLowerCase()));

    const filteredZh = filterFonts(zhFonts);
    const filteredSans = filterFonts(enSansSerif);
    const filteredSerif = filterFonts(enSerif);

    return (
        <div className="relative w-full">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Type size={16} className="text-gray-400 shrink-0" />
                    <span
                        className="truncate text-base"
                        style={{ fontFamily: selectedFont.family }}
                    >
                        {selectedFont.displayName}
                    </span>
                </div>
                <ChevronDown size={14} className="text-gray-400 shrink-0 ml-2" />
            </button>

            {isOpen && (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-10"
                        onClick={() => { setIsOpen(false); setSearchQuery(''); }}
                        aria-label="close font selector"
                    />
                    <div className="absolute bottom-full left-0 mb-1 w-full sm:w-[320px] max-h-[400px] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 flex flex-col origin-bottom">

                        <div className="p-2 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-10">
                            <input
                                type="text"
                                placeholder={t('editor.theme.searchFont', { defaultValue: '搜索字体...' })}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="p-2 space-y-4">
                            {filteredZh.length > 0 && (
                                <div>
                                    <div className="px-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center">
                                        中文字体 / Chinese
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        {filteredZh.map(font => (
                                            <FontOption
                                                key={font.family}
                                                font={font}
                                                isSelected={value === font.family}
                                                onSelect={() => { onChange(font.family); setIsOpen(false); setSearchQuery(''); }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredSans.length > 0 && (
                                <div>
                                    <div className="px-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center">
                                        英文字体 / Sans-Serif
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        {filteredSans.map(font => (
                                            <FontOption
                                                key={font.family}
                                                font={font}
                                                isSelected={value === font.family}
                                                onSelect={() => { onChange(font.family); setIsOpen(false); setSearchQuery(''); }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredSerif.length > 0 && (
                                <div>
                                    <div className="px-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center">
                                        英文字体 / Serif
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        {filteredSerif.map(font => (
                                            <FontOption
                                                key={font.family}
                                                font={font}
                                                isSelected={value === font.family}
                                                onSelect={() => { onChange(font.family); setIsOpen(false); setSearchQuery(''); }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredZh.length === 0 && filteredSans.length === 0 && filteredSerif.length === 0 && (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    没有找到相关字体
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function FontOption({ font, isSelected, onSelect }: { font: FontConfig, isSelected: boolean, onSelect: () => void }) {
    const isZh = font.language === 'zh';
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`relative w-full text-left px-2 py-2 rounded-md flex items-center justify-between group transition-all duration-200 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-[inset_2px_0_0_0_#3b82f6]' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
        >
            <div className="flex items-center overflow-hidden min-w-0">
                <div
                    className="flex items-center justify-center w-8 h-8 rounded bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 mr-3 text-lg shrink-0 group-hover:bg-white dark:group-hover:bg-gray-600 transition-colors pt-0.5"
                    style={{ fontFamily: font.family }}
                >
                    {isZh ? '文' : 'Aa'}
                </div>
                <div className="flex flex-col truncate min-w-0">
                    <span
                        className="text-[15px] truncate mb-0.5"
                        style={{ fontFamily: font.family }}
                        title={font.displayName}
                    >
                        {font.displayName}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate" title={font.family}>
                        {font.family}
                    </span>
                </div>
            </div>
            {isSelected && <Check size={16} className="text-blue-500 shrink-0 ml-2" />}
        </button>
    );
}
