import { type FC, type ReactNode, useRef, useState, useCallback, memo } from 'react';
import { Tooltip } from 'antd';

interface EllipsisTooltipProps {
  title: ReactNode;
  children?: ReactNode;
  html?: string;
}

const EllipsisTooltip: FC<EllipsisTooltipProps> = memo(({ title, children, html }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) {
      const el = ref.current;
      setVisible(el ? el.scrollWidth > el.clientWidth : false);
    } else {
      setVisible(false);
    }
  }, []);

  return (
    <Tooltip
      title={title}
      open={visible}
      onOpenChange={handleOpenChange}
      mouseEnterDelay={0.3}
    >
      {html !== undefined ? (
        <span ref={ref} className="sal-cell-ellipsis" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <span ref={ref} className="sal-cell-ellipsis">{children}</span>
      )}
    </Tooltip>
  );
});

EllipsisTooltip.displayName = 'EllipsisTooltip';

export default EllipsisTooltip;
