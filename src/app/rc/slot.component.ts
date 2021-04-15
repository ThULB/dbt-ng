/* eslint-disable @typescript-eslint/ban-types */
import { Component, Input, AfterViewInit, OnInit, Renderer2, ViewChild, ViewChildren, OnDestroy, ElementRef, QueryList } from "@angular/core";
import { DomSanitizer, SafeHtml, SafeUrl } from "@angular/platform-browser";

import { Observable } from "rxjs";

import * as CryptoJS from "crypto-js";
import videojs from "video.js";

import { AuthService } from "../_services/auth.service";
import { ErrorService } from "../_services/error.service";
import { RCApiService } from "./api.service";
import { SpinnerService } from "../spinner/spinner.service";
import { StateService, Transition, UIRouterGlobals } from "@uirouter/core";

import { preloadImages } from "../_helpers/image.utils";

import { MediaSources, Source } from "../_datamodels/datamodel.def";
import { Slot, Entry, EntryTypes, AdminRoles, EditorRoles } from "./datamodel.def";

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

  @ViewChildren("playerElement")
  private playerElm: QueryList<ElementRef>;

  public id: string;

  public toc: any;

  public groups: any;

  public player: Map<string, videojs.Player> = new Map();

  public mediaSources: Map<string, MediaSources> = new Map();

  public mediaThumbs: Map<string, MediaSources> = new Map();

  private videoPlayerOptions: any = {
    playbackRates: [0.75, 1, 1.25, 1.5],
    controlBar: {
      subsCapsButton: false
    }
  };

  private downloads: Map<string, any> = new Map();

  private streamingSupported: Map<string, Observable<boolean>> = new Map();

  private changesPlayerElm: Map<string, any>;

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

  isStreamingSupported(entry: Entry) {
    if (!this.streamingSupported.get(entry.id)) {
      this.streamingSupported.set(entry.id, this.$api.isStreamingSupported(this.id, entry.id));
    }

    return this.streamingSupported.get(entry.id);
  }

  ngOnInit() {
    this.groups = this.groupEntries();
    this.toc = this.tocEntries();

    if (this.slot.entries && this.slot.entries.entry) {
      this.slot.entries.entry
        .filter(e => e.type === "file")
        .forEach(e =>
          this.isStreamingSupported(e).toPromise()
            .then(sup => sup && this.loadMediaSources(e))
        );
    }
  }

  ngOnDestroy() {
    this.downloads.forEach((o) => o = undefined);
    this.player.forEach(p => p.dispose());
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

  private buildInternalId(entry: Entry): string {
    return CryptoJS.SHA256(this.id + "_" + entry.id + "_" + entry.file.name).toString(CryptoJS.enc.Hex).toUpperCase().replace(new RegExp("^0*"), "");
  }

  private mediaSourcesPromise(entry: Entry) {
    return new Promise((resolve, reject) => {
      const id = this.buildInternalId(entry);

      this.$api.mediaSources(id).toPromise().then((res: MediaSources) => {
        this.mediaSources.set(entry.id, res);
      }).then(() => this.$api.mediaThumbs(id).toPromise()
        .then((res: MediaSources) => this.mediaThumbs.set(entry.id, res)))
        .then(() => resolve(null))
        .catch((err) => reject(err));
    });
  }

  private loadMediaSources(entry: Entry) {
    if (!this.mediaSources.get(entry.id)) {
      this.mediaSourcesPromise(entry).then(() => this.initStreamPreview(entry));
    }

    return this.mediaSources.get(entry.id);
  }

  private initStreamPreview(entry: Entry) {
    if (this.mediaSources.get(entry.id)) {
      if (!this.player.get(entry.id)) {
        const pelm = this.playerElm.find(pe => pe.nativeElement.id === "player-" + entry.id);

        if (!this.playerElm.dirty && pelm) {
          this.initPlayer(entry, pelm);
        } else {
          this.changesPlayerElm.set(entry.id, this.playerElm.changes.subscribe(() => {
            if (!this.player && pelm) {
              this.changesPlayerElm.get(entry.id).unsubscribe();
              this.initPlayer(entry, pelm);
            }
          }));
        }
      } else {
        this.updateStreamSources(entry);
      }
    }
  }

  private initPlayer(entry: Entry, elm: ElementRef) {
    if (!this.player.get(entry.id) && elm) {
      if (!elm.nativeElement.id) {
        throw new Error("Element has no id.");
      }

      this.player.set(entry.id, videojs(elm.nativeElement.id, this.videoPlayerOptions, () => {
        this.initPosterPreview(entry);
        this.updateStreamSources(entry);
      }));
    }
  }

  private updateStreamSources(entry: Entry) {
    const sources: Array<Source> = new Array();

    this.mediaSources.get(entry.id).source.
      // progressiv download with less prio
      sort((a, b) =>
        a.type === b.type ? 0 :
          (a.type.indexOf("video/") === 0 ? 1 :
            (b.type.indexOf("video/") === 0 ? -1 : 0)))
      .forEach((stream) => sources.push(stream));

    if (this.player) {
      if (this.mediaThumbs.get(entry.id) && this.mediaThumbs.get(entry.id).source.length !== 0) {
        this.player.get(entry.id).poster(this.$api.mediaThumbUrl(this.buildInternalId(entry), this.mediaThumbs.get(entry.id).source[0].src));
        this.updatePosterPreview(entry, this.mediaThumbs.get(entry.id));
      }

      this.player.get(entry.id).src(sources);
    }
  }

  private initPosterPreview(entry: Entry) {
    let intPoster: number;
    const cmpPoster = this.getComponent(entry, "PosterImage");
    const elmPoster = cmpPoster.el();

    if (elmPoster) {
      elmPoster.addEventListener("mouseover", () => {
        intPoster = window.setInterval(() => {
          const posters = elmPoster.children.length;
          const i = parseInt(elmPoster.getAttribute("data-thumb-index"), 10) || 0;
          const prevI = i === 0 ? posters - 1 : i - 1;

          if (elmPoster.style.backgroundImage) {
            elmPoster.style.backgroundImage = "";
          }
          elmPoster.children[prevI].style.display = "none";
          elmPoster.children[i].style.display = "inline-block";

          elmPoster.setAttribute("data-thumb-index", i < posters - 1 ? i + 1 : 0);
        }, 1000);
      });
      elmPoster.addEventListener("mouseout", () => {
        if (intPoster) {
          window.clearInterval(intPoster);
        }
      });
    }
  }

  private updatePosterPreview(entry: Entry, sources: MediaSources) {
    const cmpPoster = this.getComponent(entry, "PosterImage");
    const elmPoster = cmpPoster.el();

    if (elmPoster) {
      const thumbs = sources.source.map(s => this.$api.mediaThumbUrl(this.buildInternalId(entry), s.src));
      preloadImages(thumbs, (images) => {
        const thumbImg: Array<HTMLImageElement> = images;

        let child = elmPoster.lastElementChild;
        while (child) {
          elmPoster.removeChild(child);
          child = elmPoster.lastElementChild;
        }

        thumbImg.forEach((img) => {
          img.style.display = "none";
          elmPoster.appendChild(img);
        });
      });
    }
  }

  private getComponent(entry: Entry, name: string): any | null {
    const childs = this.player.get(entry.id).children();
    for (const child of childs) {
      if (child && child.name && child.name() === name) {
        return child;
      }
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
