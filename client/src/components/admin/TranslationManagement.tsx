import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Languages, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  FileText,
  BarChart3,
  Settings
} from 'lucide-react';
import { translationService, TranslationKey, TranslationLanguage, TranslationNamespace } from '@/lib/translationService';

const TranslationManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [languages, setLanguages] = useState<TranslationLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('translation');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const languagesData = translationService.getLanguages();
      const statsData = translationService.getTranslationStats();
      
      setLanguages(languagesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading translation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTranslation = (key: string, value: string) => {
    setEditingKey(key);
    setEditingValue(value);
  };

  const handleSaveTranslation = () => {
    if (editingKey) {
      translationService.setTranslation(selectedLanguage, selectedNamespace, editingKey, editingValue);
      setEditingKey(null);
      setEditingValue('');
      loadData();
    }
  };

  const handleDeleteTranslation = (key: string) => {
    if (confirm('Are you sure you want to delete this translation?')) {
      translationService.deleteTranslation(selectedLanguage, selectedNamespace, key);
      loadData();
    }
  };

  const handleExportTranslations = () => {
    const translations = translationService.exportTranslations();
    const blob = new Blob([JSON.stringify(translations, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translations.json';
    a.click();
  };

  const handleImportTranslations = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const translations = JSON.parse(e.target?.result as string);
          translationService.importTranslations(translations);
          loadData();
        } catch (error) {
          console.error('Error importing translations:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredKeys = () => {
    const language = languages.find(l => l.code === selectedLanguage);
    if (!language) return [];
    
    const namespace = language.namespaces.find(n => n.name === selectedNamespace);
    if (!namespace) return [];
    
    return namespace.keys.filter(key => 
      key.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading translations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Translation Management</h1>
          <p className="text-muted-foreground">
            Manage translations for multiple languages
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadData} variant="outline" className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExportTranslations} className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <div>
            <Input
              type="file"
              accept=".json"
              onChange={handleImportTranslations}
              className="hidden"
              id="import-translations"
            />
            <Button asChild className="flex items-center space-x-2">
              <label htmlFor="import-translations">
                <Upload className="h-4 w-4" />
                Import
              </label>
            </Button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Languages</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLanguages}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Namespaces</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNamespaces}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalKeys}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <Progress value={stats.completionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="translations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="translations">Translations</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="translations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Language</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {languages.map((language) => (
                  <Button
                    key={language.code}
                    variant={selectedLanguage === language.code ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedLanguage(language.code)}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    {language.name}
                    {language.isRTL && <Badge variant="secondary" className="ml-2">RTL</Badge>}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Namespace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {languages
                  .find(l => l.code === selectedLanguage)
                  ?.namespaces.map((namespace) => (
                    <Button
                      key={namespace.name}
                      variant={selectedNamespace === namespace.name ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedNamespace(namespace.name)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {namespace.name}
                      <Badge variant="secondary" className="ml-2">
                        {namespace.keys.length}
                      </Badge>
                    </Button>
                  ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Translations</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search translations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredKeys().map((key) => (
                    <div key={key.key} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{key.key}</div>
                        {editingKey === key.key ? (
                          <div className="flex items-center space-x-2 mt-1">
                            <Input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="flex-1"
                            />
                            <Button size="sm" onClick={handleSaveTranslation}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingKey(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">{key.value}</div>
                        )}
                      </div>
                      {editingKey !== key.key && (
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTranslation(key.key, key.value)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTranslation(key.key)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="languages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Languages</CardTitle>
              <CardDescription>
                Manage supported languages and their properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {languages.map((language) => (
                  <div key={language.code} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{language.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Code: {language.code} • {language.namespaces.length} namespaces
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {language.isRTL && <Badge variant="secondary">RTL</Badge>}
                      <Badge variant="outline">
                        {language.namespaces.reduce((acc, ns) => acc + ns.keys.length, 0)} keys
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Translation Settings</CardTitle>
              <CardDescription>
                Configure translation behavior and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-save translations</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically save translation changes
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Enabled
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">RTL Support</p>
                  <p className="text-sm text-muted-foreground">
                    Enable right-to-left language support
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Enabled
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Translation Validation</p>
                  <p className="text-sm text-muted-foreground">
                    Validate translation keys and values
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Enabled
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TranslationManagement;
