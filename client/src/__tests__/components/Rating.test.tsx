/**
 * Form Builder Platform - Rating Component Tests
 * Comprehensive testing for Rating component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Rating from '../../components/form-components/Rating';
import { RatingComponent } from '../../types/component';

// Mock component props
const mockRatingProps: RatingComponent = {
  id: 'test-rating',
  type: 'Rating',
  label: 'Test Rating',
  isRequired: true,
  ratingType: 'stars',
  maxRating: 5,
  order: 1,
};

describe('Rating Component', () => {
  it('renders with correct label', () => {
    render(<Rating {...mockRatingProps} />);
    
    expect(screen.getByText('Test Rating')).toBeInTheDocument();
  });

  it('shows required indicator when isRequired is true', () => {
    render(<Rating {...mockRatingProps} />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show required indicator when isRequired is false', () => {
    const props = { ...mockRatingProps, isRequired: false };
    render(<Rating {...props} />);
    
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders star rating by default', () => {
    render(<Rating {...mockRatingProps} />);
    
    // Check for star icons (assuming they're rendered as buttons or spans)
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
  });

  it('handles star rating selection', () => {
    const onChange = jest.fn();
    render(<Rating {...mockRatingProps} onChange={onChange} />);
    
    const stars = screen.getAllByRole('button');
    fireEvent.click(stars[2]); // Click third star
    
    expect(onChange).toHaveBeenCalledWith('test-rating', 3);
  });

  it('renders scale rating when specified', () => {
    const props = { ...mockRatingProps, ratingType: 'scale' as const };
    render(<Rating {...props} />);
    
    // Check for scale options
    const scaleOptions = screen.getAllByRole('button');
    expect(scaleOptions).toHaveLength(5);
  });

  it('handles scale rating selection', () => {
    const onChange = jest.fn();
    const props = { ...mockRatingProps, ratingType: 'scale' as const };
    render(<Rating {...props} onChange={onChange} />);
    
    const scaleOptions = screen.getAllByRole('button');
    fireEvent.click(scaleOptions[3]); // Click fourth option
    
    expect(onChange).toHaveBeenCalledWith('test-rating', 4);
  });

  it('renders emoji rating when specified', () => {
    const props = { 
      ...mockRatingProps, 
      ratingType: 'emoji' as const,
      emojis: ['😞', '😐', '😊', '😄', '🤩']
    };
    render(<Rating {...props} />);
    
    // Check for emoji options
    const emojiOptions = screen.getAllByRole('button');
    expect(emojiOptions).toHaveLength(5);
  });

  it('handles emoji rating selection', () => {
    const onChange = jest.fn();
    const props = { 
      ...mockRatingProps, 
      ratingType: 'emoji' as const,
      emojis: ['😞', '😐', '😊', '😄', '🤩']
    };
    render(<Rating {...props} onChange={onChange} />);
    
    const emojiOptions = screen.getAllByRole('button');
    fireEvent.click(emojiOptions[4]); // Click last emoji
    
    expect(onChange).toHaveBeenCalledWith('test-rating', 5);
  });

  it('shows custom error message', () => {
    render(<Rating {...mockRatingProps} error="Custom error message" />);
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('applies disabled state', () => {
    const props = { ...mockRatingProps, disabled: true };
    render(<Rating {...props} />);
    
    const stars = screen.getAllByRole('button');
    stars.forEach(star => {
      expect(star).toBeDisabled();
    });
  });

  it('applies custom className', () => {
    const props = { ...mockRatingProps, className: 'custom-class' };
    render(<Rating {...props} />);
    
    const container = screen.getByText('Test Rating').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('validates required field', async () => {
    const props = { ...mockRatingProps, isRequired: true };
    render(<Rating {...props} />);
    
    const form = screen.getByText('Test Rating').closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(screen.getByText('هذا الحقل مطلوب')).toBeInTheDocument();
    });
  });

  it('shows validation error for minimum rating', async () => {
    const props = { 
      ...mockRatingProps, 
      validation: { minRating: 3 }
    };
    render(<Rating {...props} />);
    
    const stars = screen.getAllByRole('button');
    fireEvent.click(stars[1]); // Click second star (rating 2)
    fireEvent.blur(stars[1]);
    
    await waitFor(() => {
      expect(screen.getByText('يجب إعطاء تقييم 3 نجوم على الأقل')).toBeInTheDocument();
    });
  });

  it('shows validation error for maximum rating', async () => {
    const props = { 
      ...mockRatingProps, 
      validation: { maxRating: 3 }
    };
    render(<Rating {...props} />);
    
    const stars = screen.getAllByRole('button');
    fireEvent.click(stars[4]); // Click fifth star (rating 5)
    fireEvent.blur(stars[4]);
    
    await waitFor(() => {
      expect(screen.getByText('يجب إعطاء تقييم 3 نجوم كحد أقصى')).toBeInTheDocument();
    });
  });

  it('displays current rating value', () => {
    const props = { ...mockRatingProps, value: 3 };
    render(<Rating {...props} />);
    
    const stars = screen.getAllByRole('button');
    // First 3 stars should be active/selected
    expect(stars[0]).toHaveClass('text-yellow-400');
    expect(stars[1]).toHaveClass('text-yellow-400');
    expect(stars[2]).toHaveClass('text-yellow-400');
    expect(stars[3]).toHaveClass('text-gray-300');
    expect(stars[4]).toHaveClass('text-gray-300');
  });

  it('allows clearing rating when allowClear is true', () => {
    const onChange = jest.fn();
    const props = { ...mockRatingProps, allowClear: true, value: 3 };
    render(<Rating {...props} onChange={onChange} />);
    
    const stars = screen.getAllByRole('button');
    fireEvent.click(stars[2]); // Click the same star again
    
    expect(onChange).toHaveBeenCalledWith('test-rating', 0);
  });
});
