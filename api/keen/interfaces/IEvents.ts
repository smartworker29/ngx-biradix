export interface IEvent {
    type: KeenEventType;
    payload: any;
}

export enum KeenEventType {
    SURVEYSWAP_SETUP_FOR_PROPERTY = "SurveySwap Setup For Property",
    SURVEYSWAP_REQUESTED = "SurveySwap Requested",
    SURVEYSWAP_RESPONDED = "SurveySwap Responded",
    SURVEYSWAP_TOTALS = "SurveySwap Totals",
}