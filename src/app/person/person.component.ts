import { Component, OnInit, Input, Renderer2, OnChanges, SimpleChanges, SimpleChange } from "@angular/core";

import { of } from "rxjs";
import { map } from "rxjs/operators";

import { PersonApiService } from "./api.service";
import { CacheService } from "../_services/cache.service";
import { ErrorService } from "../_services/error.service";
import { MobileDetectService } from "../_services/mobileDetect.service";
import { SpinnerService } from "../spinner/spinner.service";
import { Transition } from "@uirouter/core";

import { MetadataHelpers } from "../_helpers/metadataHelpers.class";
import { Person } from "./datamodel.def";
import { IdentifierDetails, identifierDetails, SolrDocument, SolrSelectResponse } from "../_datamodels/datamodel.def";

@Component({
  selector: "ui-person",
  templateUrl: "./person.component.html"
})
export class PersonComponent extends MetadataHelpers implements OnInit, OnChanges {

  @Input()
  public person: Person;

  @Input()
  public included = false;

  public loadingDetails = true;

  constructor(public $api: PersonApiService, public mds: MobileDetectService, private renderer: Renderer2) {
    super();
  }

  buildQuery(id: IdentifierDetails | string) {
    if (typeof id === "string") {
      return `mods.pindexname.published:"${encodeURIComponent(id)}"`;
    } else {
      return `mods.nameIdentifier:"${id.prefix + "\:" + id.id}"`;
    }
  }

  thumb(item: SolrDocument) {
    if (item && item["id"]) {
      return this.$api.thumbUrl(item["id"], 75);
    }
    return null;
  }

  thumbLoaded(event: Event) {
    const elm = <Element>event.target;
    this.renderer.removeClass(elm.parentElement, "loading");
  }

  defaultThumb(event: Event, item: SolrDocument) {
    const derId = item["link"] ? item["link"].find((l) => l.indexOf("derivate") !== -1) : null;
    const elm = <Element>event.target;
    const parent = this.renderer.parentNode(elm);
    const ph = this.renderer.createElement("div");

    if (derId) {
      const params = new Map();
      params.set("fl", "id,maindoc");
      params.set("limit", 1);
      params.set("facet", "off");

      this.$api.solrSelect(`id:${derId}`, params).pipe(
        map((res: SolrSelectResponse) => {
          let cls = null;
          if (res.response.numFound === 1) {
            const fExt = this.fileExtension(res.response.docs[0]["maindoc"]);
            if (fExt) {
              cls = `img-${fExt}`;
            }
          }
          return cls;
        })
      ).subscribe(cls => {
        cls = cls || "img-placeholder";
        ph.classList.add(cls);
        this.copyClassList(elm, ph);
        this.renderer.removeClass(elm.parentElement, "loading");
        this.renderer.insertBefore(parent, ph, elm);
        this.renderer.removeChild(parent, elm);
      });
    } else {
      ph.classList.add("img-placeholder");
      this.copyClassList(elm, ph);
      this.renderer.removeClass(elm.parentElement, "loading");
      this.renderer.insertBefore(parent, ph, elm);
      this.renderer.removeChild(parent, elm);
    }

    return null;
  }

  ngOnInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    const person: SimpleChange = changes.person;
    if (person.previousValue) {
      this.person = person.currentValue;
      this.load();
    }
  }

  private load() {
    const id = this.person.id;

    if (id) {
      this.loadingDetails = true;
      const promises = new Array();

      if (!this.person.details) {
        promises.push(this.loadDetails(id).then((details) =>
          this.person.details = details
        ));
      }

      if (!this.person.documents) {
        promises.push(this.loadDocuments(id).then((res) => {
          this.person.documentCount = res.response.numFound;
          this.person.documents = res.response.docs;
        }));
      }
      Promise.all(promises).then(() => this.loadingDetails = false);
    } else if (!this.person.documents) {
      this.loadingDetails = true;
      this.loadDocuments(this.person.name).then((res) => {
        this.person.documentCount = res.response.numFound;
        this.person.documents = res.response.docs;
        this.loadingDetails = false;
      });
    }
  }

  private loadDocuments(id: IdentifierDetails | string) {
    const params = new Map();
    params.set("rows", 5);
    params.set("fq", ["objectType:mods", this.buildQuery(id)]);

    return this.$api.solrSelect("*:*", params).toPromise().then((res: SolrSelectResponse) => res);
  }

  private loadDetails(id: IdentifierDetails) {
    if (id) {
      const idStr = [id.prefix, id.id].join(":");
      return this.$api.lookupPerson(idStr).toPromise().then((details) => details);
    }

    return null;
  }

  private copyClassList(from: Element, to: Element, expect: Array<string> = []) {
    for (let ci = 0; ci < from.classList.length; ci++) {
      const cls = from.classList.item(ci);
      if (expect.length === 0 || expect.indexOf(cls) === -1) {
        to.classList.add(cls);
      }
    }
  }
}

export const personTitleResolver = ($injector, params) => {
  const api = $injector.get(PersonApiService);
  return params.id ? api.lookupPerson(params.id).pipe(
    map((p: any) => {
      if (p.type === "person") {
        return p.familyName + ", " + p.givenName;
      }
      return null;
    })) : of(params.name);
};

export const resolveFnPerson = ($api, $error, $spinner, trans) => {
  const cacheKey = CacheService.buildCacheKey(trans.to().name, trans.params());
  const cache = CacheService.get(cacheKey);

  if (cache) {
    return cache;
  } else {
    $spinner.setLoadingState(trans.options().source !== "url" && trans.from().name !== trans.to().name);

    let promise;

    if (trans.params().id) {
      const id = decodeURIComponent(trans.params().id);
      promise = $api.lookupPerson(id).toPromise().then((p) => {
        if (p.type === "person") {
          return {
            name: p.familyName + ", " + p.givenName,
            id: identifierDetails(id),
            documentCount: 0,
          };
        }

        return null;
      });
    } else {
      const name = decodeURIComponent(trans.params().name);
      const params = new Map();
      params.set("rows", 5);
      params.set("fq", ["objectType:mods", `mods.pindexname.published:"${name}"`]);

      promise = $api.solrSelect("*:*", params).toPromise().then((res: SolrSelectResponse) => ({
        name: name,
        documentCount: res.response.numFound,
        documents: res.response.docs
      }));
    }

    return promise.then((person) => {
      $spinner.setLoadingState(false);

      if (person) {
        CacheService.set(cacheKey, person, 60 * 60 * 1000);
      }

      return person;
    }).catch((err) => {
      $spinner.setLoadingState(true);
      $error.handleError(err);
    });
  }
};

export const PersonStates = {
  name: "persons.person",
  url: "/person?id&name",
  component: PersonComponent,
  data: {
    parentState: "persons",
    breadcrumbLabelResolver: personTitleResolver,
    requiresAuth: false
  },
  params: {
    id: {
      type: "string",
      raw: true
    },
    name: {
      type: "string",
      raw: true
    }
  },
  resolve: [
    {
      token: "person",
      deps: [PersonApiService, ErrorService, SpinnerService, Transition],
      resolveFn: resolveFnPerson
    },
  ],
};
