import json
import re
from collections import Counter

TRANSCRIPT = r"C:\Users\kiaan\.cursor\projects\c-Users-kiaan-Desktop-aman-kiaan-technlogy-Trading-New\agent-transcripts\b89c945a-6252-4505-a1c7-52b804636868\b89c945a-6252-4505-a1c7-52b804636868.jsonl"

MCX_PREFIXES = tuple(
    sorted(
        [
            "ALUMINIUM",
            "COPPER",
            "CRUDEOIL",
            "CRUDEOILM",
            "GOLD",
            "GOLDM",
            "LEAD",
            "NATURALGAS",
            "NATGASMINI",
            "SILVER",
            "SILVERM",
            "SILVERMIC",
            "ZINC",
            "NICKEL",
            "COTTON",
            "KAPAS",
            "CARDAMOM",
            "MENTHAOIL",
            "STEELREBAR",
            "IRONORE",
        ],
        key=len,
        reverse=True,
    )
)


def is_mcx(sym: str) -> bool:
    u = sym.upper()
    return any(u.startswith(p) for p in MCX_PREFIXES)


def classify(sym: str) -> str:
    u = sym.strip().upper()
    if is_mcx(u):
        return "MCX"
    if re.search(r"(FUT|CE|PE)$", u):
        return "NFO"
    return "NSE_EQ"


# Non-Indian equity rows at end of paste (forex/Intl futures style)
_NON_NSE_EQ_SYMBOLS = frozenset(
    {
        "6AM6",
        "6BM6",
        "6CM6",
        "6EM6",
        "6JM6",
        "6NM6",
        "6SM6",
        "CLK6",
        "ETHK6",
        "GCJ6",
        "GCK6",
        "GCM6",
        "HGK6",
        "NGK26",
        "NGM26",
        "SIK6",
    }
)


def is_nse_equity_candidate(sym: str) -> bool:
    s = sym.strip().upper()
    if s in _NON_NSE_EQ_SYMBOLS:
        return False
    if re.match(r"^\d{1,2}[A-Z][A-Z]?\d+$", s):
        return False
    return classify(sym) == "NSE_EQ"


def main() -> None:
    text = None
    with open(TRANSCRIPT, encoding="utf-8", errors="replace") as f:
        for line in f:
            if "ALUMINIUM26APRFUT" not in line:
                continue
            try:
                o = json.loads(line)
            except json.JSONDecodeError:
                continue
            if o.get("role") != "user":
                continue
            c = o.get("message", {}).get("content")
            if not isinstance(c, list) or not c:
                continue
            t = c[0].get("text", "") if isinstance(c[0], dict) else ""
            if "ALUMINIUM26APRFUT" in t and len(t) > 5000:
                text = t
                break

    if not text:
        print("Could not find paste blob in transcript.")
        return

    if "<user_query>" in text:
        text = text.split("<user_query>", 1)[1]
    if "</user_query>" in text:
        text = text.split("</user_query>", 1)[0]

    lines = text.splitlines()
    symbols = []
    for ln in lines:
        s = ln.strip()
        if not s or "\t" in s:
            continue
        if re.match(r"^\d{4}-\d{2}-\d{2}$", s) or re.match(r"^\d{1,2}/\d{1,2}/\d{4}$", s):
            continue
        if s.startswith("mene bheja"):
            break
        symbols.append(s)

    ctr = Counter(classify(x) for x in symbols)
    print("total_instruments", len(symbols))
    print("MCX", ctr["MCX"])
    print("NFO_NSE_derivatives", ctr["NFO"])
    print("NSE_equity_cash", ctr["NSE_EQ"])
    print("NSE_total_EQ_plus_NFO", ctr["NSE_EQ"] + ctr["NFO"])

    nse_eq = sorted({x.strip().upper() for x in symbols if is_nse_equity_candidate(x)})
    out = __import__("pathlib").Path(__file__).resolve().parents[2] / "Trading_Backend" / "src" / "data" / "user_nse_equity_watchlist.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(nse_eq, indent=2) + "\n", encoding="utf-8")
    print("wrote", out, "count", len(nse_eq))


if __name__ == "__main__":
    main()
