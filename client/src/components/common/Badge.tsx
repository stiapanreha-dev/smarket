import React from 'react';
import { Badge as BSBadge, type BadgeProps as BSBadgeProps } from 'react-bootstrap';

export interface BadgeProps extends Omit<BSBadgeProps, 'bg'> {
  /** Badge variant */
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark';

  /** Badge content */
  children: React.ReactNode;

  /** Pill-shaped badge */
  pill?: boolean;

  /** Icon to display before text */
  icon?: React.ReactNode;

  /** Dot indicator */
  dot?: boolean;

  /** Additional className */
  className?: string;
}

/**
 * Badge component - displays status badges and labels
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  children,
  pill = false,
  icon,
  dot = false,
  className = '',
  ...rest
}) => {
  return (
    <BSBadge
      bg={variant}
      pill={pill}
      className={`${className}`.trim()}
      {...rest}
    >
      {dot && (
        <span
          className="badge-dot me-1"
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
          }}
        />
      )}
      {icon && <span className="me-1">{icon}</span>}
      {children}
    </BSBadge>
  );
};

export default Badge;
