/**
 * Form Builder Platform - FileUpload Component Tests
 * Comprehensive testing for FileUpload component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUpload from '../../components/form-components/FileUpload';
import { FileUploadComponent } from '../../types/component';

// Mock component props
const mockFileUploadProps: FileUploadComponent = {
  id: 'test-file-upload',
  type: 'FileUpload',
  label: 'Test File Upload',
  isRequired: true,
  acceptedTypes: ['image/*', '.pdf', '.doc', '.docx'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 3,
  order: 1,
};

describe('FileUpload Component', () => {
  it('renders with correct label', () => {
    render(<FileUpload {...mockFileUploadProps} />);
    
    expect(screen.getByText('Test File Upload')).toBeInTheDocument();
  });

  it('shows required indicator when isRequired is true', () => {
    render(<FileUpload {...mockFileUploadProps} />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show required indicator when isRequired is false', () => {
    const props = { ...mockFileUploadProps, isRequired: false };
    render(<FileUpload {...props} />);
    
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders drag and drop area', () => {
    render(<FileUpload {...mockFileUploadProps} />);
    
    expect(screen.getByText('اسحب الملفات هنا أو انقر للاختيار')).toBeInTheDocument();
  });

  it('handles file selection', () => {
    const onChange = jest.fn();
    render(<FileUpload {...mockFileUploadProps} onChange={onChange} />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Test File Upload');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(onChange).toHaveBeenCalledWith('test-file-upload', [file]);
  });

  it('handles drag and drop', () => {
    const onChange = jest.fn();
    render(<FileUpload {...mockFileUploadProps} onChange={onChange} />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const dropArea = screen.getByText('اسحب الملفات هنا أو انقر للاختيار').closest('div');
    
    fireEvent.dragOver(dropArea!);
    fireEvent.drop(dropArea!, { dataTransfer: { files: [file] } });
    
    expect(onChange).toHaveBeenCalledWith('test-file-upload', [file]);
  });

  it('validates file type', async () => {
    render(<FileUpload {...mockFileUploadProps} />);
    
    const file = new File(['test content'], 'test.exe', { type: 'application/x-msdownload' });
    const input = screen.getByLabelText('Test File Upload');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('نوع الملف غير مدعوم')).toBeInTheDocument();
    });
  });

  it('validates file size', async () => {
    render(<FileUpload {...mockFileUploadProps} />);
    
    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Test File Upload');
    
    fireEvent.change(input, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText('حجم الملف كبير جداً')).toBeInTheDocument();
    });
  });

  it('validates maximum number of files', async () => {
    render(<FileUpload {...mockFileUploadProps} />);
    
    const file1 = new File(['test1'], 'test1.txt', { type: 'text/plain' });
    const file2 = new File(['test2'], 'test2.txt', { type: 'text/plain' });
    const file3 = new File(['test3'], 'test3.txt', { type: 'text/plain' });
    const file4 = new File(['test4'], 'test4.txt', { type: 'text/plain' });
    
    const input = screen.getByLabelText('Test File Upload');
    
    fireEvent.change(input, { target: { files: [file1, file2, file3, file4] } });
    
    await waitFor(() => {
      expect(screen.getByText('يمكن رفع 3 ملفات كحد أقصى')).toBeInTheDocument();
    });
  });

  it('shows custom error message', () => {
    render(<FileUpload {...mockFileUploadProps} error="Custom error message" />);
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('applies disabled state', () => {
    const props = { ...mockFileUploadProps, disabled: true };
    render(<FileUpload {...props} />);
    
    const input = screen.getByLabelText('Test File Upload');
    expect(input).toBeDisabled();
  });

  it('applies custom className', () => {
    const props = { ...mockFileUploadProps, className: 'custom-class' };
    render(<FileUpload {...props} />);
    
    const container = screen.getByText('Test File Upload').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('shows file preview for images', () => {
    const onChange = jest.fn();
    render(<FileUpload {...mockFileUploadProps} onChange={onChange} />);
    
    // Create a mock image file
    const imageFile = new File(['fake image content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Test File Upload');
    
    fireEvent.change(input, { target: { files: [imageFile] } });
    
    expect(screen.getByText('test.jpg')).toBeInTheDocument();
  });

  it('removes file when remove button is clicked', () => {
    const onChange = jest.fn();
    render(<FileUpload {...mockFileUploadProps} onChange={onChange} />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Test File Upload');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const removeButton = screen.getByText('إزالة');
    fireEvent.click(removeButton);
    
    expect(onChange).toHaveBeenCalledWith('test-file-upload', []);
  });
});
