import React, { useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Tooltip } from "react-tooltip";
import { useTranslation } from "react-i18next";

const mapUrl = "/maps/world-countries.json";

// ISO 2 to ISO 3 mapping
const iso2ToIso3: { [key: string]: string } = {
    "AF": "AFG", "AX": "ALA", "AL": "ALB", "DZ": "DZA", "AS": "ASM", "AD": "AND", "AO": "AGO", "AI": "AIA", "AQ": "ATA", "AG": "ATG", "AR": "ARG", "AM": "ARM", "AW": "ABW", "AU": "AUS", "AT": "AUT", "AZ": "AZE",
    "BS": "BHS", "BH": "BHR", "BD": "BGD", "BB": "BRB", "BY": "BLR", "BE": "BEL", "BZ": "BLZ", "BJ": "BEN", "BM": "BMU", "BT": "BTN", "BO": "BOL", "BQ": "BES", "BA": "BIH", "BW": "BWA", "BV": "BVT", "BR": "BRA", "IO": "IOT", "BN": "BRN", "BG": "BGR", "BF": "BFA", "BI": "BDI", "CV": "CPV", "KH": "KHM", "CM": "CMR", "CA": "CAN", "KY": "CYM", "CF": "CAF", "TD": "TCD", "CL": "CHL", "CN": "CHN", "CX": "CXR", "CC": "CCK", "CO": "COL", "KM": "COM", "CD": "COD", "CG": "COG", "CK": "COK", "CR": "CRI", "CI": "CIV", "HR": "HRV", "CU": "CUB", "CW": "CUW", "CY": "CYP", "CZ": "CZE",
    "DK": "DNK", "DJ": "DJI", "DM": "DMA", "DO": "DOM", "EC": "ECU", "EG": "EGY", "SV": "SLV", "GQ": "GNQ", "ER": "ERI", "EE": "EST", "SZ": "SWZ", "ET": "ETH", "FK": "FLK", "FO": "FRO", "FJ": "FJI", "FI": "FIN", "FR": "FRA", "GF": "GUF", "PF": "PYF", "TF": "ATF", "GA": "GAB", "GM": "GMB", "GE": "GEO", "DE": "DEU", "GH": "GHA", "GI": "GIB", "GR": "GRC", "GL": "GRL", "GD": "GRD", "GP": "GLP", "GU": "GUM", "GT": "GTM", "GG": "GGY", "GN": "GIN", "GW": "GNB", "GY": "GUY", "HT": "HTI", "HM": "HMD", "VA": "VAT", "HN": "HND", "HK": "HKG", "HU": "HUN", "IS": "ISL", "IN": "IND", "ID": "IDN", "IR": "IRN", "IQ": "IRQ", "IE": "IRL", "IM": "IMN", "IL": "ISR", "IT": "ITA",
    "JM": "JAM", "JP": "JPN", "JE": "JEY", "JO": "JOR", "KZ": "KAZ", "KE": "KEN", "KI": "KIR", "KP": "PRK", "KR": "KOR", "KW": "KWT", "KG": "KGZ", "LA": "LAO", "LV": "LVA", "LB": "LBN", "LS": "LSO", "LR": "LBR", "LY": "LBY", "LI": "LIE", "LT": "LTU", "LU": "LUX", "MO": "MAC", "MG": "MDG", "MW": "MWI", "MY": "MYS", "MV": "MDV", "ML": "MLI", "MT": "MLT", "MH": "MHL", "MQ": "MTQ", "MR": "MRT", "MU": "MUS", "YT": "MYT", "MX": "MEX", "FM": "FSM", "MD": "MDA", "MC": "MCO", "MN": "MNG", "ME": "MNE", "MS": "MSR", "MA": "MAR", "MZ": "MOZ", "MM": "MMR",
    "NA": "NAM", "NR": "NRU", "NP": "NPL", "NL": "NLD", "NC": "NCL", "NZ": "NZL", "NI": "NIC", "NE": "NER", "NG": "NGA", "NU": "NIU", "NF": "NFK", "MK": "MKD", "MP": "MNP", "NO": "NOR", "OM": "OMN", "PK": "PAK", "PW": "PLW", "PS": "PSE", "PA": "PAN", "PG": "PNG", "PY": "PRY", "PE": "PER", "PH": "PHL", "PN": "PCN", "PL": "POL", "PT": "PRT", "PR": "PRI", "QA": "QAT", "RE": "REU", "RO": "ROU", "RU": "RUS", "RW": "RWA", "BL": "BLM", "SH": "SHN", "KN": "KNA", "LC": "LCA", "MF": "MAF", "PM": "SPM", "VC": "VCT", "WS": "WSM", "SM": "SMR", "ST": "STP", "SA": "SAU", "SN": "SEN", "RS": "SRB", "SC": "SYC", "SL": "SLE", "SG": "SGP", "SX": "SXM", "SK": "SVK", "SI": "SVN", "SB": "SLB", "SO": "SOM", "ZA": "ZAF", "GS": "SGS", "SS": "SSD", "ES": "ESP", "LK": "LKA", "SD": "SDN", "SR": "SUR", "SJ": "SJM", "SE": "SWE", "CH": "CHE", "SY": "SYR", "TW": "TWN", "TJ": "TJK", "TZ": "TZA", "TH": "THA", "TL": "TLS", "TG": "TGO", "TK": "TKL", "TO": "TON", "TT": "TTO", "TN": "TUN", "TR": "TUR", "TM": "TKM", "TC": "TCA", "TV": "TUV", "UG": "UGA", "UA": "UKR", "AE": "ARE", "GB": "GBR", "US": "USA", "UY": "URY", "UZ": "UZB", "VU": "VUT", "VE": "VEN", "VN": "VNM", "VG": "VGB", "VI": "VIR", "WF": "WLF", "EH": "ESH", "YE": "YEM", "ZM": "ZMB", "ZW": "ZWE"
};

interface WorldMapProps {
    data: { countryCode: string; amount: number; count: number }[];
}

const WorldMap: React.FC<WorldMapProps> = ({ data }) => {
    const { t } = useTranslation();
    const maxAmount = Math.max(...data.map((d) => d.amount), 1);

    const colorScale = scaleLinear<string>()
        .domain([0, maxAmount])
        .range(["#2d3748", "#38b2ac"]); // Dark gray to Teal

    const countryData = useMemo(() => {
        const map: { [key: string]: { amount: number; count: number; name?: string } } = {};
        data.forEach((d) => {
            const iso3 = iso2ToIso3[d.countryCode] || d.countryCode;
            map[iso3] = d;
        });
        return map;
    }, [data]);

    // Calculate top 5 countries
    const topCountries = useMemo(() => {
        return [...data]
            .filter(d => d.countryCode && d.countryCode.toLowerCase() !== 'unknown')
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }, [data]);

    // Legend ranges
    const legendRanges = useMemo(() => {
        const step = maxAmount / 4;
        return [
            { label: t('dashboard.no_sales'), color: "#3f3f46" },
            { label: `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(0)} - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(step)}`, color: colorScale(step * 0.5) },
            { label: `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(step)} - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(step * 2)}`, color: colorScale(step * 1.5) },
            { label: `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(step * 2)} - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(step * 3)}`, color: colorScale(step * 2.5) },
            { label: `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(step * 3)} - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(maxAmount)}`, color: colorScale(maxAmount) },
        ];
    }, [maxAmount, colorScale, t]);

    return (
        <div className="flex flex-col gap-6 w-full h-full">
            <div className="w-full h-[300px] bg-transparent rounded-xl overflow-hidden relative flex items-center justify-center">
                <ComposableMap
                    projectionConfig={{ scale: 140 }}
                    width={800}
                    height={400}
                    style={{ width: "100%", height: "100%" }}
                >
                    <ZoomableGroup>
                        <Geographies geography={mapUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const cur = countryData[geo.id];
                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill={cur ? colorScale(cur.amount) : "#3f3f46"} // Lighter gray (zinc-700) for better visibility
                                            stroke="#18181b" // Darker stroke (zinc-900)
                                            strokeWidth={0.5}
                                            style={{
                                                default: { outline: "none" },
                                                hover: { fill: "#2dd4bf", outline: "none", cursor: "pointer" }, // Teal-400
                                                pressed: { outline: "none" },
                                            }}
                                            data-tooltip-id="my-tooltip"
                                            data-tooltip-content={`${geo.properties.name}: $${cur ? cur.amount.toFixed(2) : "0.00"}`}
                                        />
                                    );
                                })
                            }
                        </Geographies>
                    </ZoomableGroup>
                </ComposableMap>
                <Tooltip id="my-tooltip" style={{ backgroundColor: "#000", color: "#fff", borderRadius: "8px" }} />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 justify-center">
                {legendRanges.map((range, index) => (
                    <div key={index} className="flex flex-col items-center gap-1 min-w-[80px]">
                        <div className="w-full h-2 rounded-full" style={{ backgroundColor: range.color }}></div>
                        <span className="text-[10px] text-zinc-500 whitespace-nowrap">{range.label}</span>
                    </div>
                ))}
            </div>

            {/* Top 5 Countries */}
            <div className="flex flex-col gap-3">
                <h4 className="text-sm font-medium text-zinc-300">{t('dashboard.top_5_countries')}</h4>
                <div className="flex flex-col divide-y divide-white/5">
                    {topCountries.map((country, index) => (
                        <div key={index} className="flex justify-between items-center py-2">
                            <span className="text-sm text-zinc-400">{country.countryCode}</span>
                            <span className="text-sm font-medium text-zinc-200">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(country.amount)}
                            </span>
                        </div>
                    ))}
                    {topCountries.length === 0 && (
                        <div className="text-center text-zinc-500 py-2 text-sm">{t('dashboard.no_sales')}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorldMap;
