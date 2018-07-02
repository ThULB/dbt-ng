import { PersonDetails, personDetails, IdentifierDetails, identifierDetails,
    SolrFacetObject, SolrFacet } from "../_datamodels/datamodel.def";
import { fileExtension, FilePath, filePath } from "../_helpers/file.utils";

export class MetadataHelpers {

    trackByIdx(index: number, obj: any): any {
        return index;
    }

    fileExtension(fileName: string): string {
        return fileExtension(fileName);
    }

    filePath(path: string): FilePath {
        return filePath(path);
    }

    personDetails(str: string): PersonDetails {
        return personDetails(str);
    }

    identifierDetails(str: string): IdentifierDetails {
        return identifierDetails(str);
    }

    categoryLabelFilter(labels: Array<any>, lang: string) {
        if (labels) {
            return labels.filter((l) => l && l.lang === lang);
        }

        return null;
    }

    licenseFilter(item: any): any {
        return item && item.indexOf("http") === 0 && item.indexOf("licenses") !== -1;
    }

    ccLicenseImage(url: string, image: string = "88x31.png"): string {
        const ccRe = new RegExp("https?://.*creativecommons.*/licenses/(.*)");
        if (ccRe.test(url)) {
            const m = url.match(ccRe);
            return `//i.creativecommons.org/l/${m[1].lastIndexOf("/") !== -1 ? m[1] : m[1] + "/"}${image}`;
        }

        return url;
    }

    itemsStartsWith(items: any, starts: string) {
        if (items) {
            return Object.getOwnPropertyNames(items).filter((i) => i.startsWith(starts));
        }

        return null;
    }

    getClassificationFromValue(value: string): string {
        if (!value) {
            return null;
        }

        let name;
        const urlPattern: RegExp = new RegExp("https?:\/\/.*\/classifications.*\/([^#]+)(?:#(.*))?");

        if (urlPattern.test(value)) {
            const m = value.match(urlPattern);
            name = m[1];
            value = m[2];
        } else if (value.indexOf(":") !== -1) {
            const parts = value.split(":");
            name = name || parts[0];
            value = parts[1];
        }

        return name;
    }

    trimIdFromValueUri(valueUri: string): string {
        const o = valueUri ? valueUri.indexOf("#") : -1;
        if (o !== -1) {
            return valueUri.substring(0, o);
        }
        return valueUri;
    }

    extractPPN(str: string): string {
        if (str) {
            const re = new RegExp("gvk:ppn:(.*)");
            if (re.test(str)) {
                return str.match(re)[1];
            }
        }

        return null;
    }

    parseFacets(facets: SolrFacetObject): Array<SolrFacet> {
        if (facets) {
            const res: Array<SolrFacet> = new Array();
            for (let i = 0; i < facets.length; i += 2) {
                res.push({ label: facets[i], count: parseInt(facets[i + 1], 10) });
            }
            return res;
        }

        return null;
    }

    getMapKeys(map: Map<string, any>): Array<string> {
        return Array.from(map.keys());
    }

    getMapValues(map: Map<String, any>): Array<any> {
        return Array.from(map.values());
    }

    getObjectKeys(obj: Object): Array<string> {
        return Object.keys(obj);
    }
}
