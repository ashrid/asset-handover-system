import React from 'react';

const Skeleton = ({ variant = 'line', className = '', count = 1, width = 'w-full', height = 'h-4' }) => {
  const baseClasses = 'animate-shimmer bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-[length:200%_100%] rounded-md';

  const variantDefaults = {
    line: '',
    card: 'rounded-xl',
    tableRow: 'mb-2',
    avatar: 'rounded-full',
    text: 'mb-2',
    button: 'rounded-lg'
  };

  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${width} ${height} ${variantDefaults[variant] || ''} ${className}`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </>
  );
};

export default Skeleton;