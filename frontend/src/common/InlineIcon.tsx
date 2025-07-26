import React from 'react';

const InlineIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span style={{ display: 'inline-block', transform: 'translateY(0.3rem)' }}>
        {children}
    </span>
);

export default InlineIcon;
