import { PersonDetails, SolrDocument } from "../_datamodels/datamodel.def";

export interface Person extends PersonDetails {
    documentCount?: number;
    details?: any;
    documents?: Array<SolrDocument>;
}
