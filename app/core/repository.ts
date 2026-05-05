import {EntryRepository} from "~/entry/entry.api";
import type {IEntryRepository} from "~/entry/entry.types";
import type {ITemplateRepository} from "~/template/template.types";
import {TemplateRepository} from "~/template/template.api";

type Operations = {
    entry: IEntryRepository
    template: ITemplateRepository
}

export const Repository: Operations = {
    entry: EntryRepository(),
    template: TemplateRepository()
}
