/* eslint-disable @typescript-eslint/ban-types */
import { Injectable } from "@angular/core";
import * as xml2js from "xml2js";

export interface XmlMappedAttribute {
  name: string;
  value?: string;
}

export class XmlMappedElement {

  name: string;
  text: string;
  attributes: Array<XmlMappedAttribute> = [];
  children: Array<XmlMappedElement> = [];

  constructor(obj: any, name?: string) {
    if (!obj) {
      if (!name) {
        throw new Error("Name was empty.");
      }
      this.name = name;
    } else if (obj instanceof XmlMappedElement) {
      this.name = obj.name;
      this.text = obj.text;
      this.attributes = obj.attributes;
      this.children = obj.children;
    } else if (typeof obj === "string") {
      if (!name) {
        throw new Error("Name was empty.");
      }

      this.name = name;
      this.text = obj;
    } else if (typeof obj === "object") {
      const ok = Object.keys(obj);

      this.name = name || (ok.length === 1 ? ok[0] : null);

      if (!this.name && ok.length === 1) {
        throw new Error("Name was empty.");
      }

      const self = ok.length === 1 && obj[this.name] ? obj[this.name] : obj;
      this.text = (typeof self === "string" ? self :
        self && self["_"] ? self["_"] : null) || null;

      if (self && self["$"]) {
        const attribs = self["$"];
        for (const ak in attribs) {
          if (typeof ak === "string") {
            this.attributes.push({ name: ak, value: attribs[ak] });
          }
        }
      }

      Object.keys(self).filter((k) => "$" !== k && "_" !== k).forEach((k) => {
        if (self[k] instanceof Array) {
          self[k].forEach((o) => this.children.push(new XmlMappedElement(o, k)));
        } else {
          this.children.push(new XmlMappedElement(self[k], k));
        }
      });
    }
  }

  getAttribute(name: string): XmlMappedAttribute {
    const attr = this.attributes.filter((a) => a.name === name);
    return attr ? attr[0] : null;
  }

  getAttributeValue(name: string): string {
    const attr = this.getAttribute(name);
    return attr ? attr.value : null;
  }

  getElements(name: string, traversal: boolean = false): Array<XmlMappedElement> {
    if (!traversal) {
      return this.children.filter((c) => c.name === name);
    }

    let res = this.children.filter((c) => c.name === name);
    this.children.forEach((c) => res = res.concat(c.getElements(name, traversal)));
    return res;
  }

  getElementsWithAttribute(name: string, attrib: string | Array<string> | Object, traversal: boolean = false): Array<XmlMappedElement> {
    const elms = this.getElements(name, traversal);
    if (typeof attrib === "string") {
      return elms.filter((e) => e.getAttribute(attrib) !== null);
    } else if (attrib instanceof Array) {
      return elms.filter((e) => attrib.filter((k) => e.getAttribute(k) !== null).length !== 0);
    } else if (typeof attrib === "object") {
      const keys = Object.keys(attrib);
      return elms.filter((e) => keys.filter((k) => {
        const a = e.getAttribute(k);
        return a != null && a.value === attrib[k];
      }).length !== 0);
    }

    return null;
  }

  getElement(name: string, traversal: boolean = false): XmlMappedElement {
    const elms = this.getElements(name, traversal);
    return elms.length !== 0 ? elms[0] : null;
  }

  getElementWithAttribute(name: string, attrib: string | Array<string> | Object, traversal: boolean = false): XmlMappedElement {
    const elms = this.getElementsWithAttribute(name, attrib, traversal);
    return elms.length !== 0 ? elms[0] : null;
  }
}

@Injectable()
export class TransformProvider {

  public convertToJson(data: string): Object {
    let res: any;

    xml2js.parseString(data, { explicitArray: false }, (error, result) => {
      if (error) {
        throw error;
      } else {
        res = result;
      }
    });

    return res;
  }


  public convertToXml(rootObject: Object) {
    return new xml2js.Builder().buildObject(rootObject);
  }

}
