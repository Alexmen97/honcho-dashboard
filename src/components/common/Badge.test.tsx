import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge Component', () => {
  it('renders explicit cognitive level with emerald styling', () => {
    render(<Badge level="explicit">explicit</Badge>);
    const badge = screen.getByText('explicit');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-emerald-400');
    expect(badge.className).toContain('bg-emerald-500/10');
  });

  it('renders deductive cognitive level with indigo styling', () => {
    render(<Badge level="deductive">deductive</Badge>);
    const badge = screen.getByText('deductive');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-indigo-400');
    expect(badge.className).toContain('bg-indigo-500/10');
  });

  it('renders inductive cognitive level with amber styling', () => {
    render(<Badge level="inductive">inductive</Badge>);
    const badge = screen.getByText('inductive');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-amber-400');
    expect(badge.className).toContain('bg-amber-500/10');
  });

  it('renders contradiction cognitive level with rose styling', () => {
    render(<Badge level="contradiction">contradiction</Badge>);
    const badge = screen.getByText('contradiction');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-rose-400');
    expect(badge.className).toContain('bg-rose-500/10');
  });
});
