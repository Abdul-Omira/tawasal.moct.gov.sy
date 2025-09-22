import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Palette, 
  Upload, 
  Globe, 
  Code, 
  Download, 
  Upload as UploadIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Settings,
  Image,
  Link,
  FileText,
  Zap
} from 'lucide-react';
import { whiteLabelService, WhiteLabelConfig, ThemeTemplate, CustomDomain } from '@/lib/whiteLabelService';

const WhiteLabelDashboard: React.FC = () => {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [templates, setTemplates] = useState<ThemeTemplate[]>([]);
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [customCSS, setCustomCSS] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('theme');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configData, templatesData, domainsData, cssData] = await Promise.all([
        whiteLabelService.getWhiteLabelConfig(),
        whiteLabelService.getThemeTemplates(),
        whiteLabelService.getCustomDomains(),
        whiteLabelService.getCustomCSS(),
      ]);
      
      setConfig(configData);
      setTemplates(templatesData);
      setDomains(domainsData);
      setCustomCSS(cssData);
    } catch (error) {
      console.error('Error loading white-label data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = async (updates: Partial<WhiteLabelConfig>) => {
    if (!config) return;
    
    setSaving(true);
    try {
      const updatedConfig = await whiteLabelService.updateWhiteLabelConfig({
        ...config,
        ...updates,
      });
      
      if (updatedConfig) {
        setConfig(updatedConfig);
        if (previewMode) {
          whiteLabelService.applyTheme(updatedConfig);
        }
      }
    } catch (error) {
      console.error('Error updating config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeTemplateApply = async (templateId: string) => {
    setSaving(true);
    try {
      const updatedConfig = await whiteLabelService.applyThemeTemplate(templateId);
      if (updatedConfig) {
        setConfig(updatedConfig);
        if (previewMode) {
          whiteLabelService.applyTheme(updatedConfig);
        }
      }
    } catch (error) {
      console.error('Error applying theme template:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setSaving(true);
    try {
      const result = await whiteLabelService.uploadLogo(file);
      if (result) {
        handleConfigUpdate({
          logo: result,
        });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFaviconUpload = async (file: File) => {
    setSaving(true);
    try {
      const result = await whiteLabelService.uploadFavicon(file);
      if (result) {
        handleConfigUpdate({
          favicon: result,
        });
      }
    } catch (error) {
      console.error('Error uploading favicon:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCustomCSSUpdate = async (css: string) => {
    setCustomCSS(css);
    try {
      await whiteLabelService.updateCustomCSS(css);
    } catch (error) {
      console.error('Error updating custom CSS:', error);
    }
  };

  const handleDomainAdd = async (domain: string) => {
    try {
      const newDomain = await whiteLabelService.addCustomDomain(domain);
      if (newDomain) {
        setDomains([...domains, newDomain]);
      }
    } catch (error) {
      console.error('Error adding domain:', error);
    }
  };

  const handleDomainVerify = async (domainId: string) => {
    try {
      const result = await whiteLabelService.verifyCustomDomain(domainId);
      if (result) {
        loadData(); // Reload to get updated status
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
    }
  };

  const handlePreviewToggle = () => {
    setPreviewMode(!previewMode);
    if (!previewMode && config) {
      whiteLabelService.applyTheme(config);
    } else {
      // Remove custom styles
      const customStyle = document.getElementById('white-label-custom');
      if (customStyle) customStyle.remove();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading white-label configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">White-Label Configuration</h1>
          <p className="text-muted-foreground">
            Customize the appearance and branding of your form platform
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={previewMode ? "default" : "outline"}
            onClick={handlePreviewToggle}
            className="flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Exit Preview' : 'Preview'}
          </Button>
          <Button
            onClick={loadData}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="theme" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center space-x-2">
            <Image className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="domains" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            Domains
          </TabsTrigger>
          <TabsTrigger value="css" className="flex items-center space-x-2">
            <Code className="h-4 w-4" />
            Custom CSS
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="theme" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Configuration</CardTitle>
                <CardDescription>
                  Customize colors, typography, and spacing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {config?.theme && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={config.theme.primaryColor}
                            onChange={(e) => handleConfigUpdate({
                              theme: { ...config.theme, primaryColor: e.target.value }
                            })}
                            className="w-16 h-10"
                          />
                          <Input
                            value={config.theme.primaryColor}
                            onChange={(e) => handleConfigUpdate({
                              theme: { ...config.theme, primaryColor: e.target.value }
                            })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={config.theme.secondaryColor}
                            onChange={(e) => handleConfigUpdate({
                              theme: { ...config.theme, secondaryColor: e.target.value }
                            })}
                            className="w-16 h-10"
                          />
                          <Input
                            value={config.theme.secondaryColor}
                            onChange={(e) => handleConfigUpdate({
                              theme: { ...config.theme, secondaryColor: e.target.value }
                            })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="fontFamily">Font Family</Label>
                      <Input
                        id="fontFamily"
                        value={config.theme.fontFamily}
                        onChange={(e) => handleConfigUpdate({
                          theme: { ...config.theme, fontFamily: e.target.value }
                        })}
                        placeholder="Inter, sans-serif"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Theme Templates</CardTitle>
                <CardDescription>
                  Choose from pre-built theme templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: template.config.primaryColor || '#3b82f6' }}
                        />
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleThemeTemplateApply(template.id)}
                        disabled={saving}
                      >
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Logo Configuration</CardTitle>
                <CardDescription>
                  Upload and configure your organization logo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {config?.logo && (
                  <div className="flex items-center space-x-4">
                    <img
                      src={config.logo.url}
                      alt={config.logo.alt}
                      className="w-16 h-16 object-contain border rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{config.logo.alt}</p>
                      <p className="text-sm text-muted-foreground">
                        {config.logo.width}x{config.logo.height}px
                      </p>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="logo-upload">Upload Logo</Label>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                    }}
                    disabled={saving}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Favicon Configuration</CardTitle>
                <CardDescription>
                  Upload a favicon for browser tabs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {config?.favicon && (
                  <div className="flex items-center space-x-4">
                    <img
                      src={config.favicon.url}
                      alt="Favicon"
                      className="w-8 h-8 object-contain border rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Favicon</p>
                      <p className="text-sm text-muted-foreground">
                        Type: {config.favicon.type}
                      </p>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="favicon-upload">Upload Favicon</Label>
                  <Input
                    id="favicon-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFaviconUpload(file);
                    }}
                    disabled={saving}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="domains" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Domains</CardTitle>
              <CardDescription>
                Configure custom domains for your white-labeled platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter domain (e.g., forms.yourorg.gov.sy)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      if (input.value) {
                        handleDomainAdd(input.value);
                        input.value = '';
                      }
                    }
                  }}
                />
                <Button onClick={() => {
                  const input = document.querySelector('input[placeholder*="Enter domain"]') as HTMLInputElement;
                  if (input?.value) {
                    handleDomainAdd(input.value);
                    input.value = '';
                  }
                }}>
                  Add Domain
                </Button>
              </div>

              <div className="space-y-2">
                {domains.map((domain) => (
                  <div key={domain.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{domain.domain}</p>
                        <p className="text-sm text-muted-foreground">
                          SSL: {domain.sslEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(domain.status)}>
                        {domain.status}
                      </Badge>
                      {domain.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleDomainVerify(domain.id)}
                        >
                          Verify
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="css" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
              <CardDescription>
                Add custom CSS to further customize the appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="custom-css">CSS Code</Label>
                  <textarea
                    id="custom-css"
                    value={customCSS}
                    onChange={(e) => handleCustomCSSUpdate(e.target.value)}
                    className="w-full h-64 p-3 border rounded-lg font-mono text-sm"
                    placeholder="/* Add your custom CSS here */"
                  />
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const css = document.getElementById('custom-css') as HTMLTextAreaElement;
                      if (css) {
                        whiteLabelService.validateCustomCSS(css.value).then(result => {
                          if (result.valid) {
                            alert('CSS is valid!');
                          } else {
                            alert(`CSS validation failed: ${result.errors.join(', ')}`);
                          }
                        });
                      }
                    }}
                  >
                    Validate CSS
                  </Button>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setCustomCSS('')}>
                      Clear
                    </Button>
                    <Button onClick={() => handleCustomCSSUpdate(customCSS)}>
                      Save CSS
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export/Import</CardTitle>
                <CardDescription>
                  Export or import white-label configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={async () => {
                    const config = await whiteLabelService.exportWhiteLabelConfig();
                    if (config) {
                      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'white-label-config.json';
                      a.click();
                    }
                  }}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Configuration
                </Button>
                
                <div>
                  <Label htmlFor="import-config">Import Configuration</Label>
                  <Input
                    id="import-config"
                    type="file"
                    accept=".json"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const text = await file.text();
                        const config = JSON.parse(text);
                        const success = await whiteLabelService.importWhiteLabelConfig(config);
                        if (success) {
                          loadData();
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview Settings</CardTitle>
                <CardDescription>
                  Configure preview and testing options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Preview Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Apply changes immediately for testing
                    </p>
                  </div>
                  <Button
                    variant={previewMode ? "default" : "outline"}
                    onClick={handlePreviewToggle}
                  >
                    {previewMode ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-save</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically save changes
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    Enabled
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Saving changes...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhiteLabelDashboard;
