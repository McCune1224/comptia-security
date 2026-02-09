# Risk Management Formulas

## Basic Risk Formulas

### Single Loss Expectancy (SLE)
```
SLE = Asset Value (AV) × Exposure Factor (EF)
```
**Example:** Server worth $10,000, 50% damage from fire
- SLE = $10,000 × 0.50 = $5,000

### Annualized Rate of Occurrence (ARO)
```
ARO = Expected number of occurrences per year
```
**Example:** Fire expected once every 5 years
- ARO = 1/5 = 0.2

### Annual Loss Expectancy (ALE)
```
ALE = SLE × ARO
```
**Example:** Using values above
- ALE = $5,000 × 0.2 = $1,000 per year

## Business Continuity Terms

### Recovery Time Objective (RTO)
- **Maximum** acceptable downtime
- How long can system be down?

### Recovery Point Objective (RPO)
- **Maximum** acceptable data loss
- How much data can we lose?

### Maximum Tolerable Downtime (MTD)
- Total time business can survive without the system
- MTD ≥ RTO + Work Recovery Time (WRT)

## Cost-Benefit Analysis

### Return on Investment (ROI)
```
ROI = (Benefit - Cost) / Cost × 100%
```

### Cost of Control vs ALE
- If cost of control < ALE → Implement control
- If cost of control > ALE → Accept risk or find cheaper solution

## Example Calculation

**Scenario:** Database server worth $50,000
- Exposure Factor: 75%
- Expected outage: Once every 10 years
- Proposed control cost: $2,000/year

**Calculations:**
- SLE = $50,000 × 0.75 = $37,500
- ARO = 1/10 = 0.1
- ALE = $37,500 × 0.1 = $3,750/year

**Decision:** $2,000 < $3,750 → **Implement the control**

---

*Practice these calculations with different scenarios*
