import { PayPalAgentToolkit } from '@paypal/agent-toolkit/ai-sdk';

// Initialize the PayPal Agent Toolkit
// We use the access token provided in the environment variables
// Note: In a production environment, this should be run on the server side to keep credentials secure.

const paypalToolkit = new PayPalAgentToolkit({
    // If using Access Token, Client ID/Secret might be optional or ignored if the token is set in env
    // However, the type definition usually requires them. 
    // We'll pass process.env values if available, or placeholders if relying on the Access Token env var.
    clientId: process.env.PAYPAL_CLIENT_ID || 'placeholder_client_id',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'placeholder_client_secret',
    configuration: {
        actions: {
            invoices: {
                create: true,
                list: true,
                send: true,
                sendReminder: true,
                cancel: true,
                generateQRC: true,
            },
            products: {
                create: true,
                list: true,
                update: true
            },
            subscriptionPlans: {
                create: true,
                list: true,
                show: true
            },
            shipment: {
                create: true,
                show: true,
                cancel: true
            },
            orders: {
                create: true,
                get: true
            },
            disputes: {
                list: true,
                get: true
            },
        },
        // Set environment based on env var
        context: {
            sandbox: process.env.PAYPAL_ENVIRONMENT === 'SANDBOX',
        }
    },
});

export const getPayPalTools = () => {
    return paypalToolkit.getTools();
};

export interface PayPalTransaction {
    id: string;
    date: string;
    status: string;
    gross: number;
    fee: number;
    net: number;
    currency: string;
    customerName: string;
    customerEmail: string;
    invoiceId?: string;
}

export interface PayPalDashboardData {
    summary: {
        grossTotal: number;
        feeTotal: number;
        netTotal: number;
        transactionCount: number;
        avgTicket: number;
        currency: string;
    };
    chartData: { date: string; amount: number }[];
    transactions: PayPalTransaction[];
    salesByCountry: { countryCode: string; amount: number; count: number }[];
}

// Cache for exchange rates to avoid hitting API limit
let exchangeRatesCache: { rates: any; timestamp: number } | null = null;

const fetchExchangeRates = async () => {
    // Return cached if less than 1 hour old
    if (exchangeRatesCache && (Date.now() - exchangeRatesCache.timestamp < 3600000)) {
        return exchangeRatesCache.rates;
    }

    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!response.ok) throw new Error('Failed to fetch exchange rates');
        const data = await response.json();

        exchangeRatesCache = {
            rates: data.rates,
            timestamp: Date.now()
        };

        return data.rates;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Fallback rates if API fails
        return { USD: 1, EUR: 0.92, GBP: 0.79, BRL: 5.0 };
    }
};

export const getInternationalEarnings = async (range: '30d' | '90d' | 'ytd' | '1y' = '30d'): Promise<PayPalDashboardData> => {
    try {
        const token = process.env.PAYPAL_ACCESS_TOKEN;
        const environment = process.env.PAYPAL_ENVIRONMENT || 'SANDBOX';
        const baseUrl = environment === 'PRODUCTION'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        // Fetch exchange rates
        const rates = await fetchExchangeRates();
        const SPREAD = 0.045; // 4.5% spread for currency conversion

        // Calculate date range
        let endDate = new Date();
        const startDate = new Date();

        switch (range) {
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(startDate.getDate() - 90);
                break;
            case 'ytd':
                startDate.setMonth(0, 1); // Jan 1st of current year
                break;
            case '1y':
                startDate.setMonth(0, 1); // Jan 1st of current year
                endDate = new Date(startDate.getFullYear(), 11, 31); // Dec 31st of current year
                break;
        }

        // Helper to fetch a single chunk
        const fetchChunk = async (start: Date, end: Date) => {
            const startStr = start.toISOString();
            const endStr = end.toISOString();
            const response = await fetch(`${baseUrl}/v1/reporting/transactions?start_date=${startStr}&end_date=${endStr}&fields=transaction_info,payer_info,cart_info`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw new Error(`PayPal API Error: ${response.status}`);
            return response.json();
        };

        // Split into 31-day chunks (PayPal limit)
        const chunks: Promise<any>[] = [];
        let currentStart = new Date(startDate);

        while (currentStart < endDate) {
            const currentEnd = new Date(currentStart);
            currentEnd.setDate(currentEnd.getDate() + 31);

            // Don't go past the actual end date
            const chunkEnd = currentEnd > endDate ? endDate : currentEnd;

            chunks.push(fetchChunk(currentStart, chunkEnd));

            // Move to next chunk
            currentStart = new Date(currentEnd);
        }

        // Fetch all chunks in parallel
        const responses = await Promise.all(chunks);

        // Merge data
        let allTransactions: any[] = [];
        responses.forEach(data => {
            if (data.transaction_details) {
                allTransactions = [...allTransactions, ...data.transaction_details];
            }
        });

        // Initialize summary
        let grossTotal = 0;
        let feeTotal = 0;
        let netTotal = 0;
        let transactionCount = 0;
        const currency = 'USD';
        const dailyEarnings: { [key: string]: number } = {};
        const transactions: PayPalTransaction[] = [];

        allTransactions.forEach((tx: any) => {
            const info = tx.transaction_info;
            const payer = tx.payer_info || {};

            const amount = parseFloat(info.transaction_amount?.value || '0');
            const txCurrency = info.transaction_amount?.currency_code;
            const fee = parseFloat(info.fee_amount?.value || '0');

            const date = info.transaction_initiation_date.split('T')[0];

            const customerName = payer.payer_name?.alternate_full_name || 'N/A';

            // Skip transactions with no customer name (N/A) as per user request
            // These are often internal movements or withdrawals that shouldn't count towards revenue
            if (customerName === 'N/A') {
                return;
            }

            transactions.push({
                id: info.transaction_id,
                date: info.transaction_initiation_date,
                status: info.transaction_status,
                gross: amount,
                fee: fee,
                net: amount + fee,
                currency: txCurrency,
                customerName: customerName,
                customerEmail: payer.email_address || 'N/A',
                invoiceId: info.invoice_id
            });

            if (amount > 0) {
                // Convert to USD if needed
                let amountUSD = amount;
                let feeUSD = fee;

                if (txCurrency !== 'USD') {
                    const rate = rates[txCurrency];
                    if (rate) {
                        // Convert to USD: Amount / Rate
                        // Apply Spread: * (1 - SPREAD)
                        amountUSD = (amount / rate) * (1 - SPREAD);
                        feeUSD = (fee / rate) * (1 - SPREAD); // Fee is usually negative, so logic holds
                    }
                }

                grossTotal += amountUSD;
                feeTotal += Math.abs(feeUSD);
                netTotal += (amountUSD + feeUSD);
                transactionCount++;

                if (dailyEarnings[date]) {
                    dailyEarnings[date] += amountUSD;
                } else {
                    dailyEarnings[date] = amountUSD;
                }
            }
        });

        // Generate complete date range for chart
        const chartData: { date: string; amount: number }[] = [];
        const currentDate = new Date(startDate);

        // Normalize dates to midnight for comparison
        const endDateTime = new Date(endDate);
        endDateTime.setHours(0, 0, 0, 0);

        while (currentDate <= endDateTime) {
            const dateStr = currentDate.toISOString().split('T')[0];
            chartData.push({
                date: dateStr,
                amount: dailyEarnings[dateStr] || 0
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const avgTicket = transactionCount > 0 ? grossTotal / transactionCount : 0;

        // Aggregate sales by country
        const salesByCountryMap: { [key: string]: { amount: number, count: number } } = {};

        allTransactions.forEach((tx: any) => {
            const amount = parseFloat(tx.transaction_info.transaction_amount?.value || '0');
            const txCurrency = tx.transaction_info.transaction_amount?.currency_code;
            const country = tx.payer_info?.country_code || tx.shipping_info?.address?.country_code || 'Unknown';

            if (amount > 0) {
                // Convert to USD for the map aggregation too
                let amountUSD = amount;
                if (txCurrency !== 'USD') {
                    const rate = rates[txCurrency];
                    if (rate) {
                        amountUSD = (amount / rate) * (1 - SPREAD);
                    }
                }

                if (!salesByCountryMap[country]) {
                    salesByCountryMap[country] = { amount: 0, count: 0 };
                }
                salesByCountryMap[country].amount += amountUSD;
                salesByCountryMap[country].count += 1;
            }
        });

        const salesByCountry = Object.entries(salesByCountryMap)
            .map(([countryCode, data]) => ({
                countryCode,
                amount: data.amount,
                count: data.count
            }))
            .sort((a, b) => b.amount - a.amount);

        return {
            summary: {
                grossTotal,
                feeTotal,
                netTotal,
                transactionCount,
                avgTicket,
                currency
            },
            salesByCountry,
            chartData,
            transactions: transactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };

    } catch (error) {
        console.error("Error fetching PayPal data:", error);
        throw error;
    }
};

/**
 * Fetches detailed order information from PayPal API
 * @param orderId The PayPal Order ID (or Transaction ID in some contexts)
 * @returns The full order details JSON
 */
export const getPayPalOrderDetails = async (orderId: string): Promise<any> => {
    try {
        const token = process.env.PAYPAL_ACCESS_TOKEN;
        const environment = process.env.PAYPAL_ENVIRONMENT || 'SANDBOX';
        const baseUrl = environment === 'PRODUCTION'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        if (!token) {
            throw new Error('PayPal Access Token not found in environment variables');
        }

        // 1. Try to fetch as a Capture first (to get detailed financials)
        const captureResponse = await fetch(`${baseUrl}/v2/payments/captures/${orderId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (captureResponse.ok) {
            const captureData = await captureResponse.json();

            // If it's a capture, we should have an order_id to fetch customer details
            const relatedOrderId = captureData.supplementary_data?.related_ids?.order_id;

            if (relatedOrderId) {
                console.log(`Found related Order ID: ${relatedOrderId} for Capture: ${orderId}`);
                const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders/${relatedOrderId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (orderResponse.ok) {
                    const orderData = await orderResponse.json();
                    // Merge data: Order data is the base, but we inject the specific capture financials
                    // We attach the specific capture data to the order for easy access
                    return {
                        ...orderData,
                        _capture_details: captureData // Store specific capture info here
                    };
                }
            }

            // If no order ID or order fetch fails, return capture data (better than nothing)
            return captureData;
        }

        // 2. If Capture failed (404), maybe it IS an Order ID
        console.warn(`v2/payments/captures failed for ID ${orderId}, trying v2/checkout/orders...`);
        const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (orderResponse.ok) {
            return await orderResponse.json();
        }

        // 3. Fallback: Try v1 payments (Sale) just in case
        console.warn(`v2/checkout/orders failed for ID ${orderId}, trying v1/payments/sale...`);
        const saleResponse = await fetch(`${baseUrl}/v1/payments/sale/${orderId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (saleResponse.ok) {
            return await saleResponse.json();
        }

        // If all fail, throw detailed error
        throw new Error(`Failed to fetch details. Capture: ${captureResponse.status}, Order: ${orderResponse.status}, Sale: ${saleResponse.status}`);
    } catch (error) {
        console.error('Error fetching PayPal order details:', error);
        throw error;
    }
};

export { paypalToolkit };
