import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartProductImage } from '@/features/cart/components/CartProductImage';
jest.mock('next/image', () => ({ __esModule: true, default: ({ fill, ...props }: any) => <img {...props} data-optimized="true" /> }));
test('renders the product source through the optimized image component', () => {
  render(<CartProductImage src="https://cdnmpro.com/nano.jpg" name="Nano Clics" className="h-20 w-20" />);
  expect(screen.getByRole('img').getAttribute('src')).toBe('https://cdnmpro.com/nano.jpg');
  expect(screen.getByRole('img').getAttribute('data-optimized')).toBe('true');
});
test('missing image uses a neutral accessible fallback', () => {
  render(<CartProductImage name="Nano Clics" className="h-20 w-20" />);
  expect(screen.getByRole('img').tagName).toBe('DIV');
});
test('failed source falls back and a changed source can load', () => {
  const { rerender } = render(<CartProductImage src="/bad.jpg" name="Nano Clics" className="h-20 w-20" />);
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByRole('img').tagName).toBe('DIV');
  rerender(<CartProductImage src="/correct.jpg" name="Nano Clics" className="h-20 w-20" />);
  expect(screen.getByRole('img').getAttribute('src')).toBe('/correct.jpg');
});
