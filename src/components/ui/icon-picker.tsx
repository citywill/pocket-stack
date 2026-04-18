import { useState, useMemo, useRef, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import * as HeroIcons from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

const iconCategories = {
  navigation: [
    'HomeIcon',
    'UserIcon',
    'UsersIcon',
    'Cog6ToothIcon',
    'Bars3Icon',
    'Bars2Icon',
    'EllipsisHorizontalIcon',
    'EllipsisVerticalIcon',
    'ArrowsUpDownIcon',
    'ArrowLeftIcon',
    'ArrowRightIcon',
    'ArrowUpIcon',
    'ArrowDownIcon',
    'ChevronUpIcon',
    'ChevronDownIcon',
    'ChevronLeftIcon',
    'ChevronRightIcon',
    'PlusIcon',
    'MinusIcon',
    'XMarkIcon',
  ],
  actions: [
    'PencilSquareIcon',
    'TrashIcon',
    'DuplicateIcon',
    'ClipboardDocumentIcon',
    'ClipboardDocumentCheckIcon',
    'CloudArrowUpIcon',
    'CloudArrowDownIcon',
    'DownloadIcon',
    'UploadIcon',
    'ShareIcon',
    'PrinterIcon',
    'EyeIcon',
    'EyeSlashIcon',
    'LockClosedIcon',
    'LockOpenIcon',
    'KeyIcon',
    'ShieldCheckIcon',
    'ExclamationTriangleIcon',
    'CheckCircleIcon',
    'XCircleIcon',
    'InformationCircleIcon',
  ],
  communication: [
    'ChatBubbleLeftIcon',
    'ChatBubbleLeftRightIcon',
    'EnvelopeIcon',
    'EnvelopeOpenIcon',
    'PaperAirplaneIcon',
    'PhoneIcon',
    'VideoCameraIcon',
    'BellIcon',
    'SpeakerWaveIcon',
    'MicrophoneIcon',
  ],
  data: [
    'ChartBarIcon',
    'ChartPieIcon',
    'ChartLineUpIcon',
    'TableCellsIcon',
    'ArrowsRightLeftIcon',
    'CpuChipIcon',
    'CircleStackIcon',
    'ServerStackIcon',
    'DatabaseIcon',
    'WrenchScrewdriverIcon',
  ],
  files: [
    'DocumentIcon',
    'DocumentTextIcon',
    'DocumentArrowDownIcon',
    'DocumentArrowUpIcon',
    'DocumentDuplicateIcon',
    'FolderIcon',
    'FolderOpenIcon',
    'FolderPlusIcon',
    'FolderMinusIcon',
    'PaperClipIcon',
  ],
  general: [
    'StarIcon',
    'HeartIcon',
    'FlagIcon',
    'TagIcon',
    'BookmarksIcon',
    'ClockIcon',
    'CalendarIcon',
    'CalendarDaysIcon',
    'MapPinIcon',
    'GlobeAltIcon',
    'LanguageIcon',
    'SparklesIcon',
    'SunIcon',
    'MoonIcon',
    'BoltIcon',
    'FireIcon',
    'AdjustmentsHorizontalIcon',
    'AdjustmentsVerticalIcon',
    'FunnelIcon',
  ],
};

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof iconCategories>('navigation');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const filteredIcons = useMemo(() => {
    const allIconNames = Object.values(iconCategories).flat();
    if (!search) return null;
    return allIconNames.filter((name) =>
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const renderIcon = (iconName: string) => {
    const IconComponent = (HeroIcons as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    if (!IconComponent) return null;
    return <IconComponent className="w-4 h-4" />;
  };

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setOpen(false);
    setSearch('');
  };

  const displayIcons = filteredIcons || iconCategories[selectedCategory] || [];

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        {value ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl">
            {renderIcon(value)}
            <span className="text-sm font-medium">{value}</span>
            <button
              onClick={() => onChange('')}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            'px-3 py-2 text-sm border rounded-xl transition-colors',
            open ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'
          )}
        >
          选择图标
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-2 left-0 bg-white rounded-xl border shadow-lg p-3 w-80">
          <div className="relative mb-2">
            <MagnifyingGlassIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索图标..."
              className="rounded-lg text-sm h-8"
            />
          </div>

          {search ? (
            <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
              {(filteredIcons || []).map((iconName) => {
                const IconComponent = (HeroIcons as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
                if (!IconComponent) return null;
                return (
                  <button
                    key={iconName}
                    onClick={() => handleSelect(iconName)}
                    className={cn(
                      'p-1.5 rounded-lg hover:bg-gray-100 transition-colors',
                      value === iconName && 'bg-primary/10 text-primary'
                    )}
                    title={iconName}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="flex gap-1 flex-wrap mb-2">
                {(Object.keys(iconCategories) as (keyof typeof iconCategories)[]).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-full transition-colors',
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 hover:bg-gray-200'
                    )}
                  >
                    {category === 'navigation' && '导航'}
                    {category === 'actions' && '操作'}
                    {category === 'communication' && '通信'}
                    {category === 'data' && '数据'}
                    {category === 'files' && '文件'}
                    {category === 'general' && '通用'}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                {displayIcons.map((iconName) => {
                  const IconComponent = (HeroIcons as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
                  if (!IconComponent) return null;
                  return (
                    <button
                      key={iconName}
                      onClick={() => handleSelect(iconName)}
                      className={cn(
                        'p-1.5 rounded-lg hover:bg-gray-100 transition-colors',
                        value === iconName && 'bg-primary/10 text-primary'
                      )}
                      title={iconName}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
