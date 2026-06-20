import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dropdown, Empty, Spin } from 'antd';
import {
  CheckOutlined,
  CloseCircleFilled,
  CloseOutlined,
  DownOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LimitInput } from '../../../components/common';
import type { LimitInputRef } from '../../../components/common';
import { ResultRichText, getResultSearchCandidates } from './resultFilterUtils';

const RESULT_OPTIONS_MAX_HEIGHT = 280;

interface ResultFilterControlProps {
  open: boolean;
  value: string[];
  searchHtml: string;
  loading: boolean;
  options: string[];
  onOpenChange: (open: boolean) => void;
  onSearchChange: (value: string) => void;
  onChange: (values: string[]) => void;
}

const ResultFilterControl: React.FC<ResultFilterControlProps> = ({
  open,
  value,
  searchHtml,
  loading,
  options,
  onOpenChange,
  onSearchChange,
  onChange,
}) => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<LimitInputRef | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownWidth, setDropdownWidth] = useState(320);
  const [visibleTagCount, setVisibleTagCount] = useState(value.length);
  const isSearchEmpty = getResultSearchCandidates(searchHtml).length === 0;

  useEffect(() => {
    if (value.length === 0) {
      setVisibleTagCount(0);
      return;
    }

    const selectionEl = selectionRef.current;
    const measureEl = measureRef.current;
    if (!selectionEl || !measureEl) {
      setVisibleTagCount(value.length);
      return;
    }

    const compute = () => {
      const containerWidth = selectionEl.offsetWidth;
      const tags = measureEl.querySelectorAll('.result-filter-measure-tag');
      const summaryTagWidth = 64;
      const gap = 4;

      const proseMirror = selectionEl.querySelector('.ProseMirror');
      const editorContentWidth = proseMirror ? proseMirror.scrollWidth : 0;
      const editorMinWidth = Math.max(60, editorContentWidth + 12);

      let usedWidth = 0;
      let count = 0;

      for (let i = 0; i < tags.length; i++) {
        const tagWidth = (tags[i] as HTMLElement).offsetWidth + (i > 0 ? gap : 0);
        const remaining = value.length - (i + 1);
        const reserved = (remaining > 0 ? summaryTagWidth + gap : 0) + editorMinWidth;

        if (usedWidth + tagWidth + reserved <= containerWidth) {
          usedWidth += tagWidth;
          count++;
        } else {
          break;
        }
      }

      setVisibleTagCount(Math.max(count, 0));
    };

    requestAnimationFrame(compute);

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(compute);
      observer.observe(selectionEl);
      return () => observer.disconnect();
    }
  }, [value, searchHtml]);

  const visibleSelectedValues = value.slice(0, visibleTagCount);
  const hiddenSelectedCount = value.length - visibleSelectedValues.length;
  const hasClearAction = value.length > 0 || !isSearchEmpty;

  const handleToggle = useCallback(
    (result: string) => {
      onSearchChange('');
      if (value.includes(result)) {
        onChange(value.filter((item) => item !== result));
        return;
      }

      onChange([...value, result]);
    },
    [onChange, onSearchChange, value],
  );

  const handleRemove = useCallback(
    (result: string) => {
      onChange(value.filter((item) => item !== result));
    },
    [onChange, value],
  );

  const focusEditor = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const openAndFocusEditor = useCallback(() => {
    if (!open) {
      onOpenChange(true);
    }
    requestAnimationFrame(() => {
      focusEditor();
    });
  }, [focusEditor, onOpenChange, open]);

  const handleSearchInputChange = useCallback(
    (nextValue: string) => {
      if (!open) {
        onOpenChange(true);
      }
      onSearchChange(nextValue);
    },
    [onOpenChange, onSearchChange, open],
  );

  const handleClearAll = useCallback(
    (e?: React.MouseEvent<HTMLElement>) => {
      e?.preventDefault();
      e?.stopPropagation();
      onChange([]);
      onSearchChange('');
      setActiveIndex(0);
    },
    [onChange, onSearchChange],
  );

  const rowVirtualizer = useVirtualizer({
    count: options.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 32,
    overscan: 5,
  });

  const ensureOptionVisible = useCallback(
    (index: number) => {
      rowVirtualizer.scrollToIndex(index, { align: 'auto' });
    },
    [rowVirtualizer],
  );

  const moveActiveIndex = useCallback(
    (direction: -1 | 1) => {
      if (options.length === 0) return;

      setActiveIndex((prev) => Math.max(0, Math.min(prev + direction, options.length - 1)));
    },
    [options.length],
  );

  const handleKeyDownCapture = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!open) {
          openAndFocusEditor();
          return;
        }
        moveActiveIndex(1);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!open) {
          openAndFocusEditor();
          return;
        }
        moveActiveIndex(-1);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (!open) {
          openAndFocusEditor();
          return;
        }

        const activeValue = options[activeIndex];
        if (activeValue) {
          handleToggle(activeValue);
        }
        return;
      }

      if (e.key === 'Escape') {
        if (open) {
          e.preventDefault();
          onOpenChange(false);
        }
        return;
      }

      if ((e.key === 'Backspace' || e.key === 'Delete') && isSearchEmpty && value.length > 0) {
        handleRemove(value[value.length - 1]);
        e.preventDefault();
        return;
      }

      if (e.key === 'Tab' && open) {
        onOpenChange(false);
      }
    },
    [
      activeIndex,
      handleRemove,
      handleToggle,
      isSearchEmpty,
      moveActiveIndex,
      onOpenChange,
      open,
      openAndFocusEditor,
      options,
      value,
    ],
  );

  useEffect(() => {
    if (!open) {
      onSearchChange('');
    }
  }, [open, onSearchChange]);

  useEffect(() => {
    setActiveIndex(0);
  }, [searchHtml]);

  useEffect(() => {
    if (!open) return;

    if (options.length === 0) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex((prev) => Math.min(prev, options.length - 1));
  }, [open, options]);

  useEffect(() => {
    if (!open) return;
    ensureOptionVisible(activeIndex);
  }, [activeIndex, ensureOptionVisible, open]);

  useEffect(() => {
    const updateWidth = () => {
      if (triggerRef.current) {
        setDropdownWidth(triggerRef.current.offsetWidth);
      }
    };

    updateWidth();

    if (typeof ResizeObserver !== 'undefined' && triggerRef.current) {
      const observer = new ResizeObserver(updateWidth);
      observer.observe(triggerRef.current);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const overlayContent = (
    <div
      style={{
        width: dropdownWidth,
        minWidth: dropdownWidth,
        maxWidth: 'calc(100vw - 32px)',
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #f0f0f0',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div ref={listRef} style={{ maxHeight: RESULT_OPTIONS_MAX_HEIGHT, overflowY: 'auto', padding: 4 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <Spin size="small" />
          </div>
        ) : options.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={!isSearchEmpty ? 'Không có kết quả phù hợp' : 'Không có dữ liệu'}
          />
        ) : (
          <div style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const result = options[virtualRow.index];
              const selected = value.includes(result);
              const isActive = virtualRow.index === activeIndex;

              return (
                <div
                  key={result}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  onClick={() => handleToggle(result)}
                  onMouseEnter={() => setActiveIndex(virtualRow.index)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    padding: '5px 12px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: selected ? 600 : 400,
                    background: isActive ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    fontSize: 14,
                    lineHeight: '22px',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <ResultRichText value={result} />
                  </div>
                  {selected && (
                    <CheckOutlined style={{ color: '#1677ff', fontSize: 12, flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      trigger={['click']}
      popupRender={() => overlayContent}
    >
      <div
        ref={triggerRef}
        onClick={openAndFocusEditor}
        onKeyDownCapture={handleKeyDownCapture}
        className={`result-filter-trigger ${open ? 'open' : ''}`}
        tabIndex={0}
        style={{
          width: '100%',
          height: 40,
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          padding: '0 8px 0 4px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'text',
          background: '#fff',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxSizing: 'border-box',
        }}
      >
        <div
          ref={measureRef}
          aria-hidden
          style={{
            position: 'absolute',
            visibility: 'hidden',
            pointerEvents: 'none',
            height: 0,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            display: 'flex',
            gap: 4,
          }}
        >
          {value.map((result) => (
            <span
              key={result}
              className="ant-select-selection-item result-filter-selection-item result-filter-measure-tag"
            >
              <span className="ant-select-selection-item-content result-filter-selection-label">
                <ResultRichText value={result} />
              </span>
              <span className="ant-select-selection-item-remove">
                <CloseOutlined style={{ fontSize: 8 }} />
              </span>
            </span>
          ))}
        </div>
        <div
          ref={selectionRef}
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'nowrap',
            gap: 4,
            overflow: 'hidden',
            height: '100%',
          }}
        >
          {visibleSelectedValues.map((result) => (
            <span
              key={result}
              className="ant-select-selection-item result-filter-selection-item"
            >
              <span className="ant-select-selection-item-content result-filter-selection-label">
                <ResultRichText value={result} />
              </span>
              <span
                className="ant-select-selection-item-remove result-filter-selection-remove"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemove(result);
                }}
              >
                <CloseOutlined />
              </span>
            </span>
          ))}
          {hiddenSelectedCount > 0 && (
            <span className="ant-select-selection-item result-filter-selection-item result-filter-selection-summary">
              {`+${hiddenSelectedCount} ...`}
            </span>
          )}
          <div
            className="result-filter-editor"
            style={{ flex: 1, minWidth: 60, position: 'relative', overflow: 'hidden' }}
          >
            {value.length === 0 && isSearchEmpty && (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  color: '#bfbfbf',
                  pointerEvents: 'none',
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                Chọn kết quả
              </span>
            )}
            <LimitInput
              ref={inputRef}
              value={searchHtml}
              onChange={handleSearchInputChange}
              placeholder=""
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 6,
            flexShrink: 0,
            width: 14,
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {hasClearAction && (
            <CloseCircleFilled
              className="result-filter-clear"
              onClick={handleClearAll}
              style={{
                fontSize: 12,
                color: 'rgba(0,0,0,0.25)',
                cursor: 'pointer',
                position: 'absolute',
              }}
            />
          )}
          <SearchOutlined
            className="result-filter-search-icon"
            style={{
              fontSize: 12,
              color: 'rgba(0,0,0,0.25)',
              position: 'absolute',
              display: open ? undefined : 'none',
            }}
          />
          <DownOutlined
            className="result-filter-arrow"
            style={{
              fontSize: 10,
              color: '#bfbfbf',
              display: open ? 'none' : undefined,
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </div>
    </Dropdown>
  );
};

export default ResultFilterControl;
