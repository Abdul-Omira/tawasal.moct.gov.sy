/**
 * Form Builder Platform - MultiChoice Component Tests
 * Comprehensive testing for MultiChoice component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MultiChoice from '../../components/form-components/MultiChoice';
import { MultiChoiceComponent } from '../../types/component';

// Mock component props
const mockMultiChoiceProps: MultiChoiceComponent = {
  id: 'test-multi-choice',
  type: 'MultiChoice',
  label: 'Test Multi Choice',
  isRequired: true,
  options: [
    { id: '1', label: 'Option 1', value: 'option1' },
    { id: '2', label: 'Option 2', value: 'option2' },
    { id: '3', label: 'Option 3', value: 'option3' },
  ],
  order: 1,
};

describe('MultiChoice Component', () => {
  it('renders with correct label', () => {
    render(<MultiChoice {...mockMultiChoiceProps} />);
    
    expect(screen.getByText('Test Multi Choice')).toBeInTheDocument();
  });

  it('shows required indicator when isRequired is true', () => {
    render(<MultiChoice {...mockMultiChoiceProps} />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show required indicator when isRequired is false', () => {
    const props = { ...mockMultiChoiceProps, isRequired: false };
    render(<MultiChoice {...props} />);
    
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<MultiChoice {...mockMultiChoiceProps} />);
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('handles radio button selection', () => {
    const onChange = jest.fn();
    const props = { ...mockMultiChoiceProps, choiceType: 'radio' as const };
    render(<MultiChoice {...props} onChange={onChange} />);
    
    const option1 = screen.getByLabelText('Option 1');
    fireEvent.click(option1);
    
    expect(onChange).toHaveBeenCalledWith('test-multi-choice', 'option1');
    expect(option1).toBeChecked();
  });

  it('handles checkbox selection', () => {
    const onChange = jest.fn();
    const props = { ...mockMultiChoiceProps, choiceType: 'checkbox' as const };
    render(<MultiChoice {...props} onChange={onChange} />);
    
    const option1 = screen.getByLabelText('Option 1');
    const option2 = screen.getByLabelText('Option 2');
    
    fireEvent.click(option1);
    fireEvent.click(option2);
    
    expect(onChange).toHaveBeenCalledWith('test-multi-choice', ['option1', 'option2']);
    expect(option1).toBeChecked();
    expect(option2).toBeChecked();
  });

  it('shows custom error message', () => {
    render(<MultiChoice {...mockMultiChoiceProps} error="Custom error message" />);
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('applies disabled state', () => {
    const props = { ...mockMultiChoiceProps, disabled: true };
    render(<MultiChoice {...props} />);
    
    const option1 = screen.getByLabelText('Option 1');
    expect(option1).toBeDisabled();
  });

  it('applies custom className', () => {
    const props = { ...mockMultiChoiceProps, className: 'custom-class' };
    render(<MultiChoice {...props} />);
    
    const container = screen.getByText('Test Multi Choice').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('validates required field', async () => {
    const props = { ...mockMultiChoiceProps, isRequired: true };
    render(<MultiChoice {...props} />);
    
    const form = screen.getByText('Test Multi Choice').closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(screen.getByText('هذا الحقل مطلوب')).toBeInTheDocument();
    });
  });

  it('shows validation error for minimum selections', async () => {
    const props = { 
      ...mockMultiChoiceProps, 
      choiceType: 'checkbox' as const,
      validation: { minSelections: 2 }
    };
    render(<MultiChoice {...props} />);
    
    const option1 = screen.getByLabelText('Option 1');
    fireEvent.click(option1);
    fireEvent.blur(option1);
    
    await waitFor(() => {
      expect(screen.getByText('يجب اختيار خيارين على الأقل')).toBeInTheDocument();
    });
  });

  it('shows validation error for maximum selections', async () => {
    const props = { 
      ...mockMultiChoiceProps, 
      choiceType: 'checkbox' as const,
      validation: { maxSelections: 1 }
    };
    render(<MultiChoice {...props} />);
    
    const option1 = screen.getByLabelText('Option 1');
    const option2 = screen.getByLabelText('Option 2');
    
    fireEvent.click(option1);
    fireEvent.click(option2);
    fireEvent.blur(option2);
    
    await waitFor(() => {
      expect(screen.getByText('يمكن اختيار خيار واحد فقط')).toBeInTheDocument();
    });
  });
});
