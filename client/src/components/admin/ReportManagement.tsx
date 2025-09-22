import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Play, 
  Download, 
  Share2, 
  Edit, 
  Trash2, 
  Calendar,
  BarChart3,
  FileText,
  Users,
  Clock,
  Eye
} from 'lucide-react';
import { reportService, ReportConfig, ReportTemplate } from '@/lib/reportService';
import ReportBuilder from './ReportBuilder';

export const ReportManagement: React.FC = () => {
  const [reports, setReports] = useState<ReportConfig[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('reports');
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportConfig | undefined>();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, templatesData, analyticsData] = await Promise.all([
        reportService.getReports(),
        reportService.getTemplates(),
        reportService.getReportAnalytics()
      ]);
      setReports(reportsData);
      setTemplates(templatesData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = () => {
    setEditingReport(undefined);
    setShowReportBuilder(true);
  };

  const handleEditReport = (report: ReportConfig) => {
    setEditingReport(report);
    setShowReportBuilder(true);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await reportService.deleteReport(reportId);
        await loadData();
      } catch (error) {
        console.error('Failed to delete report:', error);
      }
    }
  };

  const handleGenerateReport = async (reportId: string) => {
    try {
      await reportService.generateReport(reportId);
      // Show success message or update UI
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const handleDownloadReport = async (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    try {
      const blob = await reportService.downloadReport(reportId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const handleShareReport = async (reportId: string) => {
    try {
      const result = await reportService.shareReport(reportId, {
        isPublic: true,
        allowedUsers: [],
        allowedRoles: []
      });
      // Show share URL or copy to clipboard
      navigator.clipboard.writeText(result.shareUrl);
    } catch (error) {
      console.error('Failed to share report:', error);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      const report = await reportService.useTemplate(templateId);
      setEditingReport(report);
      setShowReportBuilder(true);
    } catch (error) {
      console.error('Failed to use template:', error);
    }
  };

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'summary':
        return <BarChart3 className="w-4 h-4" />;
      case 'detailed':
        return <FileText className="w-4 h-4" />;
      case 'custom':
        return <Edit className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'summary':
        return 'bg-blue-100 text-blue-800';
      case 'detailed':
        return 'bg-green-100 text-green-800';
      case 'custom':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Report Management</h1>
          <p className="text-gray-600">Create, manage, and schedule custom reports</p>
        </div>
        <Button onClick={handleCreateReport}>
          <Plus className="w-4 h-4 mr-2" />
          Create Report
        </Button>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalReports}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.scheduledReports}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shared</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.sharedReports}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>
                      <Badge className={getReportTypeColor(report.type)}>
                        <span className="flex items-center gap-1">
                          {getReportTypeIcon(report.type)}
                          {report.type}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{report.description}</TableCell>
                    <TableCell>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.isPublic ? 'default' : 'secondary'}>
                        {report.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditReport(report)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateReport(report.id)}>
                            <Play className="mr-2 h-4 w-4" />
                            Generate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadReport(report.id, 'pdf')}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadReport(report.id, 'excel')}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Excel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareReport(report.id)}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteReport(report.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="secondary">{template.category}</Badge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Used {template.usageCount} times
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleUseTemplate(template.id)}
                    >
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Reports that are automatically generated on a schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No scheduled reports found
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shared Reports</CardTitle>
              <CardDescription>Reports that have been shared with others</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No shared reports found
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showReportBuilder && (
        <ReportBuilder
          onClose={() => setShowReportBuilder(false)}
          onSave={(report) => {
            setShowReportBuilder(false);
            loadData();
          }}
          initialReport={editingReport}
        />
      )}
    </div>
  );
};

export default ReportManagement;
