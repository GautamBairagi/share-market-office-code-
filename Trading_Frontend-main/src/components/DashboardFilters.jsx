import React, { useState } from 'react';
import * as api from '../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
};

const cleanPdfText = (str) => {
    if (str == null) return '';
    let text = String(str);
    // Replace Unicode Rupee symbol and similar characters with clean standard representation
    text = text.replace(/₹/g, 'Rs. ');
    text = text.replace(/\u20B9/g, 'Rs. ');
    text = text.replace(/\u00B9/g, '');
    text = text.replace(/[\u2018\u2019]/g, "'");
    text = text.replace(/[\u201C\u201D]/g, '"');
    text = text.replace(/[\u2013\u2014]/g, '-');
    return text;
};

const getDetailedSegment = (t) => {
    const raw = (t.market_type || t.category || t.segment || '').toUpperCase();
    const sym = (t.symbol || '').toUpperCase();

    // 1. Crypto
    if (raw === 'CRYPTO' || sym.startsWith('CRYPTO:') || sym.includes('/USDT') || ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'AVAX'].some(k => sym.startsWith(k + '/') || sym === k)) {
        return 'Crypto';
    }

    // 2. Forex
    if (raw === 'FOREX' || sym.startsWith('FOREX:') || ['EUR/', 'GBP/', 'USD/', 'AUD/', 'NZD/', 'CAD/', 'CHF/', 'JPY/'].some(k => sym.includes(k)) || ['EURUSD', 'GBPUSD', 'USDINR', 'USDJPY', 'EURINR', 'GBPINR', 'AUDCAD', 'USDCHF'].some(k => sym.includes(k))) {
        return 'Forex';
    }

    // 3. COMEX / International Commodities
    if (raw === 'COMEX' || raw === 'COMMODITY' || sym.startsWith('COMMODITY:') || ['XAU/', 'XAG/', 'USOIL', 'UKOIL', 'NGAS'].some(k => sym.includes(k))) {
        return 'COMEX';
    }

    // 4. MCX
    if (raw === 'MCX' || sym.startsWith('MCX:') || ['GOLD', 'SILVER', 'CRUDEOIL', 'NATURALGAS', 'COPPER', 'ZINC', 'NICKEL', 'LEAD', 'ALUMINIUM', 'ALUMINI', 'MENTHAOIL', 'COTTON', 'CRUDEOILM', 'GOLDM', 'SILVERM', 'LEADMINI', 'ZINCMINI', 'NATGASMINI'].some(k => sym.includes(k))) {
        return 'MCX';
    }

    // 5. Equity / NFO
    return 'Equity';
};

import { MCX_LOT_SIZES, getMcxLotSize } from '../utils/mcxLotSizes';

const isMcxSymbol = (symbol) => {
    if (!symbol) return false;
    const sym = symbol.toUpperCase();
    const base = sym.split(':').pop().replace(/\d+.*/, '').trim();
    return sym.startsWith('MCX:') ||
        ['GOLD','SILVER','CRUDEOIL','NATURALGAS','COPPER','ZINC','NICKEL','LEAD',
         'ALUMINIUM','MENTHAOIL','COTTON','BULLDEX'].some(k => base.startsWith(k));
};

const getTradeLotSize = (t) => {
    if (isMcxSymbol(t?.symbol)) {
        return getMcxLotSize(t.symbol) || 1;
    }
    return parseFloat(t?.lot_size || t?.lot_size_at_entry || 1);
};

const calcTradeTurnover = (price, qty, trade) => {
    const p = parseFloat(price || 0);
    const q = parseFloat(qty || 0);
    if (!p || !q) return 0;
    const lotSize = getTradeLotSize(trade);
    return p * q * lotSize;
};

const DashboardFilters = ({ client }) => {
    // Row 1: Export Trades Excel
    const [tradesFromDate, setTradesFromDate] = useState('');
    const [tradesToDate, setTradesToDate] = useState('');
    const [tradesLoading, setTradesLoading] = useState(false);

    // Row 2: Download Trades PDF
    const [pdfFromDate, setPdfFromDate] = useState('');
    const [pdfToDate, setPdfToDate] = useState('');
    const [pdfLoading, setPdfLoading] = useState(false);

    // Row 3: Export Funds Excel
    const [fundsFromDate, setFundsFromDate] = useState('');
    const [fundsToDate, setFundsToDate] = useState('');
    const [fundsLoading, setFundsLoading] = useState(false);

    // ── 1. EXPORT TRADES EXCEL (.xlsx) ──
    const handleExportTradesExcel = async () => {
        if (!client?.id) {
            alert('Client ID not found.');
            return;
        }
        setTradesLoading(true);
        try {
            const params = { user_id: client.id };
            if (tradesFromDate) params.fromDate = tradesFromDate;
            if (tradesToDate) params.toDate = tradesToDate;

            const res = await api.getTrades(params);
            const trades = Array.isArray(res) ? res : (res?.data || []);

            if (trades.length === 0) {
                alert('No trades found for the selected date range.');
                return;
            }

            // Columns matching media_1788190259826.png:
            // ID | Scrip | Segment | User ID | Buy Rate | Sell Rate | Lots | Quantity | Buy Turno | Sell Turno | Brokerage | Status | Profit/Los | Buy Time | Sell Time | Buy IP | Sell IP | Bought By | Sold By
            const excelRows = trades.map(t => {
                const isBuy = (t.type || 'BUY').toUpperCase() === 'BUY';
                const entryPrice = parseFloat(t.entry_price || t.price || 0);
                const exitPrice = parseFloat(t.exit_price || 0);

                const buyRate = isBuy ? entryPrice : (exitPrice > 0 ? exitPrice : entryPrice);
                const sellRate = isBuy ? (exitPrice > 0 ? exitPrice : entryPrice) : entryPrice;
                const lots = parseFloat(t.qty || 0);
                const lotSize = getTradeLotSize(t);
                const quantity = lots * lotSize;

                const buyTurnover = isBuy ? calcTradeTurnover(entryPrice, lots, t) : (exitPrice > 0 ? calcTradeTurnover(exitPrice, lots, t) : 0);
                const sellTurnover = !isBuy ? calcTradeTurnover(entryPrice, lots, t) : (exitPrice > 0 ? calcTradeTurnover(exitPrice, lots, t) : 0);

                const brokerage = parseFloat(t.brokerage || 0);
                const pnl = parseFloat(t.pnl || 0);
                const status = (t.is_weekly_settlement || t.status === 'WEEKLY SETTLED' || t.status === 'SETTLED')
                    ? 'WEEKLY SETTLED'
                    : (t.status === 'CLOSED' ? 'Closed' : (t.status === 'OPEN' ? 'Open' : (t.status || 'Closed')));

                const buyTime = isBuy ? formatDateTime(t.entry_time) : formatDateTime(t.exit_time || t.entry_time);
                const sellTime = isBuy ? formatDateTime(t.exit_time || t.entry_time) : formatDateTime(t.entry_time);

                const buyIp = t.trade_ip || '127.0.0.1';
                const sellIp = t.close_ip || '127.0.0.1';

                const boughtBy = isBuy
                    ? (t.created_by_name?.toLowerCase().includes('admin') ? 'Admin' : 'Trader')
                    : (t.closed_by_name?.toLowerCase().includes('admin') ? 'Admin' : 'Trader');
                const soldBy = isBuy
                    ? (t.closed_by_name?.toLowerCase().includes('admin') ? 'Admin' : 'Trader')
                    : (t.created_by_name?.toLowerCase().includes('admin') ? 'Admin' : 'Trader');

                const segment = getDetailedSegment(t);

                return {
                    'ID': t.id,
                    'Scrip': t.symbol || '',
                    'Segment': segment === 'Equity' ? 'NSE' : segment,
                    'User ID': client?.id || t.user_id,
                    'Buy Rate': Number(buyRate.toFixed(2)),
                    'Sell Rate': Number(sellRate.toFixed(2)),
                    'Lots': Number(lots.toFixed(2)),
                    'Quantity': Number(quantity.toFixed(2)),
                    'Buy Turno': Number(buyTurnover.toFixed(2)),
                    'Sell Turno': Number(sellTurnover.toFixed(2)),
                    'Brokerage': Number(brokerage.toFixed(2)),
                    'Status': status,
                    'Profit/Los': Number(pnl.toFixed(2)),
                    'Buy Time': buyTime,
                    'Sell Time': sellTime,
                    'Buy IP': buyIp,
                    'Sell IP': sellIp,
                    'Bought By': boughtBy,
                    'Sold By': soldBy
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(excelRows);

            // Auto-width columns
            worksheet['!cols'] = [
                { wch: 10 }, // ID
                { wch: 18 }, // Scrip
                { wch: 10 }, // Segment
                { wch: 12 }, // User ID
                { wch: 12 }, // Buy Rate
                { wch: 12 }, // Sell Rate
                { wch: 8 },  // Lots
                { wch: 10 }, // Quantity
                { wch: 14 }, // Buy Turno
                { wch: 14 }, // Sell Turno
                { wch: 12 }, // Brokerage
                { wch: 10 }, // Status
                { wch: 12 }, // Profit/Los
                { wch: 20 }, // Buy Time
                { wch: 20 }, // Sell Time
                { wch: 16 }, // Buy IP
                { wch: 16 }, // Sell IP
                { wch: 12 }, // Bought By
                { wch: 12 }  // Sold By
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Trades');

            XLSX.writeFile(workbook, `trades_${client?.username || client?.id}.xlsx`);
        } catch (err) {
            console.error('Export Trades Excel Error:', err);
            alert('Failed to export trades: ' + err.message);
        } finally {
            setTradesLoading(false);
        }
    };

    // ── 2. DOWNLOAD TRADES PDF (.pdf) ──
    const handleDownloadTradesPdf = async () => {
        if (!client?.id) {
            alert('Client ID not found.');
            return;
        }
        setPdfLoading(true);
        try {
            const params = { user_id: client.id };
            if (pdfFromDate) params.fromDate = pdfFromDate;
            if (pdfToDate) params.toDate = pdfToDate;

            // Fetch trades and funds concurrently
            const [tradesRes, fundsRes] = await Promise.all([
                api.getTrades(params),
                api.getTraderFunds({ userId: client.id, fromDate: pdfFromDate, toDate: pdfToDate })
            ]);

            const trades = Array.isArray(tradesRes) ? tradesRes : (tradesRes?.data || []);
            const funds = Array.isArray(fundsRes) ? fundsRes : (fundsRes?.data || []);

            const doc = new jsPDF('p', 'pt', 'a4');

            // Header: <User ID>: (<Username>) <Full Name>
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(20, 20, 20);
            doc.text(`${client?.id || ''}: (${client?.username || ''}) ${client?.full_name || ''}`, 35, 40);

            // Billing for: MM/DD/YYYY - MM/DD/YYYY
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            const fromDisplay = pdfFromDate ? formatDateDisplay(pdfFromDate) : 'Start';
            const toDisplay = pdfToDate ? formatDateDisplay(pdfToDate) : 'Present';
            doc.text(`Billing for: ${fromDisplay} - ${toDisplay}`, 35, 58);

            let currentY = 80;

            // ── Section 1: Funds Transactions ──
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text('Funds Transactions', 35, currentY);
            currentY += 8;

            const fundTableRows = funds.map(f => [
                f.id,
                formatDateTime(f.created_at || f.time),
                parseFloat(f.amount || 0).toFixed(2),
                cleanPdfText(f.type === 'DEPOSIT' ? 'Deposit' : (f.type === 'WITHDRAW' ? 'Withdrawal' : (f.type || 'Deposit'))),
                cleanPdfText(f.remarks || f.notes || '')
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['TXN ID', 'Time', 'Amount', 'Txn Type', 'Notes']],
                body: fundTableRows.length > 0 ? fundTableRows : [['-', '-', '0.00', '-', '-']],
                theme: 'grid',
                headStyles: {
                    fillColor: [26, 75, 26], // Dark Green matching screenshot
                    textColor: [255, 255, 255],
                    fontSize: 7.5,
                    fontStyle: 'bold',
                    halign: 'left',
                    cellPadding: 3
                },
                bodyStyles: {
                    fontSize: 7,
                    textColor: [30, 30, 30],
                    cellPadding: 3
                },
                columnStyles: {
                    0: { cellWidth: 65 },
                    1: { cellWidth: 100 },
                    2: { cellWidth: 70, halign: 'right' },
                    3: { cellWidth: 100 },
                    4: { cellWidth: 'auto' }
                },
                margin: { left: 35, right: 35 }
            });

            currentY = doc.lastAutoTable.finalY + 25;

            // Filter trades into MCX, Equity, COMEX, Forex, and Crypto buckets
            const mcxTrades = trades.filter(t => getDetailedSegment(t) === 'MCX');
            const equityTrades = trades.filter(t => getDetailedSegment(t) === 'Equity');
            const comexTrades = trades.filter(t => getDetailedSegment(t) === 'COMEX');
            const forexTrades = trades.filter(t => getDetailedSegment(t) === 'Forex');
            const cryptoTrades = trades.filter(t => getDetailedSegment(t) === 'Crypto');

            const tradeHeaders = [['ID', 'Scrip', 'Buy Rate', 'Sell Rate', 'Lots', 'Buy Turnover', 'Sell Turnover', 'Brokerage', 'PL', 'Buy Time', 'Sell Time']];

            const formatTradeRows = (tradeList) => {
                let totalBrokerage = 0;
                let totalPl = 0;

                const rows = tradeList.map(t => {
                    const isBuy = (t.type || 'BUY').toUpperCase() === 'BUY';
                    const entryPrice = parseFloat(t.entry_price || t.price || 0);
                    const exitPrice = parseFloat(t.exit_price || 0);
                    const buyRate = isBuy ? entryPrice : (exitPrice > 0 ? exitPrice : entryPrice);
                    const sellRate = isBuy ? (exitPrice > 0 ? exitPrice : entryPrice) : entryPrice;
                    const lots = parseFloat(t.qty || 0);

                    const buyTurnover = isBuy ? calcTradeTurnover(entryPrice, lots, t) : (exitPrice > 0 ? calcTradeTurnover(exitPrice, lots, t) : 0);
                    const sellTurnover = !isBuy ? calcTradeTurnover(entryPrice, lots, t) : (exitPrice > 0 ? calcTradeTurnover(exitPrice, lots, t) : 0);
                    const brokerage = parseFloat(t.brokerage || 0);
                    const pnl = parseFloat(t.pnl || 0);

                    totalBrokerage += brokerage;
                    totalPl += pnl;

                    const buyTime = isBuy ? formatDateTime(t.entry_time) : formatDateTime(t.exit_time || t.entry_time);
                    const sellTime = isBuy ? formatDateTime(t.exit_time || t.entry_time) : formatDateTime(t.entry_time);

                    return [
                        t.id,
                        cleanPdfText(t.symbol || ''),
                        buyRate.toFixed(2),
                        sellRate.toFixed(2),
                        lots.toString(),
                        buyTurnover.toFixed(2),
                        sellTurnover.toFixed(2),
                        brokerage.toFixed(2),
                        pnl.toFixed(2),
                        buyTime,
                        sellTime
                    ];
                });

                return { rows, totalBrokerage, totalPl };
            };

            const renderTradeSection = (title, segmentName, tradeList) => {
                if (currentY > 650) {
                    doc.addPage();
                    currentY = 40;
                }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(0, 0, 0);
                doc.text(title, 35, currentY);
                currentY += 8;

                const { rows, totalBrokerage, totalPl } = formatTradeRows(tradeList);

                // Add footer row inside the table
                const tableBody = [...rows];
                tableBody.push([
                    { content: `Total Brokerage in ${segmentName}: ${totalBrokerage.toFixed(2)}`, colSpan: 6, styles: { fontStyle: 'bold', halign: 'left', fillColor: [255, 255, 255] } },
                    { content: `Total Profit/loss in ${segmentName}: ${totalPl.toFixed(2)}`, colSpan: 5, styles: { fontStyle: 'bold', halign: 'left', fillColor: [255, 255, 255] } }
                ]);

                autoTable(doc, {
                    startY: currentY,
                    head: tradeHeaders,
                    body: tableBody,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [26, 75, 26], // Dark Green header
                        textColor: [255, 255, 255],
                        fontSize: 7.5,
                        fontStyle: 'bold',
                        halign: 'left',
                        cellPadding: 3
                    },
                    bodyStyles: {
                        fontSize: 6.5,
                        textColor: [30, 30, 30],
                        cellPadding: 3
                    },
                    columnStyles: {
                        0: { cellWidth: 48 }, // ID
                        1: { cellWidth: 70 }, // Scrip
                        2: { cellWidth: 45, halign: 'right' }, // Buy Rate
                        3: { cellWidth: 45, halign: 'right' }, // Sell Rate
                        4: { cellWidth: 28, halign: 'right' }, // Lots
                        5: { cellWidth: 52, halign: 'right' }, // Buy Turno
                        6: { cellWidth: 52, halign: 'right' }, // Sell Turno
                        7: { cellWidth: 42, halign: 'right' }, // Brokerage
                        8: { cellWidth: 42, halign: 'right' }, // PL
                        9: { cellWidth: 52 }, // Buy Time
                        10: { cellWidth: 52 }  // Sell Time
                    },
                    margin: { left: 35, right: 35 }
                });

                currentY = doc.lastAutoTable.finalY + 22;
            };

            // ── Section 2: MCX Trades List ──
            renderTradeSection('MCX Trades List', 'MCX', mcxTrades);

            // ── Section 3: Equity Trades List ──
            renderTradeSection('Equity Trades List', 'Equity', equityTrades);

            // ── Section 4: COMEX Trades List ──
            renderTradeSection('COMEX Trades List', 'COMEX', comexTrades);

            // ── Section 5: Forex Trades List ──
            renderTradeSection('Forex Trades List', 'Forex', forexTrades);

            // ── Section 6: Crypto Trades List ──
            renderTradeSection('Crypto Trades List', 'Crypto', cryptoTrades);

            doc.save(`trades_report_${client?.username || client?.id}.pdf`);
        } catch (err) {
            console.error('Download Trades PDF Error:', err);
            alert('Failed to generate PDF report: ' + err.message);
        } finally {
            setPdfLoading(false);
        }
    };

    // ── 3. EXPORT FUNDS EXCEL (.xlsx) ──
    const handleExportFundsExcel = async () => {
        if (!client?.id) {
            alert('Client ID not found.');
            return;
        }
        setFundsLoading(true);
        try {
            const res = await api.getTraderFunds({ userId: client.id, fromDate: fundsFromDate, toDate: fundsToDate });
            const funds = Array.isArray(res) ? res : (res?.data || []);

            if (funds.length === 0) {
                alert('No fund transactions found for the selected date range.');
                return;
            }

            const excelRows = funds.map(f => ({
                'TXN ID': f.id,
                'User ID': client?.id || f.user_id,
                'Username': client?.username || f.username || '',
                'Time': formatDateTime(f.created_at || f.time),
                'Amount': parseFloat(f.amount || 0),
                'Txn Type': f.type === 'DEPOSIT' ? 'Deposit' : (f.type === 'WITHDRAW' ? 'Withdrawal' : (f.type || 'Deposit')),
                'Balance After': parseFloat(f.balance_after || 0),
                'Notes': f.remarks || f.notes || ''
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelRows);
            worksheet['!cols'] = [
                { wch: 12 }, // TXN ID
                { wch: 12 }, // User ID
                { wch: 16 }, // Username
                { wch: 20 }, // Time
                { wch: 14 }, // Amount
                { wch: 14 }, // Txn Type
                { wch: 16 }, // Balance After
                { wch: 25 }  // Notes
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Funds');

            XLSX.writeFile(workbook, `funds_${client?.username || client?.id}.xlsx`);
        } catch (err) {
            console.error('Export Funds Error:', err);
            alert('Failed to export funds: ' + err.message);
        } finally {
            setFundsLoading(false);
        }
    };

    return (
        <div className="rounded-sm shadow-2xl overflow-hidden mb-6 p-4 space-y-4 bg-[#1f283e] border border-white/5" onClick={(e) => e.stopPropagation()}>
            {/* Row 1: EXPORT TRADES (Excel) */}
            <div className="flex flex-col md:flex-row items-end gap-3">
                <div className="flex flex-row md:flex-[5] gap-3 w-full">
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">FROM DATE</label>
                        <input
                            type="date"
                            value={tradesFromDate}
                            onChange={(e) => setTradesFromDate(e.target.value)}
                            className="w-full h-9 px-3 text-slate-300 text-[13px] focus:outline-none bg-[#151c2c] border border-white/10 rounded-sm focus:border-cyan-400 transition-colors [color-scheme:dark]"
                        />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">TO DATE</label>
                        <input
                            type="date"
                            value={tradesToDate}
                            onChange={(e) => setTradesToDate(e.target.value)}
                            className="w-full h-9 px-3 text-slate-300 text-[13px] focus:outline-none bg-[#151c2c] border border-white/10 rounded-sm focus:border-cyan-400 transition-colors [color-scheme:dark]"
                        />
                    </div>
                </div>
                <div className="w-full md:flex-[2] flex items-end">
                    <button
                        onClick={handleExportTradesExcel}
                        disabled={tradesLoading}
                        className="w-full h-9 bg-[#17a2b8] hover:bg-[#138496] disabled:opacity-50 text-white text-[11px] sm:text-[12px] font-bold uppercase tracking-widest transition-all rounded-sm shadow-md cursor-pointer flex items-center justify-center"
                    >
                        {tradesLoading ? 'EXPORTING...' : 'EXPORT TRADES'}
                    </button>
                </div>
            </div>

            {/* Row 2: DOWNLOAD TRADES PDF */}
            <div className="flex flex-col md:flex-row items-end gap-3">
                <div className="flex flex-row md:flex-[5] gap-3 w-full">
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">FROM DATE</label>
                        <input
                            type="date"
                            value={pdfFromDate}
                            onChange={(e) => setPdfFromDate(e.target.value)}
                            className="w-full h-9 px-3 text-slate-300 text-[13px] focus:outline-none bg-[#151c2c] border border-white/10 rounded-sm focus:border-cyan-400 transition-colors [color-scheme:dark]"
                        />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">TO DATE</label>
                        <input
                            type="date"
                            value={pdfToDate}
                            onChange={(e) => setPdfToDate(e.target.value)}
                            className="w-full h-9 px-3 text-slate-300 text-[13px] focus:outline-none bg-[#151c2c] border border-white/10 rounded-sm focus:border-cyan-400 transition-colors [color-scheme:dark]"
                        />
                    </div>
                </div>
                <div className="w-full md:flex-[2] flex items-end">
                    <button
                        onClick={handleDownloadTradesPdf}
                        disabled={pdfLoading}
                        className="w-full h-9 bg-[#17a2b8] hover:bg-[#138496] disabled:opacity-50 text-white text-[11px] sm:text-[12px] font-bold uppercase tracking-widest transition-all rounded-sm shadow-md cursor-pointer flex items-center justify-center"
                    >
                        {pdfLoading ? 'GENERATING PDF...' : 'DOWNLOAD TRADES PDF'}
                    </button>
                </div>
            </div>

            {/* Row 3: EXPORT FUNDS (Excel) */}
            <div className="flex flex-col md:flex-row items-end gap-3">
                <div className="flex flex-row md:flex-[5] gap-3 w-full">
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">FROM DATE</label>
                        <input
                            type="date"
                            value={fundsFromDate}
                            onChange={(e) => setFundsFromDate(e.target.value)}
                            className="w-full h-9 px-3 text-slate-300 text-[13px] focus:outline-none bg-[#151c2c] border border-white/10 rounded-sm focus:border-cyan-400 transition-colors [color-scheme:dark]"
                        />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">TO DATE</label>
                        <input
                            type="date"
                            value={fundsToDate}
                            onChange={(e) => setFundsToDate(e.target.value)}
                            className="w-full h-9 px-3 text-slate-300 text-[13px] focus:outline-none bg-[#151c2c] border border-white/10 rounded-sm focus:border-cyan-400 transition-colors [color-scheme:dark]"
                        />
                    </div>
                </div>
                <div className="w-full md:flex-[2] flex items-end">
                    <button
                        onClick={handleExportFundsExcel}
                        disabled={fundsLoading}
                        className="w-full h-9 bg-[#17a2b8] hover:bg-[#138496] disabled:opacity-50 text-white text-[11px] sm:text-[12px] font-bold uppercase tracking-widest transition-all rounded-sm shadow-md cursor-pointer flex items-center justify-center"
                    >
                        {fundsLoading ? 'EXPORTING...' : 'EXPORT FUNDS'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardFilters;
