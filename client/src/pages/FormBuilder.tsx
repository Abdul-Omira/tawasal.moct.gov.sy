/**
 * Form Builder Page - Protected Admin Feature
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ComponentLibrary } from '@/components/form-builder/ComponentLibrary';
import { FormCanvas } from '@/components/form-builder/FormCanvas';
import { PropertyPanel } from '@/components/form-builder/PropertyPanel';
import { TemplateSelector } from '@/components/form-builder/TemplateSelector';
import { FormExportImport } from '@/components/form-builder/FormExportImport';
import { VersionManager } from '@/components/form-builder/VersionManager';
import { RealTimePreview } from '@/components/form-builder/RealTimePreview';
import PublishingWorkflow from '@/components/form-builder/PublishingWorkflow';
import { Form } from '@/types/form';
import { BaseComponent, ComponentCategory } from '@/types/component';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Upload } from 'lucide-react';

export default function FormBuilder() {
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [components, setComponents] = useState<BaseComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<BaseComponent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>('all');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showVersionManager, setShowVersionManager] = useState(false);
  const [showRealTimePreview, setShowRealTimePreview] = useState(false);
  const [showPublishingWorkflow, setShowPublishingWorkflow] = useState(false);

  // Initialize with a default form
  useEffect(() => {
    const defaultForm: Form = {
      id: 'default-form',
      title: 'نموذج جديد',
      description: 'وصف النموذج',
      settings: {
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#6B7280',
          backgroundColor: '#FFFFFF',
          textColor: '#111827',
          fontFamily: 'Inter'
        },
        behavior: {
          showProgress: true,
          allowSaveProgress: true,
          requireLogin: false,
          allowAnonymous: true
        }
      },
      status: 'draft',
      createdBy: 'admin-001',
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: undefined
    };
    setSelectedForm(defaultForm);
  }, []);

  const handleComponentAdd = (component: BaseComponent) => {
    const newComponent = {
      ...component,
      id: `component-${Date.now()}`,
      orderIndex: components.length
    };
    setComponents(prev => [...prev, newComponent]);
    setIsDirty(true);
  };

  const handleComponentUpdate = (id: string, updates: Partial<BaseComponent>) => {
    setComponents(prev => 
      prev.map(comp => 
        comp.id === id ? { ...comp, ...updates } : comp
      )
    );
    setIsDirty(true);
  };

  const handleComponentDelete = (id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id));
    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
    setIsDirty(true);
  };

  const handleComponentSelect = (component: BaseComponent | null) => {
    setSelectedComponent(component);
  };

  const handleComponentMove = (dragIndex: number, hoverIndex: number) => {
    const draggedComponent = components[dragIndex];
    const newComponents = [...components];
    newComponents.splice(dragIndex, 1);
    newComponents.splice(hoverIndex, 0, draggedComponent);
    
    // Update order indices
    const updatedComponents = newComponents.map((comp, index) => ({
      ...comp,
      orderIndex: index
    }));
    
    setComponents(updatedComponents);
    setIsDirty(true);
  };

  const handleSaveForm = () => {
    // TODO: Implement form saving
    console.log('Saving form:', selectedForm, components);
    setIsDirty(false);
  };

  const handlePreviewForm = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const handlePublishForm = () => {
    // TODO: Implement form publishing
    console.log('Publishing form:', selectedForm, components);
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedForm(template.form);
    setComponents(template.components);
    setIsDirty(true);
  };

  const handleImport = (form: Form, importedComponents: BaseComponent[]) => {
    setSelectedForm(form);
    setComponents(importedComponents);
    setIsDirty(true);
  };

  const handleVersionSelect = (version: any) => {
    setSelectedForm(version.form);
    setComponents(version.components);
    setIsDirty(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <ComponentLibrary
          onComponentDrag={handleComponentAdd}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
                  {selectedForm && (
                    <span className="text-sm text-gray-500">
                      {selectedForm.title || 'Untitled Form'}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowTemplateSelector(true)}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Templates</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowExportImport(true)}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Export/Import</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowVersionManager(true)}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Versions</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPublishingWorkflow(true)}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Publish Workflow</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRealTimePreview(true)}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Live Preview</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePreviewForm}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>{isPreviewMode ? 'Edit' : 'Preview'}</span>
                  </Button>
                  <Button
                    onClick={handlePublishForm}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Publish</span>
                  </Button>
                </div>
              </div>
            </div>
            <FormCanvas
              form={selectedForm}
              components={components}
              selectedComponent={selectedComponent}
              onComponentAdd={handleComponentAdd}
              onComponentUpdate={handleComponentUpdate}
              onComponentDelete={handleComponentDelete}
              onComponentSelect={handleComponentSelect}
              onComponentMove={handleComponentMove}
              onSaveForm={handleSaveForm}
              onPreviewForm={handlePreviewForm}
              onPublishForm={handlePublishForm}
              isPreviewMode={isPreviewMode}
              isDirty={isDirty}
            />
          </div>
          <PropertyPanel
            selectedComponent={selectedComponent}
            components={components}
            onConfigChange={(config) => selectedComponent && handleComponentUpdate(selectedComponent.id, { config })}
            onValidationChange={(validation) => selectedComponent && handleComponentUpdate(selectedComponent.id, { validation })}
            onConditionalLogicChange={(logic) => selectedComponent && handleComponentUpdate(selectedComponent.id, { conditionalLogic: logic })}
            onComponentDelete={handleComponentDelete}
            onComponentToggleVisibility={(id) => handleComponentUpdate(id, { isVisible: !components.find(c => c.id === id)?.isVisible })}
            onComponentStyleUpdate={(id, style) => handleComponentUpdate(id, { style } as Partial<BaseComponent>)}
            form={selectedForm}
            onFormStyleUpdate={(settings) => selectedForm && setSelectedForm({ ...selectedForm, settings })}
          />
        </div>
      </div>
      
      {showTemplateSelector && (
        <TemplateSelector
          onTemplateSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
      
      {showExportImport && selectedForm && (
        <FormExportImport
          form={selectedForm}
          components={components}
          onImport={handleImport}
          onClose={() => setShowExportImport(false)}
        />
      )}
      
      {showVersionManager && selectedForm && (
        <VersionManager
          form={selectedForm}
          components={components}
          onVersionSelect={handleVersionSelect}
          onClose={() => setShowVersionManager(false)}
        />
      )}
      
      {showPublishingWorkflow && selectedForm && (
        <PublishingWorkflow
          formId={selectedForm.id}
          formTitle={selectedForm.title}
          currentStatus="draft"
          onStatusChange={(status) => console.log('Status changed:', status)}
          onPublish={() => console.log('Publishing form')}
          onReject={(reason) => console.log('Rejecting form:', reason)}
          onApprove={(comments) => console.log('Approving form:', comments)}
        />
      )}
      
      <RealTimePreview
        form={selectedForm}
        components={components}
        isOpen={showRealTimePreview}
        onClose={() => setShowRealTimePreview(false)}
      />
    </div>
  );
}
