import React, { useEffect, useState } from 'react';
import { X, Receipt, User, MapPin, Package, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { getPayPalOrderDetails } from '../services/paypalService';
import { useTranslation } from 'react-i18next';

interface TransactionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string | null;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ isOpen, onClose, transactionId }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orderDetails, setOrderDetails] = useState<any>(null);

    useEffect(() => {
        if (isOpen && transactionId) {
            fetchDetails();
        } else {
            setOrderDetails(null);
            setError(null);
        }
    }, [isOpen, transactionId]);

    const fetchDetails = async () => {
        if (!transactionId) return;

        setLoading(true);
        setError(null);
        try {
            const data = await getPayPalOrderDetails(transactionId);
            setOrderDetails(data);
        } catch (err: any) {
            console.error('Failed to fetch transaction details:', err);
            setError(err.message || 'Failed to load transaction details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Helper to format currency
    const formatCurrency = (amount: string, currency: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(parseFloat(amount));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-[#09090b] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Receipt className="text-blue-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-100">Transaction Details</h2>
                            <p className="text-xs text-zinc-500 font-mono mt-0.5">{transactionId}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-500">
                            <Loader2 className="animate-spin" size={32} />
                            <p className="text-sm">Loading details...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-rose-400">
                            <AlertCircle size={32} />
                            <p className="text-sm">{error}</p>
                            <button
                                onClick={fetchDetails}
                                className="px-4 py-2 text-xs font-medium bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors mt-2"
                            >
                                Retry
                            </button>
                        </div>
                    ) : orderDetails ? (
                        <div className="space-y-8">
                            {/* Status Banner */}
                            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-lg">
                                <div className="flex flex-col">
                                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Status</span>
                                    <span className={`text-sm font-semibold capitalize ${orderDetails.status === 'COMPLETED' || orderDetails.status === 'APPROVED' ? 'text-emerald-400' :
                                        orderDetails.status === 'PENDING' ? 'text-amber-400' : 'text-zinc-300'
                                        }`}>
                                        {orderDetails.status?.toLowerCase()}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Total Amount</span>
                                    <span className="text-xl font-bold text-zinc-100">
                                        {orderDetails.purchase_units?.[0]?.amount?.value &&
                                            formatCurrency(orderDetails.purchase_units[0].amount.value, orderDetails.purchase_units[0].amount.currency_code)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Customer Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2 pb-2 border-b border-white/5">
                                        <User size={14} /> Customer Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-zinc-500">Name</p>
                                            <p className="text-sm text-zinc-200 font-medium">
                                                {orderDetails.payer?.name?.given_name} {orderDetails.payer?.name?.surname}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500">Email</p>
                                            <p className="text-sm text-zinc-200">{orderDetails.payer?.email_address}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500">Payer ID</p>
                                            <p className="text-sm text-zinc-200 font-mono text-xs">{orderDetails.payer?.payer_id}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2 pb-2 border-b border-white/5">
                                        <MapPin size={14} /> Shipping Address
                                    </h3>
                                    {orderDetails.purchase_units?.[0]?.shipping?.address ? (
                                        <div className="space-y-1 text-sm text-zinc-300">
                                            <p>{orderDetails.purchase_units[0].shipping.name?.full_name}</p>
                                            <p>{orderDetails.purchase_units[0].shipping.address.address_line_1}</p>
                                            {orderDetails.purchase_units[0].shipping.address.address_line_2 && (
                                                <p>{orderDetails.purchase_units[0].shipping.address.address_line_2}</p>
                                            )}
                                            <p>
                                                {orderDetails.purchase_units[0].shipping.address.admin_area_2}, {' '}
                                                {orderDetails.purchase_units[0].shipping.address.admin_area_1} {' '}
                                                {orderDetails.purchase_units[0].shipping.address.postal_code}
                                            </p>
                                            <p className="text-zinc-500 text-xs mt-1">
                                                {orderDetails.purchase_units[0].shipping.address.country_code}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-zinc-500 italic">No shipping information available</p>
                                    )}
                                </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2 pb-2 border-b border-white/5">
                                    <Package size={14} /> Order Items
                                </h3>
                                {orderDetails.purchase_units?.[0]?.items ? (
                                    <div className="space-y-2">
                                        {orderDetails.purchase_units[0].items.map((item: any, index: number) => (
                                            <div key={index} className="flex justify-between items-start p-3 bg-white/[0.02] rounded-lg border border-white/5">
                                                <div>
                                                    <p className="text-sm font-medium text-zinc-200">{item.name}</p>
                                                    <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="text-sm font-medium text-zinc-200">
                                                    {formatCurrency(item.unit_amount.value, item.unit_amount.currency_code)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-zinc-500 italic">No item details available</p>
                                )}
                            </div>

                            {/* Financial Breakdown */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2 pb-2 border-b border-white/5">
                                    <CreditCard size={14} /> Financial Breakdown
                                </h3>
                                <div className="bg-zinc-900/50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Gross Amount</span>
                                        <span className="text-zinc-200">
                                            {orderDetails.purchase_units?.[0]?.payments?.captures?.[0]?.amount ?
                                                formatCurrency(
                                                    orderDetails.purchase_units[0].payments.captures[0].amount.value,
                                                    orderDetails.purchase_units[0].payments.captures[0].amount.currency_code
                                                ) : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">PayPal Fee</span>
                                        <span className="text-rose-400">
                                            {orderDetails.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown?.paypal_fee ?
                                                '-' + formatCurrency(
                                                    orderDetails.purchase_units[0].payments.captures[0].seller_receivable_breakdown.paypal_fee.value,
                                                    orderDetails.purchase_units[0].payments.captures[0].seller_receivable_breakdown.paypal_fee.currency_code
                                                ) : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-white/10 flex justify-between text-sm font-medium">
                                        <span className="text-zinc-300">Net Amount</span>
                                        <span className="text-emerald-400">
                                            {orderDetails.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown?.net_amount ?
                                                formatCurrency(
                                                    orderDetails.purchase_units[0].payments.captures[0].seller_receivable_breakdown.net_amount.value,
                                                    orderDetails.purchase_units[0].payments.captures[0].seller_receivable_breakdown.net_amount.currency_code
                                                ) : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-zinc-500 py-12">
                            No details found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
