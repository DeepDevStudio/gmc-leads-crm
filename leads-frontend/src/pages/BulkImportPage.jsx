import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { importCustomers, checkDuplicates } from '../services/bulkImportService';

const BulkImportPage = () => {
    const [file, setFile] = useState(null);
    const [data, setData] = useState([]);
    const [preview, setPreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [duplicates, setDuplicates] = useState([]);
    const [importResult, setImportResult] = useState(null);
    const [step, setStep] = useState(1);
    const [progress, setProgress] = useState(0);
    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [showFullPreview, setShowFullPreview] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [fieldMapping, setFieldMapping] = useState({});
    const [showMapping, setShowMapping] = useState(false);
    const [errorLog, setErrorLog] = useState([]);
    const [importHistory, setImportHistory] = useState([]);
    const fileInputRef = useRef(null);

    // ===== DARK MODE =====
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // ===== DOWNLOAD TEMPLATE =====
    const downloadTemplate = () => {
        const template = [
            { 'Phone *': '9876543210', 'Name': 'John Doe', 'Interest': 'Haridwar Yatra', 'Location': 'Delhi' },
            { 'Phone *': '9876543211', 'Name': 'Jane Smith', 'Interest': 'Rishikesh Camping', 'Location': 'Gurgaon' },
        ];
        
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Customers');
        XLSX.writeFile(wb, 'customer_import_template.xlsx');
        
        showMessage('📥 Template downloaded!', 'success');
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleFileUpload = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const processFile = (selectedFile) => {
        const fileType = selectedFile.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(fileType)) {
            setMessage({ 
                text: '❌ Please upload a valid Excel (.xlsx, .xls) or CSV file.', 
                type: 'error' 
            });
            return;
        }

        setFile(selectedFile);
        setLoading(true);
        setMessage(null);
        setImportResult(null);
        setStep(1);
        setErrorLog([]);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const workbook = XLSX.read(event.target.result, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                
                if (jsonData.length === 0) {
                    setMessage({ 
                        text: '❌ File is empty. Please check your file.', 
                        type: 'error' 
                    });
                    setLoading(false);
                    return;
                }

                const headers = Object.keys(jsonData[0]);
                const autoMapping = {};
                const errors = [];

                headers.forEach(key => {
                    const lowerKey = key.toLowerCase();
                    if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('number') || lowerKey.includes('whatsapp')) {
                        autoMapping[key] = 'phone';
                    } else if (lowerKey.includes('name') || lowerKey.includes('customer') || lowerKey.includes('full name') || lowerKey.includes('person')) {
                        autoMapping[key] = 'name';
                    } else if (lowerKey.includes('interest') || lowerKey.includes('yatra') || lowerKey.includes('tour') || lowerKey.includes('package')) {
                        autoMapping[key] = 'interest';
                    } else if (lowerKey.includes('location') || lowerKey.includes('city') || lowerKey.includes('address') || lowerKey.includes('place')) {
                        autoMapping[key] = 'location';
                    }
                });

                const phoneColumn = Object.keys(autoMapping).find(key => autoMapping[key] === 'phone');
                if (!phoneColumn) {
                    let foundPhoneCol = null;
                    for (const row of jsonData) {
                        for (const [key, value] of Object.entries(row)) {
                            const val = String(value || '').trim().replace(/\s/g, '');
                            if (val.match(/^\d{10}$/)) {
                                foundPhoneCol = key;
                                break;
                            }
                        }
                        if (foundPhoneCol) break;
                    }
                    if (foundPhoneCol) {
                        autoMapping[foundPhoneCol] = 'phone';
                    } else {
                        errors.push('Could not auto-detect phone column. Please map manually.');
                    }
                }

                setFieldMapping(autoMapping);
                setShowMapping(true);
                setMessage({ 
                    text: `📊 Found ${jsonData.length} rows. Please verify column mapping below.`, 
                    type: 'info' 
                });
                setLoading(false);
                setData(jsonData);
                setPreview(jsonData.slice(0, 10));

            } catch (error) {
                console.error('Error reading file:', error);
                setMessage({ 
                    text: '❌ Failed to read file. Please make sure it\'s a valid Excel or CSV file.', 
                    type: 'error' 
                });
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleMappingChange = (header, field) => {
        setFieldMapping(prev => ({
            ...prev,
            [header]: field
        }));
    };

    const confirmMapping = () => {
        const phoneColumn = Object.keys(fieldMapping).find(key => fieldMapping[key] === 'phone');
        if (!phoneColumn) {
            setMessage({ 
                text: '❌ Please map a column to "Phone" field.', 
                type: 'error' 
            });
            return;
        }

        setShowMapping(false);
        setStep(2);

        const mappedData = data.map(row => {
            const phone = row[phoneColumn] ? String(row[phoneColumn]).trim().replace(/\s/g, '') : '';
            const nameCol = Object.keys(fieldMapping).find(key => fieldMapping[key] === 'name');
            const interestCol = Object.keys(fieldMapping).find(key => fieldMapping[key] === 'interest');
            const locationCol = Object.keys(fieldMapping).find(key => fieldMapping[key] === 'location');

            return {
                phone,
                name: nameCol ? String(row[nameCol] || '').trim() : '',
                interest: interestCol ? String(row[interestCol] || '').trim() : '',
                location: locationCol ? String(row[locationCol] || '').trim() : '',
            };
        });

        const validData = mappedData.filter(row => row.phone && row.phone.length >= 10);
        const errorRows = mappedData.filter(row => !row.phone || row.phone.length < 10);
        
        if (errorRows.length > 0) {
            setErrorLog(errorRows.map((row, index) => ({
                row: index + 1,
                error: 'Invalid or missing phone number',
                data: row
            })));
        }

        if (validData.length === 0) {
            setMessage({ 
                text: '❌ No valid records found. Please ensure your file has phone numbers in 10-digit format.', 
                type: 'error' 
            });
            setLoading(false);
            return;
        }

        setData(validData);
        setPreview(validData.slice(0, 10));
        
        const phones = validData.map(row => row.phone);
        checkDuplicates(phones).then(result => {
            setDuplicates(result.duplicates || []);
        });

        setMessage({
            text: `✅ ${validData.length} valid records found. ${errorRows.length} rows were skipped.`,
            type: 'success'
        });
        setLoading(false);
    };

    const handleImport = async () => {
        setActionLoading(true);
        setMessage(null);
        setProgress(0);
        setErrorLog([]);
        
        try {
            let customersToImport = data;
            let duplicateCount = duplicates.length;

            if (duplicateCount > 0 && skipDuplicates) {
                const duplicatePhones = new Set(duplicates.map(d => d.phone));
                customersToImport = data.filter(row => !duplicatePhones.has(row.phone));
            }

            if (customersToImport.length === 0) {
                setMessage({ 
                    text: '⚠️ No new customers to import (all are duplicates).', 
                    type: 'warning' 
                });
                setActionLoading(false);
                return;
            }

            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const result = await importCustomers(customersToImport, skipDuplicates);
            
            clearInterval(progressInterval);
            setProgress(100);
            
            if (result.errors && result.errors.length > 0) {
                setErrorLog(result.errors);
            }
            
            setImportResult({
                imported: result.inserted || customersToImport.length,
                skipped: result.skipped || 0,
                duplicates: duplicateCount,
                total: data.length,
                errors: result.errors || []
            });
            
            setStep(3);
            
            const historyEntry = {
                id: Date.now(),
                date: new Date().toISOString(),
                fileName: file?.name || 'Unknown',
                total: data.length,
                imported: result.inserted || 0,
                skipped: result.skipped || 0,
                duplicates: duplicateCount,
                errors: (result.errors || []).length
            };
            setImportHistory(prev => [historyEntry, ...prev].slice(0, 20));

            setMessage({
                text: `✅ Successfully imported ${result.inserted || customersToImport.length} customers!`,
                type: 'success'
            });
        } catch (error) {
            console.error('Import error:', error);
            setErrorLog(prev => [...prev, {
                row: 'All',
                error: error.response?.data?.error || error.message,
                data: null
            }]);
            setMessage({ 
                text: `❌ Import failed: ${error.response?.data?.error || error.message}`, 
                type: 'error' 
            });
        } finally {
            clearInterval(progressInterval);
            setActionLoading(false);
        }
    };

    const resetImport = () => {
        setFile(null);
        setData([]);
        setPreview([]);
        setStep(1);
        setProgress(0);
        setMessage(null);
        setImportResult(null);
        setDuplicates([]);
        setErrorLog([]);
        setShowMapping(false);
        setFieldMapping({});
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const getDuplicateCount = () => duplicates.length;
    const getUniqueCount = () => data.length - getDuplicateCount();

    return (
        <div className={`p-6 max-w-7xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">📤 Bulk Import</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Import customers from Excel or CSV files</p>
                </div>
                <button
                    onClick={downloadTemplate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm"
                >
                    📥 Download Template
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl mb-4 ${
                    message.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700' :
                    message.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700' :
                    message.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700' :
                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'
                }`}>
                    {message.text}
                </div>
            )}

            {errorLog.length > 0 && step === 3 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4 border border-red-200 dark:border-red-700">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-red-700 dark:text-red-400">⚠️ Error Log ({errorLog.length} errors)</h3>
                        <button
                            onClick={() => setErrorLog([])}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                        {errorLog.map((err, index) => (
                            <div key={index} className="text-sm text-red-600 dark:text-red-400 py-1 border-b border-red-100 dark:border-red-800 last:border-0">
                                {err.row !== undefined ? `Row ${err.row + 1}: ` : ''}{err.error}
                                {err.data && ` (${JSON.stringify(err.data)})`}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 1: Upload */}
            {step === 1 && (
                <>
                    <div
                        className={`bg-white dark:bg-slate-800 rounded-lg shadow p-8 border-2 border-dashed text-center transition-all ${
                            isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-slate-600'
                        }`}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <div className="text-6xl mb-4">📂</div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Upload Your File</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-2">Drag & drop or click to browse</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">Supported formats: .xlsx, .xls, .csv</p>
                        <input
                            ref={fileInputRef}
                            id="fileInput"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-800/30 cursor-pointer"
                            disabled={loading}
                        />
                        {loading && (
                            <div className="mt-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Processing file...</p>
                            </div>
                        )}
                        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                            <p>💡 First row should contain column headers</p>
                            <p>📱 Phone column must contain 10-digit numbers</p>
                            <p>🏷️ Interest column for customer interests</p>
                        </div>
                    </div>

                    {/* Field Mapping */}
                    {showMapping && Object.keys(fieldMapping).length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mt-4 border border-gray-200 dark:border-slate-700">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-3">📋 Column Mapping</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Verify that each column is mapped correctly:</p>
                            <div className="grid md:grid-cols-2 gap-3">
                                {Object.keys(fieldMapping).map(header => (
                                    <div key={header} className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">{header}</span>
                                        <span className="text-gray-400 dark:text-gray-500">→</span>
                                        <select
                                            value={fieldMapping[header]}
                                            onChange={(e) => handleMappingChange(header, e.target.value)}
                                            className="flex-1 p-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white"
                                        >
                                            <option value="">Skip</option>
                                            <option value="phone">Phone</option>
                                            <option value="name">Name</option>
                                            <option value="interest">Interest</option>
                                            <option value="location">Location</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={confirmMapping}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                                >
                                    ✅ Confirm Mapping
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Import History */}
                    {importHistory.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mt-4 border border-gray-200 dark:border-slate-700">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-2">📋 Recent Imports</h3>
                            <div className="max-h-48 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400">Date</th>
                                            <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400">File</th>
                                            <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">Total</th>
                                            <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">Imported</th>
                                            <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                        {importHistory.map((entry) => (
                                            <tr key={entry.id}>
                                                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                                    {new Date(entry.date).toLocaleDateString('en-IN')}
                                                </td>
                                                <td className="px-3 py-2 text-gray-800 dark:text-white truncate max-w-[150px]">
                                                    {entry.fileName}
                                                </td>
                                                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{entry.total}</td>
                                                <td className="px-3 py-2 text-center text-green-600 dark:text-green-400">{entry.imported}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        entry.errors > 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    }`}>
                                                        {entry.errors > 0 ? `⚠️ ${entry.errors} errors` : '✅ Complete'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Step 2: Preview */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Records</p>
                            <p className="text-2xl font-bold dark:text-white">{data.length}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-green-500">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">New Customers</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{getUniqueCount()}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-yellow-500">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Duplicates</p>
                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{getDuplicateCount()}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-purple-500">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Progress</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full">
                                    <div 
                                        className="h-2 bg-purple-500 rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-bold dark:text-white">{progress}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-slate-700">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-2">
                            <h3 className="font-bold text-gray-800 dark:text-white">📋 Preview ({preview.length} of {data.length} records)</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowFullPreview(!showFullPreview)}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                >
                                    {showFullPreview ? 'Show Less' : 'Show All'}
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">#</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Phone</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Name</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Interest</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Location</th>
                                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {(showFullPreview ? data : preview).map((row, index) => {
                                        const isDuplicate = duplicates.some(d => d.phone === row.phone);
                                        return (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                                                <td className="px-4 py-2 text-sm font-mono dark:text-white">{row.phone}</td>
                                                <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">{row.name}</td>
                                                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{row.interest || '-'}</td>
                                                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{row.location || '-'}</td>
                                                <td className="px-4 py-2 text-center">
                                                    {isDuplicate ? (
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                            ⚠️ Duplicate
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                            ✅ New
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={skipDuplicates}
                                onChange={(e) => setSkipDuplicates(e.target.checked)}
                                className="w-4 h-4 text-blue-600 dark:bg-slate-700"
                            />
                            <label className="text-sm text-gray-700 dark:text-gray-300">Skip duplicates</label>
                        </div>
                        <button
                            onClick={handleImport}
                            disabled={actionLoading || data.length === 0}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                        >
                            {actionLoading ? 'Importing...' : `🚀 Import ${getUniqueCount()} Customers`}
                        </button>
                        <button
                            onClick={resetImport}
                            className="bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 px-6 py-2 rounded-lg transition dark:text-white"
                        >
                            🔄 Start Over
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Result */}
            {step === 3 && importResult && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-green-200 dark:border-green-700">
                    <div className="text-center mb-6">
                        <div className="text-6xl mb-3">🎉</div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Import Complete!</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Records</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{importResult.total}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Imported</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{importResult.imported}</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Duplicates</p>
                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{importResult.duplicates}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Skipped</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{importResult.skipped || 0}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Errors</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{(importResult.errors || []).length}</p>
                        </div>
                    </div>
                    <div className="mt-6 flex gap-3 justify-center">
                        <button
                            onClick={resetImport}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                        >
                            Import More
                        </button>
                        <button
                            onClick={() => window.location.href = '/customers'}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition dark:bg-slate-600 dark:hover:bg-slate-700"
                        >
                            View Customers
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkImportPage;
