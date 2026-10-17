from datetime import datetime, timedelta, timezone
from typing import Any, Dict


def evaluate(event: Dict[str, Any], policy: Dict[str, Any], field: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluate insurance policy coverage and estimate payout bounds."""
    peril = event.get("peril", "")
    perils_config = policy.get("perils", {})
    individual_perils = perils_config.get("individual", ["hail", "flood"])
    area_based_perils = perils_config.get("area_based", ["drought", "frost"])

    report_channel = policy.get(
        "report_to",
        {
            "channel": "Crop Insurance app / insurer helpline / bank branch",
            "helpline": "14447",
            "note": "Sample value; verify current channel and window for the scheme and state.",
        },
    )

    # Compute deadline timestamp = event.ts + reporting_window_hours
    reporting_window_hours = policy.get("reporting_window_hours", 72)
    event_ts_str = event.get("ts", "")
    try:
        clean_ts = event_ts_str.replace("Z", "+00:00")
        event_dt = datetime.fromisoformat(clean_ts)
        deadline_dt = event_dt + timedelta(hours=reporting_window_hours)
        deadline_ts = deadline_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        now_dt = datetime.now(timezone.utc)
        deadline_ts = (now_dt + timedelta(hours=reporting_window_hours)).strftime("%Y-%m-%dT%H:%M:%SZ")

    if peril in individual_perils:
        canopy_loss = event.get("canopy_loss_pct", 0.0)
        loss = min(max(float(canopy_loss), 0.0), 100.0)

        si_total = float(policy.get("sum_insured_total", 120000))
        deductible_pct = float(policy.get("deductible_pct", 10))
        deductible = si_total * (deductible_pct / 100.0)

        claim_low = round(max(0.0, si_total * ((loss - 10.0) / 100.0) - deductible))
        claim_high = round(max(0.0, si_total * ((loss + 10.0) / 100.0) - deductible))

        return {
            "claimability": "individual",
            "covered": True,
            "claim_low": claim_low,
            "claim_high": claim_high,
            "deadline_ts": deadline_ts,
            "report_channel": report_channel,
            "note": "Individual claim for localized calamity. Final settlement is the insurer's decision.",
        }

    elif peril in area_based_perils:
        return {
            "claimability": "area_based",
            "covered": True,
            "claim_low": None,
            "claim_high": None,
            "deadline_ts": deadline_ts,
            "report_channel": report_channel,
            "note": "Widespread loss; assessed on area basis (crop cutting experiments). No individual claim estimate.",
        }

    else:
        return {
            "claimability": "not_covered",
            "covered": False,
            "claim_low": None,
            "claim_high": None,
            "deadline_ts": None,
            "report_channel": report_channel,
            "note": "Not an insurable peril. Logged as an input anomaly flag.",
        }
