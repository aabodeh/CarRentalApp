import Ionicons from '@expo/vector-icons/Ionicons';

import { iconSize } from '../theme';
import type { IconName } from './StateView';

export type TabIconProps = {
  /** The outline glyph, shown when the tab is not selected. */
  name: IconName;
  /** The filled glyph, shown when it is. */
  focusedName: IconName;
  focused: boolean;
  color: string;
};

/**
 * A tab's icon. The selected tab gets the filled glyph, so the difference is shape as well as
 * colour. Decorative: the tab itself carries the label.
 */
export default function TabIcon({ name, focusedName, focused, color }: TabIconProps) {
  return <Ionicons name={focused ? focusedName : name} size={iconSize.md} color={color} />;
}
