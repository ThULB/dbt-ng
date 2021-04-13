import { XmlMappedElement } from "../_providers/transform.provider";

export const AdminRoles = ["admin"];

export const EditorRoles = ["editor"];

/**
 * WebIf Helpers
 */

export interface IdentifierDetails {
  prefix: string;
  id: string;
}

export interface PersonDetails {
  name: string;
  id?: IdentifierDetails;
}

export const personDetails = (str: string): PersonDetails => {
  const re = new RegExp("([^:]+)(?::(.*))?");
  if (str) {
    if (re.test(str)) {
      const m = str.match(re);
      return { name: m[1], id: identifierDetails(m[2]) };
    }
  }

  return null;
};

export const identifierDetails = (str: string): IdentifierDetails => {
  const re = new RegExp("([^:]+):(.*)");
  if (str) {
    if (re.test(str)) {
      const m = str.match(re);
      return { prefix: m[1], id: m[2] };
    }
  }

  return null;
};

/**
 * SOLR
 */
export interface SolrResponseHeader {
  status: number;
  params: Map<string, any>;
}

export interface SolrResponse {
  numFound: number;
  start: number;
  maxScore: number;
  docs: Array<SolrDocument>;
}

export interface SolrDocument {
  [key: string]: any;
  length?: number;
}

export interface SolrTerms {
  [key: string]: any;
  length?: number;
}

export interface SolrFacetObject {
  [key: string]: any;
  length?: number;
}

export interface SolrFacet {
  label: string;
  count: number;
}

export interface SolrFacetCounts {
  facet_queries: SolrFacetObject;
  facet_fields: SolrFacetObject;
  facet_ranges: SolrFacetObject;
  facet_intervals: SolrFacetObject;
  facet_heatmaps: SolrFacetObject;
}

export interface SolrSelectResponse {
  responseHeader: SolrResponseHeader;
  response: SolrResponse;
  facet_counts: SolrFacetCounts;
}

export interface SolrTermsResponse {
  responseHeader: SolrResponseHeader;
  terms: SolrTerms;
}

/**
 * MyCoRe Object
 */

export class MCRObject extends XmlMappedElement {

  id: string;

  constructor(object: any) {
    super(object);
    this.id = this.getAttributeValue("ID");
  }

  mods() {
    return this.getElement("mods:mods", true);
  }

}

/**
 * MyCoRe Derivate
 */

export class MCRDerivate extends XmlMappedElement {

  objectId: string;

  id: string;

  display: boolean;

  constructor(object: any, objectId?: string) {
    super(object);

    const d = this.getElement("derivate");

    this.objectId = objectId ||
      d.getElementWithAttribute("linkmeta", { "xlink:type": "locator" }, true).getAttributeValue("xlink:href");
    this.id = this.getAttributeValue("ID");
    this.display = JSON.parse(d.getAttributeValue("display")) || false;
  }

}

export interface MCRDerivateContentDirectory {
  name: string | null;
  directory: Array<MCRDerivateContentDirectory> | null;
}

export interface MCRDerivateContentFile {
  name: string | null;
  md5: string;
  modified: Date;
  size: number;
}

export interface MCRDerivateContent {
  name?: string | null;
  directory?: Array<MCRDerivateContentDirectory> | null;
  file?: Array<MCRDerivateContentFile> | null;
  directories: Array<MCRDerivateContentDirectory> | null;
  files: Array<MCRDerivateContentFile> | null;
}

/**
 * Media
 */

export interface MediaSource {
  src: string;
  type: string;
}

export interface MediaSources {
  id?: string;
  source: Array<MediaSource>;
}

/**
 * MODS
 */

export class Mods extends XmlMappedElement {

  defaultLang = "de";
  lang: string;

  constructor(mods: any) {
    super(mods);

    const elms = this.getElements("mods:language");
    if (elms && elms[0].getElements("mods:languageTerm")) {
      this.lang = elms[0].getElements("mods:languageTerm")[0].text;
    }
  }

  getElementsByType(name: string, t: string): Array<XmlMappedElement> {
    return this.getElementsWithAttribute(name, {
      type: t
    });
  }

  getElementsByLang(name: string, lang: string): Array<XmlMappedElement> {
    const elms = this.getElementsWithAttribute(name, "xml:lang");
    const res = elms.filter((e) => e.getAttributeValue("xml:lang") === lang);
    return res.length !== 0 ? res : elms.filter((e) => e.getAttributeValue("xml:lang") === this.defaultLang);
  }

  getPersonsByTerm(term: string) {
    const persons = this.getElementsByType("mods:name", "personal");
    return persons ? persons.filter((p) => p.getElements("mods:roleTerm", true)
      .find((rt) => "marcrelator" === rt.getAttributeValue("authority") && term === rt.text) != null
    ) : null;
  }

  personDetails(elm: XmlMappedElement): PersonDetails {
    if (elm) {
      const mn = elm.getElement("mods:nameIdentifier");
      const id: IdentifierDetails = mn ? { prefix: mn.getAttributeValue("type"), id: mn.text } : null;
      const pd: PersonDetails = { name: elm.getElement("mods:displayForm").text, id: id };
      return pd;
    }

    return null;
  }

  buildTitle(elm: XmlMappedElement): string {
    if (elm) {
      const ns = elm.getElement("mods:nonSort");
      const st = elm.getElement("mods:subTitle");
      return (ns ? ns.text + " " : "") + elm.getElement("mods:title").text + (st ? " : " + st.text : "");
    }

    return null;
  }

  filterAltFormat(elms: Array<XmlMappedElement>): Array<XmlMappedElement> {
    return elms.filter((e) => e.getAttributeValue("altFormat") == null);
  }

  filterLang(elms: Array<XmlMappedElement>, lang: string, reverse: boolean = false) {
    return elms.filter((e) =>
      (reverse && e.getAttributeValue("xml:lang") !== lang) ||
      (!reverse && e.getAttributeValue("xml:lang") === lang)
    );
  }

  orderByDateIssued(elms: Array<XmlMappedElement>, reverse: boolean = false): Array<XmlMappedElement> {
    return elms.sort((a, b) => {
      const ae = a.getElement("mods:dateIssued", true);
      const be = b.getElement("mods:dateIssued", true);
      return ae && be ?
        (ae.text === be.text ? 0 :
          (ae.text < be.text ? (reverse ? 1 : -1) : (reverse ? -1 : 1))) : 0;
    });
  }
}

export interface MCRObjectVersion {
  user: string;
  date: Date;
  type: string;
  r: number;
}
