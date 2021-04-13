/* eslint-disable @typescript-eslint/ban-types */
import { Component, Input, AfterViewInit, OnInit, Renderer2, ViewChild, OnDestroy, ElementRef } from "@angular/core";
import { DomSanitizer, SafeHtml, SafeUrl } from "@angular/platform-browser";

import { Observable } from "rxjs";

import { AuthService } from "../_services/auth.service";
import { CacheService } from "../_services/cache.service";
import { ErrorService } from "../_services/error.service";
import { RCApiService } from "./api.service";
import { SpinnerService } from "../spinner/spinner.service";
import { StateService, Transition, UIRouterGlobals } from "@uirouter/core";

import { MCRObject, SolrSelectResponse } from "../_datamodels/datamodel.def";
import { Slot, Entry, EntryTypes, AdminRoles, EditorRoles, Permission } from "./datamodel.def";

@Component({
  selector: "ui-rc-slot",
  templateUrl: "./slot.component.html"
})
export class SlotComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input()
  public isAdmin: boolean;

  @Input()
  public isEditor: boolean;

  @Input()
  public isEditAllow: boolean;

  @Input()
  public slot: Slot;

  @ViewChild("slotToc")
  private slotToc: ElementRef;


  public id: string;

  public toc;

  public groups;

  private downloads: Map<string, any> = new Map();

  constructor(public $api: RCApiService, public $auth: AuthService, private $state: StateService,
    private renderer: Renderer2, public sanitizer: DomSanitizer, private globals: UIRouterGlobals) {
    this.id = this.globals.params.id;
  }

  shouldDisplayed(entry: Entry): boolean {
    if (entry.type === "headline" ||
      entry.type === "opcrecord" &&
      !this.slot.onlineOnly && !entry.opcrecord.epn && !(this.isAdmin || this.isEditor || this.isEditAllow)) {
      return false;
    }

    return true;
  }

  quote(str: string): string {
    return str ? "\"" + str + "\"" : str;
  }

  download(event, entry: Entry) {
    if (!this.downloads.has(entry.id)) {
      this.downloads.set(entry.id, this.$api.createObjectUrl(this.$api.fileEntryUrl(this.id, entry.id)));

      this.downloads.get(entry.id).subscribe(ou => {
        this.renderer.setAttribute(event.target, "download", entry.file.name || ou.filename);
        this.renderer.setAttribute(event.target, "href", ou.url);
        event.target.click();
      });
    }
  }

  ngOnInit() {
    this.groups = this.groupEntries();
    this.toc = this.tocEntries();
  }

  ngOnDestroy() {
    this.downloads.forEach((o) => o = undefined);
  }

  ngAfterViewInit() {
    this.makeTocSticky();
    this.renderer.listen("window", "orientationchange", () => this.makeTocSticky());
    this.renderer.listen("window", "resize", () => this.makeTocSticky());
  }

  private makeTocSticky() {
    const elm: HTMLElement = this.slotToc && this.slotToc.nativeElement;
    if (elm) {
      const container = document.getElementById("container-main");
      const tocOffset = container.offsetTop + 10;

      if (elm.offsetHeight < (window.innerHeight - tocOffset)) {
        this.renderer.addClass(elm, "sticky-top");
        this.renderer.setStyle(elm, "top", tocOffset + "px");
      } else {
        this.renderer.removeClass(elm, "sticky-top");
        this.renderer.removeStyle(elm, "top");
      }
    }
  }

  private groupEntries() {
    if (this.slot.entries && this.slot.entries.entry) {
      const groups = new Array();

      let group;
      this.slot.entries.entry.forEach((e) => {
        if (e.type === "headline") {
          if (group) {
            groups.push(group);
          }

          group = new Array();
          group.push(e);
        } else {
          if (!group) {
            group = new Array();
          }
          group.push(e);
        }
      });

      if (group) {
        groups.push(group);
      }

      return groups;
    }

    return null;
  }

  private tocEntries() {
    if (this.slot.entries && this.slot.entries.entry) {
      const toc = new Array();

      this.slot.entries.entry.forEach((e) => {
        if (e.type === "headline") {
          toc.push(e);
        }
      });

      return toc;
    }

    return null;
  }

}

export const resolveFnIsAdmin = ($api: RCApiService, $auth: AuthService) => AdminRoles.find((r) => $auth.hasRole(r)) !== undefined;

export const resolveFnIsEditor = ($api: RCApiService, $auth: AuthService) => EditorRoles.find((r) => $auth.hasRole(r)) !== undefined;

export const resolveFnIsEditAllow = ($api: RCApiService, $auth: AuthService, trans: Transition) => $auth.isLoggedIn() ?
  $api.permission("writedb", trans.params().id).toPromise().then(allowed => allowed) : false;

export const resolveFnSlot = ($api: RCApiService, $error: ErrorService, $spinner: SpinnerService, trans: Transition) => {
  $spinner.setLoadingState(trans.options().source !== "url" && trans.from().name !== trans.to().name);

  return $api.slot(trans.params().id).toPromise().then((res: any) => {
    if (res.slot.entries && (res.slot.entries.entry)) {
      res.slot.entries.entry.forEach(e => {
        e.type = EntryTypes.find(et => (<Object>e).hasOwnProperty(et));
      });
    }

    $spinner.setLoadingState(false);
    return res.slot;
  }).catch((err: any) => {
    $spinner.setLoadingState(false);
    $error.handleError(err);
  });
};

export const SlotStates = {
  name: "rc.slot",
  url: "/:id",
  component: SlotComponent,
  data: {
    breadcrumb: "rc.slot.breadcrumb",
    parentState: "rc",
    requiresAuth: false,
    handlesAuth: true
  },
  params: { id: null },
  resolve: [
    {
      token: "isAdmin",
      deps: [RCApiService, AuthService],
      resolveFn: resolveFnIsAdmin
    },
    {
      token: "isEditor",
      deps: [RCApiService, AuthService],
      resolveFn: resolveFnIsEditor
    },
    {
      token: "isEditAllow",
      deps: [RCApiService, AuthService, Transition],
      resolveFn: resolveFnIsEditAllow
    },
    {
      token: "slot",
      deps: [RCApiService, ErrorService, SpinnerService, Transition],
      resolveFn: resolveFnSlot
    },
  ]
};

