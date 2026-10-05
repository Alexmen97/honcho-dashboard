import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { CreateSessionModal } from './CreateSessionModal';
import { CreatePeerModal } from './CreatePeerModal';

describe('Modal Accessibility & Keyboard Navigation (UI-02)', () => {
  describe('CreateWorkspaceModal', () => {
    it('sets initial autofocus on primary input when opened', async () => {
      render(
        <CreateWorkspaceModal
          isOpen={true}
          onClose={vi.fn()}
          onCreated={vi.fn()}
        />
      );

      const input = screen.getByLabelText(/ID Workspace/);
      await waitFor(() => {
        expect(document.activeElement).toBe(input);
      });
    });

    it('triggers onClose when pressing Escape key', () => {
      const handleClose = vi.fn();
      render(
        <CreateWorkspaceModal
          isOpen={true}
          onClose={handleClose}
          onCreated={vi.fn()}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('traps focus cyclically within the modal on Tab and Shift+Tab', () => {
      render(
        <CreateWorkspaceModal
          isOpen={true}
          onClose={vi.fn()}
          onCreated={vi.fn()}
        />
      );

      const closeBtn = screen.getByRole('button', { name: 'Chiudi' });
      const submitBtn = screen.getByRole('button', { name: 'Crea Workspace' });

      // Focus last element (submitBtn) and press Tab -> should wrap to first element (closeBtn)
      submitBtn.focus();
      expect(document.activeElement).toBe(submitBtn);

      fireEvent.keyDown(window, { key: 'Tab', code: 'Tab' });
      expect(document.activeElement).toBe(closeBtn);

      // Focus first element (closeBtn) and press Shift+Tab -> should wrap to last element (submitBtn)
      closeBtn.focus();
      expect(document.activeElement).toBe(closeBtn);

      fireEvent.keyDown(window, { key: 'Tab', code: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(submitBtn);
    });

    it('restores focus to triggering element when modal closes', async () => {
      const triggerBtn = document.createElement('button');
      triggerBtn.textContent = 'Apri Modale WS';
      document.body.appendChild(triggerBtn);
      triggerBtn.focus();
      expect(document.activeElement).toBe(triggerBtn);

      const { rerender } = render(
        <CreateWorkspaceModal
          isOpen={true}
          onClose={vi.fn()}
          onCreated={vi.fn()}
        />
      );

      const input = screen.getByLabelText(/ID Workspace/);
      await waitFor(() => {
        expect(document.activeElement).toBe(input);
      });

      // Close modal
      rerender(
        <CreateWorkspaceModal
          isOpen={false}
          onClose={vi.fn()}
          onCreated={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(document.activeElement).toBe(triggerBtn);
      });

      document.body.removeChild(triggerBtn);
    });
  });

  describe('CreateSessionModal', () => {
    it('sets initial autofocus on primary input and closes on Escape', async () => {
      const handleClose = vi.fn();
      render(
        <CreateSessionModal
          isOpen={true}
          workspaceId="test-ws"
          onClose={handleClose}
          onCreated={vi.fn()}
        />
      );

      const input = screen.getByLabelText(/ID Sessione/);
      await waitFor(() => {
        expect(document.activeElement).toBe(input);
      });

      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('traps focus cyclically on Tab', () => {
      render(
        <CreateSessionModal
          isOpen={true}
          workspaceId="test-ws"
          onClose={vi.fn()}
          onCreated={vi.fn()}
        />
      );

      const closeBtn = screen.getByRole('button', { name: 'Chiudi' });
      const submitBtn = screen.getByRole('button', { name: 'Crea Sessione' });

      submitBtn.focus();
      fireEvent.keyDown(window, { key: 'Tab', code: 'Tab' });
      expect(document.activeElement).toBe(closeBtn);
    });

    it('restores focus to triggering element when session modal closes', async () => {
      const triggerBtn = document.createElement('button');
      triggerBtn.textContent = 'Apri Modale Session';
      document.body.appendChild(triggerBtn);
      triggerBtn.focus();

      const { rerender } = render(
        <CreateSessionModal
          isOpen={true}
          workspaceId="test-ws"
          onClose={vi.fn()}
          onCreated={vi.fn()}
        />
      );

      const input = screen.getByLabelText(/ID Sessione/);
      await waitFor(() => {
        expect(document.activeElement).toBe(input);
      });

      rerender(
        <CreateSessionModal
          isOpen={false}
          workspaceId="test-ws"
          onClose={vi.fn()}
          onCreated={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(document.activeElement).toBe(triggerBtn);
      });

      document.body.removeChild(triggerBtn);
    });
  });

  describe('CreatePeerModal', () => {
    it('sets initial autofocus on primary input and closes on Escape', async () => {
      const handleClose = vi.fn();
      render(
        <CreatePeerModal
          isOpen={true}
          workspaceId="test-ws"
          onClose={handleClose}
          onCreated={vi.fn()}
        />
      );

      const input = screen.getByLabelText(/ID Peer/);
      await waitFor(() => {
        expect(document.activeElement).toBe(input);
      });

      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('traps focus cyclically on Tab', () => {
      render(
        <CreatePeerModal
          isOpen={true}
          workspaceId="test-ws"
          onClose={vi.fn()}
          onCreated={vi.fn()}
        />
      );

      const closeBtn = screen.getByRole('button', { name: 'Chiudi' });
      const submitBtn = screen.getByRole('button', { name: 'Crea Peer' });

      submitBtn.focus();
      fireEvent.keyDown(window, { key: 'Tab', code: 'Tab' });
      expect(document.activeElement).toBe(closeBtn);
    });

    it('restores focus to triggering element when peer modal closes', async () => {
      const triggerBtn = document.createElement('button');
      triggerBtn.textContent = 'Apri Modale Peer';
      document.body.appendChild(triggerBtn);
      triggerBtn.focus();

      const { rerender } = render(
        <CreatePeerModal
          isOpen={true}
          workspaceId="test-ws"
          onClose={vi.fn()}
          onCreated={vi.fn()}
        />
      );

      const input = screen.getByLabelText(/ID Peer/);
      await waitFor(() => {
        expect(document.activeElement).toBe(input);
      });

      rerender(
        <CreatePeerModal
          isOpen={false}
          workspaceId="test-ws"
          onClose={vi.fn()}
          onCreated={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(document.activeElement).toBe(triggerBtn);
      });

      document.body.removeChild(triggerBtn);
    });
  });
});
