import React from 'react';

interface IconProps {
    className?: string;
    size?: number;
}

export const Icons = {
    Wifi: ({ size = 14, className }: IconProps) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="white" className={className}>
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
        </svg>
    ),

    Signal: ({ size = 14, className }: IconProps) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="white" className={className}>
            <path d="M2 22h2V12H2v10zm4 0h2V8H6v14zm4 0h2V4h-2v18zm4 0h2V2h-2v20zm4 0h2V6h-2v16z" fillOpacity="0.9" />
        </svg>
    ),

    Battery: ({ level = 74, size = 20 }: { level?: number; size?: number }) => (
        <svg width={size} height={size * 0.5} viewBox="0 0 24 12" fill="white">
            <rect x="1" y="1" width="18" height="10" rx="2" stroke="white" strokeWidth="1.5" fill="none" />
            <rect x="20" y="4" width="2" height="4" rx="0.5" fill="white" />
            <rect x="2.5" y="2.5" width={Math.min(15, (level / 100) * 15)} height="7" rx="1" fill="white" />
        </svg>
    ),

    Back: ({ size = 22, className }: IconProps) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className={className}>
            <path d="M15 18l-6-6 6-6" />
        </svg>
    ),

    Video: ({ size = 20, className }: IconProps) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="white" className={className}>
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
        </svg>
    ),

    Phone: ({ size = 18, className }: IconProps) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="white" className={className}>
            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
        </svg>
    ),

    Menu: ({ size = 20, className }: IconProps) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="white" className={className}>
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
    ),

    Emoji: ({ size = 24, className }: IconProps) => (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#8696a0" className={className}>
            <path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.02 18.423 23.02 12.228c.001-6.195-5.021-11.217-11.216-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159zm3.108-9.751c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z" />
        </svg>
    ),

    Attachment: ({ size = 22, className }: IconProps) => (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#8696a0" className={className}>
            <path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.572.572 0 0 0-.834.018l-7.205 7.207a5.577 5.577 0 0 0-1.645 3.971z" />
        </svg>
    ),

    Camera: ({ size = 22, className }: IconProps) => (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="#8696a0" className={className}>
            <path d="M21.317 4.381H10.971L9.078 2.45a.544.544 0 0 0-.39-.16H5.313a.544.544 0 0 0-.39.16L3.031 4.381H2.683a2.26 2.26 0 0 0-2.26 2.26v11.26a2.26 2.26 0 0 0 2.26 2.26h18.634a2.26 2.26 0 0 0 2.26-2.26V6.641a2.26 2.26 0 0 0-2.26-2.26zM12 17.031a5.042 5.042 0 0 1-5.036-5.036A5.042 5.042 0 0 1 12 6.959a5.042 5.042 0 0 1 5.036 5.036A5.042 5.042 0 0 1 12 17.031z" />
            <circle cx="12" cy="11.995" r="3.398" />
        </svg>
    ),

    Mic: ({ size = 20, className }: IconProps) => (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="white" className={className}>
            <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z" />
        </svg>
    ),

    SingleTick: ({ size = 16, className }: IconProps) => (
        <svg viewBox="0 0 16 15" width={size} height={size} fill="white" className={className}>
            <path d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
        </svg>
    ),

    DoubleTick: ({ size = 16, color = '#53bdeb', className }: { size?: number; color?: string; className?: string }) => (
        <svg viewBox="0 0 16 11" width={size} height={size * 0.6875} fill={color} className={className}>
            <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.136.475.475 0 0 0-.347.136.47.47 0 0 0 0 .678l2.728 2.58a.46.46 0 0 0 .312.117.478.478 0 0 0 .37-.166l6.553-8.089a.472.472 0 0 0 0-.56z" />
            <path d="M15.229.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.2-1.133a.449.449 0 0 0-.027.678l1.227 1.16a.46.46 0 0 0 .312.117.478.478 0 0 0 .37-.166l6.193-7.808a.472.472 0 0 0 0-.56z" />
        </svg>
    ),
};
