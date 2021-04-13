import {
  Component, OnInit, OnDestroy, Input, EventEmitter, ViewChild,
  ViewChildren, QueryList, ElementRef, Renderer2
} from "@angular/core";

import { Subject } from "rxjs";

import { ErrorService } from "../_services/error.service";
import { ApiService } from "../_services/api.service";
import { MobileDetectService } from "../_services/mobileDetect.service";

import { PDFDocumentProxy } from "ng2-pdf-viewer";

import { ObjectUrlPipe } from "../_pipes/objectUrl.pipe";

import * as CryptoJS from "crypto-js";
import videojs from "video.js";
import * as WaveSurfer from "wavesurfer.js";

import { MCRDerivate, MCRDerivateContent, MCRDerivateContentFile, MediaSources } from "../_datamodels/datamodel.def";
import { fileExtension, FilePath, filePath } from "../_helpers/file.utils";

interface Source {
  src: string;
  type: string;
  label?: string;
}

@Component({
  selector: "ui-preview",
  templateUrl: "./preview.component.html"
})
export class PreviewComponent implements OnInit, OnDestroy {

  public static supportedAudio = ["mp3", "wav"];

  public static supportedImage = ["jpg", "jpeg", "png", "gif", "tif", "tiff"];

  public static supportedVideo = ["3gp", "avi", "f4v", "flv", "mp4", "m4v", "mov", "mkv", "mpeg", "rm", "webm", "wmv"];

  public static supportedText = ["pdf", "ps"];

  public static supportedExtensions = PreviewComponent.supportedAudio.
    concat(PreviewComponent.supportedImage).
    concat(PreviewComponent.supportedText).
    concat(PreviewComponent.supportedVideo);


  @ViewChild("pdfViewer")
  public pdfViewer;

  @ViewChildren("playerElement")
  public playerElm: QueryList<ElementRef>;

  @Input() public selectedDerivate: EventEmitter<MCRDerivate>;

  @Input() public selectedFile: EventEmitter<string>;


  public supportedAudio = PreviewComponent.supportedAudio;

  public supportedImage = PreviewComponent.supportedImage;

  public supportedVideo = PreviewComponent.supportedVideo;

  public supportedText = PreviewComponent.supportedText;

  public loading = false;

  public loadingPercent: number;

  public progress: Subject<number> = new Subject();

  public done = false;

  public previewConfirmed = true;

  public derivate: MCRDerivate;

  public path: string;

  public file: string;

  public mediaSources: MediaSources;

  public mediaThumbs: MediaSources;

  public page = 1;

  public totalPages: number;

  public player: videojs.Player | WaveSurfer;

  private videoPlayerOptions: any = {
    playbackRates: [0.75, 1, 1.25, 1.5],
    controlBar: {
      subsCapsButton: false
    }
  };

  private mainFile: string;

  private content: MCRDerivateContent;

  private changesPlayerElm: any;

  private playerPlugins: Array<any> = [];

  public static isPreviewSupported(fileName: string) {
    const ext = fileExtension(fileName);
    return PreviewComponent.supportedExtensions.indexOf(ext) !== -1;
  }

  constructor(public $api: ApiService, private $error: ErrorService, private renderer: Renderer2, public mds: MobileDetectService) {
    this.previewConfirmed = !this.mds.isPhone();
  }

  isAudioStream() {
    return this.mediaSources && this.mediaSources.source.find((s) => s.type.indexOf("audio") === 0);
  }

  confirmPreview() {
    this.previewConfirmed = true;
    return false;
  }

  fileExtension(fileName: string): string {
    return fileExtension(fileName);
  }

  filePath(path: string): FilePath {
    return filePath(path);
  }

  fileInfo(name?: string): MCRDerivateContentFile {
    name = name || this.file;
    return this.content ? this.content.files.find((f) => f.name === name) : null;
  }

  fileSize(name?: string): number {
    const fi = this.fileInfo(name);
    return fi ? fi.size : -1;
  }

  onPDFLoaded(pdf: PDFDocumentProxy) {
    const parent = this.pdfViewer.nativeElement;
    const maxWidth = parent.querySelector(".card-body").clientWidth + "px" || "800px";
    this.renderer.setStyle(parent.querySelector("pdf-viewer"), "maxWidth", maxWidth);

    this.totalPages = pdf.numPages;
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
    }
  }

  ngOnInit() {
    this.progress.subscribe((percent) => {
      this.loadingPercent = percent;
      this.done = percent === 100;
    });

    this.selectedDerivate.subscribe((derivate) => {
      if (derivate) {
        this.derivate = derivate;
        this.mainFile = (this.derivate instanceof MCRDerivate) &&
          this.derivate.getElementsWithAttribute("internal", "mainfile", true)
            .find((e) => e.getAttributeValue("maindoc") !== null).getAttributeValue("maindoc");

        if (this.mainFile) {
          const fp = this.filePath(this.mainFile);
          this.path = fp.path;
          this.file = fp.file;
        }

        this.load();
        this.loadMediaSources();
      }
    });

    this.selectedFile.subscribe((file) => {
      if (file) {
        if (this.file !== file) {
          const fp = this.filePath(file);
          this.file = fp.file;
          if (this.path !== fp.path) {
            this.path = fp.path;
            this.page = 1;
            this.load();
          }
          this.loadMediaSources();
        }
        this.confirmPreview();
      }
    });
  }

  ngOnDestroy() {
    this.selectedDerivate.unsubscribe();
    this.selectedFile.unsubscribe();

    if (this.player && this.player.dispose) {
      this.player.dispose();
    }
    ObjectUrlPipe.disposeAll();
  }

  private load() {
    this.loading = true;
    return this.$api.derivateContent(this.derivate.objectId, this.derivate.id, this.path)
      .toPromise().then((res: MCRDerivateContent) => {
        this.content = res;
        this.loading = false;
      }).catch((err) => {
        this.loading = false;
        this.$error.handleError(err);
      });
  }

  private mediaSourcesPromise() {
    return new Promise((resolve, reject) => {
      const id = this.buildInternalId();

      this.$api.mediaSources(id).toPromise().then((res: MediaSources) => {
        this.mediaSources = res;
        this.mediaSources.source.
          filter((stream) => stream.src.indexOf("/") === 0).
          forEach((stream) => stream.src = this.$api.mediaProgressivUrl(this.derivate.id, stream.src));
      }).then(() => this.$api.mediaThumbs(id).toPromise()
        .then((res: MediaSources) => this.mediaThumbs = res))
        .then(() => resolve())
        .catch((err) => resolve());
    });
  }

  private loadMediaSources() {
    const ext = fileExtension(this.file);

    if (this.supportedAudio.indexOf(ext) !== -1 || this.supportedVideo.indexOf(ext) !== -1) {
      this.mediaSourcesPromise().then(() => {
        if (!this.mediaSources) {
          if ("mp4|webm".indexOf(ext) !== -1) {
            this.mediaSources = {
              source: [{
                src: this.$api.fileUrl(this.derivate.objectId, this.derivate.id, this.file, this.path),
                type: "video/" + ext
              }]
            };
          } else if (this.supportedAudio.indexOf(ext) !== -1) {
            this.mediaSources = {
              source: [{
                src: this.$api.fileUrl(this.derivate.objectId, this.derivate.id, this.file, this.path),
                type: "audio/" + ext
              }]
            };
          }
        }
      }).then(() => this.initStreamPreview());
    }
  }

  private buildInternalId(): string {
    return CryptoJS.SHA256(this.derivate.id + "_" +
      ((this.path ? this.path + "/" + this.file : this.file) || this.mainFile))
      .toString(CryptoJS.enc.Hex).toUpperCase().replace(new RegExp("^0*"), "");
  }

  private initStreamPreview() {
    if (this.mediaSources) {
      if (!this.player) {
        if (!this.playerElm.dirty && this.playerElm.first) {
          this.initPlayer(this.playerElm.first);
        } else {
          this.changesPlayerElm = this.playerElm.changes.subscribe(() => {
            if (!this.player && this.playerElm.first) {
              this.changesPlayerElm.unsubscribe();
              this.initPlayer(this.playerElm.first);
            }
          });
        }
      } else {
        this.updateStreamSources();
      }
    }
  }

  private initPlayer(elm: ElementRef) {
    if (!this.player && elm) {
      if (!elm.nativeElement.id) {
        throw new Error("Element has no id.");
      }

      if (this.isAudioStream()) {
        this.player = WaveSurfer.create({
          container: "#" + elm.nativeElement.id,
          responsive: true,
          normalize: true,
          waveColor: "#008855",
          progressColor: "#108855",
          barHeight: 4,
          barWidth: 3
        });
        this.player.on("error", (err) => {
          this.$error.handleError(err);
        });
        this.player.on("loading", (p: number) => {
          if (p) {
            this.loadingPercent = p;
            this.done = !(p < 100);
          }
        });
        this.player.on("ready", () => this.done = true);
        this.updateStreamSources();
      } else {
        this.player = videojs(elm.nativeElement.id, this.videoPlayerOptions, () => {
          this.initPosterPreview();
          this.updateStreamSources();
        });
      }
    }
  }

  private updateStreamSources() {
    const sources: Array<Source> = new Array();

    this.mediaSources.source.
      // progressiv download with less prio
      sort((a, b) =>
        a.type === b.type ? 0 :
          (a.type.indexOf("video/") === 0 ? 1 :
            (b.type.indexOf("video/") === 0 ? -1 : 0)))
      .forEach((stream) => sources.push(stream));

    if (this.player) {
      if (this.mediaThumbs && this.mediaThumbs.source.length !== 0) {
        this.player.poster(this.$api.mediaThumbUrl(this.buildInternalId(), this.mediaThumbs.source[0].src));
        this.updatePosterPreview(this.mediaThumbs);
      }

      if (this.isAudioStream()) {
        this.player.load(sources[0].src);
      } else {
        this.player.src(sources);
      }
    }
  }

  private initPosterPreview() {
    let intPoster: number;
    const cmpPoster = this.getComponent("PosterImage");
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

  private preloadImage(url: string, anImageLoadedCallback: () => void): HTMLImageElement {
    const img = new Image();

    img.onload = anImageLoadedCallback;
    img.src = url;

    return img;
  }

  private preloadImages(urls: Array<string>, allImagesLoadedCallback: (images: Array<HTMLImageElement>) => void) {
    const imgs: Array<HTMLImageElement> = [];
    let loadedCounter = 0;
    const toBeLoadedNumber = urls.length;

    urls.forEach((url) => {
      imgs.push(this.preloadImage(url, () => {
        loadedCounter++;
        if (loadedCounter === toBeLoadedNumber) {
          allImagesLoadedCallback(imgs);
        }
      }));
    });
  }

  private updatePosterPreview(sources: MediaSources) {
    const cmpPoster = this.getComponent("PosterImage");
    const elmPoster = cmpPoster.el();

    if (elmPoster) {
      const thumbs = sources.source.map(s => this.$api.mediaThumbUrl(this.buildInternalId(), s.src));
      this.preloadImages(thumbs, (images) => {
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

  private getComponent(name: string): any | null {
    const childs = this.player.children();
    for (const child of childs) {
      if (child && child.name_ && child.name_ === name) {
        return child;
      }
    }
    return null;
  }

}
