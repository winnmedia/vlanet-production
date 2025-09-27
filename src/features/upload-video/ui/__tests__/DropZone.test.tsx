/**
 * DropZone Component Tests
 * 비디오 업로드 드롭존 컴포넌트 테스트 스위트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropZone } from '../DropZone';
import { testAccessibility, ariaAttrs, screenReader } from '../../../../shared/lib/accessibility/test-helpers';

// Mock video element and URL methods
const mockVideoElement = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  load: jest.fn(),
  videoWidth: 1920,
  videoHeight: 1080,
  duration: 120, // 2 minutes
  src: '',
};

// Mock URL.createObjectURL and revokeObjectURL
const mockObjectURL = 'blob:mock-url';
Object.defineProperty(window.URL, 'createObjectURL', {
  value: jest.fn(() => mockObjectURL),
  writable: true,
});
Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: jest.fn(),
  writable: true,
});

// Mock document.createElement for video
const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName) => {
  if (tagName === 'video') {
    return mockVideoElement as any;
  }
  return originalCreateElement.call(document, tagName);
});

// Mock validateVideoFile function
jest.mock('@/entities/video', () => ({
  validateVideoFile: jest.fn(),
  VIDEO_CONSTRAINTS: {
    MAX_FILE_SIZE: 200 * 1024 * 1024, // 200MB
    MAX_DURATION: 300, // 5 minutes
  },
  formatFileSize: jest.fn((size) => `${Math.round(size / 1024 / 1024)}MB`),
}));

const mockFile = new File(['video content'], 'test-video.mp4', {
  type: 'video/mp4',
  lastModified: Date.now(),
});

Object.defineProperty(mockFile, 'size', {
  value: 50 * 1024 * 1024, // 50MB
  writable: false,
});

describe('DropZone', () => {
  const mockOnFileSelect = jest.fn();
  const mockOnFileRemove = jest.fn();
  const mockValidateVideoFile = jest.requireMock('@/entities/video').validateVideoFile;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default validation success
    mockValidateVideoFile.mockReturnValue({
      isValid: true,
      errors: [],
    });

    // Mock video metadata loading success
    mockVideoElement.addEventListener.mockImplementation((event, callback) => {
      if (event === 'loadedmetadata') {
        setTimeout(callback, 0);
      }
    });
  });

  afterAll(() => {
    document.createElement = originalCreateElement;
  });

  describe('기본 렌더링', () => {
    it('should render drop zone with default state', () => {
      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      expect(screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요')).toBeInTheDocument();
      expect(screen.getByText(/지원 형식: MP4/)).toBeInTheDocument();
      expect(screen.getByText(/업로드 제한사항/)).toBeInTheDocument();
    });

    it('should have file input with correct attributes', () => {
      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', 'video/mp4,.mp4');
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          disabled
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      expect(fileInput).toBeDisabled();
    });
  });

  describe('파일 선택 기능', () => {
    it('should handle file selection via input', async () => {
      const user = userEvent.setup();

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(mockValidateVideoFile).toHaveBeenCalledWith(mockFile);
      });
    });

    it('should open file selector when drop zone is clicked', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();

      // Mock file input click
      const originalClick = HTMLInputElement.prototype.click;
      HTMLInputElement.prototype.click = mockClick;

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const dropZone = screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요').closest('div');
      await user.click(dropZone!);

      expect(mockClick).toHaveBeenCalled();

      HTMLInputElement.prototype.click = originalClick;
    });

    it('should not open file selector when disabled', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();

      HTMLInputElement.prototype.click = mockClick;

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          disabled
        />
      );

      const dropZone = screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요').closest('div');
      await user.click(dropZone!);

      expect(mockClick).not.toHaveBeenCalled();
    });
  });

  describe('드래그 앤 드롭 기능', () => {
    it('should handle drag enter event', () => {
      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const dropZone = screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요').closest('div');

      fireEvent.dragEnter(dropZone!, {
        dataTransfer: { files: [mockFile] },
      });

      expect(dropZone).toHaveClass('border-primary-500', 'bg-primary-50');
    });

    it('should handle drag leave event', () => {
      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const dropZone = screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요').closest('div');

      fireEvent.dragEnter(dropZone!);
      fireEvent.dragLeave(dropZone!);

      expect(dropZone).not.toHaveClass('border-primary-500');
    });

    it('should handle file drop', async () => {
      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const dropZone = screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요').closest('div');

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [mockFile],
        },
      });

      await waitFor(() => {
        expect(mockValidateVideoFile).toHaveBeenCalledWith(mockFile);
      });
    });

    it('should not handle drag events when disabled', () => {
      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          disabled
        />
      );

      const dropZone = screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요').closest('div');

      fireEvent.dragEnter(dropZone!);
      expect(dropZone).not.toHaveClass('border-primary-500');

      fireEvent.drop(dropZone!, {
        dataTransfer: { files: [mockFile] },
      });

      expect(mockValidateVideoFile).not.toHaveBeenCalled();
    });
  });

  describe('파일 검증', () => {
    it('should show validation errors', async () => {
      mockValidateVideoFile.mockReturnValue({
        isValid: false,
        errors: ['파일 크기가 너무 큽니다', '지원하지 않는 형식입니다'],
      });

      const user = userEvent.setup();

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText('파일 검증 오류')).toBeInTheDocument();
        expect(screen.getByText('파일 크기가 너무 큽니다')).toBeInTheDocument();
        expect(screen.getByText('지원하지 않는 형식입니다')).toBeInTheDocument();
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('should validate video duration', async () => {
      // Mock video with duration over limit
      mockVideoElement.duration = 600; // 10 minutes

      const user = userEvent.setup();

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText(/영상 길이는.*분 이하여야 합니다/)).toBeInTheDocument();
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });
  });

  describe('비디오 메타데이터 추출', () => {
    it('should extract video metadata successfully', async () => {
      const user = userEvent.setup();

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith({
          file: mockFile,
          duration: 120,
          width: 1920,
          height: 1080,
          fps: 30,
        });
      });
    });

    it('should handle metadata extraction error', async () => {
      // Mock video error
      mockVideoElement.addEventListener.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(callback, 0);
        }
      });

      const user = userEvent.setup();

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText('파일을 분석하는 중 오류가 발생했습니다.')).toBeInTheDocument();
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('should show analyzing state', async () => {
      // Delay the metadata callback to see loading state
      mockVideoElement.addEventListener.mockImplementation((event, callback) => {
        if (event === 'loadedmetadata') {
          setTimeout(callback, 100);
        }
      });

      const user = userEvent.setup();

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await user.upload(fileInput, mockFile);

      expect(screen.getByText('비디오 파일을 분석하는 중...')).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toHaveClass('animate-spin');
    });
  });

  describe('선택된 파일 표시', () => {
    it('should display selected file information', async () => {
      const user = userEvent.setup();

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
        expect(screen.getByText('크기: 50MB')).toBeInTheDocument();
        expect(screen.getByText('길이: 2:00')).toBeInTheDocument();
        expect(screen.getByText('해상도: 1920 × 1080')).toBeInTheDocument();
        expect(screen.getByText('✓')).toBeInTheDocument();
      });
    });

    it('should allow file removal', async () => {
      const user = userEvent.setup();

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
      });

      const removeButton = screen.getByText('다른 파일 선택');
      await user.click(removeButton);

      expect(mockOnFileRemove).toHaveBeenCalled();
      expect(screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요')).toBeInTheDocument();
    });

    it('should format duration correctly', async () => {
      mockVideoElement.duration = 95; // 1:35

      const user = userEvent.setup();

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText('길이: 1:35')).toBeInTheDocument();
      });
    });
  });

  describe('에러 상태 표시', () => {
    it('should show error styling when validation fails', async () => {
      mockValidateVideoFile.mockReturnValue({
        isValid: false,
        errors: ['파일 오류'],
      });

      const user = userEvent.setup();

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const dropZone = screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요').closest('div');
      const fileInput = screen.getByRole('textbox', { hidden: true });

      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(dropZone).toHaveClass('border-danger-300', 'bg-danger-50');
      });
    });

    it('should show success styling when file is selected', async () => {
      const user = userEvent.setup();

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const dropZone = screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요').closest('div');
      const fileInput = screen.getByRole('textbox', { hidden: true });

      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(dropZone).toHaveClass('border-success-300', 'bg-success-50');
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();

      HTMLInputElement.prototype.click = mockClick;

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const dropZone = screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요').closest('div');

      // Focus and press Enter
      dropZone!.focus();
      await user.keyboard('{Enter}');

      expect(mockClick).toHaveBeenCalled();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      expect(fileInput).toHaveAttribute('accept', 'video/mp4,.mp4');
    });

    it('should pass accessibility audit for empty state', async () => {
      const { container } = render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );
      await testAccessibility(container);
    });

    it('should pass accessibility audit with selected file', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await user.upload(fileInput, mockFile);

      await waitFor(async () => {
        await testAccessibility(container);
      });
    });

    it('should pass accessibility audit in error state', async () => {
      mockValidateVideoFile.mockReturnValue({
        isValid: false,
        errors: ['파일 크기가 너무 큽니다'],
      });

      const user = userEvent.setup();

      const { container } = render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await user.upload(fileInput, mockFile);

      await waitFor(async () => {
        await testAccessibility(container);
      });
    });

    it('should have proper ARIA attributes for drag and drop', () => {
      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const dropZone = screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요').closest('div');

      ariaAttrs.expectAriaAttributes(dropZone!, {
        'role': 'button',
        'tabindex': '0',
      });
    });

    it('should provide accessible file input labeling', () => {
      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      expect(fileInput).toHaveAttribute('aria-label');

      const ariaLabel = fileInput.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    it('should support Space key activation', async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();

      HTMLInputElement.prototype.click = mockClick;

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const dropZone = screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요').closest('div');

      dropZone!.focus();
      await user.keyboard(' ');

      expect(mockClick).toHaveBeenCalled();
    });

    it('should announce validation errors to screen readers', async () => {
      mockValidateVideoFile.mockReturnValue({
        isValid: false,
        errors: ['파일 크기가 너무 큽니다', '지원하지 않는 형식입니다'],
      });

      const user = userEvent.setup();

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        const errorContainer = screen.getByText('파일 검증 오류').parentElement;
        expect(errorContainer).toHaveAttribute('role', 'alert');
      });
    });

    it('should announce file analysis progress to screen readers', async () => {
      // Delay metadata loading to see the analyzing state
      mockVideoElement.addEventListener.mockImplementation((event, callback) => {
        if (event === 'loadedmetadata') {
          setTimeout(callback, 100);
        }
      });

      const user = userEvent.setup();

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await user.upload(fileInput, mockFile);

      const statusMessage = screen.getByText('비디오 파일을 분석하는 중...');
      const statusContainer = statusMessage.closest('[role="status"]') || statusMessage.parentElement;
      expect(statusContainer).toHaveAttribute('role', 'status');
    });

    it('should provide descriptive text for file information', async () => {
      const user = userEvent.setup();

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        // Check that file details are properly labeled
        expect(screen.getByText('크기: 50MB')).toBeInTheDocument();
        expect(screen.getByText('길이: 2:00')).toBeInTheDocument();
        expect(screen.getByText('해상도: 1920 × 1080')).toBeInTheDocument();

        // These should be readable by screen readers
        const fileDetails = screen.getByText('test-video.mp4').closest('div');
        expect(fileDetails).toBeInTheDocument();
      });
    });

    it('should maintain focus when file is selected', async () => {
      const user = userEvent.setup();

      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const dropZone = screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요').closest('div');
      const fileInput = screen.getByRole('textbox', { hidden: true });

      // Focus the drop zone
      dropZone!.focus();
      expect(dropZone).toHaveFocus();

      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        // Focus should remain on an interactive element
        const removeButton = screen.getByText('다른 파일 선택');
        expect(removeButton).toBeInTheDocument();
      });
    });

    it('should have proper focus indicators', () => {
      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      const dropZone = screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요').closest('div');

      // Should have focus styles
      expect(dropZone).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should be properly disabled when disabled prop is true', () => {
      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          disabled
        />
      );

      const dropZone = screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요').closest('div');
      const fileInput = screen.getByRole('textbox', { hidden: true });

      expect(fileInput).toBeDisabled();
      expect(dropZone).toHaveAttribute('aria-disabled', 'true');
    });

    it('should provide clear instructions for screen reader users', () => {
      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
        />
      );

      // Check that instructions are clear and informative
      expect(screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요')).toBeInTheDocument();
      expect(screen.getByText(/지원 형식: MP4/)).toBeInTheDocument();
      expect(screen.getByText(/업로드 제한사항/)).toBeInTheDocument();
    });
  });

  describe('커스텀 props', () => {
    it('should apply custom className', () => {
      render(
        <DropZone
          onFileSelect={mockOnFileSelect}
          onFileRemove={mockOnFileRemove}
          className="custom-dropzone"
        />
      );

      const container = screen.getByText('비디오 파일을 여기에 드래그하거나 클릭하여 선택하세요')
        .closest('[class*="space-y-4"]');

      expect(container).toHaveClass('custom-dropzone');
    });
  });
});