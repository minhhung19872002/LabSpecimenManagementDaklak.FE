import React from "react";
import { Select, Grid } from "antd";
import type { SelectProps, RefSelectProps } from "antd/es/select";

const { useBreakpoint } = Grid;

/**
 * Ant Design Select wrapper that fixes height collapse bug with
 * `mode="multiple" maxTagCount="responsive"` after browser resize.
 *
 * Forces remount when breakpoint changes so the responsive tag
 * calculation runs fresh.
 */
const ResponsiveSelect = React.forwardRef<RefSelectProps, SelectProps>(
  (props, ref) => {
    const screens = useBreakpoint();
    const breakpointKey = Object.entries(screens)
      .filter(([, active]) => active)
      .map(([bp]) => bp)
      .join(",");

    return <Select ref={ref} key={breakpointKey} {...props} />;
  },
);

ResponsiveSelect.displayName = "ResponsiveSelect";

export default ResponsiveSelect;
