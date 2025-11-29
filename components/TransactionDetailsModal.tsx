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

    // Skeleton Component
    const Skeleton = ({ className }: { className?: string }) => (
        <div className={`animate-pulse bg-white/5 rounded ${className}`} />
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-[#09090b] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
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
                    {error ? (
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
                    ) : (
                        <div className="space-y-8">
                            {/* Status Banner */}
                            <div className="flex items-center justify-between py-2">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Status</span>
                                    {loading ? (
                                        <Skeleton className="h-5 w-24" />
                                    ) : (
                                        <span className={`text-sm font-semibold capitalize ${orderDetails?.status === 'COMPLETED' || orderDetails?.status === 'APPROVED' ? 'text-emerald-400' :
                                            orderDetails?.status === 'PENDING' ? 'text-amber-400' : 'text-zinc-300'
                                            }`}>
                                            {orderDetails?.status?.toLowerCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Total Amount</span>
                                    {loading ? (
                                        <Skeleton className="h-7 w-32" />
                                    ) : (
                                        <span className="text-xl font-bold text-zinc-100">
                                            {orderDetails?.purchase_units?.[0]?.amount?.value &&
                                                formatCurrency(orderDetails.purchase_units[0].amount.value, orderDetails.purchase_units[0].amount.currency_code)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Customer Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2 pb-2 border-b border-white/5">
                                        <User size={14} strokeWidth={1.5} /> Customer Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">Name</p>
                                            {loading ? <Skeleton className="h-5 w-40" /> : (
                                                <p className="text-sm text-zinc-200 font-medium">
                                                    {orderDetails?.payer?.name?.given_name} {orderDetails?.payer?.name?.surname}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">Email</p>
                                            {loading ? <Skeleton className="h-5 w-48" /> : (
                                                <p className="text-sm text-zinc-200">{orderDetails?.payer?.email_address}</p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-zinc-500 mb-1">Payer ID</p>
                                                {loading ? <Skeleton className="h-4 w-24" /> : (
                                                    <p className="text-sm text-zinc-200 font-mono text-xs">{orderDetails?.payer?.payer_id}</p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs text-zinc-500 mb-1">Country</p>
                                                {loading ? <Skeleton className="h-4 w-8" /> : (
                                                    <p className="text-sm text-zinc-200">{orderDetails?.payer?.address?.country_code}</p>
                                                )}
                                            </div>
                                        </div>
                                        {(loading || orderDetails?.payer?.phone?.phone_number?.national_number || orderDetails?.payment_source?.paypal?.phone_number?.national_number) && (
                                            <div>
                                                <p className="text-xs text-zinc-500 mb-1">Phone</p>
                                                {loading ? <Skeleton className="h-5 w-32" /> : (
                                                    <p className="text-sm text-zinc-200">
                                                        {orderDetails?.payer?.phone?.phone_number?.national_number || orderDetails?.payment_source?.paypal?.phone_number?.national_number}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        {(loading || orderDetails?.payment_source?.paypal?.account_status) && (
                                            <div>
                                                <p className="text-xs text-zinc-500 mb-1">Account Status</p>
                                                {loading ? <Skeleton className="h-5 w-20" /> : (
                                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${orderDetails?.payment_source?.paypal?.account_status === 'VERIFIED'
                                                        ? 'bg-emerald-500/10 text-emerald-400'
                                                        : 'bg-zinc-800 text-zinc-400'
                                                        }`}>
                                                        {orderDetails?.payment_source?.paypal?.account_status}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Shipping Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2 pb-2 border-b border-white/5">
                                        <MapPin size={14} strokeWidth={1.5} /> Shipping Address
                                    </h3>
                                    {loading ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                    ) : orderDetails?.purchase_units?.[0]?.shipping?.address ? (
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

                                    {/* Additional Order Info */}
                                    <div className="pt-4 mt-4 border-t border-white/5 space-y-3">
                                        {(loading || orderDetails?.purchase_units?.[0]?.description) && (
                                            <div>
                                                <p className="text-xs text-zinc-500 mb-1">Description</p>
                                                {loading ? <Skeleton className="h-4 w-full" /> : (
                                                    <p className="text-sm text-zinc-300 italic">"{orderDetails?.purchase_units?.[0]?.description}"</p>
                                                )}
                                            </div>
                                        )}
                                        {(loading || orderDetails?.purchase_units?.[0]?.invoice_id) && (
                                            <div>
                                                <p className="text-xs text-zinc-500 mb-1">Invoice ID</p>
                                                {loading ? <Skeleton className="h-4 w-32" /> : (
                                                    <p className="text-sm text-zinc-300 font-mono">{orderDetails?.purchase_units?.[0]?.invoice_id}</p>
                                                )}
                                            </div>
                                        )}
                                        {(loading || orderDetails?.purchase_units?.[0]?.soft_descriptor) && (
                                            <div>
                                                <p className="text-xs text-zinc-500 mb-1">Soft Descriptor</p>
                                                {loading ? <Skeleton className="h-4 w-40" /> : (
                                                    <p className="text-sm text-zinc-300">{orderDetails?.purchase_units?.[0]?.soft_descriptor}</p>
                                                )}
                                            </div>
                                        )}
                                        {(loading || orderDetails?._capture_details?.seller_protection?.status) && (
                                            <div>
                                                <p className="text-xs text-zinc-500 mb-1">Seller Protection</p>
                                                {loading ? <Skeleton className="h-5 w-24" /> : (
                                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${orderDetails?._capture_details?.seller_protection?.status === 'ELIGIBLE'
                                                        ? 'bg-blue-500/10 text-blue-400'
                                                        : 'bg-zinc-800 text-zinc-400'
                                                        }`}>
                                                        {orderDetails?._capture_details?.seller_protection?.status}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2 pb-2 border-b border-white/5">
                                    <Package size={14} strokeWidth={1.5} /> Order Items
                                </h3>
                                {loading ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-start py-2 border-b border-white/5">
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-48" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                            <Skeleton className="h-4 w-20" />
                                        </div>
                                    </div>
                                ) : orderDetails?.purchase_units?.[0]?.items ? (
                                    <div className="space-y-2">
                                        {orderDetails.purchase_units[0].items.map((item: any, index: number) => (
                                            <div key={index} className="flex justify-between items-start py-2 border-b border-white/5 last:border-0">
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
                                    <CreditCard size={14} strokeWidth={1.5} /> Financial Breakdown
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Gross Amount</span>
                                        {loading ? <Skeleton className="h-4 w-24" /> : (
                                            <span className="text-zinc-200">
                                                {orderDetails?._capture_details?.seller_receivable_breakdown?.gross_amount ?
                                                    formatCurrency(
                                                        orderDetails._capture_details.seller_receivable_breakdown.gross_amount.value,
                                                        orderDetails._capture_details.seller_receivable_breakdown.gross_amount.currency_code
                                                    ) :
                                                    orderDetails?.purchase_units?.[0]?.payments?.captures?.[0]?.amount ?
                                                        formatCurrency(
                                                            orderDetails.purchase_units[0].payments.captures[0].amount.value,
                                                            orderDetails.purchase_units[0].payments.captures[0].amount.currency_code
                                                        ) : 'N/A'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">PayPal Fee</span>
                                        {loading ? <Skeleton className="h-4 w-20" /> : (
                                            <span className="text-rose-400">
                                                {orderDetails?._capture_details?.seller_receivable_breakdown?.paypal_fee ?
                                                    '-' + formatCurrency(
                                                        orderDetails._capture_details.seller_receivable_breakdown.paypal_fee.value,
                                                        orderDetails._capture_details.seller_receivable_breakdown.paypal_fee.currency_code
                                                    ) :
                                                    orderDetails?.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown?.paypal_fee ?
                                                        '-' + formatCurrency(
                                                            orderDetails.purchase_units[0].payments.captures[0].seller_receivable_breakdown.paypal_fee.value,
                                                            orderDetails.purchase_units[0].payments.captures[0].seller_receivable_breakdown.paypal_fee.currency_code
                                                        ) : 'N/A'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-white/10 flex justify-between text-sm font-medium">
                                        <span className="text-zinc-300">Net Amount</span>
                                        {loading ? <Skeleton className="h-4 w-24" /> : (
                                            <span className="text-emerald-400">
                                                {orderDetails?._capture_details?.seller_receivable_breakdown?.net_amount ?
                                                    formatCurrency(
                                                        orderDetails._capture_details.seller_receivable_breakdown.net_amount.value,
                                                        orderDetails._capture_details.seller_receivable_breakdown.net_amount.currency_code
                                                    ) :
                                                    orderDetails?.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown?.net_amount ?
                                                        formatCurrency(
                                                            orderDetails.purchase_units[0].payments.captures[0].seller_receivable_breakdown.net_amount.value,
                                                            orderDetails.purchase_units[0].payments.captures[0].seller_receivable_breakdown.net_amount.currency_code
                                                        ) : 'N/A'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Exchange Rate Info */}
                                    {(loading || orderDetails?._capture_details?.seller_receivable_breakdown?.exchange_rate ||
                                        orderDetails?.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown?.exchange_rate) && (
                                            <div className="pt-2 mt-2 border-t border-white/10 space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-zinc-500">Exchange Rate</span>
                                                    {loading ? <Skeleton className="h-3 w-32" /> : (
                                                        <span className="text-zinc-400">
                                                            1 {orderDetails?._capture_details?.seller_receivable_breakdown?.exchange_rate?.source_currency || orderDetails?.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown?.exchange_rate?.source_currency} = {' '}
                                                            {orderDetails?._capture_details?.seller_receivable_breakdown?.exchange_rate?.value || orderDetails?.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown?.exchange_rate?.value} {' '}
                                                            {orderDetails?._capture_details?.seller_receivable_breakdown?.exchange_rate?.target_currency || orderDetails?.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown?.exchange_rate?.target_currency}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between text-sm font-medium">
                                                    <span className="text-zinc-300">Converted Amount</span>
                                                    {loading ? <Skeleton className="h-4 w-28" /> : (
                                                        <span className="text-blue-400">
                                                            {orderDetails?._capture_details?.seller_receivable_breakdown?.receivable_amount ?
                                                                formatCurrency(
                                                                    orderDetails._capture_details.seller_receivable_breakdown.receivable_amount.value,
                                                                    orderDetails._capture_details.seller_receivable_breakdown.receivable_amount.currency_code
                                                                ) :
                                                                orderDetails?.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown?.receivable_amount ?
                                                                    formatCurrency(
                                                                        orderDetails.purchase_units[0].payments.captures[0].seller_receivable_breakdown.receivable_amount.value,
                                                                        orderDetails.purchase_units[0].payments.captures[0].seller_receivable_breakdown.receivable_amount.currency_code
                                                                    ) : 'N/A'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
