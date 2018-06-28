import {GraphQLError, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import {OrganizationSearchResponse} from "../../services/organizations/contracts/OrganizationSearchResponse";
import * as ServiceRegistry from "../ServiceRegistry";
import {Organization} from "../types/organizations/Organization";
import {OrganizationSearchCriteria} from "../types/organizations/OrganizationSearchCriteria";

export const Organizations = {
    args: {
        criteria: {type: OrganizationSearchCriteria},
    },
    description: "Retrieve list of client organizations.",
    type: new GraphQLList(Organization),
    resolve(_, {criteria}, request) {
        return ServiceRegistry.getOrganizationService().read({
            criteria,
            userJwt: request.user_jwt,
            webContext: request.context,
        }).then((response: OrganizationSearchResponse) => {
            return response.data;
        }).catch((error) => {
            throw new GraphQLError(error);
        });
    },
};