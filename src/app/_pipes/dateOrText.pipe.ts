import { Inject, LOCALE_ID, Pipe, PipeTransform } from "@angular/core";
import { DatePipe } from "@angular/common";

@Pipe({
    name: "dateOrText",
    pure: false
})
export class DateOrTextPipe implements PipeTransform {

    constructor( @Inject(LOCALE_ID) private locale: string) { }

    transform(value: any, format = "mediumDate", timezone?: string, locale?: string): string {
        if (typeof value === "string") {
            value = value.trim();

            if (value.length < 8) {
                return value;
            }
        }

        return new DatePipe(this.locale).transform(value, format, timezone, locale);
    }

}
