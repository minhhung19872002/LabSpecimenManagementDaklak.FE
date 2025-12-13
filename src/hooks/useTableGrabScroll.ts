/**
 * Initialize grab-to-scroll globally for all Ant Design tables
 * Only enables on tables with horizontal overflow
 */
export const initTableGrabScroll = () => {
  let isGrabbing = false;
  let startX = 0;
  let scrollLeft = 0;
  let currentContainer: HTMLElement | null = null;

  // Check and update scroll class for all table containers
  const updateScrollClasses = () => {
    const containers = document.querySelectorAll('.ant-table-content, .ant-table-body');
    containers.forEach((container) => {
      const el = container as HTMLElement;
      if (el.scrollWidth > el.clientWidth) {
        el.classList.add('has-horizontal-scroll');
      } else {
        el.classList.remove('has-horizontal-scroll');
      }
    });
  };

  // Initial check
  updateScrollClasses();

  // Re-check on window resize
  window.addEventListener('resize', updateScrollClasses);

  // Use MutationObserver to detect new tables being added to DOM
  const observer = new MutationObserver(() => {
    updateScrollClasses();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  const getScrollContainer = (target: HTMLElement): HTMLElement | null => {
    const tableContent = target.closest('.ant-table-content.has-horizontal-scroll') as HTMLElement;
    if (tableContent) return tableContent;

    const tableBody = target.closest('.ant-table-body.has-horizontal-scroll') as HTMLElement;
    if (tableBody) return tableBody;

    return null;
  };

  const isInteractiveElement = (target: HTMLElement): boolean => {
    return !!(
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('.ant-checkbox') ||
      target.closest('.ant-switch') ||
      target.closest('.ant-select') ||
      target.closest('.ant-dropdown-trigger') ||
      target.closest('.ant-btn') ||
      target.closest('.ant-tag') ||
      target.closest('[role="button"]') ||
      target.closest('.ant-table-cell-fix-left') ||
      target.closest('.ant-table-cell-fix-right')
    );
  };

  const handleMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // Skip if clicking on interactive elements
    if (isInteractiveElement(target)) return;

    // Find scrollable table container
    const container = getScrollContainer(target);
    if (!container) return;

    isGrabbing = true;
    currentContainer = container;
    startX = e.pageX;
    scrollLeft = container.scrollLeft;

    container.classList.add('is-grabbing');

    // Prevent text selection while dragging
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isGrabbing || !currentContainer) return;

    e.preventDefault();
    const x = e.pageX;
    const walk = (x - startX) * 1.2; // Scroll speed multiplier
    currentContainer.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    if (currentContainer) {
      currentContainer.classList.remove('is-grabbing');
    }
    isGrabbing = false;
    currentContainer = null;
  };

  const handleMouseLeave = (e: MouseEvent) => {
    // Only reset if we leave the document
    if (e.relatedTarget === null) {
      handleMouseUp();
    }
  };

  // Use capture phase to intercept before other handlers
  document.addEventListener('mousedown', handleMouseDown, true);
  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('mouseup', handleMouseUp, true);
  document.addEventListener('mouseleave', handleMouseLeave, true);

  // Return cleanup function
  return () => {
    document.removeEventListener('mousedown', handleMouseDown, true);
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('mouseup', handleMouseUp, true);
    document.removeEventListener('mouseleave', handleMouseLeave, true);
    window.removeEventListener('resize', updateScrollClasses);
    observer.disconnect();
  };
};

export default initTableGrabScroll;
