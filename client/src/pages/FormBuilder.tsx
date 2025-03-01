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
import { Form, Component } from '@/types/form';
import { cn } from '@/lib/utils';

export default function FormBuilder() {
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize with a default form
  useEffect(() => {
    const defaultForm: Form = {
      id: 'default-form',
      title: 'نموذج جديد',
      description: 'وصف النموذج',
      settings: {
        theme: 'default',
        layout: 'single-column',
        showProgress: true,
        allowSave: true,
        requireAuth: false
      },
      status: 'draft',
      createdBy: 'admin-001',
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null
    };
    setSelectedForm(defaultForm);
  }, []);

  const handleComponentAdd = (component: Component) => {
    const newComponent = {
      ...component,
      id: `component-${Date.now()}`,
      orderIndex: components.length
    };
    setComponents(prev => [...prev, newComponent]);
    setIsDirty(true);
  };

  const handleComponentUpdate = (id: string, updates: Partial<Component>) => {
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

  const handleComponentSelect = (component: Component | null) => {
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
          <PropertyPanel
            selectedComponent={selectedComponent}
            onConfigChange={(config) => selectedComponent && handleComponentUpdate(selectedComponent.id, { config })}
            onValidationChange={(validation) => selectedComponent && handleComponentUpdate(selectedComponent.id, { validation })}
            onConditionalLogicChange={(logic) => selectedComponent && handleComponentUpdate(selectedComponent.id, { conditionalLogic: logic })}
            onComponentDelete={handleComponentDelete}
            onComponentToggleVisibility={(id) => handleComponentUpdate(id, { isVisible: !components.find(c => c.id === id)?.isVisible })}
          />
        </div>
      </div>
    </div>
  );
}
