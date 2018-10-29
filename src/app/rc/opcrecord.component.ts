import { Component, Input } from "@angular/core";

import { PicaRecord, PicaField, PicaSubfield } from "./datamodel.def";

@Component({
    selector: "ui-rc-opcrecord",
    templateUrl: "./opcrecord.component.html"
})
export class OPCRecordComponent {

    public id: string;

    @Input()
    public record: PicaRecord;

    constructore() {
    }

    public getField(tag: string, occurrence?: string): PicaField {
        return this.record.field && this.record.field.find(f => f.tag === tag && f.occurrence === occurrence);
    }

    public getSubfield(field: PicaField, code: string) {
        const res = field && field.subfield.find(sf => sf.code === code);
        return res && res.value.replace(new RegExp("^@"), "");
    }

}
