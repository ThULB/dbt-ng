import { MCRObject, SolrDocument } from "../_datamodels/datamodel.def";
import { XmlMappedElement } from "../_providers/transform.provider";

export enum Permission {
    Admin = "administrate-slot",
    Edit = "edit-slot",
    Create = "create-slot",

    // generic Object permissions
    Write = "writedb",
    Read = "read"
}

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

export interface PicaRecord {
    ppn: string;
    field: Array<PicaField>;
}

export interface PicaField {
    tag: string;
    occurrence?: string;
    subfield: Array<PicaSubfield>;
}

export interface PicaSubfield {
    code: string;
    value: string;
}

export const EntryTypes = ["headline", "text", "file", "mcrobject", "opcrecord", "webLink"];

export interface Person {
    name: string;
    email?: string;
}

export interface Lecturers {
    lecturer: Array<Person>;
}

export interface Attendee extends Person {
    uid?: string;
    owner?: boolean;
    readKey?: boolean;
    writeKey?: boolean;
}

export interface Attendees {
    slotId: string;
    attendee: Array<Attendee>;
}

export interface Entries {
    entry: Array<Entry>;
}

export interface Entry {
    id: string;
    modified: string | Date;
    type: string;

    headline?: string;
    file?: FileEntry;
    text?: TextEntry;
    mcrobject?: MCRObject;
    opcrecord?: OPCRecordEntry;
    webLink?: WebLinkEntry;
}

export interface FileEntry {
    name: string;
    size: number;
    hash: string;
    copyrighted: boolean;
    comment?: string;
}

export interface MCRObject {
    id: string;
    value?: string;
}

export interface OPCRecordEntry {
    epn?: string;
    record: PicaRecord;
    comment?: string;
    deleted?: boolean;
}

export interface TextEntry {
    format: string;
    value: string;
}

export interface WebLinkEntry {
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
    entries: Entries;
}

export interface Slots {
    total: number;
    slot: Array<Slot>;
}
