/**
 * Form Builder Platform - Dropdown Component Tests
 * Comprehensive testing for Dropdown component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dropdown from '../../components/form-components/Dropdown';
import { DropdownComponent } from '../../types/component';

// Mock component props
const mockDropdownProps: DropdownComponent = {
  id: 'test-dropdown',
  type: 'Dropdown',
  label: 'Test Dropdown',
  placeholder: 'Select an option',
  isRequired: true,
  options: [
    { id: '1', label: 'Option 1', value: 'option1' },
    { id: '2', label: 'Option 2', value: 'option2' },
    { id: '3', label: 'Option 3', value: 'option3' },
  ],
  order: 1,
};

describe('Dropdown Component', () => {
  it('renders with correct label and placeholder', () => {
    render(<Dropdown {...mockDropdownProps} />);
    
    expect(screen.getByLabelText('Test Dropdown')).toBeInTheDocument();
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('shows required indicator when isRequired is true', () => {
    render(<Dropdown {...mockDropdownProps} />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show required indicator when isRequired is false', () => {
    const props = { ...mockDropdownProps, isRequired: false };
    render(<Dropdown {...props} />);
    
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(<Dropdown {...mockDropdownProps} />);
    
    const dropdown = screen.getByRole('button');
    fireEvent.click(dropdown);
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('selects an option when clicked', () => {
    const onChange = jest.fn();
    render(<Dropdown {...mockDropdownProps} onChange={onChange} />);
    
    const dropdown = screen.getByRole('button');
    fireEvent.click(dropdown);
    
    const option = screen.getByText('Option 1');
    fireEvent.click(option);
    
    expect(onChange).toHaveBeenCalledWith('test-dropdown', 'option1');
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('handles multi-select mode', () => {
    const props = { ...mockDropdownProps, multiSelect: true };
    const onChange = jest.fn();
    render(<Dropdown {...props} onChange={onChange} />);
    
    const dropdown = screen.getByRole('button');
    fireEvent.click(dropdown);
    
    const option1 = screen.getByText('Option 1');
    const option2 = screen.getByText('Option 2');
    
    fireEvent.click(option1);
    fireEvent.click(option2);
    
    expect(onChange).toHaveBeenCalledWith('test-dropdown', ['option1', 'option2']);
  });

  it('shows custom error message', () => {
    render(<Dropdown {...mockDropdownProps} error="Custom error message" />);
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('applies disabled state', () => {
    const props = { ...mockDropdownProps, disabled: true };
    render(<Dropdown {...props} />);
    
    const dropdown = screen.getByRole('button');
    expect(dropdown).toBeDisabled();
  });

  it('applies custom className', () => {
    const props = { ...mockDropdownProps, className: 'custom-class' };
    render(<Dropdown {...props} />);
    
    const dropdown = screen.getByRole('button');
    expect(dropdown).toHaveClass('custom-class');
  });

  it('filters options when searching', () => {
    const props = { ...mockDropdownProps, searchable: true };
    render(<Dropdown {...props} />);
    
    const dropdown = screen.getByRole('button');
    fireEvent.click(dropdown);
    
    const searchInput = screen.getByPlaceholderText('البحث...');
    fireEvent.change(searchInput, { target: { value: 'Option 1' } });
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
  });

  it('shows no options message when no matches found', () => {
    const props = { ...mockDropdownProps, searchable: true };
    render(<Dropdown {...props} />);
    
    const dropdown = screen.getByRole('button');
    fireEvent.click(dropdown);
    
    const searchInput = screen.getByPlaceholderText('البحث...');
    fireEvent.change(searchInput, { target: { value: 'Non-existent' } });
    
    expect(screen.getByText('لا توجد خيارات متاحة')).toBeInTheDocument();
  });
});
