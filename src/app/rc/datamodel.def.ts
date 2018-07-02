import { MCRObject, SolrDocument } from "../_datamodels/datamodel.def";
import { XmlMappedElement } from "../_providers/transform.provider";

export const AdminRoles = ["admin", "rcadmin"];

export const EditorRoles = ["rceditor"];

export interface Period {
    from: string;
    to: string;
    short: string;
    shortFormated?: string;
    long: string;
    longFormated?: string;
}

export const Periods: Array<Period> = [
    {
        from: "01.10.",
        to: "31.03.",
        short: "WiSe",
        long: "Wintersemester"
    }, {
        from: "01.04.",
        to: "30.09.",
        short: "SoSe",
        long: "Sommersemester"
    }
];

export function dateStringMatch(str: string) {
    const dateFormat = new RegExp("([0-9]{2})\.([0-9]{2})(?:\.([0-9]{4}))?");
    if (dateFormat.test(str)) {
        return str.match(dateFormat);
    }

    return null;
}

export function toDate(day: string | number, month: string | number, year: string | number, endOfDay: boolean = false): Date {
    const d = typeof day === "string" ? parseInt(day, 10) : day;
    const m = typeof month === "string" ? parseInt(month, 10) : month;
    const y = typeof year === "string" ? parseInt(year, 10) : year;

    return endOfDay ? new Date(y, m, d, 23, 59, 59) : new Date(y, m, d, 0, 0, 0);
}

export function matchingPeriod(validTo: string): Period {
    const vm = dateStringMatch(validTo);
    const vd = toDate(vm[1], vm[2], vm[3], true);

    if (vd) {
        for (const p of Periods) {
            const fm = dateStringMatch(p.from);
            const tm = dateStringMatch(p.to);

            if (fm && tm) {
                const fd = toDate(fm[1], fm[2], parseInt(fm[2], 10) > parseInt(tm[2], 10) ? parseInt(vm[3], 10) - 1 : vm[3]);
                const td = toDate(tm[1], tm[2], vm[3], true);

                if (vd.getTime() >= fd.getTime() && vd.getTime() <= td.getTime()) {
                    const np = Object.assign({}, p);
                    if (parseInt(fm[2], 10) > parseInt(tm[2], 10)) {
                        np.shortFormated = [p.short, (parseInt(vm[3], 10) - 1) + "/" + vm[3]].join(" ");
                        np.longFormated = [p.long, (parseInt(vm[3], 10) - 1) + "/" + vm[3]].join(" ");
                    } else {
                        np.shortFormated = [p.short, vm[3]].join(" ");
                        np.longFormated = [p.long, vm[3]].join(" ");
                    }

                    return np;
                }
            }
        }
    }

    return null;
}

export interface Person {
    name: string;
    email?: string;
}

export interface Lecturers {
    lecturer: Array<Person>;
}

export interface Entry {
    id: string;
    modified: string | Date;
    type: string;
}

export interface HeadlineEntry extends Entry {
    headline: string;
}

export interface TextEntry extends Entry {
    format: string;
    text: string;
}

export interface FileEntry extends Entry {
    name: string;
    size: number;
    hash: string;
    copyrighted: boolean;
    comment?: string;
}

export interface WebLinkEntry extends Entry {
    url: string;
    label?: string;
}

export class Slot {
    id: string;
    objectId: string;
    status: string;
    onlineOnly: boolean;
    title: string;
    lecturers: Lecturers;
    contact: Person;
    validTo: string | Date;
    entries: Array<Entry>;

    static parse(obj: MCRObject | SolrDocument): Slot {
        const slot = new Slot();

        if (obj instanceof MCRObject) {
            const elm = obj.getElement("slot", true);

            slot.id = elm.getAttributeValue("id");
            slot.objectId = obj.id;
            slot.status = elm.getAttributeValue("status");
            slot.onlineOnly = Boolean(elm.getAttributeValue("onlineOnly"));
            slot.title = elm.getElement("title").text;
            slot.contact = this.toPersons(elm.getElements("contact"))[0];
            slot.lecturers = {
                lecturer: this.toPersons(elm.getElement("lecturers").getElements("lecturer"))
            };
            slot.validTo = elm.getElement("validTo").text;
            slot.entries = this.toEntries(elm.getElement("entries").getElements("entry"));
        } else {
            slot.id = obj["slotId"];
            slot.objectId = obj["id"];
            slot.status = obj["slot.status"];
            slot.onlineOnly = obj["slot.onlineOnly"];
            slot.title = obj["slot.title"];
            slot.lecturers = {
                lecturer: this.toPersons(obj["slot.lecturer"])
            };
            slot.validTo = obj["slot.validTo"];
        }

        return slot;
    }

    private static toPersons(pelms: Array<XmlMappedElement | string>) {
        const persons: Array<Person> = new Array();

        pelms.forEach((l) => {
            if (typeof l === "string") {
                persons.push({ name: l });
            } else {
                persons.push({
                    name: l.getAttributeValue("name"),
                    email: l.getAttributeValue("email")
                });
            }
        });

        return persons;
    }

    private static toEntries(xmes: Array<XmlMappedElement>) {
        const entries: Array<any> = new Array();

        xmes.forEach((e) => {
            const entry: Entry = {
                id: e.getAttributeValue("id"),
                modified: e.getElementWithAttribute("date", { type: "modified" }).text,
                type: null
            };

            const xe = e.getElement("headline") || e.getElement("text") || e.getElement("file")
                || e.getElement("opcrecord") || e.getElement("webLink");

            if (xe) {
                entry.type = xe.name;

                switch (xe.name) {
                    case "file":
                        const fe: FileEntry = (<FileEntry>entry);
                        fe.name = xe.getAttributeValue("name");
                        fe.size = parseInt(xe.getAttributeValue("size"), 10);
                        fe.copyrighted = Boolean(xe.getAttributeValue("copyrighted"));
                        fe.hash = xe.getAttributeValue("hash");
                        fe.comment = xe.text;
                        break;
                    case "headline":
                        (<HeadlineEntry>entry).headline = xe.text;
                        break;
                    case "text":
                        (<TextEntry>entry).format = xe.getAttributeValue("format");
                        (<TextEntry>entry).text = xe.text;
                        break;
                    case "webLink":
                        (<WebLinkEntry>entry).url = xe.getAttributeValue("url");
                        (<WebLinkEntry>entry).label = xe.text;
                        break;
                    default:
                        console.log(xe.name, xe);
                }
            }

            entries.push(entry);
        });

        return entries;
    }
}

export interface Slots {
    total: number;
    slot: Array<Slot>;
}
