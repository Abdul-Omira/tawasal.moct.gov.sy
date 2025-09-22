import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, Save, Play, Download, Share2, Settings, Eye, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { reportService, ReportConfig, ReportColumn, ReportFilters, ReportAggregation, ReportTemplate } from '@/lib/reportService';

interface ReportBuilderProps {
  onClose: () => void;
  onSave: (report: ReportConfig) => void;
  initialReport?: ReportConfig;
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({
  onClose,
  onSave,
  initialReport
}) => {
  const [report, setReport] = useState<Partial<ReportConfig>>({
    name: '',
    description: '',
    type: 'summary',
    filters: {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date()
      }
    },
    columns: [],
    isPublic: false,
    ...initialReport
  });

  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [availableForms, setAvailableForms] = useState<any[]>([]);
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  useEffect(() => {
    loadTemplates();
    loadForms();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await reportService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadForms = async () => {
    try {
      const response = await fetch('/api/forms');
      const data = await response.json();
      setAvailableForms(data);
    } catch (error) {
      console.error('Failed to load forms:', error);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setReport({
          ...report,
          ...template.config,
          name: `${template.name} - Copy`,
          description: template.description
        });
      }
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };

  const handleAddColumn = () => {
    const newColumn: ReportColumn = {
      id: `column_${Date.now()}`,
      name: '',
      type: 'text',
      source: 'form_field',
      fieldPath: ''
    };
    setReport({
      ...report,
      columns: [...(report.columns || []), newColumn]
    });
  };

  const handleUpdateColumn = (columnId: string, updates: Partial<ReportColumn>) => {
    setReport({
      ...report,
      columns: report.columns?.map(col => 
        col.id === columnId ? { ...col, ...updates } : col
      )
    });
  };

  const handleRemoveColumn = (columnId: string) => {
    setReport({
      ...report,
      columns: report.columns?.filter(col => col.id !== columnId)
    });
  };

  const handleAddAggregation = () => {
    const newAggregation: ReportAggregation = {
      field: '',
      function: 'count',
      label: ''
    };
    setReport({
      ...report,
      aggregations: [...(report.aggregations || []), newAggregation]
    });
  };

  const handleUpdateAggregation = (index: number, updates: Partial<ReportAggregation>) => {
    setReport({
      ...report,
      aggregations: report.aggregations?.map((agg, i) => 
        i === index ? { ...agg, ...updates } : agg
      )
    });
  };

  const handleRemoveAggregation = (index: number) => {
    setReport({
      ...report,
      aggregations: report.aggregations?.filter((_, i) => i !== index)
    });
  };

  const handleGeneratePreview = async () => {
    if (!report.name || !report.columns?.length) return;

    setIsGenerating(true);
    try {
      const reportConfig = report as ReportConfig;
      const data = await reportService.generateReport(reportConfig.id || 'preview', report.filters);
      setPreviewData(data.data.slice(0, 10)); // Show first 10 rows
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!report.name || !report.columns?.length) return;

    try {
      const savedReport = await reportService.createReport(report as Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'>);
      onSave(savedReport);
    } catch (error) {
      console.error('Failed to save report:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Report Builder</h2>
            <p className="text-gray-600">Create and configure custom reports</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!report.name || !report.columns?.length}>
              <Save className="w-4 h-4 mr-2" />
              Save Report
            </Button>
          </div>
        </div>

        <div className="flex h-full">
          <div className="w-1/3 border-r p-6 overflow-y-auto">
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Report Name</Label>
                  <Input
                    id="name"
                    value={report.name || ''}
                    onChange={(e) => setReport({ ...report, name: e.target.value })}
                    placeholder="Enter report name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={report.description || ''}
                    onChange={(e) => setReport({ ...report, description: e.target.value })}
                    placeholder="Enter report description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Report Type</Label>
                  <Select
                    value={report.type}
                    onValueChange={(value: 'summary' | 'detailed' | 'custom') => 
                      setReport({ ...report, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {report.filters?.dateRange?.start ? 
                            format(report.filters.dateRange.start, 'MMM dd, yyyy') : 
                            'Start Date'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={report.filters?.dateRange?.start}
                          onSelect={(date: Date | undefined) => setReport({
                            ...report,
                            filters: {
                              ...report.filters!,
                              dateRange: {
                                ...report.filters!.dateRange!,
                                start: date || new Date()
                              }
                            }
                          })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {report.filters?.dateRange?.end ? 
                            format(report.filters.dateRange.end, 'MMM dd, yyyy') : 
                            'End Date'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={report.filters?.dateRange?.end}
                          onSelect={(date: Date | undefined) => setReport({
                            ...report,
                            filters: {
                              ...report.filters!,
                              dateRange: {
                                ...report.filters!.dateRange!,
                                end: date || new Date()
                              }
                            }
                          })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Forms to Include</Label>
                  <Select
                    onValueChange={(formId) => setReport({
                      ...report,
                      filters: {
                        ...report.filters!,
                        formIds: [...(report.filters?.formIds || []), formId]
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select forms" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableForms.map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {report.filters?.formIds && (
                    <div className="flex flex-wrap gap-1">
                      {report.filters.formIds.map((formId) => {
                        const form = availableForms.find(f => f.id === formId);
                        return (
                          <Badge key={formId} variant="secondary" className="text-xs">
                            {form?.title || formId}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={report.isPublic || false}
                    onCheckedChange={(checked) => setReport({ ...report, isPublic: !!checked })}
                  />
                  <Label htmlFor="isPublic">Make report public</Label>
                </div>
              </TabsContent>

              <TabsContent value="data" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Columns</h3>
                    <Button onClick={handleAddColumn} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Column
                    </Button>
                  </div>

                  {report.columns?.map((column, index) => (
                    <Card key={column.id} className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Column Name</Label>
                          <Input
                            value={column.name}
                            onChange={(e) => handleUpdateColumn(column.id, { name: e.target.value })}
                            placeholder="Enter column name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={column.type}
                            onValueChange={(value: any) => handleUpdateColumn(column.id, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="boolean">Boolean</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Source</Label>
                          <Select
                            value={column.source}
                            onValueChange={(value: any) => handleUpdateColumn(column.id, { source: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="form_field">Form Field</SelectItem>
                              <SelectItem value="submission_meta">Submission Meta</SelectItem>
                              <SelectItem value="calculated">Calculated</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Field Path</Label>
                          <Input
                            value={column.fieldPath || ''}
                            onChange={(e) => handleUpdateColumn(column.id, { fieldPath: e.target.value })}
                            placeholder="e.g., user.name, submission.createdAt"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveColumn(column.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Aggregations</h3>
                    <Button onClick={handleAddAggregation} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Aggregation
                    </Button>
                  </div>

                  {report.aggregations?.map((aggregation, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Field</Label>
                          <Input
                            value={aggregation.field}
                            onChange={(e) => handleUpdateAggregation(index, { field: e.target.value })}
                            placeholder="Field name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Function</Label>
                          <Select
                            value={aggregation.function}
                            onValueChange={(value: any) => handleUpdateAggregation(index, { function: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="count">Count</SelectItem>
                              <SelectItem value="sum">Sum</SelectItem>
                              <SelectItem value="avg">Average</SelectItem>
                              <SelectItem value="min">Minimum</SelectItem>
                              <SelectItem value="max">Maximum</SelectItem>
                              <SelectItem value="distinct">Distinct</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Label</Label>
                          <Input
                            value={aggregation.label}
                            onChange={(e) => handleUpdateAggregation(index, { label: e.target.value })}
                            placeholder="Display label"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAggregation(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="scheduleEnabled"
                      checked={report.schedule?.enabled || false}
                      onCheckedChange={(checked) => setReport({
                        ...report,
                        schedule: {
                          ...report.schedule!,
                          enabled: !!checked
                        }
                      })}
                    />
                    <Label htmlFor="scheduleEnabled">Enable scheduled reports</Label>
                  </div>

                  {report.schedule?.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select
                          value={report.schedule?.frequency}
                          onValueChange={(value: any) => setReport({
                            ...report,
                            schedule: {
                              ...report.schedule!,
                              frequency: value
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={report.schedule?.time || '09:00'}
                          onChange={(e) => setReport({
                            ...report,
                            schedule: {
                              ...report.schedule!,
                              time: e.target.value
                            }
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Format</Label>
                        <Select
                          value={report.schedule?.format}
                          onValueChange={(value: any) => setReport({
                            ...report,
                            schedule: {
                              ...report.schedule!,
                              format: value
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview</h3>
                <Button onClick={handleGeneratePreview} disabled={isGenerating}>
                  <Play className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Preview'}
                </Button>
              </div>

              {previewData.length > 0 ? (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {report.columns?.map((column) => (
                          <TableHead key={column.id}>{column.name}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          {report.columns?.map((column) => (
                            <TableCell key={column.id}>
                              {row[column.fieldPath || column.name] || '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-gray-500">Configure columns and generate preview to see data</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;
