import React, { useState, useCallback, useRef, useMemo } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ResizableTitle = ({ onResizeStart, width, columnKey, children, ...restProps }: any) => {
  if (!width || columnKey === "actions" || columnKey === "checkbox") {
    return <th {...restProps}>{children}</th>;
  }
  return (
    <th {...restProps} style={{ ...restProps.style, position: "relative" }}>
      {children}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: "col-resize",
          zIndex: 1,
        }}
        onMouseDown={(e: React.MouseEvent) => onResizeStart?.(e, columnKey)}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div
          style={{
            position: "absolute",
            right: 3,
            top: "30%",
            bottom: "30%",
            width: 2,
            background: "#d9d9d9",
            borderRadius: 1,
          }}
        />
      </div>
    </th>
  );
};

export function useColumnResize(defaultWidths: Record<string, number>) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(defaultWidths);
  const columnWidthsRef = useRef(columnWidths);
  columnWidthsRef.current = columnWidths;

  const handleResizeStart = useCallback((e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidthsRef.current[colKey] || 100;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [colKey]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleResizeStartRef = useRef(handleResizeStart);
  handleResizeStartRef.current = handleResizeStart;

  const tableComponents = useMemo(
    () => ({
      header: {
        cell: (props: Record<string, unknown>) =>
          ResizableTitle({ ...props, onResizeStart: handleResizeStartRef.current }),
      },
    }),
    [],
  );

  const getColumnWidth = useCallback(
    (key: string) => columnWidths[key] || defaultWidths[key] || 100,
    [columnWidths, defaultWidths],
  );

  const withResize = useCallback(
    <C,>(key: string, col: C): C & { onHeaderCell: () => Record<string, unknown> } => {
      const w = columnWidths[key] || (col as { width?: number }).width;
      return { ...col, width: w, onHeaderCell: () => ({ width: w, columnKey: key }) };
    },
    [columnWidths],
  );

  return { columnWidths, tableComponents, getColumnWidth, withResize };
}
