import React from 'react';

const ReceiptLogos = () => {
    return (
        <div className="flex items-center justify-center gap-6">
            {/* GetMe Logo */}
            <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-lg shadow-md">
                    GM
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight leading-none">
                        Get<span className="text-yellow-500">Me</span>
                    </h1>
                    <p className="text-[10px] text-gray-400 font-medium tracking-[0.2em] uppercase">Travel & Tours</p>
                </div>
            </div>

            <div className="w-px h-14 bg-gray-300"></div>

            {/* Cab Logo */}
            <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    C
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight leading-none">
                        <span className="text-gray-800">Cab</span>
                    </h1>
                    <p className="text-[10px] text-gray-400 font-medium tracking-[0.2em] uppercase">Booking Made Simple</p>
                </div>
            </div>
        </div>
    );
};

export default ReceiptLogos;
