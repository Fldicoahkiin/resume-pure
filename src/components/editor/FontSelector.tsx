'use client';

import { type CSSProperties, useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Type } from 'lucide-react';
import { getFontOptions, FontConfig } from '@/lib/fonts';
import { useTranslation } from 'react-i18next';

const MENU_GAP = 4;
const MENU_MARGIN = 8;
const MENU_MAX_HEIGHT = 400;
const MENU_DESKTOP_WIDTH = 320;

interface FontSelectorProps {
    value: string;
    onChange: (fontFamily: string) => void;
}

export function FontSelector({ value, onChange }: FontSelectorProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuId = useId();

    const closeMenu = useCallback(() => {
        setIsOpen(false);
        setSearchQuery('');
        setMenuStyle(null);
    }, []);

    const updateMenuPosition = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const triggerBox = trigger.getBoundingClientRect();
        const editorBox = trigger.closest('[data-editor-viewport]')?.getBoundingClientRect();
        const boundaryTop = Math.max(MENU_MARGIN, editorBox?.top ?? MENU_MARGIN);
        const boundaryBottom = Math.min(window.innerHeight - MENU_MARGIN, editorBox?.bottom ?? window.innerHeight - MENU_MARGIN);
        const boundaryLeft = Math.max(MENU_MARGIN, editorBox?.left ?? MENU_MARGIN);
        const boundaryRight = Math.min(window.innerWidth - MENU_MARGIN, editorBox?.right ?? window.innerWidth - MENU_MARGIN);
        const availableWidth = boundaryRight - boundaryLeft;
        const width = Math.min(
            window.innerWidth >= 640 ? MENU_DESKTOP_WIDTH : triggerBox.width,
            availableWidth,
        );
        const left = Math.min(Math.max(triggerBox.left, boundaryLeft), boundaryRight - width);
        const spaceAbove = triggerBox.top - boundaryTop - MENU_GAP;
        const spaceBelow = boundaryBottom - triggerBox.bottom - MENU_GAP;
        const openAbove = spaceAbove >= MENU_MAX_HEIGHT || spaceAbove > spaceBelow;
        const maxHeight = Math.min(MENU_MAX_HEIGHT, Math.max(0, openAbove ? spaceAbove : spaceBelow));

        setMenuStyle({
            position: 'fixed',
            left,
            width,
            maxHeight,
            ...(openAbove
                ? { bottom: window.innerHeight - triggerBox.top + MENU_GAP }
                : { top: triggerBox.bottom + MENU_GAP }),
        });
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        updateMenuPosition();
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            closeMenu();
            triggerRef.current?.focus();
        };
        window.addEventListener('resize', updateMenuPosition);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('resize', updateMenuPosition);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [closeMenu, isOpen, updateMenuPosition]);

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
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls={isOpen ? menuId : undefined}
                aria-haspopup="dialog"
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

            {isOpen && menuStyle && createPortal(
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-[60]"
                        onClick={closeMenu}
                        aria-label={t('editor.font.closeSelector')}
                    />
                    <div
                        id={menuId}
                        role="dialog"
                        aria-label={t('editor.theme.fontFamily')}
                        style={menuStyle}
                        className="z-[70] flex flex-col overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
                    >

                        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                            <input
                                type="text"
                                placeholder={t('editor.theme.searchFont')}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="p-2 space-y-4">
                            {filteredZh.length > 0 && (
                                <div>
                                    <div className="mb-1 flex items-center px-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {t('editor.font.groupZh')}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        {filteredZh.map(font => (
                                            <FontOption
                                                key={font.family}
                                                font={font}
                                                isSelected={value === font.family}
                                                onSelect={() => { onChange(font.family); closeMenu(); }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredSans.length > 0 && (
                                <div>
                                    <div className="mb-1 flex items-center px-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {t('editor.font.groupSans')}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        {filteredSans.map(font => (
                                            <FontOption
                                                key={font.family}
                                                font={font}
                                                isSelected={value === font.family}
                                                onSelect={() => { onChange(font.family); closeMenu(); }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredSerif.length > 0 && (
                                <div>
                                    <div className="mb-1 flex items-center px-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {t('editor.font.groupSerif')}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        {filteredSerif.map(font => (
                                            <FontOption
                                                key={font.family}
                                                font={font}
                                                isSelected={value === font.family}
                                                onSelect={() => { onChange(font.family); closeMenu(); }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredZh.length === 0 && filteredSans.length === 0 && filteredSerif.length === 0 && (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    {t('editor.font.noResults')}
                                </div>
                            )}
                        </div>
                    </div>
                </>,
                document.body,
            )}
        </div>
    );
}

function FontOption({ font, isSelected, onSelect }: { font: FontConfig, isSelected: boolean, onSelect: () => void }) {
    const { t } = useTranslation();
    const isZh = font.language === 'zh';
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`relative w-full text-left px-2 py-2 rounded-md flex items-center justify-between group transition-[background-color,color,box-shadow] duration-150 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-[inset_2px_0_0_0_#3b82f6]' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
        >
            <div className="flex items-center overflow-hidden min-w-0">
                <div
                    className="flex items-center justify-center w-8 h-8 rounded bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 mr-3 text-lg shrink-0 group-hover:bg-white dark:group-hover:bg-gray-600 transition-colors pt-0.5"
                    style={{ fontFamily: font.family }}
                >
                    {isZh ? t('editor.font.zhSample') : 'Aa'}
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
