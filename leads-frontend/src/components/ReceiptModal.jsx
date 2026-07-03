import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';

const ReceiptModal = ({ receipt, onClose }) => {
    const printRef = useRef();
    const [contactNumber, setContactNumber] = useState('+91 8010320000');

    useEffect(() => {
        const savedSettings = localStorage.getItem('companySettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            if (settings.contactNumber) {
                setContactNumber(settings.contactNumber);
            }
        }
    }, []);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        pageStyle: `
            @page { 
                margin: 0; 
                size: A4;
            }
            @media print {
                body { 
                    margin: 0; 
                    padding: 20px; 
                    background: #fff;
                }
                .no-print { 
                    display: none !important; 
                }
                .receipt-container {
                    box-shadow: none !important;
                    border: 1px solid #e5e7eb !important;
                }
            }
        `,
    });

    if (!receipt) return null;

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount || 0).toFixed(2)}`;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
                {/* Actions */}
                <div className="sticky top-0 bg-white z-10 p-4 border-b flex justify-between items-center no-print rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-800">🧾 Payment Receipt</h2>
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrint}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition flex items-center gap-2"
                        >
                            🖨️ Print / PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-lg transition"
                        >
                            ✕ Close
                        </button>
                    </div>
                </div>

                {/* Receipt Content */}
                <div ref={printRef} className="p-8 bg-white receipt-container">
                    {/* Header with Logos - Using plain text with colors */}
                    <div className="text-center border-b-4 border-yellow-400 pb-6">
                        <div className="flex justify-center items-center gap-8">
                            {/* GetMe Logo - Text based */}
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <span className="text-3xl font-extrabold text-gray-800">Get</span>
                                    <span className="text-3xl font-extrabold text-yellow-500">Me</span>
                                </div>
                                <p className="text-[10px] text-gray-400 tracking-[0.2em] uppercase mt-1">Travel & Tours</p>
                            </div>

                            <div className="w-px h-12 bg-gray-300"></div>

                            {/* Cab Logo - Text based */}
                            <div className="text-center">
                                <div className="flex items-center justify-center">
                                    <span className="text-3xl font-extrabold text-yellow-500">Cab</span>
                                </div>
                                <p className="text-[10px] text-gray-400 tracking-[0.2em] uppercase mt-1">Booking Made Simple</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-3 tracking-[0.3em] uppercase">Official Payment Receipt</p>
                    </div>

                    <div className="flex justify-center gap-2 mt-4">
                        <span className="w-12 h-1 bg-yellow-400 rounded-full"></span>
                        <span className="w-6 h-1 bg-yellow-200 rounded-full"></span>
                        <span className="w-12 h-1 bg-yellow-400 rounded-full"></span>
                    </div>

                    {/* Receipt Info */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Receipt Number</p>
                            <p className="font-bold text-gray-800 text-sm tracking-wider">{receipt.receipt_number || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-right">
                            <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Date</p>
                            <p className="font-bold text-gray-800 text-sm">{formatDate(receipt.receipt_date)}</p>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mt-4 border border-yellow-200">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Customer</p>
                                <p className="font-bold text-gray-800 text-base">{receipt.customer_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Phone</p>
                                <p className="font-bold text-gray-800 text-base">{receipt.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Yatra Details */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Yatra / Tour</p>
                                <p className="font-bold text-gray-800">{receipt.yatra_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Seats</p>
                                <p className="font-bold text-gray-800">{receipt.seats || 0}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Rate Per Seat</p>
                                <p className="font-bold text-gray-800">{formatCurrency(receipt.rate_per_seat || 0)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="mt-4">
                        <div className="bg-gray-100 rounded-t-lg px-4 py-2">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Payment Summary</p>
                        </div>
                        <table className="w-full">
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 px-4 text-gray-600 font-medium">Total Yatra Charge</td>
                                    <td className="text-right py-3 px-4 font-bold text-gray-800">
                                        {formatCurrency(receipt.total_amount || 0)}
                                    </td>
                                </tr>
                                {receipt.discount > 0 && (
                                    <tr className="border-b border-gray-100">
                                        <td className="py-3 px-4 text-green-600">🎯 Discount</td>
                                        <td className="text-right py-3 px-4 text-green-600">
                                            -{formatCurrency(receipt.discount)}
                                        </td>
                                    </tr>
                                )}
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 px-4 text-blue-600 font-medium">💳 Amount Received</td>
                                    <td className="text-right py-3 px-4 text-blue-600 font-bold">
                                        {formatCurrency(receipt.advance_amount || 0)}
                                    </td>
                                </tr>
                                <tr className="bg-gradient-to-r from-red-50 to-orange-50">
                                    <td className="py-4 px-4 font-bold text-gray-800 text-lg">⚡ Balance Due</td>
                                    <td className="text-right py-4 px-4 font-bold text-red-600 text-2xl">
                                        {formatCurrency(receipt.balance_amount || 0)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Payment Info */}
                    <div className="mt-4 border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Payment Mode</p>
                                <p className="font-bold text-gray-800">{receipt.payment_mode || 'Cash'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Received By</p>
                                <p className="font-bold text-gray-800">{receipt.received_by || 'GMC'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Blessing */}
                    <div className="mt-4 text-center py-3 border-t border-yellow-200">
                        <p className="text-sm text-gray-600 italic">
                            🙏 May your pilgrimage be successful. Wishes fulfilled.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t-2 border-yellow-400 text-center">
                        <p className="text-sm text-gray-500">
                            For queries, contact us at 📞 <span className="font-bold text-blue-600">{contactNumber}</span>
                        </p>
                        <div className="mt-2 flex justify-center items-center gap-3 text-xs text-gray-400">
                            <span>📍 Delhi NCR</span>
                            <span className="w-px h-3 bg-gray-300"></span>
                            <span>📧 info@getmecab.com</span>
                            <span className="w-px h-3 bg-gray-300"></span>
                            <span>🌐 www.getmecab.com</span>
                        </div>
                        <div className="mt-2 flex justify-center gap-4 text-xs text-gray-400">
                            <span>✨ Cab booking made simple!</span>
                        </div>
                        <div className="mt-2 flex justify-center items-center gap-2">
                            <span className="text-xs text-gray-300">GetMe</span>
                            <span className="text-xs font-bold text-yellow-500">Cab</span>
                            <span className="text-xs text-gray-300 ml-2">•</span>
                            <span className="text-xs text-gray-300">Authorized Travel Partner</span>
                        </div>
                        <p className="text-[10px] text-gray-300 mt-2">
                            This is a computer generated receipt. Valid without signature. Subject to Delhi jurisdiction.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
