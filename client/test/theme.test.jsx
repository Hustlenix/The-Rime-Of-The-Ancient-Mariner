import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ThemeToggle from '../src/components/ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to light when nothing is saved and the OS prefers light', () => {
    render(<ThemeToggle />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(screen.getByRole('button', { name: /Switch to dark theme/ })).toBeInTheDocument();
  });

  it('respects a saved dark preference and exposes it on the document', () => {
    localStorage.setItem('tals-theme', 'dark');
    render(<ThemeToggle />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: /Switch to light theme/ })).toBeInTheDocument();
  });

  it('toggles the theme, persists it, and syncs the theme-color meta', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: /Switch to dark theme/ }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('tals-theme')).toBe('dark');
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe('#141414');
    expect(screen.getByRole('button', { name: /Switch to light theme/ })).toBeInTheDocument();
    expect(screen.getByText('Dark theme enabled')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Switch to light theme/ }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('tals-theme')).toBe('light');
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe('#f5f0e1');
  });
});