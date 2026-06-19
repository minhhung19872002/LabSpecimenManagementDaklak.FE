import { ControllerRenderProps, FieldValues, Path } from "react-hook-form";

/**
 * Fix cho Ant Design Select + react-hook-form Controller khi dùng allowClear.
 * Khi clear, Select gọi onChange(undefined) nhưng field.value không reset đúng.
 * Helper này convert value để Select hiện placeholder khi empty.
 */
export const clearableSelectProps = <T extends FieldValues>(
  field: ControllerRenderProps<T, Path<T>>
) => ({
  ...field,
  value: field.value || undefined,
  onChange: (v: any) => field.onChange(v ?? null),
});
