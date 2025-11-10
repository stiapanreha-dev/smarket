import React from 'react';
import { Card as BSCard, CardProps as BSCardProps } from 'react-bootstrap';

export interface CardProps extends Omit<BSCardProps, 'bg' | 'border'> {
  /** Card header content */
  header?: React.ReactNode;

  /** Card footer content */
  footer?: React.ReactNode;

  /** Card image at the top */
  image?: string;

  /** Image alt text */
  imageAlt?: string;

  /** Image height */
  imageHeight?: string | number;

  /** Card title */
  title?: React.ReactNode;

  /** Card subtitle */
  subtitle?: React.ReactNode;

  /** Card body content */
  children?: React.ReactNode;

  /** Background variant */
  bg?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark'
    | 'white';

  /** Border variant */
  border?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark';

  /** Text variant */
  text?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'white' | 'muted';

  /** Hoverable effect */
  hoverable?: boolean;

  /** Clickable card */
  onClick?: () => void;

  /** Additional className */
  className?: string;

  /** Loading state */
  loading?: boolean;
}

/**
 * Reusable Card component for products, services, and other content
 */
export const Card: React.FC<CardProps> = ({
  header,
  footer,
  image,
  imageAlt = 'Card image',
  imageHeight,
  title,
  subtitle,
  children,
  bg,
  border,
  text,
  hoverable = false,
  onClick,
  className = '',
  loading = false,
  ...rest
}) => {
  const hoverableClass = hoverable ? 'card-hoverable' : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';

  const handleClick = () => {
    if (onClick && !loading) {
      onClick();
    }
  };

  return (
    <BSCard
      bg={bg}
      border={border}
      text={text}
      className={`${hoverableClass} ${clickableClass} ${className}`.trim()}
      onClick={handleClick}
      {...rest}
    >
      {image && (
        <BSCard.Img
          variant="top"
          src={image}
          alt={imageAlt}
          style={imageHeight ? { height: imageHeight, objectFit: 'cover' } : undefined}
        />
      )}
      {header && <BSCard.Header>{header}</BSCard.Header>}
      <BSCard.Body>
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {title && <BSCard.Title>{title}</BSCard.Title>}
            {subtitle && <BSCard.Subtitle className="mb-2 text-muted">{subtitle}</BSCard.Subtitle>}
            {children && <BSCard.Text as="div">{children}</BSCard.Text>}
          </>
        )}
      </BSCard.Body>
      {footer && <BSCard.Footer>{footer}</BSCard.Footer>}
    </BSCard>
  );
};

export default Card;
