/**
 * Form Builder Platform - TextInput Component Tests
 * Comprehensive testing for TextInput component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextInput from '../../components/form-components/TextInput';
import { TextInputComponent } from '../../types/component';

// Mock component props
const mockTextInputProps: TextInputComponent = {
  id: 'test-text-input',
  type: 'TextInput',
  label: 'Test Text Input',
  placeholder: 'Enter text here',
  isRequired: true,
  validation: {
    minLength: 3,
    maxLength: 50,
    pattern: '^[a-zA-Z0-9\\s]+$',
  },
  order: 1,
};

describe('TextInput Component', () => {
  it('renders with correct label and placeholder', () => {
    render(<TextInput {...mockTextInputProps} />);
    
    expect(screen.getByLabelText('Test Text Input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
  });

  it('shows required indicator when isRequired is true', () => {
    render(<TextInput {...mockTextInputProps} />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show required indicator when isRequired is false', () => {
    const props = { ...mockTextInputProps, isRequired: false };
    render(<TextInput {...props} />);
    
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('handles text input changes', () => {
    const onChange = jest.fn();
    render(<TextInput {...mockTextInputProps} onChange={onChange} />);
    
    const input = screen.getByLabelText('Test Text Input');
    fireEvent.change(input, { target: { value: 'test input' } });
    
    expect(onChange).toHaveBeenCalledWith('test-text-input', 'test input');
  });

  it('validates minimum length', async () => {
    render(<TextInput {...mockTextInputProps} />);
    
    const input = screen.getByLabelText('Test Text Input');
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(screen.getByText('يجب أن يكون النص 3 أحرف على الأقل')).toBeInTheDocument();
    });
  });

  it('validates maximum length', async () => {
    render(<TextInput {...mockTextInputProps} />);
    
    const input = screen.getByLabelText('Test Text Input');
    fireEvent.change(input, { target: { value: 'a'.repeat(51) } });
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(screen.getByText('يجب أن يكون النص 50 حرف أو أقل')).toBeInTheDocument();
    });
  });

  it('validates pattern', async () => {
    render(<TextInput {...mockTextInputProps} />);
    
    const input = screen.getByLabelText('Test Text Input');
    fireEvent.change(input, { target: { value: 'test@#$' } });
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(screen.getByText('النص المدخل غير صحيح')).toBeInTheDocument();
    });
  });

  it('shows custom error message', () => {
    render(<TextInput {...mockTextInputProps} error="Custom error message" />);
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('applies correct input type', () => {
    const props = { ...mockTextInputProps, inputType: 'email' as const };
    render(<TextInput {...props} />);
    
    const input = screen.getByLabelText('Test Text Input');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('applies disabled state', () => {
    const props = { ...mockTextInputProps, disabled: true };
    render(<TextInput {...props} />);
    
    const input = screen.getByLabelText('Test Text Input');
    expect(input).toBeDisabled();
  });

  it('applies custom className', () => {
    const props = { ...mockTextInputProps, className: 'custom-class' };
    render(<TextInput {...props} />);
    
    const input = screen.getByLabelText('Test Text Input');
    expect(input).toHaveClass('custom-class');
  });
});
