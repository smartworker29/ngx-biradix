import * as express from "express";
import * as propertyService from "../../../api/properties/services/propertyService";
import * as userService from "../../../api/users/services/userService";
import {IPropertySearchRequest} from "../interfaces/IPropertySearchRequest";
import {ICustomError} from "../../services/library/sharedContracts/ICustomError";
import {IProperty} from "../interfaces/IProperty";
import {IPropertyTotalsEvent} from "../../keen/interfaces/IPropertyTotalsEvent";
import {KeenEventType} from "../../keen/interfaces/IEvents";
import {KeenService} from "../../keen/services/keenService";
const routes = express.Router();

routes.get("/daily_totals", async (req, res) => {
    userService.getSystemUser((obj) => {
        const SystemUser = obj.user;

        const PropertySearchRequest: IPropertySearchRequest = {
            active: true,
            hideCustom: true,
            limit: 100000,
            select: "name survey totalUnits orgid",
        };

        // Get all Comps
        propertyService.search(SystemUser, PropertySearchRequest, (errors: ICustomError[], properties: IProperty[]) => {
            const event: IPropertyTotalsEvent = {
                payload: {
                    high_assigned_properties: 0,
                    high_assigned_units: 0,
                    high_properties: 0,
                    high_units: 0,
                    low_assigned_properties: 0,
                    low_assigned_units: 0,
                    low_properties: 0,
                    low_units: 0,
                    medium_assigned_properties: 0,
                    medium_assigned_units: 0,
                    medium_properties: 0,
                    medium_units: 0,
                    total_assigned_properties: 0,
                    total_assigned_units: 0,
                    total_properties: 0,
                    total_units: 0,
                },
                type: KeenEventType.PROPERTY_TOTALS,
            };

            const enum UPDATED {
                LOW,
                MEDIUM,
                HIGH,
            }
            let state: UPDATED;

            let days: number;
            properties.forEach((property: any) => {

                state = UPDATED.LOW;
                if (property.survey && property.survey.date) {
                    days = Math.round(((new Date()).getTime() - (new Date(property.survey.date)).getTime()) / 1000 / 60 / 60 / 24);
                    if (days <= 10) {
                        state = UPDATED.HIGH;
                    } else if (days <= 30) {
                        state = UPDATED.MEDIUM;
                    }
                }

                event.payload.total_properties++;
                event.payload.total_units += property.totalUnits;

                if (state === UPDATED.HIGH) {
                    event.payload.high_properties++;
                    event.payload.high_units += property.totalUnits;
                } else if (state === UPDATED.MEDIUM) {
                    event.payload.medium_properties++;
                    event.payload.medium_units += property.totalUnits;
                } else {
                    event.payload.low_properties++;
                    event.payload.low_units += property.totalUnits;
                }

                if (property.orgid) {
                    event.payload.total_assigned_properties++;
                    event.payload.total_assigned_units += property.totalUnits;

                    if (state === UPDATED.HIGH) {
                        event.payload.high_assigned_properties++;
                        event.payload.high_assigned_units += property.totalUnits;
                    } else if (state === UPDATED.MEDIUM) {
                        event.payload.medium_assigned_properties++;
                        event.payload.medium_assigned_units += property.totalUnits;
                    } else {
                        event.payload.low_assigned_properties++;
                        event.payload.low_assigned_units += property.totalUnits;
                    }
                }
            });

            KeenService.recordEvent(event);

            res.status(200).json(event);
        });
    });
});

module.exports = routes;
