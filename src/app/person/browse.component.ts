import { Component, OnInit, Input, Renderer2 } from "@angular/core";

import { PersonApiService } from "./api.service";
import { CacheService } from "../_services/cache.service";
import { ErrorService } from "../_services/error.service";
import { MobileDetectService } from "../_services/mobileDetect.service";
import { SpinnerService } from "../spinner/spinner.service";
import { StateService, Transition, UIRouterGlobals } from "@uirouter/core";

import { MetadataHelpers } from "../_helpers/metadataHelpers.class";
import { PersonDetails, personDetails, SolrDocument, SolrTermsResponse } from "../_datamodels/datamodel.def";

interface Person extends PersonDetails {
  documentCount: number;
  details?: any;
  documents?: Array<SolrDocument>;
}

@Component({
  selector: "ui-persons",
  templateUrl: "./browse.component.html"
})
export class PersonBrowseComponent extends MetadataHelpers implements OnInit {

  @Input()
  public persons: Array<Person>;


  public terms = {
    A: "[a|ä|Ä].*",
    B: "b.*",
    C: "c.*",
    D: "d.*",
    E: "e.*",
    F: "f.*",
    G: "g.*",
    H: "h.*",
    I: "i.*",
    J: "j.*",
    K: "k.*",
    L: "l.*",
    M: "m.*",
    N: "n.*",
    O: "[o|ö|Ö].*",
    P: "p.*",
    Q: "q.*",
    R: "r.*",
    S: "s.*",
    T: "t.*",
    U: "[u|ü|Ü].*",
    V: "v.*",
    W: "w.*",
    X: "x.*",
    Y: "y.*",
    Z: "z.*"
  };

  public term: string;

  public filter: string;

  public filteredPersons: Array<Person>;

  public page = 1;

  public rows = 20;

  public start = 0;

  public end = this.rows;

  public selectedIndex = 0;

  public selectedPerson: Person;

  public target: string;

  constructor(public $api: PersonApiService, private $state: StateService, public mds: MobileDetectService,
    private renderer: Renderer2, private globals: UIRouterGlobals) {
    super();
    this.term = this.globals.params.term;
    this.filter = this.globals.params.filter ? decodeURIComponent(this.globals.params.filter) : this.globals.params.filter;
    this.page = this.globals.params.page || 1;
    this.rows = this.globals.params.rows || 20;

    this.start = ((this.page - 1) * this.rows) || 0;
    this.end = this.page * this.rows;

    this.selectedIndex = this.globals.params.selectedIndex || this.start;

    this.renderer.listen("window", "resize", () => { this.target = window.innerWidth <= 800 ? "new" : this.target; });
  }

  trackByIdx(index: number, obj: any): any {
    return (this.start || 0) + index;
  }

  pageChange(page: number) {
    this.page = page;
    this.start = ((this.page - 1) * this.rows) || 0;
    this.end = (this.page * this.rows) || 20;
    this.selectedIndex = this.start;
    this.transitionTo();
  }

  changeFilter(evt) {
    if (evt.key.toLowerCase() === "enter") {
      this.page = 1;
      this.start = ((this.page - 1) * this.rows) || 0;
      this.end = (this.page * this.rows) || 20;
      this.filteredPersons = this.filter ?
        this.persons.filter(p => p.name.toLowerCase().indexOf(this.filter.toLowerCase()) !== -1) :
        this.persons;
      this.selectedIndex = this.start;
      this.transitionTo();
    }
  }

  ngOnInit() {
    this.target = window.innerWidth <= 800 ? "new" : this.target;
    this.filteredPersons = this.filter ?
      this.persons.filter(p => p.name.toLowerCase().indexOf(this.filter.toLowerCase()) !== -1) :
      this.persons;
  }

  private transitionTo() {
    return this.$state.transitionTo(this.globals.$current.name, {
      term: this.term,
      filter: this.filter,
      selectedIndex: this.selectedIndex,
      page: this.page,
      rows: this.rows
    }, { reload: false });
  }

}

export const resolveFnPersons = ($api, $error, $spinner, trans) => {
  const cacheKey = CacheService.buildCacheKey(trans.to().name, trans.params().term);
  const cache = CacheService.get(cacheKey);

  if (cache) {
    return cache;
  } else {
    $spinner.setLoadingState(trans.options().source !== "url" && trans.from().name !== trans.to().name);

    const params = new Map();
    params.set("terms.regex", trans.params().term);

    return $api.solr("personindexp", "*", params)
      .toPromise().then((res: SolrTermsResponse) => {
        $spinner.setLoadingState(false);

        const persons = new Array<Person>();
        const pt = res.terms["mods.pindexname.published"];

        for (let i = 0; i < pt.length; i += 2) {
          persons.push(Object.assign(personDetails(pt[i]), { documentCount: parseInt(pt[i + 1], 10) }));
        }

        CacheService.set(cacheKey, persons, 60 * 60 * 1000);
        return persons;
      }).catch((err) => {
        $spinner.setLoadingState(true);
        $error.handleError(err);
      });
  }
};

export const PersonBrowseStates = {
  name: "persons",
  url: "/persons?term&filter&selectedIndex&page&rows",
  component: PersonBrowseComponent,
  data: {
    parentState: "home",
    breadcrumb: "persons.breadcrumb",
    requiresAuth: false
  },
  params: {
    term: {
      type: "string",
      value: "[a|ä|Ä].*",
      raw: true,
      squash: true
    },
    filter: {
      type: "string",
      raw: true,
      squash: true
    },
    selectedIndex: {
      type: "int",
      value: 0,
      squash: true
    },
    page: {
      type: "int",
      value: 1
    },
    rows: {
      type: "int",
      value: 20,
      squash: true
    }
  },
  resolve: [
    {
      token: "persons",
      deps: [PersonApiService, ErrorService, SpinnerService, Transition],
      resolveFn: resolveFnPersons
    },
  ],
};
