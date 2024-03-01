/**
 * Form Builder Platform - Component Type Definitions
 * TypeScript interfaces for form components and their configurations
 */

import { ComponentType, ComponentConfig, ValidationRules, ConditionalLogic } from './form';

// Base component interface
export interface BaseComponent {
  id: string;
  type: ComponentType;
  config: ComponentConfig;
  validation: ValidationRules;
  conditionalLogic?: ConditionalLogic;
  orderIndex: number;
  isVisible: boolean;
  isRequired: boolean;
}

// Component registry interface
export interface ComponentRegistry {
  [key: string]: ComponentDefinition;
}

// Component definition interface
export interface ComponentDefinition {
  type: ComponentType;
  name: string;
  description: string;
  icon: string;
  category: ComponentCategory;
  defaultConfig: ComponentConfig;
  defaultValidation: ValidationRules;
  render: (props: ComponentRenderProps) => React.ReactElement;
  configPanel: (props: ComponentConfigPanelProps) => React.ReactElement;
  preview: (props: ComponentPreviewProps) => React.ReactElement;
}

// Component categories
export type ComponentCategory = 
  | 'input'
  | 'selection'
  | 'file'
  | 'date'
  | 'rating'
  | 'layout'
  | 'logic';

// Component render props
export interface ComponentRenderProps {
  component: BaseComponent;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Component config panel props
export interface ComponentConfigPanelProps {
  component: BaseComponent;
  onConfigChange: (config: ComponentConfig) => void;
  onValidationChange: (validation: ValidationRules) => void;
  onConditionalLogicChange: (logic: ConditionalLogic) => void;
}

// Component preview props
export interface ComponentPreviewProps {
  component: BaseComponent;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

// Drag and drop types
export interface DragItem {
  type: 'component' | 'template';
  id: string;
  componentType?: ComponentType;
  templateId?: string;
}

export interface DropResult {
  destination?: {
    droppableId: string;
    index: number;
  };
  source: {
    droppableId: string;
    index: number;
  };
  draggableId: string;
}

// Form builder canvas types
export interface FormCanvasProps {
  form: Form;
  components: BaseComponent[];
  selectedComponent: BaseComponent | null;
  onComponentSelect: (component: BaseComponent) => void;
  onComponentAdd: (component: BaseComponent) => void;
  onComponentUpdate: (component: BaseComponent) => void;
  onComponentDelete: (componentId: string) => void;
  onComponentMove: (fromIndex: number, toIndex: number) => void;
  isPreviewMode: boolean;
}

// Component library types
export interface ComponentLibraryProps {
  onComponentDrag: (componentType: ComponentType) => void;
  onTemplateDrag: (templateId: string) => void;
  searchQuery: string;
  selectedCategory: ComponentCategory | 'all';
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: ComponentCategory | 'all') => void;
}

// Property panel types
export interface PropertyPanelProps {
  selectedComponent: BaseComponent | null;
  onConfigChange: (config: ComponentConfig) => void;
  onValidationChange: (validation: ValidationRules) => void;
  onConditionalLogicChange: (logic: ConditionalLogic) => void;
  onComponentDelete: (componentId: string) => void;
}

// Form validation types
export interface FormValidationResult {
  isValid: boolean;
  errors: ComponentValidationError[];
}

export interface ComponentValidationError {
  componentId: string;
  field: string;
  message: string;
  value: any;
}

// Form submission types
export interface FormSubmissionData {
  formId: string;
  responses: ComponentResponse[];
  userInfo?: UserInfo;
  submittedAt: Date;
}

export interface ComponentResponse {
  componentId: string;
  value: any;
  submittedAt: Date;
}

// Template types
export interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  category: ComponentCategory;
  componentType: ComponentType;
  config: ComponentConfig;
  validation: ValidationRules;
  preview: string; // Base64 encoded preview image
}

// Form builder state types
export interface FormBuilderContextType {
  state: FormBuilderState;
  dispatch: React.Dispatch<FormBuilderAction>;
  // Actions
  createForm: (form: Partial<Form>) => void;
  updateForm: (formId: string, updates: Partial<Form>) => void;
  deleteForm: (formId: string) => void;
  addComponent: (component: BaseComponent) => void;
  updateComponent: (componentId: string, updates: Partial<BaseComponent>) => void;
  deleteComponent: (componentId: string) => void;
  moveComponent: (fromIndex: number, toIndex: number) => void;
  selectComponent: (component: BaseComponent | null) => void;
  setPreviewMode: (isPreview: boolean) => void;
  saveForm: () => Promise<void>;
  publishForm: () => Promise<void>;
  duplicateForm: (formId: string) => void;
  exportForm: (format: 'json' | 'pdf') => Promise<void>;
}

// Form builder state
export interface FormBuilderState {
  forms: Form[];
  currentForm: Form | null;
  components: BaseComponent[];
  selectedComponent: BaseComponent | null;
  isPreviewMode: boolean;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
  lastSaved: Date | null;
}

// Form builder actions
export type FormBuilderAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FORMS'; payload: Form[] }
  | { type: 'SET_CURRENT_FORM'; payload: Form | null }
  | { type: 'SET_COMPONENTS'; payload: BaseComponent[] }
  | { type: 'ADD_COMPONENT'; payload: BaseComponent }
  | { type: 'UPDATE_COMPONENT'; payload: { id: string; updates: Partial<BaseComponent> } }
  | { type: 'DELETE_COMPONENT'; payload: string }
  | { type: 'MOVE_COMPONENT'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SELECT_COMPONENT'; payload: BaseComponent | null }
  | { type: 'SET_PREVIEW_MODE'; payload: boolean }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: Date | null }
  | { type: 'RESET_STATE' };

// Component factory types
export interface ComponentFactory {
  createComponent: (type: ComponentType, config?: Partial<ComponentConfig>) => BaseComponent;
  createFromTemplate: (templateId: string) => BaseComponent;
  cloneComponent: (component: BaseComponent) => BaseComponent;
  validateComponent: (component: BaseComponent) => ComponentValidationError[];
}

// Form renderer types
export interface FormRendererProps {
  form: Form;
  components: BaseComponent[];
  onSubmit: (data: FormSubmissionData) => Promise<void>;
  onSaveProgress?: (data: Partial<FormSubmissionData>) => Promise<void>;
  isPreview?: boolean;
  showProgress?: boolean;
  allowSaveProgress?: boolean;
}

// Component validation types
export interface ComponentValidator {
  validate: (component: BaseComponent, value: any) => ValidationResult;
  getErrorMessage: (rule: string, component: BaseComponent) => string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Form analytics types
export interface ComponentAnalytics {
  componentId: string;
  componentType: ComponentType;
  label: string;
  responseCount: number;
  completionRate: number;
  avgTime: number;
  errorRate: number;
  mostCommonValues: Array<{
    value: any;
    count: number;
    percentage: number;
  }>;
}

// Form builder hooks types
export interface UseFormBuilderReturn {
  state: FormBuilderState;
  actions: {
    createForm: (form: Partial<Form>) => void;
    updateForm: (formId: string, updates: Partial<Form>) => void;
    deleteForm: (formId: string) => void;
    addComponent: (component: BaseComponent) => void;
    updateComponent: (componentId: string, updates: Partial<BaseComponent>) => void;
    deleteComponent: (componentId: string) => void;
    moveComponent: (fromIndex: number, toIndex: number) => void;
    selectComponent: (component: BaseComponent | null) => void;
    setPreviewMode: (isPreview: boolean) => void;
    saveForm: () => Promise<void>;
    publishForm: () => Promise<void>;
    duplicateForm: (formId: string) => void;
    exportForm: (format: 'json' | 'pdf') => Promise<void>;
  };
  isLoading: boolean;
  error: string | null;
}

// Form validation hooks types
export interface UseFormValidationReturn {
  validateForm: () => FormValidationResult;
  validateComponent: (component: BaseComponent, value: any) => ComponentValidationError[];
  clearErrors: () => void;
  errors: ComponentValidationError[];
  isValid: boolean;
}
