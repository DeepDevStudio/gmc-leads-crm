import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { importCustomers, checkDuplicates } from '../services/bulkImportService';

const BulkImportPage = () => {
    const [file, setFile] = useState(null);
    const [data, setData] = useState([]);
    const [preview, setPreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [duplicates, setDuplicates] = useState([]);
    const [importResult, setImportResult] = useState(null);
    const [step, setStep] = useState(1);
    const [progress, setProgress] = useState(0);
    const [skipDuplicates, setSkipDuplicates] = useState(true);

    const handleFileUpload = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setLoading(true);
        setMessage(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const workbook = XLSX.read(event.target.result, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                
                const mappedData = jsonData.map(row => {
                    const keys = Object.keys(row);
                    let phone = '';
                    let name = '';
                    let interest = '';

                    keys.forEach(key => {
                        const lowerKey = key.toLowerCase();
                        if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('number')) {
                            phone = row[key] ? String(row[key]).trim() : '';
                        } else if (lowerKey.includes('name') || lowerKey.includes('customer')) {
                            name = row[key] ? String(row[key]).trim() : '';
                        } else if (lowerKey.includes('interest') || lowerKey.includes('yatra') || lowerKey.includes('location')) {
                            interest = row[key] ? String(row[key]).trim() : '';
                        }
                    });

                    if (!phone && keys.length > 0) {
                        const firstKey = keys[0];
                        const val = row[firstKey];
                        if (val && String(val).match(/^\d{10}$/)) {
                            phone = String(val).trim();
                        }
                    }

                    if (!name && keys.length > 1) {
                        const secondKey = keys[1];
                        const val = row[secondKey];
                        if (val && !String(val).match(/^\d{10}$/)) {
                            name = String(val).trim();
                        }
                    }

                    return { phone, name, interest };
                });

                const validData = mappedData.filter(row => row.phone && row.phone.length >= 10);
                
                setData(validData);
                setPreview(validData.slice(0, 10));
                setStep(2);
                
                const phones = validData.map(row => row.phone);
                checkDuplicates(phones).then(result => {
                    setDuplicates(result.duplicates || []);
                });

                setMessage({
                    text: `✅ ${validData.length} valid records found.`,
                    type: 'success'
                });
            } catch (error) {
                console.error('Error reading file:', error);
                setMessage({ text: '❌ Failed to read file. Please make sure it\'s a valid Excel or CSV file.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleImport = async () => {
        setLoading(true);
        setMessage(null);
        setProgress(0);
        
        try {
            let customersToImport = data;
            let duplicateCount = duplicates.length;

            if (skipDuplicates) {
                customersToImport = data.filter(row => !duplicates.includes(row.phone));
            }

            if (customersToImport.length === 0) {
                setMessage({ text: '⚠️ No new customers to import. All records already exist or are duplicates.', type: 'warning' });
                setLoading(false);
                return;
            }

            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 500);

            const result = await importCustomers({ 
                customers: customersToImport,
                skipDuplicates: skipDuplicates 
            });
            
            clearInterval(progressInterval);
            setProgress(100);
            setImportResult(result);
            setStep(3);
            setMessage({
                text: result.message || `✅ Import complete!`,
                type: 'success'
            });
        } catch (error) {
            console.error('Error importing:', error);
            if (error.response?.status === 504) {
                setMessage({ text: '❌ Import timed out. Try again with fewer records or contact support.', type: 'error' });
            } else {
                setMessage({ text: `❌ Failed to import customers: ${error.message}`, type: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    const resetImport = () => {
        setFile(null);
        setData([]);
        setPreview([]);
        setDuplicates([]);
        setImportResult(null);
        setStep(1);
        setMessage(null);
        setProgress(0);
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">📤 Bulk Import</h1>
                <p className="text-gray-500">Import customers from Excel or CSV files</p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl mb-4 ${message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : message.type === 'warning' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                    {message.text}
                </div>
            )}

            {step === 1 && (
                <div className="bg-white rounded-2xl shadow border p-8 text-center">
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 hover:border-yellow-400 transition">
                        <div className="text-6xl mb-4">📁</div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">Upload Excel/CSV File</h2>
                        <p className="text-gray-500 mb-4">Drag & drop or click to browse</p>
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                            disabled={loading}
                        />
                        {loading && (
                            <div className="mt-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
                                <p className="text-gray-500 mt-2">Reading file...</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 text-sm text-gray-400">
                        <p>Supported formats: .xlsx, .xls, .csv</p>
                        <p className="mt-1">Columns: Phone (required), Name, Interest</p>
                    </div>
                </div>
            )}

            {step === 2 && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
                            <p className="text-sm text-gray-500">Total Records</p>
                            <p className="text-2xl font-bold text-blue-600">{data.length}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
                            <p className="text-sm text-gray-500">New Customers</p>
                            <p className="text-2xl font-bold text-green-600">{data.length - duplicates.length}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500">
                            <p className="text-sm text-gray-500">Duplicates</p>
                            <p className="text-2xl font-bold text-yellow-600">{duplicates.length}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500">
                            <p className="text-sm text-gray-500">Unique Interests</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {[...new Set(data.map(r => r.interest).filter(Boolean))].length}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow border p-4 mb-4 flex flex-wrap justify-between items-center gap-3">
                        <div>
                            <span className="font-medium">📄 {file?.name}</span>
                            <span className="text-gray-400 ml-4">{data.length} rows</span>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={skipDuplicates}
                                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                                    className="w-4 h-4 accent-yellow-400"
                                />
                                Skip Duplicates
                            </label>
                            <button onClick={resetImport} className="text-gray-500 hover:text-red-500 text-sm">
                                ✕ Change File
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow border overflow-hidden mb-4">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-semibold">Preview (First 10 rows)</h3>
                            <span className="text-sm text-gray-400">
                                {duplicates.length > 0 && `${duplicates.length} duplicates found`}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">#</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Phone</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Name</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Interest</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {preview.map((row, index) => {
                                        const isDuplicate = duplicates.includes(row.phone);
                                        return (
                                            <tr key={index} className={isDuplicate ? 'bg-yellow-50' : ''}>
                                                <td className="px-4 py-2 text-sm text-gray-600">{index + 1}</td>
                                                <td className="px-4 py-2 text-sm font-mono">{row.phone}</td>
                                                <td className="px-4 py-2 text-sm">{row.name || '-'}</td>
                                                <td className="px-4 py-2 text-sm">
                                                    {row.interest ? (
                                                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                                                            {row.interest}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-sm">
                                                    {isDuplicate ? (
                                                        <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">⚠️ Duplicate</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">✅ New</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {data.length > 10 && (
                                <div className="p-2 text-center text-sm text-gray-400 border-t">
                                    + {data.length - 10} more rows
                                </div>
                            )}
                        </div>
                    </div>

                    {loading && (
                        <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Importing...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Processing {data.length - duplicates.length} customers...
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleImport}
                            disabled={loading || data.length === 0}
                            className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></span>
                                    Importing...
                                </>
                            ) : (
                                `📤 Import All (${data.length - duplicates.length} new)`
                            )}
                        </button>
                        <button onClick={resetImport} className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-xl font-semibold transition">
                            Cancel
                        </button>
                    </div>
                </>
            )}

            {step === 3 && importResult && (
                <div className="bg-white rounded-2xl shadow border p-8 text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Import Complete!</h2>
                    <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-6">
                        <div className="bg-green-50 p-4 rounded-xl">
                            <p className="text-sm text-gray-500">Inserted</p>
                            <p className="text-3xl font-bold text-green-600">{importResult.inserted}</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-xl">
                            <p className="text-sm text-gray-500">Duplicates</p>
                            <p className="text-3xl font-bold text-yellow-600">{importResult.duplicate || 0}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-xl">
                            <p className="text-sm text-gray-500">Skipped</p>
                            <p className="text-3xl font-bold text-red-600">{importResult.skipped || 0}</p>
                        </div>
                    </div>
                    <p className="text-gray-500 mb-4">
                        {importResult.message || `${importResult.inserted} new customers added to your CRM!`}
                    </p>
                    <div className="flex gap-3 justify-center flex-wrap">
                        <button onClick={() => window.location.href = '/customers'} className="bg-yellow-400 hover:bg-yellow-500 px-6 py-2 rounded-xl font-semibold transition">
                            👥 View Customers
                        </button>
                        <button onClick={() => window.location.href = '/dashboard'} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold transition">
                            📊 Dashboard
                        </button>
                        <button onClick={resetImport} className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded-xl font-semibold transition">
                            📤 Import More
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkImportPage;
