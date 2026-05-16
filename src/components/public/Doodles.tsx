export const CloudDoodle = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 40C25 25 35 15 50 15C55 15 60 17 65 20C70 10 85 10 95 20C105 30 100 45 90 50C95 60 85 75 70 70C65 75 50 80 40 70C25 75 10 65 15 50C5 45 5 30 15 20C20 15 25 15 25 40Z" fill="white" stroke="black" strokeWidth="6" strokeLinejoin="round"/>
        <path d="M40 30 Q45 25 50 35 T60 30" stroke="black" strokeWidth="4" strokeLinecap="round" fill="none"/>
    </svg>
);

export const DiagonalLinesDoodle = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="90" x2="90" y2="10" stroke="black" strokeWidth="6" strokeLinecap="round"/>
        <line x1="30" y1="90" x2="90" y2="30" stroke="black" strokeWidth="6" strokeLinecap="round"/>
        <line x1="50" y1="90" x2="90" y2="50" stroke="black" strokeWidth="6" strokeLinecap="round"/>
    </svg>
);

export const ZigzagYellowDoodle = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 50 L 30 10 L 50 40 L 70 10 L 90 40" stroke="black" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 50 L 30 10 L 50 40 L 70 10 L 90 40" stroke="#FACC15" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const StripedCloudDoodle = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id="diagonalStripes" width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="20" stroke="#bae6fd" strokeWidth="10" />
            </pattern>
        </defs>
        <path d="M50 80C50 50 70 30 100 30C110 30 120 34 130 40C140 20 170 20 190 40C210 60 200 90 180 100C190 120 170 150 140 140C130 150 100 160 80 140C50 150 20 130 30 100C10 90 10 60 30 40C40 30 50 30 50 80Z" fill="url(#diagonalStripes)" stroke="black" strokeWidth="8" strokeLinejoin="round"/>
    </svg>
);

export const OrangeBlobDoodle = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 10C70 5 90 20 95 40C100 60 85 85 60 90C35 95 10 80 5 60C0 40 30 15 50 10Z" fill="#F97316" stroke="black" strokeWidth="6" strokeLinejoin="round"/>
    </svg>
);

export const CyanPlusDoodle = ({ className }: { className?: string }) => (
    <div className={`relative ${className} text-info font-black text-4xl`}>
        <div className="absolute top-0 right-0 rotate-12">+</div>
        <div className="absolute top-8 right-8 rotate-45 scale-75">+</div>
        <div className="absolute top-12 right-0 rotate-[-15deg]">+</div>
    </div>
);
