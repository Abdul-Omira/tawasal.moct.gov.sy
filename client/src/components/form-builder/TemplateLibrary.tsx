import React, { useState, useEffect } from 'react';
import { SearchIcon, FilterIcon, EyeIcon, DownloadIcon, PlusIcon, StarIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FormTemplate, TemplateCategory } from '@/types/form';
import { templateService, TemplateSearchFilters } from '@/lib/templateService';

interface TemplateLibraryProps {
  onTemplateSelect: (template: FormTemplate) => void;
  onTemplatePreview: (template: FormTemplate) => void;
  onTemplateImport: (templateData: string) => void;
  onTemplateExport: (template: FormTemplate) => void;
  onTemplateCreate: () => void;
  className?: string;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onTemplateSelect,
  onTemplatePreview,
  onTemplateImport,
  onTemplateExport,
  onTemplateCreate,
  className = ''
}) => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [showPublicOnly, setShowPublicOnly] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'popular'>('newest');

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter templates when search or filters change
  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory, showPublicOnly, sortBy]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const filters: TemplateSearchFilters = {
        isPublic: showPublicOnly ? true : undefined,
        searchQuery: searchQuery || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      };
      
      const loadedTemplates = await templateService.getTemplates(filters);
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply public filter
    if (showPublicOnly) {
      filtered = filtered.filter(template => template.isPublic);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popular':
          // This would require usage tracking - for now, sort by creation date
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleCategoryChange = (category: TemplateCategory | 'all') => {
    setSelectedCategory(category);
  };

  const handlePublicToggle = () => {
    setShowPublicOnly(!showPublicOnly);
  };

  const handleSortChange = (sort: 'newest' | 'oldest' | 'name' | 'popular') => {
    setSortBy(sort);
  };

  const handleTemplateUse = async (template: FormTemplate) => {
    try {
      await templateService.trackTemplateUsage(template.id);
      onTemplateSelect(template);
    } catch (error) {
      console.error('Failed to track template usage:', error);
      onTemplateSelect(template);
    }
  };

  const handleTemplateExport = (template: FormTemplate) => {
    onTemplateExport(template);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onTemplateImport(content);
      };
      reader.readAsText(file);
    }
  };

  const getCategoryColor = (category: TemplateCategory): string => {
    const colors = {
      survey: 'bg-blue-100 text-blue-800',
      application: 'bg-green-100 text-green-800',
      feedback: 'bg-yellow-100 text-yellow-800',
      registration: 'bg-purple-100 text-purple-800',
      contact: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: TemplateCategory): string => {
    const icons = {
      survey: '📊',
      application: '📝',
      feedback: '💬',
      registration: '📋',
      contact: '📞'
    };
    return icons[category] || '📄';
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            مكتبة القوالب
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            اختر من مجموعة متنوعة من القوالب الجاهزة
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Button
            onClick={onTemplateCreate}
            className="flex items-center space-x-2 space-x-reverse"
          >
            <PlusIcon className="h-4 w-4" />
            <span>إنشاء قالب جديد</span>
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث في القوالب..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2 space-x-reverse">
                <FilterIcon className="h-4 w-4" />
                <span>التصنيف</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleCategoryChange('all')}>
                جميع التصنيفات
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCategoryChange('survey')}>
                استطلاعات
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCategoryChange('application')}>
                طلبات
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCategoryChange('feedback')}>
                تقييمات
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCategoryChange('registration')}>
                تسجيل
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCategoryChange('contact')}>
                تواصل
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2 space-x-reverse">
                <span>ترتيب</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSortChange('newest')}>
                الأحدث
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('oldest')}>
                الأقدم
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('name')}>
                بالاسم
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('popular')}>
                الأكثر استخداماً
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant={showPublicOnly ? "default" : "outline"}
            onClick={handlePublicToggle}
            className="flex items-center space-x-2 space-x-reverse"
          >
            <StarIcon className="h-4 w-4" />
            <span>عامة فقط</span>
          </Button>
        </div>
      </div>

      {/* Import/Export Actions */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-3 space-x-reverse">
          <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
            <Button variant="outline" size="sm">
              <DownloadIcon className="h-4 w-4" />
              <span>استيراد قالب</span>
            </Button>
          </label>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredTemplates.length} قالب متاح
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            لا توجد قوالب
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery || selectedCategory !== 'all' || !showPublicOnly
              ? 'لم يتم العثور على قوالب تطابق معايير البحث'
              : 'لم يتم إنشاء أي قوالب بعد'
            }
          </p>
          <Button onClick={onTemplateCreate}>
            <PlusIcon className="h-4 w-4 mr-2" />
            إنشاء قالب جديد
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>أنشئ في: {template.createdAt.toLocaleDateString('ar-SA')}</span>
                    <span className="flex items-center space-x-1 space-x-reverse">
                      <StarIcon className="h-4 w-4" />
                      <span>{template.isPublic ? 'عام' : 'خاص'}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Button
                      onClick={() => handleTemplateUse(template)}
                      className="flex-1"
                    >
                      استخدام
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTemplatePreview(template)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTemplateExport(template)}
                    >
                      <DownloadIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
