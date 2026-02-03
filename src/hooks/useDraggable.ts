import { useCallback, useEffect, useRef, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  /** Storage key for persisting position */
  storageKey?: string;
  /** Default position from bottom-right corner */
  defaultPosition?: Position;
  /** Boundary padding from edges */
  boundaryPadding?: number;
  /** Drag threshold in pixels to differentiate click from drag */
  dragThreshold?: number;
}

/**
 * Hook to make an element draggable with position persistence
 */
export const useDraggable = (options: UseDraggableOptions = {}) => {
  const {
    storageKey = 'draggable-position',
    defaultPosition = { x: 10, y: 40 }, // default: right 10px, bottom 40px
    boundaryPadding = 10,
    dragThreshold = 5,
  } = options;

  const elementRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const hasDragged = useRef(false); // Track if user actually moved
  const dragStart = useRef<Position>({ x: 0, y: 0 });
  const initialPos = useRef<Position>({ x: 0, y: 0 });

  const [position, setPosition] = useState<Position>(() => {
    // Load saved position from localStorage
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore errors
    }
    return defaultPosition;
  });

  // Save position to localStorage
  const savePosition = useCallback(
    (pos: Position) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(pos));
      } catch {
        // Ignore errors
      }
    },
    [storageKey]
  );

  // Constrain position within viewport
  const constrainPosition = useCallback(
    (x: number, y: number): Position => {
      const element = elementRef.current;
      if (!element) return { x, y };

      const rect = element.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - boundaryPadding;
      const maxY = window.innerHeight - rect.height - boundaryPadding;

      return {
        x: Math.max(boundaryPadding, Math.min(x, maxX)),
        y: Math.max(boundaryPadding, Math.min(y, maxY)),
      };
    },
    [boundaryPadding]
  );

  // Handle mouse/touch start
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    isDragging.current = true;
    hasDragged.current = false;
    dragStart.current = { x: clientX, y: clientY };
    initialPos.current = { x: clientX, y: clientY };
  }, []);

  // Handle mouse/touch move
  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging.current) return;

      // Check if moved beyond threshold
      const totalDeltaX = Math.abs(clientX - initialPos.current.x);
      const totalDeltaY = Math.abs(clientY - initialPos.current.y);

      if (totalDeltaX > dragThreshold || totalDeltaY > dragThreshold) {
        hasDragged.current = true;

        // Add grabbing cursor only when actually dragging
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }

      if (!hasDragged.current) return;

      const deltaX = dragStart.current.x - clientX;
      const deltaY = dragStart.current.y - clientY;

      setPosition((prev) => {
        const newX = prev.x + deltaX;
        const newY = prev.y + deltaY;
        return constrainPosition(newX, newY);
      });

      dragStart.current = { x: clientX, y: clientY };
    },
    [constrainPosition, dragThreshold]
  );

  // Handle mouse/touch end
  const handleDragEnd = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Save final position if actually dragged
      if (hasDragged.current) {
        setPosition((pos) => {
          savePosition(pos);
          return pos;
        });
      }
    }
  }, [savePosition]);

  // Mouse events
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Don't prevent default here - let click work
      handleDragStart(e.clientX, e.clientY);
    },
    [handleDragStart]
  );

  // Touch events
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleDragStart(touch.clientX, touch.clientY);
    },
    [handleDragStart]
  );

  // Click handler - prevent if dragged
  const onClick = useCallback(
    (e: React.MouseEvent, callback?: () => void) => {
      if (hasDragged.current) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged.current = false;
        return;
      }
      callback?.();
    },
    []
  );

  // Global mouse/touch move and end handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    const handleTouchEnd = () => {
      handleDragEnd();
    };

    // Handle window resize - constrain position
    const handleResize = () => {
      setPosition((prev) => constrainPosition(prev.x, prev.y));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleDragMove, handleDragEnd, constrainPosition]);

  return {
    ref: elementRef,
    style: {
      right: position.x,
      bottom: position.y,
    },
    onMouseDown,
    onTouchStart,
    onClick,
  };
};
