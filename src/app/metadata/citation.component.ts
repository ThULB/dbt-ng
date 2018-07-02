import { Component, OnInit, Input } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

import { CacheService } from "../_services/cache.service";
import { ErrorService } from "../_services/error.service";
import { ScriptService } from "../_services/script.service";
import { TranslateService } from "@ngx-translate/core";

import { MCRObject, Mods } from "../_datamodels/datamodel.def";

interface Identifier {
    type: string;
    value: string;
    altmetric?: boolean;
}

@Component({
    selector: "ui-citation",
    templateUrl: "./citation.component.html"
})
export class CitationComponent implements OnInit {

    @Input()
    public object: MCRObject;

    public mods: Mods;

    public dataciteStyles = [
        "deutsche-sprache", "apa", "bibtex", "elsevier-harvard", "ieee",
        "springer-basic-author-date", "din-1505-2"
    ];

    private altmetricApiUrl = "https://api.altmetric.com/v1";

    private dataciteUrl = "https://data.datacite.org/text/x-bibliography";

    public supportedIdentifier = ["doi", "urn", "handle", "isbn"];

    public identifier: Array<Identifier> = new Array();

    public style: string;

    public citation: any;

    public loading = true;

    constructor(private $http: HttpClient, private $error: ErrorService,
        private modalService: NgbModal, private $script: ScriptService, private translate: TranslateService) {

        this.$script.addToStore("altmetrics", "https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js");

        this.style = window.localStorage.getItem("citationStyle");
    }

    ngOnInit() {
        this.mods = new Mods(this.object.mods());

        this.supportedIdentifier.forEach((t) => {
            const elms = this.mods.getElementsWithAttribute("mods:identifier", { "type": t });
            elms.forEach((e) => this.identifier.push({ type: t, value: e.text }));
        });

        this.load();
        this.checkAltmetrics().then(() => this.altmericEnabledId() && this.$script.loadScript("altmetrics"));
    }

    private load() {
        const doi = <Identifier>this.identifierByType("doi", false);
        if (doi) {
            this.style = this.style || this.dataciteStyles[0];

            const cacheKey = ["citation", doi.value, this.style].join("_");
            const cache = CacheService.get(cacheKey);

            if (cache) {
                this.citation = cache;
                this.loading = false;
            } else {
                this.loading = true;
                return this.$http.get(
                    `${this.dataciteUrl};style=${this.style};locale=${this.translate.getBrowserCultureLang()}/${doi.value}`,
                    { responseType: "text" as "text" }
                ).toPromise().then((res: any) => {
                    this.citation = this.formatCitation(res);
                    this.loading = false;
                    CacheService.set(cacheKey, this.citation, CacheService.DEFAULT_LIFETIME);
                }).catch((err) => {
                    this.loading = false;
                    this.$error.handleError(err);
                });
            }
        } else {
            this.mods2isbd();
        }
    }

    private checkAltmetrics() {
        const promises = [];
        this.identifier.forEach(id => promises.push(this.checkAltmetric(id)));
        return Promise.all(promises);
    }

    private checkAltmetric(id: Identifier) {
        return this.$http.get(`${this.altmetricApiUrl}/${id.type}/${id.value}`).toPromise().then((res: any) => {
            return Object.assign(id, { altmetric: true });
        }).catch((err) => {
            return Object.assign(id, { altmetric: false });
        });
    }

    private formatCitation(citation: string) {
        return citation.replace(new RegExp("(\n|\r\n)", "g"), "<br>");
    }

    private mods2isbd() {
        if (this.mods) {
            let citation = "";
            const ti = this.mods.getElement("mods:titleInfo");
            citation += ti.getElement("mods:nonSort") ? ti.getElement("mods:nonSort").text : "";
            citation += ti.getElement("mods:title").text;
            citation += ti.getElement("mods:subTitle") ? " : " + ti.getElement("mods:subTitle").text : "";
            citation += "\n";

            const authors = this.mods.getPersonsByTerm("aut");
            if (authors && authors.length !== 0) {
                citation += "/ ";
                authors.forEach((aut, i) => {
                    citation += (aut.getElementWithAttribute("mods:namePart", { type: "family" }).text + ", " +
                        aut.getElementWithAttribute("mods:namePart", { type: "given" }).text) ||
                        aut.getElement("mods:displayForm").text;

                    if (i < authors.length - 1) { citation += "; "; }
                });
            }

            const oi = this.mods.getElementWithAttribute("mods:originInfo", { eventType: "publication" });
            if (oi) {
                const pe = oi.getElement("mods:place");
                if (pe && citation.indexOf("\n/") !== -1) { citation += ". - "; }
                if (pe) { citation += pe.getElement("mods:placeTerm").text; }

                const di = oi.getElementWithAttribute("mods:dateIssued", { encoding: "w3cdtf" });
                if (di && (citation.indexOf("\n/") !== -1 || pe)) { citation += ", "; }
                if (di) { citation += new Date(di.text).getFullYear(); }
            }

            const se = this.mods.getElementWithAttribute("mods:relatedItem", { type: "series" });
            if (se) {
                const sti = se.getElement("mods:titleInfo");
                if (sti) {
                    if (oi && sti && citation.indexOf(",") !== -1) { citation += ". - "; }
                    citation += "IN: ";
                    citation += sti.getElement("mods:nonSort") ? sti.getElement("mods:nonSort").text : "";
                    citation += sti.getElement("mods:title").text;
                    citation += sti.getElement("mods:subTitle") ? " : " + sti.getElement("mods:subTitle").text : "";
                }

                const issn = se.getElementWithAttribute("mods:identifier", { type: "issn" });
                if (sti && issn) { citation += ", "; }
                if (issn) { citation += "ISSN " + issn.text; }

                const isbn = se.getElementWithAttribute("mods:identifier", { type: "isbn" });
                if (sti && isbn) { citation += ", "; }
                if (isbn) { citation += "ISBN " + isbn.text; }

                const pa = se.getElement("mods:part");
                if (pa) {
                    const vol = pa.getElementWithAttribute("mods:detail", { type: "volume" });
                    if (vol && sti) { citation += ", "; }
                    if (vol) { citation += "Bd. " + vol.getElement("mods:number").text; }
                }
            } else {
                const issn = this.mods.getElementWithAttribute("mods:identifier", { type: "issn" });
                if (oi && issn && citation.indexOf(",") !== -1) { citation += ". - "; }
                if (issn) { citation += "ISSN " + issn.text; }

                const isbn = this.mods.getElementWithAttribute("mods:identifier", { type: "isbn" });
                if (oi && isbn && citation.indexOf(",") !== -1) { citation += ". - "; }
                if (isbn) { citation += "ISBN " + isbn.text; }
            }

            this.citation = this.formatCitation(citation);
        }
    }

    identifierByType(type: string, all: boolean = false) {
        return all ? this.identifier.filter((id) => id.type === type) : this.identifier.find((id) => id.type === type);
    }

    altmericEnabledId() {
        return this.identifier.find((id) => id.altmetric && id.altmetric === true);
    }

    selectStyle(event) {
        this.style = event.currentTarget.value;
        window.localStorage.setItem("citationStyle", this.style);
        this.load();
    }

    openModal(content) {
        this.modalService.open(content, { size: "lg" });
        return false;
    }
}
