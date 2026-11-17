import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DirectChatInput } from './DirectChatInput.js';

describe('DirectChatInput bug reporting & chat behaviour', () => {
  it('reports the current chat text through the same composer', () => {
    const onReportBug = vi.fn();
    render(<DirectChatInput onSendMessage={vi.fn()} onReportBug={onReportBug} />);
    fireEvent.change(screen.getByPlaceholderText(/Type a prompt/), { target: { value: 'Save button is broken' } });
    fireEvent.click(screen.getByTitle('Report bug'));
    expect(onReportBug).toHaveBeenCalledWith('Save button is broken');
  });

  it('disables report bug button when composer text is empty', () => {
    const onReportBug = vi.fn();
    render(<DirectChatInput onSendMessage={vi.fn()} onReportBug={onReportBug} />);
    const reportBtn = screen.getByTitle('Report bug');
    expect(reportBtn).toBeDisabled();
    fireEvent.click(reportBtn);
    expect(onReportBug).not.toHaveBeenCalled();
  });

  it('disables input and report button when disabled prop is true', () => {
    const onReportBug = vi.fn();
    render(<DirectChatInput onSendMessage={vi.fn()} onReportBug={onReportBug} disabled={true} />);
    const textarea = screen.getByPlaceholderText(/Type a prompt/);
    const reportBtn = screen.getByTitle('Report bug');
    expect(textarea).toBeDisabled();
    expect(reportBtn).toBeDisabled();
  });

  it('sends normal chat message and clears composer without reporting bug', () => {
    const onSendMessage = vi.fn();
    const onReportBug = vi.fn();
    render(<DirectChatInput onSendMessage={onSendMessage} onReportBug={onReportBug} />);
    const textarea = screen.getByPlaceholderText(/Type a prompt/);
    fireEvent.change(textarea, { target: { value: 'Hello agent' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(onSendMessage).toHaveBeenCalledWith('Hello agent');
    expect(onReportBug).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('');
  });

  it('does not render report bug action when onReportBug is omitted', () => {
    render(<DirectChatInput onSendMessage={vi.fn()} />);
    expect(screen.queryByTitle('Report bug')).toBeNull();
  });
});
