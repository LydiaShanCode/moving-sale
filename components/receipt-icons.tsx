type ReceiptIconProps = {
  size?: number;
  color?: string;
  className?: string;
};

const stroke = {
  fill: "none" as const,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 2,
};

export function ReceiptPackageIcon({ size = 24, color = "#000", className }: ReceiptIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke={color}
      className={className}
      aria-hidden
    >
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" {...stroke} />
      <path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        {...stroke}
      />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" {...stroke} />
      <line x1="12" y1="22.08" x2="12" y2="12" {...stroke} />
    </svg>
  );
}

export function ReceiptCheckIcon({ size = 20, color = "#000", className }: ReceiptIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke={color}
      className={className}
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" {...stroke} />
    </svg>
  );
}

export function ReceiptPlusIcon({ size = 22, color = "#000", className }: ReceiptIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke={color}
      className={className}
      aria-hidden
    >
      <line x1="12" y1="5" x2="12" y2="19" {...stroke} />
      <line x1="5" y1="12" x2="19" y2="12" {...stroke} />
    </svg>
  );
}

export function ReceiptLoaderIcon({ size = 18, color = "#000", className }: ReceiptIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke={color}
      className={className}
      aria-hidden
    >
      <line x1="12" y1="2" x2="12" y2="6" {...stroke} />
      <line x1="12" y1="18" x2="12" y2="22" {...stroke} />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" {...stroke} />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" {...stroke} />
      <line x1="2" y1="12" x2="6" y2="12" {...stroke} />
      <line x1="18" y1="12" x2="22" y2="12" {...stroke} />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" {...stroke} />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" {...stroke} />
    </svg>
  );
}
