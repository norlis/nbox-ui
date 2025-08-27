import {EntryRepository} from "~/adapters/entry-repository";
import {IEntryRepository, ITemplateRepository} from "~/domain/operations";
import {TemplateRepository} from "~/adapters/template-repository";

type Operations = {
    entry: IEntryRepository
    template: ITemplateRepository
}

export const Repository: Operations = {
    entry: EntryRepository(),
    template: TemplateRepository()
}