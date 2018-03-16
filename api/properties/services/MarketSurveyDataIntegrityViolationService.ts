import {DataIntegrityCheckType} from "../../audit/enums/DataIntegrityEnums";
import {DataIntegrityViolation} from "../../audit/objects/DataIntegrityViolation";
import {DataIntegrityViolationSet} from "../../audit/objects/DataIntegrityViolationSet";
import {IMarketSurvey} from "../interfaces/IMarketSurvey";
import {IMarketSurveyFloorplan} from "../interfaces/IMarketSurveyFloorplan";

export class MarketSurveyDataIntegrityViolationService {
    public getChanged(newSurvey: IMarketSurvey, oldSurvey: IMarketSurvey, isUndo: boolean): DataIntegrityViolationSet {
        if (isUndo || !oldSurvey._id) {
            return null;
        }
        const violationSet = new DataIntegrityViolationSet();
        let v = new DataIntegrityViolation();
        v.description = "";

        let n = newSurvey.occupancy || 0;
        let o = oldSurvey.occupancy || 0;
        let d = Math.abs(n - o);

        // diff must be > 0 and starting value must be over 20%
        if (d > 0 && o >= 20) {
            if (d / o >= .5) {
                v.checkType = DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_50;
                v.description += `Occupancy: ${formatNumber(oldSurvey.occupancy, 1)}% =&gt; ${formatNumber(newSurvey.occupancy, 1)}%<br>`;
            } else if (d / o >= .25) {
                v.checkType = DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_25;
                v.description += `Occupancy: ${formatNumber(oldSurvey.occupancy, 1)}% =&gt; ${formatNumber(newSurvey.occupancy, 1)}%<br>`;
            }
        }

        n = newSurvey.leased || 0;
        o = oldSurvey.leased || 0;
        d = Math.abs(n - o);

        // diff must be > 0 and starting value must be over 20%
        if (d > 0 && o >= 20) {
            if (d / o >= .5) {
                v.checkType = DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_50;
                v.description += `Leased: ${formatNumber(oldSurvey.leased, 1)}% =&gt; ${formatNumber(newSurvey.leased, 1)}%<br>`;
            } else if (d / o >= .25 && v.checkType !== DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_50) {
                v.checkType = DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_25;
                v.description += `Leased: ${formatNumber(oldSurvey.leased, 1)}% =&gt; ${formatNumber(newSurvey.leased, 1)}%<br>`;
            }
        }

        n = newSurvey.atr || 0;
        o = oldSurvey.atr || 0;
        d = Math.abs(n - o);

        // diff must be > 0 and starting value must be over 20%
        if (d > 0 && o >= 20) {
            if (d / o >= .5) {
                v.checkType = DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_50;
                v.description += `ATR: ${formatNumber(oldSurvey.atr, 0)} =&gt; ${formatNumber(newSurvey.atr, 0)}<br>`;
            } else if (d / o >= .25 && v.checkType !== DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_50) {
                v.checkType = DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_25;
                v.description += `ATR: ${formatNumber(oldSurvey.atr, 0)} =&gt; ${formatNumber(newSurvey.atr, 0)}<br>`;
            }
        }

        if (v.description !== "") {
           violationSet.violations.push(v);
        }

        /* Separate violation for NER */

        v = new DataIntegrityViolation();
        v.description = "";

        const totalUnitsNew: number = calculateTotalUnits(newSurvey.floorplans);
        const totalUnitsOld: number = calculateTotalUnits(oldSurvey.floorplans);

        if (totalUnitsNew > 0 || totalUnitsOld > 0) {
            n = calculateNER(newSurvey.floorplans, totalUnitsNew);
            o = calculateNER(oldSurvey.floorplans, totalUnitsOld);
            d = Math.abs(n - o);

            // diff must be > 0
            if (d > 0 && o >= 0) {
                if (d / o >= .5) {
                    v.checkType = DataIntegrityCheckType.NER_CHANGED_50;
                    v.description += `NER: \$${formatNumber(o, 0)} =&gt; \$${formatNumber(n, 0)}<br>`;
                } else if (d / o >= .25) {
                    v.checkType = DataIntegrityCheckType.NER_CHANGED_25;
                    v.description += `NER: \$${formatNumber(o, 0)} =&gt; \$${formatNumber(n, 0)}<br>`;
                }

                // Take calcuated weighted average NER and divice my weighted average SQFT
                const sqftNew = calculateSQFT(newSurvey.floorplans, totalUnitsNew);
                const sqftOld = calculateSQFT(oldSurvey.floorplans, totalUnitsNew);
                n = n / sqftNew;
                o = o / sqftOld;

                d = Math.abs(n - o);

                if (d > 0 && o >= 0) {
                    if (d / o >= .5) {
                        v.checkType = DataIntegrityCheckType.NER_CHANGED_50;
                        v.description += `NER/Sqft: \$${formatNumber(o, 2)} =&gt; \$${formatNumber(n, 2)}<br>`;
                    } else if (d / o >= .25 && v.checkType !== DataIntegrityCheckType.NER_CHANGED_50) {
                        v.checkType = DataIntegrityCheckType.NER_CHANGED_25;
                        v.description += `NER/Sqft: \$${formatNumber(o, 2)} =&gt; \$${formatNumber(n, 2)}<br>`;
                    }
                }
            }
        }

        if (v.description !== "") {
            violationSet.violations.push(v);
        }

        if (violationSet.violations.length > 0) {
            return violationSet;
        }

        return null;

    }
}

function calculateTotalUnits(floorplans: IMarketSurveyFloorplan[]): number {
    let result = 0;
    floorplans.map((x) => x.units).forEach((x) => result += x);
    return result;
}

function calculateNER(floorplans: IMarketSurveyFloorplan[], totalUnits: number): number {
    let result = 0;
    floorplans.map((x) => x.units * (x.rent - x.concessions / 12)).forEach((x) => result += x);

    result /= totalUnits;

    return result;
}

function calculateSQFT(floorplans: IMarketSurveyFloorplan[], totalUnits: number): number {
    let result = 0;
    floorplans.map((x) => x.units * x.sqft).forEach((x) => result += x);

    result /= totalUnits;

    return result;
}

function formatNumber(value: number, decimals: number): string {
    if (typeof value === "undefined" || value === null) {
        return "N/A";
    }

    return value.toFixed(decimals);
}
