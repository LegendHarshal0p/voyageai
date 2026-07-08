import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRightLeft } from "lucide-react";

const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "INR", "AUD", "CAD", "CHF", "CNY", "SGD"];

// Simple in-memory cache so switching "to" currency repeatedly doesn't refetch
// the whole rate table for the same "from" currency every time.
const rateCache = new Map<string, Record<string, number>>();

async function fetchRates(base: string): Promise<Record<string, number>> {
  if (rateCache.has(base)) return rateCache.get(base)!;

  // open.er-api.com is free, requires no API key, and has CORS enabled for
  // browser use — more reliable for this than frankfurter.app in some networks.
  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
  if (!res.ok) throw new Error(`Rate lookup failed (${res.status})`);

  const data = await res.json();
  if (data.result !== "success" || !data.rates) {
    throw new Error(data["error-type"] ?? "Rate lookup returned no data.");
  }

  rateCache.set(base, data.rates);
  return data.rates;
}

export function CurrencyConverter() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [converted, setConverted] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const numericAmount = parseFloat(amount);

    if (Number.isNaN(numericAmount)) {
      setConverted(null);
      setError(null);
      return;
    }

    if (from === to) {
      setConverted(numericAmount);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
      fetchRates(from)
        .then((rates) => {
          if (cancelled) return;
          const rate = rates[to];
          if (rate == null) {
            setError(`No rate available for ${to}.`);
            setConverted(null);
            return;
          }
          setConverted(numericAmount * rate);
        })
        .catch((err) => {
          if (!cancelled) {
            console.error("Currency conversion failed:", err);
            setError(err instanceof Error ? err.message : "Conversion unavailable right now.");
            setConverted(null);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [amount, from, to]);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Currency converter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-24"
          />
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-10 rounded-md border border-border bg-card px-2 text-sm"
          >
            {COMMON_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button onClick={swap} aria-label="Swap currencies" className="p-1">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-10 rounded-md border border-border bg-card px-2 text-sm"
          >
            {COMMON_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3">
          {loading ? (
            <p className="text-lg font-semibold text-muted-foreground">Converting...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : converted != null ? (
            <p className="text-lg font-semibold">{converted.toFixed(2)} {to}</p>
          ) : (
            <p className="text-lg font-semibold text-muted-foreground">—</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
